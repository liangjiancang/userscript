// ==UserScript==
// @name            B站共同关注快速查看
// @version         1.4.38.20210814
// @namespace       laster2800
// @author          Laster2800
// @description     快速查看与特定用户的共同关注（视频播放页、动态页、用户空间、直播间）
// @icon            https://www.bilibili.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/428453
// @supportURL      https://greasyfork.org/zh-CN/scripts/428453/feedback
// @license         LGPL-3.0
// @noframes
// @include         *://www.bilibili.com/*
// @include         *://t.bilibili.com/*
// @include         *://space.bilibili.com/*
// @include         *://live.bilibili.com/*
// @exclude         *://live.bilibili.com/
// @exclude         *://live.bilibili.com/?*
// @exclude         *://www.bilibili.com/watchlater/
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=960119
// @grant           GM_notification
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @connect         api.bilibili.com
// @incompatible    firefox 完全不兼容 Greasemonkey，不完全兼容 Violentmonkey
// ==/UserScript==

(function() {
  'use strict'

  const gm = {
    id: 'gm428453',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210712,
    config: {
      failMessage: true,
      withoutSameMessage: true,
      dispInText: false,
      userSpace: true,
      live: true,
      lv1Card: true,
      lv2Card: true,
      lv3Card: false,
    },
    configMap: {
      failMessage: { name: '查询失败时提示信息', needNotReload: true },
      withoutSameMessage: { name: '无共同关注时提示信息', needNotReload: true },
      dispInText: { name: '以纯文本形式显示共同关注', needNotReload: true },
      userSpace: { name: '在用户空间中快速查看' },
      live: { name: '在直播间中快速查看' },
      lv1Card: { name: '在常规用户卡片中快速查看' },
      lv2Card: { name: '在扩展用户卡片中快速查看' },
      lv3Card: { name: '在罕见用户卡片中快速查看' },
    },
    url: {
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliSameFollowing/changelog.md',
    },
    regex: {
      page_videoNormalMode: /\.com\/video([/?#]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater([/?#]|$)/,
      page_dynamic: /\/t\.bilibili\.com(\/|$)/,
      page_space: /space\.bilibili\.com\/\d+([/?#]|$)/,
      page_live: /live\.bilibili\.com\/\d+([/?#]|$)/, // 只含具体的直播间页面
    },
    const: {
      noticeTimeout: 5600,
    },
  }

  /* global UserscriptAPI */
  const api = new UserscriptAPI({
    id: gm.id,
    label: GM_info.script.name,
  })

  /** @type {Script} */
  let script = null
  /** @type {Webpage} */
  let webpage = null

  class Script {
    /**
     * 初始化脚本
     */
    init() {
      try {
        this.updateVersion()
        for (const name in gm.config) {
          const eb = GM_getValue(name)
          gm.config[name] = typeof eb == 'boolean' ? eb : gm.config[name]
        }
      } catch (e) {
        api.logger.error(e)
        const result = api.message.confirm('初始化错误！是否彻底清空内部数据以重置脚本？')
        if (result) {
          const gmKeys = GM_listValues()
          for (const gmKey of gmKeys) {
            GM_deleteValue(gmKey)
          }
          location.reload()
        }
      }
    }

    /**
     * 初始化脚本菜单
     */
    initScriptMenu() {
      const _self = this
      const cfgName = id => `[ ${config[id] ? '✓' : '✗'} ] ${configMap[id].name}`
      const config = gm.config
      const configMap = gm.configMap
      const menuId = {}
      for (const id in config) {
        menuId[id] = createMenuItem(id)
      }
      // 其他菜单
      menuId.reset = GM_registerMenuCommand('初始化脚本', () => this.resetScript())
      menuId.help = GM_registerMenuCommand('配置说明', () => {
        window.open('https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliSameFollowing/README.md#配置说明')
      })

      function createMenuItem(id) {
        return GM_registerMenuCommand(cfgName(id), () => {
          config[id] = !config[id]
          GM_setValue(id, config[id])
          GM_notification({
            text: `已${config[id] ? '开启' : '关闭'}「${configMap[id].name}」功能${configMap[id].needNotReload ? '' : '，刷新页面以生效（点击通知以刷新）'}。`,
            timeout: gm.const.noticeTimeout,
            onclick: configMap[id].needNotReload ? null : () => location.reload(),
          })
          clearMenu()
          _self.initScriptMenu()
        })
      }

      function clearMenu() {
        for (const id in menuId) {
          GM_unregisterMenuCommand(menuId[id])
        }
      }
    }

    /**
     * 版本更新处理
     */
    updateVersion() {
      if (isNaN(gm.configVersion) || gm.configVersion < 0) {
        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
      } else if (gm.configVersion < gm.configUpdate) {
        // 必须按从旧到新的顺序写
        // 内部不能使用 gm.configUpdate，必须手写更新后的配置版本号！

        // 功能性更新后更新此处配置版本
        if (gm.configVersion < 20210712) {
          GM_notification({
            text: '功能性更新完毕，您可能需要重新设置脚本。点击查看更新日志。',
            onclick: () => window.open(gm.url.gm_changelog),
          })
        }
        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
      }
    }

    /**
     * 初始化脚本
     */
    resetScript() {
      const result = api.message.confirm('是否要初始化脚本？')
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
         * @param {string} [url=location.pathname] URL
         * @returns {string} UID
         */
        getUid(url = location.pathname) {
          return /\/(\d+)([/?#]|$)/.exec(url)?.[1]
        },
      }
    }

    /**
     * 卡片处理逻辑
     * @param {Object} config 配置
     * @param {string} [config.container='body'] 卡片父元素选择器
     * @param {string} config.card 卡片元素选择器
     * @param {string} config.user 用户元素选择器
     * @param {string} config.info 信息元素选择器
     * @param {boolean} [config.lazy=true] 卡片内容是否为懒加载
     * @param {boolean} [config.ancestor] 将 `container` 视为祖先元素而非父元素
     */
    async cardLogic(config) {
      config = { lazy: true, ancestor: false, ...config }
      const _self = this
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
          let userLink = null
          if (config.lazy) {
            userLink = await api.wait.waitQuerySelector(config.user, card)
          } else {
            // 此时并不是在「正在加载」状态的 user-card 中添加新元素以转向「已完成」状态
            // 而是将「正在加载」的 user-card 彻底移除，然后直接将「已完成」的 user-card 添加到 DOM 中
            userLink = card.querySelector(config.user)
          }
          if (userLink) {
            const info = await api.wait.waitQuerySelector(config.info, card)
            await _self.generalLogic({
              uid: _self.method.getUid(userLink.href),
              target: info,
              className: `${gm.id} card-same-followings`,
            })
          }
        },
      })
    }

    /**
     * 通用处理逻辑
     * @param {Object} config 配置
     * @param {string | number} config.uid 用户 ID
     * @param {HTMLElement} config.target 指定信息显示元素的父元素
     * @param {string} [config.className=''] 显示元素的类名；若 `target` 的子孙元素中有对应元素则直接使用，否则创建之
     */
    async generalLogic(config) {
      let sf = config.target.sameFollowings ?? (config.className ? config.target.querySelector(config.className.replace(/(^|\s+)(?=\w)/g, '.')) : null)
      if (sf) {
        sf.innerHTML = ''
      }
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
          if (!sf) {
            sf = config.target.appendChild(document.createElement('div'))
            sf.className = config.className || ''
          }
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
          if (!sf) {
            sf = config.target.appendChild(document.createElement('div'))
            sf.className = config.className || ''
          }
          sf.innerHTML = `<div>共同关注</div><div>[ ${json.message} ]</div>`
        }
        const msg = [json.code, json.message]
        if (json.code > 0) {
          api.logger.info(msg)
        } else {
          config.target.sameFollowings = sf
          throw msg
        }
      }
      config.target.sameFollowings = sf
    }

    /**
     * 初始化直播间
     *
     * 处理点击弹幕弹出的信息卡片。
     */
    async initLive() {
      let frame = null
      let container = await api.wait.waitQuerySelector('.danmaku-menu, #player-ctnr iframe')
      if (container.tagName == 'IFRAME') {
        frame = container
        let doc = frame.contentDocument
        // 依执行至此的页面加载进度（与网络正相关、与 CPU 负相关），这里 doc 有以下三种情况：
        // 1. frame 未初始化，获取到其默认 document：`<html><head></head><body></body></html>`，且 `readyState == 'complete'`
        // 2. frame 正在初始化，默认 document 被移除，获取到 null
        // 3. 获取到正确的 frame document
        if (!doc?.documentElement.textContent) { // 可应对以上状态的条件
          api.logger.info('Waiting for live room iframe document...')
          await new Promise(resolve => {
            frame.addEventListener('load', function() {
              doc = frame.contentDocument
              resolve()
            })
          })
        }
        container = await api.wait.waitQuerySelector('.danmaku-menu', doc)
        webpage.addStyle(doc)
      }
      const userLink = await api.wait.waitQuerySelector('.go-space a', container)
      container.style.maxWidth = frame ? '264px' : '300px'

      const ob = new MutationObserver(async records => {
        const uid = webpage.method.getUid(records[0].target.href)
        if (uid) {
          webpage.generalLogic({
            uid: uid,
            target: container,
            className: `${gm.id} live-same-followings`,
          })

          // 若在 frame 中，container 右边会被 frame 边界挡住使得宽度受限，用 transform 左移也无法突破
          // 故不能直接用一个 transform 来解决，须动态计算
          // 说是动态计算，也不要根据宽度增量来算偏移了，一是官方自己的位置就不科学；二是想精确计算，必须得等到卡片
          // 注入文字之后，那么偏移的时间点就晚了，会造成视觉上非常强烈的不适感，综合显示效果还不如现在这样
          container.style.left = frame ? '76vw' : '72vw'
        }
      })
      ob.observe(userLink, { attributeFilter: ['href'] })
    }

    addStyle(doc = document) {
      api.dom.addStyle(`
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

        .${gm.id}.live-same-followings > * {
          display: block;
        }
        .${gm.id}.live-same-followings > :first-child {
          margin-top: 1em;
          font-weight: bold;
        }
      `, doc)
    }
  }

  window.addEventListener('load', async function() {
    script = new Script()
    webpage = new Webpage()

    script.init()
    script.initScriptMenu()
    webpage.addStyle()

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
          uid: webpage.method.getUid(),
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
    } else if (api.web.urlMatch(gm.regex.page_live)) {
      if (gm.config.live) {
        // 直播间点击弹幕弹出的信息卡片
        webpage.initLive()
      }
    }
  })
})()
