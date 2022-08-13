/**
 * ExplicitMessage_Inject
 * @file [DEBUG] 信息显式化（注入版）
 * @version 1.5.0.20220813
 * @author Laster2800
 */

(function() {
  'use strict'

  let updateAlerted = false
  const injectVersion = 20220813
  const win = typeof unsafeWindow === 'object' ? unsafeWindow : window
  const m = win[Symbol.for('ExplicitMessage')]
  for (const n of ['log', 'debug', 'info', 'warn', 'error']) {
    const log = console[n]
    console[n] = (...args) => {
      if (m?.fn?.wrappedLog) {
        if (injectVersion !== m.injectUpdate) {
          if (!updateAlerted) {
            updateAlerted = true
            m.fn.updateCheck?.(GM_info.script.name, injectVersion > m.injectUpdate)
          }
          console[n] = log
        } else {
          console[n] = m.fn.wrappedLog(console, log, n.toUpperCase(), GM_info.script.name)
        }
        Reflect.apply(console[n], console, args)
      } else {
        Reflect.apply(log, console, args)
      }
    }
  }
})()
