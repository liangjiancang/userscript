/**
 * UserscriptAPIWeb
 *
 * 依赖于 `UserscriptAPI`。
 *
 * 需要通过 `@grant` 引入 `GM_xmlhttpRequest` 或 `GM_download`。
 * @version 1.1.0.20210910
 * @author Laster2800
 * @see {@link https://gitee.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI UserscriptAPI}
 */
class UserscriptAPIWeb {
  /**
   * @param {UserscriptAPI} api `UserscriptAPI`
   */
  constructor(api) {
    this.api = api
  }

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
      const api = this.api
      const { check, throwOnFailed = true } = options ?? {}
      return new Promise((resolve, reject) => {
        if (details.data && details.data instanceof URLSearchParams) {
          details.data = details.data.toString()
          details.headers = {
            'content-type': 'application/x-www-form-urlencoded',
            ...details.headers,
          }
          if (GM_info.scriptHandler == 'Violentmonkey' && !details.headers.origin) {
            details.headers.origin = ''
          }
        }
        details.ontimeout ??= xhr => fail(['TIMEOUT', 'request', details, xhr])
        details.onerror ??= xhr => fail(['ERROR', 'request', details, xhr])
        details.onload ??= xhr => {
          if (check && !check(xhr)) {
            fail(['CHECK-FAIL', 'request', details, check, xhr])
            if (throwOnFailed) return
          }
          resolve(xhr)
        }
        GM_xmlhttpRequest(details)

        function fail(msg) {
          throwOnFailed ? reject(msg) : api.logger.error(msg)
        }
      })
    }
  }

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
   * @param {'json' | 'check' | 'silentCheck'} [options.parser='json'] ```plaintext
   *    json: 返回 JSON.parse(resp)
   *    check: 返回 check(resp, xhr)，检查失败时打印信息
   *    silentCheck: 返回 check(resp, xhr)，检查失败时不打印信息
   * ```
   * @param {(resp: Object, xhr: GM_XHR) => boolean} [options.check] 检查 `GM_XHR` 是否符合条件
   * @param {boolean} [options.throwOnFailed=true] 失败时是否抛出异常，否则打印错误信息
   * @returns {Promise<Object>} 解析结果
   * @see {@link https://www.tampermonkey.net/documentation.php#GM_xmlhttpRequest GM_xmlhttpRequest}
   */
  async request(details, options) {
    const api = this.api
    const { parser = 'json', check, throwOnFailed = true } = options ?? {}
    try {
      const xhr = await this.requestXHR(details)
      let resp = null
      try {
        resp = JSON.parse(xhr.response)
      } catch {
        fail(['PARSE', 'request', details, xhr])
        return null
      }
      const checkResult = !check || check(resp, xhr)
      if (parser == 'silentCheck') {
        return checkResult
      } else if (parser == 'check') {
        if (!checkResult) {
          api.logger.error(['CHECK-FAIL', 'request', details, check, resp, xhr])
        }
        return checkResult
      } else {
        if (!checkResult) {
          fail(['CHECK-FAIL', 'request', details, check, resp, xhr])
        }
        return resp
      }
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
  }

  /**
   * 下载资源
   * @param {Object} details 定义及细节同 `GM_download` `details`
   * @returns {() => void} 用于终止下载的方法
   * @see {@link https://www.tampermonkey.net/documentation.php#GM_download GM_download}
   */
  download(details) {
    if (details) {
      const api = this.api
      try {
        const cfg = { ...details }
        let name = cfg.name
        if (name.includes('.')) {
          let parts = cfg.url.split('/')
          const last = parts[parts.length - 1].split('?')[0]
          if (last.includes('.')) {
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
  }
}

/* global UserscriptAPI */
{ UserscriptAPI.registerModule('web', UserscriptAPIWeb) }