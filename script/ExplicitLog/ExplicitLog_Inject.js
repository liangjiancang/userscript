/**
 * ExplicitLog_Inject
 * @file [DEBUG] 显式日志（注入版）
 * @version 2.0.0.20210718
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
          w.gm429521?.fn.explicit(arguments.length == 1 ? arguments[0] : JSON.stringify(arguments), log.toUpperCase(), GM_info.script.name)
        }
      }
      return _.apply(console, arguments)
    }
  }
})()
