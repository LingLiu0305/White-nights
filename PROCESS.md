# 创作过程 / Process

## 项目状态

2026-10-22：本地可运行的双语原型，第三轮按作者反馈改为英文主导界面与独立角色肖像，新增场景插图。设计、素材、代码和自动检查已进行；**另一位真人的独立试读尚未进行**，下方保留真实记录入口。本文由 AI 辅助整理，项目作者应在提交前核对是否准确反映自己的参与和决定。

## 从想法到交互

起点是《白夜》每一夜的对话，尤其第四夜最后的相遇与离开。项目作者选择遵循原著的固定结局，认为阅读故事本身就是主要体验，不需要用改变结局来证明选择有分量。

空间设计参考作者提供的微缩地图网页截图；美术方向参考另一张有细线描边、分层明暗和柔和色彩的插画。最初选择可点击的真实 3D 地图，到达章节地点后进入二维背景、人物剪影和文字组成的阅读画面。第三轮将剪影替换为独立角色肖像，详见末节。

交互的因果关系是：点击地点显示对应介绍；开始一夜让标记移动并进入章节；继续操作改变中英两种语言的当前段落与人物位置；完成一夜解锁下一夜。地图探索不提前揭示关键结局，也不影响固定故事走向。

## 实际调整

| 观察或需求 | 调整 | 原因 |
| --- | --- | --- |
| 作者希望忠于原作，重心在对话 | 放弃多结局或带后果的选项系统 | 将制作时间用于阅读节奏和第四夜场景 |
| 同一河岸承载多夜会面 | 地点与章节分开组织 | 不为了展示地图而强行更换小说地点 |
| 作者新增中英对照要求 | 初版 57 段正文、说话人、地点说明、记录和结束语配对显示 | 阅读推进与存档共用同一段落位置 |
| 独立代码审查发现：重读覆盖尚未读完的章节位置 | 改为每章独立保存阅读位置，补充回归测试 | 重读后可以返回原来的段落 |
| 独立代码审查发现：3D 显示中途失效后可能停在过场 | 失效时退出地图控制，后续直接进入阅读 | 错误不阻断核心故事 |

视觉检查还发现建筑和标签容易遮住主角标记，因此把标记作为始终可见的引导符号绘制，并将地点标签上移。手机双语正文采用上下排列与可滚动区域，避免长段落挡住继续按钮。

实际实现采用固定构图下的标记移动与画面淡入，没有实现设计稿里可选的镜头跟随。两张插画与程序地图共用紫灰、青绿及暖纸色色调。

## AI 使用记录

**Codex（本次编码助手）**协助需求梳理、方案讨论、代码、精简中文改写与英文对应文本、测试、文档和问题修复；独立 AI 代码审查提出了上述两项进度 / 故障恢复问题。生成文本不是声称由作者独立翻译的出版译文。选题、固定结局、地图转二维画面和双语阅读方向来自项目作者的选择。

**课堂 Qwen Image API**（Easel 接口，`qwen-image-2.1`）先生成河岸夜景、雨晨房间两张背景，第三轮再生成两位角色肖像、夏日街景和雨中河岸。完整提示词和生成信息位于 `public/assets/*.json`。调用凭据读取自仓库外的课堂环境文件；网页运行不调用 AI 服务。地图建筑由代码绘制，初版程序剪影已移除。

- **保留的建议：**把地图探索和章节阅读分成两个清楚的界面，用移动标记连接它们；为不支持 3D 的设备保留文字入口。
- **改变或拒绝的建议：**早期关于让玩家选择改变经历、强化选择后果的方向，被作者改为忠于原著、重在叙事的固定结局体验。没有加入开放世界移动或复杂分支系统。

## 自动验证与画面检查

测试先覆盖章节规则，再实现状态逻辑；审查提出的进度问题也先用失败用例重现，再修复。双语加入后增加逐段配对检查。

已检查章节锁定、重复启动、刷新恢复、重读保留主线进度、空 / 损坏存档、拒绝存储、缺失背景、WebGL 初始化失败与运行中失效。浏览器流程覆盖五章固定结局、键盘继续、逐字显示、历史记录、重置，以及桌面和 390 × 844 手机尺寸。

浏览器减少动态效果配置最初放在了错误位置，导致测试把正常过场等待判为失败；调整为 Playwright `contextOptions` 后重新验证。截图用于检查排版、人物关系和正文对比度，保存在 `docs/screenshots/`。

