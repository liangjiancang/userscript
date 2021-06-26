// ==UserScript==
// @name            B站封面获取
// @version         4.9.3.20210626
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
// @exclude         *://live.bilibili.com/*/*
// @exclude         /.*:\/\/.*:\/\/.*/
// @require         https://greasyfork.org/scripts/409641-api/code/API.js?version=944165
// @grant           GM_addStyle
// @grant           GM_download
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_xmlhttpRequest
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @grant           GM_notification
// @connect         api.bilibili.com
// @incompatible    firefox 不支持 Greasemonkey！Tampermonkey、Violentmonkey 可用
// ==/UserScript==

(function() {
  'use strict'

  const gm = {
    id: 'gm395575',
    title: '点击保存封面或在新标签页中打开图片（可在脚本菜单中设置）。\n此外，可在脚本菜单中开启或关闭封面预览功能。\n右键点击可基于图片链接作进一步的处理，如通过「另存为」直接保存图片。',
    config: {
      preview: true,
      download: true,
    },
    configMap: {
      preview: { name: '封面预览', needNotReload: true },
      download: { name: '点击下载', needNotReload: true },
    },
    regex: {
      page_videoNormalMode: /\.com\/video(?=[/?#]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater(?=[/?#]|$)/,
      page_bangumi: /\/bangumi\/play(?=[/?#]|$)/,
      page_live: /live\.bilibili\.com\/\d+(?=[/?#]|$)/, // 只含具体的直播间页面
    },
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
         * 下载封面
         * @param {string} url 封面 URL
         * @param {string} [name='Cover'] 保存文件名
         */
        download(url, name) {
          name = name || 'Cover'
          const onerror = function(error) {
            if (error && error.error == 'not_whitelisted') {
              alert('该封面的文件格式不在下载模式白名单中，从而触发安全限制导致无法直接下载。可修改脚本管理器的「下载模式」或「文件扩展名白名单」设置以放开限制。')
              window.open(url)
            } else {
              alert('下载错误')
            }
          }
          const ontimeout = function() {
            alert('下载超时')
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
          let aid
          try {
            if (unsafeWindow.aid) {
              aid = unsafeWindow.aid
            } else {
              aid = await api.wait.waitForConditionPassed({
                condition: () => {
                  const player = unsafeWindow.player
                  const message = player && player.getVideoMessage && player.getVideoMessage()
                  return message && message.aid
                },
              })
            }
          } catch (e) {
            api.logger.error(e)
          }
          return String(aid || '')
        },

        /**
         * 下载图片
         * @param {HTMLElement} target 图片按钮元素
         */
        addDownloadEvent(target) {
          const _self = this
          target.onclick = function(e) {
            if (gm.config.download) {
              e.preventDefault()
              target.dispatchEvent(new Event('mouseleave'))
              target.disablePreview = true
              _self.download(this.href, document.title)
            }
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
              callback && callback()
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

          target.addEventListener('mouseenter', function() {
            if (gm.config.preview) {
              this.mouseOver = true
              if (this.disablePreview) {
                return
              }
              setTimeout(() => {
                preview.src && fadeIn()
              }, antiConflictTime)
            }
          })
          target.addEventListener('mouseleave', function() {
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
          })

          let startPos // 鼠标进入预览时的初始坐标
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
          preview.onclick = function() {
            if (this.src) {
              if (gm.config.download) {
                _self.download(this.src, document.title)
              } else {
                window.open(this.src)
              }
              fadeOut(disablePreviewTemp)
            }
          }
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
      cover.target = '_blank'
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

      setTimeout(async () => {
        try {
          const cover = await getCover()
          bus.cover = cover
          bus.aid = await _self.method.getAid()
          bus.pathname = location.pathname
          setCover(cover)

          api.dom.createLocationchangeEvent()
          window.addEventListener('locationchange', async function() {
            if (location.pathname == bus.pathname) { // 并非切换视频（如切分 P）
              return
            }
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
      })

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
          cover.href = coverUrl
          preview.src = coverUrl
          _self.method.addDownloadEvent(cover)
          preview.src = coverUrl
        } else {
          cover.href = 'javascript:void(0)'
          preview.src = ''
          cover.onclick = function(e) {
            e.preventDefault()
            api.message.create(errorMsg)
          }
        }
        cover.title = gm.title || errorMsg
      }

      const getCover = async () => {
        let cover = ''
        if (api.web.urlMatch(/\/video\//)) {
          cover = await api.wait.waitForConditionPassed({
            condition: () => {
              const coverMeta = document.querySelector('head meta[itemprop=image]')
              return coverMeta && coverMeta.content
            },
            timeout: 2000,
          })
        } else {
          const aid = await _self.method.getAid()
          const resp = await api.web.request({
            method: 'GET',
            url: `https://api.bilibili.com/x/web-interface/view?aid=${aid}`,
          })
          cover = JSON.parse(resp.responseText).data.pic
        }
        return cover
      }
    }

    addBangumiBtn(tm) {
      const _self = this
      const bus = {}
      const cover = document.createElement('a')
      const errorMsg = '获取失败，若非网络问题请提供反馈'
      cover.innerText = '获取封面'
      cover.target = '_blank'
      cover.className = `${gm.id}_cover_btn`
      cover.onclick = e => e.stopPropagation()
      tm.appendChild(cover)
      const preview = _self.method.createPreview(cover)

      setTimeout(async () => {
        try {
          const cover = await getCover()
          bus.cover = cover
          bus.aid = await _self.method.getAid()
          setCover(cover)

          api.dom.createLocationchangeEvent()
          window.addEventListener('locationchange', async function() {
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
      })

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
            timeout: 2500,
          })
          setCover(bus.cover)
        } catch (e) {
          // 在番剧中，切换 URL 后封面不变是正常的，说明切换后还是同一部番
        }
      }

      const setCover = coverUrl => {
        if (coverUrl) {
          cover.href = coverUrl
          preview.src = coverUrl
          _self.method.addDownloadEvent(cover)
          preview.src = coverUrl
        } else {
          cover.href = 'javascript:void(0)'
          preview.src = ''
          cover.onclick = function(e) {
            e.preventDefault()
            api.message.create(errorMsg)
          }
        }
        cover.title = gm.title || errorMsg
      }

      const getCover = async () => {
        let cover = ''
        const img = await api.wait.waitForElementLoaded('.media-cover img')
        if (img && img.src) {
          cover = img.src.replace(/@[^@]*$/, '') // 不要缩略图
        }
        return cover
      }
    }

    addLiveBtn(urc) {
      const _self = this
      const info = unsafeWindow.__NEPTUNE_IS_MY_WAIFU__.roomInfoRes.data.room_info
      const coverUrl = info.cover
      const kfUrl = info.keyframe
      const cover = document.createElement('a')
      cover.innerText = '获取封面'
      cover.target = '_blank'
      if (coverUrl) {
        cover.href = coverUrl
        cover.title = gm.title
        _self.method.addDownloadEvent(cover)
        _self.method.createPreview(cover).src = coverUrl
      } else if (kfUrl) {
        cover.href = kfUrl
        cover.title = `直播间没有设置封面，或者因不明原因无法获取到封面，点击获取关键帧：\n${kfUrl}`
        _self.method.addDownloadEvent(cover)
        _self.method.createPreview(cover).src = kfUrl
      } else {
        const errorMsg = '获取失败，若非网络问题请提供反馈'
        cover.onclick = () => api.message.create(errorMsg)
        cover.title = errorMsg
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
    const script = new Script()
    const webpage = new Webpage()

    script.init()
    script.initScriptMenu()

    try {
      if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
        webpage.addVideoBtn(
          await api.wait.waitForConditionPassed({
            condition: () => {
              const app = document.querySelector('#app')
              const vueLoad = app && app.__vue__
              if (!vueLoad) {
                return false
              }
              return document.querySelector('#arc_toolbar_report')
            },
          })
        )
      } else if (api.web.urlMatch(gm.regex.page_bangumi)) {
        webpage.addBangumiBtn(
          await api.wait.waitForConditionPassed({
            condition: () => {
              const app = document.querySelector('#app')
              const vueLoad = app && app.__vue__
              if (!vueLoad) {
                return false
              }
              return document.querySelector('#toolbar_module')
            },
          })
        )
      } else if (api.web.urlMatch(gm.regex.page_live)) {
        webpage.addLiveBtn(
          await api.wait.waitForConditionPassed({
            condition: () => {
              const hiVm = document.querySelector('#head-info-vm')
              const vueLoad = hiVm && hiVm.__vue__
              if (!vueLoad) {
                return false
              }
              return hiVm.querySelector('.room-info-upper-row .upper-right-ctnr')
            },
          })
        )
      }
    } catch (e) {
      api.logger.error(e)
    }
  })()
})()
