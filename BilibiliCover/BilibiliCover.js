// ==UserScript==
// @name            B站封面获取
// @version         4.7.6.20210314
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
// @require         https://greasyfork.org/scripts/409641-api/code/API.js?version=849812
// @grant           GM_addStyle
// @grant           GM_download
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @incompatible    firefox 不支持 Greasemonkey！Tampermonkey、Violentmonkey 可用
// ==/UserScript==

(function() {
  'use strict'

  // 脚本兼容
  let incompatible = false
  let scriptHandler = '当前脚本管理器'
  if (!GM_info || !GM_info.script || !GM_info.scriptHandler) {
    incompatible = true
  }
  if (GM_info && GM_info.scriptHandler) {
    scriptHandler = GM_info.scriptHandler
    if (scriptHandler == 'Greasemonkey') {
      incompatible = true
    }
  }
  if (incompatible) {
    const label = GM_info && GM_info.script && GM_info.script.name ? `【${GM_info.script.name}】\n\n` : ''
    alert(`${label}脚本不支持${scriptHandler}！请改用Tampermonkey或Violentmonkey。`)
    return
  }

  const gm = {
    id: 'gm395575',
    title: '点击保存封面或在新标签页中打开图片（可在脚本菜单中设置）。\n此外，可在脚本菜单中开启或关闭封面预览功能。\n右键点击可基于图片链接作进一步的处理，如通过“另存为”直接保存图片。',
    enable: {
      preview: true,
      download: true,
    },
    fnName: {
      preview: '封面预览',
      download: '点击下载',
    }
  }
  /* global API */
  const api = new API({
    id: gm.id,
    label: GM_info.script.name,
  })

  const createMenu = name => {
    const afterSwitch = () => !gm.enable[name] ? '开启' : '关闭'
    let id = GM_registerMenuCommand(afterSwitch() + gm.fnName[name], menuCallback)

    function menuCallback() {
      gm.enable[name] = !gm.enable[name]
      GM_setValue(name, gm.enable[name])
      GM_unregisterMenuCommand(id)
      id = GM_registerMenuCommand(afterSwitch() + gm.fnName[name], menuCallback)
    }
  }
  for (const name in gm.enable) {
    const eb = GM_getValue(name)
    gm.enable[name] = typeof eb == 'boolean' ? eb : gm.enable[name]
    createMenu(name)
  }

  (async function() {
    try {
      if (api.web.urlMatch(/\/video\//)) {
        addVideoBtn(
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
      } else if (api.web.urlMatch(/\/bangumi\/play\//)) {
        addBangumiBtn(
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
      } else if (api.web.urlMatch(/live\.bilibili\.com\/\d/)) {
        addLiveBtn(
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
      } else if (api.web.urlMatch(/\/medialist\/play\/watchlater(?=\/|$)/)) {
        addWatchlaterVideoBtn(
          await api.wait.waitForConditionPassed({
            condition: () => {
              const app = document.querySelector('#app')
              const vueLoad = app && app.__vue__
              if (!vueLoad) {
                return false
              }
              return app.querySelector('#playContainer .left-container .play-options .play-options-more')
            },
          })
        )
      }
    } catch (e) {
      api.logger.error(e)
    }
  })()

  function addVideoBtn(atr) {
    const bus = {}
    const cover = document.createElement('a')
    const errorMsg = '获取失败，若非网络问题请提供反馈'
    cover.innerText = '获取封面'
    cover.target = '_blank'
    cover.className = 'appeal-text'
    cover.onclick = e => e.stopPropagation()
    const preview = createPreview(cover)

    // 确保与其他脚本配合时相关 UI 排列顺序不会乱
    const gm395456 = atr.querySelector('[id|=gm395456]')
    if (gm395456) {
      atr.insertBefore(cover, gm395456)
    } else {
      atr.appendChild(cover)
    }

    api.wait.waitForConditionPassed({
      condition: () => {
        const coverMeta = document.querySelector('head meta[itemprop=image]')
        return coverMeta && coverMeta.content
      },
      timeout: 2000,
    }).then(cover => {
      bus.cover = cover
      bus.aid = unsafeWindow.aid
      setCover(bus.cover)

      api.dom.createLocationchangeEvent()
      window.addEventListener('locationchange', function() {
        updateCover()
      })
    }).catch(e => {
      setCover(false)
      api.logger.error(e)
    })

    const updateCover = () => {
      api.wait.waitForConditionPassed({
        condition: () => {
          const coverMeta = document.querySelector('head meta[itemprop=image]')
          const cover = coverMeta && coverMeta.content
          if (cover && cover != bus.cover) {
            return cover
          }
        },
        timeout: 2000,
      }).then(cover => {
        if (bus.cover != cover) {
          bus.cover = cover
          setCover(cover)
        }
      }).catch(e => {
        const aid = unsafeWindow.aid
        if (bus.aid == aid) {
          // 若 aid 也没有变化，说明更新是无必要的，没有错误
          bus.aid = aid
        } else {
          setCover(false)
          api.logger.error(e)
        }
      })
    }

    const setCover = coverUrl => {
      if (coverUrl) {
        cover.href = coverUrl
        preview.src = coverUrl
        addDownloadEvent(cover)
        createPreview(cover).src = coverUrl
      } else {
        cover.href = 'javascript:void(0)'
        preview.src = ''
        cover.onclick = function(e) {
          e.preventDefault()
          alert(errorMsg)
        }
      }
      cover.title = gm.title || errorMsg
    }
  }

  function addBangumiBtn(tm) {
    const coverMeta = document.querySelector('head meta[property="og:image"]')
    const coverUrl = coverMeta && coverMeta.content
    const cover = document.createElement('a')
    const errorMsg = '获取失败，若非网络问题请提供反馈'
    cover.innerText = '获取封面'
    cover.target = '_blank'
    if (coverUrl) {
      cover.href = coverUrl
      addDownloadEvent(cover)
      createPreview(cover).src = coverUrl
    } else {
      cover.onclick = () => alert(errorMsg)
    }
    cover.title = gm.title || errorMsg
    cover.className = `${gm.id}_cover_btn`
    tm.appendChild(cover)

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
  }

  function addLiveBtn(urc) {
    const info = unsafeWindow.__NEPTUNE_IS_MY_WAIFU__.roomInfoRes.data.room_info
    const coverUrl = info.cover
    const kfUrl = info.keyframe
    const cover = document.createElement('a')
    cover.innerText = '获取封面'
    cover.target = '_blank'
    if (coverUrl) {
      cover.href = coverUrl
      cover.title = gm.title
      addDownloadEvent(cover)
      createPreview(cover).src = coverUrl
    } else if (kfUrl) {
      cover.href = kfUrl
      cover.title = `直播间没有设置封面，或者因不明原因无法获取到封面，点击获取关键帧：\n${kfUrl}`
      addDownloadEvent(cover)
      createPreview(cover).src = kfUrl
    } else {
      const errorMsg = '获取失败，若非网络问题请提供反馈'
      cover.onclick = () => alert(errorMsg)
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

  function addWatchlaterVideoBtn(pom) {
    const bus = {}
    const cover = document.createElement('a')
    const errorMsg = '获取失败，可能是因为该视频已经移除出稍后再看；也可能是网络原因，可刷新并尝试。如果还是不行请联系脚本作者……'
    cover.innerText = '获取封面'
    cover.target = '_blank'
    cover.className = `${gm.id}_cover_btn`
    cover.onclick = e => e.stopPropagation()
    const preview = createPreview(cover)

    // 确保与其他脚本配合时相关 UI 排列顺序不会乱
    let gmContainer = pom.querySelector('[id=gm-container]')
    if (!gmContainer) {
      gmContainer = pom.appendChild(document.createElement('span'))
      gmContainer.id = 'gm-container'
      gmContainer.style.float = 'left'
    }
    gmContainer.appendChild(cover)

    api.wait.waitForConditionPassed({
      condition: () => {
        const app = document.querySelector('#app')
        const vueLoad = app && app.__vue__
        if (!vueLoad) {
          return false
        }
        const playContainer = app.querySelector('#playContainer')
        if (playContainer.__vue__.playCover) {
          return playContainer
        }
      },
      timeout: 2000,
    }).then(playContainer => {
      bus.playContainer = playContainer
      bus.cover = playContainer.__vue__.playCover
      bus.playId = playContainer.__vue__.playId
      setCover(bus.cover)

      api.dom.createLocationchangeEvent()
      window.addEventListener('locationchange', function() {
        updateCover()
      })
    }).catch(e => {
      setCover(false)
      api.logger.error(e)
    })

    const updateCover = () => {
      api.wait.waitForConditionPassed({
        condition: () => {
          const cover = bus.playContainer.__vue__.playCover
          if (cover && cover != bus.cover) {
            return cover
          }
        },
        timeout: 2000,
      }).then(cover => {
        if (bus.cover != cover) {
          bus.cover = cover
          setCover(cover)
        }
      }).catch(e => {
        const playId = bus.playContainer.__vue__.playId
        if (bus.playId == playId) {
          // 若 playId 也没有变化，说明更新是无必要的，没有错误
          bus.playId = playId
        } else {
          setCover(false)
          api.logger.error(e)
        }
      })
    }

    const setCover = coverUrl => {
      if (coverUrl) {
        cover.href = coverUrl
        preview.src = coverUrl
        addDownloadEvent(cover)
      } else {
        cover.href = 'javascript:void(0)'
        preview.src = ''
        cover.onclick = function(e) {
          e.preventDefault()
          alert(errorMsg)
        }
      }
      cover.title = gm.title || errorMsg
    }

    GM_addStyle(`
      .${gm.id}_cover_btn {
        cursor: pointer;
        float: right;
        margin-right: 1em;
        font-size: 12px;
        color: #757575;
      }
      .${gm.id}_cover_btn:hover {
        color: #23ade5;
      }
    `)
  }

  /**
   * 下载图片
   * @param {HTMLElement} target 图片按钮元素
   */
  function addDownloadEvent(target) {
    target.onclick = function(e) {
      if (gm.enable.download) {
        e.preventDefault()
        target.dispatchEvent(new Event('mouseleave'))
        target.disablePreview = true
        GM_download(this.href, document.title || 'Cover')
      }
    }
  }

  /**
   * 创建预览元素
   * @param {HTMLElement} target 触发元素
   * @returns {HTMLImageElement}
   */
  function createPreview(target) {
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
      if (gm.enable.preview) {
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
      if (gm.enable.preview) {
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
        if (gm.enable.download) {
          GM_download(this.src, document.title)
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
  }
})()
