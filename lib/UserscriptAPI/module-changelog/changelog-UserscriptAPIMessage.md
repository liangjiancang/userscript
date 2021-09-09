# UserscriptAPIMessage

## V1.1

1. 新增 `dialog()` 方法，用于创建对话框。
2. `alert()`、`confirm()`、`prompt()` 底层实现改为 `dialog()`（特殊情况下采用原生组件）。
3. `create()` 重命名为 `info()`，`advanced()` 重命名为 `hoverInfo()`。
4. 优化 `info()` 文本显示效果及默认弹出位置。
5. 优化 `hoverInfo()` 实现方案。后续可通过启动元素上的 `hoverInfo` 属性修改悬浮信息设置，也可再次在启动元素上调用该方法修改。
6. `close()` 支持关闭 `message` 中创建的所有信息元素。

## V1.0

1. 模块化。
