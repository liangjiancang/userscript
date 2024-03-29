# [B站点赞批量取消](https://greasyfork.org/zh-CN/scripts/445754)

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/script/BilibiliCancelLikes)。

## V1.2

1. 取消点赞：进一步理解B站点赞相关机制，纠正之前错误的理解，对流程进行大幅调整优化。总之，现在可以确确实实地取消对某UP主的所有点赞了。
2. 取消点赞：禁止同时开启多个任务。
3. 脚本：找到一个不容易触发B站后台拦截机制的延时。
4. 脚本：API 一律通过 HTTPS 访问。
5. 脚本：更新兼容性说明。
6. 外部：`UserscriptAPIWait` 更新至 V1.3，`UserScriptAPIWeb` 更新至 V1.3。

## V1.1

1. 取消点赞：优化对话框信息和控制台信息。
2. 取消点赞：优化流程，增加「共执行多少页」选项。
3. UI：优化「取消点赞」按钮位置，并修复在黑名单 UP 主页面无法生成「取消点赞」按钮的问题。
4. UI：执行完毕时自动关闭过时的提示对话框。
5. UI：优化文本。
6. 外部：`UserscriptAPIMessage` 更新至 V1.3。

## V1.0

1. 脚本：实现功能及发布。