最终检查：11 项单元测试、8 项浏览器测试通过；全新依赖安装和生产打包成功。依赖检查发现旧 Vite / esbuild 的已知问题，已更新至兼容修复版本，最终 npm audit 报告 0 项漏洞。

这些是开发检查，**不是作业要求的另一位真人试用**。

## 真人试读：待完成

请至少邀请一位其他人，在解释操作方式之前独立尝试。建议只说：“请试着读完第一夜，之后随意探索。”不需要记录姓名、照片或录音。

| 待填写内容 | 实际记录 |
| --- | --- |
| 日期、设备和浏览器 | 待试读 |
| 对方首先尝试了什么 | 待观察 |
| 在哪里停顿、误点或提出问题 | 待观察 |
| 是否理解地点介绍、章节入口和继续阅读 | 待观察 |
| 基于观察做出的修改，或保持设计的理由 | 待决定；注明相关提交 |

特别观察双语文字是否清楚、地图移动能否表达进入章节、第四夜人物离开是否可理解。不要把预期问题写成已经发生的用户反馈。

## 提交前仍需完成

1. 完成并记录至少一次真人试读，落实一次改进或说明保留设计的理由。
2. 作者核对中英文本及来源，选择是否继续扩充节选。
3. 按 README 从新终端运行，确认素材、截图和文档齐全。
4. 将确认后的版本推送到自己的公开仓库，在退出 GitHub 登录后检查仓库链接。
5. 于 2026-11-01 23:59（香港时间）前在 Canvas 提交仓库 URL。

## 第二轮：作者完整阅读后的反馈（2026-10-21）

作者读完五章后指出：第一夜开始突兀，文本太少；首页左右分栏显得古板，希望参考 The Monolith Project，把模型放在中央。截图显示过场文字与首页重叠、英文选中后对比度不足。随后作者补充 BGM 无法播放。

这属于**项目作者的体验反馈**，不是另一位独立使用者的作业试读。

1. **重写故事结构。** 从原著开头的城市熟人、房屋、夏季迁居和独居生活写起，再进入出城散步、河岸相遇；补足第二夜梦想家的生活和娜斯坚卡与房客的往事。第三夜明确“雨天回忆昨夜”的顺序，第四夜保留未来住处、薪水与看戏等具体计划，让告别有足够铺垫。正文由 57 段扩展到 152 段，约 6,187 个中文字符、3,729 个英文单词；仍是改编而非全文。
2. **校正顺序。** 对照 Garnett 文本，将得知娜斯坚卡姓名放回第二夜。中英正文改为同一条记录，按场景分组，避免两个数组在扩写时错位。
3. **中央地图。** 去掉侧栏宣传文案和表格式章节卡片，采用中央场景、边缘信息、下方浮动章节入口；地点目录仍提供键盘入口。过场期间隐藏首页标题、章节与操作区。
4. **阅读细节。** 增加场景提示和上一段；选中文字改用深色字配浅金底。代码复查进一步发现双击的第一下会先翻页，因此正文不再承担翻页操作，选择开始前会结束逐字显示，保留按钮及键盘推进。
5. **音乐。** 初版只有较轻的持续低音，缺少可辨认的旋律和阅读页控制。本轮改为原创短旋律与低音伴奏，增加阅读页播放 / 暂停和音量滑块。浏览器验证不仅检查按钮状态，也在音频输出链上采样，确认存在非零音频信号；另测设备不可用时的反馈。实际扬声器、系统音量或标签静音仍由设备决定。

旧版存档的段落编号已失效：迁移时保留章节解锁，并回到新版开头，告知用户发生了文本更新。独立 AI 审查及自动测试仍不能替代真人试读。

第二轮最终验证：14 项单元测试、12 项浏览器测试全部通过，生产打包成功。浏览器测试覆盖全部 152 段中英配对正文、返回上一段、真实双击选词、音乐输出信号、播放失败反馈及桌面 / 手机横竖屏。一次完整检查在首次页面加载时超时；排除可选 Google Fonts 的外部网络依赖后，全套流程在 47.9 秒内通过，验证了系统字体回退。新版截图已替换到 `docs/screenshots/`。

## 第三轮：英文主导与角色肖像（2026-10-22）

