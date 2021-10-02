# [B站防剧透进度条](https://greasyfork.org/zh-CN/scripts/411092) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliNoSpoilProgressBar)。

## V2.5

1. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。
2. 代码：偏好于 `Object.entries()`、`Object.keys()`、`Object.values()`。
3. UI：依据播放器类型（V2 播放器两种形式 + V3 播放器），以及播放模式（常规、宽屏、网页全屏、全屏），对脚本控制和伪进度条的显示进行优化。
4. 约定：「menu / 菜单 / 菜单项」->「panel / 面板 / 面板项」。在一开始，这个命名是没有问题的，但现在所谓的「menu」干的事情早已远不是「菜单」二字所能描述的了。
5. 脚本：弃用 Tampermonkey 提供的 `window.onurlchange` 特性，改用 `UserscriptAPI` 提供的实现更为完善、功能更为强大的 `urlchange` 事件，来对 URL 变化进行跟踪。
6. 脚本：优化面板开启与关闭流程。
7. 脚本：菜单项回调函数以参数而非 `this` 回传菜单对象。
8. 进度条：优化防剧透参数默认值。
9. 外部：`UserscriptAPI` 更新至 V2.2。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
10. 外部：`UserscriptAPIDom` 更新至 V1.2，`UserscriptAPILogger` 更新至 V1.2，`UserscriptAPIMessage` 更新至 V1.2。
11. 外部：`UserscriptAPIBase` 更新至 V1.2，提供更为完善的 `urlchange` 事件。
12. 外部：`UserscriptAPIWait` 更新至 V1.2，优化错误处理流程。
13. 外部：`UserscriptAPIWeb` 更新至 V1.2，优化错误处理流程。

> 所以B站的播放器是什么鬼，为什么同一版本播放器会几种不同的显示情况，而且没有一个准则。前一秒还是类型 1，刷新一下就变成类型 2，换到另一个视频又是一种新的显示模式。

## V2.4

1. 用户设置：重构。
2. 脚本：优化版本更新机制和配置读取流程。
3. 脚本：数值输入框均支持使用上下方向键（配合 Alt/Shift/Ctrl）调整，并提供严格的范围校验和精度控制。
4. UI：依据全屏与否优化脚本控制的位置。
5. 外部：引入自定义数值输入框元素 `InputNumber` V1.0。

## V2.3

1. 外部：`UserscriptAPI` 更新至 V2.1（`dom` 更新至 V1.1，`logger` 更新至 V1.1，`web` 更新至 V1.1）。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 外部：`UserscriptAPIWait` 更新至 V1.1。
3. 脚本：条件允许的情况下，将 V2 播放器 `video_destroy` 事件作为重新初始化防剧透流程的触发点。
4. 脚本：优化初始化流程，避免页面停止加载导致的初始化错误。
5. 代码：使用增强的代码规则。

## V2.2

1. 外部：`UserscriptAPI` 更新至 V2.0，实现 API 模块化。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 外部：`UserscriptAPIMessage` 更新至 V1.1，引入对话框组件。
3. 自动化：改用对话框组件实现防剧透UP主名单配置。
4. 用户设置：优化内部处理逻辑。
5. 脚本：修复在 Firefox 上有概率无法正常执行的问题。
6. 脚本：增强内部数据校验。

## V2.1

1. 脚本：优化切换分P、页面内切换视频、播放器刷新等各种情况下重新初始化防剧透流程的处理。
2. 脚本：更新兼容性说明。
3. 脚本：优化隐藏分P信息处理流程。
4. 进度条：修复在视频播放页中，启用功能后立即点击进度条修改定位时，进度条会立即发生偏移的问题。
5. UI：修复显示被 V3 播放器遮挡的问题。
6. UI：优化文字排版。
7. UI：优化布局。
8. 代码：弃用事件处理器属性。
9. 代码：引入类字段声明。
10. 代码：引入逻辑空赋值运算符 `??=`、逻辑或赋值运算符 `||=` 及逻辑与赋值运算符 `&&=`。
11. 外部：`UserscriptAPI` 升级至 V1.8，大幅优化元素等待逻辑，引入网络请求检查、解析、报告功能。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

## V2.0

1. 进度条：更改实现方式，自给自足，不再借用B站原生的进度条组件。
2. 脚本：完善脚本菜单运行流程。
3. 脚本：优化初始化流程。
4. 脚本：增加选项「隐藏分段信息」。
5. 脚本：移除选项「隐藏『热度』曲线」。现在总是隐藏。
6. 用户设置：优化内部处理逻辑。
7. 代码：优先使用函数声明而非函数表达式来定义内部函数。
8. 代码：`no-useless-call`。
9. 外部：`UserscriptAPI` 升级至 V1.4。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

