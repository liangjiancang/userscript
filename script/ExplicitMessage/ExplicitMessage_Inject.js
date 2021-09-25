/**
 * ExplicitMessage_Inject
 * @file [DEBUG] 信息显式化（注入版）
 * @version 1.3.1.20210925
 * @author Laster2800
 */

(function() {
  'use strict'

  let updateAlerted = false
  const injectVersion = 20210925
  for (const n of ['log', 'debug', 'info', 'warn', 'error']) {
    const log = console[n]
    console[n] = function() {
      if (unsafeWindow.gm429521?.fn?.wrappedLog) {
        const gm = unsafeWindow.gm429521
        if (injectVersion !== gm.injectUpdate) {
          if (!updateAlerted) {
            updateAlerted = true
            gm.fn.updateCheck?.(GM_info.script.name, injectVersion > gm.injectUpdate)
          }
          console[n] = log
        } else {
          console[n] = gm.fn.wrappedLog(console, log, n.toUpperCase(), GM_info.script.name)
        }
        Reflect.apply(console[n], console, arguments)
      } else {
        Reflect.apply(log, console, arguments)
      }
    }
  }
})()
