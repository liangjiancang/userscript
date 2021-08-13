# [B站封面获取](https://greasyfork.org/zh-CN/scripts/395575) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliCover)。

## V5.2

1. 脚本设置：重新设计脚本选项的分类逻辑。现在封面预览功能可以针对直播间及非直播间分别设置了。
2. 封面预览：当封面尺寸小于预览尺寸时，放大显示。
3. 番剧：优化封面获取流程，修复某些情况下无法响应内容变化的 BUG（或许是B站更新造成）。
4. 直播间：优化针对 `<iframe>` 直播间的处理，排除页面加载不稳定造成的影响。[#95544](https://greasyfork.org/zh-CN/scripts/395575/discussions/95544)
5. 直播间：重新改回懒加载方式，彻底排除页面加载不稳定造成的影响。
6. 代码：提取封面交互代理逻辑。

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

1. 功能实现：设置工作模式。新增实时预览模式与自定义模式。这两种模式受 [b站封面替换右侧广告 bilibili 哔哩哔哩 `v1.5.5`](https://greasyfork.org/zh-CN/scripts/390792?version=958799) 启发而来。
2. 功能实现：初始化脚本。
3. 功能移除：在直播间获取关键帧。
4. 直播间：支持通过 `<iframe>` 嵌套的特殊直播间。
5. 直播间：改进封面获取方式。
6. 脚本：改进初始化流程。
7. API：升级至 V1.4。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

> 多说两句，一开始写这个脚本就是因为在 Greasy Fork 上找遍了B站封面脚本都没有能用的。
>
> 如果没记错的话，我当时应该是装过 [b站封面替换右侧广告 bilibili 哔哩哔哩](https://greasyfork.org/zh-CN/scripts/390792) 的。
>
> 现在我知道了，那个脚本不行是因为作为广告被广告拦截器干掉了……如果没有这个意外，那就没我什么事了。
>
> 而且怎么都 V5.0 了，搞得好像大版本更新不值钱一样，都怪当初乱升大版本，悔不当初啊。

## V4.12

1. 功能实现：「番剧：获取系列总封面」。启用后，获取整个系列的封面而非分集封面。
2. 功能实现：「直播间：获取关键帧」。启用后，获取直播间关键帧而非封面。
3. 封面预览：优化处理流程。
4. 脚本：优化懒加载流程，大幅简化处理逻辑。部分情况下封面可在 DOM 中获取到，不必懒加载。
5. 脚本：优化错误处理流程。
6. 脚本：优化 URL 匹配。
7. 代码：优先使用函数声明而非函数表达式来定义内部函数。
8. API：升级至 V1.3。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

## V4.11

1. 脚本：在视频播放页和番剧播放页中采取懒加载方式。
2. 脚本：优化错误处理流程。
3. 脚本：主要逻辑推迟至 `load` 事件执行。
4. API：升级至 V1.2，进一步优化条件等待和元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
5. 代码：优化异常处理。

## V4.10

1. 封面预览：修复封面预览抖动问题。~~这不是理应不该出现的 BUG 吗，为什么能写进更新日志里？~~
2. API：升级至 V1.1，大幅优化条件等待逻辑，优化元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
3. 代码：使用可选链操作符 `?.` 及空值合并运算符 `??` 进行简写。

## V4.9

1. 脚本：大幅优化用户配置方式。
2. 脚本：改用 Tampermonkey 引入的 urlchange 事件对 URL 变化进行跟踪（采用旧版逻辑对 Violentmonkey 作兼容）。
3. 脚本：添加版本更新处理机制。
4. 脚本：不再检查脚本兼容。
5. 代码：不算是重构的重构。
6. API：升级至 V1.0，大幅优化元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

## V0.1 - V4.8

1. 洪荒时代写的脚本，我已经忘光都是怎么更新上来的了……
