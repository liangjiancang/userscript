# UserscriptAPIBase 更新日志

## V1.1

1. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。

## V1.0

1. 模块：作为基础方法集合，于 `UserscriptAPI` `v2.1` 建立。
2. 迁移：`addStyle()`、`initUrlchangeEvent()` 从 `dom` 模块移动至此。
3. 迁移：`debounce()`、`throttle` 从 `tool` 模块移动至此。
4. 迁移：`urlMatch()` 从 `web` 模块移动至此。
5. 新增：`alert()`、`confirm()`、`prompt()`，作为没有引入 `message` 时的自动替代。
6. `urlMatch()`：移除 `SINGLE` 模式，默认为 `OR` 模式。
