# [[DEBUG] 显式日志](https://greasyfork.org/zh-CN/scripts/429521)

用 alert() 提示符合匹配规则的日志或未捕获异常，帮助开发者在日常使用网页时发现潜藏问题。求好评，求收藏💔。点击查看 [更新日志](https://gitee.com/liangjiancang/userscript/blob/master/script/ExplicitLog/changelog.md)。

## 使用说明

* 正则匹配

  区分大小写，不必考虑转义。

* 日志

  可用 `LOG` / `WARN` / `ERROR` 作为匹配目标。如用 `^LOG$` 作为排除过滤器排除所有 INFO 级别日志。

  无法捕获到非直接通过 `console` 对象打印出来的日志，如在油猴沙盒中运行的用户脚本打印出来的日志。

  **要捕获沙盒中的用户脚本的日志，须结合 [[DEBUG] 显式日志（注入版）](https://greasyfork.org/zh-CN/scripts/429525) 使用。注意，注入版只捕获所注入的沙盒的内部日志信息，须配合主脚本使用才能达到全面的捕获（无冲突）。**

* 未捕获异常（正常）

  可用 `Uncaught Exception (Normal)` 作为匹配目标。如简单地用 `cau` 来过滤出所有未捕获异常，但可能混杂带 `cau` 信息的日志。

  可用异常抛出处的文件名作为匹配目标。

* 未捕获异常（Promise）

  可用 `Uncaught Exception (in Promise)` 作为匹配目标。

## 补充说明

* 脚本基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，明确不支持 Greasemonkey。在其他浏览器及脚本管理器上运行可能会出现问题，请提供反馈。

## 截图

* 脚本设置

    ![脚本设置](https://gitee.com/liangjiancang/userscript/raw/master/script/ExplicitLog/screenshot/脚本设置.png)

*gitee: [ExplicitLog](https://gitee.com/liangjiancang/userscript/tree/master/script/ExplicitLog)*

*by Laster2800*