作者继续指出：主页仍显拘谨，要求学习 The Monolith Project 的字体和排版，让主体更大、英文为主、删除装饰性小字；原来的两个剪影显得诡异，应该生成与小说及场景相符的人物，并将姓名、肖像和对白分开。

1. **字体与版式。** 直接检查参考站点显示文字的计算样式，字体为 `BRCobane`。采用可随项目分发的开源 Manrope 作为相近的无衬线方向，字体随应用本地打包。主页使用大幅 WHITE NIGHTS 标题、放大的城市、边缘入口；删掉坐标、指南针、标语和重复编号。没有使用参考站点的私有字体文件或美术资产。
2. **人物素材。** 使用作者授权的课堂 Easel / Qwen API 生成梦想家与娜斯坚卡的胸像：26 岁梦想家穿朴素灰蓝外套；娜斯坚卡戴浅黄色帽子、披深色短斗篷。二人朝向对白中心，采用细线和柔和色块。全部提示词保存在同名 JSON。两次生成期间的网络中断只重试未生成的素材，已有文件保留，凭据仍在仓库外。
3. **阅读排版。** 删除程序剪影。梦想家说话时肖像与姓名在左，姑娘 / 娜斯坚卡说话时在右；文字始终占独立栏。英文在上、中文对照在下。旁白、内心独白和信件不显示正在说话的头像。未知姓名阶段仍显示 The young woman。手机竖屏将头像缩小并放到文字上方对应的一侧，横屏保留紧凑分栏。
4. **场景扩充。** 新增夏日街景用于开头的城市与居民迁居，新增雨中河岸用于第三夜回到当日的等待。保留室内和原来的河岸场景，共四张背景。正文仍为 152 段，段落编号不变，本轮不重置已有阅读进度。
5. **保留与改变。** 保留作者提出的左右区分说话者；放弃上一版将人物置于画面中央的做法，并移除大块胶囊式章节面板。生成肖像采用固定表情，避免在未经过设计与验证的情况下加入表情切换。地图与正文的核心交互保持可解释、可重读。

复查发现 568 × 320 手机横屏的正文高度会归零，先以失败测试重现，再添加短屏布局修复。手机竖屏还修正了自动网格布局把翻页按钮放到正文上方的问题。测试覆盖人物左右切换、图片确实加载、姓名不提前揭露、肖像缺失仍能显示姓名并继续阅读，以及上下区域不重叠。真人独立试读仍待完成，不把作者反馈、AI 审查或自动测试作为替代。

第三轮最终验证：14 项单元测试、15 项浏览器测试全部通过；生产打包成功。构建中的两张肖像使用相对路径，字体许可随静态网站输出。已保存新版首页、左右对话、手机及小屏横屏截图。本轮只保存在本地分支，未推送或发布。

## 首页标注修订（2026-10-22）

根据作者在截图上的具体标注，将首页绿色渐变改为白色；WHITE NIGHTS 改为浅色填充、深色描边与轻微硬边阴影。地点标注使用低不透明度白底、细引线，减弱矩形标签感。继续入口改为文字配独立直角箭头框，移除大块绿色圆角底。

模型裁切来自局部 WebGL 画布的上下边界，仅修改 CSS 溢出不能解决渲染裁切。因此将画布扩展到整页，并按新尺寸调整正交相机，保留初始模型比例；放大时建筑可进入标题和底部区域。桌面主流程、手机布局与过场检查通过；另检查放大、恢复视角及画布覆盖完整页面，生产打包成功。更新首页和放大截图，保留本地提交。

## 第四轮：从沙盘到沉浸式河岸（2026-10-22）

作者进一步明确希望第一眼看到铺满屏幕的白夜城市，替换上一轮白底、完整展示等距模型的方向。本轮以作者提供的 The Monolith Project 截图讨论镜头、厚标题和手绘色彩，没有复制参考网站的物件或资产。

