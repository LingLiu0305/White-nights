# 来源与致谢 / Credits

## 故事

- 原作：Fyodor Dostoevsky（陀思妥耶夫斯基），*White Nights / 白夜*，1848。
- 阅读与情节依据：Constance Garnett 英译，收录于 *White Nights and Other Stories*，Project Gutenberg #36034：[书目与文本](https://www.gutenberg.org/ebooks/36034)、[在线正文](https://www.gutenberg.org/cache/epub/36034/pg36034-images.html)。使用时请遵循该来源说明及所在地适用规则。
- 中文正文为 AI 辅助的扩写改编；英文是与中文逐段对应的改写。两者均不作为该版本的逐字引文，不使用现代中文出版译本的连续文字。
- 地图为文学空间示意，建筑、坐标路径和人物图形不是历史地理复原。

## 图像、声音与字体

- `public/assets/canal-night.png`、`morning-room.png`：2026-10-21 使用用户授权的课堂 **Easel / Qwen Image** 接口生成，模型 `qwen-image-2.1`。提示词、尺寸、日期见对应 JSON。生成工具参考课堂 `pfad/week05/request_image.py` 的接口和请求格式，重新编写为不包含凭据的标准库脚本。
- 3D 地图：本项目用 Three.js 几何体和卡通材质构建，未下载第三方模型。
- 人物剪影、纸张纹理和界面符号：本项目 SVG / CSS / 几何体绘制。
- 背景音乐：`src/music.js` 中为本项目编写的短旋律与低音伴奏，使用 Web Audio 三角波、滤波和音量包络实时合成；无外部音乐或录音。
- 字体：[Noto Serif SC](https://fonts.google.com/noto/specimen/Noto+Serif+SC)，Google Fonts，SIL Open Font License；不可用时使用设备系统字体。仓库不包含系统字体文件。

作者提供的两张参考图片用于讨论构图和色彩，没有复制进项目资源。作者提出的《鼓手余命十日谭》用于说明以叙事体验为主的方向；本项目不使用其代码、美术或音乐。

本轮首页布局参考 [The Monolith Project](https://themonolithproject.net/) 将主体置于中央、控件留在边缘的构图方式；没有复制其代码、模型、声音或图片。

## 代码与工具

| 项目 | 用途 | 许可 |
| --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) | 3D 渲染与 OrbitControls | MIT |
| [Vite](https://github.com/vitejs/vite) | 本地开发与静态打包 | MIT |
| [Playwright](https://github.com/microsoft/playwright) | 浏览器验证 | Apache-2.0 |
| Codex | 设计辅助、编程、双语改写、测试及文档 | AI 使用详情见 PROCESS.md |

应用代码是本次项目中 AI 辅助编写的实现，不是未修改的课堂或教程示例。依赖的完整许可保留在安装后的对应软件包中。
