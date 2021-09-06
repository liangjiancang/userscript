/**
 * UserscriptAPITool
 *
 * 依赖于 `UserscriptAPI`。
 *
 * 需要通过 `@grant` 引入 `GM_xmlhttpRequest` 或 `GM_download`。
 * @version 1.0.0.20210906
 * @author Laster2800
 * @see {@link https://gitee.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI UserscriptAPI}
 */
class UserscriptAPITool {
  /**
   * 生成消抖函数
   * @param {Function} fn 目标函数
   * @param {number} [wait=0] 消抖延迟
   * @param {Object} [options] 选项
   * @param {boolean} [options.leading] 是否在延迟开始前调用目标函数
   * @param {boolean} [options.trailing=true] 是否在延迟结束后调用目标函数
   * @param {number} [options.maxWait=0] 最大延迟时间（非准确），`0` 表示禁用
   * @returns {Function} 消抖函数 `debounced`，可调用 `debounced.cancel()` 取消执行
   */
  debounce(fn, wait = 0, options = {}) {
    options = {
      leading: false,
      trailing: true,
      maxWait: 0,
      ...options,
    }

    let tid = null
    let start = null
    let execute = null
    let callback = null

    function debounced() {
      execute = () => {
        fn.apply(this, arguments)
        execute = null
      }
      callback = () => {
        if (options.trailing) {
          execute?.()
        }
        tid = null
        start = null
      }

      if (tid) {
        clearTimeout(tid)
        if (options.maxWait > 0 && new Date().getTime() - start > options.maxWait) {
          callback()
        }
      }

      if (!tid && options.leading) {
        execute?.()
      }

      if (!start) {
        start = new Date().getTime()
      }

      tid = setTimeout(callback, wait)
    }

    debounced.cancel = function() {
      if (tid) {
        clearTimeout(tid)
        tid = null
        start = null
      }
    }

    return debounced
  }

  /**
   * 生成节流函数
   * @param {Function} fn 目标函数
   * @param {number} [wait=0] 节流延迟（非准确）
   * @returns {Function} 节流函数 `throttled`，可调用 `throttled.cancel()` 取消执行
   */
  throttle(fn, wait = 0) {
    return this.debounce(fn, wait, {
      leading: true,
      trailing: true,
      maxWait: wait,
    })
  }
}

/* global UserscriptAPI */
{ UserscriptAPI.registerModule('tool', UserscriptAPITool) }