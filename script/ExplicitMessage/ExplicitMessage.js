/**
 * ExplicitMessage_Inject
 * @file [DEBUG] 信息显式化（注入版）
 * @version 1.1.0.20210720
 * @author Laster2800
 */

(function() {
  for (const n of ['log', 'warn', 'error']) {
    const log = console[n]
    console[n] = function() {
      if (unsafeWindow.gm429521?.fn?.wrappedLog) {
        console[n] = unsafeWindow.gm429521.fn.wrappedLog(console, log, n.toUpperCase(), GM_info.script.name)
        console[n].apply(console, arguments)
      } else {
        log.apply(console, arguments)
      }
    }
  }
})()
