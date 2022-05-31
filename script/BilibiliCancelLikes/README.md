# [B站点赞批量取消](https://greasyfork.org/zh-CN/scripts/445754)

相关脚本：**[B站稍后再看功能增强](https://greasyfork.org/zh-CN/scripts/395456)**、**[B站封面获取](https://greasyfork.org/zh-CN/scripts/395575)**、**[B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453)**、**[B站防剧透进度条](https://greasyfork.org/zh-CN/scripts/411092)**

其他脚本：**[[DEBUG] 信息显式化](https://greasyfork.org/zh-CN/scripts/429521)**、**[S1战斗力屏蔽](https://greasyfork.org/zh-CN/scripts/394407)**，以及 **[杂项](https://greasyfork.org/zh-CN/scripts?language=all&set=470770)**

忽然反感以前非常喜欢的某个UP主是一个常见现象，一想到之前给他点了这么多赞就觉得很不爽。手动把这些点赞一一取消非常麻烦，而且你会发现有一些明明点赞过的视频说你没有点赞，且点赞按钮无法正常工作——该脚本旨在解决这一困惑。求好评，求收藏💔。点击查看 [更新日志](https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliCancelLikes/changelog.md)。

**警告：本脚本的使用有一定风险，请在使用前认识阅读说明文档！**

## 使用说明

1. 进入令你反感的目标UP主的个人空间，如 <https://space.bilibili.com/208259>。
2. 点击右上角私信旁的「取消点赞」，或通过脚本菜单激活功能。
3. 详细信息请查看控制台。

## FAQ

Q: 为什么不建议一次性将从第一页到最后一页的所有视频点赞取消？

A: 简单来说，没有任何办法可以**直接**判断用户是否给某一视频点赞（只能判断用户在近期内是否给某一视频点赞），这就导致必须直接给目标UP主的所有视频取消点赞。而这种操作在B站后台看来是比较敏感的，短时间内大量的操作很容易触发拦截机制，不仅会使脚本无法正常工作，还会影响到账号的正常使用！

PS: 如果B站提供一个查询用户是否给某一视频点赞的 API 那就没有这个问题了，因为B站对类似的查询式接口在检测上要宽松得多，可惜给不得。相关问题在后文中还会提到。

<br>

Q: 取消点赞执行错误，请求被拦截，会有什么后果，怎么解除？

A: 最直接的后果就是，你无法给视频作出有效的点赞（但点赞按钮依然会亮起来欺骗你）。遇到这种情况等一段时间就好，我自己测试下来大概需要半个钟时间。但我还是建议不要太作死去试探B站的底线，至少等一个小时以上再继续使用本脚本功能。

<br>

Q: 我记得很久之前明明给某视频点了赞，但脚本却没有取消对该视频的点赞，这是怎么回事？

A: 因为B站会丢弃过于陈旧的点赞状态（至于怎样算陈旧我不太确定，但三四年前的点赞状态肯定是丢失了）。换句话说，你现在仍处于未点赞状态（到播放页面可再次点赞），但你以前确实为点赞量作出了贡献。在这种情况下，你只能默默忍受因为识人不善而给这位UP主贡献点赞量的痛苦了。

<br>

Q: 说明文档在前面提到「点赞按钮无法正常工作」的视频，是否就是上一问题中提到的点赞状态丢失的视频？

A: 并不是的，这些「点赞按钮无法正常工作」的视频，你对其的点赞状态依然存在且能通过脚本取消。这就是所谓的「非近期内点赞」视频，与之相对的则是「近期点赞视频」，也就是那些打开播放页面后看到点赞按钮亮起来的视频——B站只提供了查询「近期点赞」的接口，实乃是万恶之源。

*以上均为个人推测，不保真。*

## 补充说明

* 脚本基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，不支持 Greasemonkey。要求 Edge / Chrome / Chromium 内核版本不小于 85，Firefox 版本不小于 90。

**Source: [Gitee](https://gitee.com/liangjiancang/userscript/tree/master/script/BilibiliCancelLikes) / [GitHub](https://github.com/liangjiancang/userscript/tree/master/script/BilibiliCancelLikes)** - *by Laster2800*
