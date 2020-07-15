// ==UserScript==
// @id             BilibiliWatchlaterPlus@Laster2800
// @name           B站稍后再看功能增强
// @version        2.3.2.20200715
// @namespace      laster2800
// @author         Laster2800
// @description    B站稍后再看功能增强，目前功能包括UI增强、重定向至常规播放页、稍后再看移除记录等，支持功能设置
// @homepage       https://greasyfork.org/zh-CN/scripts/395456
// @supportURL     https://greasyfork.org/zh-CN/scripts/395456/feedback
// @include        *://www.bilibili.com/*
// @include        *://message.bilibili.com/*
// @include        *://search.bilibili.com/*
// @include        *://space.bilibili.com/*
// @include        *://t.bilibili.com/*
// @include        *://account.bilibili.com/*
// @exclude        *://message.bilibili.com/pages/*
// @grant          GM_addStyle
// @grant          GM_xmlhttpRequest
// @grant          GM_registerMenuCommand
// @grant          GM_setValue
// @grant          GM_getValue
// @connect        api.bilibili.com
// @run-at         document-start
// ==/UserScript==

(function() {
  // 顶栏入口的默认行为
  var defaultHeaderButtonOperation = 'op_openListInNew'
  // 移除历史的默认保存次数
  var defaultRemoveHistorySaves = 8
  // 移除历史保存次数的下限和上限
  var rhsMin = 1
  var rhsMax = 64

  // 用户配置读取
  var init = GM_getValue('gm395456')
  var configUpdate = 20200715
  // 默认值
  var headerButton = true
  var headerButtonOperation = defaultHeaderButtonOperation
  var videoButton = true
  var redirect = false
  var openInNew = false
  var removeHistory = true
  var removeHistorySaves = defaultRemoveHistorySaves
  var removeHistoryData = null
  var reloadAfterSetting = true
  if (init >= configUpdate) {
    // 一般情况下，读取用户配置；如果配置出错，则沿用默认值
    headerButton = validate(GM_getValue('gm395456_headerButton'), 'boolean', headerButton)
    headerButtonOperation = validate(GM_getValue('gm395456_headerButtonOperation'), 'string', headerButtonOperation)
    videoButton = validate(GM_getValue('gm395456_videoButton'), 'boolean', videoButton)
    redirect = validate(GM_getValue('gm395456_redirect'), 'boolean', redirect)
    openInNew = validate(GM_getValue('gm395456_openInNew'), 'boolean', openInNew)
    removeHistory = validate(GM_getValue('gm395456_removeHistory'), 'boolean', removeHistory)
    removeHistorySaves = validate(GM_getValue('gm395456_removeHistorySaves'), 'number', removeHistorySaves)
    removeHistoryData = validate(GM_getValue('gm395456_removeHistoryData'), 'object', null)
    if (!removeHistoryData) {
      removeHistoryData = new PushQueue(defaultRemoveHistorySaves, rhsMax)
    } else {
      Object.setPrototypeOf(removeHistoryData, PushQueue.prototype) // 还原类型信息
    }
    reloadAfterSetting = validate(GM_getValue('gm395456_reloadAfterSetting'), 'boolean', reloadAfterSetting)
  } else {
    // 初始化
    init = false
    removeHistoryData = new PushQueue(defaultRemoveHistorySaves, rhsMax)
    GM_setValue('gm395456_headerButton', headerButton)
    GM_setValue('gm395456_headerButtonOperation', headerButtonOperation)
    GM_setValue('gm395456_videoButton', videoButton)
    GM_setValue('gm395456_redirect', redirect)
    GM_setValue('gm395456_openInNew', openInNew)
    GM_setValue('gm395456_removeHistory', removeHistory)
    GM_setValue('gm395456_removeHistorySaves', removeHistorySaves)
    GM_setValue('gm395456_removeHistoryData', removeHistoryData)
    GM_setValue('gm395456_reloadAfterSetting', reloadAfterSetting)
  }

  // 重定向，document-start 就执行，尽可能快地将原页面掩盖过去
  if (redirect && /bilibili.com\/medialist\/play\/watchlater\//.test(location.href)) {
    window.stop() // 停止原页面的加载
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp`,
      onload: function(response) {
        if (response && response.responseText) {
          try {
            var part = parseInt(location.href.match(/(?<=\/watchlater\/p)\d+(?=\/?)/)[0])
            var json = JSON.parse(response.responseText)
            var watchList = json.data.list
            location.replace('https://www.bilibili.com/video/' + watchList[part - 1].bvid)
          } catch (e) {
            var errorInfo = `重定向错误，重置脚本数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`
            console.error(errorInfo)
            console.error(e)

            var rc = confirm(errorInfo + '\n是否暂时关闭重定向功能？')
            if (rc) {
              redirect = false
              GM_setValue('gm395456_redirect', redirect)
            }
            location.reload()
          }
        }
      }
    })
  }

  // 脚本的其他部分推迟至 DOMContentLoaded 执行
  document.addEventListener('DOMContentLoaded', () => {
    var fadeTime = 400
    var textFadeTime = 100
    GM_addStyle(`
#gm395456 .gm_setting {
    font-size: 12px;
    transition: opacity ${fadeTime}ms ease-in-out;
    opacity: 0;
    display: none;
    position: fixed;
    z-index: 10000;
}
#gm395456 .gm_setting .gm_setting_page {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #ffffff;
    border-radius: 10px;
    z-index: 65535;
    min-width: 36em;
}
#gm395456 .gm_setting #gm_maintitle {
    cursor: pointer;
}
#gm395456 .gm_setting #gm_maintitle:hover {
    color: #0075FF;
}
#gm395456 .gm_setting .gm_items {
    margin: 0 2.2em;
    font-size: 1.2em;
}
#gm395456 .gm_setting .gm_item {
    display: block;
    padding: 0.4em;

}
#gm395456 .gm_setting .gm_subitem {
    display: block;
    margin-left: 6em;
    margin-top: 0.3em;
}
#gm395456 .gm_setting .gm_item:hover {
    color: #0075FF;
}
#gm395456 .gm_setting .gm_subitem[disabled] {
    color: gray;
}
#gm395456 .gm_setting .gm_subitem:hover:not([disabled]) {
    color: #0075FF;
}
#gm395456 .gm_setting input[type=checkbox] {
    vertical-align: middle;
    margin: 3px 0 0 10px;
    float: right;
}
#gm395456 .gm_setting input[type=text] {
    float: right;
    border-width: 0 0 1px 0;
    width: 2em;
    text-align: right;
    padding: 0 0.2em;
}
#gm395456 .gm_setting select {
    border-width: 0 0 1px 0;
    cursor: pointer;
}
#gm395456 .gm_setting .gm_bottom {
    margin: 0.8em 2em 1.8em 2em;
    text-align: center;
}
#gm395456 .gm_setting .gm_bottom button {
    font-size: 1em;
    padding: 0.2em 0.8em;
    margin: 0 0.6em;
    cursor: pointer;
}

