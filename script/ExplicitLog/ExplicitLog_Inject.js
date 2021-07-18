/**
 * ExplicitLog_Inject
 * @file [DEBUG] 显式日志（注入版）
 * @version 1.1.1.20210718
 * @author Laster2800
 */

(function() {
  (function() {
    try {
      const df = { include: '.*', exclude: '^LOG$' }
      const gmInclude = GM_getValue('ExplicitLog_Inject-include') ?? df.include
      const gmExclude = GM_getValue('ExplicitLog_Inject-exclude') ?? df.exclude
      let include = gmInclude ? new RegExp(gmInclude) : null
      let exclude = gmExclude ? new RegExp(gmExclude) : null
      // 日志
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
      // 菜单
      GM_registerMenuCommand('[DEBUG] 设置过滤器', () => {
        try {
          const sInclude = prompt(`【${GM_info.script.name}】\n\n设置匹配过滤器`, include?.source ?? df.include)
          if (typeof sInclude == 'string') {
            include = sInclude ? new RegExp(sInclude) : null
            GM_setValue('ExplicitLog_Inject-include', sInclude)
          }
          const sExclude = prompt(`【${GM_info.script.name}】\n\n设置排除过滤器`, exclude?.source ?? df.exclude)
          if (typeof sExclude == 'string') {
            exclude = sExclude ? new RegExp(sExclude) : null
            GM_setValue('ExplicitLog_Inject-exclude', sExclude)
          }
        } catch (e) {
          explicit(e)
        }
      })
      GM_registerMenuCommand('[DEBUG] 使用说明', () => window.open('https://gitee.com/liangjiancang/userscript/tree/master/script/ExplicitLog#使用说明'))
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
})()
