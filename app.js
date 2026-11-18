import { HtmlVisualEditor } from './editor.js';
import { exampleHTML } from './example.js';

const $ = selector => document.querySelector(selector);
const editor = new HtmlVisualEditor($('#canvas'));
const STORAGE_KEY = 'mona-html-editor:draft:v1';
let busy = false;
let dirty = false;
let saveTimer;
let filename = '我的设计.html';
let savedDraft;

function status(text, error = false) { $('#status').textContent = text; $('#status').classList.toggle('error', error); }
async function run(callback) {
  if (busy) return;
  busy = true;
  try { await callback(); } catch (error) { status(error.message || '操作失败，请重试', true); }
  finally { busy = false; }
}
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function saveDraft() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ html: editor.getHTML(), filename: $('#filename').value, width: editor.width }));
    status('草稿已保存在此浏览器');
  } catch { status('草稿存储空间不足或不可用，请导出 HTML 保存', true); }
}
function renderLayers() {
  const root = $('#layers'); root.replaceChildren();
  const elements = editor.getElements();
  $('#layer-count').textContent = String(elements.length);
  for (const el of elements.slice(0, 600)) {
    let depth = 0; let parent = el.parentElement;
    while (parent && parent !== editor.doc.body) { depth++; parent = parent.parentElement; }
    const button = document.createElement('button');
    button.className = 'layer';
    button.style.paddingLeft = `${10 + Math.min(depth, 7) * 11}px`;
    button.dataset.id = el.getAttribute('data-mona-id');
    const tag = document.createElement('span'); tag.textContent = el.tagName.toLowerCase();
    button.append(tag, document.createTextNode((el.getAttribute('alt') || el.textContent || el.tagName.toLowerCase()).trim().replace(/\s+/g, ' ').slice(0, 34)));
    button.title = button.textContent;
    button.onclick = () => { if (editor.preview) setPreview(false); editor.select(el); el.scrollIntoView({ block: 'center', inline: 'nearest' }); };
    root.append(button);
  }
  if (elements.length > 600) { const note = document.createElement('p'); note.className = 'panel-hint'; note.textContent = '结构列表显示前 600 个元素，其余可在画布直接选择。'; root.append(note); }
  syncSelection(editor.selection());
}
function syncSelection(selection) {
  $('.inspector').hidden = !selection;
  $('#empty-selection').hidden = !!selection;
  $('#properties').hidden = !selection;
  document.querySelectorAll('.layer').forEach(el => el.classList.toggle('active', el.dataset.id === selection?.id));
  if (!selection) return;
  $('#selection-label').textContent = `<${selection.tag}>`;
  $('#text-section').hidden = selection.tag === 'img';
  $('#image-section').hidden = selection.tag !== 'img';
  $('#text-field').hidden = !selection.leaf;
  $('#nested-text-hint').hidden = selection.leaf;
  $('#element-text').value = selection.text;
  $('#image-url').value = selection.src;
  $('#image-alt').value = selection.alt;
  if (selection.imageScale != null) {
    $('#image-scale').value = selection.imageScale;
    $('#image-scale-value').value = Math.round(selection.imageScale * 10) / 10;
    paintRange($('#image-scale'));
  }
  document.querySelectorAll('[data-style]').forEach(input => {
    let value = selection.styles[input.dataset.style] || '';
    if (/^-?\d+\.\d+px$/.test(value)) value = `${Math.round(parseFloat(value) * 10) / 10}px`;
    if (input.dataset.style === 'background-color' && value === 'rgba(0, 0, 0, 0)') value = 'transparent';
    if (input.tagName === 'SELECT' && !Array.from(input.options).some(option => option.value === value)) input.add(new Option(value, value));
    input.value = value;
  });
  document.querySelectorAll('[data-range]').forEach(input => {
    input.value = parseFloat(selection.styles[input.dataset.range]) || 0;
    paintRange(input);
  });
  document.querySelectorAll('[data-color]').forEach(input => {
    input.value = hexColor(selection.styles[input.dataset.color]);
  });
  const position = (selection.styles['object-position'] || '50% 50%').split(' ');
  document.querySelectorAll('[data-position]').forEach(input => {
    const value = position[Number(input.dataset.position)] || position[0];
    input.value = ({ left: 0, top: 0, center: 50, right: 100, bottom: 100 })[value] ?? (parseFloat(value) || 0);
    paintRange(input);
  });
}
function paintRange(input) {
  input.style.setProperty('--fill', `${(Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`);
}
function hexColor(value = '') {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const parts = value.match(/[\d.]+/g);
  if (!parts || value === 'transparent' || (parts.length === 4 && Number(parts[3]) === 0)) return '#ffffff';
  return '#' + parts.slice(0, 3).map(value => Math.round(Number(value)).toString(16).padStart(2, '0')).join('');
}
function resizeCanvas() {
  const zoom = Number($('#zoom').value);
  const width = Number($('#canvas-width').value);
  editor.width = width;
  $('#canvas').style.width = `${width}px`;
  $('#canvas').style.transform = `scale(${zoom})`;
  $('#canvas-size').style.width = `${width * zoom}px`;
  $('#canvas-size').style.height = `${(editor.height || 800) * zoom}px`;
  $('#zoom-value').textContent = `${Math.round(zoom * 100)}%`;
}
function setPreview(value) {
  editor.setPreview(value);
  $('#preview').setAttribute('aria-pressed', String(value));
  $('#preview-label').textContent = value ? '返回编辑' : '预览';
}

