/* Host-side controls stay outside imported HTML and exported images. */
const labels = { nw: '左上角', n: '上边', ne: '右上角', e: '右边', se: '右下角', s: '下边', sw: '左下角', w: '左边' };
const number = value => parseFloat(value) || 0;

export class ImageTransformControls {
  constructor(editor) {
    this.editor = editor;
    this.host = editor.iframe.ownerDocument;
    this.win = this.host.defaultView;
    this.root = this.host.createElement('div');
    this.root.setAttribute('data-mona-image-controls', '');
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-label', '图片拖动与缩放');
    this.root.tabIndex = 0;
    this.root.style.cssText = 'position:fixed;display:none;z-index:15;box-sizing:border-box;border:1px solid #1677ff;cursor:move;touch-action:none;user-select:none;outline:none;';
    for (const [handle, label] of Object.entries(labels)) {
      const button = this.host.createElement('button');
      button.type = 'button';
      button.dataset.handle = handle;
      button.setAttribute('aria-label', `${label}缩放图片`);
      button.title = `${label}缩放图片`;
      const x = handle.includes('w') ? 0 : handle.includes('e') ? 100 : 50;
      const y = handle.includes('n') ? 0 : handle.includes('s') ? 100 : 50;
      const cursor = ['nw', 'se'].includes(handle) ? 'nwse' : ['ne', 'sw'].includes(handle) ? 'nesw' : handle === 'n' || handle === 's' ? 'ns' : 'ew';
      button.style.cssText = `all:initial;position:absolute;display:block;box-sizing:border-box;left:${x}%;top:${y}%;width:10px;height:10px;transform:translate(-50%,-50%);border:1.5px solid #1677ff;border-radius:2px;background:white;cursor:${cursor}-resize;touch-action:none;box-shadow:0 1px 3px #00000012;`;
      button.addEventListener('focus', () => { button.style.boxShadow = '0 0 0 3px #1677ff40'; });
      button.addEventListener('blur', () => { button.style.boxShadow = '0 1px 3px #00000012'; });
      this.root.append(button);
    }
    this.caption = this.host.createElement('span');
    this.caption.style.cssText = 'position:absolute;left:50%;bottom:calc(100% + 12px);transform:translateX(-50%);white-space:nowrap;pointer-events:none;background:#1677ff;color:#fff;border-radius:5px;padding:5px 9px;font:11px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 2px 8px #00000014;';
    this.root.append(this.caption);
    this.host.body.append(this.root);
    this.root.addEventListener('pointerdown', event => {
      if (event.button !== 0 || this.gesture) return;
      event.preventDefault();
      event.stopPropagation();
      if (!this.begin(event.target.dataset.handle || 'move', event.clientX, event.clientY)) return;
      this.pointerId = event.pointerId;
      try { this.root.setPointerCapture(event.pointerId); } catch { /* Synthetic regression events have no active pointer. */ }
    });
    this.root.addEventListener('pointermove', event => {
      if (!this.gesture || event.pointerId !== this.pointerId) return;
      event.preventDefault();
      this.update(event.clientX, event.clientY, event.shiftKey);
    });
    this.root.addEventListener('pointerup', event => { if (event.pointerId === this.pointerId) this.finish(); });
    this.root.addEventListener('pointercancel', () => this.finish(true));
    this.root.addEventListener('lostpointercapture', () => this.finish(true));
    this.root.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); });
    this.root.addEventListener('wheel', event => {
      if (event.ctrlKey) return;
      for (let parent = this.editor.iframe.parentElement; parent; parent = parent.parentElement) {
        if (/(auto|scroll)/.test(this.win.getComputedStyle(parent).overflowY)) {
          event.preventDefault();
          const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? parent.clientHeight : 1;
          parent.scrollBy(event.deltaX * unit, event.deltaY * unit);
          break;
        }
      }
    }, { passive: false });
    this.onKey = event => {
      if (event.key === 'Escape' && this.gesture) {
        event.preventDefault(); event.stopImmediatePropagation(); this.finish(true);
      }
    };
    this.host.addEventListener('keydown', this.onKey, true);
    this.root.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || this.gesture) return;
      event.preventDefault(); event.stopPropagation();
      const step = event.shiftKey ? 10 : 1;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      const box = this.bounds();
      if (box && this.begin(event.target.dataset.handle || 'move', 0, 0)) {
        this.update(dx * box.frameScaleX, dy * box.frameScaleY, false, true);
        this.finish();
      }
    });
    this.onBlur = () => this.finish(true);
    this.win.addEventListener('blur', this.onBlur);
  }

  bounds() {
    const el = this.editor.selected;
    if (this.editor.preview || el?.tagName !== 'IMG' || !el.isConnected) return null;
    const frame = this.editor.iframe;
    const frameBox = frame.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const frameScaleX = frameBox.width / (frame.offsetWidth || 1);
    const frameScaleY = frameBox.height / (frame.offsetHeight || 1);
    return { x: frameBox.left + (frame.clientLeft + rect.left) * frameScaleX,
      y: frameBox.top + (frame.clientTop + rect.top) * frameScaleY,
      width: rect.width * frameScaleX, height: rect.height * frameScaleY, frameScaleX, frameScaleY };
  }

  scalePercent() {
    const el = this.editor.selected;
    if (el?.tagName !== 'IMG') return null;
    const original = this.editor.originals.get(el.getAttribute('data-mona-id'));
    if (!original) return null;
    const style = this.editor.iframe.contentWindow.getComputedStyle(el);
    const width = number(style.width) + (style.boxSizing === 'border-box' ? 0 :
      number(style.paddingLeft) + number(style.paddingRight) + number(style.borderLeftWidth) + number(style.borderRightWidth));
    if (!width) return 100;
    original.imageWidth ??= width;
    return width / original.imageWidth * 100;
  }

  setScale(percent, { transient = false } = {}) {
    if (!Number.isFinite(percent) || percent < 10 || percent > 500) throw new Error('图片缩放请输入 10% 到 500%');
    if (!this.gesture) {
      const scale = this.scalePercent();
      if (!scale || !this.begin('se', 0, 0)) return;
      this.gesture.scaleStart = scale;
    }
    const g = this.gesture;
    if (!g.scaleStart) return;
    const factor = percent / g.scaleStart;
    this.update(g.x + g.box.width * (factor - 1), g.y + g.box.height * (factor - 1), false, true);
    if (!transient) this.finish();
  }

  sync() {
    this.win.cancelAnimationFrame(this.animation);
    const box = this.bounds();
    if (!box) { this.finish(true); this.root.style.display = 'none'; return; }
    Object.assign(this.root.style, { display: 'block', left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` });
    const el = this.editor.selected;
    this.caption.textContent = this.gesture?.changed
      ? `${Math.round(el.offsetWidth)} × ${Math.round(el.offsetHeight)} px`
      : '拖动移动 · 拖角等比缩放 · Shift 自由缩放';
    this.caption.style.bottom = box.y < 45 ? 'auto' : 'calc(100% + 12px)';
    this.caption.style.top = box.y < 45 ? 'calc(100% + 12px)' : 'auto';
    this.animation = this.win.requestAnimationFrame(() => this.sync());
  }

  begin(handle, x, y) {
    const box = this.bounds();
    if (!box || !box.width || !box.height || this.gesture) return false;
    this.editor.endTextEdit();
    this.editor.flush();
    const el = this.editor.selected;
    const computed = this.editor.iframe.contentWindow.getComputedStyle(el);
    const extraX = number(computed.paddingLeft) + number(computed.paddingRight) + number(computed.borderLeftWidth) + number(computed.borderRightWidth);
    const extraY = number(computed.paddingTop) + number(computed.paddingBottom) + number(computed.borderTopWidth) + number(computed.borderBottomWidth);
    const width = number(computed.width), height = number(computed.height);
    // Offsets are expressed in the parent's coordinate system, independent of
    // the image's own CSS transform. Invert ancestor transforms for dragging.
    let matrix = new DOMMatrix();
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const style = this.editor.iframe.contentWindow.getComputedStyle(parent);
      const transform = style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);
      const zoom = number(style.zoom) || 1;
      matrix = transform.scale(zoom).multiply(matrix);
    }
    matrix.e = 0; matrix.f = 0;
    this.gesture = { el, handle, x, y, box, style: el.getAttribute('style'), width, height,
      extraX: computed.boxSizing === 'border-box' ? 0 : extraX,
      extraY: computed.boxSizing === 'border-box' ? 0 : extraY,
      inverse: matrix.inverse(), position: computed.position,
      left: computed.position === 'static' ? 0 : computed.left === 'auto' ? -number(computed.right) : number(computed.left),
      top: computed.position === 'static' ? 0 : computed.top === 'auto' ? -number(computed.bottom) : number(computed.top), changed: false };
    return true;
  }

  update(x, y, free = false, keyboard = false) {
    const g = this.gesture;
    if (!g) return;
    const dx = x - g.x, dy = y - g.y;
    if (!g.changed && !keyboard && Math.hypot(dx, dy) < 3) return;
    g.changed = true;
    const { el, handle, box } = g;
    const desired = { ...box };
    if (handle === 'move') { desired.x += dx; desired.y += dy; }
    else {
      const horizontal = handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0;
      const vertical = handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0;
      const minWidth = Math.max(16, g.extraX + 1) * box.width / (g.width + g.extraX);
      const minHeight = Math.max(16, g.extraY + 1) * box.height / (g.height + g.extraY);
      if (horizontal && vertical && !free) {
        const scale = Math.max(minWidth / box.width, minHeight / box.height,
          1 + (dx * horizontal * box.width + dy * vertical * box.height) / (box.width ** 2 + box.height ** 2));
        desired.width = box.width * scale; desired.height = box.height * scale;
      } else {
        desired.width = Math.max(minWidth, box.width + horizontal * dx);
        desired.height = Math.max(minHeight, box.height + vertical * dy);
      }
      if (horizontal < 0) desired.x = box.x + box.width - desired.width;
      if (vertical < 0) desired.y = box.y + box.height - desired.height;
    }
    g.style === null ? el.removeAttribute('style') : el.setAttribute('style', g.style);
    const set = (key, value) => el.style.setProperty(key, value, 'important');
    set('transition', 'none');
    if (handle !== 'move') {
      set('width', `${(g.width + g.extraX) * desired.width / box.width - g.extraX}px`);
      set('height', `${(g.height + g.extraY) * desired.height / box.height - g.extraY}px`);
      set('max-width', 'none'); set('max-height', 'none');
      set('min-width', '0'); set('min-height', '0'); set('flex-shrink', '0');
    }
    const actual = this.bounds();
    const correction = new DOMPoint((desired.x - actual.x) / box.frameScaleX, (desired.y - actual.y) / box.frameScaleY).matrixTransform(g.inverse);
    if (Math.abs(correction.x) > 0.001 || Math.abs(correction.y) > 0.001) {
      if (g.position === 'static') set('position', 'relative');
      set('left', `${g.left + correction.x}px`); set('top', `${g.top + correction.y}px`);
      set('right', 'auto'); set('bottom', 'auto');
    }
    this.editor.emit('selection', this.editor.selection());
    this.sync();
  }

  finish(cancel = false) {
    const g = this.gesture;
    if (!g) return;
    this.gesture = null;
    if (this.pointerId !== undefined && this.root.hasPointerCapture(this.pointerId)) this.root.releasePointerCapture(this.pointerId);
    this.pointerId = undefined;
    if (!g.changed) return;
    if (cancel) g.style === null ? g.el.removeAttribute('style') : g.el.setAttribute('style', g.style);
    else {
      const original = this.host.createElement('div');
      original.setAttribute('style', g.style || '');
      g.el.style.removeProperty('transition');
      for (const key of original.style) if (key.startsWith('transition')) g.el.style.setProperty(key, original.style.getPropertyValue(key), original.style.getPropertyPriority(key));
      this.editor.commit();
    }
    this.editor.emit('selection', this.editor.selection());
  }

  hide() { this.finish(true); this.win.cancelAnimationFrame(this.animation); this.root.style.display = 'none'; }
  destroy() { this.hide(); this.root.remove(); this.host.removeEventListener('keydown', this.onKey, true); this.win.removeEventListener('blur', this.onBlur); }
}