1. **构图与模型复用。** 保留原有桥梁、街区、树木和道具，改用受限透视镜头；移除矩形底座，将河岸延伸至视口之外，补充远景街区和近景建筑。河流贯穿前后，两侧立面包围桥梁，雾弱化远处轮廓。手机采用独立视野和镜头位置。
2. **材质与绘制。** 程序生成纸纹、颜色斑驳和短笔触，作为模型表面的真实贴图；将几何边缘细分并轻微扰动，以灰紫色细线绘制。卡通明暗、暖窗、薰衣草色雾、水纹和少量微粒共同构成氛围。没有仅在屏幕上叠加噪点；文字与按钮不经过颗粒处理。将静态建筑按材质合并，互动对象单独保留身份，减少街区扩展后的绘制次数。
3. **入口与动态。** 开场使用本地打包的 Lilita One 双行奶油色标题，镜头约 4.2 秒靠近，标题退出；减少动态效果模式直接显示可操作状态。底部整合五段章节进度，地图名默认隐藏，悬停或聚焦后出现；触屏首次点击显示名称，第二次进入。地点点击先移动镜头，再打开双语介绍。章节选择协调镜头及光色；原有故事、独立章节进度和声音控制保留。
4. **审查与改进。** 独立 AI 代码审查发现：地点镜头移动期间若打开 About，延迟弹出的地点介绍会抢走焦点。先用普通动态模式的浏览器测试重现，再用操作序号使后续菜单操作取消旧的地点请求。触屏地点操作、568 × 320 横屏入口、键盘地点访问和开场标题退出都有专门检查。
5. **保留与拒绝。** 保留 AI 提出的复用现有建筑、程序生成材质和按材质合并的方案；改变此前完整展示底座的相机，拒绝沿用白色留白、立体细线字和永久标签。没有为了这轮 3D 材质调整调用图像生成 API，也不新增服务依赖。作者反馈、AI 审查和自动检查仍不是作业要求的独立真人试读。

第四轮最终验证：14 项单元测试与 19 项浏览器测试全部通过，生产构建成功。浏览器检查包括完整 152 段正文、真实音频输出、普通 / 减少动态效果、触屏两次点击地点的交互、键盘访问、手机横竖屏、WebGL 失效与镜头转场中断。保存开场、桌面探索和手机截图。Three.js 构建分块仍有约 553 kB 的体积提示；本轮没有扩充运行时外部服务依赖。真实手机性能和独立真人试读尚未验证。只保存本地版本，未推送或发布。

## English reading edition and refined map character (2026-10-23)

The author requested an English-only submission, noting that narration retained empty portrait columns and the opaque reading band obscured the illustration. The abstract sphere-and-cone map character also needed more detail.

- Removed Chinese prose and metadata from runtime content, as well as Chinese elements in dialogue, history, location descriptions, endings, About, confirmations and feedback. Retained the exact order and English text of all 152 paragraphs. The save format and content revision are unchanged, so this visual/language edit does not reset progress.
- Narration and inner voice now span the available reading width. Reduced the main text size and removed the fixed minimum paragraph height; lowered the reading band and gave it a translucent gradient. Dialogue retains separate portrait positions, with smaller portraits. Mobile and short landscape layouts keep scrolling and navigation available.
- Replaced the pawn with a procedural miniature wearing a grey-blue wool coat, lapels, buttons, sleeves, trousers and boots, with hair and a simple face. A separate depth pass keeps the wayfinding character visible over buildings while correctly occluding its own body parts. It turns toward its route while moving. No image API was needed for this geometry change.
- Kept the AI suggestion to span the narration columns rather than merely hiding portraits. Rejected the old opaque paper band and universal three-column layout. Moved location pins above the figure so the symbol does not cover its face.
- Independent AI review checked preservation of paragraph order, English-only runtime data, DOM references and character rendering. It found no actionable defects. This review is not the assignment’s required independent human trial.

Verification: 14 unit tests and 20 browser tests passed; production build succeeded. Updated desktop, phone, portrait and narration screenshots. Existing Three.js size warning remains. Changes saved locally, not pushed or published.

## Dialogue stage — first visual study (2026-10-23)

Following the UI audit and the author's request to see a first version, added an isolated `reader-stage.css` study: a shallow translucent violet frame, cream serif prose, attached speaker nameplates, and larger portraits extending into the scene. Narration uses a quieter nameplate and a constrained reading measure without empty portrait columns. Phone layouts lift the portrait above the frame; short landscape keeps it beside the text. Existing portraits are softly masked for this study; they are not newly generated transparent waist-up assets. No image API requests or credits were used.

Targeted browser checks passed for narration, alternating speakers, missing portraits, reading/history/save flow, ordinary motion, text selection, actual audio, phone layout and short landscape. The side-switch test now measures the current paragraph bounds because text padding deliberately changes with speaker side. Stored text and progress remain unchanged. This version is a reviewable design study; the proposed new illustrations, letter treatment and mobile sound popover are not part of it.

