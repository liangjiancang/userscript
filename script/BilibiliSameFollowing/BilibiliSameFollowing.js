// ==UserScript==
// @name            B站共同关注快速查看
// @version         1.2.2.20210626
// @namespace       laster2800
// @author          Laster2800
// @description     快速查看与特定用户的共同关注（视频播放页、动态页、用户空间）
// @icon            https://www.bilibili.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/428453
// @supportURL      https://greasyfork.org/zh-CN/scripts/428453/feedback
// @license         LGPL-3.0
// @include         *://www.bilibili.com/*
// @include         *://t.bilibili.com/*
// @include         *://space.bilibili.com/*
// @exclude         *://t.bilibili.com/h5/dynamic/specification
// @exclude         *://www.bilibili.com/page-proxy/game-nav.html
// @exclude         /.*:\/\/.*:\/\/.*/
// @require         https://greasyfork.org/scripts/409641-api/code/API.js?version=944165
// @grant           GM_xmlhttpRequest
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @grant           GM_notification
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_addStyle
// @connect         api.bilibili.com
// @incompatible    firefox 不支持 Greasemonkey！Tampermonkey、Violentmonkey 可用
// ==/UserScript==

(function() {
  'use strict'

  const gm = {
    id: 'gm428453',
    config: {
      failMessage: true,
      withoutSameMessage: true,
      dispInText: false,
      commonCard: true,
      extendedCard: true,
      userSpace: true,
    },
    configMap: {
      failMessage: { name: '查询失败时提示信息' },
      withoutSameMessage: { name: '无共同关注时提示信息' },
      dispInText: { name: '以纯文本形式显示共同关注' },
      commonCard: { name: '在常规用户卡片中快速查看' },
      extendedCard: { name: '在扩展用户卡片中快速查看' },
      userSpace: { name: '在用户空间中快速查看' },
    },
    regex: {
      page_videoNormalMode: /\.com\/video(?=[/?#]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater(?=[/?#]|$)/,
      page_dynamic: /t\.bilibili\.com(?=[/?#]|$)/,
      page_space: /space\.bilibili\.com\/\d+(?=[/?#]|$)/,
    }
  }

  /* global API */
  const api = new API({
    id: gm.id,
    label: GM_info.script.name,
  })

  class Script {
    /**
     * 初始化脚本
     */
    init() {
      for (const name in gm.config) {
        const eb = GM_getValue(name)
        gm.config[name] = typeof eb == 'boolean' ? eb : gm.config[name]
      }
    }

    /**
     * 初始化脚本菜单
     */
    initScriptMenu() {
      const config = gm.config
      const configMap = gm.configMap
      let menuId = {}
      setTimeout(() => {
        for (const id in config) {
          menuId[id] = createMenuItem(id)
        }
      })

      const cfgName = id => `[ ${config[id] ? '√' : '×'} ] ${configMap[id].name}`
      const createMenuItem = id => {
        return GM_registerMenuCommand(cfgName(id), () => {
          config[id] = !config[id]
          GM_setValue(id, config[id])
          GM_notification({
            text: `已${config[id] ? '开启' : '关闭'}「${configMap[id].name}」功能${configMap[id].needNotReload ? '' : '，刷新页面以生效（点击通知以刷新）'}`,
            timeout: 5600,
            onclick: configMap[id].needNotReload ? null : () => location.reload(),
          })
          clearMenu()
          this.initScriptMenu()
        })
      }
      const clearMenu = () => {
        for (const id in config) {
          GM_unregisterMenuCommand(menuId[id])
        }
        menuId = {}
      }
    }
  }

  class Webpage {
    constructor() {
      this.method = {
        /**
         * 从 URL 中获取 UID
         * @param {string} url URL
         * @returns {string} UID
         */
        getUidFromUrl(url) {
          let uid = ''
          // URL 先「?」后「#」，先判断「?」运算量期望稍低一点
          const parts = url.split('?')[0].split('#')[0].split('/')
          while (parts.length > 0) {
            const part = parts.pop()
            if (part && !isNaN(part)) {
              uid = part
              break
            }
          }
          return uid
        },
      }
    }

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
    async cardLogic(config) {
      const _self = this
      try {
        let container = document.body
        if (config.container) {
          container = await api.wait.waitForElementLoaded(config.container)
        }
        new MutationObserver(async records => {
          for (const record of records) {
            for (const addedNode of record.addedNodes) {
              if (api.dom.containsClass(addedNode, config.cardClz)) {
                const card = addedNode
                try {
                  let userLink = null
                  if (config.lazy) {
                    userLink = await api.wait.waitForElementLoaded(config.user, card)
                  } else {
                    // 此时并不是在「正在加载」状态的 user-card 中添加新节点以转向「已完成」状态
                    // 而是将「正在加载」的 user-card 彻底移除，然后直接将「已完成」的 user-card 添加到 DOM 中
                    userLink = card.querySelector(config.user)
                  }
                  if (userLink) {
                    const info = await api.wait.waitForElementLoaded(config.info, card)
                    await _self.generalLogic({
                      uid: _self.method.getUidFromUrl(userLink.href),
                      target: info,
                      className: `${gm.id} card-same-followings`,
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
    async generalLogic(config) {
      try {
        const resp = await api.web.request({
          method: 'GET',
          url: `https://api.bilibili.com/x/relation/same/followings?vmid=${config.uid}`,
        })
        const json = JSON.parse(resp.responseText)
        if (json.code == 0) {
          const data = json.data
          const sameFollowings = []
          if (gm.config.dispInText) {
            for (const item of data.list) {
              sameFollowings.push(item.uname)
            }
          } else {
            for (const item of data.list) {
              sameFollowings.push([item.uname, `https://space.bilibili.com/${item.mid}`])
            }
          }
          if (sameFollowings.length > 0 || gm.config.withoutSameMessage) {
            const sf = config.target.appendChild(document.createElement('div'))
            sf.className = config.className || ''
            if (sameFollowings.length > 0) {
              if (gm.config.dispInText) {
                sf.innerHTML = `<div>共同关注</div><div class="same-following">${sameFollowings.join('，&nbsp;')}</div>`
              } else {
                let innerHTML = '<div>共同关注</div><div>'
                for (const item of sameFollowings) {
                  innerHTML += `<a href="${item[1]}" target="_blank" class="same-following">${item[0]}</a><span>，&nbsp;</span>`
                }
                sf.innerHTML = innerHTML.slice(0, -'<span>，&nbsp;</span>'.length) + '</div>'
              }
            } else if (gm.config.withoutSameMessage) {
              sf.innerHTML = '<div>共同关注</div><div class="same-following">[ 无 ]</div>'
            }
          }
        } else {
          if (gm.config.failMessage && json.message) {
            const sf = config.target.appendChild(document.createElement('div'))
            sf.className = config.className || ''
            sf.innerHTML = `<div>共同关注</div><div>[ ${json.message} ]</div>`
          }
          const msg = [json.code, json.message]
          if (json.code > 0) {
            api.logger.info(msg)
          } else {
            throw msg
          }
        }
      } catch (e) {
        api.logger.error(e)
      }
    }

    addStyle() {
      GM_addStyle(`
        .${gm.id} > * {
          display: inline-block;
        }
        .${gm.id} > *,
        .${gm.id} .same-following {
          color: inherit;
          font-weight: inherit;
          text-decoration: none;
          outline: none;
          margin: 0;
          padding: 0;
          border: 0;
          vertical-align: baseline;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .${gm.id} a.same-following:hover {
          color: #00a1d6;
        }

        .${gm.id}.card-same-followings {
          color: #99a2aa;
          padding: 1em 0 0;
        }
        .${gm.id}.card-same-followings > :first-child {
          position: absolute;
          margin-left: -5em;
          font-weight: bold;
        }
    
        .${gm.id}.space-same-followings {
          margin: 0.5em 0;
          padding: 0.5em 1.6em;
          background: #fff;
          box-shadow: 0 0 0 1px #eee;
          border-radius: 0 0 4px 4px;
        }
        .${gm.id}.space-same-followings > :first-child {
          font-weight: bold;
          padding-right: 1em;
        }
      `)
    }
  }

  (async function() {
    const script = new Script()
    const webpage = new Webpage()

    script.init()
    script.initScriptMenu()

    // 遍布全站的常规用户卡片，如视频评论区、动态评论区、用户空间评论区……
    if (gm.config.commonCard) {
      webpage.cardLogic({
        cardClz: 'user-card',
        user: '.face',
        info: '.info',
      })
    }
    if (api.web.urlMatch(gm.regex.page_videoNormalMode)) {
      // 普通模式播放页中的 UP 主头像
      if (gm.config.extendedCard) {
        webpage.cardLogic({
          cardClz: 'user-card-m',
          container: '#app .v-wrap',
          user: '.face',
          info: '.info',
          lazy: true,
        })
      }
    } else if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      // 稍后再看模式播放页中的 UP 主头像
      if (gm.config.extendedCard) {
        webpage.cardLogic({
          cardClz: 'user-card-m',
          container: '#app #app', // 这是什么阴间玩意？
          user: '.face',
          info: '.info',
          lazy: true,
        })
      }
    } else if (api.web.urlMatch(gm.regex.page_dynamic)) {
      // 动态页左边「正在直播」主播的用户卡片
      if (gm.config.extendedCard) {
        webpage.cardLogic({
          cardClz: 'userinfo-wrapper',
          user: '.face',
          info: '.info',
          lazy: true,
        })
      }
    } else if (api.web.urlMatch(gm.regex.page_space)) {
      // 用户空间
      if (gm.config.userSpace) {
        webpage.generalLogic({
          uid: webpage.method.getUidFromUrl(location.pathname),
          target: await api.wait.waitForElementLoaded('.h .wrapper'),
          className: `${gm.id} space-same-followings`,
        })
      }
    }
    webpage.addStyle()
  })()
})()
