import { HtmlVisualEditor } from '../editor.js';
const editor = new HtmlVisualEditor(document.querySelector('iframe'));
const results = document.querySelector('#results');
const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jY1sAAAAASUVORK5CYII=';
let passed = 0, failed = 0;
const assert = (value, message) => { if (!value) throw new Error(message); };
const check = async (name, callback) => {
  const row = document.createElement('li'); results.append(row);
  try { await callback(); passed++; row.className = 'pass'; row.textContent = '通过：' + name; }
  catch (error) { failed++; row.className = 'fail'; row.textContent = '失败：' + name + ' — ' + error.message; }
};
const select = selector => editor.select(editor.doc.querySelector(selector));
await check('完整文档导入，保留标题、自定义样式，移除执行内容', async () => {
  await editor.load('<!doctype html><html><head><title>测试页面</title><style>h1{font-size:42px;color:rgb(12,34,56)}</style></head><body><h1 id="test-heading">原始标题</h1><p class="p-4 text-red-500">正文</p><img src="' + pixel + '" alt="测试图片"><script>document.body.textContent="不应执行"</script><a href="javascript:alert(1)" onclick="alert(1)">链接</a></body></html>', { resetHistory: true });
  assert(editor.doc.title === '测试页面', '标题丢失');
  assert(editor.doc.querySelector('h1').textContent === '原始标题', '脚本运行或内容丢失');
  assert(!editor.getHTML().includes('onclick') && !editor.getHTML().includes('javascript:'), '事件属性未清理');
  assert(editor.iframe.contentWindow.getComputedStyle(editor.doc.querySelector('h1')).fontSize === '42px', '自定义样式被覆盖');
});
await check('Tailwind 样式生成并包含在 HTML 导出中', async () => {
  const deadline = Date.now() + 5000;
  while (!editor.doc.querySelector('[data-mona-tailwind]') && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
  assert(editor.iframe.contentWindow.getComputedStyle(editor.doc.querySelector('p')).paddingTop === '16px', 'Tailwind 未编译');
  assert(editor.getHTML().includes('.p-4'), '导出缺少编译后的样式');
});
await check('文字和样式修改，完整撤销、重做', async () => {
  select('h1'); editor.setText('新标题'); editor.setStyle('font-size', '64px');
  assert(editor.doc.querySelector('h1').style.fontSize === '64px', '样式未更新');
  await editor.undo();
  assert(editor.doc.querySelector('h1').textContent === '新标题' && !editor.doc.querySelector('h1').style.fontSize, '撤销样式失败');
  await editor.undo();
  assert(editor.doc.querySelector('h1').textContent === '原始标题', '撤销文字失败');
  await editor.redo(); await editor.redo();
  assert(editor.doc.querySelector('h1').style.fontSize === '64px', '重做失败');
});
await check('滑杆连续预览只产生一次撤销记录', async () => {
  select('h1');
  const index = editor.index;
  editor.setStyle('font-size', '66px', { transient: true });
  editor.setStyle('font-size', '68px', { transient: true });
  assert(editor.index === index && editor.doc.querySelector('h1').style.fontSize === '68px', '连续预览不应逐帧写入历史');
  editor.commit();
  assert(editor.index === index + 1, '滑杆提交必须生成一条历史');
  await editor.undo();
  assert(editor.doc.querySelector('h1').style.fontSize === '64px', '撤销未恢复滑动前的样式');
});
await check('跨历史恢复原始样式', () => {
  select('h1'); editor.resetElement();
  assert(!editor.doc.querySelector('h1').getAttribute('style'), '原始样式未恢复');
});
await check('复制删除可撤销，复制节点不重复 HTML id', async () => {
  select('h1'); editor.duplicate();
  assert(editor.doc.querySelectorAll('h1').length === 2 && editor.doc.querySelectorAll('#test-heading').length === 1, '复制节点或 id 错误');
  editor.deleteElement(); assert(editor.doc.querySelectorAll('h1').length === 1, '删除失败');
  await editor.undo(); assert(editor.doc.querySelectorAll('h1').length === 2, '撤销删除失败');
  await editor.undo(); assert(editor.doc.querySelectorAll('h1').length === 1, '撤销复制失败');
});
await check('图片替换、替代文字与导出重新导入', async () => {
  select('img'); editor.setImage(pixel); editor.setImageAlt('替换完成');
  const html = editor.getHTML();
  assert(html.includes(pixel) && html.includes('替换完成'), '图片未保存在 HTML 中');
  assert(!/data-mona-(id|selected|hover|runtime|load)|contenteditable|<script|Content-Security-Policy/.test(html), '编辑器内部信息泄漏');
  await editor.load(html);
  assert(editor.doc.querySelector('img').getAttribute('src') === pixel, '重新导入图片失败');
});
await check('预览模式和资源基础地址', async () => {
  editor.setPreview(true); assert(editor.doc.documentElement.hasAttribute('data-mona-preview'), '预览状态失败');
  editor.setPreview(false);
  await editor.load('<p>相对资源</p><img src="sample.png">', { baseURL: 'https://example.com/assets/' });
  assert(editor.doc.querySelector('img').src === 'https://example.com/assets/sample.png', '基础地址解析错误');
  assert(editor.getHTML().includes('<base href="https://example.com/assets/">'), '导出遗漏基础地址');
});
await check('普通 HTML 保留浏览器默认排版，不强制套用 Tailwind', async () => {
  await editor.load('<h1>普通标题</h1><p>普通段落</p>');
  assert(editor.iframe.contentWindow.getComputedStyle(editor.doc.querySelector('h1')).fontSize === '32px', '默认标题样式被覆盖');
  assert(!editor.doc.querySelector('[data-mona-tailwind]'), '普通 HTML 不应启用 Tailwind');
});
await check('PNG 实际渲染并生成图片 Blob', async () => {
  await editor.load('<html><head><style>body{margin:0;background:#fff}h1{font-size:40px}</style></head><body><h1>PNG 导出</h1><img width="20" height="20" src="' + pixel + '"></body></html>');
  select('h1');
  const blob = await editor.exportPNG();
  assert(blob instanceof Blob && blob.type === 'image/png' && blob.size > 100, 'PNG 结果无效');
});
await check('PNG 保留 object-fit 裁切与 object-position（像素验证）', async () => {
  const source = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="20"><rect width="50" height="20" fill="red"/><rect x="50" width="50" height="20" fill="blue"/></svg>');
  await editor.load('<html><head><style>body{margin:0}img{display:block;width:20px;height:20px;object-fit:cover;object-position:0% 50%}</style></head><body><img src="' + source + '"></body></html>');
  const blob = await editor.exportPNG();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0);
  const pixel = ctx.getImageData(30, 20, 1, 1).data;
  bitmap.close();
  assert(pixel[0] > 240 && pixel[2] < 10, '图片被拉伸，未保留左侧裁切');
});
// Exercise the same pointer handlers used by the visible drag controls.
const near = (a, b) => Math.abs(a - b) < 0.8;
function pointer(target, type, x, y, shiftKey = false) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 17, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y, shiftKey }));
}
function gesture(handle, dx, dy, free = false, cancel = false) {
  const controls = editor.imageControls;
  const start = controls.bounds();
  const root = controls.root;
  const target = handle === 'move' ? root : root.querySelector(`[data-handle="${handle}"]`);
  pointer(target, 'pointerdown', start.x + start.width / 2, start.y + start.height / 2);
  pointer(root, 'pointermove', start.x + start.width / 2 + dx, start.y + start.height / 2 + dy, free);
  pointer(root, cancel ? 'pointercancel' : 'pointerup', start.x + start.width / 2 + dx, start.y + start.height / 2 + dy, free);
}
await check('图片控制点随选择出现，不进入 HTML 或预览', async () => {
  await editor.load('<html><head><style>body{margin:30px}img{display:block;width:200px;height:100px;object-fit:cover;max-width:100%}</style></head><body><img src="' + pixel + '"><p>后续内容</p></body></html>');
  select('img');
  assert(editor.imageControls.root.querySelectorAll('[data-handle]').length === 8, '缺少八个缩放控制点');
  assert(editor.imageControls.root.style.display === 'block', '选中图片未显示控制点');
  assert(!editor.getHTML().includes('data-mona-image-controls'), '控制点混入导出');
  editor.setPreview(true);
  assert(editor.imageControls.root.style.display === 'none', '预览没有隐藏控制点');
  editor.setPreview(false); select('img');
});
await check('50% 画布下四角等比缩放，单次撤销和重做', async () => {
  editor.iframe.style.transform = 'scale(.5)'; editor.iframe.style.transformOrigin = 'top left';
  const before = editor.imageControls.bounds();
  const index = editor.index;
  gesture('se', 50, 25);
  const after = editor.imageControls.bounds();
  assert(near(after.width, 150) && near(after.height, 75), '画布缩放换算或比例错误');
  assert(near(before.x, after.x) && near(before.y, after.y), '右下角缩放改变左上锚点');
  assert(editor.index === index + 1, '一次拖拽应只记录一次历史');
  await editor.undo(); assert(near(editor.imageControls.bounds().width, 100), '撤销缩放失败');
  await editor.redo(); assert(near(editor.imageControls.bounds().width, 150), '重做缩放失败');
});
await check('左上角缩放固定对角，Shift 支持非等比', () => {
  const before = editor.imageControls.bounds();
  gesture('nw', -30, -15);
  const after = editor.imageControls.bounds();
  assert(near(before.x + before.width, after.x + after.width) && near(before.y + before.height, after.y + after.height), '对角锚点偏移');
  assert(near(after.width / after.height, 2), '等比缩放失效');
  gesture('se', 40, 0, true);
  const free = editor.imageControls.bounds();
  assert(near(free.width, after.width + 40) && near(free.height, after.height), 'Shift 自由缩放失效');
});
await check('侧边缩放只改变单轴，图片移动与导出重导入', async () => {
  const before = editor.imageControls.bounds();
  gesture('e', 20, 40);
  const resized = editor.imageControls.bounds();
  assert(near(resized.width, before.width + 20) && near(resized.height, before.height), '侧边缩放改变了另一轴');
  gesture('move', 25, 15);
  const moved = editor.imageControls.bounds();
  assert(near(moved.x, resized.x + 25) && near(moved.y, resized.y + 15), '移动距离不正确');
  const html = editor.getHTML();
  await editor.load(html); select('img');
  const restored = editor.imageControls.bounds();
  assert(near(restored.width, moved.width) && near(restored.x, moved.x) && near(restored.y, moved.y), '位置或尺寸未保存');
});
await check('取消拖动恢复原状态，单击不污染历史', () => {
  const style = editor.selected.getAttribute('style'), index = editor.index;
  gesture('move', 0, 0);
  assert(editor.index === index && editor.selected.getAttribute('style') === style, '单击产生了修改');
  gesture('nw', 25, 20, false, true);
  assert(editor.index === index && editor.selected.getAttribute('style') === style, '取消手势没有恢复原样式');
});
await check('嵌套缩放容器中拖动仍跟随指针，保留原 transform', async () => {
  await editor.load('<html><head><style>body{margin:20px}section{transform:scale(.8);transform-origin:top left}img{width:200px;height:100px;display:block;transform:scale(.9);transform-origin:top left}</style></head><body><section><img src="' + pixel + '"></section></body></html>');
  select('img');
  const before = editor.imageControls.bounds();
  gesture('move', 40, 20);
  const after = editor.imageControls.bounds();
  assert(near(after.x, before.x + 40) && near(after.y, before.y + 20), '嵌套缩放使移动偏移');
  assert(editor.iframe.contentWindow.getComputedStyle(editor.selected).transform !== 'none', '原 transform 被覆盖');
  editor.iframe.style.transform = '';
  editor.select(null);
});
await check('属性面板百分比等比缩放，连续滑动仅记录一次历史', async () => {
  await editor.load('<html><head><style>body{margin:0}img{display:block;width:200px;height:100px}</style></head><body><img src="' + pixel + '"></body></html>');
  select('img');
  assert(near(editor.selection().imageScale, 100), '初始百分比不是 100');
  const index = editor.index;
  editor.imageControls.setScale(125, { transient: true });
  editor.imageControls.setScale(150, { transient: true });
  assert(editor.index === index, '连续拖动写入了多条历史');
  editor.imageControls.finish();
  assert(editor.index === index + 1, '松手未记录一次历史');
  const box = editor.imageControls.bounds();
  assert(near(box.width, 300) && near(box.height, 150), '百分比缩放没有等比改变尺寸');
  await editor.undo(); assert(near(editor.selection().imageScale, 100), '撤销未同步百分比');
  await editor.redo(); assert(near(editor.selection().imageScale, 150), '重做未同步百分比');
});
await check('拖角与百分比双向同步，数值输入保持当前比例', () => {
  gesture('se', 60, 30);
  assert(near(editor.selection().imageScale, 180), '拖角未同步到百分比');
  editor.imageControls.setScale(100);
  const box = editor.imageControls.bounds();
  assert(near(box.width, 200) && near(box.height, 100), '百分比输入未恢复基准尺寸');
  let rejected = false;
  try { editor.imageControls.setScale(NaN); } catch { rejected = true; }
  assert(rejected && near(editor.selection().imageScale, 100), '无效输入改变了图片');
});
document.querySelector('#summary').textContent = `${passed} 项通过，${failed} 项失败`;
document.title = `${failed ? '失败' : '通过'} · HTML 编辑器回归测试`;
