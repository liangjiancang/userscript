# [B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliSameFollowing)。

## V1.14

1. 共同关注：适配B站2024年下半年引入的 `<bili-user-profile>` 用户卡片（该卡片可能会在未来成为主流方式）。
2. 外部：`UserScriptAPIBase` 更新至 V1.3。

## V1.13

1. 脚本：支持「列表播放页」`www.bilibili.com/list/*`。[164021](https://greasyfork.org/zh-CN/scripts/395575/discussions/164021)
2. 共同关注：修复直播间点击弹幕弹出的信息卡片被有可能被播放器遮挡的问题。
3. UI：适配B站样式变化。
4. 代码：`object-shorthand` `unicorn/prefer-string-replace-all`。
5. 外部：`UserScriptAPIWeb` 更新至 V1.3。

## V1.12

1. 共同关注：适配B站近段时间引入的 `DocumentFragment` 技术。
2. 共同关注：适配共同关注查询接口修改——现在目标用户不公开关注列表时不返回用户友好的信息，针对这种常见情况作优化。
3. UI：不再考虑换行后仅剩英文时行高不一致的问题。该问题出现频率极低，严格来说这种「错误」的显示效果也没有错，更重要的是修复方案需兼顾到新旧版本用户卡片，极为繁琐，故直接放弃治疗。
4. UI：优化查询失败信息显示。
5. 外部：`UserscriptAPIWait` 更新至 V1.3，引入对通过 `DocumentFragment` 插入的元素的支持。

## V1.11

1. 共同关注：高亮显示与当前页面相关的共同关注（如在视频播放页中高亮UP主、动态详情页中高亮动态所有者）。[153822](https://greasyfork.org/zh-CN/scripts/428453/discussions/153822)

> 这段时间发生的事情太多、太虚幻了，就像做梦一样。10月17日提的需求，说好的两天解决，结果拖了两周……一个月之后或许就是这个脚本——不对，应该是所有脚本——的结局了，但正因如此才要给它们一个没有遗憾的谢幕。

## V1.10

1. 共同关注：通过悬停提示显示共同关注账号的额外信息——认证、签名、本账号关注时间。
2. UI：优化文本。
3. 约定：「目标用户」->「目标」。
4. 脚本：优化 URL 匹配。
5. 脚本：适配新版用户卡片（约在 2022.07 推出）。
6. 脚本：API 一律通过 HTTPS 访问。[141090](https://greasyfork.org/zh-CN/scripts/428453/discussions/141090) [142955](https://greasyfork.org/zh-CN/scripts/428453/discussions/142955)

> 近期（2022/07/29），部分B站用户 SESSDATA 会被设置 `Secure` 标记，导致通过 `HTTP` 访问部分 API 时无法通过认证。这一情况只发生在部分用户上（初步猜测与实名认证以及一些敏感操作相关），导致了问题重现与排查的困难，以至于在 [141090](https://greasyfork.org/zh-CN/scripts/428453/discussions/141090) 提出 18 天以及多个同因 BUG 反馈后，才从 [142955](https://greasyfork.org/zh-CN/scripts/428453/discussions/142955) 的用户反馈中锁定问题所在。

> 当然这里要辩解下为什么不一开始全部 API 就用 HTTPS 访问——因为这些 API 在第三方的文档上一开始写的就是 HTTP，总之在当时用 HTTP 访问绝对没有问题，但用 HTTPS 访问就不一定……

## V1.9

1. 脚本：优化直播间的匹配方式，支持各种特殊直播间页面，尽可能向前兼容。
2. 脚本：适配 2022 版播放页。
3. 脚本：适配B站动态页用户卡片生成方式的更新。
4. 脚本：适配B站直播间点击弹幕弹出的信息卡片的更新。
5. 脚本：支持收藏夹播放页（与稍后再看播放页无异，如无特殊说明，「稍后再看播放页」包含此概念）。
6. 共同关注：修复最多只能显示前 50 个共同关注的问题。
7. 共同关注：当用户为自己时不再显示共同关注。

> 感谢 [AndrewXiongGe](https://github.com/AndrewXiongGe) 的代码贡献。

> B站又在瞎折腾，半年前不知道搞什么东西将动态页的一系列用户卡片给移除，现在又给加回来了😅

## V1.8

1. 脚本：适配B站 2021 年 9 月对于用户卡片的改版。
2. 脚本：移除直播间及常规用户卡片的开关选项，它们现在总会被开启。相应地，配置说明也不必要了，移除之。
3. 脚本：优化配置定义及读取流程。
4. 代码：偏好于 `Object.entries()`、`Object.keys()`、`Object.values()`。
5. UI：优化文本。

## V1.7

1. 外部：`UserscriptAPI` 更新至 V2.2。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 外部：`UserscriptAPIBase` 更新至 V1.2，`UserscriptAPILogger` 更新至 V1.2。
3. 外部：`UserscriptAPIWait` 更新至 V1.2，优化错误处理流程。
4. 外部：`UserscriptAPIWeb` 更新至 V1.2，优化错误处理流程。
5. 外部：移除 `UserscriptAPIDom`、`UserscriptAPIMessage`。
6. 脚本：优化版本更新机制。
7. 脚本：优化卡片处理逻辑，避免页面重定向导致的初始化错误。
8. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。

## V1.6

1. 外部：`UserscriptAPI` 更新至 V2.0，实现 API 模块化。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 外部：`UserscriptAPIMessage` 更新至 V1.1，引入对话框组件。
3. 脚本：修复在 Firefox 上有概率无法正常执行的问题。

## V1.5

1. 共同关注：增加选项「显示目标用户与自己的关系」（如悄悄关注、特别关注、互粉、拉黑）。
2. 共同关注：增加选项「以关注时间降序显示」。
3. 脚本：重新设计脚本选项逻辑，简化菜单。
4. 脚本：更新兼容性说明。
5. UI：共同关注默认以目标用户的关注时间升序显示。
6. UI：非以纯文本形式显示时，用特殊格式标注出特殊用户（如特别关注、互粉）。
7. UI：针对提示信息选项，修复部分信息无法被提示的问题。
8. UI：优化文字排版。
9. 代码：引入类字段声明。
10. 代码：引入逻辑空赋值运算符 `??=`、逻辑或赋值运算符 `||=` 及逻辑与赋值运算符 `&&=`。
11. 外部：`UserscriptAPI` 升级至 V1.8，大幅优化元素等待逻辑，引入网络请求检查、解析、报告功能。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

> 上个版本最后都更到 `v1.4.45`，挺离谱的——尽管大部分都是跟随性更新……

## V1.4

1. 共同关注：在直播间中实现功能。
2. 脚本：主要逻辑推迟至 `load` 事件执行。
3. 脚本：支持通过 `<iframe>` 嵌套的特殊直播间。
4. 脚本：优化错误处理流程。
5. 脚本：优化 URL 匹配。
6. 外部：`UserscriptAPI` 升级至 V1.5，进一步优化条件等待和元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
7. UI：优化直播间中的共同关注显示。
8. 代码：优化异常处理。
9. 代码：优先使用函数声明而非函数表达式来定义内部函数。

## V1.3

1. 外部：`UserscriptAPI` 升级至 V1.1，大幅优化元素等待逻辑。详见 [UserscriptAPI 更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。
2. 代码：借助新版元素等待 API 进行大幅简化。
3. 脚本：优化更新处理机制。

## V1.2

1. 共同关注：完善功能覆盖范围。针对一些奇奇怪怪地方弹出的用户卡片，也能正确处理。
2. 共同关注：增加选项「以纯文本形式显示」（共同关注改为默认以可点击形式展示）。
3. 共同关注：增加选项「无共同关注时提示信息」。
4. 脚本：大幅优化用户配置方式，优化设置项分类及功能，并添加配置说明。
5. 脚本：优化 URL 匹配。
6. 脚本：添加版本更新处理机制。
7. 脚本：增加功能「初始化脚本」。
8. UI：优化文字排版。
9. 代码：不算是重构的重构。

## V1.1

1. 脚本：增加选项以显示/隐藏查询失败的提示信息。
2. 脚本：分别为常规用户卡片、UP主卡片、用户空间添加功能开关。

## V1.0

1. 共同关注：在用户卡片和用户空间中实现功能。
