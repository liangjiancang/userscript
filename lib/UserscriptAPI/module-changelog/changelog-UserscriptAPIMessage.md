# UserscriptAPIMessage 更新日志

## V1.2

1. `info`：回调函数以参数而非 `this` 回传 `infobox` 元素。
2. `dialog`：回调函数不再以 `this` 回传 `dialog` 元素。
3. `close`：回调函数以参数而非 `this` 回传信息元素。
4. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。

## V1.1

1. 新增：`dialog()`，用于创建对话框。
2. 库：`alert()`、`confirm()`、`prompt()` 底层实现改为 `dialog()`（特殊情况下采用原生组件）。
3. 库：`create()` 重命名为 `info()`，`advanced()` 重命名为 `hoverInfo()`。
4. `info()`：优化文本显示效果及默认弹出位置。
5. `info()`：重载，第二个参数可直接传入 `number` 设定显示时间。
6. `hoverInfo()`：优化实现方案。后续可通过启动元素上的 `hoverInfo` 属性修改悬浮信息设置，也可再次在启动元素上调用该方法修改。
7. `close()`：支持关闭 `message` 中创建的所有信息元素。
8. 代码：使用增强的代码规则。

## V1.0

1. 模块：从 `UserscriptAPI` 独立。
