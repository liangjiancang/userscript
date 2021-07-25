# [B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliSameFollowing)。

## V1.4

1. 功能实现：在直播间中快速查看。
2. 脚本：主要逻辑推迟至 `load` 事件执行。
3. 脚本：优化错误处理流程。
4. API：升级至 V1.3，进一步优化条件等待和元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
5. 代码：优化异常处理。

## V1.3

1. API：升级至 V1.1，大幅优化元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 代码：借助新版元素等待 API 进行大幅简化。
3. 脚本：优化更新处理机制。

## V1.2

1. 脚本：大幅优化用户配置方式，优化配置项分类及功能，并添加配置说明。
2. 脚本：完善功能覆盖范围。针对一些奇奇怪怪地方弹出的用户卡片，也能正确处理。
3. 脚本：优化 URL 匹配。
4. 脚本：添加版本更新处理机制。
5. 功能实现：以纯文本形式显示共同关注（共同关注改为默认以可点击形式展示）。
6. 功能实现：无共同关注时提示信息。
7. 功能实现：初始化脚本。
8. UI：优化文字排版。
9. 代码：不算是重构的重构。

## V1.1

1. 功能实现：显示/隐藏查询失败的提示信息。
2. 功能实现：分别为常规用户卡片、UP主卡片、用户空间添加功能开关。

## V1.0

1. 功能实现：在用户卡片中显示共同关注。
2. 功能实现：在用户空间中显示功能关注。
