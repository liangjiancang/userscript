# UserscriptAPIWeb 更新日志

## V1.4

1. 模块：支持请求预处理 `preproc`。通过 `api.options.web.preproc = (xhr: GM_XHR) => void` 进行设置。

## V1.3

1. 代码：`unicorn/prefer-at`。（此项更新变更了兼容性要求）

## V1.2

1. 模块：优化错误处理流程。
2. 模块：`download()` 不再使用 `Array#at()`，以降低兼容性要求。
3. 代码：扩充代码规则至 `["eslint:all", "plugin:unicorn/all"]`，然后在此基础上做减法。

## V1.1

1. 迁移：`urlMatch()` 移动至 `base` 模块。

## V1.0

1. 模块：从 `UserscriptAPI` 独立。
2. 代码：使用增强的代码规则。
