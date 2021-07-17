// ==UserScript==
// @name            B站封面获取
// @version         4.11.5.20210717
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
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=951322
// @grant           GM_addStyle
// @grant           GM_download
// @grant           GM_notification
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @grant           unsafeWindow
// @grant           window.onurlchange
// @connect         api.bilibili.com
// @incompatible    firefox 完全不兼容 Greasemonkey，不完全兼容 Violentmonkey
// ==/UserScript==

(function() {
  'use strict'

  const gm = {
    id: 'gm395575',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210711,
    config: {
      preview: true,
      download: true,
    },
    configMap: {
      preview: { name: '封面预览' },
      download: { name: '点击下载', needNotReload: true },
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
        if (gm.configVersion < 20210711) {
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
              alert('该封面的文件格式不在下载模式白名单中，从而触发安全限制导致无法直接下载。可修改脚本管理器的「下载模式」或「文件扩展名白名单」设置以放开限制。')
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
         * 获取 `aid`
         * @async
         * @returns {Promise<string>} `aid`
         */
        async getAid() {
          const aid = unsafeWindow.aid || await api.wait.waitForConditionPassed({
            condition: () => unsafeWindow.player?.getVideoMessage?.()?.aid,
          })
          return String(aid ?? '')
        },

        /**
         * 下载图片
         * @param {HTMLElement} target 图片按钮元素
         */
        addDownloadEvent(target) {
          const _self = this
          // 此处必须用 mousedown，否则无法与动态获取封面的代码达成正确的联动
          target.addEventListener('mousedown', function(e) {
            if (gm.config.download && e.button == 0) {
              e.preventDefault()
              target.dispatchEvent(new Event('mouseleave'))
              target.disablePreview = true
              _self.download(this.href, document.title)
            }
          })
          // 开启下载时，若没有以下处理器，则鼠标左键长按图片按钮，过一段时间后再松开，松开时依然会触发默认点击事件（在新标签页打开封面）
          target.addEventListener('click', function(e) {
            if (gm.config.download) {
              e.preventDefault()
            }
          })
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

          const fadeTime = 200
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
            }, fadeTime)
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
            const _self = target
            if (gm.config.preview) {
              _self.mouseOver = true
              if (_self.disablePreview) return
              setTimeout(() => {
                preview.src && fadeIn()
              }, antiConflictTime)
            }
          }, 200))
          target.addEventListener('mouseleave', api.tool.debounce(function() {
            const _self = target
            if (gm.config.preview) {
              _self.mouseOver = false
              if (_self.disablePreview) {
                _self.disablePreview = false
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
          GM_addStyle(`
            .${gm.id}_preview {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 142857;
              max-width: 60vw; /* 自适应宽度和高度 */
              max-height: 100vh;
              display: none;
              transition: opacity ${fadeTime}ms ease-in-out;
              opacity: 0;
              cursor: pointer;
            }
          `)
          return preview
        },
      }
    }

    addVideoBtn(atr) {
      const _self = this
      const bus = {}
      const cover = document.createElement('a')
      const errorMsg = '获取失败，若非网络问题请提供反馈'
      cover.innerText = '获取封面'
      cover.className = 'appeal-text'
      cover.onclick = e => e.stopPropagation()
      const preview = _self.method.createPreview(cover)

      // 确保与其他脚本配合时相关 UI 排列顺序不会乱
      const gm395456 = atr.querySelector('[id|=gm395456]')
      if (gm395456) {
        atr.insertBefore(cover, gm395456)
      } else {
        atr.appendChild(cover)
      }

      const main = async function(e) {
        try {
          const url = await getCover()
          bus.cover = url
          bus.aid = await _self.method.getAid()
          bus.pathname = location.pathname
          setCover(url)
          window.addEventListener('urlchange', async function() {
            if (location.pathname == bus.pathname) return // 并非切换视频（如切分 P）
            try {
              bus.pathname = location.pathname
              bus.aid = await api.wait.waitForConditionPassed({
                condition: async () => {
                  // 要等 aid 跟之前存的不一样，才能说明是切换成功后获取到的 aid
                  const aid = await _self.method.getAid()
                  if (aid && aid != bus.aid) {
                    return aid
                  }
                },
              })
              updateCover()
            } catch (e) {
              setCover(false)
              api.logger.error(e)
            }
          })
        } catch (e) {
          setCover(false)
          api.logger.error(e)
        }

        cover.removeEventListener('mousedown', main)
        if (gm.config.preview) {
          cover.removeEventListener('mouseover', main)
        }

        if (e) {
          e.preventDefault()
          if (e.type == 'mousedown') {
            if (e.button == 0) {
              if (gm.config.download || !cover.loaded) {
                cover.dispatchEvent(e) // 无法触发链接点击跳转
              } else {
                window.open(cover.href)
              }
            } else if (e.button == 1) {
              if (cover.loaded) {
                window.open(cover.href)
              }
            }
          } else if (e.type == 'mouseover') {
            cover.dispatchEvent(new Event('mouseenter'))
          }
        }
      }
      cover.addEventListener('mousedown', main)
      if (gm.config.preview) {
        cover.addEventListener('mouseover', main)
      }

      const updateCover = async () => {
        try {
          bus.cover = await api.wait.waitForConditionPassed({
            condition: async () => {
              // aid 变化只能说明视频确实变了，但 cover 可能还没变
              const cover = await getCover()
              if (cover && cover != bus.cover) {
                return cover
              }
            },
          })
          setCover(bus.cover)
        } catch (e) {
          setCover(false)
          api.logger.error(e)
        }
      }

      const setCover = coverUrl => {
        if (coverUrl) {
          cover.title = gm.const.title
          cover.href = coverUrl
          cover.target = '_blank'
          cover.loaded = true
          _self.method.addDownloadEvent(cover)
          preview.src = coverUrl
        } else {
          cover.title = errorMsg
          cover.href = gm.url.noop
          cover.target = '_self'
          cover.loaded = false
          preview.src = ''
          cover.addEventListener('mousedown', function(e) {
            if (e.button == 0 || e.button == 1) {
              e.preventDefault()
              api.message.create(errorMsg)
            }
          })
        }
      }

      const getCover = async () => {
        let cover = null
        if (api.web.urlMatch(gm.regex.page_videoNormalMode)) {
          const meta = await api.wait.waitForElementLoaded({
            selector: 'meta[itemprop=image]',
            base: document.head,
            timeout: 2000,
            stopOnTimeout: true,
          })
          cover = meta.content
        } else {
          const aid = await _self.method.getAid()
          const resp = await api.web.request({
            method: 'GET',
            url: `https://api.bilibili.com/x/web-interface/view?aid=${aid}`,
          })
          cover = JSON.parse(resp.responseText).data.pic
        }
        return cover ?? ''
      }
    }

    addBangumiBtn(tm) {
      const _self = this
      const bus = {}
      const cover = document.createElement('a')
      const errorMsg = '获取失败，若非网络问题请提供反馈'
      cover.innerText = '获取封面'
      cover.className = `${gm.id}_cover_btn`
      cover.onclick = e => e.stopPropagation()
      tm.appendChild(cover)
      const preview = _self.method.createPreview(cover)

      const main = async function(e) {
        try {
          const url = await getCover()
          bus.cover = url
          bus.aid = await _self.method.getAid()
          setCover(url)
          window.addEventListener('urlchange', async function() {
            try {
              bus.aid = await api.wait.waitForConditionPassed({
                condition: async () => {
                  // 要等 aid 跟之前存的不一样，才能说明是切换成功后获取到的 aid
                  const aid = await _self.method.getAid()
                  if (aid && aid != bus.aid) {
                    return aid
                  }
                },
              })
              updateCover()
            } catch (e) {
              setCover(false)
              api.logger.error(e)
            }
          })
        } catch (e) {
          setCover(false)
          api.logger.error(e)
        }

        cover.removeEventListener('mousedown', main)
        if (gm.config.preview) {
          cover.removeEventListener('mouseover', main)
        }

        if (e) {
          e.preventDefault()
          if (e.type == 'mousedown') {
            if (e.button == 0) {
              if (gm.config.download || !cover.loaded) {
                cover.dispatchEvent(e) // 无法触发链接点击跳转
              } else {
                window.open(cover.href)
              }
            } else if (e.button == 1) {
              if (cover.loaded) {
                window.open(cover.href)
              }
            }
          } else if (e.type == 'mouseover') {
            cover.dispatchEvent(new Event('mouseenter'))
          }
        }
      }
      cover.addEventListener('mousedown', main)
      if (gm.config.preview) {
        cover.addEventListener('mouseover', main)
      }

      GM_addStyle(`
        .${gm.id}_cover_btn {
          float: right;
          cursor: pointer;
          font-size: 12px;
          margin-right: 16px;
          line-height: 36px;
          color: #505050;
        }
        .${gm.id}_cover_btn:hover {
          color: #00a1d6;
        }
      `)

      const updateCover = async () => {
        try {
          bus.cover = await api.wait.waitForConditionPassed({
            condition: async () => {
              // aid 变化只能说明视频确实变了，但 cover 可能还没变
              const cover = await getCover()
              if (cover && cover != bus.cover) {
                return cover
              }
            },
          })
          setCover(bus.cover)
        } catch (e) {
          // 在番剧中，切换 URL 后封面不变是正常的，说明切换后还是同一部番
        }
      }

      const setCover = coverUrl => {
        if (coverUrl) {
          cover.title = gm.const.title
          cover.href = coverUrl
          cover.target = '_blank'
          cover.loaded = true
          _self.method.addDownloadEvent(cover)
          preview.src = coverUrl
        } else {
          cover.title = errorMsg
          cover.href = gm.url.noop
          cover.target = '_self'
          cover.loaded = false
          preview.src = ''
          cover.addEventListener('mousedown', function(e) {
            if (e.button == 0 || e.button == 1) {
              e.preventDefault()
              api.message.create(errorMsg)
            }
          })
        }
      }

      const getCover = async () => {
        const img = await api.wait.waitForElementLoaded({
          selector: '.media-cover img',
          timeout: 2000,
          stopOnTimeout: true,
        })
        return img.src.replace(/@[^@]*$/, '') ?? '' // 不要缩略图
      }
    }

    addLiveBtn(urc) {
      const _self = this
      const info = unsafeWindow.__NEPTUNE_IS_MY_WAIFU__.roomInfoRes.data.room_info
      const coverUrl = info.cover
      const kfUrl = info.keyframe
      const cover = document.createElement('a')
      cover.innerText = '获取封面'
      if (coverUrl) {
        cover.title = gm.const.title
        cover.href = coverUrl
        cover.target = '_blank'
        cover.loaded = true
        _self.method.addDownloadEvent(cover)
        _self.method.createPreview(cover).src = coverUrl
      } else if (kfUrl) {
        cover.title = `直播间没有设置封面，或者因不明原因无法获取到封面，点击获取关键帧：\n${kfUrl}`
        cover.href = kfUrl
        cover.target = '_blank'
        cover.loaded = true
        _self.method.addDownloadEvent(cover)
        _self.method.createPreview(cover).src = kfUrl
      } else {
        const errorMsg = '获取失败，若非网络问题请提供反馈'
        cover.title = errorMsg
        cover.href = gm.url.noop
        cover.target = '_self'
        cover.loaded = false
        cover.addEventListener('mousedown', function(e) {
          if (e.button == 0 || e.button == 1) {
            api.message.create(errorMsg)
          }
        })
      }
      cover.className = `${gm.id}_cover_btn`
      urc.insertBefore(cover, urc.firstChild)

      GM_addStyle(`
        .${gm.id}_cover_btn {
          cursor: pointer;
          color: rgb(153, 153, 153);
        }
        .${gm.id}_cover_btn:hover {
          color: #23ade5;
        }
      `)
    }
  }

  (async function() {
    if (GM_info.scriptHandler != 'Tampermonkey') {
      api.dom.initUrlchangeEvent()
    }
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
  })()
})()
