// ==UserScript==
// @id              BilibiliCover@Laster2800
// @name            B站封面获取
// @version         4.5.1.20200730
// @namespace       laster2800
// @author          Laster2800
// @description     B站视频播放页（普通模式、稍后再看模式）、番剧播放页、直播间添加获取封面的按钮
// @icon            https://www.bilibili.com/favicon.ico
// @include         *://www.bilibili.com/video/*
// @include         *://www.bilibili.com/bangumi/play/*
// @include         *://www.bilibili.com/medialist/play/watchlater
// @include         *://www.bilibili.com/medialist/play/watchlater/*
// @include         *://live.bilibili.com/*
// @exclude         *://live.bilibili.com/
// @exclude         *://live.bilibili.com/*/*
// @grant           GM_addStyle
// @grant           GM_download
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// ==/UserScript==

(function() {
  var gm = {
    id: 'gm395575',
    title: '点击保存封面或在新标签页中打开图片（可在脚本菜单中设置）。\n此外，可在脚本菜单中开启或关闭封面预览功能。\n右键点击可基于图片链接作进一步的处理，如通过“另存为”直接保存图片。',
    enable: {
      preview: true,
      download: true,
    },
    fnName: {
      preview: '封面预览',
      download:'点击下载',
    }
  }

  var createMenu = name => {
    var afterSwitch = () => !gm.enable[name] ? '开启' : '关闭'
    var id = GM_registerMenuCommand(afterSwitch() + gm.fnName[name], menuCallback)

    function menuCallback() {
      gm.enable[name] = !gm.enable[name]
      GM_setValue(name, gm.enable[name])
      GM_unregisterMenuCommand(id)
      id = GM_registerMenuCommand(afterSwitch() + gm.fnName[name], menuCallback)
    }
  }
  for (var name in gm.enable) {
    var eb = GM_getValue(name)
    gm.enable[name] = typeof eb == 'boolean' ? eb : gm.enable[name]
    createMenu(name)
  }

  if (/\/video\//.test(location.href)) {
    executeAfterConditionPassed({
      condition: () => {
        var app = document.querySelector('#app')
        var vueLoad = app && app.__vue__
        if (!vueLoad) {
          return false
        }
        return document.querySelector('#arc_toolbar_report')
      },
      callback: addVideoBtn,
    })
  } else if (/\/bangumi\/play\//.test(location.href)) {
    executeAfterConditionPassed({
      condition: () => {
        var app = document.querySelector('#app')
        var vueLoad = app && app.__vue__
        if (!vueLoad) {
          return false
        }
        return document.querySelector('#toolbar_module')
      },
      callback: addBangumiBtn,
    })
  } else if (/live\.bilibili\.com\/\d/.test(location.href)) {
    executeAfterConditionPassed({
      condition: () => {
        var hiVm = document.querySelector('#head-info-vm')
        var vueLoad = hiVm && hiVm.__vue__
        if (!vueLoad) {
          return false
        }
        return hiVm.querySelector('.room-info-upper-row .upper-right-ctnr')
      },
      callback: addLiveBtn,
    })
  } else if (/\/medialist\/play\/watchlater(?=\/|$)/.test(location.href)) {
    executeAfterConditionPassed({
      condition: () => {
        var app = document.querySelector('#app')
        var vueLoad = app && app.__vue__
        if (!vueLoad) {
          return false
        }
        return app.querySelector('#playContainer .left-container .play-options .play-options-more')
      },
      callback: addWatchlaterVideoBtn,
    })
  }

  function addVideoBtn(atr) {
    var coverMeta = document.querySelector('head meta[itemprop=image]')
    var coverUrl = coverMeta && coverMeta.content
    var cover = document.createElement('a')
    var errorMsg = '获取失败，若非网络问题请提供反馈'
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
    cover.className = 'appeal-text'
    atr.appendChild(cover)
  }

  function addBangumiBtn(tm) {
    var coverMeta = document.querySelector('head meta[property="og:image"]')
    var coverUrl = coverMeta && coverMeta.content
    var cover = document.createElement('a')
    var errorMsg = '获取失败，若非网络问题请提供反馈'
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
    try {
      var data = unsafeWindow.__NEPTUNE_IS_MY_WAIFU__.baseInfoRes.data
      var coverUrl = data.user_cover
      var kfUrl = data.keyframe
    } catch (e) {
      console.error(e)
    }
    var cover = document.createElement('a')
    cover.innerText = '获取封面'
    cover.target = '_blank'
    if (coverUrl) {
      cover.href = coverUrl
      cover.title = gm.title
      addDownloadEvent(cover)
      createPreview(cover).src = coverUrl
    } else if (kfUrl) {
      cover.href = kfUrl
      cover.title = '直播间没有设置封面，或者因不明原因无法获取到封面，点击获取关键帧：\n' + kfUrl
      addDownloadEvent(cover)
      createPreview(cover).src = kfUrl
    } else {
      var errorMsg = '获取失败，若非网络问题请提供反馈'
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
    var bus = {}
    var cover = document.createElement('a')
    var errorMsg = '获取失败，可能是因为该视频已经移除出稍后再看；也可能是网络原因，可刷新并尝试。如果还是不行请联系脚本作者……'
    cover.innerText = '获取封面'
    cover.target = '_blank'
    cover.className = `${gm.id}_cover_btn`
    cover.onclick = e => e.stopPropagation()
    pom.appendChild(cover)
    var preview = createPreview(cover)

    executeAfterConditionPassed({
      condition: () => {
        var app = document.querySelector('#app')
        var vueLoad = app && app.__vue__
        if (!vueLoad) {
          return false
        }
        var playContainer = app.querySelector('#playContainer')
        if (playContainer.__vue__.playCover) {
          return playContainer
        }
      },
      callback: playContainer => {
        bus.playContainer = playContainer
        bus.cover = playContainer.__vue__.playCover
        setCover(bus.cover)

        createLocationchangeEvent()
        window.addEventListener('locationchange', function() {
          updateCoverUrl()
        })
      },
      timeout: 2000,
      onTimeout: () => setCover(false)
    })

    var updateCoverUrl = () => {
      executeAfterConditionPassed({
        condition: () => {
          var cover = bus.playContainer.__vue__.playCover
          if (cover && cover != bus.cover) {
            return cover
          }
        },
        callback: cover => {
          bus.cover = cover
          setCover(cover)
        },
        timeout: 2000,
        onTimeout: () => setCover(false)
      })
    }

    var setCover = coverUrl => {
      if (coverUrl) {
        cover.href = coverUrl
        preview.src = coverUrl
        addDownloadEvent(cover)
      } else {
        cover.href = ''
        preview.src = ''
        cover.onclick = () => alert(errorMsg)
      }
      cover.title = gm.title || errorMsg
    }

    var createLocationchangeEvent = () => {
      // 创建 locationchange 事件
      // https://stackoverflow.com/a/52809105
      if (!unsafeWindow._createLocationchangeEvent) {
        history.pushState = (f => function pushState() {
          var ret = f.apply(this, arguments)
          window.dispatchEvent(new Event('pushstate'))
          window.dispatchEvent(new Event('locationchange'))
          return ret
        })(history.pushState)
        history.replaceState = (f => function replaceState() {
          var ret = f.apply(this, arguments)
          window.dispatchEvent(new Event('replacestate'))
          window.dispatchEvent(new Event('locationchange'))
          return ret
        })(history.replaceState)
        window.addEventListener('popstate', () => {
          window.dispatchEvent(new Event('locationchange'))
        })
        unsafeWindow._createLocationchangeEvent = true
      }
    }

    GM_addStyle(`
  .${gm.id}_cover_btn {
      cursor: pointer;
      float: left;
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
    var preview = document.body.appendChild(document.createElement('img'))
    preview.className = `${gm.id}_preview`
    preview.title = gm.title

    var fadeTime = 200
    var browserSyncTime = 10
    var antiConflictTime = 20

    var fadeIn = () => {
      preview.style.display = 'unset'
      setTimeout(() => {
        preview.style.opacity = '1'
      }, browserSyncTime)
    }
    var fadeOut = callback => {
      preview.style.opacity = '0'
      setTimeout(() => {
        preview.style.display = 'none'
        callback && callback()
      }, fadeTime)
    }
    var disablePreviewTemp = () => {
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

    var startPos // 鼠标进入预览时的初始坐标
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
        var dSquare = Math.pow(startPos.x - e.clientX, 2) + Math.pow(startPos.y - e.clientY, 2)
        if (dSquare > Math.pow(20, 2)) {
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

  /**
   * 在条件满足后执行操作
   *
   * 当条件满足后，如果不存在终止条件，那么直接执行 `callback(result)`。
   *
   * 当条件满足后，如果存在终止条件，且 `stopTimeout` 大于 0，则还会在接下来的 `stopTimeout` 时间内判断是否满足终止条件，称为终止条件的二次判断。
   * 如果在此期间，终止条件通过，则表示依然不满足条件，故执行 `stopCallback()` 而非 `callback(result)`。
   * 如果在此期间，终止条件一直失败，则顺利通过检测，执行 `callback(result)`。
   *
   * @param {Object} options 选项
   * @param {() => *} options.condition 条件，当 `condition()` 返回的 `result` 为真值时满足条件
   * @param {(result) => void} [options.callback] 当满足条件时执行 `callback(result)`
   * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
   * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
   * @param {() => void} [options.onTimeout] 检测超时时执行 `onTimeout()`
   * @param {() => *} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
   * @param {() => void} [options.stopCallback] 终止条件达成时执行 `stopCallback()`（包括终止条件的二次判断达成）
   * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
   * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
   * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
   */
  function executeAfterConditionPassed(options) {
    var defaultOptions = {
      callback: result => console.log(result),
      interval: 100,
      timeout: 5000,
      onTimeout: null,
      stopCondition: null,
      stopCallback: null,
      stopInterval: 50,
      stopTimeout: 0,
      timePadding: 0,
    }
    options = {
      ...defaultOptions,
      ...options
    }

    var tid
    var cnt = 0
    var maxCnt = (options.timeout - options.timePadding) / options.interval
    var task = () => {
      var result = options.condition()
      var stopResult = options.stopCondition && options.stopCondition()
      if (stopResult) {
        clearInterval(tid)
        options.stopCallback && options.stopCallback()
      } else if (++cnt > maxCnt) {
        clearInterval(tid)
        options.onTimeout && options.onTimeout()
      } else if (result) {
        clearInterval(tid)
        if (options.stopCondition && options.stopTimeout > 0) {
          executeAfterConditionPassed({
            condition: options.stopCondition,
            callback: options.stopCallback,
            interval: options.stopInterval,
            timeout: options.stopTimeout,
            onTimeout: () => options.callback(result)
          })
        } else {
          options.callback(result)
        }
      }
    }
    setTimeout(() => {
      tid = setInterval(task, options.interval)
      task()
    }, options.timePadding)
  }
})()
