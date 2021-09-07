# UserscriptAPIMessage

## V1.1

1. 新增 `dialog()` 方法，用于创建对话框。
2. `alert()`、`confirm()`、`prompt()` 底层实现改为 `dialog()`（特殊情况下采用原生组件）。
3. `create()` 重命名为 `info()`，`advanced()` 重命名为 `advancedInfo()`。
4. 优化 `info()` 默认弹出位置。
5. 优化 `advancedInfo()` 的实现方案。
6. `close()` 支持关闭 `message` 中创建的所有信息元素。

## V1.0

1. 模块化。