## Walkable city and visual review (2026-10-23)

The author asked to move the miniature dreamer with the arrow keys before the next chapter, highlight locations while walking, remove the pale glow behind dialogue portraits, add a homepage restart, and fill the empty edges of the city. I used the installed `design-taste-frontend` skill as a visual audit. Its checklist exposed a weak primary action and very small home controls. The city itself is an interactive canvas, so the skill’s photographic and scroll-page checks do not directly describe this experience; I retained the project’s lavender night palette and chapter progress lines.

- Added a walkable canal route across both banks and two bridges. Walking is constrained to paving, diagonal speed is normalized, holding arrows moves continuously, and W/A/S/D does nothing. Nearby places highlight and show an Enter prompt; the same descriptions remain available by pointer, touch and the Places directory. The chapter transition now begins at the dreamer’s current position and stays on the paved route. Moving or restarting does not alter story text or chapter unlock rules.
- Extended the procedural city with sixteen additional facades at the outer streets and foreground. Their varied roof lines and warm windows close the side gaps while the water and bridges remain the central view. The camera may turn somewhat farther, but still has limits that preserve the composition.
- Kept the existing portraits and replaced the broad radial mask with individual cut-paper contours and a narrow warm backing. No API image generation was needed. Made the reading frame a flatter, more translucent violet so the scene remains visible.
- Added `Restart story` to the homepage, reusing the existing confirmation. Cancel preserves progress; confirm clears the saved story and returns to First Night. Raised the primary chapter button’s size and contrast, made its action visually distinct, increased desktop control text where space permits, and made the introductory line explain that this is a story to walk through.
- Applied the taste audit to before and after browser renders. The meaningful findings were the sparse side edges, a hard-to-see start action, and temporary title/chapter overlap as the entrance ended. I filled the edges, made the action a clear button, and separated the title fade from the chapter controls. I did not add unrelated stock photography or a video to a one-screen 3D narrative.

The author’s feedback drove these revisions. The assignment still requires a separate person to try the final experience; that trial has not been claimed here. No external service or new asset was used in this round.

Final code review found two small interaction gaps: a chapter journey could have only one waypoint when the dreamer was already at its destination, and proximity highlighting could mask a place explicitly selected on touch. I made same-place journeys interpolate between two identical waypoints with a short transition, and gave explicit selection priority over proximity. Regression tests cover returning to a chapter from its destination with normal motion and keeping a tapped place highlighted after focus moves. Eighteen unit tests and the targeted browser checks passed; the production build succeeded with the existing Three.js size warning. The earlier full browser suite passed before these targeted fixes. Screenshots and the [taste review](docs/taste-review-2026-10-23.md) are committed with this iteration.


## Continuous Petersburg streets (2026-10-26)

The author found that rotating the camera still exposed empty ground and asked for the approved city-improvement list to be implemented directly. Extended the scenery into 64 paired outer blocks (128 simplified building volumes), with cross streets connecting the visible rows. Detailed canal buildings now vary between pitched, hipped and parapet roofs; selected facades have recessed arched gates and pilasters. A smaller pink house recalls the house described in the novel's opening. It is a scenic literary reference, not a new chapter or an asserted real address. Added quay stone joints and delayed the fog so the background reads as a city before it fades.

The first rotated previews showed foreground roofs hiding the canal. Revised the camera envelope to rise and pull back gradually toward the side-angle limits, and brought its target toward the two bridges. Distant windows share flat geometry with wider spacing; existing static batching is retained. The first cold software-WebGL preview took about 4.5 seconds including a deliberate one-second settling wait, so this is not a real-phone performance claim.

Kept the taste review's emphasis on one clear river/bridge focus and subject-specific imagery. Rejected further identical detailed houses as the only solution, and used varied near facades plus simpler perimeter streets. No new image generation was needed. Captured default, left/right rotation limits, zoomed-out and mobile previews in `docs/screenshots/city-*.png`. The assignment's separate human trial remains pending.