#gm395456 .gm_history {
    transition: opacity ${fadeTime}ms ease-in-out;
    opacity: 0;
    display: none;
    position: fixed;
    z-index: 10000;
}
#gm395456 .gm_history .gm_history_page {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #ffffff;
    border-radius: 10px;
    z-index: 65535;
    height: 75%;
    width: 60%;
}
#gm395456 .gm_history .gm_comment {
    margin: 0 2em;
    color: gray;
    text-indent: 2em;
}
#gm395456 .gm_history .gm_comment span,
#gm395456 .gm_history .gm_comment input {
    padding: 0 0.2em;
    font-weight: bold;
    color: #666666;
}
#gm395456 .gm_history .gm_comment input{
    text-align: center;
    width: 3em;
    border-width: 0 0 1px 0;
}
#gm395456 .gm_history .gm_content {
    margin: 1.6em 2em 2em 2em;
    font-size: 1.2em;
    text-align: center;
    line-height: 1.6em;
    overflow-y: auto;
    position: absolute;
    top: 8em;
    bottom: 0;
    left: 0;
    right: 0;
    opacity: 0;
    transition: opacity ${textFadeTime}ms ease-in-out;
}
#gm395456 .gm_history .gm_content::-webkit-scrollbar {
    display: none;
}

#gm395456 #gm_reset {
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 0.6em 0.8em;
    color: #b4b4b4;
    cursor: pointer;
}
#gm395456 #gm_reset:hover {
    color: #666666;
}

#gm395456 .gm_title {
    font-size: 1.6em;
    margin: 1.6em 0.8em 0.8em 0.8em;
    text-align: center;
}

#gm395456 .gm_subtitle {
  font-size: 0.4em;
  margin-top: 0.4em;
}

#gm395456 .gm_shadow {
    background: #000000b0;
    position: fixed;
    top: 0%;
    left: 0%;
    z-index: 10000;
    width: 100%;
    height: 100%;
}

#gm395456 label {
    cursor: pointer;
}

