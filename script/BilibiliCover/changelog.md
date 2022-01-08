# [B站封面获取](https://greasyfork.org/zh-CN/scripts/395575) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliCover)。

说明：

1. 「自定义模式」的底层机制为「实时预览模式」。若无特殊说明，针对后者的改动同样会施加到前者上。

## V5.7

1. 直播间：优化 URL 匹配，支持各种特殊直播间页面，尽可能向前兼容。
2. 直播间：修复在某些直播间中按钮样式与环境不匹配的问题。

## V5.6

1. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。
2. 代码：偏好于 `Object.entries()`、`Object.keys()`、`Object.values()`。
3. 快速复制：修复复制事件可以被重复添加的问题。
4. 直播间：修复直播间标题过长时的样式错乱问题。
5. 脚本：弃用 Tampermonkey 提供的 `window.onurlchange` 特性，改用 `UserscriptAPI` 提供的实现更为完善、功能更为强大的 `urlchange` 事件，来对 URL 变化进行跟踪。
6. 脚本：优化错误信息提示。
7. 外部：`UserscriptAPI` 更新至 V2.2。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
8. 外部：`UserscriptAPIDom` 更新至 V1.2，`UserscriptAPILogger` 更新至 V1.2，`UserscriptAPIMessage` 更新至 V1.2。
9. 外部：`UserscriptAPIBase` 更新至 V1.2，提供更为完善的 `urlchange` 事件。
10. 外部：`UserscriptAPIWait` 更新至 V1.2，优化错误处理流程。
11. 外部：`UserscriptAPIWeb` 更新至 V1.2，优化错误处理流程。
12. UI：优化文本。

## V5.5

1. 外部：`UserscriptAPI` 更新至 V2.1。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 外部：`UserscriptAPIWait` 更新至 V1.1，`UserscriptAPIDom` 更新至 V1.1，`UserscriptAPILogger` 更新至 V1.1，`UserscriptAPIWeb` 更新至 V1.1。
3. 脚本：优化版本更新机制。
4. 代码：使用增强的代码规则。

## V5.4

1. 外部：`UserscriptAPI` 更新至 V2.0，实现 API 模块化。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 外部：`UserscriptAPIMessage` 更新至 V1.1，引入对话框组件。
3. 封面预览：改用更合理的实现方案，彻底解决与封面预览元素进行交互时可能会出现的种种诡异现象。
4. 封面预览：传统模式+封面预览的情况下，鼠标移动至按钮上时隐藏指针。
5. 工作模式：改用对话框组件实现工作模式配置，实现对 Firefox 的兼容。
6. 实时预览模式：实时预览元素在图片完全加载成功后才显示，避免图片加载过程被观察到。
7. 实时预览模式：修复获取不到封面 URL 时，无法显示错误信息的问题。
8. 脚本：修复在 Firefox 上有概率无法正常执行的问题。
9. UI：优化提示信息的显示。

## V5.3

1. 快速复制：修复复制功能实现。「右键」点击复制封面链接，「Ctrl+右键」点击复制封面内容。相应地，增加一个交换「右键」与「Ctrl+右键」功能选项。
2. 实时预览模式：在不禁用右键菜单时，右键点击时会加载原图，以便浏览器打开一个针对原图的右键菜单（而非像之前那样打开一个针对包含原图链接的右键菜单）。
3. 实时预览模式：优化缩略图获取失败时的处理。
4. 封面预览：优化渐入渐隐的处理，从理论上杜绝闪烁的发生（但由于渐入渐隐时间较短，某些情况下还是可能会出现闪烁的「错觉」）。
5. 封面预览：优化最大显示尺寸，并限制最大放大倍数为 `1.5`。
6. 脚本：增加选项「在预览图上禁用右键菜单」。有了快速复制功修复复制能后，右键菜单作用不大，但也不排除对此有需求的用户（如使用浏览器或第三方在右键菜单针对图片提供的功能）。
7. 脚本：修复将鼠标移动至按钮/实时预览元素上后快速点击鼠标左键/中键时，相关操作有概率不会被响应的问题。
8. 脚本：优化封面获取错误时的处理与显示。
9. 脚本：修复脚本提示在懒加载完成时才加载的问题。
10. 脚本：更新兼容性说明。
11. UI：修复显示被 V3 播放器遮挡的问题。
12. UI：优化文本。
13. 代码：引入类字段声明。
14. 代码：引入逻辑空赋值运算符 `??=`、逻辑或赋值运算符 `||=` 及逻辑与赋值运算符 `&&=`。
15. 外部：`UserscriptAPI` 升级至 V1.8，大幅优化元素等待逻辑，引入网络请求检查、解析、报告功能。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

> 快速复制功修复复制能其实是「无法将右键菜单弹出的时间点延后至封面获取成功后」的妥协产物，目的是为了解决在特定设置下在某些页面中第一次激活的右键菜单获取不到正确链接信息的问题——不过实现出来却发现意外地好用。
>
> 实际上，以上问题并没有修复，而是以「强制禁用传统模式封面按钮上的右键菜单」掩盖过去。但这是合理的，因为此处的「封面按钮」是并不是一张图片，浏览器及第三方在右键菜单中为图片提供的各种便利功能本来就无法在它上面激活。

