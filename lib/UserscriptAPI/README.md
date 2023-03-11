# [UserscriptAPI](https://greasyfork.org/zh-CN/scripts/409641)

My API for userscripts.

需要引入模块方可工作，具体使用请参考源代码中的 JSDoc。点击查看 [更新日志](https://gitee.com/liangjiancang/userscript/blob/master/lib/UserscriptAPI/changelog.md)。

所有模块均依赖于 `UserscriptAPI`，详细信息如下：

| 模块      | 依赖模块 | Greasy Fork                                           |
| --------- | -------- | ----------------------------------------------------- |
| `base`    |          | BuiltIn                                               |
| `dom`     |          | [431998](https://greasyfork.org/zh-CN/scripts/431998) |
| `logger`  |          | BuiltIn                                               |
| `message` | `dom`    | [432000](https://greasyfork.org/zh-CN/scripts/432000) |
| `wait`    |          | [432002](https://greasyfork.org/zh-CN/scripts/432002) |
| `web`     |          | [432003](https://greasyfork.org/zh-CN/scripts/432003) |

必须先引用 `UserscriptAPI` 再引入模块，如：

```js
// @require     https://www.example.com/UserscriptAPI.js
// @require     https://www.example.com/UserscriptAPIDom.js
// @require     https://www.example.com/UserscriptAPIMessage.js
// @require     https://www.example.com/UserscriptAPIWait.js
// @require     https://www.example.com/UserscriptAPIWeb.js
```

## 补充说明

* 脚本库基于 Microsoft Edge 浏览器和 Tampermonkey 脚本管理器开发，不支持 Greasemonkey。要求 Edge / Chrome / Chromium 内核版本不小于 93，Firefox 版本不小于 92。

**Source: [Gitee](https://gitee.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI) / [GitHub](https://github.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI)** - *by Laster2800*
