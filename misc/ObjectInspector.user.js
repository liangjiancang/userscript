// ==UserScript==
// @name            [DEBUG] 对象观察器
// @version         2.0.1.20210817
// @namespace       laster2800
// @author          Laster2800
// @description     右键菜单激活，向 window 中注入 ObjectInspector 工具类
// @license         LGPL-3.0
// @include         *
// @grant           none
// @run-at          context-menu
// ==/UserScript==

(function() {
  if (!window.ObjectInspector) {
    /**
     * 对象观察器
     * 
     * 根据 `regex` 在 `depth` 层深度内找到匹配 `regex` 的属性。
     *
     * 比如，已知某关键属性值为 `geo110`，可用： `new ObjectInspector(window, /^geo110$/). inspect()` 来确认其是否在页面中存在，并列出其在 `window` 上的存储路径。
     *
     * 又如，猜测页面中存在各种类型的 ID 信息，可用 `new ObjectInspector(window, /id$/i, { inspectValue: false }). inspect()` 来确认并列出存储路径。
     */
    window.ObjectInspector = class ObjectInspector {
      /**
       * @param {Object} obj 默认观察对象
       * @param {RegExp} regex 默认匹配正则表达式
       * @param {Object} [config] 配置
       * @param {number} [config.depth=6] 默认观察深度
       * @param {boolean} [config.inspectKey=true] 观察时是否匹配键名
       * @param {boolean} [config.inspectValue=true] 观察时是否匹配键值
       * @param {boolean} [config.noFrames=true] 排除 frame
       * @param {RegExp} [config.exRegex=null] 用于排除匹配键名的正则表达式
       * @param {Object[]} [config.exType=[Node, StyleSheet]] 用于排除匹配这些类型的对象
       * @param {number} [config.exLongStrLen] 超过此长度的字符串移除，设为假值表示无限制
    
       */
      constructor(obj, regex, config) {
        this.config = {
          obj: obj,
          regex: regex,
          depth: 5,
          inspectKey: true,
          inspectValue: true,
          noFrames: true,
          exRegex: null,
          exType: [Node, StyleSheet],
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
       * @param {boolean} [config.noFrames=true] 排除 frame
       * @param {RegExp} [config.exRegex] 用于排除匹配键名的正则表达式
       * @param {Object[]} [config.exType] 用于排除匹配这些类型的对象
       * @param {number} [config.exLongStrLen] 超过此长度的字符串移除，设为假值表示无限制
       * @returns {Object} 封装匹配 `regex` 属性的对象
       */
      inspect(config) {
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
  
      _inner({ obj, regex, inspectKey, inspectValue, noFrames, exRegex, exType, exLongStrLen }, depth, result, prevKey, objSet) {
        if (!obj || depth == 0) return
        for (const key in obj) {
          if (exRegex?.test(key)) continue
          if (inspectKey && regex.test(key)) {
            result[prevKey + key] = obj[key]
          } else {
            try {
              const value = obj[key]
              if (value == obj) continue
              if (value && (typeof value == 'object') || typeof value == 'function') {
                if (noFrames) {
                  if (value && value == value.window && value != top) continue
                }
                if (inspectValue && regex.test(value.toString())) {
                  result[prevKey + key] = value
                } else if (depth > 1) {
                  let isExType = false
                  if (exType) {
                    for (const type of exType) {
                      if (value instanceof type) {
                        isExType = true
                        break
                      }
                    }
                  }
                  if (!isExType && !objSet.has(value)) {
                    objSet.add(value)
                    this._inner({ obj: value, regex, inspectKey, inspectValue, noFrames, exRegex, exType, exLongStrLen }, depth - 1, result, `${prevKey + key}.`, objSet)
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

  const msg = 'ObjectInspector 注入成功，用法请查看脚本中的文档注释'
  alert(msg)
  console.log(msg)
})()