#gm395456 [disabled],
#gm395456 [disabled] input {
  cursor: not-allowed;
}
        `)

    var el_gm395456 = document.body.appendChild(document.createElement('div'))
    el_gm395456.id = 'gm395456'
    var el_setting = null
    var el_history = null
    var menus = {
      // key: { state, el, openHandler, closeHandler }
      setting: {
        state: false
      },
      history: {
        state: false
      },
    }

    // 脚本菜单
    // 用户配置设置
    GM_registerMenuCommand('用户设置', openUserSetting)
    if (!init) {
      openUserSetting(true)
    }
    // 稍后再看移除记录
    if (removeHistory) {
      GM_registerMenuCommand('显示稍后再看移除记录', openRemoveHistory)
    }
    // 强制初始化
    GM_registerMenuCommand('重置脚本数据', resetScript)

    // 正式开始处理
    if (headerButton) {
      // 顶栏中加入稍后再看入口
      executeAfterElementLoad({
        selector: '.user-con.signin',
        callback: addHeaderWatchlaterButton,
      })
    }
    if (videoButton && /bilibili.com\/video(|\/.*)$/.test(location.href)) {
      // 播放页面
      // 常规播放页加入快速切换稍后再看状态的按钮
      executeAfterConditionPass({
        condition: () => {
          // 必须在确定 Vue 加载完成后再修改 DOM 结构，否则会导致 Vue 加载出错造成页面错误
          var app = document.querySelector('#app')
          var vueLoad = app && app.__vue__
          if (!vueLoad) {
            return false
          }
          var atr = document.querySelector('#arc_toolbar_report')
          var original = atr && atr.querySelector('.van-watchlater')
          if (original && original.__vue__) {
            return [atr, original]
          } else {
            return false
          }
        },
        callback: addVideoWatchlaterButton,
      })
    } else if (/bilibili.com\/watchlater\/.*\/list/.test(location.href)) {
      // 列表页面
      if (openInNew) {
        switchOpenInNew() // 新标签页打开
      }
      if (removeHistory) {
        // 将此时的稍后再看列表保存起来
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp`,
          onload: function(response) {
            if (response && response.responseText) {
              var current = []
              try {
                var json = JSON.parse(response.responseText)
                var watchList = json.data.list
                for (var e of watchList) {
                  current.push({
                    title: e.title,
                    bvid: e.bvid
                  })
                }
                removeHistoryData.push(current)
                GM_setValue('gm395456_removeHistoryData', removeHistoryData)
              } catch (e) {
                console.error(`保存稍后再看列表错误，重置脚本数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`)
                console.error(e)
              }
            }
          }
        })
      }
      var r_con = document.querySelector('.watch-later-list.bili-wrapper header .r-con')
      if (removeHistory) {
        // 在列表页面加入“移除记录”
        var removeHistoryButton = r_con.appendChild(document.createElement('div'))
        removeHistoryButton.innerText = '移除记录'
        removeHistoryButton.className = 's-btn'
        removeHistoryButton.onclick = () => openRemoveHistory() // 要避免 MouseEvent 的传递
      }
      var plusButton = r_con.appendChild(document.createElement('div'))
      plusButton.innerText = '增强设置'
      plusButton.className = 's-btn'
      plusButton.onclick = () => openUserSetting() // 要避免 MouseEvent 的传递
    }

    // 打开用户设置
    function openUserSetting(initial) {
      if (!el_setting) {
        el_setting = el_gm395456.appendChild(document.createElement('div'))
        menus.setting.el = el_setting
        el_setting.className = 'gm_setting'
        el_setting.innerHTML = `
<div class="gm_setting_page">
    <div class="gm_title">
        <div id="gm_maintitle" onclick="window.open('${GM_info.script.homepage}')" title="${GM_info.script.homepage}">B站稍后再看功能增强</div>
        <div class="gm_subtitle">V${GM_info.script.version} by ${GM_info.script.author}</div>
    </div>
    <div class="gm_items">
        <div class="gm_item">
            <label title="在顶栏“动态”和“收藏”之间加入稍后再看入口，鼠标移至上方时弹出列表菜单，支持点击功能设置">
                <span>【所有页面】在顶栏中加入稍后再看入口</span><input id="gm_headerButton" type="checkbox"></label>
            <label class="gm_subitem" title="选择点击入口后执行的操作">
                <span>点击入口时</span>
                <select id="gm_headerButtonOperation">
                    <option value="op_openListInCurrent">在当前页面打开列表页面</option>
                    <option value="op_openListInNew">在新标签页打开列表页面</option>
                    <option value="op_playAllInCurrent">在当前页面播放全部</option>
                    <option value="op_playAllInNew">在新标签页播放全部</option>
                    <option value="op_openUserSetting">打开用户设置</option>
                    <option value="op_openRemoveHistory">打开稍后再看移除记录</option>
                    <option value="op_noOperation">不执行操作</option>
                </select>
            </label>
        </div>
        <label class="gm_item" title="在常规播放页面中加入能将视频快速切换添加或移除出稍后再看列表的按钮">
            <span>【播放页面】加入快速添加或移除的按钮</span><input id="gm_videoButton" type="checkbox"></label>
        <label class="gm_item" title="是否自动从【www.bilibili.com/medialist/play/watchlater/p*】页面切换至【www.bilibili.com/video/BV*】页面播放">
            <span>【播放页面】是否重定向至常规播放页面</span><input id="gm_redirect" type="checkbox"></label>
        <label class="gm_item" title="在【www.bilibili.com/watchlater/#/list】页面点击时，是否在新标签页打开视频">
            <span>【列表页面】是否在新标签页中打开视频</span><input id="gm_openInNew" type="checkbox"></label>
        <div class="gm_item">
            <label title="保留最近几次打开【www.bilibili.com/watchlater/#/list】页面时稍后再看列表的记录，以查找出这段时间内将哪些视频移除出稍后再看，用于防止误删操作">
                <span>【列表页面】是否开启稍后再看移除记录</span><input id="gm_removeHistory" type="checkbox"></label>
            <div class="gm_subitem" title="范围：${rhsMin}~${rhsMax}。请不要设置过大的数值，否则会带来较大的开销。而且移除记录并非按移除时间排序，设置过大的历史范围反而会给误删视频的定位造成麻烦。该项修改后，会立即对过时记录进行清理，重新修改为原来的值无法还原被清除的记录！">
                <span>根据最近几次加载数据生成</span><input id="gm_removeHistorySaves" type="text"></div>
        </div>
        <label class="gm_item" title="用户设置完成后，某些选项需重新加载页面以生效，是否立即重新加载页面">
            <span>【用户设置】设置完成后重新加载页面</span><input id="gm_reloadAfterSetting" type="checkbox"></label>
    </div>
    <div class="gm_bottom">
        <button id="gm_save">保存</button><button id="gm_cancel">取消</button>
    </div>
    <div id="gm_reset" title="重置脚本设置及内部数据，也许能解决脚本运行错误的问题。无法解决请联系脚本作者：${GM_info.script.supportURL}">重置脚本数据</div>
</div>
<div class="gm_shadow"></div>
`
        var el_reset = el_setting.querySelector('#gm_reset')
        el_reset.onclick = resetScript

        var el_headerButton = el_setting.querySelector('#gm_headerButton')
        var el_headerButtonOperation = el_setting.querySelector('#gm_headerButtonOperation')
        var el_videoButton = el_setting.querySelector('#gm_videoButton')
        var el_redirect = el_setting.querySelector('#gm_redirect')
        var el_openInNew = el_setting.querySelector('#gm_openInNew')
        var el_removeHistory = el_setting.querySelector('#gm_removeHistory')
        var el_removeHistorySaves = el_setting.querySelector('#gm_removeHistorySaves')
        var el_reloadAfterSetting = el_setting.querySelector('#gm_reloadAfterSetting')

        el_headerButton.onchange = function() {
          var parent = el_headerButtonOperation.parentElement
          if (this.checked) {
            parent.removeAttribute('disabled')
          } else {
            parent.setAttribute('disabled', 'disabled')
          }
          el_headerButtonOperation.disabled = !this.checked
        }
        el_removeHistory.onchange = function() {
          var parent = el_removeHistorySaves.parentElement
          if (this.checked) {
            parent.removeAttribute('disabled')
          } else {
            parent.setAttribute('disabled', 'disabled')
          }
          el_removeHistorySaves.disabled = !this.checked
        }
        el_removeHistorySaves.oninput = function() {
          var v0 = this.value.replace(/[^\d]/g, '')
          if (v0 === '') {
            this.value = ''
          } else {
            var value = parseInt(v0)
            if (value > rhsMax) {
              value = rhsMax
            } else if (value < rhsMin) {
              value = rhsMin
            }
            this.value = value
          }
        }
        el_removeHistorySaves.onblur = function() {
          if (this.value === '') {
            this.value = defaultRemoveHistorySaves
          }
        }

        var el_save = el_setting.querySelector('#gm_save')
        var el_cancel = el_setting.querySelector('#gm_cancel')
        var el_shadow = el_setting.querySelector('.gm_shadow')
        el_save.onclick = () => {
          headerButton = el_headerButton.checked
          GM_setValue('gm395456_headerButton', headerButton)
          headerButtonOperation = el_headerButtonOperation.value
          GM_setValue('gm395456_headerButtonOperation', headerButtonOperation)

          videoButton = el_videoButton.checked
          GM_setValue('gm395456_videoButton', videoButton)

          redirect = el_redirect.checked
          GM_setValue('gm395456_redirect', redirect)

          openInNew = el_openInNew.checked
          GM_setValue('gm395456_openInNew', openInNew)
          switchOpenInNew()

          var resetMaxSize = removeHistory != el_removeHistory.checked
          removeHistory = el_removeHistory.checked
          GM_setValue('gm395456_removeHistory', removeHistory)
          if (removeHistory) {
            var rhsV = parseInt(el_removeHistorySaves.value)
            rhsV = isNaN(rhsV) ? defaultRemoveHistorySaves : rhsV
            if (rhsV != removeHistorySaves) {
              removeHistoryData.setMaxSize(rhsV)
              removeHistorySaves = rhsV
              GM_setValue('gm395456_removeHistorySaves', removeHistorySaves)
              GM_setValue('gm395456_removeHistoryData', removeHistoryData)
            } else if (resetMaxSize) {
              removeHistoryData.setMaxSize(rhsV)
              GM_setValue('gm395456_removeHistoryData', removeHistoryData)
            }
          } else if (resetMaxSize) {
            removeHistoryData.setMaxSize(0)
            GM_setValue('gm395456_removeHistoryData', removeHistoryData)
          }

          reloadAfterSetting = el_reloadAfterSetting.checked
          GM_setValue('gm395456_reloadAfterSetting', reloadAfterSetting)

          closeMenuItem('setting')
          if (initial) {
            init = configUpdate
            GM_setValue('gm395456', init)
            setTimeout(() => {
              el_reset.style.display = 'unset'
              el_cancel.disabled = false
              el_shadow.removeAttribute('disabled')
            }, fadeTime)
          }

          if (reloadAfterSetting) {
            location.reload()
          }
        }
        var openHandler = () => {
          el_headerButton.checked = headerButton
          el_headerButtonOperation.value = headerButtonOperation
          el_headerButton.onchange()
          el_videoButton.checked = videoButton
          el_redirect.checked = redirect
          el_openInNew.checked = openInNew
          el_removeHistory.checked = removeHistory
          el_removeHistorySaves.value = isNaN(removeHistorySaves) ? defaultRemoveHistorySaves : removeHistorySaves
          el_removeHistory.onchange()
          el_reloadAfterSetting.checked = reloadAfterSetting
        }
        menus.setting.openHandler = openHandler
        el_cancel.onclick = () => {
          closeMenuItem('setting')
        }
        el_shadow.onclick = function(e) {
          if (!this.getAttribute('disabled')) {
            closeMenuItem('setting')
          }
        }

        if (initial) {
          el_reset.style.display = 'none'
          el_cancel.disabled = true
          el_shadow.setAttribute('disabled', 'disabled')
        }
      }
      openMenuItem('setting')
    }

    // 打开移除记录
    function openRemoveHistory() {
      if (!el_history) {
        el_history = el_gm395456.appendChild(document.createElement('div'))
        menus.history.el = el_history
        el_history.className = 'gm_history'
        el_history.innerHTML = `
<div class="gm_history_page">
    <div class="gm_title">稍后再看移除记录</div>
    <div class="gm_comment">
        <div>根据最近<span id="gm_save_times">X</span>次打开列表页面时获取到的<span id="gm_record_num">X</span>条记录生成，共筛选出<span id="gm_remove_num">X</span>条移除记录。排序由首次加入到稍后再看的顺序决定，与移除出稍后再看的时间无关。如果记录太多难以定位被误删的视频，请在下方设置减少最大搜寻次数；如果第一次进入时处理时间过长，请设置较小的历史范围。鼠标移动到内容区域可向下滚动翻页，点击对话框以外的位置退出。</div>
        <div style="text-align:right;font-weight:bold;margin-right:1em" title="最大搜寻次数，以便于定位被误删的视频。按下回车键或输入框失去焦点时刷新数据。">最大搜寻次数：<input type="text" id="gm_search_times" value="${removeHistoryData.maxSize}"></div>
    </div>
</div>
<div class="gm_shadow"></div>
`
        var el_historyPage = el_history.querySelector('.gm_history_page')
        var el_comment = el_history.querySelector('.gm_comment')
        var el_content = null
        var el_saveTimes = el_history.querySelector('#gm_save_times')
        var el_recordNum = el_history.querySelector('#gm_record_num')
        var el_removeNum = el_history.querySelector('#gm_remove_num')
        var el_searchTimes = el_history.querySelector('#gm_search_times')

        var currentSearTimes = removeHistoryData.size
        var stMax = removeHistoryData.size
        var stMin = 1
        el_searchTimes.oninput = function() {
          var v0 = this.value.replace(/[^\d]/g, '')
          if (v0 === '') {
            this.value = ''
          } else {
            var value = parseInt(v0)
            if (value > stMax) {
              value = stMax
            } else if (value < stMin) {
              value = stMin
            }
            this.value = value
          }
        }
        el_searchTimes.onblur = function() {
          if (this.value === '') {
            this.value = stMax
          }
          if (this.value != currentSearTimes) {
            currentSearTimes = this.value
            menus.history.openHandler()
          }
        }
        el_searchTimes.onkeyup = function(e) {
          if (e.keyCode == 13) {
            this.onblur()
          }
        }

        var setContentTop = () => {
          if (el_content) {
            el_content.style.top = el_comment.offsetTop + el_comment.offsetHeight + 'px'
          }
        }
        window.addEventListener('resize', setContentTop)

        var openHandler = () => {
          if (el_content) {
            var oldContent = el_content
            oldContent.style.opacity = '0'
            setTimeout(() => {
              oldContent.remove()
            }, textFadeTime)
            firstTime = false
          }
          el_content = el_historyPage.appendChild(document.createElement('div'))
          el_content.className = 'gm_content'

          GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp`,
            onload: function(response) {
              if (response && response.responseText) {
                try {
                  var bvid = []
                  var json = JSON.parse(response.responseText)
                  var watchList = json.data.list
                  for (var e of watchList) {
                    bvid.push(e.bvid)
                  }
                  var map = new Map()
                  var removeData = removeHistoryData.toArray(currentSearTimes)
                  el_saveTimes.innerText = removeData.length
                  for (var i = removeData.length - 1; i >= 0; i--) { // 后面的数据较旧，从后往前遍历
                    for (var record of removeData[i]) {
                      map.set(record.bvid, record)
                    }
                  }
                  el_recordNum.innerText = map.size
                  for (var id of bvid) {
                    map.delete(id)
                  }
                  var result = []
                  for (var rm of map.values()) {
                    result.push(`<span>${rm.title}</span><br><a href="https://www.bilibili.com/video/${rm.bvid}" target="_blank">${rm.bvid}</a>`)
                  }
                  el_removeNum.innerText = result.length

                  setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
                  el_content.innerHTML = result.join('<br><br>')
                  el_content.style.opacity = '1'
                } catch (e) {
                  var errorInfo = `网络连接错误，重置脚本数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`
                  setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
                  el_content.innerHTML = errorInfo
                  el_content.style.opacity = '1'
                  console.error(errorInfo)
                  console.error(e)
                }
              }
            }
          })
        }
        menus.history.openHandler = openHandler

        var el_shadow = el_history.querySelector('.gm_shadow')
        el_shadow.onclick = () => {
          closeMenuItem('history')
        }
      }
      openMenuItem('history')
    }

    function resetScript() {
      var result = confirm('是否要重置脚本数据？')
      if (result) {
        init = 0
        GM_setValue('gm395456', init)
        location.reload()
      }
    }

    function addHeaderWatchlaterButton(header) {
      if (header) {
        var collect = header.children[4]
        var watchlater = header.children[6].cloneNode(true)
        var link = watchlater.firstChild
        switch (headerButtonOperation) {
          case 'op_openListInCurrent':
            link.href = 'https://www.bilibili.com/watchlater/#/list'
            link.target = '_self'
            break
          case 'op_openListInNew':
            link.href = 'https://www.bilibili.com/watchlater/#/list'
            link.target = '_blank'
            break
          case 'op_playAllInCurrent':
            link.href = 'https://www.bilibili.com/medialist/play/watchlater/p1'
            link.target = '_self'
            break
          case 'op_playAllInNew':
            link.href = 'https://www.bilibili.com/medialist/play/watchlater/p1'
            link.target = '_blank'
            break
          case 'op_openUserSetting':
            link.href = 'javascript:void(0)'
            link.target = '_self'
            link.onclick = () => openUserSetting()
            break
          case 'op_openRemoveHistory':
            link.href = 'javascript:void(0)'
            link.target = '_self'
            link.onclick = () => openRemoveHistory()
          case 'noOperation':
          default:
            link.href = 'javascript:void(0)'
            link.target = '_self'
        }
        var text = link.firstChild
        text.innerText = '稍后再看'
        header.insertBefore(watchlater, collect)

        // 鼠标移动到稍后再看入口上时，以 Tooltip 形式显示稍后再看列表
        var watchlaterPanelSelector = '[role=tooltip][aria-hidden=false] .tabs-panel [title=稍后再看]'
        var dispVue = collect.firstChild.__vue__
        watchlater.onmouseover = () => {
          // 确保原列表完全消失后再显示，避免从“收藏”移动到稍后再看时列表反而消失的问题
          executeAfterConditionPass({
            condition: () => !document.querySelector(watchlaterPanelSelector),
            callback: () => {
              dispVue.showPopper = true
              executeAfterElementLoad({
                selector: watchlaterPanelSelector,
                callback: watchlaterPanel => watchlaterPanel.parentNode.click(),
                interval: 50,
                timeout: 1500,
              })
            },
            interval: 10,
            timeout: 500,
          })
        }
        // 鼠标从“稍后再看”离开时关闭列表，但移动到“收藏”上面时不关闭
        collect.onmouseover = () => {
          collect.mouseOver = true
        }
        collect.onmouseleave = () => {
          collect.mouseOver = false
        }
        watchlater.onmouseleave = () => {
          // 要留出足够空间让 collect.mouseOver 变化
          // 但有时候还是会闪，毕竟常规方式估计是无法阻止鼠标移动到“收藏”上时的 Vue 事件
          setTimeout(() => {
            if (!collect.mouseOver) {
              dispVue.showPopper = false
            }
          }, 100)
        }
      }
    }

    function addVideoWatchlaterButton([atr, original]) {
      var oVue = original.__vue__
      var btn = document.createElement('label')
      var cb = document.createElement('input')
      cb.type = 'checkbox'
      cb.style.verticalAlign = 'middle'
      cb.style.margin = '0 2px 2px 0'
      btn.appendChild(cb)
      var text = document.createElement('span')
      text.innerText = '稍后再看'
      btn.className = 'appeal-text'
      cb.onclick = () => { // 不要附加到 btn 上，否则点击时会执行两次
        oVue.handler()
        var checked = !oVue.added
        // 检测操作是否生效，失败时弹出提示
        executeAfterConditionPass({
          condition: () => checked === oVue.added,
          callback: () => {
            cb.checked = checked
          },
          interval: 50,
          timeout: 500,
          onTimeout: () => {
            cb.checked = oVue.added
            alert(checked ? '添加至稍后再看失败' : '从稍后再看移除失败')
          },
        })
      }
      btn.appendChild(text)
      atr.appendChild(btn)
      original.parentNode.style.display = 'none'

      // oVue.added 第一次取到的值总是 false，从页面无法获取到该视频是否已经在稍后再看列表中，需要使用API查询
      GM_xmlhttpRequest({
        method: 'GET',
        url: `https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp`,
        onload: function(response) {
          if (response && response.responseText) {
            try {
              var json = JSON.parse(response.responseText)
              var watchList = json.data.list
              var av = oVue.aid
              for (var e of watchList) {
                if (av == e.aid) {
                  oVue.added = true
                  cb.checked = true
                  break
                }
              }
            } catch (e) {
              console.error(e)
            }
          }
        }
      })
    }

    // 切换新标签页打开
    function switchOpenInNew() {
      if (/bilibili.com\/watchlater\/.*\/list/.test(location.href)) {
        var base = null
        if (openInNew) {
          base = document.head.appendChild(document.createElement('base'))
          base.id = 'gm_base'
          base.target = '_blank'
        } else {
          base = document.head.querySelector('base#gm_base')
          base && base.remove()
        }
      }
    }

    // 对“打开菜单项”这一操作进行处理，包括显示菜单项、设置当前菜单项的状态、关闭其他菜单项
    function openMenuItem(name) {
      if (!menus[name].state) {
        for (var key in menus) {
          var menu = menus[key]
          if (key == name) {
            menu.state = true
            fade(true, menu.el)
            menu.openHandler && menu.openHandler()
          } else {
            if (menu.state) {
              closeMenuItem(key)
            }
          }
        }
      }
    }

    // 对“关闭菜单项”这一操作进行处理，包括隐藏菜单项、设置当前菜单项的状态
    function closeMenuItem(name) {
      var menu = menus[name]
      if (menu.state) {
        menu.state = false
        fade(false, menu.el)
        menu.closeHandler && setTimeout(() => {
          menu.closeHandler()
        }, fadeTime)
      }
    }

    // 处理 HTML 元素的渐显和渐隐
    function fade(inOut, target) {
      if (inOut) { // 渐显
        // 只有 display 可视情况下修改 opacity 才会触发 transition
        // 按 HTML5 定义，浏览器需保证 display 在修改 4ms 后保证生效，但实际上大部分浏览器貌似做不到，等个 10ms 再修改 opacity
        target.style.display = 'unset'
        setTimeout(() => {
          target.style.opacity = '1'
        }, 10)
      } else { // 渐隐
        target.style.opacity = '0'
        setTimeout(() => {
          target.style.display = 'none'
        }, fadeTime)
      }
    }

    /**
     * 在条件满足后执行操作
     *
     * 当条件满足后，如果不存在终止条件，那么直接执行 callback(result)。
     *
     * 当条件满足后，如果存在终止条件，且 stopTimeout 大于 0，则还会在接下来的 stopTimeout 时间内判断是否满足终止条件，称为终止条件的二次判断。
     * 如果在此期间，终止条件通过，则表示依然不满足条件，故执行 stopCallback() 而非 callback(result)。
     * 如果在此期间，终止条件一直失败，则顺利通过检测，执行 callback(result)。
     *
     * @param {Object} [options={}] 选项
     * @param {Function} [options.condition] 条件，当 condition() 返回的 result 为真值时满足条件
     * @param {Function} [options.callback] 当满足条件时执行 callback(result)
     * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
     * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
     * @param {Function} [options.onTimeout] 检测超时时执行 onTimeout()
     * @param {Function} [options.stopCondition] 终止条件，当 stopCondition() 返回的 stopResult 为真值时终止检测
     * @param {Function} [options.stopCallback] 终止条件达成时执行 stopCallback()（包括终止条件的二次判断达成）
     * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
     * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
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
      }
      var o = {
        ...defaultOptions,
        ...options
      }
      if (!o.callback instanceof Function) {
        return
      }

      var cnt = 0
      var maxCnt = o.timeout / o.interval
      var tid = setInterval(() => {
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
      }, o.interval)
    }

    /**
     * 在元素加载完成后执行操作
     *
     * 当元素加载成功后，如果没有设置终止元素选择器，那么直接执行 callback(element)。
     *
     * 当元素加载成功后，如果没有设置终止元素选择器，且 stopTimeout 大于 0，则还会在接下来的 stopTimeout 时间内判断终止元素是否加载成功，称为终止元素的二次加载。
     * 如果在此期间，终止元素加载成功，则表示依然不满足条件，故执行 stopCallback() 而非 callback(element)。
     * 如果在此期间，终止元素加载失败，则顺利通过检测，执行 callback(element)。
     *
     * @param {Object} [options={}] 选项
     * @param {Function} [options.selector] 该选择器指定要等待加载的元素 element
     * @param {Function} [options.callback] 当 element 加载成功时执行 callback(element)
     * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
     * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
     * @param {Function} [options.onTimeout] 检测超时时执行 onTimeout()
     * @param {Function} [options.stopCondition] 该选择器指定终止元素 stopElement，若该元素加载成功则终止检测
     * @param {Function} [options.stopCallback] 终止元素加载成功后执行 stopCallback()（包括终止元素的二次加载）
     * @param {number} [options.stopInterval=50] 终止元素二次加载期间的检测时间间隔（单位：ms）
     * @param {number} [options.stopTimeout=0] 终止元素二次加载期间的检测超时时间（单位：ms）
     */
    function executeAfterElementLoad(options) {
      var defaultOptions = {
        selector: '',
        callback: el => console.log(el),
        interval: 100,
        timeout: 5000,
        onTimeout: null,
        stopSelector: null,
        stopCallback: null,
        stopInterval: 50,
        stopTimeout: 0,
      }
      var o = {
        ...defaultOptions,
        ...options
      }
      executeAfterConditionPass({
        ...o,
        condition: () => document.querySelector(o.selector),
        stopCondition: o.stopSelector && (() => document.querySelector(o.stopSelector)),
      })
    }
  })

  /**
   * 检验数据是否符合类型定义，符合时返回原值，不符合时返回默认值
   * 
   * @param {object} value 待检验数据
   * @param {string} type 给定的数据类型
   * @param {object} defaultValue 默认值
   * @return {object} 符合定义时返回原值，否则返回默认值
   */
  function validate(value, type, defaultValue) {
    return typeof value == type ? value : defaultValue
  }
})()

/**
 * 推入队列，循环数组实现
 *
 * @param {number} maxSize 队列的最大长度，达到此长度后继续推入数据，将舍弃末尾处的数据
 * @param {number} [capacity=maxSize] 循环数组的长度，不能小于 maxSize
 */
function PushQueue(maxSize, capacity) {
  this.index = 0
  this.size = 0
  this.maxSize = maxSize
  if (!capacity || capacity < maxSize) {
    capacity = maxSize
  }
  this.capacity = capacity
  this.data = new Array(capacity)
}
/**
 * 设置推入队列的最大长度
 *
 * @param {number} maxSize 队列的最大长度，不能大于 capacity
 */
PushQueue.prototype.setMaxSize = function(maxSize) {
  if (maxSize > this.capacity) {
    maxSize = this.capacity
  } else if (maxSize < this.size) {
    this.size = maxSize
  }
  this.maxSize = maxSize
  this.gc()
}
/**
 * 队列是否为空
 */
PushQueue.prototype.empty = function() {
  return this.size == 0
}
/**
 * 向队列中推入数据，若队列已达到最大长度，则舍弃末尾处数据
 *
 * @param {Object} value 推入队列的数据
 */
PushQueue.prototype.push = function(value) {
  this.data[this.index] = value
  this.index += 1
  if (this.index >= this.capacity) {
    this.index = 0
  }
  if (this.size < this.maxSize) {
    this.size += 1
  }
  if (this.maxSize < this.capacity && this.size == this.maxSize) { // maxSize 等于 capacity 时资源刚好完美利用，不必回收资源
    var release = this.index - this.size - 1
    if (release < 0) {
      release += this.capacity
    }
    this.data[release] = null
  }
}
/**
 * 将队列末位处的数据弹出
 *
 * @return {Object} 弹出的数据
 */
PushQueue.prototype.pop = function() {
  if (this.size > 0) {
    var index = this.index - this.size
    if (index < 0) {
      index += this.capacity
    }
    this.size -= 1
    var result = this.data[index]
    this.data[index] = null
    return result
  }
}
/**
 * 将推入队列以数组的形式返回
 *
 * @param {number} [maxLength=size] 读取的最大长度
 * @return {Array} 队列数据的数组形式
 */
PushQueue.prototype.toArray = function(maxLength) {
  if (typeof maxLength != 'number') {
    maxLength = parseInt(maxLength)
  }
  if (isNaN(maxLength) || maxLength > this.size || maxLength < 0) {
    maxLength = this.size
  }
  var ar = []
  var end = this.index - maxLength
  var i = 0
  for (i = this.index - 1; i >= end && i >= 0; i--) {
    ar.push(this.data[i])
  }
  if (end < 0) {
    end += this.capacity
    for (i = this.capacity - 1; i >= end; i--) {
      ar.push(this.data[i])
    }
  }
  return ar
}
/**
 * 清理内部无效数据，释放内存
 */
PushQueue.prototype.gc = function() {
  var i = 0
  if (this.size > 0) {
    var start = this.index - 1
    var end = this.index - this.size
    if (end < 0) {
      end += this.capacity
    }
    if (start >= end) {
      for (i = 0; i < end; i++) {
        this.data[i] = null
      }
      for (i = start + 1; i < this.capacity; i++) {
        this.data[i] = null
      }
    } else if (start < end) {
      for (i = start + 1; i < end; i++) {
        this.data[i] = null
      }
    }
  } else {
    this.data = new Array(this.capacity)
  }
}