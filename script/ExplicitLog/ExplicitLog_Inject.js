/**
 * ExplicitLog_Inject
 * @file [DEBUG] 显式日志（注入版）
 * @version 1.0.0.20210718
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
