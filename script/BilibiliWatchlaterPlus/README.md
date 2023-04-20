# [B站稍后再看功能增强](https://greasyfork.org/zh-CN/scripts/395456)

相关脚本：**[B站封面获取](https://greasyfork.org/zh-CN/scripts/395575)**、**[B站共同关注快速查看](https://greasyfork.org/zh-CN/scripts/428453)**、**[B站点赞批量取消](https://greasyfork.org/zh-CN/scripts/445754)**

其他脚本：**[[DEBUG] 信息显式化](https://greasyfork.org/zh-CN/scripts/429521)**、**[S1战斗力屏蔽](https://greasyfork.org/zh-CN/scripts/394407)**，以及 **[杂项](https://greasyfork.org/zh-CN/scripts?language=all&set=470770)**

与稍后再看功能相关，一切你能想到和想不到的功能。一图胜千言，无须多言。求好评，求收藏💔。点击查看 [更新日志](https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliWatchlaterPlus/changelog.md)。

![用户设置](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliWatchlaterPlus/screenshot/用户设置-p)

## Q&A

1. 在批量添加管理器中，从文件导入稿件只显示 `aid`，如何才能显示完整信息？

    应根据自己需要调整「导出稍后再看列表」和「导入稍后再看列表」设置。这里提供一套简单的配置方案：

    导出设置：

    ```js
    导出至剪贴板 = 否
    导出至新页面 = 否
    导出至文件 = 是
    导出文件名 = '稍后再看列表.${Date.now()}.txt'
    相邻稿件换行 = 是
    稿件导出模板 = 'bvid:${ITEM.bvid},title:${ITEM.title},src:${ITEM.owner.name},ts:${ITEM.pubdate}'
    ```

    导入设置：

    ```text
    正则表达式
        bvid:(.*),title:(.*),src:(.*),ts:(.*)
    捕获组
        -1  1  2  3  4  -1
    ```

## 补充说明

* 脚本基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，不支持 Greasemonkey。要求 Edge / Chrome / Chromium 内核版本不小于 93，Firefox 版本不小于 92。

## 截图

*截图中视频均从B站排行榜获取，请勿以此推测作者偏好。*

* 顶栏入口

    ![顶栏入口](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliWatchlaterPlus/screenshot/顶栏入口-p)

* 列表页

    ![列表页](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliWatchlaterPlus/screenshot/列表页-p)

* 批量添加

    ![批量添加](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliWatchlaterPlus/screenshot/批量添加-p)

* 移除记录

    ![移除记录](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliWatchlaterPlus/screenshot/移除记录-p)

* 快速切换

    ![快速切换](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliWatchlaterPlus/screenshot/快速切换-p)

* 设置入口

    ![设置入口](https://gitee.com/liangjiancang/userscript/raw/master/script/BilibiliWatchlaterPlus/screenshot/设置入口-p)

**Source: [Gitee](https://gitee.com/liangjiancang/userscript/tree/master/script/BilibiliWatchlaterPlus) / [GitHub](https://github.com/liangjiancang/userscript/tree/master/script/BilibiliWatchlaterPlus)** - *by Laster2800*
