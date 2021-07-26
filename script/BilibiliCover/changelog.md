# [B站封面获取](https://greasyfork.org/zh-CN/scripts/395575) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliCover)。

## V4.12

1. 功能实现：「番剧：获取系列总封面」。启用后，获取整个系列的封面而非分集封面。
2. 功能实现：「直播间：获取关键帧」。启用后，获取直播间关键帧而非封面。
3. 脚本：优化稍后再看模式播放页中对封面的懒加载流程，大幅简化处理逻辑。其他页面封面均可从页面中获取，弃用懒加载并大幅优化各页面处理逻辑。
4. 脚本：主要逻辑重新提前至脚本运行时期执行。
5. 脚本：优化错误处理流程。
6. API：升级至 V1.3。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

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
