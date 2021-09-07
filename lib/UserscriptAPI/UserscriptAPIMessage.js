/**
 * UserscriptAPIMessage
 *
 * 依赖于 `UserscriptAPI`，`UserscriptAPIDom`。
 * @version 1.1.0.20210907
 * @author Laster2800
 * @see {@link https://gitee.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI UserscriptAPI}
 */
class UserscriptAPIMessage {
  /**
   * @param {UserscriptAPI} api `UserscriptAPI`
   */
  constructor(api) {
    this.api = api

    api.initModuleStyle(`
      .${api.options.id}-infobox {
        z-index: 100000000;
        background-color: #000000bf;
        font-size: 16px;
        max-width: 24em;
        min-width: 2em;
        color: white;
        padding: 0.5em 1em;
        border-radius: 9.6px;
        opacity: 0;
        transition: opacity ${api.options.fadeTime}ms ease-in-out;
        user-select: none;
        pointer-events: none;
      }

      .${api.options.id}-infobox .gm-advanced-table td {
        vertical-align: middle;
      }
      .${api.options.id}-infobox .gm-advanced-table td:first-child {
        padding-right: 0.6em;
      }

      .${api.options.id}-dialog {
        z-index: 90000000;
        background-color: white;
        font-size: 17px;
        min-width: 18em;
        max-width: 35em;
        border-radius: 4px;
        opacity: 0;
        box-shadow: #000000aa 0px 3px 6px;
        transition: opacity 150ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
      }
      .${api.options.id}-dialog .gm-header {
        padding: 0.5em 1em 0.4em;
        border-bottom: 1px solid #d5d5d5;
      }
      .${api.options.id}-dialog .gm-body {
        padding: 0.8em 1em;
      }
      .${api.options.id}-dialog .gm-bottom {
        padding: 0 1em 0.6em;
        text-align: right;
      }
      .${api.options.id}-dialog .gm-content {
        line-height: 1.6em;
      }
      .${api.options.id}-dialog button.gm-interactive {
        font-size: 0.9em;
        padding: 0.1em 0.6em;
        margin-left: 0.8em;
        cursor: pointer;
        background-color: white;
        border: 1px solid #909090;
        border-radius: 2px;
      }
      .${api.options.id}-dialog button.gm-interactive:hover,
      .${api.options.id}-dialog button.gm-interactive:focus {
        background-color: #ebebeb;
      }
      .${api.options.id}-dialog input.gm-interactive {
        outline: none;
        border: 1px solid #909090;
        width: calc(100% - 12px);
        margin-top: 0.6em;
        padding: 4px 6px;
      }
      .${api.options.id}-dialog textarea.gm-interactive {
        outline: none;
        border: 1px solid #909090;
        width: calc(100% - 2em);
        margin: 0.6em 0 -0.4em;
        padding: 1em;
        resize: none;
      }
      .${api.options.id}-dialog textarea.gm-interactive::-webkit-scrollbar {
        width: 6px;
        height: 6px;
        background-color: transparent;
      }
      .${api.options.id}-dialog textarea.gm-interactive::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background-color: #0000002b;
      }
      .${api.options.id}-dialog textarea.gm-interactive::-webkit-scrollbar-corner {
        background-color: transparent;
      }
    `)
  }

  /**
   * 创建信息
   * @param {string} msg 信息
   * @param {Object} [options] 选项
   * @param {() => void} [options.onOpened] 信息打开后的回调
   * @param {() => void} [options.onClosed] 信息关闭后的回调
   * @param {boolean} [options.autoClose=true] 是否自动关闭信息，配合 `options.ms` 使用
   * @param {number} [options.ms=1500] 显示时间（单位：ms，不含渐显/渐隐时间）
   * @param {boolean} [options.html=false] 是否将 `msg` 理解为 HTML
   * @param {string} [options.width] 信息框的宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
   * @param {{top: string, left: string}} [options.position] 信息框的位置，必须带单位或以百分号结尾；不设置该项时，相当于设置为 `{ top: '70%', left: '50%' }`
   * @return {HTMLElement} 信息框元素
   */
  info(msg, options) {
    const api = this.api
    options = {
      autoClose: true,
      ms: 1500,
      html: false,
      width: null,
      position: {
        top: '70%',
        left: '50%',
      },
      ...options,
    }

    const infobox = document.createElement('div')
    infobox.className = `${api.options.id}-infobox`
    if (options.width) {
      infobox.style.minWidth = 'auto'
      infobox.style.maxWidth = 'none'
      infobox.style.width = options.width
    }
    if (options.html) {
      infobox.innerHTML = msg
    } else {
      infobox.textContent = msg
    }
    document.body.appendChild(infobox)
    api.dom.setPosition(infobox, options.position)

    api.dom.fade(true, infobox, () => {
      options.onOpened?.call(infobox)
      if (options.autoClose) {
        setTimeout(() => {
          this.close(infobox, options.onClosed)
        }, options.ms)
      }
    })
    return infobox
  }

