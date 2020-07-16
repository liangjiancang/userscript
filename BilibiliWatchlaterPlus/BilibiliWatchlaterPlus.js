// ==UserScript==
// @id             BilibiliWatchlaterPlus@Laster2800
// @name           B站稍后再看功能增强
// @version        2.5.0.20200716
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
  // document-start 级用户配置读取
  var init = GM_getValue('gm395456')
  var configUpdate = 20200716

  var redirect = false
  if (init > 0) {
    redirect = GM_getValue('gm395456_redirect')
  } else {
    GM_setValue('gm395456_redirect', redirect)
  }

  // 重定向，document-start 就执行，尽可能快地将原页面掩盖过去
  if (redirect && /bilibili.com\/medialist\/play\/watchlater(?=\/|$)/.test(location.href)) {
    window.stop() // 停止原页面的加载
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp',
      onload: function(response) {
        if (response && response.responseText) {
          try {
            var part = 1
            if (/watchlater\/p\d+/.test(location.href)) {
              part = parseInt(location.href.match(/(?<=\/watchlater\/p)\d+(?=\/?)/)[0])
            } // 如果匹配不上，就是以 watchlater/ 直接结尾，等同于 watchlater/p1
            var json = JSON.parse(response.responseText)
            var watchlaterList = json.data.list
            location.replace('https://www.bilibili.com/video/' + watchlaterList[part - 1].bvid)
          } catch (e) {
            var errorInfo = `重定向错误，重置脚本数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`
            console.error(errorInfo)
            console.error(e)

            var rc = confirm(errorInfo + '\n\n是否暂时关闭模式切换功能？')
            if (rc) {
              redirect = false
              GM_setValue('gm395456_redirect', redirect)
              location.reload()
            } else {
              location.replace('https://www.bilibili.com/watchlater/#/list')
            }
          }
        }
      }
    })
  }

  // 脚本的其他部分推迟至 DOMContentLoaded 执行
  document.addEventListener('DOMContentLoaded', () => {
    // 常用 URL
    var URL = {
      api_queryWatchlaterList: 'https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp',
      page_watchlaterList: 'https://www.bilibili.com/watchlater/#/list',
      page_videoNormalMode: 'https://www.bilibili.com/video',
      page_videoWatchlaterMode: 'https://www.bilibili.com/medialist/play/watchlater',
      page_watchlaterPlayAll: 'https://www.bilibili.com/medialist/play/watchlater/p1',
      noop: 'javascript:void(0)',
    }

    // 顶栏入口的默认行为
    var defaultHeaderButtonOpL = 'op_openListInNew'
    var defaultHeaderButtonOpR = 'op_openUserSetting'
    // 移除记录使用的历史数据次数设置
    var defaultRemoveHistorySaves = 16
    var rhsMin = 1
    var rhsMax = 64
    // 移除记录默认历史回溯深度
    var defaultRemoveHistorySearchTimes = 8

    // 用户配置读取
    // 默认值
    var headerButton = true
    var headerButtonOpL = defaultHeaderButtonOpL
    var headerButtonOpR = defaultHeaderButtonOpR
    var videoButton = true
    var openInNew = false
    var removeHistory = true
    var removeHistorySaves = defaultRemoveHistorySaves
    var removeHistorySearchTimes = defaultRemoveHistorySearchTimes
    var removeHistoryData = null
    var reloadAfterSetting = true

    if (init > 0) {
      // 一般情况下，读取用户配置；如果配置出错，则沿用默认值，并将默认值写入配置中
      var gmValidate = (gmKey, type, defaultValue, writeDefault = true) => {
        var value = GM_getValue(gmKey)
        if (typeof value == type) {
          return value
        } else {
          if (writeDefault) {
            GM_setValue(gmKey, defaultValue)
          }
          return defaultValue
        }
      }

      // document-start 级配置的校验
      gmValidate('gm395456_redirect', 'boolean', redirect)
      // 对配置进行校验
      headerButton = gmValidate('gm395456_headerButton', 'boolean', headerButton)
      headerButtonOpL = gmValidate('gm395456_headerButtonOpL', 'string', headerButtonOpL)
      headerButtonOpR = gmValidate('gm395456_headerButtonOpR', 'string', headerButtonOpR)
      videoButton = gmValidate('gm395456_videoButton', 'boolean', videoButton)
      openInNew = gmValidate('gm395456_openInNew', 'boolean', openInNew)
      removeHistory = gmValidate('gm395456_removeHistory', 'boolean', removeHistory)
      removeHistorySaves = gmValidate('gm395456_removeHistorySaves', 'number', removeHistorySaves)
      removeHistorySearchTimes = gmValidate('gm395456_removeHistorySearchTimes', 'number', removeHistorySearchTimes, false)
      if (removeHistorySearchTimes > removeHistorySaves) {
        removeHistorySearchTimes = removeHistorySaves
        GM_setValue('gm395456_removeHistorySearchTimes', removeHistorySearchTimes)
      }
      removeHistoryData = gmValidate('gm395456_removeHistoryData', 'object', null, false)
      if (!removeHistoryData) {
        removeHistoryData = new PushQueue(defaultRemoveHistorySaves, rhsMax)
        GM_setValue('gm395456_removeHistoryData', removeHistoryData)
      } else {
        Object.setPrototypeOf(removeHistoryData, PushQueue.prototype) // 还原类型信息
      }
      reloadAfterSetting = gmValidate('gm395456_reloadAfterSetting', 'boolean', reloadAfterSetting)

      // 配置版本落后，如果更新后有必须执行的任务写在这里
      // if (init < configUpdate) {
      //   // init = false // 是否强制进行用户设置
      // }
    } else {
      // 用户强制初始化，或者第一次安装脚本
      init = false
      removeHistoryData = new PushQueue(defaultRemoveHistorySaves, rhsMax)
      GM_setValue('gm395456_headerButton', headerButton)
      GM_setValue('gm395456_headerButtonOpL', headerButtonOpL)
      GM_setValue('gm395456_headerButtonOpR', headerButtonOpR)
      GM_setValue('gm395456_videoButton', videoButton)
      GM_setValue('gm395456_openInNew', openInNew)
      GM_setValue('gm395456_removeHistory', removeHistory)
      GM_setValue('gm395456_removeHistorySaves', removeHistorySaves)
      GM_setValue('gm395456_removeHistorySearchTimes', removeHistorySearchTimes)
      GM_setValue('gm395456_removeHistoryData', removeHistoryData)
      GM_setValue('gm395456_reloadAfterSetting', reloadAfterSetting)
    }

    var fadeTime = 400
    var textFadeTime = 100
    GM_addStyle(`
#gm395456 .gm-setting {
    font-size: 12px;
    transition: opacity ${fadeTime}ms ease-in-out;
    opacity: 0;
    display: none;
    position: fixed;
    z-index: 10000;
}
#gm395456 .gm-setting .gm-setting-page {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #ffffff;
    border-radius: 10px;
    z-index: 65535;
    min-width: 48em;
    padding: 0.4em;
}
#gm395456 .gm-setting #gm-maintitle {
    cursor: pointer;
}
#gm395456 .gm-setting #gm-maintitle:hover {
    color: #0075FF;
}
#gm395456 .gm-setting .gm-items {
    margin: 0 2.2em;
    font-size: 1.2em;
}
#gm395456 .gm-setting .gm-item {
    display: block;
    padding: 0.4em;
}
#gm395456 .gm-setting .gm-subitem {
    display: block;
    margin-left: 6em;
    margin-top: 0.3em;
}
#gm395456 .gm-setting .gm-item:hover {
    color: #0075FF;
}
#gm395456 .gm-setting .gm-subitem[disabled] {
    color: gray;
}
#gm395456 .gm-setting .gm-subitem:hover:not([disabled]) {
    color: #0075FF;
}
#gm395456 .gm-setting input[type=checkbox] {
    vertical-align: middle;
    margin: 3px 0 0 10px;
    float: right;
}
#gm395456 .gm-setting input[type=text] {
    float: right;
    border-width: 0 0 1px 0;
    width: 2em;
    text-align: right;
    padding: 0 0.2em;
    margin-right: -0.2em;
}
#gm395456 .gm-setting select {
    border-width: 0 0 1px 0;
    cursor: pointer;
}
#gm395456 .gm-setting .gm-bottom {
    margin: 0.8em 2em 1.8em 2em;
    text-align: center;
}
#gm395456 .gm-setting .gm-bottom button {
    font-size: 1em;
    padding: 0.2em 0.8em;
    margin: 0 0.6em;
    cursor: pointer;
}

#gm395456 .gm-history {
    transition: opacity ${fadeTime}ms ease-in-out;
    opacity: 0;
    display: none;
    position: fixed;
    z-index: 10000;
}
#gm395456 .gm-history .gm-history-page {
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
#gm395456 .gm-history .gm-comment {
    margin: 0 2em;
    color: gray;
    text-indent: 2em;
}
#gm395456 .gm-history .gm-comment span,
#gm395456 .gm-history .gm-comment input {
    padding: 0 0.2em;
    font-weight: bold;
    color: #666666;
}
#gm395456 .gm-history .gm-comment input{
    text-align: center;
    width: 3em;
    border-width: 0 0 1px 0;
}
#gm395456 .gm-history .gm-content {
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
#gm395456 .gm-history .gm-content::-webkit-scrollbar {
    display: none;
}

#gm395456 #gm-reset {
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 0.6em 0.8em;
    color: #b4b4b4;
    cursor: pointer;
}
#gm395456 #gm-reset:hover {
    color: #666666;
}

#gm395456 .gm-title {
    font-size: 1.6em;
    margin: 1.6em 0.8em 0.8em 0.8em;
    text-align: center;
}

#gm395456 .gm-subtitle {
  font-size: 0.4em;
  margin-top: 0.4em;
}

#gm395456 .gm-shadow {
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
#gm395456 [disabled] input,
#gm395456 [disabled] select {
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
          url: URL.api_queryWatchlaterList,
          onload: function(response) {
            if (response && response.responseText) {
              var current = []
              try {
                var json = JSON.parse(response.responseText)
                var watchlaterList = json.data.list
                for (var e of watchlaterList) {
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
        el_setting.className = 'gm-setting'
        el_setting.innerHTML = `
<div class="gm-setting-page">
    <div class="gm-title">
        <div id="gm-maintitle" onclick="window.open('${GM_info.script.homepage}')" title="${GM_info.script.homepage}">B站稍后再看功能增强</div>
        <div class="gm-subtitle">V${GM_info.script.version} by ${GM_info.script.author}</div>
    </div>
    <div class="gm-items">
        <div class="gm-item">
            <label title="在顶栏“动态”和“收藏”之间加入稍后再看入口，鼠标移至上方时弹出列表菜单，支持点击功能设置">
                <span>【所有页面】在顶栏中加入稍后再看入口</span><input id="gm-headerButton" type="checkbox"></label>
            <label class="gm-subitem" title="选择左键点击入口后执行的操作">
                <span>在入口上点击鼠标左键时</span><select id="gm-headerButtonOpL"></select></label>
            <label class="gm-subitem" title="选择右键点击入口后执行的操作">
                <span>在入口上点击鼠标右键时</span><select id="gm-headerButtonOpR"></select></label>
        </div>
        <label class="gm-item" title="在常规播放页面中加入能将视频快速切换添加或移除出稍后再看列表的按钮">
            <span>【播放页面】加入快速切换视频稍后再看状态的按钮</span><input id="gm-videoButton" type="checkbox"></label>
        <label class="gm-item" title="是否自动从【www.bilibili.com/medialist/play/watchlater/p*】页面切换至【www.bilibili.com/video/BV*】页面播放">
            <span>【播放页面】从稍后再看模式切换到普通模式播放</span><input id="gm-redirect" type="checkbox"></label>
        <label class="gm-item" title="在【www.bilibili.com/watchlater/#/list】页面点击时，是否在新标签页打开视频">
            <span>【列表页面】在新标签页中打开视频</span><input id="gm-openInNew" type="checkbox"></label>
        <div class="gm-item">
            <label title="保留最近几次打开【www.bilibili.com/watchlater/#/list】页面时稍后再看列表的记录，以查找出这段时间内将哪些视频移除出稍后再看，用于防止误删操作。关闭该选项后，会将内部历史数据清除！">
                <span>【列表页面】开启稍后再看移除记录（防误删）</span><input id="gm-removeHistory" type="checkbox"></label>
            <div class="gm-subitem" title="请不要设置过大的数值，否则会带来较大的开销。该项修改后，会立即对过时记录进行清理，重新修改为原来的值无法还原被清除的记录，设置为比原来小的值需慎重！范围：${rhsMin} ~ ${rhsMax}。">
                <span>保存最近多少次列表页面数据用于生成移除记录</span><input id="gm-removeHistorySaves" type="text"></div>
            <div class="gm-subitem" title="搜寻时在最近多少次列表页面数据中查找，设置较小的值能较好地定位最近移除的视频。不能大于最近列表页面数据保存次数。">
                <span>默认历史回溯深度</span><input id="gm-removeHistorySearchTimes" type="text"></div>
        </div>
        <label class="gm-item" title="用户设置完成后，某些选项需重新加载页面以生效，是否立即重新加载页面">
            <span>【用户设置】设置完成后重新加载页面</span><input id="gm-reloadAfterSetting" type="checkbox"></label>
    </div>
    <div class="gm-bottom">
        <button id="gm-save">保存</button><button id="gm-cancel">取消</button>
    </div>
    <div id="gm-reset" title="重置脚本设置及内部数据，也许能解决脚本运行错误的问题。无法解决请联系脚本作者：${GM_info.script.supportURL}">重置脚本数据</div>
</div>
<div class="gm-shadow"></div>
`
        var el_reset = el_setting.querySelector('#gm-reset')
        el_reset.onclick = resetScript

        var el_headerButton = el_setting.querySelector('#gm-headerButton')
        var el_headerButtonOpL = el_setting.querySelector('#gm-headerButtonOpL')
        var el_headerButtonOpR = el_setting.querySelector('#gm-headerButtonOpR')
        var el_videoButton = el_setting.querySelector('#gm-videoButton')
        var el_redirect = el_setting.querySelector('#gm-redirect')
        var el_openInNew = el_setting.querySelector('#gm-openInNew')
        var el_removeHistory = el_setting.querySelector('#gm-removeHistory')
        var el_removeHistorySaves = el_setting.querySelector('#gm-removeHistorySaves')
        var el_removeHistorySearchTimes = el_setting.querySelector('#gm-removeHistorySearchTimes')
        var el_reloadAfterSetting = el_setting.querySelector('#gm-reloadAfterSetting')

        el_headerButtonOpL.innerHTML = el_headerButtonOpR.innerHTML = `
<option value="op_openListInCurrent">在当前页面打开列表页面</option>
<option value="op_openListInNew">在新标签页打开列表页面</option>
<option value="op_playAllInCurrent">在当前页面播放全部</option>
<option value="op_playAllInNew">在新标签页播放全部</option>
<option value="op_openUserSetting">打开用户设置</option>
<option value="op_openRemoveHistory">打开稍后再看移除记录</option>
<option value="op_noOperation">不执行操作</option>
        `

        var subitemChange = (item, subs) => {
          for (var el of subs) {
            var parent = el.parentElement
            if (item.checked) {
              parent.removeAttribute('disabled')
            } else {
              parent.setAttribute('disabled', 'disabled')
            }
            el.disabled = !item.checked
          }
        }
        el_headerButton.onchange = function() {
          subitemChange(this, [el_headerButtonOpL, el_headerButtonOpR])
        }
        el_removeHistory.onchange = function() {
          subitemChange(this, [el_removeHistorySaves, el_removeHistorySearchTimes])
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
            this.value = el_removeHistorySearchTimes.value
          }
          if (parseInt(el_removeHistorySearchTimes.value) > parseInt(this.value)) {
            el_removeHistorySearchTimes.value = this.value
          }
        }
        el_removeHistorySearchTimes.oninput = function() {
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
        el_removeHistorySearchTimes.onblur = function() {
          if (this.value === '') {
            this.value = el_removeHistorySaves.value
          } else if (parseInt(el_removeHistorySaves.value) < parseInt(this.value)) {
            el_removeHistorySaves.value = this.value
          }
        }

        var el_save = el_setting.querySelector('#gm-save')
        var el_cancel = el_setting.querySelector('#gm-cancel')
        var el_shadow = el_setting.querySelector('.gm-shadow')
        el_save.onclick = () => {
          headerButton = el_headerButton.checked
          GM_setValue('gm395456_headerButton', headerButton)
          headerButtonOpL = el_headerButtonOpL.value
          GM_setValue('gm395456_headerButtonOpL', headerButtonOpL)
          headerButtonOpR = el_headerButtonOpR.value
          GM_setValue('gm395456_headerButtonOpR', headerButtonOpR)

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
            var rhstV = parseInt(el_removeHistorySearchTimes.value)
            rhstV = isNaN(rhstV) ? removeHistorySaves : rhstV
            if (rhstV != removeHistorySearchTimes) {
              removeHistorySearchTimes = rhstV
              GM_setValue('gm395456_removeHistorySearchTimes', removeHistorySearchTimes)
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
          el_headerButtonOpL.value = headerButtonOpL
          el_headerButtonOpR.value = headerButtonOpR
          el_headerButton.onchange()
          el_videoButton.checked = videoButton
          el_redirect.checked = redirect
          el_openInNew.checked = openInNew
          el_removeHistory.checked = removeHistory
          el_removeHistorySaves.value = isNaN(removeHistorySaves) ? defaultRemoveHistorySaves : removeHistorySaves
          el_removeHistorySearchTimes.value = isNaN(removeHistorySearchTimes) ? el_removeHistorySaves.value : removeHistorySearchTimes
          el_removeHistory.onchange()
          el_reloadAfterSetting.checked = reloadAfterSetting
        }
        menus.setting.openHandler = openHandler
        el_cancel.onclick = () => {
          closeMenuItem('setting')
        }
        el_shadow.onclick = function() {
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
      var el_searchTimes = null
      if (!el_history) {
        el_history = el_gm395456.appendChild(document.createElement('div'))
        menus.history.el = el_history
        el_history.className = 'gm-history'
        el_history.innerHTML = `
<div class="gm-history-page">
    <div class="gm-title">稍后再看移除记录</div>
    <div class="gm-comment">
        <div>根据最近<span id="gm-save-times">X</span>次打开列表页面时获取到的<span id="gm-record-num">X</span>条记录生成，共筛选出<span id="gm-remove-num">X</span>条移除记录。排序由首次加入到稍后再看的顺序决定，与移除出稍后再看的时间无关。如果记录太多难以定位被误删的视频，请在下方设置减少历史回溯深度。鼠标移动到内容区域可向下滚动翻页，点击对话框以外的位置退出。</div>
        <div style="text-align:right;font-weight:bold;margin-right:1em" title="搜寻时在最近多少次列表页面数据中查找，设置较小的值能较好地定位最近移除的视频。按下回车键或输入框失去焦点时刷新数据。">历史回溯深度：<input type="text" id="gm-search-times" value="X"></div>
    </div>
</div>
<div class="gm-shadow"></div>
`
        var el_historyPage = el_history.querySelector('.gm-history-page')
        var el_comment = el_history.querySelector('.gm-comment')
        var el_content = null
        var el_saveTimes = el_history.querySelector('#gm-save-times')
        var el_recordNum = el_history.querySelector('#gm-record-num')
        var el_removeNum = el_history.querySelector('#gm-remove-num')

        // 使用 el_searchTimes.current 代替本地变量记录数据，可以保证任何情况下闭包中都能获取到正确数据
        el_searchTimes = el_history.querySelector('#gm-search-times')
        el_searchTimes.current = removeHistorySearchTimes < removeHistoryData.size ? removeHistorySearchTimes : removeHistoryData.size
        el_searchTimes.value = el_searchTimes.current

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
          if (this.value != el_searchTimes.current) {
            el_searchTimes.current = this.value
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
          }
          el_content = el_historyPage.appendChild(document.createElement('div'))
          el_content.className = 'gm-content'

          GM_xmlhttpRequest({
            method: 'GET',
            url: URL.api_queryWatchlaterList,
            onload: function(response) {
              if (response && response.responseText) {
                try {
                  var bvid = []
                  var json = JSON.parse(response.responseText)
                  var watchlaterList = json.data.list
                  for (var e of watchlaterList) {
                    bvid.push(e.bvid)
                  }
                  var map = new Map()
                  var removeData = removeHistoryData.toArray(el_searchTimes.current)
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
                    result.push(`<span>${rm.title}</span><br><a href="${URL.page_videoNormalMode}/${rm.bvid}" target="_blank">${rm.bvid}</a>`)
                  }
                  el_removeNum.innerText = result.length

                  setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
                  if (result.length > 0) {
                    el_content.innerHTML = result.join('<br><br>')
                  } else {
                    el_content.innerText = `在最近 ${el_searchTimes.current} 次列表页面数据中没有找到被移除的记录，请尝试增大历史回溯深度`
                    el_content.style.color = 'gray'
                  }
                  el_content.style.opacity = '1'
                } catch (e) {
                  var errorInfo = `网络连接错误，重置脚本数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`
                  setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
                  el_content.innerHTML = errorInfo
                  el_content.style.opacity = '1'
                  el_content.style.color = 'gray'

                  console.error(errorInfo)
                  console.error(e)
                }
              }
            }
          })
        }
        menus.history.openHandler = openHandler

        var el_shadow = el_history.querySelector('.gm-shadow')
        el_shadow.onclick = () => {
          closeMenuItem('history')
        }
      } else {
        el_searchTimes = el_history.querySelector('#gm-search-times')
        el_searchTimes.current = removeHistorySearchTimes < removeHistoryData.size ? removeHistorySearchTimes : removeHistoryData.size
        el_searchTimes.value = el_searchTimes.current
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
        var text = link.firstChild
        text.innerText = '稍后再看'
        header.insertBefore(watchlater, collect)

        var getHrefAndTarget = op => {
          var href = ''
          if (/openList/i.test(op)) {
            href = URL.page_watchlaterList
          } else if (/playAll/.test(op)) {
            href = URL.page_watchlaterPlayAll
          } else {
            href = URL.noop
          }

          var target = ''
          if (/inCurrent/i.test(op)) {
            target = '_self'
          } else if (/inNew/i.test(op)) {
            target = '_blank'
          } else {
            target = '_self'
          }

          return { href, target }
        }

        // 鼠标左键点击
        // 使用 href 和 target 的方式设置，保留浏览器中键强制新标签页打开的特性
        var left = getHrefAndTarget(headerButtonOpL)
        link.href = left.href
        link.target = left.target
        switch (headerButtonOpL) {
          case 'op_openUserSetting':
            link.onclick = () => openUserSetting()
            break
          case 'op_openRemoveHistory':
            link.onclick = () => openRemoveHistory()
            break
        }
        // 鼠标右键点击
        watchlater.oncontextmenu = function(e) {
          if (headerButtonOpR != 'op_noOperation') {
            e && e.preventDefault && e.preventDefault()
          }
          switch (headerButtonOpR) {
            case 'op_openListInCurrent':
            case 'op_openListInNew':
            case 'op_playAllInCurrent':
            case 'op_playAllInNew':
              var right = getHrefAndTarget(headerButtonOpR)
              window.open(right.href, right.target)
              break
            case 'op_openUserSetting':
              openUserSetting()
              break
            case 'op_openRemoveHistory':
              openRemoveHistory()
              break
          }
        }

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
        url: URL.api_queryWatchlaterList,
        onload: function(response) {
          if (response && response.responseText) {
            try {
              var json = JSON.parse(response.responseText)
              var watchlaterList = json.data.list
              var av = oVue.aid
              for (var e of watchlaterList) {
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
          base.id = 'gm-base'
          base.target = '_blank'
        } else {
          base = document.head.querySelector('base#gm-base')
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
      if (!(o.callback instanceof Function)) {
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
})()
