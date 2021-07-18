/**
 * ExplicitLog_Inject
 * @file [DEBUG] 显式日志（注入版）
 * @version 2.1.0.20210718
 * @author Laster2800
 */

(function() {
  const wrappedLog = unsafeWindow.gm429521?.fn.wrappedLog
  if (wrappedLog) {
    for (const n of ['log', 'warn', 'error']) {
      console[n] = wrappedLog(console, console[n], n.toUpperCase(), GM_info.script.name)
    }
  }
})()
