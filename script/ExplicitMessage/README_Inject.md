# [[DEBUG] 信息显式化（注入版）](https://greasyfork.org/zh-CN/scripts/429525)

此脚本为 [[DEBUG] 信息显式化](https://greasyfork.org/zh-CN/scripts/429521) 的注入版，详情请移步主脚本主页。

## 使用说明

在用户脚本的 Metadata Block 中，使用 `@require` 引入该脚本内容（确保为首个引入的文件），且可能需要使用 `@grant` 授予脚本对 `unsafeWindow` 的访问权限（视具体脚本管理器而定）。

**注入版基于 [主脚本](https://greasyfork.org/zh-CN/scripts/429521) 的设置及代码工作，只有安装并开启主脚本时，注入版才会开始工作！** 注入版不需要额外设置，主脚本设置即注入版设置，关闭主脚本等同于关闭注入版。

注入版作为外部脚本存在，**无法被脚本管理器自动更新**。必要时需手动访问 [脚本主页](https://greasyfork.org/zh-CN/scripts/429525) 获取最新版 URL 并更新被注入脚本中的 `@require` 属性值。

仅建议在本地开发环境中使用，具体做法可参考 [debug-template.user.js](https://gitee.com/liangjiancang/userscript/blob/master/util/debug-template.user.js)。

## 补充说明

* 脚本基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，不支持 Greasemonkey。要求 Edge / Chrome / Chromium 内核版本不小于 85，Firefox 版本不小于 90。

**Source: [Gitee](https://gitee.com/liangjiancang/userscript/tree/master/script/ExplicitMessage) / [GitHub](https://github.com/liangjiancang/userscript/tree/master/script/ExplicitMessage)** - *by Laster2800*
