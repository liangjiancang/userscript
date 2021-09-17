// ==UserScript==
// @name            Greasy Fork URL 脚本名称清理
// @version         1.0.2.20210918
// @namespace       laster2800
// @author          Laster2800
// @description     清理 Greasy Fork URL 中的脚本名称
// @icon            https://api.iowen.cn/favicon/greasyfork.org.png
// @homepageURL     https://greasyfork.org/zh-CN/scripts/431940
// @supportURL      https://greasyfork.org/zh-CN/scripts/431940/feedback
// @license         LGPL-3.0
// @noframes
// @include         /^https?:\/\/(greasy|sleazy)fork\.org\/[^/]+\/scripts\/\d+-/
// @grant           none
// @run-at          document-start
// ==/UserScript==

const m = /(\/[^/]+\/scripts\/\d+)-[^/]+(\/.*)?/.exec(location.pathname)
history.replaceState({}, null, `${location.origin}${m[1]}${m[2] ?? ''}${location.search}${location.hash}`)