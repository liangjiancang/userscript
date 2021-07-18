/**
 * ExplicitLog_Inject
 * @file [DEBUG] 显式日志（注入版）
 * @version 2.0.1.20210718
 * @author Laster2800
 */

(function() {
  const w = unsafeWindow
  const logs = ['log', 'warn', 'error']
  for (const log of logs) {
    const _ = console[log]
    console[log] = function() {
      if (w.gm429521?.config.enabled) {
        const m = [arguments, log.toUpperCase()]
        if (w.gm429521?.fn.match(m, w.gm429521?.config.include) && !w.gm429521?.fn.match(m, w.gm429521?.config.exclude)) {
          let msg = null
          if (arguments.length == 1) {
            if (typeof arguments[0] == 'object') {
              msg = JSON.stringify(arguments[0])
            } else {
              msg = arguments[0]
            }
          } else {
            msg = JSON.stringify(arguments)
          }
          w.gm429521?.fn.explicit(msg, log.toUpperCase(), GM_info.script.name)
        }
      }
      return _.apply(console, arguments)
    }
  }
})()
