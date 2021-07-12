# [UserscriptAPI](https://greasyfork.org/zh-CN/scripts/409641)

本日志只记录用户友好的更新说明，影响不大的问题修复与修改不作记录，具体修改见 [提交记录](https://gitee.com/liangjiancang/userscript/commits/master/lib/UserscriptAPI/UserscriptAPI.js)。

## V1.1

1. 库：新增 `tool` API 集合。
2. `tool`：增加 `debounce()` 和 `throttle()` 用于消抖与节流。
3. `wait`：元素等待 API 引入节流控制，仅当 `repeat` 为 `false` 时生效。
4. `wait`：条件等待 API 实现机制由 `setInterval()` 改为 `setTimeout()`，大幅优化异步条件下的条件等待。
5. `dom`：`setAbsoluteCenter()` 现在会使目标元素在窗口尺寸变化时保持绝对居中状态。
6. 代码：使用可选链操作符 `?.` 及空值合并运算符 `??` 进行简写。

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
