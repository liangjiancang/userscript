/**
 * UserscriptAPIMessage
 *
 * 依赖于 `UserscriptAPI`，`UserscriptAPIDom`。
 * @version 1.0.0.20210906
 * @author Laster2800
 * @see {@link https://gitee.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI UserscriptAPI}
 */
class UserscriptAPIMessage {
  /**
   * @param {UserscriptAPI} api `UserscriptAPI`
   */
  constructor(api) {
    this.api = api
  }

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
    const api = this.api
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
  }

  /**
   * 关闭信息
   * @param {HTMLElement} msgbox 信息框元素
   * @param {(msgbox: HTMLElement) => void} [callback] 信息关闭后的回调
   */
  close(msgbox, callback) {
    if (msgbox) {
      this.api.dom.fade(false, msgbox, () => {
        callback?.call(msgbox)
        msgbox?.remove()
      })
    }
  }

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
  }

  /**
   * 创建提醒信息
   * @param {string} msg 信息
   */
  alert(msg) {
    const label = this.api.options.label
    alert(`${label ? `${label}\n\n` : ''}${msg}`)
  }

  /**
   * 创建确认信息
   * @param {string} msg 信息
   * @returns {boolean} 用户输入
   */
  confirm(msg) {
    const label = this.api.options.label
    return confirm(`${label ? `${label}\n\n` : ''}${msg}`)
  }

  /**
   * 创建输入提示信息
   * @param {string} msg 信息
   * @param {string} [val] 默认值
   * @returns {string} 用户输入
   */
  prompt(msg, val) {
    const label = this.api.options.label
    return prompt(`${label ? `${label}\n\n` : ''}${msg}`, val)
  }
}

/* global UserscriptAPI */
{ UserscriptAPI.registerModule('message', UserscriptAPIMessage) }
