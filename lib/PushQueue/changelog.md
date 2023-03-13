# [PushQueue](https://greasyfork.org/zh-CN/scripts/432936) 更新日志

## V1.1

1. 代码：不再显式提及容量 `capacity`，将其隐式并入 `maxSize`，并优化处理流程。
2. 代码：减少代码嵌套。
3. 重命名：`push()` -> `enqueue()`，`pop()` -> `dequeue()`。
4. 移除：`fromArray()`、`gc()`。
5. `get()`：修复索引越界不报错反而获取到值的问题。

## V1.0

1. 库：从 `BilibiliWatchlaterPlus` 独立。