## V1.9

1. 进度条：适配番剧播放页中播放器升级至 `v3.0` 的改版，重新支持番剧播放页。
2. 进度条：明确不支持分段进度条——主要是因为按目前的实现方式要支持分段进度条非常困难。另一方面，既然UP主在某视频启用了分段进度条，本身就说明该视频向观众提供章节并不影响体验，换句话说这种视频理应是没有剧透问题的；否则，UP主才是「剧透」的元凶。以后可能会采用更合理的实现方式将脚本重写一遍，到时候也许会重新考虑支持分段进度条。
3. 脚本：大幅简化页面切换处理流程。
4. 脚本：优化 URL 匹配。
5. 用户设置：优化布局。
6. UI：优化脚本控制的外观。

## V1.8

1. 脚本：借助新版 API 对一些特殊情况（如网速不佳、打开大量视频到后台）下的处理进行大幅优化。
2. 脚本：优化错误处理流程。
3. 脚本：优化页面切换处理流程。
4. 脚本：优化脚本菜单运行流程。
5. 脚本：修复数值类型设置项无法保存为 `0` 的问题。
6. 脚本：主要逻辑推迟至 `load` 事件执行。
7. 外部：`UserscriptAPI` 升级至 V1.3，进一步优化条件等待和元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
8. 代码：优化异常处理。

## V1.7

1. 外部：`UserscriptAPI` 升级至 V1.1，大幅优化条件等待逻辑，优化元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 脚本：优化脚本菜单运行流程。
3. 代码：引入可选链操作符 `?.` 及空值合并运算符 `??`。

## V1.6

1. 外部：`UserscriptAPI` 升级至 V1.0，大幅优化元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 进度条：大幅优化处理流程，提高运行效率，并避免在没有启用功能时执行大量无意义的逻辑。
3. 脚本：优化脚本菜单运行流程。
4. 脚本：优化配置保存流程。
5. 脚本：改用 Tampermonkey 引入的 `urlchange` 事件对 URL 变化进行跟踪（采用旧版逻辑对 Violentmonkey 作兼容）。
6. 脚本：移除过于陈旧的版本更新处理，并优化之。
7. 脚本：初始化脚本不再重置「防剧透UP主名单」。
8. 自动化：将UP主加入防剧透UP主名单时备注名字。
9. 自动化：保存防剧透UP主名单时对名单内容修正。
10. 自动化：修复防剧透UP主名单为空时无法保存的问题。
11. UI：优化文本。

## V1.5

1. 进度条：适配 20210624 的B站播放页面的超级脑残且越改越难用的升级。
2. 脚本：不再显式提醒脚本兼容问题。
3. 脚本：移除选项「功能性更新后打开设置页面」。现在总是强制打开功能性更新设置。

> B站产品经理是吃💩的吗？现在 APP 已经被抖音化得连💩都不如，求你们放过网页版吧……

## V1.4

1. 脚本：增加选项「隐藏分P信息」。

## V1.3

1. 进度条：无论是否延后，若偏移后滑块处于预留区内，立即更新状态。
2. 自动化：修复防剧透UP主名单在稍后再看播放页上无法正常工作的问题。
3. 脚本：进一步修复打开稍后再看播放页面后长时间放置而没有切换过去，导致脚本逻辑执行失败的问题。
4. 脚本：兼容性处理。
5. UI：优化脚本控制显示，避免遮盖其他视频信息。
6. 代码：配置默认值、极值硬编码进 `configMap` 中，而不再作为脚本常量看待。

## V1.2

1. 进度条：增加选项「进度条极端偏移因子」，用于控制进度条偏移量的概率分布。
2. 进度条：检测滑块而非已播放条的变化来更新伪已播放条。这样可以减少监听器的数量，同时避免交叉监听的问题。
3. 进度条：修复视频控制显示/隐藏状态切换检测错误，从而导致无法在所有正确的时间点发生偏移的问题。
4. 进度条：修复打开页面后，首次启用功能时已播放进度不正确的问题。
5. 脚本：修复在番剧播放页切换分P后无法重新执行处理逻辑的问题。

## V1.1

1. 脚本：增加选项「延后进度条偏移的时间点」，用于防止用户从视觉上直观推测出偏移方向与偏移量。
2. 脚本：修复打开播放页面后长时间放置而没有切换过去，导致脚本逻辑执行失败的问题。
3. 进度条：修改进度条偏移与播放进度的耦合关系，现在播放进度不再直接影响偏移量的大小。
4. 进度条：调整默认参数，加强默认的防剧透强度。

## V1.0

1. 进度条：在视频播放页、番剧播放页实现功能。
2. 自动化：实现防剧透UP主名单及番剧自动开启。
