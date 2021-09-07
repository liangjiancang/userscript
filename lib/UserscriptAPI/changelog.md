# [UserscriptAPI](https://greasyfork.org/zh-CN/scripts/409641)

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/lib/UserscriptAPI)。模块更新记录见 [module-changelog](./module-changelog/)。

## V2.0

1. 库：将现有 API 按类型拆分为多个文件，模块化 API。以后模块更新记录见 [module-changelog](./module-changelog/)。

## V1.8

1. `web`：重做 `request()`，并新增 `requestXHR()`。现网络请求 API 提供检查、解析、报告等功能。
2. `web`：修复 Violentmonkey 在发送 POST 请求时，擅自往请求头中添加 `origin` 导致请求失败的问题。
3. `dom`：`waitQuerySelector()` 重命名为 `$()`。
4. 库：优化错误处理流程。
5. 代码：引入逻辑空赋值运算符 `??=`、逻辑或赋值运算符 `||=` 及逻辑与赋值运算符 `&&=`。

## V1.7

1. `dom`：`fade()` 读取 `target` 上的 `fadeInDisplay` 来设定渐显开始后的 `display` 样式。若没有设定：
   * 若当前 `display` 与 `fadeOutDisplay` 不同，默认值为当前 `display`。
   * 若当前 `display` 与 `fadeOutDisplay` 相同，默认值为 `block`。
2. `dom`：`fade()` 读取 `target` 上的 `fadeOutDisplay` 来设定渐隐开始后的 `display` 样式，默认值为 `none`。
3. 库：若能访问到 `unsafeWindow`，则实例化时将实例引用保存在 `unsafeWindow` 而非 `window` 上。

## V1.6

1. `wait`：优化元素等待 API，使得启用 `multiple` 或 `repeat` 时支持检测节流。
2. `wait`：针对元素等待 API，明确 `multiple` 与 `repeat` 在各种取值下的最佳行为并以此为基准重新设计行为。
3. `wait`：优化元素等待 API 错误处理流程，使得启用 `multiple` 并禁用 `stopOnError` 时，在同一个检测集合中，前方元素的回调处理错误不会影响到后方元素的处理。
4. `wait`：优化元素等待 API 后台计时逻辑。
5. `dom`：将 `setAbsoluteCenter()` 重命名为 `setPosition()`，并移除其让目标元素在窗口尺寸变化后依然保持在设定位置的作用。
6. 库：修复基于同一 `id` 再次获取 `Userscript` 对象时，内部数据出错的问题。

## V1.5

1. `message`：鼠标在 `advanced()` 产生的信息框上移动一小段距离后，将关闭信息框。
2. `message`：`advanced()` 方法 `flag` 参数变更为可选的，缺省时提供合理的显示效果。
3. `message`：提高信息框 `z-index`，以确保信息框在绝大多数情况下不会被覆盖。

## V1.4

1. 库：优化文档注释。
2. 库：`no-useless-call`。
3. `web`：`request()` 方法 `details.data` 选项支持 `URLSearchParam` 类型对象，并在这种情况下将 `content-type` 设为 `application/x-www-form-urlencoded`。
4. `dom`：增加 `addStyle()` 方法，支持向 `<iframe>` 中添加样式。
5. `dom`：优化 `isFixed()` 方法。
6. `message`：`create()` 与 `close()` 增加回调函数。

## V1.3

