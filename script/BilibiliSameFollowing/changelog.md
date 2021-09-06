# [B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliSameFollowing)。

## V1.6

1. API：更新至 V2.0，实现 API 模块化。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

## V1.5

1. 功能实现：显示目标用户与自己的关系（如悄悄关注、特别关注、互粉、拉黑）。
2. 功能实现：以关注时间降序显示共同关注。
3. 脚本设置：重新设计脚本选项逻辑，简化菜单。
4. UI：共同关注默认以目标用户的关注时间升序显示。
5. UI：非以纯文本形式显示时，用特殊格式标注出特殊用户（如特别关注、互粉）。
6. UI：针对提示信息选项，修复部分信息无法被提示的问题。
7. UI：优化文字排版。
8. 脚本：更新兼容性说明。
9. 代码：引入类字段声明。
10. 代码：引入逻辑空赋值运算符 `??=`、逻辑或赋值运算符 `||=` 及逻辑与赋值运算符 `&&=`。
11. API：升级至 V1.8，大幅优化元素等待逻辑，引入网络请求检查、解析、报告功能。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

> 上个版本最后都更到 `v1.4.45`，挺离谱的——尽管大部分都是跟随性更新……

## V1.4

1. 功能实现：在直播间中快速查看。
2. 脚本：主要逻辑推迟至 `load` 事件执行。
3. 脚本：支持通过 `<iframe>` 嵌套的特殊直播间。
4. 脚本：优化错误处理流程。
5. 脚本：优化 URL 匹配。
6. API：升级至 V1.5，进一步优化条件等待和元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
7. UI：优化直播间中的共同关注显示。
8. 代码：优化异常处理。
9. 代码：优先使用函数声明而非函数表达式来定义内部函数。

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
