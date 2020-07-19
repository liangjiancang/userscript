// ==UserScript==
// @id             BilibiliCover@Laster2800
// @name           B站封面获取
// @version        4.1.3.20200719
// @namespace      laster2800
// @author         Laster2800
// @description    B站视频播放页（普通模式、稍后再看模式）、番剧播放页、直播间添加获取封面的按钮
// @include        *://www.bilibili.com/video/*
// @include        *://www.bilibili.com/bangumi/play/*
// @include        *://live.bilibili.com/*
// @include        *://www.bilibili.com/medialist/play/watchlater/*
// @exclude        *://live.bilibili.com/
// @exclude        *://live.bilibili.com/p/html/live-web-mng/*
// @grant          GM_xmlhttpRequest
// @connect        api.bilibili.com
// @grant          GM_addStyle
// ==/UserScript==

(function() {
  if (/\/video\//.test(location.href)) {
    executeAfterConditionPass({
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
    executeAfterConditionPass({
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
    executeAfterConditionPass({
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
    executeAfterConditionPass({
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
})()

function addVideoBtn(atr) {
  var coverMeta = document.querySelector('head meta[itemprop=image]')
  var coverUrl = coverMeta && coverMeta.content
  var cover = document.createElement('a')
  var errorMsg = '获取失败，若非网络问题请提供反馈'
  cover.innerText = '获取封面'
  cover.target = '_blank'
  if (coverUrl) {
    cover.href = coverUrl
  } else {
    cover.onclick = () => alert(errorMsg)
  }
  cover.title = coverUrl || errorMsg
  cover.className = 'appeal-text'
  atr.appendChild(cover)
}

function addBangumiBtn(tm) {
  GM_addStyle(`
.cover_btn {
    float: right;
    cursor: pointer;
    font-size: 12px;
    margin-right: 16px;
    line-height: 36px;
    color: #505050;
}
.cover_btn:hover {
    color: #00a1d6;
}
    `)
  var coverMeta = document.querySelector('head meta[property="og:image"]')
  var coverUrl = coverMeta && coverMeta.content
  var cover = document.createElement('a')
  var errorMsg = '获取失败，若非网络问题请提供反馈'
  cover.innerText = '获取封面'
  cover.target = '_blank'
  if (coverUrl) {
    cover.href = coverUrl
  } else {
    cover.onclick = () => alert(errorMsg)
  }
  cover.title = coverUrl || errorMsg
  cover.className = 'cover_btn'
  tm.appendChild(cover)
}

function addLiveBtn(urc) {
  GM_addStyle(`
.cover_btn {
    cursor: pointer;
    color: rgb(153, 153, 153);
}
.cover_btn:hover {
    color: #23ade5;
}
  `)

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
    cover.title = coverUrl
  } else if (kfUrl) {
    cover.href = kfUrl
    cover.title = '直播间没有设置封面，或者因不明原因无法获取到封面，点击获取关键帧：\n' + kfUrl
  } else {
    var errorMsg = '获取失败，若非网络问题请提供反馈'
    cover.onclick = () => alert(errorMsg)
    cover.title = errorMsg
  }
  cover.className = 'cover_btn'
  urc.insertBefore(cover, urc.firstChild)
}

function addWatchlaterVideoBtn(pom) {
  GM_addStyle(`
.cover_btn {
    cursor: pointer;
    float: left;
    margin-right: 1em;
    font-size: 12px;
    color: #757575;
}
.cover_btn:hover {
    color: #23ade5;
}
  `)

  var cover = document.createElement('a')
  var errorMsg = '获取失败，可能是因为该视频已经移除出稍后再看；若非该原因或网络问题，请提供反馈'
  cover.innerText = '获取封面'
  cover.target = '_blank'
  cover.className = 'cover_btn'
  cover.onclick = e => e.stopPropagation()
  pom.appendChild(cover)

  var updateCoverUrl = () => {
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp',
      onload: function(response) {
        if (response && response.responseText) {
          try {
            executeAfterConditionPass({
              condition: () => {
                try {
                  var url = document.querySelector('.play-title-location').href
                  var m = url.match(/(?<=\/)BV[a-zA-Z\d]+(?=\/|$)/)
                  if (m && m[0]) {
                    return m[0]
                  }
                } catch (e) {
                  // ignore
                }
              },
              callback: bvid => {
                var json = JSON.parse(response.responseText)
                var watchlaterList = json.data.list

                var coverUrl = null
                for (var e of watchlaterList) {
                  if (bvid == e.bvid) {
                    coverUrl = e.pic
                    break
                  }
                }

                if (coverUrl) {
                  cover.href = coverUrl
                } else {
                  cover.onclick = () => alert(errorMsg)
                }
                cover.title = coverUrl || errorMsg
              }
            })
          } catch (e) {
            console.error(e)
          }
        }
      }
    })
  }

  updateCoverUrl()

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

  window.addEventListener('locationchange', function() {
    updateCoverUrl()
  })
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
 * @param {Function} options.condition 条件，当 `condition()` 返回的 `result` 为真值时满足条件
 * @param {Function} options.callback 当满足条件时执行 `callback(result)`
 * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
 * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
 * @param {Function} [options.onTimeout] 检测超时时执行 `onTimeout()`
 * @param {Function} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
 * @param {Function} [options.stopCallback] 终止条件达成时执行 `stopCallback()`（包括终止条件的二次判断达成）
 * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
 * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
 * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
 */
function executeAfterConditionPass(options) {
  var defaultOptions = {
    condition: () => true,
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
  var o = {
    ...defaultOptions,
    ...options
  }
  if (!(o.callback instanceof Function)) {
    return
  }

  var tid
  var cnt = 0
  var maxCnt = (o.timeout - o.timePadding) / o.interval
  var task = () => {
    var result = o.condition()
    var stopResult = o.stopCondition && o.stopCondition()
    if (stopResult) {
      clearInterval(tid)
      o.stopCallback instanceof Function && o.stopCallback()
    } else if (++cnt > maxCnt) {
      clearInterval(tid)
      o.onTimeout instanceof Function && o.onTimeout()
    } else if (result) {
      clearInterval(tid)
      if (o.stopCondition && o.stopTimeout > 0) {
        executeAfterConditionPass({
          condition: o.stopCondition,
          callback: o.stopCallback,
          interval: o.stopInterval,
          timeout: o.stopTimeout,
          onTimeout: () => o.callback(result)
        })
      } else {
        o.callback(result)
      }
    }
  }
  setTimeout(() => {
    tid = setInterval(task, o.interval)
    task()
  }, o.timePadding)
}
