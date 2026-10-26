# 来源与致谢 / Credits

## 故事

- 原作：Fyodor Dostoevsky（陀思妥耶夫斯基），*White Nights / 白夜*，1848。
- 阅读与情节依据：Constance Garnett 英译，收录于 *White Nights and Other Stories*，Project Gutenberg #36034：[书目与文本](https://www.gutenberg.org/ebooks/36034)、[在线正文](https://www.gutenberg.org/cache/epub/36034/pg36034-images.html)。使用时请遵循该来源说明及所在地适用规则。
- 当前网站为纯英文：正文是 AI 辅助的扩写改编，不作为 Garnett 版本的逐字引文。早期中英对照稿的中文已从运行时内容移除，历史版本保留在 Git 提交中。
- 地图为文学空间示意，建筑、坐标路径和人物图形不是历史地理复原。

## 图像、声音与字体

- `public/assets/canal-night.png`、`morning-room.png`：2026-10-21 使用用户授权的课堂 **Easel / Qwen Image** 接口生成，模型 `qwen-image-2.1`。提示词、尺寸、日期见对应 JSON。生成工具参考课堂 `pfad/week05/request_image.py` 的接口和请求格式，重新编写为不包含凭据的标准库脚本。
- 3D 地图与穿长外套的梦想家标记：本项目用 Three.js 几何体和卡通材质构建，未下载第三方模型。纸张与水纹为程序生成的 CanvasTexture；细线的不规则偏移、雾、天空渐变和环境微粒均由代码生成，不使用外部贴图。
- `dreamer-portrait.png`、`nastenka-portrait.png`、`summer-street.png`、`rainy-embankment.png`：2026-10-22 使用同一课堂 Easel / `qwen-image-2.1` 接口生成，分别用于梦想家、娜斯坚卡的对话肖像，以及开场街景和雨中河岸。提示词见同名 JSON；这些是原创视觉改编，不是历史人物肖像或原作插图。
- 旧版程序剪影已移除；界面符号与地图标记由代码绘制。
- 背景音乐：`src/music.js` 中为本项目编写的短旋律与低音伴奏，使用 Web Audio 三角波、滤波和音量包络实时合成；无外部音乐或录音。
- 英文正文与控件字体：**Nunito Sans**，通过 `@fontsource-variable/nunito-sans` 5.3.0 本地打包，包含常规与斜体；SIL Open Font License 1.1，许可见 `public/licenses/nunito-sans-OFL.txt`。早期版本的 Manrope 已移除。

- 开场展示字体：Juan Montoreano 的 **Lilita One**，通过 `@fontsource/lilita-one` 5.3.0 本地打包；SIL Open Font License 1.1，许可见 `public/licenses/lilita-one-OFL.txt`。

作者提供的参考图片用于讨论构图和色彩，没有复制进项目资源。作者提出的《鼓手余命十日谭》用于说明以叙事体验为主的方向；本项目不使用其代码、美术或音乐。

首页布局参考 [The Monolith Project](https://themonolithproject.net/) 全屏场景、边缘控件、奶油色厚标题和柔和轮廓的视觉语言。检查其页面样式得到字体名 `BRCobane`；本项目早期使用开源 Manrope 重新设计，现统一为 Lilita One 与 Nunito Sans，没有复制其字体文件、代码、模型、声音或图片。

## 代码与工具

| 项目 | 用途 | 许可 |
| --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | 3D 渲染与 OrbitControls | MIT |
| [Vite](https://github.com/vitejs/vite) | 本地开发与静态打包 | MIT |
| [Playwright](https://github.com/microsoft/playwright) | 浏览器验证 | Apache-2.0 |
| Codex | 设计辅助、编程、双语改写、测试及文档 | AI 使用详情见 PROCESS.md |

应用代码是本次项目中 AI 辅助编写的实现，不是未修改的课堂或教程示例。依赖的完整许可保留在安装后的对应软件包中。

- `dreamer-portrait-literary-v2.png` and `nastenka-portrait-literary-v2.png`: generated on 2026-10-26 through the user-authorized classroom Easel API, model `qwen-image-2.1`. Shared art direction uses graphite contours and restrained watercolor inspired by illustrated literary books. These fictional character designs are visual interpretations, not historical portraits. Exact prompts and generation metadata are stored in their companion JSON files; the generation recipe is `docs/portrait-options/generate-literary-pair.py`.

- Current portraits: `dreamer-portrait-stylized-v4.png` and `nastenka-portrait-stylized-v4.png`, generated on 2026-10-26 with the authorized classroom Easel / `qwen-image-2.1` API. Simplified ink contours, flat color and lavender cel shading replace the previous watercolor realism. Companion JSON files contain exact prompts; `docs/portrait-options/generate-stylized-pair.py` contains the generation recipe.

- Current female portrait: `nastenka-portrait-stylized-v6.png`, generated through the authorized classroom Easel / `qwen-image-2.1` API on 2026-10-26. Refined facial proportions retain the approved flat-color palette. Prompt and metadata are in the companion JSON; generation recipe: `docs/portrait-options/generate-nastenka-refinement.py`.
