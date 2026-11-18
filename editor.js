/* Extracted from MonaStudio's CenterCanvas / FloatingRightStylePanel.
 * Framework-independent DOM controller. Imported scripts are never retained.
 */
import { ImageTransformControls } from './image-transform.js';
const EDITOR_ID = 'data-mona-id';
const EDITOR_NODE = 'data-mona-runtime';
const SKIP = 'script,style,link,meta,title,br,source,base';
const STYLE_KEYS = ['font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'color', 'background-color', 'width', 'height', 'border-radius', 'opacity', 'padding', 'margin', 'object-fit', 'object-position'];

export class HtmlVisualEditor extends EventTarget {
  constructor(iframe, { purifier = window.DOMPurify, renderer = window.html2canvas } = {}) {
    super();
    this.iframe = iframe;
    this.purifier = purifier;
    this.renderer = renderer;
    this.history = [];
    this.index = -1;
    this.originals = new Map();
    this.counter = 0;
    this.width = 768;
    this.preview = false;
    this.ready = false;
    this.selected = null;
    this.imageControls = new ImageTransformControls(this);
  }

  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }

  async load(html, { resetHistory = false, baseURL, internal = false } = {}) {
    this.imageControls.hide();
    this.flush();
    this.ready = false;
    this.selected = null;
    this.emit('selection', null);
    this.observer?.disconnect();
    const parsed = new DOMParser().parseFromString(String(html), 'text/html');
    // Plain HTML should retain browser defaults. Only enable Tailwind when
    // the document references it or contains recognizable utility classes.
    const needsTailwind = !!parsed.querySelector('[data-mona-tailwind],script[src*="tailwind"]') ||
      Array.from(parsed.querySelectorAll('[class]')).some(el => Array.from(el.classList).some(name =>
        /^(?:(?:[\w-]+|\[[^\]]+\]):)*(?:(?:text|bg|p[trblxy]?|m[trblxy]?|w|h|min-w|max-w|min-h|max-h|gap|space-[xy]|grid-cols|col-span|row-span|items|justify|rounded|border|font|leading|tracking|shadow|opacity|translate-[xy]|rotate|scale|z|top|left|right|bottom|inset|overflow|object|aspect|flex|basis|grow|shrink)-|flex$|grid$|hidden$|block$|inline$|inline-block$|absolute$|relative$|fixed$|sticky$)/.test(name)));
    const originalBase = parsed.querySelector('base')?.getAttribute('href');
    parsed.querySelectorAll('script,iframe,object,embed,base,meta[http-equiv]').forEach(el => el.remove());
    parsed.querySelectorAll(`[${EDITOR_NODE}], [data-mona-tailwind]`).forEach(el => el.remove());
    parsed.querySelectorAll('*').forEach(el => {
      for (const attribute of Array.from(el.attributes)) {
        if (attribute.name.startsWith('data-mona-') && !(internal && attribute.name === EDITOR_ID)) el.removeAttribute(attribute.name);
      }
    });
    const sanitized = this.purifier.sanitize(parsed.documentElement.outerHTML, {
      WHOLE_DOCUMENT: true,
      ADD_TAGS: ['link'],
      ADD_ATTR: ['rel', 'href'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base'],
      FORBID_ATTR: ['srcdoc', 'autofocus', 'contenteditable'],
    });
    const doc = new DOMParser().parseFromString(sanitized, 'text/html');
    // A link may load styles, but must not preload scripts or navigate the frame.
    doc.querySelectorAll('link').forEach(el => { if (el.rel !== 'stylesheet') el.remove(); });
    const nonce = crypto.randomUUID().replaceAll('-', '');
    const policy = doc.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    policy.content = `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline' http: https: data:; img-src http: https: data: blob:; font-src http: https: data:; media-src http: https: data: blob:; connect-src 'none'; base-uri http: https:; form-action 'none'`;
    policy.setAttribute(EDITOR_NODE, '');
    doc.head.prepend(policy);
    const base = baseURL === undefined ? originalBase : baseURL;
    if (base && /^https?:\/\//i.test(base)) {
      const element = doc.createElement('base');
      element.href = base;
      doc.head.append(element);
    }
    const defaultStyle = doc.createElement('style');
    defaultStyle.setAttribute(EDITOR_NODE, '');
    defaultStyle.textContent = 'html{min-height:100%;}body{min-height:120px}';
    doc.head.append(defaultStyle);
    const selectionStyle = doc.createElement('style');
    selectionStyle.setAttribute(EDITOR_NODE, '');
    selectionStyle.textContent = 'html:not([data-mona-preview]) [data-mona-id]{cursor:default}html:not([data-mona-preview]) [data-mona-hover]{outline:1px solid #94b2ff!important;outline-offset:-1px!important}html:not([data-mona-preview]) [data-mona-selected]{outline:2px solid #316af4!important;outline-offset:-2px!important}';
    doc.head.append(selectionStyle);
    const token = crypto.randomUUID();
    doc.documentElement.setAttribute('data-mona-load', token);
    const tailwind = doc.createElement('script');
    tailwind.src = new URL('./vendor/tailwindcss-3.4.17.js', import.meta.url).href;
    tailwind.setAttribute('nonce', nonce);
    tailwind.setAttribute(EDITOR_NODE, '');
    // Observe only styles created by the bundled Tailwind runtime, so its compiled
    // CSS can be included in an exported standalone HTML file.
    const bootstrap = doc.createElement('script');
    bootstrap.setAttribute('nonce', nonce);
    bootstrap.setAttribute(EDITOR_NODE, '');
    bootstrap.textContent = `new MutationObserver(records => { for (const r of records) for (const n of r.addedNodes) if (n.nodeType === 1 && n.tagName === 'STYLE' && !n.hasAttribute('${EDITOR_NODE}') && !n.hasAttribute('data-mona-tailwind')) { n.setAttribute('data-mona-tailwind',''); const authored = document.head.querySelector('style:not([${EDITOR_NODE}]):not([data-mona-tailwind])'); if(authored) document.head.insertBefore(n, authored); } }).observe(document.head,{childList:true});`;
    if (needsTailwind) doc.head.append(bootstrap, tailwind);
    if (resetHistory) { this.history = []; this.index = -1; this.originals.clear(); }
    await new Promise(resolve => {
      this.iframe.onload = () => {
        if (this.iframe.contentDocument?.documentElement.getAttribute('data-mona-load') !== token) return;
        resolve();
      };
      this.iframe.srcdoc = '<!doctype html>\n' + doc.documentElement.outerHTML;
    });
    this.doc = this.iframe.contentDocument;
    this.ready = true;
    this.registerElements();
    this.bindEvents();
    this.setPreview(this.preview);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.doc.body);
    this.resize();
    if (!internal) this.commit();
    this.emit('load', { baseURL: base || '' });
    this.emitHistory();
  }

  registerElements() {
    this.doc.body.querySelectorAll('*').forEach(el => {
      if (el.matches(SKIP) || el.closest('svg') || el.hasAttribute(EDITOR_NODE)) return;
      let id = el.getAttribute(EDITOR_ID);
      if (!id || !this.originals.has(id)) {
        id = `node-${++this.counter}`;
        el.setAttribute(EDITOR_ID, id);
        this.originals.set(id, { style: el.getAttribute('style'), src: el.getAttribute('src'), srcset: el.getAttribute('srcset') });
      }
    });
  }

  bindEvents() {
    const body = this.doc.body;
    body.addEventListener('mouseover', event => {
      this.doc.querySelectorAll('[data-mona-hover]').forEach(el => el.removeAttribute('data-mona-hover'));
      if (!this.preview) event.target.closest(`[${EDITOR_ID}]`)?.setAttribute('data-mona-hover', '');
    });
    body.addEventListener('mouseout', event => event.target.closest(`[${EDITOR_ID}]`)?.removeAttribute('data-mona-hover'));
    body.addEventListener('click', event => {
      if (event.target.closest('a,button,input,select,form')) event.preventDefault();
      if (!this.preview) this.select(event.target.closest(`[${EDITOR_ID}]`));
    });
    body.addEventListener('submit', event => event.preventDefault());
    body.addEventListener('dblclick', event => {
      if (this.preview) return;
      const el = event.target.closest(`[${EDITOR_ID}]`);
      if (!el || el.matches('img,video,audio,input,select,textarea,hr')) return;
      this.endTextEdit();
      this.editing = el;
      el.contentEditable = 'true';
      el.focus();
    });
    body.addEventListener('focusout', () => { this.endTextEdit(); this.flush(); });
    body.addEventListener('input', () => {
      this.registerElements();
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.commit(), 400);
    });
    body.addEventListener('paste', event => {
      if (!this.editing) return;
      event.preventDefault();
      const text = event.clipboardData?.getData('text/plain') || '';
      const selection = this.doc.getSelection();
      if (!selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = this.doc.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      this.commit();
    });
    this.doc.addEventListener('keydown', event => this.handleShortcut(event));
  }

  endTextEdit() {
    if (this.editing) this.editing.removeAttribute('contenteditable');
    this.editing = null;
  }

  handleShortcut(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      (event.shiftKey ? this.redo() : this.undo()).catch(error => this.emit('error', error));
    }
    if (event.key === 'Escape') { this.endTextEdit(); this.select(null); }
  }

  resize() {
    // Shrink first so deleting content can reduce the canvas height as well.
    this.iframe.style.height = '120px';
    this.height = Math.max(120, this.doc.body.scrollHeight, this.doc.documentElement.scrollHeight);
    this.iframe.style.height = `${this.height}px`;
    this.emit('resize', { height: this.height });
  }

  getElements() { return Array.from(this.doc?.body.querySelectorAll(`[${EDITOR_ID}]`) || []); }
  find(id) { return this.getElements().find(el => el.getAttribute(EDITOR_ID) === id) || null; }
  select(el) {
    if (!this.ready) return;
    if (typeof el === 'string') el = this.find(el);
    if (el && el.ownerDocument !== this.doc) return;
    if (el !== this.selected) this.imageControls.finish(true);
    this.doc.querySelectorAll('[data-mona-selected]').forEach(node => node.removeAttribute('data-mona-selected'));
    this.selected = el;
    if (el) el.setAttribute('data-mona-selected', '');
    this.emit('selection', this.selection());
    this.imageControls.sync();
  }
  selection() {
    const el = this.selected;
    if (!el?.isConnected) return null;
    const computed = this.iframe.contentWindow.getComputedStyle(el);
    return { id: el.getAttribute(EDITOR_ID), tag: el.tagName.toLowerCase(), text: el.textContent, leaf: el.children.length === 0,
      src: el.getAttribute('src') || '', alt: el.getAttribute('alt') || '', imageScale: this.imageControls.scalePercent(),
      styles: Object.fromEntries(STYLE_KEYS.map(key => [key, el.style.getPropertyValue(key) || computed.getPropertyValue(key)])) };
  }

  mutate(callback) {
    if (!this.ready || !this.selected) return;
    this.flush();
    callback(this.selected);
    this.registerElements();
    this.commit();
    this.select(this.selected?.isConnected ? this.selected : null);
  }
  setStyle(property, value, { transient = false } = {}) {
    if (!STYLE_KEYS.includes(property)) throw new Error('不支持此样式属性');
    if (value && !CSS.supports(property, value)) throw new Error('样式格式无效，例如尺寸可填 24px 或 50%');
    if (transient) {
      if (!this.ready || !this.selected) return;
      this.flush();
      value ? this.selected.style.setProperty(property, value, 'important') : this.selected.style.removeProperty(property);
      this.emit('selection', this.selection());
    } else {
      this.mutate(el => value ? el.style.setProperty(property, value, 'important') : el.style.removeProperty(property));
    }
  }
  setText(text) { this.mutate(el => { if (!el.children.length) el.textContent = text; }); }
  setImage(url) {
    if (!/^(https?:\/\/|data:image\/(png|jpeg|webp|gif|avif);base64,)/i.test(url)) throw new Error('请使用 HTTP(S) 图片地址或上传本地图片');
    this.mutate(el => { if (el.tagName === 'IMG') { el.src = url; el.removeAttribute('srcset'); } });
  }
  setImageAlt(alt) { this.mutate(el => { if (el.tagName === 'IMG') el.alt = alt; }); }
  resetElement() {
    this.mutate(el => {
      const original = this.originals.get(el.getAttribute(EDITOR_ID));
      if (!original) return;
      for (const key of ['style', 'src', 'srcset']) original[key] === null ? el.removeAttribute(key) : el.setAttribute(key, original[key]);
    });
  }
  duplicate() {
    this.mutate(el => {
      const clone = el.cloneNode(true);
      [clone, ...clone.querySelectorAll('*')].forEach(node => {
        node.removeAttribute('id');
        for (const attr of Array.from(node.attributes)) if (attr.name.startsWith('data-mona-')) node.removeAttribute(attr.name);
      });
      el.after(clone);
      this.selected = clone;
    });
  }
  deleteElement() { this.mutate(el => { el.remove(); this.selected = null; }); }
  selectParent() { const parent = this.selected?.parentElement; if (parent?.hasAttribute(EDITOR_ID)) this.select(parent); }
  setPreview(value) {
    this.preview = value;
    if (!this.doc) return;
    this.endTextEdit();
    this.doc.documentElement.toggleAttribute('data-mona-preview', value);
    if (value) this.select(null);
  }

  serialize(internal = false) {
    if (!this.doc) return '';
    const clone = this.doc.documentElement.cloneNode(true);
    clone.querySelectorAll(`script,[${EDITOR_NODE}]`).forEach(el => el.remove());
    [clone, ...clone.querySelectorAll('*')].forEach(el => {
      el.removeAttribute('contenteditable');
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-mona-') && attr.name !== 'data-mona-tailwind' && !(internal && attr.name === EDITOR_ID)) el.removeAttribute(attr.name);
      }
    });
    return '<!doctype html>\n' + clone.outerHTML;
  }
  getHTML() { this.flush(); return this.serialize(); }
  flush() { if (this.timer) { clearTimeout(this.timer); this.timer = null; if (this.ready) this.commit(); } }
  commit() {
    clearTimeout(this.timer); this.timer = null;
    if (!this.ready) return;
    const html = this.serialize(true);
    if (this.history[this.index] === html) return;
    this.history = this.history.slice(0, this.index + 1);
    this.history.push(html);
    if (this.history.length > 60) this.history.shift();
    this.index = this.history.length - 1;
    this.emit('change', { html: this.serialize() });
    this.emitHistory();
  }
  emitHistory() { this.emit('history', { canUndo: this.index > 0, canRedo: this.index < this.history.length - 1 }); }
  async undo() { this.flush(); if (this.ready && this.index > 0) await this.restore(this.index - 1); }
  async redo() { this.flush(); if (this.ready && this.index < this.history.length - 1) await this.restore(this.index + 1); }
  async restore(index) {
    const selectedId = this.selected?.getAttribute(EDITOR_ID);
    this.index = index;
    await this.load(this.history[index], { internal: true });
    this.select(selectedId || null);
    this.emit('change', { html: this.serialize() });
  }

  async exportPNG() {
    this.flush();
    this.endTextEdit();
    if (!this.renderer) throw new Error('图片导出库未加载');
    this.doc.getSelection()?.removeAllRanges();
    await this.doc.fonts.ready;
    await Promise.all(Array.from(this.doc.images).map(img => img.decode().catch(() => {})));
    const failed = Array.from(this.doc.images).filter(img => !img.naturalWidth);
    if (failed.length) throw new Error(`有 ${failed.length} 张图片未加载，请先替换图片或检查资源地址`);
    const scale = Math.min(2, 16000 / this.height, Math.sqrt(32_000_000 / (this.width * this.height)));
    if (scale < 0.25) throw new Error('页面过长，请拆分页面后再导出图片');
    // html2canvas otherwise silently omits remote images without CORS headers.
    await Promise.all(Array.from(this.doc.images).filter(img => /^https?:/.test(img.currentSrc)).map(img => new Promise((resolve, reject) => {
      const probe = new Image(); probe.crossOrigin = 'anonymous';
      const timeout = setTimeout(() => reject(new Error('图片读取超时，请上传本地图片后重试')), 12000);
      probe.onload = () => { clearTimeout(timeout); resolve(); };
      probe.onerror = () => { clearTimeout(timeout); reject(new Error('远程图片不允许跨域导出，请上传本地图片后重试')); };
      probe.src = img.currentSrc;
    })));
    const canvas = await this.renderer(this.doc.body, { useCORS: true, scale, width: this.width, height: this.height, windowWidth: this.width,
      onclone: doc => {
        doc.querySelectorAll('[data-mona-selected],[data-mona-hover]').forEach(el => { el.removeAttribute('data-mona-selected'); el.removeAttribute('data-mona-hover'); });
        // html2canvas 1.4 does not implement object-fit. Use an equivalent
        // background on the snapshot clone, leaving the editable DOM intact.
        doc.querySelectorAll('img').forEach(img => {
          const style = doc.defaultView.getComputedStyle(img);
          if (!['cover', 'contain', 'none', 'scale-down'].includes(style.objectFit)) return;
          const box = doc.createElement('div');
          for (const attr of Array.from(img.attributes)) if (!['src', 'srcset', 'sizes', 'alt', 'width', 'height'].includes(attr.name)) box.setAttribute(attr.name, attr.value);
          const properties = { display: style.display === 'inline' ? 'inline-block' : style.display,
            width: style.width, height: style.height, 'box-sizing': style.boxSizing,
            'background-image': `url(${JSON.stringify(img.currentSrc || img.src)})`,
            'background-repeat': 'no-repeat', 'background-position': style.objectPosition,
            'background-origin': 'content-box', 'background-clip': 'content-box',
            'background-size': style.objectFit === 'none' ? 'auto' : style.objectFit === 'scale-down'
              ? (img.naturalWidth <= img.clientWidth && img.naturalHeight <= img.clientHeight ? 'auto' : 'contain') : style.objectFit };
          for (const [key, value] of Object.entries(properties)) box.style.setProperty(key, value, 'important');
          img.replaceWith(box);
        });
      }, logging: false });
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片导出失败，请尝试缩短页面')), 'image/png'));
  }

  destroy() { this.imageControls.destroy(); clearTimeout(this.timer); this.observer?.disconnect(); this.iframe.onload = null; this.iframe.srcdoc = ''; this.ready = false; }
}
