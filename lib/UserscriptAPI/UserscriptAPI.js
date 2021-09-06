/* exported UserscriptAPI */
/**
 * UserscriptAPI
 *
 * 需要引入模块方可工作。所有模块均依赖于 `UserscriptAPI`，模块间的依赖关系如下：
 *
 * ```plaintext
 * +─────────+─────────+
 *   模块    | 依赖模块
 * +─────────+─────────+
 *   dom     |
 *   logger  |
 *   message | dom
 *   tool    |
 *   wait    | tool
 *   web     |
 * +─────────+─────────+
 * ```
 * @version 2.0.0.20210906
 * @author Laster2800
 * @see {@link https://gitee.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI UserscriptAPI}
 */
class UserscriptAPI {
  /** @type {UserscriptAPIDom} */
  dom = this.#getModuleInstance('dom')
  /** @type {UserscriptAPILogger} */
  logger = this.#getModuleInstance('logger')
  /** @type {UserscriptAPIMessage} */
  message = this.#getModuleInstance('message')
  /** @type {UserscriptAPITool} */
  tool = this.#getModuleInstance('tool')
  /** @type {UserscriptAPIWait} */
  wait = this.#getModuleInstance('wait')
  /** @type {UserscriptAPIWeb} */
  web = this.#getModuleInstance('web')

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
      id: 'default',
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

    if (!api.dom) {
      api.dom = {
        addStyle(css) {
          const style = document.createElement('style')
          style.setAttribute('type', 'text/css')
          style.className = `${api.options.id}-style`
          style.appendChild(document.createTextNode(css))
          const parent = document.head || document.documentElement
          if (parent) {
            parent.appendChild(style)
          }
        },
      }
    }
    if (!api.logger) {
      api.logger = {
        info: console.log,
        warn: console.warn,
        error: console.error,
      }
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

  /** 可访问模块 */
  static #modules = {}

  /**
   * 注册模块
   * @param {string} name 模块名称
   * @param {Object} module 模块类
   */
  static registerModule(name, module) {
    this.#modules[name] = module
  }

  /**
   * 获取模块实例
   * @param {string} name 模块名称
   * @returns {Object} 模块实例，无对应模块时返回 `null`
   */
  #getModuleInstance(name) {
    const module = UserscriptAPI.#modules[name]
    return module ? new module(this) : null
  }
}
