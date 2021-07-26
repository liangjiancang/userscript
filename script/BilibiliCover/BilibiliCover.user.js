// ==UserScript==
// @name            B站封面获取
// @version         4.12.1.20210726
// @namespace       laster2800
// @author          Laster2800
// @description     B站视频播放页（普通模式、稍后再看模式）、番剧播放页、直播间添加获取封面的按钮
// @icon            https://www.bilibili.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/395575
// @supportURL      https://greasyfork.org/zh-CN/scripts/395575/feedback
// @license         LGPL-3.0
// @include         *://www.bilibili.com/video/*
// @include         *://www.bilibili.com/bangumi/play/*
// @include         *://www.bilibili.com/medialist/play/watchlater
// @include         *://www.bilibili.com/medialist/play/watchlater/*
// @include         *://live.bilibili.com/*
// @exclude         *://live.bilibili.com/
// @exclude         *://live.bilibili.com/?*
// @exclude         *://live.bilibili.com/*/*
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=953957
// @grant           GM_addStyle
// @grant           GM_download
// @grant           GM_notification
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @grant           unsafeWindow
// @connect         api.bilibili.com
// @incompatible    firefox 完全不兼容 Greasemonkey，不完全兼容 Violentmonkey
// ==/UserScript==

(function() {
  'use strict'

  const gm = {
    id: 'gm395575',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210726,
    config: {
      preview: true,
      download: true,
      bangumiSeries: false,
      liveKeyFrame: false,
    },
    configMap: {
      preview: { name: '封面预览' },
      download: { name: '点击下载', needNotReload: true },
      bangumiSeries: { name: '番剧：获取系列总封面' },
      liveKeyFrame: { name: '直播间：获取关键帧' },
    },
    url: {
      noop: 'javascript:void(0)',
    },
    regex: {
      page_videoNormalMode: /\.com\/video(?=[/?#]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater(?=[/?#]|$)/,
      page_bangumi: /\/bangumi\/play(?=[/?#]|$)/,
      page_live: /live\.bilibili\.com\/\d+(?=[/?#]|$)/, // 只含具体的直播间页面
    },
    const: {
      title: '点击保存封面或在新标签页中打开图片（可在脚本菜单中设置）。\n此外，可在脚本菜单中开启或关闭封面预览功能。\n右键点击可基于图片链接作进一步的处理，如通过「另存为」直接保存图片。',
      errorMsg: '获取失败，若非网络问题请提供反馈',
      fadeTime: 200,
      notificationTimeout: 5600,
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
      const config = gm.config
      const configMap = gm.configMap
      const menuId = {}
      setTimeout(() => {
        for (const id in config) {
          menuId[id] = createMenuItem(id)
        }
      })

      const cfgName = id => `[ ${config[id] ? '✓' : '✗'} ] ${configMap[id].name}`
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

        // 4.10.0.20210711
        if (gm.configVersion < 20210711) {
          GM_deleteValue('preview')
        }

        // 功能性更新后更新此处配置版本
        if (gm.configVersion < 20210726) {
          GM_notification({ text: '功能性更新完毕，您可能需要重新设置脚本。' })
        }
        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
      }
    }
  }

  class Webpage {
    constructor() {
      this.method = {
        /**
         * 下载封面
         * @param {string} url 封面 URL
         * @param {string} [name='Cover'] 保存文件名
         */
        download(url, name) {
          name = name || 'Cover'
          const onerror = function(error) {
            if (error?.error == 'not_whitelisted') {
              api.message.alert('该封面的文件格式不在下载模式白名单中，从而触发安全限制导致无法直接下载。可修改脚本管理器的「下载模式」或「文件扩展名白名单」设置以放开限制。')
              window.open(url)
            } else {
              GM_notification({
                text: '下载错误',
                timeout: gm.const.notificationTimeout,
              })
            }
          }
          const ontimeout = function() {
            GM_notification({
              text: '下载超时',
              timeout: gm.const.notificationTimeout,
            })
            window.open(url)
          }
          api.web.download({ url, name, onerror, ontimeout })
        },

        /**
         * 从 URL 获取视频 ID
         * @param {string} [url=location.pathname] 提取视频 ID 的源字符串
         * @returns {{id: string, type: 'aid' | 'bvid'}} `{id, type}`
         */
        getVid(url = location.pathname) {
          let result = null
          // URL 先「?」后「#」，先判断「?」运算量期望稍低一点
          const parts = url.split('?')[0].split('#')[0].split('/')
          while (parts.length > 0) {
            const part = parts.pop()
            if (part) {
              if (/^bv[0-9a-z]+$/i.test(part)) {
                result = { id: 'BV' + part.slice(2), type: 'bvid' }
                break
              } else if (/^(av)?\d+$/i.test(part)) { // 兼容在 URL 还原 AV 号的脚本
                result = { id: part.match(/\d+/)[0], type: 'aid' }
                break
              }
            }
          }
          return result
        },

        /**
         * 下载图片
         * @param {HTMLElement} target 图片按钮元素
         */
        addDownloadEvent(target) {
          if (!target._downloadEvent) {
            const _self = this
            // 此处必须用 mousedown，否则无法与动态获取封面的代码达成正确的联动
            target.addEventListener('mousedown', function(e) {
              if (target.loaded && gm.config.download && e.button == 0) {
                e.preventDefault()
                target.dispatchEvent(new Event('mouseleave'))
                target.disablePreview = true
                _self.download(this.href, document.title)
              }
            })
            // 开启下载时，若没有以下处理器，则鼠标左键长按图片按钮，过一段时间后再松开，松开时依然会触发默认点击事件（在新标签页打开封面）
            target.addEventListener('click', function(e) {
              if (target.loaded && gm.config.download) {
                e.preventDefault()
              }
            })
            target._downloadEvent = true
          }
        },

        /**
         * 提示错误信息
         * @param {HTMLElement} target 图片按钮元素
         */
        addErrorEvent(target) {
          if (!target._errorEvent) {
            target.addEventListener('mousedown', function(e) {
              if (target.loaded) return
              if (e.button == 0 || e.button == 1) {
                e.preventDefault()
                api.message.create(gm.const.errorMsg)
              }
            })
            target._errorEvent = true
          }
        },

        /**
         * 设置封面
         * @param {HTMLElement} target 封面按钮元素
         * @param {HTMLElement} preview 预览元素
         * @param {string} url 封面 URL
         */
        setCover(target, preview, url) {
          if (url) {
            target.title = gm.const.title
            target.href = url
            target.target = '_blank'
            target.loaded = true
            this.addDownloadEvent(target)
            preview.src = url
          } else {
            target.title = gm.const.errorMsg
            target.href = gm.url.noop
            target.target = '_self'
            target.loaded = false
            preview.src = ''
            this.addErrorEvent(target)
          }
        },

        /**
         * 创建预览元素
         * @param {HTMLElement} target 触发元素
         * @returns {HTMLImageElement}
         */
        createPreview(target) {
          const _self = this
          const preview = document.body.appendChild(document.createElement('img'))
          preview.className = `${gm.id}_preview`

          const browserSyncTime = 10
          const antiConflictTime = 20

          const fadeIn = () => {
            preview.style.display = 'unset'
            setTimeout(() => {
              preview.style.opacity = '1'
            }, browserSyncTime)
          }
          const fadeOut = callback => {
            preview.style.opacity = '0'
            setTimeout(() => {
              preview.style.display = 'none'
              callback?.()
            }, gm.const.fadeTime)
          }
          const disablePreviewTemp = () => {
            target.disablePreview = true
            setTimeout(() => {
              if (!target.mouseOver) {
                target.disablePreview = false
              }
            }, 80)
          }

          target.addEventListener('mouseenter', api.tool.debounce(function() {
            if (gm.config.preview) {
              this.mouseOver = true
              if (this.disablePreview) return
              setTimeout(() => {
                preview.src && fadeIn()
              }, antiConflictTime)
            }
          }, 200))
          target.addEventListener('mouseleave', api.tool.debounce(function() {
            if (gm.config.preview) {
              this.mouseOver = false
              if (this.disablePreview) {
                this.disablePreview = false
                return
              }
              setTimeout(() => {
                preview.src && !preview.mouseOver && fadeOut()
              }, antiConflictTime)
            }
          }, 200))

          let startPos = null // 鼠标进入预览时的初始坐标
          preview.onmouseenter = function() {
            this.mouseOver = true
          }
          preview.onmouseleave = function() {
            this.mouseOver = false
            startPos = undefined
            setTimeout(() => {
              preview.src && fadeOut()
            }, antiConflictTime)
          }
          preview.addEventListener('mousedown', function(e) {
            if (this.src) {
              if (e.button == 0 || e.button == 1) {
                if (e.button == 0) {
                  if (gm.config.download) {
                    _self.download(this.src, document.title)
                  } else {
                    window.open(this.src)
                  }
                } else {
                  window.open(this.src)
                }
                fadeOut(disablePreviewTemp)
              }
            }
          })
          preview.addEventListener('wheel', function() {
            // 滚动时关闭预览，优化用户体验
            fadeOut(disablePreviewTemp)
          })
          preview.addEventListener('mousemove', function(e) {
            // 鼠标移动一段距离关闭预览，优化用户体验
            if (startPos) {
              const dSquare = (startPos.x - e.clientX) ** 2 + (startPos.y - e.clientY) ** 2
              if (dSquare > 20 ** 2) { // 20px
                fadeOut(disablePreviewTemp)
              }
            } else {
              startPos = {
                x: e.clientX,
                y: e.clientY,
              }
            }
          })
          return preview
        },
      }
    }

    addVideoBtn(atr) {
      const _self = this
      const cover = document.createElement('a')
      cover.innerText = '获取封面'
      cover.className = 'appeal-text'
      const preview = _self.method.createPreview(cover)

      // 确保与其他脚本配合时相关 UI 排列顺序不会乱
      const gm395456 = atr.querySelector('[id|=gm395456]')
      if (gm395456) {
        atr.insertBefore(cover, gm395456)
      } else {
        atr.appendChild(cover)
      }

      if (api.web.urlMatch(gm.regex.page_videoNormalMode)) {
        api.wait.executeAfterElementLoaded({
          selector: 'meta[itemprop=image]',
          base: document.head,
          subtree: false,
          repeat: true,
          timeout: 0,
          onError: function(e) {
            _self.method.setCover(cover, preview, false)
            api.logger.error(e)
          },
          callback: function(meta) {
            _self.method.setCover(cover, preview, meta.content)
          },
        })
      } else {
        const main = async function(event) {
          try {
            const vid = _self.method.getVid()
            if (cover._cover_id == vid.id) return
            // 在异步等待前拦截，避免逻辑倒置
            event.preventDefault()
            event.stopPropagation()
            const url = await getCover(vid)
            _self.method.setCover(cover, preview, url)
          } catch (e) {
            event.preventDefault()
            event.stopPropagation()
            _self.method.setCover(cover, preview, false)
            api.logger.error(e)
          }

          // 需全面接管一切用户交互引起的行为，默认链接点击行为除外
          removeEventListeners()
          if (event.type == 'mousedown') {
            if (event.button == 0) {
              if (gm.config.download || !cover.loaded) {
                const evt = new Event('mousedown') // 新建一个事件而不是复用 event，以避免意外情况
                evt.button = 0
                cover.dispatchEvent(evt) // 无法触发链接点击跳转
              } else {
                window.open(cover.href)
              }
            } else if (event.button == 1) {
              if (cover.loaded) {
                window.open(cover.href)
              }
            }
          } else if (event.type == 'mouseenter') {
            cover.dispatchEvent(new Event('mouseenter'))
          }
          addEventListeners()
        }

        // lazy loading；捕获期执行，确保优先于其他处理器
        const addEventListeners = () => {
          cover.addEventListener('mousedown', main, true)
          if (gm.config.preview) {
            cover.addEventListener('mouseenter', main, true)
          }
        }
        const removeEventListeners = () => {
          cover.removeEventListener('mousedown', main, true)
          if (gm.config.preview) {
            cover.removeEventListener('mouseenter', main, true)
          }
        }
        addEventListeners()

        const getCover = async (vid = _self.method.getVid()) => {
          if (cover._cover_id != vid.id) {
            const resp = await api.web.request({
              method: 'GET',
              url: `https://api.bilibili.com/x/web-interface/view?${vid.type}=${vid.id}`,
            })
            cover._cover_url = JSON.parse(resp.responseText).data.pic ?? ''
            cover._cover_id = vid.id
          }
          return cover._cover_url
        }
      }
    }

    addBangumiBtn(tm) {
      const _self = this
      const cover = document.createElement('a')
      cover.innerText = '获取封面'
      cover.className = `${gm.id}_bangumi_cover_btn`
      tm.appendChild(cover)
      const preview = _self.method.createPreview(cover)
      if (gm.config.bangumiSeries) {
        const setCover = img => _self.method.setCover(cover, preview, img.src.replace(/@[^@]*$/, ''))
        api.wait.waitQuerySelector('.media-cover img').then(img => {
          setCover(img)
          const ob = new MutationObserver(() => setCover(img))
          ob.observe(img, { attributeFilter: ['src'] })
        }).catch(e => {
          _self.method.setCover(cover, preview, false)
          api.logger.error(e)
        })
      } else {
        const main = async function(event) {
          try {
            const params = getParams()
            if (cover._cover_id == params.paster.aid) return
            const url = getCover(params)
            _self.method.setCover(cover, preview, url)
          } catch (e) {
            _self.method.setCover(cover, preview, false)
            api.logger.error(e)
          } finally {
            event.preventDefault()
            event.stopPropagation()
          }

          // 需全面接管一切用户交互引起的行为，默认链接点击行为除外
          removeEventListeners()
          if (event.type == 'mousedown') {
            if (event.button == 0) {
              if (gm.config.download || !cover.loaded) {
                const evt = new Event('mousedown') // 新建一个事件而不是复用 event，以避免意外情况
                evt.button = 0
                cover.dispatchEvent(evt) // 无法触发链接点击跳转
              } else {
                window.open(cover.href)
              }
            } else if (event.button == 1) {
              if (cover.loaded) {
                window.open(cover.href)
              }
            }
          } else if (event.type == 'mouseenter') {
            cover.dispatchEvent(new Event('mouseenter'))
          }
          addEventListeners()
        }

        // lazy loading；use capture，确保优先于其他监听器执行
        const addEventListeners = () => {
          cover.addEventListener('mousedown', main, true)
          if (gm.config.preview) {
            cover.addEventListener('mouseenter', main, true)
          }
        }
        const removeEventListeners = () => {
          cover.removeEventListener('mousedown', main, true)
          if (gm.config.preview) {
            cover.removeEventListener('mouseenter', main, true)
          }
        }
        addEventListeners()

        const getParams = () => unsafeWindow.getPlayerExtraParams?.()
        const getCover = (params = getParams()) => {
          if (cover._cover_id != params.paster?.aid) {
            cover._cover_url = params.epCover
            cover._cover_id = params.id
          }
          return cover._cover_url
        }
      }
    }

    addLiveBtn(urc) {
      const _self = this
      const cover = document.createElement('a')
      cover.innerText = '获取封面'
      cover.className = `${gm.id}_live_cover_btn`
      urc.insertBefore(cover, urc.firstChild)
      const preview = _self.method.createPreview(cover)
      const info = unsafeWindow.__NEPTUNE_IS_MY_WAIFU__?.roomInfoRes?.data?.room_info
      const url = gm.config.liveKeyFrame ? info?.keyframe : info?.cover
      _self.method.setCover(cover, preview, url)
    }

    addStyle() {
      GM_addStyle(`
        .${gm.id}_bangumi_cover_btn {
          float: right;
          cursor: pointer;
          font-size: 12px;
          margin-right: 16px;
          line-height: 36px;
          color: #505050;
        }
        .${gm.id}_bangumi_cover_btn:hover {
          color: #0075ff;
        }

        .${gm.id}_live_cover_btn {
          cursor: pointer;
          color: #999999;
        }
        .${gm.id}_live_cover_btn:hover {
          color: #23ADE5;
        }

        .${gm.id}_preview {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 142857;
          max-width: 60vw; /* 自适应宽度和高度 */
          max-height: 100vh;
          display: none;
          transition: opacity ${gm.const.fadeTime}ms ease-in-out;
          opacity: 0;
          cursor: pointer;
        }
      `)
    }
  }

  (async function() {
    script = new Script()
    webpage = new Webpage()
  
    script.init()
    script.initScriptMenu()
  
    if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
      const app = await api.wait.waitQuerySelector('#app')
      webpage.addVideoBtn(
        await api.wait.waitForConditionPassed({
          condition: async () => app.__vue__ && await api.wait.waitQuerySelector('#arc_toolbar_report'),
        })
      )
    } else if (api.web.urlMatch(gm.regex.page_bangumi)) {
      const app = await api.wait.waitQuerySelector('#app')
      webpage.addBangumiBtn(
        await api.wait.waitForConditionPassed({
          condition: async () => app.__vue__ && await api.wait.waitQuerySelector('#toolbar_module'),
        })
      )
    } else if (api.web.urlMatch(gm.regex.page_live)) {
      const hiVm = await api.wait.waitQuerySelector('#head-info-vm')
      webpage.addLiveBtn(
        await api.wait.waitForConditionPassed({
          condition: async () => hiVm.__vue__ && await api.wait.waitQuerySelector('.room-info-upper-row .upper-right-ctnr', hiVm),
        })
      )
    }
    webpage.addStyle()
  })()
})()
