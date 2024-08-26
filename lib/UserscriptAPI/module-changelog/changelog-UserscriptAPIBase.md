# UserscriptAPIBase 更新日志

## V1.3

1. `addStyle()`：`doc` 参数支持 `DocumentFragment`。

## V1.2

1. `initUrlchangeEvent()`：完善涉及捕获冒泡、执行顺序等细节的处理，并支持事件处理器属性 `window.onurlchange`，使其达到原生事件的标准。
2. `initUrlchangeEvent()`：提供符合标准且携带 URL 更改前后信息的 `UrlchangeEvent` 事件。
3. `initUrlchangeEvent()`：支持 `@grant none` 脚本。
4. 代码：`prefer-rest-params`。

> [论如何实现一个完善的 urlchange 事件](../../../doc/论如何实现一个完善的%20urlchange%20事件.md)

## V1.1

1. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。

## V1.0

1. 模块：作为基础方法集合，于 `UserscriptAPI` `v2.1` 建立。
2. 迁移：`addStyle()`、`initUrlchangeEvent()` 从 `dom` 模块移动至此。
3. 迁移：`debounce()`、`throttle` 从 `tool` 模块移动至此。
4. 迁移：`urlMatch()` 从 `web` 模块移动至此。
5. 新增：`alert()`、`confirm()`、`prompt()`，作为没有引入 `message` 时的自动替代。
6. `urlMatch()`：移除 `SINGLE` 模式，默认为 `OR` 模式。
