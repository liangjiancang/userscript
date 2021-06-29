// ==UserScript==
// @name            B站共同关注快速查看
// @version         1.3.0.20210629
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
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=945083
// @grant           GM_addStyle
// @grant           GM_notification
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @connect         api.bilibili.com
// @incompatible    firefox 不支持 Greasemonkey！Tampermonkey、Violentmonkey 可用
// ==/UserScript==

(function() {
  'use strict'

  const gm = {
    id: 'gm428453',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210627,
    config: {
      failMessage: true,
      withoutSameMessage: true,
      dispInText: false,
      userSpace: true,
      lv1Card: true,
      lv2Card: true,
      lv3Card: false,
    },
    configMap: {
      failMessage: { name: '查询失败时提示信息' },
      withoutSameMessage: { name: '无共同关注时提示信息' },
      dispInText: { name: '以纯文本形式显示共同关注' },
      userSpace: { name: '在用户空间中快速查看' },
      lv1Card: { name: '在常规用户卡片中快速查看' },
      lv2Card: { name: '在扩展用户卡片中快速查看' },
      lv3Card: { name: '在罕见用户卡片中快速查看' },
    },
    regex: {
      page_videoNormalMode: /\.com\/video(?=[/?#]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater(?=[/?#]|$)/,
      page_dynamic: /t\.bilibili\.com(?=[/?#]|$)/,
      page_space: /space\.bilibili\.com\/\d+(?=[/?#]|$)/,
    },
    const: {
      notificationTimeout: 5600,
    },
  }

  /* global UserscriptAPI */
  const api = new UserscriptAPI({
    id: gm.id,
    label: GM_info.script.name,
  })

  class Script {
    /**
     * 初始化脚本
     */
    init() {
      this.updateVersion()
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
        // 其他菜单
        menuId.reset = GM_registerMenuCommand('[ * ] 初始化脚本', () => this.resetScript())
        menuId.help = GM_registerMenuCommand('配置说明', () => {
          window.open('https://gitee.com/liangjiancang/userscript/tree/master/script/BilibiliSameFollowing#配置说明')
        })
      })

      const cfgName = id => `[ ${config[id] ? '√' : '×'} ] ${configMap[id].name}`
      const createMenuItem = id => {
        return GM_registerMenuCommand(cfgName(id), () => {
          config[id] = !config[id]
          GM_setValue(id, config[id])
          GM_notification({
            text: `已${config[id] ? '开启' : '关闭'}「${configMap[id].name}」功能${configMap[id].needNotReload ? '' : '，刷新页面以生效（点击通知以刷新）'}。`,
            timeout: gm.const.notificationTimeout,
            onclick: configMap[id].needNotReload ? null : () => location.reload(),
          })
          clearMenu()
          this.initScriptMenu()
        })
      }
      const clearMenu = () => {
        for (const id in menuId) {
          GM_unregisterMenuCommand(menuId[id])
        }
        menuId = {}
      }
    }

    /**
     * 版本更新处理
     */
    updateVersion() {
      let updated = false
      if (isNaN(gm.configVersion) || gm.configVersion < 0) {
        const gmKeys = GM_listValues()
        if (gmKeys.length > 0) {
          updated = true
          for (const gmKey of gmKeys) {
            GM_deleteValue(gmKey)
          }
        }
        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
      } else if (gm.configVersion < gm.configUpdate) {
        // 必须按从旧到新的顺序写
        // 内部不能使用 gm.configUpdate，必须手写更新后的配置版本号！

        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
        updated = true
      }
      if (updated) {
        const noNotification = new Set([]) // 此处添加 configUpdate 变化但不需要提示的配置版本
        if (!noNotification.has(gm.configUpdate)) {
          GM_notification({ text: '功能性更新完毕，您可能需要重新设置脚本。' })
        }
      }
    }

    /**
     * 初始化脚本
     */
    resetScript() {
      const result = confirm(`【${GM_info.script.name}】\n\n是否要初始化脚本？`)
      if (result) {
        const gmKeys = GM_listValues()
        for (const gmKey of gmKeys) {
          GM_deleteValue(gmKey)
        }
        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
        location.reload()
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
     * 
     * `cardId` 与 `cardClz` 中至少要传入一个，两者采取 `OR` 规则查找元素。
     * @async
     * @param {Object} config 配置
     * @param {string} [config.container=body] 卡片父元素选择器
     * @param {string} config.card 卡片元素选择器
     * @param {string} config.user 用户元素选择器
     * @param {string} config.info 信息元素选择器
     * @param {boolean} [config.lazy=true] 卡片内容是否为懒加载
     * @param {boolean} [config.ancestor] 将 `container` 视为祖先节点而非父节点
     */
    async cardLogic(config) {
      config = { lazy: true, ancestor: false, ...config }
      const _self = this
      try {
        let container = document.body
        if (config.container) {
          container = await api.wait.waitQuerySelector(config.container)
        }
        api.wait.executeAfterElementLoaded({
          selector: config.card,
          base: container,
          subtree: config.ancestor,
          repeat: true,
          timeout: 0,
          callback: async card => {
            try {
              let userLink = null
              if (config.lazy) {
                userLink = await api.wait.waitQuerySelector(config.user, card)
              } else {
                // 此时并不是在「正在加载」状态的 user-card 中添加新节点以转向「已完成」状态
                // 而是将「正在加载」的 user-card 彻底移除，然后直接将「已完成」的 user-card 添加到 DOM 中
                userLink = card.querySelector(config.user)
              }
              if (userLink) {
                const info = await api.wait.waitQuerySelector(config.info, card)
                await _self.generalLogic({
                  uid: _self.method.getUidFromUrl(userLink.href),
                  target: info,
                  className: `${gm.id} card-same-followings`,
                })
              }
            } catch (e) {
              api.logger.error(e)
            }
          },
        })
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
          word-break: break-all;
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

    if (gm.config.lv1Card) {
      // 遍布全站的常规用户卡片，如视频评论区、动态评论区、用户空间评论区……
      webpage.cardLogic({
        card: '.user-card',
        user: '.face',
        info: '.info',
        lazy: false,
      })
    }
    if (api.web.urlMatch(gm.regex.page_videoNormalMode)) {
      if (gm.config.lv2Card) {
        // 普通模式播放页中的 UP 主头像
        webpage.cardLogic({
          container: '#app .v-wrap',
          card: '.user-card-m',
          user: '.face',
          info: '.info',
        })
      }
    } else if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      if (gm.config.lv2Card) {
        // 稍后再看模式播放页中的 UP 主头像
        webpage.cardLogic({
          container: '#app #app', // 这是什么阴间玩意？
          card: '.user-card-m',
          user: '.face',
          info: '.info',
        })
      }
    } else if (api.web.urlMatch(gm.regex.page_dynamic)) {
      if (gm.config.lv2Card) {
        // 1. 动态页左边「正在直播」主播的用户卡片
        // 2. 动态页中，被转发动态的所有者的用户卡片
        webpage.cardLogic({
          card: '.userinfo-wrapper',
          user: '.face',
          info: '.info',
          ancestor: true,
        })
      }
    } else if (api.web.urlMatch(gm.regex.page_space)) {
      if (gm.config.userSpace) {
        // 用户空间顶部显示
        webpage.generalLogic({
          uid: webpage.method.getUidFromUrl(location.pathname),
          target: await api.wait.waitQuerySelector('.h .wrapper'),
          className: `${gm.id} space-same-followings`,
        })
      }
      if (gm.config.lv3Card) {
        // 用户空间的动态中，被转发动态的所有者的用户卡片
        webpage.cardLogic({
          card: '.userinfo-wrapper',
          user: '.face',
          info: '.info',
          ancestor: true,
        })
        // 用户空间右侧充电中的用户卡片
        webpage.cardLogic({
          card: '#id-card',
          user: '.idc-avatar-container',
          info: '.idc-info',
        })
      }
    }
    webpage.addStyle()
  })()
})()
