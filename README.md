# Mona HTML 编辑器

从 MonaStudio 的 `CenterCanvas.tsx` 和 `FloatingRightStylePanel.tsx` 提取并独立整理的网页工具。整个目录可以复制到别的电脑或项目；无需 MonaStudio 后端、账号、React、Node.js 或构建步骤。

## 部署与开发

仓库已替换为 Mona HTML 编辑器，纯前端运行，无需账号和生成后端。

```sh
npm ci
npm run dev
npm run build
npm run preview
```

需要 Node.js 24.x，无 npm 第三方依赖。开发默认端口 5173，预览端口 4173，可追加 `-- --port 8766`。部署平台使用构建命令 `npm run build`、输出目录 `dist`。Vercel 通过仓库根目录的 `vercel.json` 自动读取这些设置。所有浏览器依赖随代码提供，支持部署到静态托管服务的根目录或子目录。浏览器回归测试在开发服务的 `/tests/` 下；测试与启动脚本不包含在生产目录。

## 打开

macOS 双击本目录的 **打开编辑器.command**，会启动本机服务并打开浏览器。需要系统中已有 Python 3。

也可以在终端运行：

```sh
python3 /你的路径/html-visual-editor/serve.py
```

默认地址为 <http://127.0.0.1:8765>。端口被占用时用 `--port 8766`，不自动打开浏览器用 `--no-open`。终端按 Ctrl+C 停止服务。由于使用 JavaScript 模块，请通过本机服务打开，不要直接双击 `index.html`。

也可以将整个目录作为静态文件部署到自己的网页服务器，无需构建。没有上传或发布服务。

## 使用

1. 点击「打开 HTML，开始编辑」选择文件，或通过「粘贴 HTML 源码」粘贴完整文档或 HTML 片段。可先打开目录里的 `示例.html`。
2. 单击画布元素后，右侧悬浮属性面板出现。通过滑杆、色块和数值修改字号、字重、颜色、间距、宽高、圆角等；双击文字可直接输入。结构列表可用于选中嵌套的父元素。
3. 选中图片后，在「填充方式」下方的「图片缩放」滑杆或百分比输入框等比调整大小（10%–500%，本次打开时的初始图片尺寸为 100%），数值与画布拖角同步。也可直接拖动图片移动位置；拖四角默认等比缩放，按住 Shift 拖角可自由缩放，拖四条边可单独调整宽高。松手记录一次历史，Esc 或取消手势恢复拖动前的状态。也可以上传本地 PNG/JPG/WebP/GIF/AVIF，或输入 HTTP(S) 图片地址；支持填充方式、裁切位置和替代文字。
4. 支持复制、删除、恢复原始样式，最多 60 步文档历史。画布内使用 ⌘/Ctrl+Z 撤销，⌘/Ctrl+Shift+Z 重做。源码窗口和属性输入框保留原生文字撤销。
5. 「保存 HTML」保存可再次编辑的完整文件；「导出图片」生成页面图片。选框、编辑属性和运行脚本不会进入 HTML 成品。

文字、样式、替图、复制删除、源码修改及重新导入均进入历史。刷新后只恢复最后一份草稿，不恢复撤销栈。浏览器自动保存草稿失败时会提示，请导出 HTML 留档。

界面复用 MonaStudio 原版的正式标志、Lucide 图标、毛玻璃悬浮面板和底部胶囊工具条。低频属性折叠在「更多属性」中，文件名旁的设置按钮可以调整画布宽度、资源基础地址并打开示例。窄屏可通过右上角按钮打开文件与图层面板。

## 资源与支持范围

- 面向静态 HTML 和 CSS 的可视化编辑。导入的 JavaScript、事件属性、嵌套 iframe 和嵌入对象会移除，因此依赖 JavaScript 运行的 React 页面、表单交互等不会被还原。
- 工具依赖已随目录打包。普通 HTML、内联 CSS、Tailwind 默认工具类和嵌入图片可在离线环境编辑。Tailwind 编译结果写入导出文件；原文件中的 JavaScript Tailwind 配置不会执行。
- HTML 引用的远程图片、字体或 CSS 仍需要网络。相对资源可填写「资源基础地址」，例如 `https://example.com/assets/`。单个本地 HTML 文件不会自动获得同目录图片的访问权；可以上传替换图片，或将资源一起放到可访问的静态服务器。
- 本地上传图片以 data URL 嵌入 HTML，离开工具仍有效。远程图片保持原 URL。PNG 导出受浏览器跨域限制，不能读取的远程图片会提示改用上传；外部 CSS 背景图、滤镜和复杂 CSS 的图片导出仍受 html2canvas 支持范围影响。
- 图片导出会根据长图尺寸降低倍率以控制内存。过长页面会提示拆分。HTML 导入上限 20 MB，单张上传图片上限 15 MB；浏览器草稿存储通常更小。
- 导入文件中容易造成 DOM 名称冲突的少数 `id` / `name` 可能由 DOMPurify 移除。

## 复用编辑核心

`editor.js` 导出与框架无关的 `HtmlVisualEditor`。宿主需要加载 `vendor/purify.min.js`，如需 PNG 导出再加载 `vendor/html2canvas.min.js`，并保留相邻的 `vendor/tailwindcss-3.4.17.js`。

```js
import { HtmlVisualEditor } from './editor.js';

const editor = new HtmlVisualEditor(document.querySelector('iframe'));
await editor.load('<h1>可编辑标题</h1>');
editor.addEventListener('selection', event => console.log(event.detail));
editor.addEventListener('change', event => console.log(event.detail.html));
const html = editor.getHTML();
const png = await editor.exportPNG();
// 卸载时调用 editor.destroy()
```

iframe 使用 `sandbox="allow-same-origin allow-scripts"`。编辑核心先清理导入文档，再用 CSP nonce 仅放行随工具提供的 Tailwind 运行代码；导入脚本不会保留。文档中的远程图片、样式、字体仍可能向其来源请求资源。

主要方法：`load`、`select`、`setText`、`setStyle`、`setImage`、`setImageAlt`、`resetElement`、`duplicate`、`deleteElement`、`undo`、`redo`、`setPreview`、`getHTML`、`exportPNG`、`destroy`。事件：`selection`、`change`、`history`、`resize`、`load`、`error`。

## 验证

启动后打开 <http://127.0.0.1:8765/tests/>，自动运行 19 项浏览器回归测试：文档清理、CSS 与 Tailwind、文字样式历史、滑杆连续预览与单步撤销、原始样式恢复、复制删除、图片导入导出、资源地址与预览、普通 HTML 默认排版、实际 PNG 渲染、图片裁切像素比对，以及图片控制点、不同画布缩放倍率下的拖拽、等比与自由缩放、锚点保持、取消手势、导出重导入、嵌套缩放容器。

第三方依赖见 `THIRD_PARTY_NOTICES.md`。
