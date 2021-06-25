// ==UserScript==
// @name            B站共同关注快速查看
// @version         1.0.0
// @namespace       laster2800
// @author          Laster2800
// @description     快速查看特定用户的共同关注（视频播放页、动态页、用户空间）
// @icon            https://www.bilibili.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/428453
// @supportURL      https://greasyfork.org/zh-CN/scripts/428453/feedback
// @license         LGPL-3.0
// @include         *://www.bilibili.com/*
// @include         *://t.bilibili.com/*
// @include         *://space.bilibili.com/*
// @exclude         *://message.bilibili.com/pages/nav/index_new_pc_sync
// @exclude         *://t.bilibili.com/h5/dynamic/specification
// @exclude         *://www.bilibili.com/page-proxy/game-nav.html
// @exclude         /.*:\/\/.*:\/\/.*/
// @require         https://greasyfork.org/scripts/409641-api/code/API.js?version=944014
// @grant           GM_xmlhttpRequest
// @grant           GM_addStyle
// @connect         api.bilibili.com
// @incompatible    firefox 不支持 Greasemonkey！Tampermonkey、Violentmonkey 可用
// ==/UserScript==

const gmId = 'gm428453'
/* global API */
const api = new API({
  id: gmId,
  label: GM_info.script.name,
})

const regex = {
  page_videoNormalMode: /\.com\/video(?=\/|$)/,
  page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater(?=\/|$)/,
  page_dynamic: /t\.bilibili\.com(?=\/|$)/,
  page_space: /space\.bilibili\.com\/\d+(?=\/|$)/,
}

;
(async function() {
  if (api.web.urlMatch([regex.page_videoNormalMode, regex.page_videoWatchlaterMode, regex.page_dynamic], 'OR')) {
    // 动态评论区、视频评论区中的用户弹出卡片
    cardLogic({
      cardClz: 'user-card',
      user: '.face',
      info: '.info',
    })
    if (api.web.urlMatch(regex.page_videoNormalMode)) {
      // 普通模式播放页中的 UP 主头像
      cardLogic({
        cardClz: 'user-card-m',
        container: '#app .v-wrap',
        user: '.face',
        info: '.info',
        lazy: true,
      })
    } else if (api.web.urlMatch(regex.page_videoWatchlaterMode)) {
      // 稍后再看模式播放页中的 UP 主头像
      cardLogic({
        cardClz: 'user-card-m',
        container: '#app #app', // 这是什么阴间玩意？
        user: '.face',
        info: '.info',
        lazy: true,
      })
    } else if (api.web.urlMatch(regex.page_dynamic)) {
      // 动态页左边「正在直播」主播的用户弹出卡片
      cardLogic({
        cardClz: 'userinfo-wrapper',
        user: '.face',
        info: '.info',
        lazy: true,
      })
    }
  } else if (api.web.urlMatch(regex.page_space)) {
    // 用户空间
    generalLogic({
      uid: getUidFromUrl(location.href),
      target: await api.wait.waitForElementLoaded('.h .wrapper'),
      className: `${gmId}-space-same-followings`,
    })
  }

  GM_addStyle(`
    .${gmId}-card-same-followings {
      color: #99a2aa;
      padding: 1em 0 0;
    }
    .${gmId}-card-same-followings :first-child {
      position: absolute;
      margin-left: -5em;
    }

    .${gmId}-space-same-followings {
      color: black;
      margin: 0.5em 0;
      padding: 0.5em;
      background: #fff;
      box-shadow: 0 0 0 1px #eee;
      border-radius: 0 0 4px 4px;
    }
    .${gmId}-space-same-followings div {
      display: inline-block;
    }
    .${gmId}-space-same-followings :first-child {
      font-weight: bold;
      padding-right: 0.5em;
    }
  `)
})()

/**
 * 卡片处理逻辑
 * @async
 * @param {Object} config 配置
 * @param {string} config.cardClz 卡片元素类名
 * @param {string} [config.container=body] 卡片父元素选择器
 * @param {string} config.user 用户元素选择器
 * @param {string} config.info 信息元素选择器
 * @param {boolean} [config.lazy] 卡片内容是否为懒加载
 */
async function cardLogic(config) {
  try {
    let container = document.body
    if (config.container) {
      container = await api.wait.waitForElementLoaded(config.container)
    }
    new MutationObserver(async records => {
      for (const record of records) {
        for (const addedNode of record.addedNodes) {
          if (api.dom.containsClass(addedNode, config.cardClz)) {
            try {
              const card = addedNode
              let face = null
              if (config.lazy) {
                face = await api.wait.waitForElementLoaded(config.user, card)
              } else {
                // 此时并不是在「正在加载」状态的 user-card 中添加新节点以转向「已完成」状态
                // 而是将「正在加载」的 user-card 彻底移除，然后直接将「已完成」的 user-card 添加到 DOM 中
                face = card.querySelector(config.user)
              }
              if (face) {
                const info = await api.wait.waitForElementLoaded(config.info, card)
                await generalLogic({
                  uid: getUidFromUrl(face.href),
                  target: info,
                  className: `${gmId}-card-same-followings`,
                })
              }
            } catch (e) {
              api.logger.error(e)
            }
            break
          }
        }
      }
    }).observe(container, { childList: true })
  } catch (e) {
    api.logger.error(e)
  }
}

/**
 * 通用处理逻辑
 * @async
 * @param {Object} config 配置
 * @param {string | number} config.uid 用户 ID
 * @param {HTMLElement} config.target 指定信息显示元素的父元素
 * @param {string} [config.className=''] 显示元素的类名
 */
async function generalLogic(config) {
  const resp = await api.web.request({
    method: 'GET',
    url: `https://api.bilibili.com/x/relation/same/followings?vmid=${config.uid}`,
  })
  const data = JSON.parse(resp.responseText).data
  const sameFollowings = []
  for (const item of data.list) {
    sameFollowings.push(item.uname)
  }
  if (sameFollowings.length > 0) {
    const sf = config.target.appendChild(document.createElement('div'))
    sf.className = config.className || ''
    sf.innerHTML = `
      <div>共同关注</div>
      <div>${sameFollowings.join('，&nbsp;')}</div>
    `
  }
}

/**
 * 从 URL 中获取 UID
 * @param {string} url URL
 * @returns {string} UID
 */
function getUidFromUrl(url) {
  let uid = null
  const parts = url.split('/')
  while (parts.length > 0) {
    const part = parts.pop()
    if (part && !isNaN(part)) {
      uid = part
      break
    }
  }
  return uid
}
