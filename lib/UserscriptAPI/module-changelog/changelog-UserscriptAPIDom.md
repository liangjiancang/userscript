# UserscriptAPIDom 更新日志

## V1.2

1. 新增：`findAncestor()`，用于查找符合条件的祖先元素。
2. 移除：`isFixed()`。新增的 `findAncestor()` 能覆盖该功能。
3. 移除：`containsClass()`。`Element.classList.contains()` `Element.matches()` 是更好的替代方案。
4. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。

## V1.1

1. 迁移：`addStyle()`、`initUrlchangeEvent()` 移动至 `base` 模块。
2. 移除：`addClass()`、`removeClass()`。`Element.classList` 是更好的替代方案。

## V1.0

1. 模块：从 `UserscriptAPI` 独立。
2. 代码：使用增强的代码规则。