## V5.2

1. 实时预览模式：修复右键菜单中获取到的图片为预览图的问题。
2. 实时预览模式：选择更合适的实时预览模式缩略图质量。
3. 传统模式：修复鼠标中键点击按钮获取封面失败时没有提示的问题。
4. 脚本设置：重新设计脚本选项的分类逻辑。现在封面预览功能可以针对直播间及非直播间分别设置了。
5. 封面预览：当封面尺寸小于预览尺寸时，放大显示。
6. 番剧：优化封面获取流程，修复某些情况下无法响应内容变化的 BUG（或许是B站更新造成）。
7. 直播间：优化针对 `<iframe>` 直播间的处理，排除页面加载不稳定造成的影响。[#95544](https://greasyfork.org/zh-CN/scripts/395575/discussions/95544)
8. 直播间：重新改回懒加载方式，彻底排除页面加载不稳定造成的影响。
9. UI：强化质感。
10. 代码：提取封面交互代理逻辑。

> [#95544](https://greasyfork.org/zh-CN/scripts/395575/discussions/95544) 是一个跟 CPU 相关的奇葩问题。理论上来说，电脑配置越高出 BUG 的概率就越大，垃圾电脑根本不配遇到这个 BUG……

## V5.1

1. 脚本：修复将图片源置空时，部分浏览器会向服务器发起额外请求的问题。
2. 工作模式：不要隐藏自定义模式入口，反正有脚本初始化功能，玩崩了也不是什么大事。
3. 工作模式：改进自定义模式配置流程。
4. 封面预览：增加 &lt;img&gt; 层级懒加载。
5. 封面预览：修复传统模式在网络不佳的情况下首次打开封面预览时，过渡效果可能不自然的问题。
6. UI：优化文本。
7. 代码：HTML 与 CSS 标识符标准化。

## V5.0

1. 工作模式：功能实现。新增实时预览模式与自定义模式，它们受 [b站封面替换右侧广告 bilibili 哔哩哔哩 `v1.5.5`](https://greasyfork.org/zh-CN/scripts/390792?version=958799) 启发而来。
2. 直播间：支持通过 `<iframe>` 嵌套的特殊直播间。
3. 直播间：改进封面获取方式。
4. 脚本：增加功能「初始化脚本」。
5. 脚本：移除选项「直播间：获取关键帧」。
6. 脚本：改进初始化流程。
7. 外部：`UserscriptAPI` 升级至 V1.4。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

> 多说两句，一开始写这个脚本就是因为在 Greasy Fork 上找遍了B站封面脚本都没有能用的。
>
> 如果没记错的话，我当时应该是装过 [b站封面替换右侧广告 bilibili 哔哩哔哩](https://greasyfork.org/zh-CN/scripts/390792) 的。
>
> 现在我知道了，那个脚本不行是因为作为广告被广告拦截器干掉了……如果没有这个意外，那就没我什么事了。

> 而且怎么都 `v5` 了，搞得好像大版本更新不值钱一样，都怪当初乱升大版本，悔不当初啊。

## V4.12

1. 封面预览：优化处理流程。
2. 脚本：增加选项「番剧：获取系列总封面」。启用后，获取整个系列的封面而非分集封面。
3. 脚本：增加选项「直播间：获取关键帧」。启用后，获取直播间关键帧而非封面。
4. 脚本：优化懒加载流程，大幅简化处理逻辑。部分情况下封面可在 DOM 中获取到，不必懒加载。
5. 脚本：优化错误处理流程。
6. 脚本：优化 URL 匹配。
7. 代码：优先使用函数声明而非函数表达式来定义内部函数。
8. 外部：`UserscriptAPI` 升级至 V1.3。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

## V4.11

1. 脚本：在视频播放页和番剧播放页中采取懒加载方式。
2. 脚本：优化错误处理流程。
3. 脚本：主要逻辑推迟至 `load` 事件执行。
4. 外部：`UserscriptAPI` 升级至 V1.2，进一步优化条件等待和元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
5. 代码：优化异常处理。

## V4.10

1. 封面预览：修复封面预览抖动问题。~~这不是理应不该出现的 BUG 吗，为什么能写进更新日志里？~~
2. 外部：`UserscriptAPI` 升级至 V1.1，大幅优化条件等待逻辑，优化元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
3. 代码：引入可选链操作符 `?.` 及空值合并运算符 `??`。

## V4.9

1. 脚本：大幅优化用户配置方式。
2. 脚本：改用 Tampermonkey 引入的 `urlchange` 事件对 URL 变化进行跟踪（采用旧版逻辑对 Violentmonkey 作兼容）。
3. 脚本：添加版本更新处理机制。
4. 脚本：不再检查脚本兼容。
5. 代码：不算是重构的重构。
6. 外部：`UserscriptAPI` 升级至 V1.0，大幅优化元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

## V0.1 - V4.8

* 洪荒时代写的脚本，已经忘光都是怎么更新上来的了……
