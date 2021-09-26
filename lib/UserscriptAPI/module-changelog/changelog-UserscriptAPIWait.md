# UserscriptAPIWait 更新日志

## V1.2

1. 模块：回调函数以参数而非 `this` 传递 `options`。
2. 模块：优化错误处理流程。
3. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。

## V1.1

1. `executeAfterElementLoaded()`：若执行时已存在对应元素，则针对已存在的对应元素同步执行 `callback(element)`。注意，其他元素等待 API 并不支持此特性。

## V1.0

1. 模块：从 `UserscriptAPI` 独立。
2. 代码：使用增强的代码规则。
