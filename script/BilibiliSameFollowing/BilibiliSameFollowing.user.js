// ==UserScript==
// @name            B站共同关注快速查看
// @version         1.7.4.20210920
// @namespace       laster2800
// @author          Laster2800
// @description     快速查看与特定用户的共同关注（视频播放页、动态页、用户空间、直播间）
// @icon            https://www.bilibili.com/favicon.ico
// @homepageURL     https://greasyfork.org/zh-CN/scripts/428453
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
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=969309
// @require         https://greasyfork.org/scripts/432002-userscriptapiwait/code/UserscriptAPIWait.js?version=971988
// @require         https://greasyfork.org/scripts/432003-userscriptapiweb/code/UserscriptAPIWeb.js?version=969305
// @grant           GM_notification
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @connect         api.bilibili.com
// @compatible      edge 版本不小于 85
// @compatible      chrome 版本不小于 85
// @compatible      firefox 版本不小于 90
// ==/UserScript==

(function() {
  'use strict'

  const gm = {
    id: 'gm428453',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210829,
    config: {
      dispMessage: true,
      dispInReverse: false,
      dispInText: false,
      dispRelation: true,
      userSpace: true,
      live: true,
      commonCard: true,
      rareCard: false,
    },
    configMap: {
      dispMessage: { name: '无共同关注或查询失败时提示信息', needNotReload: true },
      dispInReverse: { name: '以关注时间降序显示', needNotReload: true },
      dispInText: { name: '以纯文本形式显示', needNotReload: true },
      dispRelation: { name: '显示目标用户与自己的关系', needNotReload: true },
      userSpace: { name: '在用户空间中快速查看' },
      live: { name: '在直播间中快速查看' },
      commonCard: { name: '在常规用户卡片中快速查看' },
      rareCard: { name: '在罕见用户卡片中快速查看' },
    },
    url: {
      api_sameFollowings: uid => `https://api.bilibili.com/x/relation/same/followings?vmid=${uid}`,
      api_relation: uid => `http://api.bilibili.com/x/space/acc/relation?mid=${uid}`,
      page_space: uid => `https://space.bilibili.com/${uid}`,
      gm_help: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliSameFollowing/README.md#配置说明',
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliSameFollowing/changelog.md',
    },
    regex: {
      page_videoNormalMode: /\.com\/video([#/?]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater([#/?]|$)/,
      page_dynamic: /\/t\.bilibili\.com(\/|$)/,
      page_space: /space\.bilibili\.com\/\d+([#/?]|$)/,
      page_live: /live\.bilibili\.com\/\d+([#/?]|$)/, // 只含具体的直播间页面
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

  /**
   * 脚本运行的抽象，为脚本本身服务的核心功能
   */
  class Script {
    /** 通用方法 */
    method = {
      /**
       * 重置脚本
       */
      reset() {
        const gmKeys = GM_listValues()
        for (const gmKey of gmKeys) {
          GM_deleteValue(gmKey)
        }
      },
    }

    /**
     * 初始化脚本
     */
    init() {
      const _self = this
      try {
        _self.updateVersion()
        for (const name in gm.config) {
          const eb = GM_getValue(name)
          gm.config[name] = typeof eb == 'boolean' ? eb : gm.config[name]
        }
      } catch (e) {
        api.logger.error(e)
        api.message.confirm('初始化错误！是否彻底清空内部数据以重置脚本？').then(result => {
          if (result) {
            _self.method.reset()
            location.reload()
          }
        })
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
      menuId.help = GM_registerMenuCommand('配置说明', () => window.open(gm.url.gm_help))

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
      if (gm.configVersion >= 20210829) { // 1.5.0.20210829
        if (gm.configVersion < gm.configUpdate) {
          // 必须按从旧到新的顺序写
          // 内部不能使用 gm.configUpdate，必须手写更新后的配置版本号！

          // 功能性更新后更新此处配置版本
          if (gm.configVersion < 0) {
            GM_notification({
              text: '功能性更新完毕，您可能需要重新设置脚本。点击查看更新日志。',
              onclick: () => window.open(gm.url.gm_changelog),
            })
          }
        }
        if (gm.configVersion != gm.configUpdate) {
          gm.configVersion = gm.configUpdate
          GM_setValue('configVersion', gm.configVersion)
        }
      } else {
        this.method.reset()
        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
      }
    }

    /**
     * 初始化脚本
     */
    async resetScript() {
      const result = await api.message.confirm('是否要初始化脚本？')
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

  /**
   * 页面处理的抽象，脚本围绕网站的特化部分
   */
  class Webpage {
    /** 通用方法 */
    method = {
      /**
       * 从 URL 中获取 UID
       * @param {string} [url=location.pathname] URL
       * @returns {string} UID
       */
      getUid(url = location.pathname) {
        return /\/(\d+)([#/?]|$)/.exec(url)?.[1]
      },

      /**
       * 获取指定用户与你的关系
       * @param {string} uid UID
       * @returns {Promise<{code: number, special: boolean}>} `{code, special}`
       * @see {@link https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/user/relation.md#查询用户与自己关系_互相 查询用户与自己关系_互相}
       */
      async getRelation(uid) {
        const resp = await api.web.request({
          url: gm.url.api_relation(uid),
        }, { check: r => r.code === 0 })
        const relation = resp.data.be_relation
        return { code: relation.attribute, special: relation.special == 1 }
      },
    }

    /**
     * 卡片处理逻辑
     * @param {Object} options 选项
     * @param {string} [options.container] 卡片父元素选择器，缺省时取 `document.body`
     * @param {string} options.card 卡片元素选择器
     * @param {string} options.user 用户元素选择器
     * @param {string} options.info 信息元素选择器
     * @param {boolean} [options.lazy=true] 卡片内容是否为懒加载
     * @param {boolean} [options.ancestor] 将 `container` 视为祖先元素而非父元素
     */
    async cardLogic(options) {
      options = { lazy: true, ancestor: false, ...options }
      const _self = this
      const container = options.container ? await api.wait.$(options.container) : (document.body ?? await api.wait.$('body'))
      api.wait.executeAfterElementLoaded({
        selector: options.card,
        base: container,
        subtree: options.ancestor,
        repeat: true,
        timeout: 0,
        callback: async card => {
          let userLink = null
          if (options.lazy) {
            userLink = await api.wait.$(options.user, card)
          } else {
            // 此时并不是在「正在加载」状态的 user-card 中添加新元素以转向「已完成」状态
            // 而是将「正在加载」的 user-card 彻底移除，然后直接将「已完成」的 user-card 添加到 DOM 中
            userLink = card.querySelector(options.user)
          }
          if (userLink) {
            const info = await api.wait.$(options.info, card)
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
     * @param {Object} options 选项
     * @param {string | number} options.uid 用户 ID
     * @param {HTMLElement} options.target 指定信息显示元素的父元素
     * @param {string} [options.className=''] 显示元素的类名；若 `target` 的子孙元素中有对应元素则直接使用，否则创建之
     */
    async generalLogic(options) {
      let dispEl = options.target.sameFollowings ?? (options.className ? options.target.querySelector(options.className.replace(/(^|\s+)(?=\w)/g, '.')) : null)
      if (dispEl) {
        dispEl.textContent = ''
      } else {
        dispEl = options.target.appendChild(document.createElement('div'))
        dispEl.className = options.className || ''
        options.target.sameFollowings = dispEl
      }
      dispEl.style.display = 'none'

      try {
        const resp = await api.web.request({
          url: gm.url.api_sameFollowings(options.uid),
        })
        if (resp.code === 0) {
          const data = resp.data
          let sameFollowings = null
          if (gm.config.dispInText) {
            sameFollowings = data.list?.map(item => item.uname) ?? []
          } else {
            sameFollowings = data.list ?? []
          }
          if (sameFollowings.length > 0 || gm.config.dispMessage) {
            if (sameFollowings.length > 0) {
              if (!gm.config.dispInReverse) {
                sameFollowings.reverse()
              }
              if (gm.config.dispInText) {
                dispEl.innerHTML = `<div class="gm-pre">共同关注</div><div class="same-following">${sameFollowings.join('，&nbsp;')}</div>`
              } else {
                let innerHTML = '<div class="gm-pre" title="加粗：特别关注；下划线：互粉">共同关注</div><div>'
                for (const item of sameFollowings) {
                  let className = 'same-following'
                  if (item.special == 1) { // 特别关注
                    className += ' gm-special'
                  }
                  if (item.attribute == 6) { // 互粉
                    className += ' gm-mutual'
                  }
                  innerHTML += `<a href="${gm.url.page_space(item.mid)}" target="_blank" class="${className}">${item.uname}</a><span>，&nbsp;</span>`
                }
                dispEl.innerHTML = innerHTML.slice(0, -'<span>，&nbsp;</span>'.length) + '</div>'
              }
            } else if (gm.config.dispMessage) {
              dispEl.innerHTML = '<div class="gm-pre">共同关注</div><div class="same-following">[ 无 ]</div>'
            }
          }
        } else {
          if (gm.config.dispMessage && resp.message) {
            dispEl.innerHTML = `<div class="gm-pre">共同关注</div><div>[ ${resp.message} ]</div>`
          }
          const msg = [resp.code, resp.message]
          if (resp.code > 0) {
            api.logger.info(msg)
          } else {
            api.logger.error(msg)
          }
        }
      } catch (e) {
        if (gm.config.dispMessage) {
          dispEl.innerHTML = '<div class="gm-pre">共同关注</div><div>[ 网络请求错误 ]</div>'
        }
        api.logger.error(e)
      }

      if (gm.config.dispRelation) {
        try {
          const relation = await this.method.getRelation(options.uid)
          const desc = (relation.special ? {
            1: '对方悄悄关注并特别关注了你', // impossible
            2: '对方特别关注了你',
            6: '对方与你互粉并特别关注了你',
            128: '对方已将你拉黑，但特别关注了你', // impossible
          } : {
            1: '对方悄悄关注了你',
            2: '对方关注了你',
            6: '对方与你互粉',
            128: '对方已将你拉黑',
          })[relation.code]
          if (desc) {
            dispEl.insertAdjacentHTML('afterbegin', `<div class="gm-relation">${desc}</div>`)
          }
        } catch (e) {
          api.logger.error(e)
        }
      }

      if (dispEl.textContent) {
        dispEl.style.display = ''
      }
    }

    /**
     * 初始化直播间
     *
     * 处理点击弹幕弹出的信息卡片。
     */
    async initLive() {
      let frame = null
      let container = await api.wait.$('.danmaku-menu, #player-ctnr iframe')
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
        container = await api.wait.$('.danmaku-menu', doc)
        webpage.addStyle(doc)
      }
      const userLink = await api.wait.$('.go-space a', container)
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
      api.base.addStyle(`
        .${gm.id} > * {
          display: inline-block;
        }
        .${gm.id} > *,
        .${gm.id} .same-following {
          color: inherit;
          text-decoration: none;
          outline: none;
          margin: 0;
          padding: 0;
          border: 0;
          vertical-align: baseline;
          white-space: pre-wrap;
          word-break: break-all;
          line-height: 1.42em; /* 解决换行后仅剩英文时行高不一致的问题 */
        }
        .${gm.id} a.same-following:hover {
          color: #00a1d6;
        }
        .${gm.id} .gm-relation {
          display: block;
          font-weight: bold;
        }
        .${gm.id} .gm-special {
          font-weight: bold;
        }
        .${gm.id} .gm-mutual {
          text-decoration: underline;
        }

        .${gm.id}.card-same-followings {
          color: #99a2aa;
          padding: 1em 0 0;
        }
        .${gm.id}.card-same-followings .gm-pre {
          position: absolute;
          margin-left: -5em;
          font-weight: bold;
          line-height: unset;
        }

        .${gm.id}.space-same-followings {
          margin-bottom: 0.5em;
          padding: 0.5em 1.6em;
          background: #fff;
          box-shadow: 0 0 0 1px #eee;
          border-radius: 0 0 4px 4px;
        }
        .${gm.id}.space-same-followings .gm-pre {
          font-weight: bold;
          padding-right: 1em;
        }

        .${gm.id}.live-same-followings > * {
          display: block;
        }
        .${gm.id}.live-same-followings > :first-child { /* 不要直接加到容器上，避免为空时出现间隔 */
          margin-top: 1em;
        }
        .${gm.id}.live-same-followings .gm-pre {
          font-weight: bold;
        }
      `, doc)
    }
  }

  document.readyState != 'complete' ? window.addEventListener('load', main) : main()

  async function main() {
    script = new Script()
    webpage = new Webpage()

    script.init()
    script.initScriptMenu()
    webpage.addStyle()

    if (gm.config.commonCard) {
      // 遍布全站的常规用户卡片，如视频评论区、动态评论区、用户空间评论区……
      webpage.cardLogic({
        card: '.user-card',
        user: '.face',
        info: '.info',
        lazy: false,
      })
    }
    if (api.base.urlMatch(gm.regex.page_videoNormalMode)) {
      if (gm.config.commonCard) {
        // 常规播放页中的UP主头像
        webpage.cardLogic({
          container: '#app .v-wrap',
          card: '.user-card-m',
          user: '.face',
          info: '.info',
        })
      }
    } else if (api.base.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      if (gm.config.commonCard) {
        // 稍后再看播放页中的UP主头像
        webpage.cardLogic({
          container: '#app #app', // 这是什么阴间玩意？
          card: '.user-card-m',
          user: '.face',
          info: '.info',
        })
      }
    } else if (api.base.urlMatch(gm.regex.page_dynamic)) {
      if (gm.config.commonCard) {
        // 1. 动态页左边「正在直播」主播的用户卡片
        // 2. 动态页中，被转发动态的所有者的用户卡片
        webpage.cardLogic({
          card: '.userinfo-wrapper',
          user: '.face',
          info: '.info',
          ancestor: true,
        })
      }
    } else if (api.base.urlMatch(gm.regex.page_space)) {
      if (gm.config.userSpace) {
        // 用户空间顶部显示
        webpage.generalLogic({
          uid: webpage.method.getUid(),
          target: await api.wait.$('.h .wrapper'),
          className: `${gm.id} space-same-followings`,
        })
      }
      if (gm.config.rareCard) {
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
    } else if (api.base.urlMatch(gm.regex.page_live)) {
      if (gm.config.live) {
        // 直播间点击弹幕弹出的信息卡片
        webpage.initLive()
      }
    }
  }
})()
