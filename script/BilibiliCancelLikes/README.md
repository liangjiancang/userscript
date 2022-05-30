# [B站点赞批量取消](https://greasyfork.org/zh-CN/scripts/445754)

相关脚本：**[B站稍后再看功能增强](https://greasyfork.org/zh-CN/scripts/395456)**、**[B站封面获取](https://greasyfork.org/zh-CN/scripts/395575)**、**[B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453)**、**[B站防剧透进度条](https://greasyfork.org/zh-CN/scripts/411092)**

其他脚本：**[[DEBUG] 信息显式化](https://greasyfork.org/zh-CN/scripts/429521)**、**[S1战斗力屏蔽](https://greasyfork.org/zh-CN/scripts/394407)**，以及 **[杂项](https://greasyfork.org/zh-CN/scripts?language=all&set=470770)**

忽然反感以前非常喜欢的某个UP主是一个常见现象，一想到之前给他点了这么多赞就觉得很不爽，该脚本旨在解决这一困惑。求好评，求收藏💔。点击查看 [更新日志](https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliCancelLikes/changelog.md)。

## 使用说明

1. 进入目标UP主的个人空间，如 <https://space.bilibili.com/208259>。
2. 点击「关注」旁的「取消点赞」，或通过脚本菜单激活功能。
3. 详细信息请查看控制台。

## FAQ

Q: 我以前明明给这个UP主点赞了许多视频，但脚本只检测出几个点赞，哪里出问题了？

A: 如果你确实给某视频点了赞，但脚本检测出来，那就说明B站已经将你的点赞状态丢失，只是记录到总点赞数里。此时，你再次打开那条明明点赞过的视频，会发现你能够再次点赞。在这种情况下，你只能默默忍受因为识人不善而给这位UP主贡献点赞量的痛苦了。

PS: B站丢弃过于陈旧的点赞状态似乎是在这半年间发生的。至少在 2021 年，我用相同的 API 还是能够检测出多年前的点赞状态（但网页端的点赞按钮不亮，尝试点赞会失败，也无法通过网页操作取消点赞），并且能够用 API 将点赞取消。

<br>

Q: 出现「取消赞失败 未点赞过」字样的错误提示怎么办？

A: 其实原理跟上一条还是一样的，只是B站在丢弃你的点赞状态时处理得不够干净。此时，对应的视频处于点赞与非点赞的薛定谔状态。如果你想要挽回这种局面，只需手动打开对应的视频，点赞一次并取消即可。但这种方式只能消除薛定谔状态，无法将你以前给该视频贡献的点赞量取消。

<br>

Q: 如果说B站会将过于陈旧的点赞状态丢弃，那这个脚本似乎就没什么意义了？

A: 其实也不是没用。如果你关注的UP主翻车了，你第一时间用这个脚本帮你取消近期的点赞还是能省不少事的……

*以上均为个人推测，不保真。*

**Source: [Gitee](https://gitee.com/liangjiancang/userscript/tree/master/script/BilibiliCancelLikes) / [GitHub](https://github.com/liangjiancang/userscript/tree/master/script/BilibiliCancelLikes)** - *by Laster2800*
