/**
 * UserscriptAPILogger
 *
 * 依赖于 `UserscriptAPI`。
 *
 * 需要通过 `@grant` 引入 `GM_xmlhttpRequest` 或 `GM_download`。
 * @version 1.0.0.20210906
 * @author Laster2800
 * @see {@link https://gitee.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI UserscriptAPI}
 */
class UserscriptAPILogger {
  #logCss = `
    background-color: black;
    color: white;
    border-radius: 2px;
    padding: 2px;
    margin-right: 4px;
  `

  /**
   * @param {UserscriptAPI} api `UserscriptAPI`
   */
  constructor(api) {
    this.api = api
  }

  /**
   * 打印格式化日志
   * @param {*} message 日志信息
   * @param {string} label 日志标签
   * @param {'info', 'warn', 'error'} [level] 日志等级
   */
  #log(message, label, level = 'info') {
    const output = console[level == 'info' ? 'log' : level]
    const type = typeof message == 'string' ? '%s' : '%o'
    output(`%c${label}%c${type}`, this.#logCss, '', message)
  }

  /**
   * 打印日志
   * @param {*} message 日志信息
   */
  info(message) {
    const api = this.api
    if (message === undefined) {
      message = '[undefined]'
    } else if (message === null) {
      message = '[null]'
    } else if (message === '') {
      message = '[empty string]'
    }
    if (api.options.label) {
      this.#log(message, api.options.label)
    } else {
      console.log(message)
    }
  }

  /**
   * 打印警告日志
   * @param {*} message 警告日志信息
   */
  warn(message) {
    const api = this.api
    if (message === undefined) {
      message = '[undefined]'
    } else if (message === null) {
      message = '[null]'
    } else if (message === '') {
      message = '[empty string]'
    }
    if (api.options.label) {
      this.#log(message, api.options.label, 'warn')
    } else {
      console.warn(message)
    }
  }

  /**
   * 打印错误日志
   * @param {*} message 错误日志信息
   */
  error(message) {
    const api = this.api
    if (message === undefined) {
      message = '[undefined]'
    } else if (message === null) {
      message = '[null]'
    } else if (message === '') {
      message = '[empty string]'
    }
    if (api.options.label) {
      this.#log(message, api.options.label, 'error')
    } else {
      console.error(message)
    }
  }
}

/* global UserscriptAPI */
{ UserscriptAPI.registerModule('logger', UserscriptAPILogger) }
