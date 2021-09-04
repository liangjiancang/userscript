/* exported UserscriptAPI */
/**
 * UserscriptAPI
 *
 * 根据使用到的功能，可能需要通过 `@grant` 引入 `GM_xmlhttpRequest` 或 `GM_download`。
 *
 * 如无特殊说明，涉及到时间时所用单位均为毫秒。
 * @version 1.8.1.20210904
 * @author Laster2800
 */
class UserscriptAPI {
  /**
   * @param {Object} [options] 选项
   * @param {string} [options.id='default'] 标识符
   * @param {string} [options.label] 日志标签，为空时不设置标签
   * @param {Object} [options.wait] `wait` API 默认选项（默认值见构造器代码）
   * @param {Object} [options.wait.condition] `wait` 条件 API 默认选项
   * @param {Object} [options.wait.element] `wait` 元素 API 默认选项
   * @param {number} [options.fadeTime=400] UI 渐变时间
   */
  constructor(options) {
    this.options = {
      id: '_0',
      label: null,
      fadeTime: 400,
      ...options,
      wait: {
        condition: {
          callback: result => api.logger.info(result),
          interval: 100,
          timeout: 10000,
          onTimeout: function() {
            api.logger[this.stopOnTimeout ? 'error' : 'warn'](['TIMEOUT', 'executeAfterConditionPassed', options])
          },
          stopOnTimeout: true,
          stopCondition: null,
          onStop: () => api.logger.error(['STOP', 'executeAfterConditionPassed', options]),
          stopInterval: 50,
          stopTimeout: 0,
          onError: e => api.logger.error(['ERROR', 'executeAfterConditionPassed', options, e]),
          stopOnError: true,
          timePadding: 0,
          ...options?.wait?.condition,
        },
        element: {
          base: document,
          exclude: null,
          callback: el => api.logger.info(el),
          subtree: true,
          multiple: false,
          repeat: false,
          throttleWait: 100,
          timeout: 10000,
          onTimeout: function() {
            api.logger[this.stopOnTimeout ? 'error' : 'warn'](['TIMEOUT', 'executeAfterElementLoaded', options])
          },
          stopOnTimeout: false,
          stopCondition: null,
          onStop: () => api.logger.error(['STOP', 'executeAfterElementLoaded', options]),
          onError: e => api.logger.error(['ERROR', 'executeAfterElementLoaded', options, e]),
          stopOnError: true,
          timePadding: 0,
          ...options?.wait?.element,
        },
      },
    }

    const win = typeof unsafeWindow == 'undefined' ? window : unsafeWindow
    /** @type {UserscriptAPI} */
    let api = win[`_userscriptAPI_${this.options.id}`]
    if (api) {
      api.options = this.options
      return api
    }
    api = win[`_userscriptAPI_${this.options.id}`] = this

    const logCss = `
      background-color: black;
      color: white;
      border-radius: 2px;
      padding: 2px;
      margin-right: 2px;
    `

    /** DOM 相关 */
    this.dom = {
      /**
       * 初始化 urlchange 事件
       * @see {@link https://stackoverflow.com/a/52809105 How to detect if URL has changed after hash in JavaScript}
       */
      initUrlchangeEvent() {
        if (!history._urlchangeEventInitialized) {
          const urlEvent = () => {
            const event = new Event('urlchange')
            // 添加属性，使其与 Tampermonkey urlchange 保持一致
            event.url = location.href
            return event
          }
          history.pushState = (f => function pushState() {
            const ret = f.apply(this, arguments)
            window.dispatchEvent(new Event('pushstate'))
            window.dispatchEvent(urlEvent())
            return ret
          })(history.pushState)
          history.replaceState = (f => function replaceState() {
            const ret = f.apply(this, arguments)
            window.dispatchEvent(new Event('replacestate'))
            window.dispatchEvent(urlEvent())
            return ret
          })(history.replaceState)
          window.addEventListener('popstate', () => {
            window.dispatchEvent(urlEvent())
          })
          history._urlchangeEventInitialized = true
        }
      },

      /**
       * 添加样式
       * @param {string} css 样式
       * @param {HTMLDocument} [doc=document] 文档
       * @returns {HTMLStyleElement} `<style>`
       */
      addStyle(css, doc = document) {
        const style = doc.createElement('style')
        style.setAttribute('type', 'text/css')
        style.className = `${api.options.id}-style`
        style.appendChild(doc.createTextNode(css))
        const parent = doc.head || doc.documentElement
        if (parent) {
          parent.appendChild(style)
        } else { // 极端情况下会出现，DevTools 网络+CPU 双限制可模拟
          api.wait.waitForConditionPassed({
            condition: () => doc.head || doc.documentElement,
            timeout: 0,
          }).then(parent => parent.appendChild(style))
        }
        return style
      },

      /**
       * 设定元素位置，默认设定为绝对居中
       *
       * 要求该元素此时可见且尺寸为确定值（一般要求为块状元素）。
       * @param {HTMLElement} target 目标元素
       * @param {Object} [config] 配置
       * @param {string} [config.position='fixed'] 定位方式
       * @param {string} [config.top='50%'] `style.top`
       * @param {string} [config.left='50%'] `style.left`
       */
      setPosition(target, config) {
        config = {
          position: 'fixed',
          top: '50%',
          left: '50%',
          ...config,
        }
        target.style.position = config.position
        const style = window.getComputedStyle(target)
        const top = (parseFloat(style.height) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)) / 2
        const left = (parseFloat(style.width) + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)) / 2
        target.style.top = `calc(${config.top} - ${top}px)`
        target.style.left = `calc(${config.left} - ${left}px)`
      },

