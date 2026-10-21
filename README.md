# 白夜 · White Nights

一部中英对照的网页交互叙事，改编自陀思妥耶夫斯基《白夜》。探索微缩彼得堡，跟随梦想家的标记走入四个夜晚，在插画、剪影和文字之间经历相遇、等待与告别。

A bilingual narrative website after Dostoevsky’s *White Nights*. Explore a miniature Petersburg, follow the dreamer to each meeting, and read the story in paired Chinese and English. The ending follows the novel; the reader controls exploration and pacing.

![可旋转的故事地图](docs/screenshots/map-desktop.png)
![中英对照阅读](docs/screenshots/reading-desktop.png)

## 体验与目标读者

面向喜欢文学、视觉小说和短篇故事的读者，无需预先读过小说。当前版本为 **57 段精简改编**，包含四夜及清晨尾声；约 10–15 分钟，双语细读时间会更长。它不是小说全文，也不是任何已出版中译本的逐字引用。

1. **探索地图：**拖动旋转、滚动缩放；点击建筑标签、相关建筑或下方地点按钮，查看双语介绍。
2. **走进一夜：**点击“开始第一夜”，金色标记沿示意路线移动；可跳过过场。到达后进入二维阅读画面。
3. **控制阅读：**点击“继续”或文字，或在阅读区域按空格 / 右方向键。逐字显示时，第一次操作补全两种语言，下一次推进故事。
4. **回来继续：**对话记录保留本章已读文字；返回地图、刷新或关页后可从本机保存位置继续。已读章节可以重读，各章进度独立保存。
5. **重新开始：**地图页“关于白夜”→“重新开始”→确认。环境音默认关闭，可在地图页开启或关闭。

## 在 VS Code 运行

需要 Node.js **22.12+**（或符合 Vite 7 要求的 Node 20.19+），以及现代浏览器。实际验证环境为 Node 26.2.0、npm 11、桌面 Chrome。推荐使用支持 WebGL 2 的浏览器；无法显示 3D 时仍可通过文字地点入口阅读。

用 VS Code 打开项目目录，在该目录的终端执行：

```sh
npm ci
npm run dev
```

打开终端显示的地址，默认是 **http://127.0.0.1:5173/**。按 `Ctrl+C` 停止。不要直接双击 `index.html`，本项目需要开发服务器处理模块导入。

第一次安装依赖需要网络。**读故事不需要 API key、付费账号、Python 或在线 AI 服务**；两张插画已包含在仓库中。Google Fonts 无法连接时会回退到系统字体。

生产版本：

```sh
npm run build
npm run preview
```

打开终端显示的预览地址，默认 **http://127.0.0.1:4173/**。静态成品位于 `dist/`，使用相对资源路径，适合部署在 GitHub Pages 子目录。当前尚未发布公开体验链接。

## 检查

```sh
npm test
npm run build
npm run test:e2e
```

单元测试检查章节解锁、进度恢复、重读、损坏 / 不可用的存储及双语内容完整性。浏览器测试检查完整五章、桌面与手机尺寸、键盘、逐字显示、历史记录，以及 WebGL、背景图片和存储失败后的阅读。

浏览器测试配置使用**已安装的 Google Chrome**，会自动启动开发服务器，或使用已经运行的 5173 端口。测试截图写入忽略提交的 `test-results/`。自动测试不能替代真人试读；记录待填写，见 [PROCESS.md](PROCESS.md)。

## 项目结构

| 文件 | 内容 |
| --- | --- |
| `src/content.js`、`src/content-en.js` | 中文改编、英文对照、地点介绍、章节路线和剪影提示 |
| `src/story.js`、`src/main.js` | 状态转换、各章进度，以及按钮与画面的连接 |
| `src/map.js` | Three.js 建筑、卡通材质、拾取、视角和标记移动 |
| `src/style.css`、`index.html` | 地图页面、双语阅读与手机布局 |
| `public/assets/`、`tools/generate_assets.py` | 已生成插画、提示词记录及可选生成工具 |

两种语言按章节及段落一一对应；修改或增加段落时同步编辑两个内容文件，再运行 `npm test`。可用于课堂解释的交互链：`start-story` 点击 → `START` 转换状态 → `map.travel()` 移动标记 → `ARRIVE` → 显示本章中英文字。

## 素材生成（可选）

此项目是浏览器项目；只有可选的生成工具使用 Python 标准库，**没有额外 Python 依赖**。已有插画不会重复生成。

若需要生成缺失素材，将课堂凭据放在仓库外的 `.env` 文件中，格式为 `EASEL_KEY=你的凭据`。安装 `uv` 后运行：

```sh
uv run --no-project --python 3.12 tools/generate_assets.py --env /absolute/path/to/classroom/.env
```

工具调用课堂 Easel 接口的 `qwen-image-2.1`，可能消耗课堂额度。它仅在开发阶段运行，凭据不进入网页或素材元数据。完整提示词、尺寸和生成日期记录于图片旁的 JSON 文件。

## 当前边界

- 地图是文学空间示意，不复原真实路线；多个夜晚在同一河岸会面。标记移动后淡入插画，当前不做电影式镜头跟随。
- 人物是简化剪影；四夜共用一张河岸插画，通过色调和人物关系变化区分，清晨使用独立室内图。
- 固定结局和精简对白属于设计选择；中英文均为项目改编，仍欢迎对照原著进一步审校。
- 进度只保存在当前浏览器，不跨设备同步。无存储权限时会显示提示，仍可完成当前阅读。
- 已检查 Chrome 桌面及手机尺寸模拟，尚未在真实手机及所有浏览器上测试，也尚未完成真人试读。

创作与试读：[PROCESS.md](PROCESS.md) · 来源：[CREDITS.md](CREDITS.md) · 仓库：[LingLiu0305/White-nights](https://github.com/LingLiu0305/White-nights)