editor.addEventListener('selection', event => syncSelection(event.detail));
editor.addEventListener('resize', resizeCanvas);
editor.addEventListener('error', event => status(event.detail.message, true));
editor.addEventListener('load', event => { $('#base-url').value = event.detail.baseURL; renderLayers(); });
editor.addEventListener('history', event => { $('#undo').disabled = !event.detail.canUndo; $('#redo').disabled = !event.detail.canRedo; });
editor.addEventListener('change', () => { dirty = true; renderLayers(); clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 600); status('已修改'); });

$('#open-file').onclick = () => $('#html-file').click();
async function importHTML(file) {
  if (!file) return;
  if (!/\.html?$/i.test(file.name)) throw new Error('请选择 HTML 文件');
  if (file.size > 20 * 1024 * 1024) throw new Error('HTML 超过 20 MB，请精简文件后重试');
  const html = await file.text();
  await editor.load(html);
  filename = file.name; $('#filename').value = filename;
  saveDraft();
}
$('#html-file').onchange = event => run(async () => { await importHTML(event.target.files[0]); event.target.value = ''; });
$('#open-source').onclick = () => { $('#source').value = editor.getHTML(); $('#source-dialog').showModal(); };
$('#edit-source').onclick = () => $('#open-source').click();
$('#document-options').onclick = () => {
  const panel = $('#document-settings');
  panel.hidden = !panel.hidden;
  $('#document-options').setAttribute('aria-expanded', String(!panel.hidden));
};
$('#toggle-console').onclick = () => {
  if (matchMedia('(max-width:1050px)').matches) document.body.classList.toggle('console-open');
  else document.body.classList.toggle('console-collapsed');
  $('#toggle-console').setAttribute('aria-expanded', String(matchMedia('(max-width:1050px)').matches ? document.body.classList.contains('console-open') : !document.body.classList.contains('console-collapsed')));
};
$('#close-console').onclick = () => {
  document.body.classList.remove('console-open');
  document.body.classList.add('console-collapsed');
  $('#toggle-console').setAttribute('aria-expanded', 'false');
};
$('#apply-source').onclick = () => run(async () => { await editor.load($('#source').value); $('#source-dialog').close(); });
$('#apply-base').onclick = () => run(async () => {
  const base = $('#base-url').value.trim();
  if (base && !/^https?:\/\//i.test(base)) throw new Error('资源基础地址需要以 http:// 或 https:// 开头');
  await editor.load(editor.getHTML(), { baseURL: base });
});
$('#load-example').onclick = () => run(() => editor.load(exampleHTML));
$('#undo').onclick = () => run(() => editor.undo());
$('#redo').onclick = () => run(() => editor.redo());
$('#canvas-width').onchange = () => { fitSmallCanvas(); resizeCanvas(); editor.resize(); saveDraft(); };
$('#zoom').onchange = resizeCanvas;
function setZoom(value) { $('#zoom').value = Math.max(0.1, Math.min(3, value)); resizeCanvas(); }
function fitSmallCanvas() {
  if (window.innerWidth <= 650) $('#zoom').value = Math.max(0.1, Math.min(0.75, (window.innerWidth - 40) / Number($('#canvas-width').value)));
  $('#toggle-console').setAttribute('aria-expanded', String(matchMedia('(max-width:1050px)').matches ? document.body.classList.contains('console-open') : !document.body.classList.contains('console-collapsed')));
}
window.addEventListener('resize', () => { fitSmallCanvas(); resizeCanvas(); });
$('#zoom-out').onclick = () => setZoom(Number($('#zoom').value) - 0.1);
$('#zoom-in').onclick = () => setZoom(Number($('#zoom').value) + 0.1);
$('#zoom-reset').onclick = () => setZoom(1);
$('#preview').onclick = () => setPreview(!editor.preview);
$('#deselect').onclick = () => editor.select(null);
$('#select-parent').onclick = () => editor.selectParent();
$('#reset-element').onclick = () => editor.resetElement();
$('#duplicate').onclick = () => editor.duplicate();
$('#delete-element').onclick = () => editor.deleteElement();
$('#element-text').onchange = event => editor.setText(event.target.value);
$('#image-url').onchange = event => run(() => editor.setImage(event.target.value.trim()));
$('#image-alt').onchange = event => editor.setImageAlt(event.target.value);
document.querySelectorAll('[data-style]').forEach(input => input.addEventListener('change', () => run(() => editor.setStyle(input.dataset.style, input.value.trim()))));
document.querySelectorAll('[data-range],[data-color],[data-position]').forEach(input => {
  input.addEventListener('input', () => {
    try {
      if (input.dataset.range) editor.setStyle(input.dataset.range, `${input.value}px`, { transient: true });
      else if (input.dataset.color) editor.setStyle(input.dataset.color, input.value, { transient: true });
      else editor.setStyle('object-position', `${$('#image-x').value}% ${$('#image-y').value}%`, { transient: true });
    } catch (error) { status(error.message, true); }
  });
  input.addEventListener('change', () => editor.commit());
});
$('#replace-image').onclick = () => $('#image-file').click();
$('#image-scale').oninput = event => {
  try { editor.imageControls.setScale(Number(event.target.value), { transient: true }); }
  catch (error) { status(error.message, true); }
};
$('#image-scale').onchange = () => editor.imageControls.finish();
$('#image-scale-value').onchange = event => run(() => editor.imageControls.setScale(event.target.value === '' ? NaN : Number(event.target.value)));
async function replaceImage(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)) throw new Error('请选择 PNG、JPG、WebP、GIF 或 AVIF 图片');
  if (file.size > 15 * 1024 * 1024) throw new Error('图片超过 15 MB，请压缩后上传');
  const url = await new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('图片读取失败')); reader.readAsDataURL(file);
  });
  editor.setImage(url);
}
$('#image-file').onchange = event => run(async () => { await replaceImage(event.target.files[0]); event.target.value = ''; });
for (const [selector, action] of [['#open-file', importHTML], ['#replace-image', replaceImage]]) {
  const zone = $(selector);
  zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('dragging'); run(() => action(event.dataTransfer.files[0])); });
}
$('#filename').onchange = saveDraft;
$('#export-html').onclick = () => run(() => {
  const html = editor.getHTML();
  filename = $('#filename').value.trim() || '我的设计.html';
  if (!/\.html?$/i.test(filename)) filename += '.html';
  download(new Blob([html], { type: 'text/html;charset=utf-8' }), filename);
  dirty = false; status('HTML 已导出');
});
$('#export-image').onclick = () => run(async () => {
  $('#export-image').disabled = true; status('正在生成 PNG…');
  try {
    const blob = await editor.exportPNG();
    download(blob, ($('#filename').value || '我的设计').replace(/\.html?$/i, '') + '.png');
    status('PNG 已导出');
  } finally { $('#export-image').disabled = false; }
});
document.addEventListener('keydown', event => {
  if (event.target.matches('input,textarea,select') || $('#source-dialog').open) return;
  editor.handleShortcut(event);
});
window.addEventListener('beforeunload', event => {
  if (!dirty) return;
  saveDraft(); event.preventDefault(); event.returnValue = '';
});

try { savedDraft = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { /* Storage may be disabled. */ }
if (savedDraft?.filename) $('#filename').value = savedDraft.filename;
if ([375, 768, 1024, 1440].includes(savedDraft?.width)) $('#canvas-width').value = String(savedDraft.width);
fitSmallCanvas();
resizeCanvas();
await run(async () => {
  await editor.load(typeof savedDraft?.html === 'string' ? savedDraft.html : exampleHTML, { resetHistory: true });
  dirty = false;
  status(savedDraft ? '已恢复此浏览器的上次草稿' : '点击元素选择，双击文字编辑');
});