      /**
       * 处理 HTML 元素的渐显和渐隐
       *
       * * 读取 `target` 上的 `fadeInDisplay` 来设定渐显开始后的 `display` 样式。若没有设定：
       *   * 若当前 `display` 与 `fadeOutDisplay` 不同，默认值为当前 `display`。
       *   * 若当前 `display` 与 `fadeOutDisplay` 相同，默认值为 `block`。
       *
       * * 读取 `target` 上的 `fadeOutDisplay` 来设定渐隐开始后的 `display` 样式，默认值为 `none`。
       *
       * * 读取 `target` 上的 `fadeInTime` 和 `fadeOutTime` 属性来设定渐显和渐隐时间，它们应为以 `ms` 为单位的 `number`；否则，`target.style.transition` 上关于时间的设定应该与 `api.options.fadeTime` 保持一致。
       *
       * * 读取 `target` 上的 `fadeInFunction` 和 `fadeOutFunction` 属性来设定渐变效果（默认 `ease-in-out`），它们应为符合 `transition-timing-function` 的 `string`。
       *
       * * 读取 `target` 上的 `fadeInNoInteractive` 和 `fadeOutNoInteractive` 属性来设定渐显和渐隐期间是否禁止交互，它们应为 `boolean`。
       * @param {boolean} inOut 渐显/渐隐
       * @param {HTMLElement} target HTML 元素
       * @param {() => void} [callback] 渐显/渐隐完成的回调函数
       */
      fade(inOut, target, callback) {
        // fadeId 等同于当前时间戳，其意义在于保证对于同一元素，后执行的操作必将覆盖前的操作
        let transitionChanged = false
        const fadeId = new Date().getTime()
        const fadeOutDisplay = target.fadeOutDisplay ?? 'none'
        target._fadeId = fadeId
        if (inOut) { // 渐显
          let displayChanged = false
          if (typeof target.fadeInTime == 'number' || target.fadeInFunction) {
            target.style.transition = `opacity ${target.fadeInTime ?? api.options.fadeTime}ms ${target.fadeInFunction ?? 'ease-in-out'}`
            transitionChanged = true
          }
          if (target.fadeInNoInteractive) {
            target.style.pointerEvents = 'none'
          }
          const originalDisplay = window.getComputedStyle(target).display
          let fadeInDisplay = target.fadeInDisplay
          if (!fadeInDisplay) {
            if (originalDisplay != fadeOutDisplay) {
              fadeInDisplay = originalDisplay
            } else {
              fadeInDisplay = 'block'
            }
          }
          if (originalDisplay != fadeInDisplay) {
            target.style.display = fadeInDisplay
            displayChanged = true
          }
          setTimeout(() => {
            let success = false
            if (target._fadeId <= fadeId) {
              target.style.opacity = '1'
              success = true
            }
            setTimeout(() => {
              callback?.(success)
              if (target._fadeId <= fadeId) {
                if (transitionChanged) {
                  target.style.transition = ''
                }
                if (target.fadeInNoInteractive) {
                  target.style.pointerEvents = ''
                }
              }
            }, target.fadeInTime ?? api.options.fadeTime)
          }, displayChanged ? 10 : 0) // 此处的 10ms 是为了保证修改 display 后在浏览器上真正生效；按 HTML5 定义，浏览器需保证 display 在修改后 4ms 内生效，但实际上大部分浏览器貌似做不到，等个 10ms 再修改 opacity
        } else { // 渐隐
          if (typeof target.fadeOutTime == 'number' || target.fadeOutFunction) {
            target.style.transition = `opacity ${target.fadeOutTime ?? api.options.fadeTime}ms ${target.fadeOutFunction ?? 'ease-in-out'}`
            transitionChanged = true
          }
          if (target.fadeOutNoInteractive) {
            target.style.pointerEvents = 'none'
          }
          target.style.opacity = '0'
          setTimeout(() => {
            let success = false
            if (target._fadeId <= fadeId) {
              target.style.display = fadeOutDisplay
              success = true
            }
            callback?.(success)
            if (success) {
              if (transitionChanged) {
                target.style.transition = ''
              }
              if (target.fadeOutNoInteractive) {
                target.style.pointerEvents = ''
              }
            }
          }, target.fadeOutTime ?? api.options.fadeTime)
        }
      },

      /**
       * 为 HTML 元素添加 `class`
       * @param {HTMLElement} el 目标元素
       * @param {...string} className `class`
       */
      addClass(el, ...className) {
        el.classList?.add(...className)
      },

      /**
       * 为 HTML 元素移除 `class`
       * @param {HTMLElement} el 目标元素
       * @param {...string} [className] `class`，未指定时移除所有 `class`
       */
      removeClass(el, ...className) {
        if (className.length > 0) {
          el.classList?.remove(...className)
        } else if (el.className) {
          el.className = ''
        }
      },

