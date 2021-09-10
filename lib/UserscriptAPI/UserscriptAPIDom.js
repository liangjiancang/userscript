/**
 * UserscriptAPIDom
 *
 * 依赖于 `UserscriptAPI`。
 * @version 1.0.2.20210910
 * @author Laster2800
 * @see {@link https://gitee.com/liangjiancang/userscript/tree/master/lib/UserscriptAPI UserscriptAPI}
 */
class UserscriptAPIDom {
  /**
   * @param {UserscriptAPI} api `UserscriptAPI`
   */
  constructor(api) {
    this.api = api
  }

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
        const ret = Reflect.apply(f, this, arguments)
        window.dispatchEvent(new Event('pushstate'))
        window.dispatchEvent(urlEvent())
        return ret
      })(history.pushState)
      history.replaceState = (f => function replaceState() {
        const ret = Reflect.apply(f, this, arguments)
        window.dispatchEvent(new Event('replacestate'))
        window.dispatchEvent(urlEvent())
        return ret
      })(history.replaceState)
      window.addEventListener('popstate', () => {
        window.dispatchEvent(urlEvent())
      })
      history._urlchangeEventInitialized = true
    }
  }

  /**
   * 添加样式
   * @param {string} css 样式
   * @param {Document} [doc=document] 文档
   * @returns {HTMLStyleElement} `<style>`
   */
  addStyle(css, doc = document) {
    const api = this.api
    const style = doc.createElement('style')
    style.setAttribute('type', 'text/css')
    style.className = `${api.options.id}-style`
    style.append(css)
    const parent = doc.head || doc.documentElement
    if (parent) {
      parent.append(style)
    } else { // 极端情况下会出现，DevTools 网络+CPU 双限制可模拟
      api.wait?.waitForConditionPassed({
        condition: () => doc.head || doc.documentElement,
        timeout: 0,
      }).then(parent => parent.append(style))
    }
    return style
  }

  /**
   * 设定元素位置，默认设定为绝对居中
   *
   * 要求该元素此时可见且尺寸为确定值（一般要求为块状元素）。
   * @param {HTMLElement} target 目标元素
   * @param {Object} [options] 选项
   * @param {string} [options.position='fixed'] 定位方式
   * @param {string} [options.top='50%'] `style.top`
   * @param {string} [options.left='50%'] `style.left`
   */
  setPosition(target, options) {
    options = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      ...options,
    }
    target.style.position = options.position
    const style = window.getComputedStyle(target)
    const top = (Number.parseFloat(style.height) + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)) / 2
    const left = (Number.parseFloat(style.width) + Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)) / 2
    target.style.top = `calc(${options.top} - ${top}px)`
    target.style.left = `calc(${options.left} - ${left}px)`
  }

  /**
   * @typedef FadeTargetElement
   * @property {string} [fadeInDisplay] 渐显开始后的 `display` 样式。若没有设定：
   *  * 若当前 `display` 与 `fadeOutDisplay` 不同，默认值为当前 `display`。
   *  * 若当前 `display` 与 `fadeOutDisplay` 相同，默认值为 `block`。
   * @property {string} [fadeOutDisplay='none'] 渐隐开始后的 `display` 样式
   * @property {number} [fadeInTime] 渐显时间；缺省时，元素的 `transition-duration` 必须与 `api.options.fadeTime` 一致
   * @property {number} [fadeOutTime] 渐隐时间；缺省时，元素的 `transition-duration` 必须与 `api.options.fadeTime` 一致
   * @property {string} [fadeInFunction='ease-in-out'] 渐显效果，应为符合 `transition-timing-function` 的有效值
   * @property {string} [fadeOutFunction='ease-in-out'] 渐隐效果，应为符合 `transition-timing-function` 的有效值
   * @property {boolean} [fadeInNoInteractive] 渐显期间是否禁止交互
   * @property {boolean} [fadeOutNoInteractive] 渐隐期间是否禁止交互
   */
  /**
   * 处理 HTML 元素的渐显和渐隐
   * @param {boolean} inOut 渐显/渐隐
   * @param {HTMLElement & FadeTargetElement} target HTML 元素
   * @param {() => void} [callback] 渐显/渐隐完成的回调函数
   */
  fade(inOut, target, callback) {
    const api = this.api
    let transitionChanged = false
    const fadeId = Date.now() // 等同于当前时间戳，其意义在于保证对于同一元素，后执行的操作必将覆盖前的操作
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
  }

  /**
   * 为 HTML 元素添加 `class`
   * @param {HTMLElement} el 目标元素
   * @param {...string} className `class`
   */
  addClass(el, ...className) {
    el.classList?.add(...className)
  }

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
  }

  /**
   * 判断 HTML 元素类名中是否含有 `class`
   * @param {HTMLElement} el 目标元素
   * @param {string | string[]} className `class`，支持同时判断多个
   * @param {boolean} [and] 同时判断多个 `class` 时，默认采取 `OR` 逻辑，是否采用 `AND` 逻辑
   * @returns {boolean} 是否含有 `class`
   */
  containsClass(el, className, and = false) {
    if (el.classList) {
      const trim = clz => clz.startsWith('.') ? clz.slice(1) : clz
      if (Array.isArray(className)) {
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
  }

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
  }
}

/* global UserscriptAPI */
{ UserscriptAPI.registerModule('dom', UserscriptAPIDom) }
