# [B站防剧透进度条](https://greasyfork.org/zh-CN/scripts/411092)

相关脚本：**[B站稍后再看功能增强](https://greasyfork.org/zh-CN/scripts/395456)**、**[B站封面获取](https://greasyfork.org/zh-CN/scripts/395575)**、**[B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453)**

其他脚本：**[[DEBUG] 信息显式化](https://greasyfork.org/zh-CN/scripts/429521)**、**[S1战斗力屏蔽](https://greasyfork.org/zh-CN/scripts/394407)**，以及 **[杂项](https://greasyfork.org/zh-CN/scripts?language=all&set=470770)**

看比赛、看番总是被进度条剧透？装上这个脚本再也不用担心这些问题了。一图胜千言，无须多言。求好评，求收藏💔。点击查看 [更新日志](https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliNoSpoilProgressBar/changelog.md)。

![用户设置](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliNoSpoilProgressBar/screenshot/用户设置.png)

## 防剧透机制说明

### 进度条是怎样剧透的？

以一场 A、B 两支队伍的 BO3 的比赛为例，目前比赛进行了一场，A 获得胜利。

情景 1：此时进度条滑块大约在 50% 的位置，可以推测出后面只有一场比赛，所以下一场依然是 A 获得胜利，2:0 带走 B。将这种情景称为**进度条的前向剧透**。

情景 2：此时进度条滑块大约在 33% 的位置，可以推测出后面还有两场比赛，所以下一场比赛是 B 获得胜利。将这情景称为**进度条的后向剧透**。

### 进度条偏移是如何解决两种剧透的？

脚本采取进度条偏移的方式来解决这一问题。简单来说，脚本会将进度条滑块向左或向右随机移动一段距离。向左还是向右、移动的距离都是随机的，用户在使用时并不知道进度条的具体偏移如何，因此无法通过滑块所处的位置推测出当前的播放进度。

为了方便讨论，这里采取极端的参数设置，并且生成的随机数也是极端值。下面就来看一下在这种情况下会发生什么情况。

假如进度条向右极端偏移，那么即使滑块当前处于 90% 的位置，视频可能还没播放到一半，结果犹未可知。用户并不能因为滑块位置较后，就认为播放进度较大。代入到情景 1，虽然滑块已经在 50% 的位置，但实际上视频只播放了 33%，后面还有两场比赛，从而解决前向剧透。

假如进度条向左极端偏移，那么即使滑块当前处于 50% 的位置，视频也有可能在下一秒就结束。用户并不能因为滑块位置较前，就认为播放进度较小。代入到情景 2，虽然滑块只在 33% 的位置，但实际上视频已经播放了一半，后面只有一场比赛，从而解决后向剧透。

两种偏移不会同时发生，但是用户处于一切未知的状态，并不清楚当前处于反前向剧透还是反后向剧透状态。因此，用户没有根据滑块位置推测播放进度的基础和理由，从而达到防剧透的目的。

### 参数设置

在设置窗口中已经提供了详细的说明，但前提是理解上面关于防剧透原理的说明。

## 补充说明

* 脚本基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，不支持 Greasemonkey。要求 Edge / Chrome / Chromium 内核版本不小于 85，Firefox 版本不小于 90。
* 脚本有一定使用门槛，如果不理解防剧透机制效果将会剧减。如果你不明白这个脚本在「干什么」，请认真阅读前面的机制说明，不要为此简单地否定这个脚本，谢谢配合！
* 使用时请尽可能避免对偏移方向与偏移量进行推测。为此，在启用功能或改变播放进度后的一段时间，请抑制住自己观察进度条变化的冲动（尽可能使用方向键调进度），直至忘记之前滑块的确切位置。勾选「延后进度条偏移的时间点」能够提供一定的帮助，但最终还是要靠用户的配合。
* B站本身提供了弹幕屏蔽词功能，建议在其中加入带剧透性质的屏蔽词，如：
  * 进度条
  * 条过半
  * 记住这句话
  * ……

## 截图

* 设置入口

    ![设置入口](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliNoSpoilProgressBar/screenshot/设置入口.png)

* 脚本控制

    ![脚本控制-1](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliNoSpoilProgressBar/screenshot/脚本控制-1.png)

    ![脚本控制-2](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliNoSpoilProgressBar/screenshot/脚本控制-2.png)

**Source: [Gitee](https://gitee.com/liangjiancang/userscript/tree/master/script/BilibiliNoSpoilProgressBar) / [GitHub](https://github.com/liangjiancang/userscript/tree/master/script/BilibiliNoSpoilProgressBar)** - *by Laster2800*