References: [White Nights, opening passages](https://www.gutenberg.org/files/36034/36034-h/36034-h.htm), and [UNESCO: Saint Petersburg historic centre](https://whc.unesco.org/en/list/540/). The geometry remains a literary interpretation, not a historical reconstruction.

Verification: 18 unit tests passed. Five affected browser flows passed after the final camera adjustment: first-night reading/history/reload, arrow-key walking, mobile reading/reset, animated chapter travel and touch place selection. Production build and diff checks passed; the existing Three.js chunk-size warning remains. Browser captures reported no runtime errors. Code and visual re-review confirmed the earlier roof-occlusion and distant-window concerns were addressed. Real-phone performance still requires a human-device trial.


## Typography matched to the opening title (2026-10-26)

The author rejected the modern rounded Manrope appearance in About and asked for the interface to match the existing cream Lilita One wordmark. After approving Lilita One with Nunito Sans, we kept Lilita One for display/section headings and used Nunito Sans for body text, dialogue, speaker names and controls. Removed the Georgia dialogue override and Manrope dependency. Nunito Sans regular and italic are bundled locally, with its OFL license recorded in CREDITS.md. About now has a smaller display heading, relaxed tracking and a constrained reading measure.

Five affected browser checks passed: tablet map label spacing, mobile reading/reset, portrait/nameplate placement, short phone landscape and English narration. The production build passed with the existing Three.js chunk warning. Chrome confirmed both font families loaded; desktop About, mobile About, homepage and dialogue screenshots were visually inspected. No independent human trial is claimed.


## Fixed dialogue frame (2026-10-26)

The author found “Inner voice” awkward and asked for a fixed dialogue frame while keeping the typewriter reveal. Reflective passages now display “The Dreamer” in both the stage and history, while keeping their narration layout and existing story indices. The frame has a fixed height per viewport and a shared outer width across narration and spoken dialogue. Text scrolls inside its reserved space; Back/Next and the progress line remain anchored. The typewriter and reveal-before-advance behavior are retained.

Added a browser regression comparing frame and Next-button bounds during partial text, completed text and a switch from narration to dialogue. It also verifies the new name in stage/history. This and the affected portrait, narration and small-landscape checks passed (four checks on the final revision); the production build passed with its existing Three.js size warning. Desktop and mobile screenshots were inspected.


## Compact paragraphs and centered chapter headings (2026-10-26)

After reviewing the fixed frame, the author asked for less empty space on short passages. The frame now measures an invisible, accessibility-hidden copy of the complete paragraph before the typewriter starts. Each passage can choose a suitable height without resizing during its reveal; long paragraphs retain an internal scroll area. This supersedes the viewport-fixed height from the previous revision. Narration has no speaker nameplate, and history omits its redundant Narration label. Reflective first-person passages still identify The Dreamer.

Equal-width header side columns center the chapter heading independently of the Map and Sound/History controls. On narrow phones the heading has its own centered row. Six relevant browser checks passed, covering stable reveal geometry, compact paragraph sizing, centered headings, hidden narration labels, portrait placement, narrow landscape reading and reveal-before-advance behavior. The production build passed with the existing Three.js chunk warning. Desktop and fresh mobile screenshots were inspected; no independent human trial is claimed.


## A matched pair of literary portraits (2026-10-26)

The author found the original male portrait too anime-like beside the new female candidates and requested a more coherent period-literary direction. Both portraits were regenerated through the authorized classroom Qwen API with a shared specification for graphite contours, watercolor shading, ivory paper, restrained lighting and natural facial proportions. The Dreamer now has a modest side part and adult facial structure; Nastenka keeps a youthful, gently smiling expression, ochre bonnet and charcoal cape. The aim is period and visual coherence, not a claim that Russian people share one facial type.

Versioned assets preserve the previous portraits. The runtime now uses the matched pair, with adjusted CSS paper-cut outlines to fit their hair and shoulders. The user accepted the shared direction; final images have not yet received user feedback. The portrait-placement and short-landscape browser checks passed, and the production build passed with the existing Three.js size warning. Both desktop dialogue screenshots were visually inspected. Prompts and model metadata accompany the images.


## Matching the portraits to the game (2026-10-26)

The author felt the matched watercolor portraits were still too realistic for the illustrated city and UI. The new direction uses simplified faces, fine grey-violet outlines, broad flat colors and limited lavender shadow shapes. Both characters were regenerated via the classroom Qwen API. The first pass was rejected because it added architecture behind the figures; the final prompts explicitly exclude scenery and simplify the eye treatment. The chosen pair is deliberately stylized rather than historically reconstructed or photorealistic.

Updated the runtime image references and fitted narrower cream paper-cut outlines to the new silhouettes. Original versions remain available. Both desktop dialogue screenshots were inspected in the real browser. Portrait placement (including mobile) and missing-image recovery checks passed, as did the production build with its existing Three.js bundle warning. Updated the missing-image test URL pattern to cover versioned portrait filenames. No human playtest or user approval of the final images is claimed.


## Refining Nastenka while keeping the Dreamer (2026-10-26)

The author approved the male sprite but requested a different female face. Only Nastenka was regenerated, using smaller eyes, a clearer nose bridge, defined cheeks and a longer oval face while retaining the flat colors and lavender shadows. The first refinement was rejected because its round-eyed proportions remained too similar to the previous version. The selected version uses more economical ligne-claire facial structure. This is an individual fictional character design, not a claim that nationality has one fixed appearance. The Dreamer asset is unchanged. Updated the female paper-cut outline and runtime reference; the prior version remains available. The portrait browser check passed for desktop and mobile placement, and the production build passed with the existing Three.js warning. Inspected the actual desktop dialogue screenshot.


## PC interaction specification and prepared memory scenes (2026-10-27)

The author narrowed the next iteration to PC keyboard/mouse play and requested an English introduction crediting Dostoevsky's White Nights. Updated the design specification with complete Intro copy, entry/replay/reset rules, and a PC-only acceptance scope. Checked the actual walking implementation before documenting its current coordinates, speed, bridge corridors and proximity radius. Proposed camera-relative arrow movement, trigger hysteresis, collision/path consistency, focus rules and safe position persistence are explicitly future work.

Generated two missing memory illustrations with the authorized classroom Qwen API: the grandmother's sitting room and the upstairs landing with a bundle. Inspected both images and verified PNG dimensions (1536×1024) and generation metadata. The landing's stair direction differs from the prompt, so the specification avoids relying on stair direction. Intro, waiting, rain and morning can reuse existing scenes; interactive envelopes and text will use SVG/CSS/DOM when implemented. No runtime interaction code changed in this revision, and no new playtest is claimed.


## PC narrative interactions: P1 + P2 (2026-10-27)

The author approved a three-round implementation plan and asked for autonomous local iteration. We kept the existing JavaScript/Three.js/Vite stack, English adaptation, illustrations, portraits and fixed ending. P3 expression branches and illustrated memories remain deferred; the already generated memory images are preserved. No image API or new environment-audio request was made during this implementation.

Round 1 introduced the full English Intro, stable paragraph IDs, backward-compatible saves and camera-relative arrow walking. Keyboard movement belongs to the focused canvas, uses normalized directions and subdivided collisions, and stops on dialogs, lost focus or backgrounding. Nearby places use separate enter/exit radii and a paved-path check. Chapter selection and Reset view preserve player position; Begin/Continue provides an automatic route and explicit skip.

Round 2 added opening observation, third-night waiting, the interleaved morning letter and evolving place memories. Hotspots are real buttons positioned for the background’s cover crop; the adjacent list offers the same actions by keyboard. Letter text stays in the DOM. Its first two passages lead back to the dreamer’s reaction before the last paper passage. Every optional moment has a continue or classic-reading route.

Round 3 added accepting the sealed letter, turning attention toward a code-drawn distant figure and keeping one original passage per chapter. The letter handoff narration was minimally changed so the prose does not complete the action before the player acts. The established delivery and ending are unchanged. Restart explicitly clears all story/interaction/keepsake state.

AI assistance: Codex implemented code and tests, wrote original supplementary observation text and documentation, and inspected browser screenshots. An independent code-review agent identified replay and chapter-detour persistence defects; targeted regressions reproduced them before fixes. We kept the proposal for optional, non-timed participation. We rejected making exploration an unlock requirement or generating new text-bearing images: neither would improve this reading-first project.

Automated iteration found an Intro-close focus race, incomplete replay restoration and letter phase loss across chapter detours. These were corrected in focus/state handling rather than hidden with animation delays. The old browser tests now explicitly enter through Intro and choose Skip or Read as dialogue where they need to inspect every original paragraph. PC captures cover 1280×720, 1440×900, 1920×1080, 1024×768 and a 640×360 effective layout viewport for 200% zoom. This is a layout-space check, not a claim that Chrome’s toolbar zoom was automated.

**Human trial: still pending, to be arranged by the author.** Automated browser playthroughs and AI review are not human-user observations. Please ask one person to play before explaining the controls, record hesitation or mistakes and one resulting design decision here. No tester identity or recording is needed.