  /**
   * 创建高级信息
   * @param {HTMLElement} el 启动元素
   * @param {string} msg 信息
   * @param {string} [flag] 标志信息
   * @param {Object} [options] 选项
   * @param {string} [options.flagSize='1.8em'] 标志大小
   * @param {string} [options.width] 信息框的宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
   * @param {{top: string, left: string}} [options.position] 信息框的位置，不设置该项时，沿用 `api.message.infobox()` 的默认设置
   * @param {() => boolean} [options.disabled] 用于获取是否禁用信息的方法
   */
  advancedInfo(el, msg, flag, options) {
    options = {
      flagSize: '1.8em',
      ...options
    }

    const _self = this
    el.addEventListener('mouseenter', function() {
      if (options.disabled?.()) return
      const htmlMsg = `
        <table class="gm-advanced-table"><tr>
          ${flag ? `<td style="font-size:${options.flagSize};line-height:${options.flagSize}">${flag}</td>` : ''}
          <td>${msg}</td>
        </tr></table>
      `
      this.infobox = _self.info(htmlMsg, { ...options, html: true, autoClose: false })
    })
    el.addEventListener('mouseleave', function() {
      _self.close(this.infobox)
    })
  }

  /**
   * @typedef DialogElement
   * @property {HTMLElement[]} interactives 交互元素
   * @property {(callback?: () => void) => void} open 打开对话框
   * @property {(callback?: () => void) => void} close 关闭对话框
   */
  /**
   * 创建对话框
   * @param {string} msg 信息
   * @param {Object} [options] 选项
   * @param {boolean} [options.html] 信息是否为 HTML
   * @param {string} [options.title=api.options.label] 标题
   * @param {boolean} [options.titleHtml] 标题是否为 HTML
   * @param {boolean} [options.lineInput] 是否添加单行输入框
   * @param {boolean} [options.boxInput] 是否添加多行输入框
   * @param {string[]} [options.buttons] 对话框按钮文本
   * @param {string} [options.width] 对话框宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
   * @param {{top: string, left: string}} [options.position] 信息框的位置，必须带单位或以百分号结尾；不设置该项时绝对居中
   * @returns {HTMLElement & DialogElement} 对话框元素
   */
  dialog(msg, options) {
    const _self = this
    const api = _self.api
    options = {
      title: api.options.label,
      position: {
        top: '50%',
        left: '50%',
      },
      ...options,
    }

    const dialog = document.createElement('div')
    dialog.className = `${api.options.id}-dialog`
    if (options.width) {
      dialog.style.minWidth = 'auto'
      dialog.style.maxWidth = 'none'
      dialog.style.width = options.width
    }

    let bottomHtml = ''
    if (options.buttons) {
      for (const button of options.buttons) {
        bottomHtml += `<button class="gm-interactive">${button}</button>`
      }
      if (bottomHtml) {
        bottomHtml = `<div class="gm-bottom">${bottomHtml}</div>`
      }
    }
    dialog.innerHTML = `
      ${options.title ? '<div class="gm-header"></div>' : ''}
      <div class="gm-body">
        <div class="gm-content"></div>
        ${options.lineInput ? '<input type="text" class="gm-interactive">' : ''}
        ${options.boxInput ? '<textarea class="gm-interactive"></textarea>' : ''}
      </div>
      ${bottomHtml}
    `
    if (options.title) {
      const header = dialog.querySelector('.gm-header')
      if (options.titleHtml) {
        header.innerHTML = options.title
      } else {
        header.textContent = options.title
      }
    }
    const content = dialog.querySelector('.gm-content')
    if (options.html) {
      content.innerHTML = msg
    } else {
      content.textContent = msg
    }
    dialog.interactives = dialog.querySelectorAll('.gm-interactive')
    document.body.appendChild(dialog)

    dialog.fadeOutNoInteractive = true
    dialog.open = function(callback) {
      api.dom.setPosition(this, options.position)
      api.dom.fade(true, this, callback && (() => callback.call(this)))
    }
    dialog.close = function(callback) {
      _self.close(this, callback)
    }
    return dialog
  }

