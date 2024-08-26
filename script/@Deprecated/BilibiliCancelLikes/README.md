# [B站点赞批量取消](https://greasyfork.org/zh-CN/scripts/445754)

## @Deprecated

由于核心接口 `api.bilibili.com/x/space/arc/search` 被禁用，需要改为使用 Wbi 签名鉴权的 `api.bilibili.com/x/space/wbi/arc/search`，多少有点小题大做了。暂时封存起来，看以后有没有缘再改吧。

参考：[WBI 签名](https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/misc/sign/wbi.md)

---

相关脚本：**[B站稍后再看功能增强](https://greasyfork.org/zh-CN/scripts/395456)**、**[B站封面获取](https://greasyfork.org/zh-CN/scripts/395575)**、**[B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453)**

其他脚本：**[[DEBUG] 信息显式化](https://greasyfork.org/zh-CN/scripts/429521)**，以及 **[杂项](https://greasyfork.org/zh-CN/scripts?language=all&set=470770)**

忽然反感以前非常喜欢的某个UP主是一个常见现象，一想到之前给他点了这么多赞就觉得很不爽。手动把这些点赞一一取消非常麻烦，而且你会发现有一些明明点赞过的视频显示没有点赞，且点赞按钮无法正常工作——该脚本旨在解决这一困惑。求好评，求收藏💔。点击查看 [更新日志](https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliCancelLikes/changelog.md)。

**警告：本脚本的使用有一定风险，请在使用前认真阅读说明文档！**

## 使用说明

1. 进入令你不爽的目标UP主的个人空间，如 <https://space.bilibili.com/208259>。
2. 点击右上角私信旁的「取消点赞」，或通过脚本菜单激活功能。
3. 详细信息请查看控制台。

## FAQ

Q: 为什么不建议一次性将从第一页到最后一页的所有视频点赞取消？

A: 简单来说，没有任何办法可以**直接**判断用户是否给某一视频点赞（只能判断用户在近期内是否给某一视频点赞），这就导致必须直接给目标UP主的所有视频取消点赞。而这种操作在B站后台看来是比较敏感的，短时间内大量的操作很容易触发拦截机制，不仅会使脚本无法正常工作，还会影响到账号的正常使用！

PS: 如果B站提供一个查询用户是否给某一视频点赞的 API 那就没有这个问题了，因为B站对类似的查询式接口在检测上要宽松得多，可惜给不得。相关问题在后文中还会提到。

<br>

Q: 取消点赞执行错误，请求被拦截，会有什么后果，怎么解除？

A: 最直接的后果就是无法给视频作出有效的点赞（但点赞按钮依然会亮起来欺骗你）。遇到这种情况等一段时间就好，我自己测试下来大概需要半个钟时间。但我还是建议不要太作死去试探B站的底线，至少等一个小时以上再继续使用本脚本功能。

<br>

Q: 我记得很久之前明明给某视频点了赞，但脚本却没有取消对该视频的点赞，这是怎么回事？

A: 因为B站会丢弃过于陈旧的点赞状态。换句话说，你以前确实为点赞量作出了贡献，但现在该视频却处于未点赞状态（到播放页面可再次点赞）。在这种情况下，你只能默默忍受因为识人不善而给这位UP主贡献点赞量的痛苦了。

Q：怎么才算「陈旧」？

A：两种可能：1. 每个视频只会保留最近 N 个点赞的用户信息，如果某视频只有你一个人点赞，那么过十年你的点赞状态也不会被彻底丢弃；2. 每个视频只保留最近一段时间 T 内点赞的用户信息。其中 1 的可能性更大，具体待更多人提供信息。

<br>

Q: 说明文档在前面提到「点赞按钮无法正常工作」的视频，是否就是上一问题中提到的点赞状态丢失的视频？

A: 并不是的，这些「点赞按钮无法正常工作」的视频，你对其的点赞状态依然存在且能通过脚本取消。这就是所谓的「非最近点赞」视频，与之相对的则是「最近点赞视频」，也就是那些打开播放页面后看到点赞按钮亮起来的视频——B站只提供了查询「最近点赞」的接口，实乃万恶之源。

Q：「点赞按钮无法正常工作」具体是什么情况？

A：在B站 APP 内打开你的个人空间，拉到最下面，可以看到有一项「最近点赞的视频」，其容量上限为 600（截至 2022/07/29）。这就是B站的奇葩设计，在确定某个视频的点赞按钮是否该亮起时，直接从用户个人的「最近点赞的视频」中查询状态，而不是从视频的点赞列表中获取。前面丢弃「陈旧」点赞的设计还是非常合理的，但这里的设计真就是为了节省一点点成本来恶心用户，无语。具体可以参考 `cv8334419`，知乎上也有回答提到客服证实了这点。

<br>

*以上均为个人推测，不保真。*

## B站点赞状态总结

| 情况       | 点赞按钮             | 说明                                                                          |
| ---------- | -------------------- | ----------------------------------------------------------------------------- |
| 最近点赞   | 点亮，点击会取消点赞 | 可通过 `api.bilibili.com/x/web-interface/archive/has/like` 判断是否处于该状态 |
| 非最近点赞 | 熄灭，点击会提示错误 | 可通过 `api.bilibili.com/x/web-interface/archive/like` 取消点赞               |
| 陈旧点赞   | 熄灭，点击会点赞     | 无法判断出以前是否点过赞                                                      |

## 补充说明

* 脚本基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，不支持 Greasemonkey。要求 Edge / Chrome / Chromium 内核版本不小于 93，Firefox 版本不小于 92。

**Source: [Gitee](https://gitee.com/liangjiancang/userscript/tree/master/script/BilibiliCancelLikes) / [GitHub](https://github.com/liangjiancang/userscript/tree/master/script/BilibiliCancelLikes)** - *by Laster2800*