      /**
       * 判断 HTML 元素类名中是否含有 `class`
       * @param {HTMLElement | {className: string}} el 目标元素
       * @param {string | string[]} className `class`，支持同时判断多个
       * @param {boolean} [and] 同时判断多个 `class` 时，默认采取 `OR` 逻辑，是否采用 `AND` 逻辑
       * @returns {boolean} 是否含有 `class`
       */
      containsClass(el, className, and = false) {
        const trim = clz => clz.startsWith('.') ? clz.slice(1) : clz
        if (el.classList) {
          if (className instanceof Array) {
            if (and) {
              for (const c of className) {
                if (!el.classList.contains(trim(c))) {
                  return false
                }
              }
              return true
            } else {
              for (const c of className) {
                if (el.classList.contains(trim(c))) {
                  return true
                }
              }
              return false
            }
          } else {
            return el.classList.contains(trim(className))
          }
        }
        return false
      },

      /**
       * 判断 HTML 元素是否为 `fixed` 定位，或其是否在 `fixed` 定位的元素下
       * @param {HTMLElement} el 目标元素
       * @param {HTMLElement} [endEl] 终止元素，当搜索到该元素时终止判断（不会判断该元素）
       * @returns {boolean} HTML 元素是否为 `fixed` 定位，或其是否在 `fixed` 定位的元素下
       */
      isFixed(el, endEl) {
        while (el && el != endEl) {
          if (window.getComputedStyle(el).position == 'fixed') {
            return true
          }
          el = el.offsetParent
        }
        return false
      },
    }
    /** 信息通知相关 */
    this.message = {
      /**
       * 创建信息
       * @param {string} msg 信息
       * @param {Object} [config] 设置
       * @param {(msgbox: HTMLElement) => void} [config.onOpened] 信息打开后的回调
       * @param {(msgbox: HTMLElement) => void} [config.onClosed] 信息关闭后的回调
       * @param {boolean} [config.autoClose=true] 是否自动关闭信息，配合 `config.ms` 使用
       * @param {number} [config.ms=1500] 显示时间（单位：ms，不含渐显/渐隐时间）
       * @param {boolean} [config.html=false] 是否将 `msg` 理解为 HTML
       * @param {string} [config.width] 信息框的宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
       * @param {{top: string, left: string}} [config.position] 信息框的位置，不设置该项时，相当于设置为 `{ top: '70%', left: '50%' }`
       * @return {HTMLElement} 信息框元素
       */
      create(msg, config) {
        config = {
          autoClose: true,
          ms: 1500,
          html: false,
          width: null,
          position: {
            top: '70%',
            left: '50%',
          },
          ...config,
        }

        const msgbox = document.createElement('div')
        msgbox.className = `${api.options.id}-msgbox`
        if (config.width) {
          msgbox.style.minWidth = 'auto' // 为什么一个是 auto 一个是 none？真是神奇的设计
          msgbox.style.maxWidth = 'none'
          msgbox.style.width = config.width
        }
        msgbox.style.display = 'block'
        if (config.html) {
          msgbox.innerHTML = msg
        } else {
          msgbox.textContent = msg
        }
        document.body.appendChild(msgbox)
        setTimeout(() => {
          api.dom.setPosition(msgbox, config.position)
        }, 10)

        api.dom.fade(true, msgbox, () => {
          config.onOpened?.call(msgbox)
          if (config.autoClose) {
            setTimeout(() => {
              this.close(msgbox, config.onClosed)
            }, config.ms)
          }
        })
        return msgbox
      },

      /**
       * 关闭信息
       * @param {HTMLElement} msgbox 信息框元素
       * @param {(msgbox: HTMLElement) => void} [callback] 信息关闭后的回调
       */
      close(msgbox, callback) {
        if (msgbox) {
          api.dom.fade(false, msgbox, () => {
            callback?.call(msgbox)
            msgbox?.remove()
          })
        }
      },

      /**
       * 创建高级信息
       * @param {HTMLElement} el 启动元素
       * @param {string} msg 信息
       * @param {string} [flag] 标志信息
       * @param {Object} [config] 设置
       * @param {string} [config.flagSize='1.8em'] 标志大小
       * @param {string} [config.width] 信息框的宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
       * @param {{top: string, left: string}} [config.position] 信息框的位置，不设置该项时，沿用 `UserscriptAPI.message.create()` 的默认设置
       * @param {() => boolean} [config.disabled] 用于获取是否禁用信息的方法
       */
      advanced(el, msg, flag, config) {
        config = {
          flagSize: '1.8em',
          ...config
        }

        const _self = this
        el.show = false
        el.addEventListener('mouseenter', function() {
          if (config.disabled?.()) return
          const htmlMsg = `
            <table class="gm-advanced-table"><tr>
              ${flag ? `<td style="font-size:${config.flagSize};line-height:${config.flagSize}">${flag}</td>` : ''}
              <td>${msg}</td>
            </tr></table>
          `
          this.msgbox = _self.create(htmlMsg, { ...config, html: true, autoClose: false })

          let startPos = null // 鼠标进入预览时的初始坐标
          this.msgbox.addEventListener('mouseenter', function() {
            this.mouseOver = true
          })
          this.msgbox.addEventListener('mouseleave', function() {
            _self.close(this)
          })
          this.msgbox.addEventListener('mousemove', function(e) {
            if (startPos) {
              const dSquare = (startPos.x - e.clientX) ** 2 + (startPos.y - e.clientY) ** 2
              if (dSquare > 20 ** 2) { // 20px
                _self.close(this)
              }
            } else {
              startPos = {
                x: e.clientX,
                y: e.clientY,
              }
            }
          })
        })
        el.addEventListener('mouseleave', function() {
          setTimeout(() => {
            if (this.msgbox && !this.msgbox.mouseOver) {
              _self.close(this.msgbox)
            }
          }, 10)
        })
      },

      /**
       * 创建提醒信息
       * @param {string} msg 信息
       */
      alert(msg) {
        alert(`${api.options.label ? `${api.options.label}\n\n` : ''}${msg}`)
      },

      /**
       * 创建确认信息
       * @param {string} msg 信息
       * @returns {boolean} 用户输入
       */
      confirm(msg) {
        return confirm(`${api.options.label ? `${api.options.label}\n\n` : ''}${msg}`)
      },

      /**
       * 创建输入提示信息
       * @param {string} msg 信息
       * @param {string} [val] 默认值
       * @returns {string} 用户输入
       */
      prompt(msg, val) {
        return prompt(`${api.options.label ? `${api.options.label}\n\n` : ''}${msg}`, val)
      },
    }
    /** 用于等待元素加载/条件达成再执行操作 */
    this.wait = {
      /**
       * 在条件达成后执行操作
       *
       * 当条件达成后，如果不存在终止条件，那么直接执行 `callback(result)`。
       *
       * 当条件达成后，如果存在终止条件，且 `stopTimeout` 大于 0，则还会在接下来的 `stopTimeout` 时间内判断是否达成终止条件，称为终止条件的二次判断。如果在此期间，终止条件通过，则表示依然不达成条件，故执行 `onStop()` 而非 `callback(result)`。如果在此期间，终止条件一直失败，则顺利通过检测，执行 `callback(result)`。
       *
       * @param {Object} options 选项；缺失选项用 `UserscriptAPI.options.wait.condition` 填充
       * @param {() => (* | Promise)} options.condition 条件，当 `condition()` 返回的 `result` 为真值时达成条件
       * @param {(result: *) => void} [options.callback] 当达成条件时执行 `callback(result)`
       * @param {number} [options.interval] 检测时间间隔
       * @param {number} [options.timeout] 检测超时时间，检测时间超过该值时终止检测；设置为 `0` 时永远不会超时
       * @param {() => void} [options.onTimeout] 检测超时时执行 `onTimeout()`
       * @param {boolean} [options.stopOnTimeout] 检测超时时是否终止检测
       * @param {() => (* | Promise)} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
       * @param {() => void} [options.onStop] 终止条件达成时执行 `onStop()`（包括终止条件的二次判断达成）
       * @param {number} [options.stopInterval] 终止条件二次判断期间的检测时间间隔
       * @param {number} [options.stopTimeout] 终止条件二次判断期间的检测超时时间，设置为 `0` 时禁用终止条件二次判断
       * @param {(e: Error) => void} [options.onError] 条件检测过程中发生错误时执行 `onError(e)`
       * @param {boolean} [options.stopOnError] 条件检测过程中发生错误时，是否终止检测
       * @param {number} [options.timePadding] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
       * @returns {() => boolean} 执行后终止检测的函数
       */
      executeAfterConditionPassed(options) {
        options = {
          ...api.options.wait.condition,
          ...options,
        }
        let stop = false
        let endTime = null
        if (options.timeout == 0) {
          endTime = 0
        } else {
          endTime = Math.max(new Date().getTime() + options.timeout - options.timePadding, 1)
        }
        const task = async () => {
          if (stop) return
          let result = null
          try {
            result = await options.condition()
          } catch (e) {
            options.onError?.(e)
            if (options.stopOnError) {
              stop = true
            }
          }
          if (stop) return
          const stopResult = await options.stopCondition?.()
          if (stopResult) {
            stop = true
            options.onStop?.()
          } else if (endTime !== 0 && new Date().getTime() > endTime) {
            if (options.stopOnTimeout) {
              stop = true
            } else {
              endTime = 0
            }
            options.onTimeout?.()
          } else if (result) {
            stop = true
            if (options.stopCondition && options.stopTimeout > 0) {
              this.executeAfterConditionPassed({
                condition: options.stopCondition,
                callback: options.onStop,
                interval: options.stopInterval,
                timeout: options.stopTimeout,
                onTimeout: () => options.callback(result)
              })
            } else {
              options.callback(result)
            }
          }
          if (!stop) {
            setTimeout(task, options.interval)
          }
        }
        setTimeout(async () => {
          if (stop) return
          await task()
          if (stop) return
          setTimeout(task, options.interval)
        }, options.timePadding)
        return function() {
          stop = true
        }
      },

      /**
       * 在元素加载完成后执行操作
       *
       * ```plaintext
       * +────────────+──────────+───────────────────────────────────+
       *   `multiple` | `repeat` | 说明
       * +────────────+──────────+───────────────────────────────────+
       *   `false`    | `false`  | 查找第一个匹配元素，然后终止查找
       *   `true`     | `false`  | 查找所有匹配元素，然后终止查找
       *   `false`    | `true`   | 查找最后一个非标记匹配元素，并标记所有
       *              |          | 匹配元素，然后继续监听元素插入
       *   `true`     | `true`   | 查找所有非标记匹配元素，并标记所有匹配
       *              |          | 元素，然后继续监听元素插入
       * +────────────+──────────+───────────────────────────────────+
       * ```
       *
       * @param {Object} options 选项；缺失选项用 `UserscriptAPI.options.wait.element` 填充
       * @param {string} options.selector 该选择器指定要等待加载的元素 `element`
       * @param {HTMLElement} [options.base] 基元素
       * @param {HTMLElement[]} [options.exclude] 若 `element` 在其中则跳过，并继续检测
       * @param {(element: HTMLElement) => void} [options.callback] 当 `element` 加载成功时执行 `callback(element)`
       * @param {boolean} [options.subtree] 是否将检测范围扩展为基元素的整棵子树
       * @param {boolean} [options.multiple] 若一次检测到多个目标元素，是否在所有元素上执行回调函数（否则只处理第一个结果）
       * @param {boolean} [options.repeat] `element` 加载成功后是否继续检测
       * @param {number} [options.throttleWait] 检测节流时间（非准确）
       * @param {number} [options.timeout] 检测超时时间，检测时间超过该值时终止检测；设置为 `0` 时永远不会超时
       * @param {() => void} [options.onTimeout] 检测超时时执行 `onTimeout()`
       * @param {boolean} [options.stopOnTimeout] 检测超时时是否终止检测
       * @param {() => (* | Promise)} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
       * @param {() => void} [options.onStop] 终止条件达成时执行 `onStop()`
       * @param {(e: Error) => void} [options.onError] 检测过程中发生错误时执行 `onError(e)`
       * @param {boolean} [options.stopOnError] 检测过程中发生错误时，是否终止检测
       * @param {number} [options.timePadding] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
       * @returns {() => boolean} 执行后终止检测的函数
       */
      executeAfterElementLoaded(options) {
        options = {
          ...api.options.wait.element,
          ...options,
        }

        let loaded = false
        let stopped = false
        let tid = null // background timer id

        let excluded = null
        if (options.exclude) {
          excluded = new WeakSet(options.exclude)
        } else if (options.repeat) {
          excluded = new WeakSet()
        }
        const valid = el => !(excluded?.has(el))

        const stop = () => {
          if (!stopped) {
            stopped = true
            ob.disconnect()
            if (tid) {
              clearTimeout(tid)
              tid = null
            }
          }
        }

        const singleTask = el => {
          let success = false
          try {
            if (valid(el)) {
              success = true // success 指查找成功，回调出错不影响
              options.repeat && excluded.add(el)
              options.callback(el)
            }
          } catch (e) {
            if (options.stopOnError) {
              throw e
            } else {
              options.onError?.(e)
            }
          }
          return success
        }
        const task = root => {
          let success = false
          if (options.multiple) {
            root.querySelectorAll(options.selector).forEach(el => {
              success = singleTask(el)
            })
          } else if (options.repeat) {
            const elements = root.querySelectorAll(options.selector)
            for (let i = elements.length - 1; i >= 0; i--) {
              const el = elements[i]
              if (success) {
                if (valid(el)) {
                  excluded.add(el)
                }
              } else {
                success = singleTask(el)
              }
            }
          } else {
            const el = root.querySelector(options.selector)
            success = el && singleTask(el)
          }
          loaded = success || loaded
          if (loaded && !options.repeat) {
            stop()
          }
          return success
        }
        const throttledTask = options.throttleWait > 0 ? api.tool.throttle(task, options.throttleWait) : task

        const ob = new MutationObserver(() => {
          if (stopped) return
          try {
            if (options.stopCondition?.()) {
              stop()
              options.onStop?.()
              return
            }
            throttledTask(options.base)
          } catch (e) {
            options.onError?.(e)
            if (options.stopOnError) {
              stop()
            }
          }
        })

        setTimeout(() => {
          if (stopped) return
          try {
            if (options.stopCondition?.()) {
              stop()
              options.onStop?.()
              return
            }
            task(options.base)
          } catch (e) {
            options.onError?.(e)
            if (options.stopOnError) {
              stop()
            }
          }
          if (stopped) return
          ob.observe(options.base, {
            childList: true,
            subtree: options.subtree,
          })
          if (options.timeout > 0) {
            tid = setTimeout(() => {
              if (stopped) return
              tid = null
              if (!loaded) {
                if (options.stopOnTimeout) {
                  stop()
                }
                options.onTimeout?.()
              } else { // 只要检测到，无论重复与否，都不算超时；需永久检测必须设 timeout 为 0
                stop()
              }
            }, Math.max(options.timeout - options.timePadding, 0))
          }
        }, options.timePadding)
        return stop
      },

      /**
       * 等待条件达成
       *
       * 执行细节类似于 {@link executeAfterConditionPassed}。在原来执行 `callback(result)` 的地方执行 `resolve(result)`，被终止或超时执行 `reject()`。
       * @param {Object} options 选项；缺失选项用 `UserscriptAPI.options.wait.condition` 填充
       * @param {() => (* | Promise)} options.condition 条件，当 `condition()` 返回的 `result` 为真值时达成条件
       * @param {number} [options.interval] 检测时间间隔
       * @param {number} [options.timeout] 检测超时时间，检测时间超过该值时终止检测；设置为 `0` 时永远不会超时
       * @param {boolean} [options.stopOnTimeout] 检测超时时是否终止检测
       * @param {() => (* | Promise)} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
       * @param {number} [options.stopInterval] 终止条件二次判断期间的检测时间间隔
       * @param {number} [options.stopTimeout] 终止条件二次判断期间的检测超时时间，设置为 `0` 时禁用终止条件二次判断
       * @param {boolean} [options.stopOnError] 条件检测过程中发生错误时，是否终止检测
       * @param {number} [options.timePadding] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
       * @returns {Promise} `result`
       * @throws 等待超时、达成终止条件、等待错误时抛出
       * @see executeAfterConditionPassed
       */
      async waitForConditionPassed(options) {
        return new Promise((resolve, reject) => {
          this.executeAfterConditionPassed({
            ...options,
            callback: result => resolve(result),
            onTimeout: function() {
              const error = ['TIMEOUT', 'waitForConditionPassed', this]
              if (this.stopOnTimeout) {
                reject(error)
              } else {
                api.logger.warn(error)
              }
            },
            onStop: function() {
              reject(['STOP', 'waitForConditionPassed', this])
            },
            onError: function(e) {
              reject(['ERROR', 'waitForConditionPassed', this, e])
            },
          })
        })
      },

      /**
       * 等待元素加载完成
       *
       * 执行细节类似于 {@link executeAfterElementLoaded}。在原来执行 `callback(element)` 的地方执行 `resolve(element)`，被终止或超时执行 `reject()`。
       * @param {Object} options 选项；缺失选项用 `UserscriptAPI.options.wait.element` 填充
       * @param {string} options.selector 该选择器指定要等待加载的元素 `element`
       * @param {HTMLElement} [options.base] 基元素
       * @param {HTMLElement[]} [options.exclude] 若 `element` 在其中则跳过，并继续检测
       * @param {boolean} [options.subtree] 是否将检测范围扩展为基元素的整棵子树
       * @param {number} [options.throttleWait] 检测节流时间（非准确）
       * @param {number} [options.timeout] 检测超时时间，检测时间超过该值时终止检测；设置为 `0` 时永远不会超时
       * @param {() => (* | Promise)} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
       * @param {() => void} [options.onStop] 终止条件达成时执行 `onStop()`
       * @param {boolean} [options.stopOnTimeout] 检测超时时是否终止检测
       * @param {boolean} [options.stopOnError] 检测过程中发生错误时，是否终止检测
       * @param {number} [options.timePadding] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
       * @returns {Promise<HTMLElement>} `element`
       * @throws 等待超时、达成终止条件、等待错误时抛出
       * @see executeAfterElementLoaded
       */
      async waitForElementLoaded(options) {
        return new Promise((resolve, reject) => {
          this.executeAfterElementLoaded({
            ...options,
            callback: element => resolve(element),
            onTimeout: function() {
              const error = ['TIMEOUT', 'waitForElementLoaded', this]
              if (this.stopOnTimeout) {
                reject(error)
              } else {
                api.logger.warn(error)
              }
            },
            onStop: function() {
              reject(['STOP', 'waitForElementLoaded', this])
            },
            onError: function(e) {
              reject(['ERROR', 'waitForElementLoaded', this, e])
            },
          })
        })
      },

      /**
       * 元素加载选择器
       *
       * 执行细节类似于 {@link executeAfterElementLoaded}。在原来执行 `callback(element)` 的地方执行 `resolve(element)`，被终止或超时执行 `reject()`。
       * @param {string} selector 该选择器指定要等待加载的元素 `element`
       * @param {HTMLElement} [base=UserscriptAPI.options.wait.element.base] 基元素
       * @param {boolean} [stopOnTimeout=UserscriptAPI.options.wait.element.stopOnTimeout] 检测超时时是否终止检测
       * @returns {Promise<HTMLElement>} `element`
       * @throws 等待超时、达成终止条件、等待错误时抛出
       * @see executeAfterElementLoaded
       */
      async waitQuerySelector(selector, base = api.options.wait.element.base, stopOnTimeout = api.options.wait.element.stopOnTimeout) {
        return new Promise((resolve, reject) => {
          this.executeAfterElementLoaded({
            ...{ selector, base, stopOnTimeout },
            callback: element => resolve(element),
            onTimeout: function() {
              const error = ['TIMEOUT', 'waitQuerySelector', this]
              if (this.stopOnTimeout) {
                reject(error)
              } else {
                api.logger.warn(error)
              }
            },
            onStop: function() {
              reject(['STOP', 'waitQuerySelector', this])
            },
            onError: function(e) {
              reject(['ERROR', 'waitQuerySelector', this, e])
            },
          })
        })
      },
    }
    /** 网络相关 */
    this.web = {
      /**
       * @typedef {XMLHttpRequest} GM_XHR GM 定义的类 `XMLHttpRequest` 对象
       */
      /**
       * 发起网络请求，获取 `GM_XHR`
       * @param {Object} details 定义及细节类似于 `GM_xmlhttpRequest` `details`
       * @param {'GET' | 'HEAD' | 'POST'} [details.method='GET'] `METHOD`
       * @param {string} [details.url] `URL`
       * @param {number} [details.timeout] 超时时间
       * @param {(xhr: GM_XHR) => void} [details.ontimeout] 超时回调
       * @param {(xhr: GM_XHR) => void} [details.onerror] 错误回调
       * @param {(xhr: GM_XHR) => void} [details.onload] 加载回调
       * @param {string | URLSearchParams | FormData} [details.data] `DATA`
       * @param {Object} [options] 选项
       * @param {(xhr: GM_XHR) => boolean} [options.check] 检查 `GM_XHR` 是否符合条件
       * @param {boolean} [options.throwOnFailed = true] 失败时是否抛出异常，否则打印错误信息
       * @returns {Promise<GM_XHR>} `GM_XHR`
       * @throws 等待超时、达成终止条件、等待错误时抛出
       * @see {@link https://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest GM_xmlhttpRequest}
       */
      async requestXHR(details, options) {
        if (details) {
          const { check, throwOnFailed = true } = options ?? {}
          return new Promise((resolve, reject) => {
            if (details.data && details.data instanceof URLSearchParams) {
              details.data = details.data.toString()
              details.headers = details.headers ?? { 'content-type': 'application/x-www-form-urlencoded' }
            }
            details.ontimeout = details.ontimeout ?? (xhr => fail(['TIMEOUT', 'request', details, xhr]))
            details.onerror = details.onerror ?? (xhr => fail(['ERROR', 'request', details, xhr]))
            details.onload = details.onload ?? (xhr => {
              if (check && !check(xhr)) {
                fail(['CHECK-FAILED', 'request', details, check, xhr])
                if (throwOnFailed) return
              }
              resolve(xhr)
            })
            GM_xmlhttpRequest(details)

            function fail(msg) {
              throwOnFailed ? reject(msg) : api.logger.error(msg)
            }
          })
        }
      },

      /**
       * 发起网络请求，获取解析结果
       * @param {Object} details 定义及细节类似于 `GM_xmlhttpRequest` `details`
       * @param {'GET' | 'HEAD' | 'POST'} [details.method='GET'] `METHOD`
       * @param {string} [details.url] `URL`
       * @param {number} [details.timeout] 超时时间
       * @param {(xhr: GM_XHR) => void} [details.ontimeout] 超时回调
       * @param {(xhr: GM_XHR) => void} [details.onerror] 错误回调
       * @param {(xhr: GM_XHR) => void} [details.onload] 加载回调
       * @param {string | URLSearchParams | FormData} [details.data] `DATA`
       * @param {Object} [options] 选项
       * @param {'json' | 'check'} [options.parser='json'] `json`: `JSON.parse(resp)` | `check`: `check(resp, xhr)`
       * @param {(resp: Object, xhr: GM_XHR) => boolean} [options.check] 检查 `GM_XHR` 是否符合条件
       * @param {boolean} [options.throwOnFailed=true] 失败时是否抛出异常，否则打印错误信息
       * @returns {Promise<Object>} 解析结果
       * @see {@link https://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest GM_xmlhttpRequest}
       */
      async request(details, options) {
        const { parser = 'json', check, throwOnFailed = true } = options ?? {}
        try {
          const xhr = await this.requestXHR(details)
          let resp = null
          try {
            resp = JSON.parse(xhr.response)
          } catch (e) {
            fail(['PARSE', 'request', details, xhr])
            return null
          }
          const checkResult = !check || check(resp, xhr)
          if (parser == 'check') {
            return checkResult
          }
          if (!checkResult) {
            fail(['CHECK-FAILED', 'request', details, check, resp, xhr])
          }
          return resp
        } catch (e) {
          fail(e)
        }

        function fail(msg) {
          if (throwOnFailed) {
            throw msg
          } else {
            api.logger.error(msg)
          }
        }
      },

      /**
       * 下载资源
       * @param {Object} details 定义及细节同 `GM_download` `details`
       * @returns {() => void} 用于终止下载的方法
       * @see {@link https://www.tampermonkey.net/documentation.php#GM_download GM_download}
       */
      download(details) {
        if (details) {
          try {
            const cfg = { ...details }
            let name = cfg.name
            if (name.indexOf('.') >= 0) {
              let parts = cfg.url.split('/')
              const last = parts[parts.length - 1].split('?')[0]
              if (last.indexOf('.') >= 0) {
                parts = last.split('.')
                name = `${name}.${parts[parts.length - 1]}`
              } else {
                name = name.replaceAll('.', '_')
              }
              cfg.name = name
            }
            if (!cfg.onerror) {
              cfg.onerror = function(error, details) {
                api.logger.error('DOWNLOAD ERROR')
                api.logger.error([error, details])
              }
            }
            if (!cfg.ontimeout) {
              cfg.ontimeout = function() {
                api.logger.error('DOWNLOAD TIMEOUT')
              }
            }
            GM_download(cfg)
          } catch (e) {
            api.logger.error('DOWNLOAD ERROR')
            api.logger.error(e)
          }
        }
        return () => {}
      },

      /**
       * 判断给定 URL 是否匹配
       * @param {RegExp | RegExp[]} reg 用于判断是否匹配的正则表达式，或正则表达式数组
       * @param {'SINGLE' | 'AND' | 'OR'} [mode='SINGLE'] 匹配模式
       * @returns {boolean} 是否匹配
       */
      urlMatch(reg, mode = 'SINGLE') {
        let result = false
        const href = location.href
        if (mode == 'SINGLE') {
          if (reg instanceof Array) {
            if (reg.length > 0) {
              reg = reg[0]
            } else {
              reg = null
            }
          }
          if (reg) {
            result = reg.test(href)
          }
        } else {
          if (!(reg instanceof Array)) {
            reg = [reg]
          }
          if (reg.length > 0) {
            if (mode == 'AND') {
              result = true
              for (const r of reg) {
                if (!r.test(href)) {
                  result = false
                  break
                }
              }
            } else if (mode == 'OR') {
              for (const r of reg) {
                if (r.test(href)) {
                  result = true
                  break
                }
              }
            }
          }
        }
        return result
      },
    }
    /**
     * 日志
     */
    this.logger = {
      /**
       * 打印格式化日志
       * @param {*} message 日志信息
       * @param {string} label 日志标签
       * @param {'info', 'warn', 'error'} [level] 日志等级
       */
      log(message, label, level = 'info') {
        const output = console[level == 'info' ? 'log' : level]
        const type = typeof message == 'string' ? '%s' : '%o'
        output(`%c${label}%c${type}`, logCss, '', message)
      },

      /**
       * 打印日志
       * @param {*} message 日志信息
       */
      info(message) {
        if (message === undefined) {
          message = '[undefined]'
        } else if (message === null) {
          message = '[null]'
        } else if (message === '') {
          message = '[empty string]'
        }
        if (api.options.label) {
          this.log(message, api.options.label)
        } else {
          console.log(message)
        }
      },

      /**
       * 打印警告日志
       * @param {*} message 警告日志信息
       */
      warn(message) {
        if (message === undefined) {
          message = '[undefined]'
        } else if (message === null) {
          message = '[null]'
        } else if (message === '') {
          message = '[empty string]'
        }
        if (api.options.label) {
          this.log(message, api.options.label, 'warn')
        } else {
          console.warn(message)
        }
      },

      /**
       * 打印错误日志
       * @param {*} message 错误日志信息
       */
      error(message) {
        if (message === undefined) {
          message = '[undefined]'
        } else if (message === null) {
          message = '[null]'
        } else if (message === '') {
          message = '[empty string]'
        }
        if (api.options.label) {
          this.log(message, api.options.label, 'error')
        } else {
          console.error(message)
        }
      },
    }
    /**
     * 工具
     */
    this.tool = {
      /**
       * 生成消抖函数
       * @param {Function} fn 目标函数
       * @param {number} [wait=0] 消抖延迟
       * @param {Object} [options] 选项
       * @param {boolean} [options.leading] 是否在延迟开始前调用目标函数
       * @param {boolean} [options.trailing=true] 是否在延迟结束后调用目标函数
       * @param {number} [options.maxWait=0] 最大延迟时间（非准确），`0` 表示禁用
       * @returns {Function} 消抖函数 `debounced`，可调用 `debounced.cancel()` 取消执行
       */
      debounce(fn, wait = 0, options = {}) {
        options = {
          leading: false,
          trailing: true,
          maxWait: 0,
          ...options,
        }

        let tid = null
        let start = null
        let execute = null
        let callback = null

        function debounced() {
          execute = () => {
            fn.apply(this, arguments)
            execute = null
          }
          callback = () => {
            if (options.trailing) {
              execute?.()
            }
            tid = null
            start = null
          }

          if (tid) {
            clearTimeout(tid)
            if (options.maxWait > 0 && new Date().getTime() - start > options.maxWait) {
              callback()
            }
          }

          if (!tid && options.leading) {
            execute?.()
          }

          if (!start) {
            start = new Date().getTime()
          }

          tid = setTimeout(callback, wait)
        }

        debounced.cancel = function() {
          if (tid) {
            clearTimeout(tid)
            tid = null
            start = null
          }
        }

        return debounced
      },

      /**
       * 生成节流函数
       * @param {Function} fn 目标函数
       * @param {number} [wait=0] 节流延迟（非准确）
       * @returns {Function} 节流函数 `throttled`，可调用 `throttled.cancel()` 取消执行
       */
      throttle(fn, wait = 0) {
        return this.debounce(fn, wait, {
          leading: true,
          trailing: true,
          maxWait: wait,
        })
      },
    }

    api.dom.addStyle(`
      :root {
        --${api.options.id}-light-text-color: white;
        --${api.options.id}-shadow-color: #000000bf;
      }

      .${api.options.id}-msgbox {
        z-index: 100000000;
        background-color: var(--${api.options.id}-shadow-color);
        font-size: 16px;
        max-width: 24em;
        min-width: 2em;
        color: var(--${api.options.id}-light-text-color);
        padding: 0.5em 1em;
        border-radius: 0.6em;
        opacity: 0;
        transition: opacity ${api.options.fadeTime}ms ease-in-out;
        user-select: none;
      }

      .${api.options.id}-msgbox .gm-advanced-table td {
        vertical-align: middle;
      }
      .${api.options.id}-msgbox .gm-advanced-table td:first-child {
        padding-right: 0.6em;
      }
    `)
  }
}
