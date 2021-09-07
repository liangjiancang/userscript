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
 * @version 2.0.1.20210907
 * @author Laster2800
 * @see {@link https://gitee.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI UserscriptAPI}
 */
class UserscriptAPI {
  /** 可访问模块 */
  static #modules = {}
  /** 待添加模块样式队列 */
  #moduleCssQueue = []

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

    /** @type {UserscriptAPIDom} */
    this.dom = this.#getModuleInstance('dom')
    /** @type {UserscriptAPILogger} */
    this.logger = this.#getModuleInstance('logger')
    /** @type {UserscriptAPIMessage} */
    this.message = this.#getModuleInstance('message')
    /** @type {UserscriptAPITool} */
    this.tool = this.#getModuleInstance('tool')
    /** @type {UserscriptAPIWait} */
    this.wait = this.#getModuleInstance('wait')
    /** @type {UserscriptAPIWeb} */
    this.web = this.#getModuleInstance('web')

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

    for (const css of this.#moduleCssQueue) {
      api.dom.addStyle(css)
    }
  }

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

  /**
   * 初始化模块样式（仅应在模块构造器中使用）
   * @param {string} css 样式
   */
  initModuleStyle(css) {
    this.#moduleCssQueue.push(css)
  }
}
