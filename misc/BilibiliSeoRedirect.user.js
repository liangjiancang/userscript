// ==UserScript==
// @name            B站SEO页面重定向
// @version         1.0.0.20210802
// @namespace       laster2800
// @author          Laster2800
// @icon            https://www.bilibili.com/favicon.ico
// @description     从B站 SEO 页面重定向至普通页面
// @license         LGPL-3.0
// @include         *://www.bilibili.com/s/video/*
// @grant           none
// @run-at          document-start
// ==/UserScript==

location.replace(location.href.replace('/s', ''))