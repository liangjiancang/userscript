# [[DEBUG] 显式日志（注入版）](https://greasyfork.org/zh-CN/scripts/429525)

此脚本为 [[DEBUG] 显式日志](https://greasyfork.org/zh-CN/scripts/429521) 的注入版，详情请移步主脚本主页。

## 使用说明

在用户脚本的 Metadata Block 中，使用 `@require` 引入该脚本内容（确保为首个引入的文件），并使用 `@grant` 授予脚本对 `GM_setValue` / `GM_getValue` / `GM_registerMenuCommand` 的访问权限。

然后，就可以在脚本菜单中找到相应的设置项，如下图所示。

![注入设置](https://gitee.com/liangjiancang/userscript/raw/master/script/ExplicitLog/screenshot/注入设置.png)

注入版作为外部脚本存在，无法被脚本管理器自动更新。必要时需手动访问 [脚本主页](https://greasyfork.org/zh-CN/scripts/429525) 获取最新版 URL 并更新被注入脚本中的 `@require`。

仅建议在本地开发环境中使用，具体做法可参考 [debug-template](https://gitee.com/liangjiancang/userscript/blob/master/util/debug-template.js)。

## 补充说明

* 脚本基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，明确不支持 Greasemonkey。在其他浏览器及脚本管理器上运行可能会出现问题，请提供反馈。

*gitee: [ExplicitLog](https://gitee.com/liangjiancang/userscript/tree/master/script/ExplicitLog)*

*by Laster2800*
