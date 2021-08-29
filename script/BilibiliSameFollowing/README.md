# [B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453)

相关脚本：**[B站稍后再看功能增强](https://greasyfork.org/zh-CN/scripts/395456)**、**[B站封面获取](https://greasyfork.org/zh-CN/scripts/395575)**、**[B站防剧透进度条](https://greasyfork.org/zh-CN/scripts/411092)**

其他脚本：**[[DEBUG] 信息显式化](https://greasyfork.org/zh-CN/scripts/429521)**、**[S1战斗力屏蔽](https://greasyfork.org/zh-CN/scripts/394407)**，以及 **[杂项](https://greasyfork.org/zh-CN/scripts?language=all&set=470770)**

快速查看与特定用户的共同关注（视频播放页、动态页、用户空间、直播间），详情查看下方截图。求好评，求收藏💔。点击查看 [更新日志](https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliSameFollowing/changelog.md)。

## 配置说明

* 常规用户卡片

  * 遍布全站的「评论区用户卡片」，包括视频评论区、动态评论区、用户空间动态评论区等。
  * 较为常见的用户卡片，如视频播放页右上方的 UP 主头像用户卡片，动态页左边「正在直播」的主播用户卡片等，动态页中被转发动态的所有者的用户卡片。

* 罕见用户卡片

  一般情况下不太会触发的用户卡片，如用户空间中充电用户的用户卡片，用户空间动态中被转发动态的所有者的用户卡片，用户空间「关注」「粉丝」中的用户卡片。

## 补充说明

* 脚本基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，明确不支持 Greasemonkey。在其他浏览器及脚本管理器上运行可能会出现问题，请提供反馈。

* 显示上会因为换行导致用户名甚至英文单词截断，为什么不对文本排版作优化？

  由于用户名千奇百怪、长短不一，硬按常规方式排版反而是负优化，显示效果非常难看。一行显示一个用户名可以解决这一问题，但违背了这个脚本「简单显示」的设计初衷。权衡之下便是如今的设计。

* 脚本灵感来源于 [B站共同关注查询 `v0.1`](https://greasyfork.org/zh-CN/scripts/428381?version=943607)。由于很容易就能猜到但不便明说的原因，本人选择将这一想法从零开始重新编写一遍。

## 截图

* 脚本设置

    ![脚本设置](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliSameFollowing/screenshot/脚本设置.png)

* 用户卡片

    ![用户卡片](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliSameFollowing/screenshot/用户卡片.png)!

* 用户空间

    ![用户空间](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliSameFollowing/screenshot/用户空间.png)

* 直播间

    ![直播间](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliSameFollowing/screenshot/直播间.png)

*gitee: [BilibiliSameFollowing](https://gitee.com/liangjiancang/userscript/tree/master/script/BilibiliSameFollowing)*

*by Laster2800*
