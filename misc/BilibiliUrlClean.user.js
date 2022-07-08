// ==UserScript==
// @name            B站URL清理（掩耳盗铃）
// @version         1.0.0.20220708
// @namespace       laster2800
// @author          Laster2800
// @description     清理B站 URL 中多余的内容——这种清理只是将 URL 中多余的部分简单隐藏起来，不会阻止其完成自身的使命
// @note            提供真实清理的脚本有很多，但本人其实并不反感这种跟踪，不能以最坏的恶意来推测每一种设计，但在 URL 上添加各种奇奇怪怪的内容实在是太难看了，让 URL 在显示上更简洁才是该脚本的本意
// @icon            https://www.bilibili.com/favicon.ico
// @homepageURL     https://greasyfork.org/zh-CN/scripts/447604
// @supportURL      https://greasyfork.org/zh-CN/scripts/447604/feedback
// @license         LGPL-3.0
// @noframes
// @include         *://www.bilibili.com/video/*
// @grant           none
// @run-at          document-start
// ==/UserScript==

(function() {
  'use strict'

  let busy = false
  const rm = ['vd_source']
  initUrlchangeEvent()

  clean()
  window.addEventListener('urlchange', clean)

  function clean() {
    if (busy) return
    busy = true
    let r = false
    const url = new URL(location.href)
    for (const k of rm) {
      r |= tryClean(url, k) // |= 不会短路
    }
    r && history.replaceState({}, null, url.href)
    busy = false
  }

  function tryClean(url, k) {
    const m = new RegExp(`^\\?((.*)&)?((?<=[?&])${k}(=[^&]*)?)(&(.+))?$`).exec(url.search)
    if (m) {
      let a = m[2] ?? ''
      const b = m[6] ?? ''
      if (a && b) {
        a += `&${b}`
      } else if (a || b) {
        a += b
      }
      url.search = a ? `?${a}` : ''
      return true
    }
    return false
  }

  /**
   * @see UserscriptAPI.base.initUrlchangeEvent
   */
  function initUrlchangeEvent() {
    if (window[Symbol.for('onurlchange')] === undefined) {
      let url = new URL(location.href)
      const dispatchEvent = () => {
        const event = new CustomEvent('urlchange', {
          detail: { prev: url, curr: new URL(location.href) },
          bubbles: true,
        })
        url = event.detail.curr
        if (typeof window.onurlchange === 'function') {
          window.addEventListener('urlchange', window.onurlchange, { once: true })
        }
        document.dispatchEvent(event)
      }

      history.pushState = (f => (...args) => {
        const ret = Reflect.apply(f, history, args)
        dispatchEvent()
        return ret
      })(history.pushState)
      history.replaceState = (f => (...args) => {
        const ret = Reflect.apply(f, history, args)
        dispatchEvent()
        return ret
      })(history.replaceState)
      window.addEventListener('popstate', () => {
        dispatchEvent()
      })
      window[Symbol.for('onurlchange')] = true
    }
  }
})()

