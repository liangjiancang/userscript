# [[DEBUG] 显式日志](https://greasyfork.org/zh-CN/scripts/429521) 更新日志

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/ExplicitLog)。

## V1.1

1. 项目：新增「[DEBUG] 显式日志（注入版）」`ExplicitLog_Inject.js`。
2. 过滤器：修改包含过滤器的默认值为 `.*`，排除过滤器的默认值为 `^LOG$`。
3. 过滤器：修复将过滤器设置为空值时，不刷新页面前效果反而相当于 `.*` 的问题。

## V1.0

1. 功能实现：捕获日志并显式显示。
2. 功能实现：捕获未捕获异常并显式显示。
3. 功能实现：包含过滤器与排除过滤器。
