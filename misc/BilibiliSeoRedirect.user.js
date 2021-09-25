// ==UserScript==
// @name            B站SEO页面重定向
// @version         1.0.6.20210925
// @namespace       laster2800
// @author          Laster2800
// @description     从B站 SEO 页面重定向至常规页面
// @icon            https://www.bilibili.com/favicon.ico
// @homepageURL     https://greasyfork.org/zh-CN/scripts/430227
// @supportURL      https://greasyfork.org/zh-CN/scripts/430227/feedback
// @license         LGPL-3.0
// @include         *://www.bilibili.com/s/video/*
// @grant           none
// @run-at          document-start
// ==/UserScript==

location.replace(location.href.replace('/s', ''))
