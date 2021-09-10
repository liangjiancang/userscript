// ==UserScript==
// @name            [DEBUG] 网页内容编辑模式 (DesignMode)
// @version         1.0.7.20210910
// @namespace       laster2800
// @author          Laster2800
// @description     通过右键菜单快速切换 designMode 状态 - https://developer.mozilla.org/zh-CN/docs/Web/API/Document/designMode
// @homepageURL     https://greasyfork.org/zh-CN/scripts/430949
// @supportURL      https://greasyfork.org/zh-CN/scripts/430949/feedback
// @license         LGPL-3.0
// @include         *
// @grant           none
// @run-at          context-menu
// ==/UserScript==

(function() {
  'use strict'

  const target = top.document.designMode == 'on' ? 'off' : 'on'
  const executed = []
  const exec = win => {
    if (executed.includes(win)) return
    try {
      executed.push(win)
      win.document.designMode = target
      for (let i = 0; i < win.frames.length; i++) {
        exec(win.frames[i])
      }
    } catch { /* cross-origin frame */ }
  }
  exec(top)
})()