  /**
   * 创建提醒对话框
   * @param {string} msg 信息
   * @param {Object} [options] 选项
   * @param {boolean} [options.primitive] 使用原生组件
   * @param {boolean} [options.html] 信息是否为 HTML
   * @param {string} [options.title=api.options.label] 标题
   * @param {boolean} [options.titleHtml] 标题是否为 HTML
   * @param {string} [options.width] 对话框宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
   * @param {{top: string, left: string}} [options.position] 信息框的位置，不设置该项时绝对居中
   * @returns {Promise<void>} 用户输入
   */
  alert(msg, options) {
    const _self = this
    return new Promise(resolve => {
      let primitive = !document.body || options?.primitive
      if (!primitive) {
        try {
          const dialog = _self.dialog(msg, {
            ...options,
            buttons: ['确定'],
          })
          const confirm = dialog.interactives[0]
          confirm.focus({ preventScroll: true })
          confirm.addEventListener('click', function() {
            dialog.close()
            resolve()
          })
          dialog.open()
        } catch (e) { // not true error
          primitive = true
        }
      }
      if (primitive) {
        const label = _self.api.options.label
        if (options?.html) {
          const el = document.createElement('div')
          el.innerHTML = msg
          msg = el.textContent
        }
        resolve(alert(`${label ? `${label}\n\n` : ''}${msg}`))
      }
    })
  }

  /**
   * 创建确认对话框
   * @param {string} msg 信息
   * @param {Object} [options] 选项
   * @param {boolean} [options.primitive] 使用原生组件
   * @param {boolean} [options.html] 信息是否为 HTML
   * @param {string} [options.title=api.options.label] 标题
   * @param {boolean} [options.titleHtml] 标题是否为 HTML
   * @param {string} [options.width] 对话框宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
   * @param {{top: string, left: string}} [options.position] 信息框的位置，不设置该项时绝对居中
   * @returns {Promise<boolean>} 用户输入
   */
  confirm(msg, options) {
    const _self = this
    return new Promise(resolve => {
      let primitive = !document.body || options?.primitive
      if (!primitive) {
        try {
          const dialog = _self.dialog(msg, {
            ...options,
            buttons: ['确定', '取消'],
          })
          const confirm = dialog.interactives[0]
          const cancel = dialog.interactives[1]
          confirm.focus({ preventScroll: true })
          confirm.addEventListener('click', function() {
            dialog.close()
            resolve(true)
          })
          cancel.addEventListener('click', function() {
            dialog.close()
            resolve(false)
          })
          dialog.open()
        } catch (e) { // not true error
          primitive = true
        }
      }
      if (primitive) {
        const label = _self.api.options.label
        if (options?.html) {
          const el = document.createElement('div')
          el.innerHTML = msg
          msg = el.textContent
        }
        resolve(confirm(`${label ? `${label}\n\n` : ''}${msg}`))
      }
    })
  }

  /**
   * 创建输入对话框
   * @param {string} msg 信息
   * @param {string} [val] 默认值
   * @param {Object} [options] 选项
   * @param {boolean} [options.primitive] 使用原生组件
   * @param {boolean} [options.html] 信息是否为 HTML
   * @param {string} [options.title=api.options.label] 标题
   * @param {boolean} [options.titleHtml] 标题是否为 HTML
   * @param {string} [options.width] 对话框宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
   * @param {{top: string, left: string}} [options.position] 信息框的位置，不设置该项时绝对居中
   * @returns {Promise<string>} 用户输入
   */
  prompt(msg, val, options) {
    const _self = this
    return new Promise(resolve => {
      let primitive = !document.body || options?.primitive
      if (!primitive) {
        try {
          const dialog = _self.dialog(msg, {
            ...options,
            buttons: ['确定', '取消'],
            lineInput: true,
          })
          const input = dialog.interactives[0]
          const confirm = dialog.interactives[1]
          const cancel = dialog.interactives[2]
          if (val) {
            input.value = val
          }
          input.focus({ preventScroll: true })
          input.addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
              confirm.dispatchEvent(new Event('click'))
            }
          })
          confirm.addEventListener('click', function() {
            dialog.close()
            resolve(input.value)
          })
          cancel.addEventListener('click', function() {
            dialog.close()
            resolve(null)
          })
          dialog.open()
        } catch (e) { // not true error
          primitive = true
        }
      }
      if (primitive) {
        const label = _self.api.options.label
        if (options?.html) {
          const el = document.createElement('div')
          el.innerHTML = msg
          msg = el.textContent
        }
        resolve(prompt(`${label ? `${label}\n\n` : ''}${msg}`, val))
      }
    })
  }

  /**
   * 关闭信息元素
   * @param {HTMLElement} msgEl 信息元素
   * @param {() => void} [callback] 信息关闭后的回调
   */
  close(msgEl, callback) {
    if (msgEl) {
      this.api.dom.fade(false, msgEl, () => {
        callback?.call(msgEl)
        msgEl?.remove()
      })
    }
  }
}

/* global UserscriptAPI */
{ UserscriptAPI.registerModule('message', UserscriptAPIMessage) }
