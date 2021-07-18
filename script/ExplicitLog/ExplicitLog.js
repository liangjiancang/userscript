// ==UserScript==
// @name            [DEBUG] 显式日志
// @version         1.1.1.20210718
// @namespace       laster2800
// @author          Laster2800
// @description     用 alert() 提示符合匹配规则的日志或未捕获异常，帮助开发者在日常使用网页时发现潜藏问题
// @homepage        https://greasyfork.org/zh-CN/scripts/429521
// @supportURL      https://greasyfork.org/zh-CN/scripts/429521/feedback
// @license         LGPL-3.0
// @include         *
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           unsafeWindow
// @run-at          document-start
// @incompatible    firefox 完全不兼容 Greasemonkey，不完全兼容 Violentmonkey
// ==/UserScript==

(function() {
  'use strict'
  try {
    const df = { include: '.*', exclude: '^LOG$' }
    const gmInclude = GM_getValue('include') ?? df.include
    const gmExclude = GM_getValue('exclude') ?? df.exclude
    let include = gmInclude ? new RegExp(gmInclude) : null
    let exclude = gmExclude ? new RegExp(gmExclude) : null
    // 日志
    const console = unsafeWindow.console
    const logs = ['log', 'warn', 'error']
    for (const log of logs) {
      const _ = console[log]
      console[log] = function() {
        const m = [arguments, log.toUpperCase()]
        if (match(m, include) && !match(m, exclude)) {
          explicit(arguments.length == 1 ? arguments[0] : JSON.stringify(arguments), log.toUpperCase())
        }
        return _.apply(console, arguments)
      }
    }
    // 未捕获异常
    unsafeWindow.addEventListener('error', function(event) { // 正常
      const m = [event.error, event.filename, 'Uncaught Exception (Normal)']
      if (match(m, include) && !match(m, exclude)) {
        explicit(event.error, 'Uncaught Exception (Normal)')
      }
    })
    unsafeWindow.addEventListener('unhandledrejection', function(event) { // from Promise
      const m = [event.reason, 'Uncaught Exception (in Promise)']
      if (match(m, include) && !match(m, exclude)) {
        explicit(event.reason, 'Uncaught Exception (in Promise)')
      }
    })
    // 菜单
    GM_registerMenuCommand('设置过滤器', () => {
      try {
        const sInclude = prompt(`【${GM_info.script.name}】\n\n设置匹配过滤器`, include?.source ?? df.include)
        if (typeof sInclude == 'string') {
          include = sInclude ? new RegExp(sInclude) : null
          GM_setValue('include', sInclude)
        }
        const sExclude = prompt(`【${GM_info.script.name}】\n\n设置排除过滤器`, exclude?.source ?? df.exclude)
        if (typeof sExclude == 'string') {
          exclude = sExclude ? new RegExp(sExclude) : null
          GM_setValue('exclude', sExclude)
        }
      } catch (e) {
        explicit(e)
      }
    })
    GM_registerMenuCommand('使用说明', () => window.open('https://gitee.com/liangjiancang/userscript/tree/master/script/ExplicitLog#使用说明'))
  } catch (e) {
    explicit(e)
  }
})()

/**
 * 显式地显示信息
 * @param {*} msg 信息
 * @param {string} [label] 标记
 */
function explicit(msg, label) {
  alert(`【${GM_info.script.name}】${label ? `【${label}】` : ''}\n\n${msg}`)
}

/**
 * @param {*} obj 匹配对象
 * @param {RegExp} regex 匹配正则表达式
 * @param {number} [depth=5] 匹配查找深度
 * @returns {boolean} 是否匹配成功
 */
function match(obj, regex, depth = 5) {
  if (obj && regex && depth > 0) {
    return core(obj, depth, new Set())
  } else {
    return false
  }

  function core(obj, depth, objSet) {
    for (var key in obj) {
      if (regex.test(key)) {
        return true
      } else {
        try {
          var value = obj[key]
          if (value) {
            if (typeof value == 'object' || typeof value == 'function') {
              if (regex.test(value.toString())) {
                return true
              } else if (depth > 1) {
                if (!objSet.has(value)) {
                  objSet.add(value)
                  if (core(value, depth - 1)) {
                    return true
                  }
                }
              }
            } else {
              if (regex.test(String(value))) {
                return true
              }
            }
          }
        } catch (e) {
          // value that cannot be accessed
        }
      }
    }
    return false
  }
}
