# misc

此目录下涵括各种不必单独建立目录的小脚本或用户样式，详见下表。点击查看 **[杂项](https://greasyfork.org/zh-CN/scripts?language=all&set=470770)** 以及 **[其他脚本](https://greasyfork.org/zh-CN/scripts?language=all&set=470686)**。

| 类型 | 名称                                                                                 | 描述                                                                                                                                                                                                                                                                                 |
| ---- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 脚本 | [B站SEO页面重定向](https://greasyfork.org/zh-CN/scripts/430227)                      | 从形如 <https://www.bilibili.com/s/video/BV1xx411c7mD> 的B站 SEO 页面重定向至常规页面。Google 搜索结果中经常会包含这样的页面。                                                                                                                                                       |
| 脚本 | [Greasy Fork URL 脚本名称清理](https://greasyfork.org/zh-CN/scripts/431940)          | 清理 Greasy Fork URL 中的脚本名称。                                                                                                                                                                                                                                                  |
| 调试 | [[DEBUG] 对象观察器](https://greasyfork.org/zh-CN/scripts/430945)                    | 右键菜单激活，向 `window` 中注入 `ObjectInspector` 工具类，用于查找特定对象上符合条件的属性。激活无显式提醒，请自行打开控制台获取信息。用法请查看脚本中的文档注释。                                                                                                                  |
| 调试 | [[DEBUG] 异常诱因日志](https://greasyfork.org/zh-CN/scripts/432924)                  | 记录异常诱因，详见 [proposal-error-cause](https://github.com/tc39/proposal-error-cause)。目前各主流浏览器对该特性支持相当有限，该脚本致力于提供临时的解决方案。注意，无法捕获在控制台抛出的异常，请勿在控制台输入 `throw new Error('test', { cause: [1, 2, 3] })` 或以类似方式测试。 |
| 调试 | [[DEBUG] 网页内容编辑模式 (DesignMode)](https://greasyfork.org/zh-CN/scripts/430949) | 通过右键菜单快速切换 [designMode](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/designMode) 状态。                                                                                                                                                                       |
| 样式 | [滚动条美化](https://greasyfork.org/zh-CN/scripts/430290)                            | 美化滚动条。                                                                                                                                                                                                                                                                         |
| 样式 | [B站顶栏固顶](https://greasyfork.org/zh-CN/scripts/430292)                           | 固顶B站顶栏。                                                                                                                                                                                                                                                                        |

## 补充

1. 用户样式建议使用 Stylus 安装。

    ![userstyle](https://gitee.com/liangjiancang/userscript/raw/master/misc/screenshot/userstyle.png)

2. 建议如下配置脚本管理器的上下文菜单，以便更好地使用运行在 `context-menu` 的脚本。

    ![右键菜单设置](https://gitee.com/liangjiancang/userscript/raw/master/misc/screenshot/右键菜单设置.png)

    ![context-menu 脚本](https://gitee.com/liangjiancang/userscript/raw/master/misc/screenshot/context-menu%20脚本.png)

**Source: [Gitee](https://gitee.com/liangjiancang/userscript/tree/master/misc) / [GitHub](https://github.com/liangjiancang/userscript/tree/master/misc)** - *by Laster2800*
