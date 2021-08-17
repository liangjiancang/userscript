// ==UserScript==
// @name            [DEBUG] 对象观察器
// @version         2.1.1.20210817
// @namespace       laster2800
// @author          Laster2800
// @description     右键菜单激活，向 window 中注入 ObjectInspector 工具类，用于查找特定对象上符合条件的属性
// @license         LGPL-3.0
// @include         *
// @grant           none
// @run-at          context-menu
// ==/UserScript==

(function() {
  const getObjectInspector = win => {
    /**
     * 对象观察器
     * 
     * 根据 `regex` 在 `depth` 层深度内找到匹配 `regex` 的属性。
     *
     * 比如，已知某关键属性值为 `geo110`，可用： `new ObjectInspector(window, /^geo110$/).inspect()` 来确认其是否在页面中存在，并列出其在 `window` 上的存储路径。
     *
     * 又如，可用 `new ObjectInspector(window, /id$/i, { inspectValue: false }).inspect()` 列出存储在页面上的各种可能为 ID 的信息。
     *
     * 使用须知：
     * 1. `inspectValue = false`、`noWindows = false`、`exType = (过滤大量常见对象的数组)` 能大幅降低观察时间，若它们均不提供约束，观察时间将会是原来数倍乃数十倍。相反，只要三者之中有一个提供了约束，就能起到相当好的效果。一般不需要考虑这点，因为默认设置的 `noWindows` 和 `exType` 具备相当高的过滤强度。只需在手动设置 `noWindows` 及 `exType` 时多加注意即可。
     * 2. 承上，有些特殊情况需要 `inspectValue = noWindows = true`、`exType = null`，此时可以降低 `depth`，或是做好观察时间长达数分钟的心理准备。
     * 3. 脚本激活时会向顶层 `window` 及 frame `window` 均注入 `ObjectInspector`。
     * 4. 尽可能使用当前上下文的 `window.ObjectInspector` 来观察同一上下文中的对象，否则默认 `exType` 将无法生效，以至于观察到不必要的属性，且使观察时间大大增加。错误示范：`new top.ObjectInspector(iframe.contentWindow, /wrong/).inspect()`。
     */
    return class ObjectInspector {
      /**
       * @param {Object} obj 默认观察对象
       * @param {RegExp} regex 默认匹配正则表达式
       * @param {Object} [config] 配置
       * @param {number} [config.depth=6] 默认观察深度
       * @param {boolean} [config.inspectKey=true] 观察时是否匹配键名
       * @param {boolean} [config.inspectValue=true] 观察时是否匹配键值
       * @param {boolean} [config.noWindows=true] 排除 Window 对象
       * @param {RegExp} [config.exRegex=null] 用于排除匹配键名的正则表达式
       * @param {Object[]} [config.exType=[Function, Node, StyleSheet]] 用于排除匹配这些类型的对象
       * @param {number} [config.exLongStrLen] 超过此长度的字符串移除，设为假值表示无限制
       */
      constructor(obj, regex, config) {
        this.config = {
          obj: obj,
          regex: regex,
          depth: 6,
          inspectKey: true,
          inspectValue: true,
          noWindows: true,
          exRegex: null,
          exType: [win.Function, win.Node, win.StyleSheet],
          exLongStrLen: null,
          ...config,
        }
      }

      /**
       * 观察对象，根据 `regex` 在 `depth` 层深度内找到所有键或者值匹配 `regex` 的属性
       * @param {Object} [config] 配置，没有提供的项使用默认值
       * @param {Object} [config.obj] 观察对象
       * @param {RegExp} [config.regex] 匹配正则表达式
       * @param {number} [config.depth] 观察深度
       * @param {boolean} [config.inspectKey] 观察时是否匹配键名
       * @param {boolean} [config.inspectValue] 观察时是否匹配键值
       * @param {boolean} [config.noWindows=true] 排除 Window 对象
       * @param {RegExp} [config.exRegex] 用于排除匹配键名的正则表达式
       * @param {Object[]} [config.exType] 用于排除匹配这些类型的对象
       * @param {number} [config.exLongStrLen] 超过此长度的字符串移除，设为假值表示无限制
       * @returns {Object} 封装匹配 `regex` 属性的对象
       */
      inspect(config) {
        console.log('ObjectInspector: 开始观察，可能需要较长时间，请耐心等待...')
        config = { ...this.config, ...config }
        const depth = config.depth
        const result = {}
        if (depth > 0) {
          const objSet = new Set()
          const prevKey = ''
          this._inner(config, depth, result, prevKey, objSet)
        }
        return result
      }

      _inner({ obj, regex, inspectKey, inspectValue, noWindows, exRegex, exType, exLongStrLen }, depth, result, prevKey, objSet) {
        if (!obj || depth == 0) return
        _innerLoop: for (const key in obj) {
          if (exRegex?.test(key)) continue
          if (inspectKey && regex.test(key)) {
            result[prevKey + key] = obj[key]
          } else {
            try {
              const value = obj[key]
              if (value && (typeof value == 'object') || typeof value == 'function') {
                if (value == obj) continue
                if (noWindows && value == value.window) continue
                if (exType) {
                  for (const type of exType) {
                    if (value instanceof type) continue _innerLoop
                  }
                }

                if (inspectValue && regex.test(value.toString())) {
                  result[prevKey + key] = value
                } else if (depth > 1) {
                  if (!objSet.has(value)) {
                    objSet.add(value)
                    this._inner({ obj: value, regex, inspectKey, inspectValue, noWindows, exRegex, exType, exLongStrLen }, depth - 1, result, `${prevKey + key}.`, objSet)
                  }
                }
              } else {
                let sVal = value
                if (typeof value == 'string') {
                  if (depth > 1) {
                    try {
                      const json = JSON.parse(value)
                      if (json) { // exclude 'null' and 'undefined'
                        this._inner({ obj: json, regex, inspectKey, inspectValue, exRegex, exType, exLongStrLen }, depth - 1, result, `${prevKey + key}{JSON-PARSE}:`, objSet)
                        continue
                      }
                    } catch (e) { /* nothing to do */ }
                  }
                  if (exLongStrLen && value.length > exLongStrLen) continue
                } else if (typeof value == 'symbol') {
                  sVal = String(value)
                }
                if (inspectValue && regex.test(sVal)) {
                  result[prevKey + key] = value
                }
              }
            } catch (e) { /* value that cannot be accessed */ }
          }
        }
      }
    }
  }

  const executed = []
  const exec = win => {
    if (executed.indexOf(win) >= 0) return
    try {
      executed.push(win)
      if (!win.ObjectInspector) {
        win.ObjectInspector = getObjectInspector(win)
      }
      for (let i = 0; i < win.frames.length; i++) {
        exec(win.frames[i])
      }
    } catch (e) { /* cross-origin frame */ }
  }
  exec(top)

  const msg = '已向 window 注入 ObjectInspector。\n用法请查看脚本中的文档注释。'
  alert(msg)
  console.log(msg)
})()