1. 库：修复在网速极慢的情况下，在 `document-start` 时期运行出错的问题。
2. `message`：增加 `alert()`、`confirm()`、`prompt()` 方法。
3. `dom`: `fade()` 增加 `display` 参数，用于控制元素在可视状态下的 `display` 样式。
4. `dom`: `fade()` 读取 `target` 上的 `fadeInTime` 和 `fadeOutTime` 属性来设定渐显和渐隐时间，它们应为以 `ms` 为单位的 `number`；缺省时，元素的 `transition-duration` 必须与 `api.options.fadeTime` 一致。
5. `dom`: `fade()` 读取 `target` 上的 `fadeInFunction` 和 `fadeOutFunction` 属性来设定渐变效果（默认 `ease-in-out`），它们应为符合 `transition-timing-function` 的 `string`。
6. `dom`: `fade()` 读取 `target` 上的 `fadeInNoInteractive` 和 `fadeOutNoInteractive` 属性来设定渐显和渐隐期间是否禁止交互，它们应为 `boolean`。
7. `dom`：移除 `getElementLeft()` 和 `getElementTop()`。

## V1.2

1. 库：优化构造参数，方便对各种默认选项进行配置。
2. `wait`：`stopOnError` 选项默认开启。
3. `wait`：条件等待 API 内部超时机制改用相对准确的计时方式实现，避免在异步条件中等待过长时间。
4. `wait`：条件等待 API 增加 `stopOnTimeout` 选项。默认开启，行为保持不变。
5. `wait`：元素等待 API 增加 `stopOnTimeout` 选项。默认关闭，即等待超时时会打印错误信息，但不会终止元素等待。
6. `wait`：元素等待 API 增加 `stopCondition` 及 `onStop` 选项，便于外部终止元素等待。
7. `wait`：`waitQuerySelector()` 第三个参数从 `subtree` 改为 `stopOnTimeout`。
8. `wait`：修复执行终止指令后，在特殊情况下依然等待成功的问题。
9. `dom`：增加 `getElementLeft()` 和 `getElementTop()` 用于获取元素绝对坐标。
10. `logger`：增加 `warn()` 方法，并调整 `log()` 的参数列表。
11. 代码：优化文档表述。

## V1.1

1. 库：新增 `tool` API 集合。
2. `tool`：增加 `debounce()` 和 `throttle()` 用于消抖与节流。
3. `wait`：元素等待 API 引入节流控制，仅当 `repeat` 为 `false` 时生效。
4. `wait`：条件等待 API 实现机制由 `setInterval()` 改为 `setTimeout()`，大幅优化异步条件下的条件等待。
5. `dom`：采用 `Element.classList` 重写并增强类名 API。
6. `dom`：`setAbsoluteCenter()` 现在会使目标元素在窗口尺寸变化时保持在设定位置。
7. 代码：引入可选链操作符 `?.` 及空值合并运算符 `??`。

## V1.0

1. `wait`：重做元素等待 API，检测方式从轮询改为 `MutationObserver`。
2. `wait`：整体处理流程优化。
3. `dom`：修改 `createLocationchangeEvent()` 为 `initUrlchangeEvent()`，用于兼容不支持 `urlchange` 事件的脚本管理器。
4. 库：移除对 `GM_addStyle()` 的依赖。
5. 库：移除对 `unsafeWindow` 的依赖。

## V0

洪荒年代一步一步改进上来的，这里贴一下这套 API 最初版本的样子。

```js
/**
 * 在 selector 对应元素加载完成后执行操作
 *
 * @param {string} selector 该选择器指定一个元素 element，当这个元素加载成功时执行 callback(element)
 * @param {string} stopSelector 该选择器指定一个元素 stopElement，当这个元素加载成功时终止检测
 * @param {number} interval 检测 element 和 stopElement 是否加载成功的时间间隔（单位：ms）
 * @param {number} timeout 当检测时间超出该时间后，终止检测（单位：ms）
 * @param {Function} callback 当 element 加载成功时执行 callback(element)
 */
function executeUntilLoaded(selector, stopSelector, interval, timeout, callback) {
    var cnt = 0
    var maxCnt = timeout / interval
    var tid = setInterval(() => {
        var element = document.querySelector(selector)
        var stopElement = stopSelector ? document.querySelector(stopSelector) : null
        if (element || stopElement || ++cnt >= maxCnt) {
            clearInterval(tid)
        }
        element && callback(element)
    }, interval)
}
```
