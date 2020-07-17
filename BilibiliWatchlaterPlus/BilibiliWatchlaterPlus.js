// ==UserScript==
// @id              BilibiliWatchlaterPlus@Laster2800
// @name            B站稍后再看功能增强
// @version         2.6.0.20200717
// @namespace       laster2800
// @author          Laster2800
// @description     B站稍后再看功能增强，目前功能包括UI增强、稍后再看模式自动切换至普通模式播放（重定向）、稍后再看移除记录等，支持功能设置
// @homepage        https://greasyfork.org/zh-CN/scripts/395456
// @supportURL      https://greasyfork.org/zh-CN/scripts/395456/feedback
// @include         *://www.bilibili.com/*
// @include         *://message.bilibili.com/*
// @include         *://search.bilibili.com/*
// @include         *://space.bilibili.com/*
// @include         *://t.bilibili.com/*
// @include         *://account.bilibili.com/*
// @exclude         *://message.bilibili.com/pages/*
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @connect         api.bilibili.com
// @run-at          document-start
// ==/UserScript==

(function() {
  'use strict'

  // 全局对象
  var gm = {
    id: 'gm395456',
    configVersion: GM_getValue('configVersion'), // 配置版本，为执行初始化的代码版本对应的配置版本号
    configUpdate: 20200717.1, // 当前版本对应的配置版本号；若同一天修改多次，可以追加小数来区分
    config: {
      redirect: false,
    },
  }

  initAtDocumentStart()
  if (urlMatch(/bilibili.com\/medialist\/play\/watchlater(?=\/|$)/)) {
    if (gm.config.redirect) { // 重定向，document-start 就执行，尽可能快地将原页面掩盖过去
      fnRedirect()
    }
  }

  // 脚本的其他部分推迟至 DOMContentLoaded 执行
  document.addEventListener('DOMContentLoaded', () => {
    init()
    updateVersion()
    readConfig()
    addScriptMenu()
    // 所有页面
    if (gm.config.headerButton) {
      fnHeaderButton()
    }
    if (urlMatch(gm.regex.page_watchlaterList)) {
      // 列表页面
      fnOpenListVideo()
      createWatchlaterListUI()
      if (gm.config.removeHistory) {
        saveWatchlaterListData()
      }
    } else if (urlMatch(gm.regex.page_videoNormalMode)) {
      // 播放页面（正常模式）
      if (gm.config.videoButton) {
        fnVideoButton_Normal()
      }
    } else if (urlMatch(gm.regex.page_videoWatchlaterMode)) {
      // 播放页面（稍后再看模式）
      if (gm.config.videoButton) {
        fnVideoButton_Watchlater()
      }
    }
    addStyle()

    /* END OF PROC, BEGIN OF FUNCTION */

    /** 初始化 */
    function init() {
      gm.url = {
        api_queryWatchlaterList: 'https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp',
        api_addToWatchlater: 'https://api.bilibili.com/x/v2/history/toview/add',
        api_removeFromWatchlater: 'https://api.bilibili.com/x/v2/history/toview/del',
        page_watchlaterList: 'https://www.bilibili.com/watchlater/#/list',
        page_videoNormalMode: 'https://www.bilibili.com/video',
        page_videoWatchlaterMode: 'https://www.bilibili.com/medialist/play/watchlater',
        page_watchlaterPlayAll: 'https://www.bilibili.com/medialist/play/watchlater/p1',
        noop: 'javascript:void(0)',
      }

      gm.regex = {
        page_videoNormalMode: /bilibili.com\/video(|\/.*)$/,
        page_videoWatchlaterMode: /bilibili.com\/medialist\/play\/watchlater(?=\/|$)/,
        page_watchlaterList: /bilibili.com\/watchlater\/.*#.*\/list/,
      }

      gm.const = {
        // 移除记录历史次数的上下限
        rhsMin: 1,
        rhsMax: 64,
        // 渐变时间
        fadeTime: 400,
        textFadeTime: 100,
        // 通知时间
        messageTime: 3000,
      }

      gm.config = {
        ...gm.config,
        headerButton: true,
        openHeaderDropdownLink: 'ohdl_openInCurrent',
        headerButtonOpL: 'op_openListInCurrent',
        headerButtonOpR: 'op_openUserSetting',
        videoButton: true,
        openListVideo: 'olv_openInCurrent',
        removeHistory: true,
        removeHistorySaves: 16,
        removeHistorySearchTimes: 8,
        removeHistoryData: null, // 特殊处理
        reloadAfterSetting: true,
      }

      gm.menu = {
        // key: { state, el, openHandler, closeHandler }
        setting: { state: false },
        history: { state: false },
      }

      gm.el = {
        gmRoot: document.body.appendChild(document.createElement('div')),
        setting: null,
        history: null,
      }
      gm.el.gmRoot.id = gm.id
    }

    /** 版本更新处理 */
    function updateVersion() {
      if (gm.configVersion !== 0) {
        if (gm.configVersion === undefined && GM_getValue('gm395456') > 0) {
          // 2.6.0.20200717 版本重构
          for (var name in gm.config) {
            var oldName = 'gm395456_' + name
            var value = GM_getValue(oldName)
            GM_setValue(name, value)
            GM_deleteValue(oldName)
          }
          gm.configVersion = GM_getValue('gm395456')
          GM_setValue('configVersion', gm.configVersion)
          GM_deleteValue('gm395456')
        }
      }
    }

    /** 用户配置读取 */
    function readConfig() {
      // document-start 时期就处理过的配置
      var cfgDocumentStart = { redirect: true }
      if (gm.configVersion > 0) {
        // 对配置进行校验
        // 需特殊处理，不进行回写的配置
        var cfgNoWriteBack = { removeHistorySearchTimes: true, removeHistoryData: true }
        for (var name in gm.config) {
          if (!cfgDocumentStart[name]) {
            gm.config[name] = gmValidate(name, gm.config[name], !cfgNoWriteBack[name])
          }
        }
        // 特殊处理
        if (gm.config.removeHistorySearchTimes > gm.config.removeHistorySaves) {
          gm.config.removeHistorySearchTimes = gm.config.removeHistorySaves
          GM_setValue('removeHistorySearchTimes', gm.config.removeHistorySearchTimes)
        }
        if (!gm.config.removeHistoryData) {
          gm.config.removeHistoryData = new PushQueue(gm.config.removeHistorySaves, gm.const.rhsMax)
          GM_setValue('removeHistoryData', gm.config.removeHistoryData)
        } else {
          Object.setPrototypeOf(gm.config.removeHistoryData, PushQueue.prototype) // 还原类型信息
        }
      } else {
        // 用户强制初始化，或者第一次安装脚本
        gm.configVersion = 0
        gm.config.removeHistoryData = new PushQueue(gm.config.removeHistorySaves, gm.const.rhsMax)
        for (name in gm.config) {
          if (!cfgDocumentStart[name]) {
            GM_setValue(name, gm.config[name])
          }
        }
      }
    }

    /** 添加脚本菜单 */
    function addScriptMenu() {
      // 用户配置设置
      GM_registerMenuCommand('用户设置', openUserSetting)
      if (!gm.configVersion) { // 初始化
        openUserSetting(true)
      }
      // 稍后再看移除记录
      if (gm.config.removeHistory) {
        GM_registerMenuCommand('显示稍后再看移除记录', openRemoveHistory)
      }
      // 强制初始化
      GM_registerMenuCommand('重置脚本数据', resetScript)
    }

    /** 顶栏中加入稍后再看入口 */
    function fnHeaderButton() {
      executeAfterElementLoad({
        selector: '.user-con.signin',
        callback: header => {
          if (header) {
            var collect = header.children[4]
            var watchlater = header.children[6].cloneNode(true)
            var link = watchlater.firstChild
            var text = link.firstChild
            text.innerText = '稍后再看'
            header.insertBefore(watchlater, collect)

            executeLeftClick(link)
            executeRightClick(watchlater)
            executeTooltip(collect, watchlater)
          }
        },
      })

      /** 处理鼠标左键点击 */
      var executeLeftClick = link => {
        // 使用 href 和 target 的方式设置，保留浏览器中键强制新标签页打开的特性
        var left = getHrefAndTarget(gm.config.headerButtonOpL)
        link.href = left.href
        link.target = left.target
        switch (gm.config.headerButtonOpL) {
          case 'op_openUserSetting':
            link.onclick = () => openUserSetting()
            break
          case 'op_openRemoveHistory':
            link.onclick = () => openRemoveHistory()
            break
        }
      }

      /** 处理鼠标右键点击 */
      var executeRightClick = watchlater => {
        watchlater.oncontextmenu = function(e) {
          if (gm.config.headerButtonOpR != 'op_noOperation') {
            e && e.preventDefault && e.preventDefault()
          }
          switch (gm.config.headerButtonOpR) {
            case 'op_openListInCurrent':
            case 'op_openListInNew':
            case 'op_playAllInCurrent':
            case 'op_playAllInNew':
              var right = getHrefAndTarget(gm.config.headerButtonOpR)
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
      }

      /** 处理弹出菜单 */
      function executeTooltip(collect, watchlater) {
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
                callback: watchlaterPanel => {
                  watchlaterPanel.parentNode.addEventListener('click', () => {
                    setTimeout(() => {
                      var target = gm.config.openHeaderDropdownLink == 'ohdl_openInNew' ? '_blank' : '_self'
                      var links = document.querySelectorAll('[role=tooltip][aria-hidden=false] .favorite-video-panel a')
                      for (var link of links) {
                        link.target = target
                      }
                    }, 200)
                  })
                  watchlaterPanel.parentNode.click()
                },
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

      function getHrefAndTarget(op) {
        var href = ''
        if (/openList/i.test(op)) {
          href = gm.url.page_watchlaterList
        } else if (/playAll/.test(op)) {
          href = gm.url.page_watchlaterPlayAll
        } else {
          href = gm.url.noop
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
    }

    /** 常规播放页加入快速切换稍后再看状态的按钮 */
    function fnVideoButton_Normal() {
      /** 继续执行的条件 */
      var executeCondition = () => {
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
      }

      executeAfterConditionPass({
        condition: executeCondition,
        callback: ([atr, original]) => {
          var oVue = original.__vue__
          var btn = document.createElement('label')
          btn.id = `${gm.id}-normal-video-btn`
          var cb = document.createElement('input')
          cb.type = 'checkbox'
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
              callback: () => { cb.checked = checked },
              interval: 50,
              timeout: 500,
              onTimeout: () => {
                cb.checked = oVue.added
                message(checked ? '添加至稍后再看失败' : '从稍后再看移除失败')
              },
            })
          }
          btn.appendChild(text)
          atr.appendChild(btn)
          original.parentNode.style.display = 'none'
          setButtonStatus(oVue, cb)
        },
      })

      /** 设置按钮的稍后再看状态 */
      var setButtonStatus = (oVue, cb) => {
        // oVue.added 第一次取到的值总是 false，从页面无法获取到该视频是否已经在稍后再看列表中，需要使用API查询
        GM_xmlhttpRequest({
          method: 'GET',
          url: gm.url.api_queryWatchlaterList,
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
    }

    /** 稍后再看播放页加入快速切换稍后再看状态的按钮 */
    function fnVideoButton_Watchlater() {
      var aidMap = new Map()

      /** 继续执行的条件 */
      var executeCondition = () => {
        // 必须在确定 Vue 加载完成后再修改 DOM 结构，否则会导致 Vue 加载出错造成页面错误
        var app = document.querySelector('#app')
        var vueLoad = app && app.__vue__
        if (!vueLoad) {
          return false
        }
        return app.querySelector('#playContainer .left-container .play-options .play-options-more')
      }

      executeAfterConditionPass({
        condition: executeCondition,
        callback: more => {
          var btn = document.createElement('label')
          btn.id = `${gm.id}-watchlater-video-btn`
          btn.onclick = e => e.stopPropagation()
          var cb = document.createElement('input')
          cb.type = 'checkbox'
          btn.appendChild(cb)
          var text = document.createElement('span')
          text.innerText = '稍后再看'
          btn.appendChild(text)
          more.appendChild(btn)

          var added = true
          cb.checked = true // 默认在稍后再看中

          var csrf = getCsrf()
          cb.onclick = async () => { // 不要附加到 btn 上，否则点击时会执行两次
            var aid = await getAid()
            if (!aid) {
              cb.checked = added
              message('网络错误，操作失败')
              return
            }
            var data = new FormData()
            data.append('aid', aid)
            data.append('csrf', csrf)
            GM_xmlhttpRequest({
              method: 'POST',
              url: added ? gm.url.api_removeFromWatchlater : gm.url.api_addToWatchlater,
              data: data,
              onload: function(response) {
                try {
                  var note = added ? '从稍后再看移除' : '添加到稍后再看'
                  if (JSON.parse(response.response).code == 0) {
                    added = !added
                    cb.checked = added
                    message(note + '成功')
                  } else {
                    cb.checked = added
                    message(`网络错误，${note}失败`)
                  }
                } catch (e) {
                  console.error(`网络连接错误，重置脚本数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`)
                  console.error(e)
                }
              }
            })
          }
        },
      })

      /** 获取 CSRF */
      var getCsrf = () => {
        var cookies = document.cookie.split('; ')
        cookies = cookies.reduce((prev, val) => {
          var parts = val.split('=')
          var key = parts[0]
          var value = parts[1]
          prev[key] = value
          return prev
        }, {})
        var csrf = cookies.bili_jct
        return csrf
      }

      /** 获取当前页面对应的 aid */
      var getAid = async () => {
        var bvid = await getBvid()
        var aid = aidMap.get(bvid)
        if (aid) {
          return aid
        }
        
        // 用笨方法查算了，那套算法太烦，不想弄过来
        // 这里不能根据分P来推测 aid，因为因为该功能的引入，分P不一定对得上真正的列表
        return new Promise(resolve => {
          GM_xmlhttpRequest({
            method: 'GET',
            url: gm.url.api_queryWatchlaterList,
            onload: function(response) {
              try {
                var json = JSON.parse(response.responseText)
                var watchlaterList = json.data.list
                var aid = null
                for (var e of watchlaterList) {
                  if (bvid == e.bvid) {
                    aid = e.aid
                    break
                  }
                }
                if (aid) {
                  aidMap.set(bvid, aid)
                }
                resolve(aid)
              } catch (e) {
                console.error(`网络连接错误，重置脚本数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`)
                console.error(e)
              }
            },
          })
        })
      }

      /** 获取当前页面的 bvid */
      var getBvid = async () => {
        return new Promise(resolve => {
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
            callback: bvid => resolve(bvid)
          })
        })
      }
    }

    /** 处理列表页面点击视频时的行为 */
    function fnOpenListVideo() {
      if (gm.config.openListVideo == 'olv_openInNew') {
        // 如果列表页面在新标签页打开视频
        var base = document.head.appendChild(document.createElement('base'))
        base.id = 'gm-base'
        base.target = '_blank'
      }
    }

    /** 保存列表页面数据，用于生成移除记录 */
    function saveWatchlaterListData() {
      GM_xmlhttpRequest({
        method: 'GET',
        url: gm.url.api_queryWatchlaterList,
        onload: function(response) {
          if (response && response.responseText) {
            var current = []
            try {
              var json = JSON.parse(response.responseText)
              var watchlaterList = json.data.list
              for (var e of watchlaterList) {
                current.push({
                  title: e.title,
                  bvid: e.bvid,
                })
              }
              gm.config.removeHistoryData.push(current)
              GM_setValue('removeHistoryData', gm.config.removeHistoryData)
            } catch (e) {
              console.error(`保存稍后再看列表错误，重置脚本数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`)
              console.error(e)
            }
          }
        }
      })
    }

    /** 生成列表页面的 UI */
    function createWatchlaterListUI() {
      var r_con = document.querySelector('.watch-later-list.bili-wrapper header .r-con')
      if (gm.config.removeHistory) {
        // 在列表页面加入“移除记录”
        var removeHistoryButton = r_con.appendChild(document.createElement('div'))
        removeHistoryButton.innerText = '移除记录'
        removeHistoryButton.className = 's-btn'
        removeHistoryButton.onclick = () => openRemoveHistory() // 要避免 MouseEvent 的传递
      }
      // 在列表页面加如“增强设置”
      var plusButton = r_con.appendChild(document.createElement('div'))
      plusButton.innerText = '增强设置'
      plusButton.className = 's-btn'
      plusButton.onclick = () => openUserSetting() // 要避免 MouseEvent 的传递
    }

    /**
     * 打开用户设置
     *
     * @param {boolean} initial 是否进行初始化设置
     */
    function openUserSetting(initial) {
      if (gm.el.setting) {
        openMenuItem('setting')
      } else {
        var el = {}
        setTimeout(() => {
          initSetting()
          handleConfigItem()
          handleSettingItem()
          openMenuItem('setting')
        })

        /** 设置页面初始化 */
        var initSetting = () => {
          gm.el.setting = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.setting.el = gm.el.setting
          gm.el.setting.className = 'gm-setting'
          gm.el.setting.innerHTML = `
<div class="gm-setting-page">
    <div class="gm-title">
        <div id="gm-maintitle" onclick="window.open('${GM_info.script.homepage}')" title="${GM_info.script.homepage}">B站稍后再看功能增强</div>
        <div class="gm-subtitle">V${GM_info.script.version} by ${GM_info.script.author}</div>
    </div>
    <div class="gm-items">
        <div class="gm-item">
            <label title="在顶栏“动态”和“收藏”之间加入稍后再看入口，鼠标移至上方时弹出列表菜单，支持点击功能设置">
                <span>【所有页面】在顶栏中加入稍后再看入口</span><input id="gm-headerButton" type="checkbox"></label>
            <div class="gm-subitem" title="选择在下拉菜单中点击视频的行为">
                <span>在下拉菜单中点击视频时</span>
                <select id="gm-openHeaderDropdownLink">
                    <option value="ohdl_openInCurrent">在当前页面打开</option>
                    <option value="ohdl_openInNew">在新标签页打开</option>
                </select>
            </div>
            <div class="gm-subitem" title="选择左键点击入口时执行的操作">
                <span>在入口上点击鼠标左键时</span>
                <select id="gm-headerButtonOpL"></select>
            </div>
            <div class="gm-subitem" title="选择右键点击入口时执行的操作">
                <span>在入口上点击鼠标右键时</span>
                <select id="gm-headerButtonOpR"></select>
            </div>
        </div>
        <label class="gm-item" title="在播放页面（包括普通模式和稍后再看模式）中加入能将视频快速切换添加或移除出稍后再看列表的按钮">
            <span>【播放页面】加入快速切换视频稍后再看状态的按钮</span><input id="gm-videoButton" type="checkbox"></label>
        <label class="gm-item" title="是否自动从【www.bilibili.com/medialist/play/watchlater/p*】页面切换至【www.bilibili.com/video/BV*】页面播放">
            <span>【播放页面】从稍后再看模式切换到普通模式播放</span><input id="gm-redirect" type="checkbox"></label>
        <label class="gm-item" title="选择【www.bilibili.com/watchlater/#/list】页面点击视频时的行为">
            <span>【列表页面】点击视频时</span>
            <select id="gm-openListVideo">
                <option value="olv_openInCurrent">在当前页面打开</option>
                <option value="olv_openInNew">在新标签页打开</option>
            </select>
        </label>
        <div class="gm-item">
            <label title="保留最近几次打开【www.bilibili.com/watchlater/#/list】页面时稍后再看列表的记录，以查找出这段时间内将哪些视频移除出稍后再看，用于防止误删操作。关闭该选项后，会将内部历史数据清除！">
                <span>【列表页面】开启稍后再看移除记录（防误删）</span><input id="gm-removeHistory" type="checkbox"></label>
            <div class="gm-subitem" title="请不要设置过大的数值，否则会带来较大的开销。该项修改后，会立即对过时记录进行清理，重新修改为原来的值无法还原被清除的记录，设置为比原来小的值需慎重！范围：${gm.const.rhsMin} ~ ${gm.const.rhsMax}。">
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

          el.save = gm.el.setting.querySelector('#gm-save')
          el.cancel = gm.el.setting.querySelector('#gm-cancel')
          el.shadow = gm.el.setting.querySelector('.gm-shadow')
          el.reset = gm.el.setting.querySelector('#gm-reset')
          el.reset.onclick = resetScript

          // 找出配置对应的元素
          for (var name in gm.config) {
            el[name] = gm.el.setting.querySelector('#gm-' + name)
          }

          el.headerButtonOpL.innerHTML = el.headerButtonOpR.innerHTML = `
<option value="op_openListInCurrent">在当前页面打开列表页面</option>
<option value="op_openListInNew">在新标签页打开列表页面</option>
<option value="op_playAllInCurrent">在当前页面播放全部</option>
<option value="op_playAllInNew">在新标签页播放全部</option>
<option value="op_openUserSetting">打开用户设置</option>
<option value="op_openRemoveHistory">打开稍后再看移除记录</option>
<option value="op_noOperation">不执行操作</option>
        `
        }

        /** 维护与设置项相关的数据和元素 */
        var handleConfigItem = () => {
          // 子项与父项相关联
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
          el.headerButton.onchange = function() {
            subitemChange(this, [el.openHeaderDropdownLink, el.headerButtonOpL, el.headerButtonOpR])
          }
          el.removeHistory.onchange = function() {
            subitemChange(this, [el.removeHistorySaves, el.removeHistorySearchTimes])
          }

          // 输入框内容处理
          el.removeHistorySaves.oninput = function() {
            var v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              var value = parseInt(v0)
              if (value > gm.const.rhsMax) {
                value = gm.const.rhsMax
              } else if (value < gm.const.rhsMin) {
                value = gm.const.rhsMin
              }
              this.value = value
            }
          }
          el.removeHistorySaves.onblur = function() {
            if (this.value === '') {
              this.value = el.removeHistorySearchTimes.value
            }
            if (parseInt(el.removeHistorySearchTimes.value) > parseInt(this.value)) {
              el.removeHistorySearchTimes.value = this.value
            }
          }
          el.removeHistorySearchTimes.oninput = function() {
            var v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              var value = parseInt(v0)
              if (value > gm.const.rhsMax) {
                value = gm.const.rhsMax
              } else if (value < gm.const.rhsMin) {
                value = gm.const.rhsMin
              }
              this.value = value
            }
          }
          el.removeHistorySearchTimes.onblur = function() {
            if (this.value === '') {
              this.value = el.removeHistorySaves.value
            } else if (parseInt(el.removeHistorySaves.value) < parseInt(this.value)) {
              el.removeHistorySaves.value = this.value
            }
          }
        }

        /** 处理与设置页面相关的数据和元素 */
        var handleSettingItem = () => {
          el.save.onclick = onSave
          gm.menu.setting.openHandler = onOpen
          el.cancel.onclick = () => closeMenuItem('setting')
          el.shadow.onclick = function() {
            if (!this.getAttribute('disabled')) {
              closeMenuItem('setting')
            }
          }
          if (initial) {
            el.reset.style.display = 'none'
            el.cancel.disabled = true
            el.shadow.setAttribute('disabled', 'disabled')
          }
        }

        /** 设置保存时执行 */
        var onSave = () => {
          gm.config.headerButton = el.headerButton.checked
          GM_setValue('headerButton', gm.config.headerButton)
          gm.config.openHeaderDropdownLink = el.openHeaderDropdownLink.value
          GM_setValue('openHeaderDropdownLink', gm.config.openHeaderDropdownLink)
          gm.config.headerButtonOpL = el.headerButtonOpL.value
          GM_setValue('headerButtonOpL', gm.config.headerButtonOpL)
          gm.config.headerButtonOpR = el.headerButtonOpR.value
          GM_setValue('headerButtonOpR', gm.config.headerButtonOpR)

          gm.config.videoButton = el.videoButton.checked
          GM_setValue('videoButton', gm.config.videoButton)

          gm.config.redirect = el.redirect.checked
          GM_setValue('redirect', gm.config.redirect)

          gm.config.openListVideo = el.openListVideo.value
          GM_setValue('openListVideo', gm.config.openListVideo)

          var resetMaxSize = gm.config.removeHistory != el.removeHistory.checked
          gm.config.removeHistory = el.removeHistory.checked
          GM_setValue('removeHistory', gm.config.removeHistory)
          if (gm.config.removeHistory) {
            var rhsV = parseInt(el.removeHistorySaves.value)
            if (rhsV != gm.config.removeHistorySaves && !isNaN(rhsV)) {
              gm.config.removeHistoryData.setMaxSize(rhsV)
              gm.config.removeHistorySaves = rhsV
              GM_setValue('removeHistorySaves', gm.config.removeHistorySaves)
              GM_setValue('removeHistoryData', gm.config.removeHistoryData)
            } else if (resetMaxSize) {
              gm.config.removeHistoryData.setMaxSize(rhsV)
              GM_setValue('removeHistoryData', gm.config.removeHistoryData)
            }
            var rhstV = parseInt(el.removeHistorySearchTimes.value)
            if (rhstV != gm.config.removeHistorySearchTimes && !isNaN(rhstV)) {
              gm.config.removeHistorySearchTimes = rhstV
              GM_setValue('removeHistorySearchTimes', gm.config.removeHistorySearchTimes)
            }
          } else if (resetMaxSize) {
            gm.config.removeHistoryData.setMaxSize(0)
            GM_setValue('removeHistoryData', gm.config.removeHistoryData)
          }

          gm.config.reloadAfterSetting = el.reloadAfterSetting.checked
          GM_setValue('reloadAfterSetting', gm.config.reloadAfterSetting)

          closeMenuItem('setting')
          if (initial) {
            // 更新配置版本
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
            // 关闭初始化状态
            setTimeout(() => {
              el.reset.style.display = 'unset'
              el.cancel.disabled = false
              el.shadow.removeAttribute('disabled')
            }, gm.const.fadeTime)
          }

          if (gm.config.reloadAfterSetting) {
            location.reload()
          }
        }

        /** 设置打开时执行 */
        var onOpen = () => {
          el.headerButton.checked = gm.config.headerButton
          el.openHeaderDropdownLink.value = gm.config.openHeaderDropdownLink
          el.headerButtonOpL.value = gm.config.headerButtonOpL
          el.headerButtonOpR.value = gm.config.headerButtonOpR
          el.headerButton.onchange()
          el.videoButton.checked = gm.config.videoButton
          el.redirect.checked = gm.config.redirect
          el.openListVideo.value = gm.config.openListVideo
          el.removeHistory.checked = gm.config.removeHistory
          el.removeHistorySaves.value = gm.config.removeHistorySaves
          el.removeHistorySearchTimes.value = gm.config.removeHistorySearchTimes
          el.removeHistory.onchange()
          el.reloadAfterSetting.checked = gm.config.reloadAfterSetting
        }
      }
    }

    /** 打开移除记录 */
    function openRemoveHistory() {
      var el = {}
      el.searchTimes = null
      if (gm.el.history) {
        el.searchTimes = gm.el.history.querySelector('#gm-search-times')
        el.searchTimes.current = gm.config.removeHistorySearchTimes < gm.config.removeHistoryData.size ? gm.config.removeHistorySearchTimes : gm.config.removeHistoryData.size
        el.searchTimes.value = el.searchTimes.current
        openMenuItem('history')
      } else {
        setTimeout(() => {
          historyInit()
          handleItem()
          openMenuItem('history')
        })

        /** 初始化移除记录页面 */
        var historyInit = () => {
          gm.el.history = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.history.el = gm.el.history
          gm.el.history.className = 'gm-history'
          gm.el.history.innerHTML = `
<div class="gm-history-page">
    <div class="gm-title">稍后再看移除记录</div>
    <div class="gm-comment">
        <div>根据最近<span id="gm-save-times">X</span>次打开列表页面时获取到的<span id="gm-record-num">X</span>条记录生成，共筛选出<span id="gm-remove-num">X</span>条移除记录。排序由首次加入到稍后再看的顺序决定，与移除出稍后再看的时间无关。如果记录太多难以定位被误删的视频，请在下方设置减少历史回溯深度。鼠标移动到内容区域可向下滚动翻页，点击对话框以外的位置退出。</div>
        <div style="text-align:right;font-weight:bold;margin-right:1em" title="搜寻时在最近多少次列表页面数据中查找，设置较小的值能较好地定位最近移除的视频。按下回车键或输入框失去焦点时刷新数据。">历史回溯深度：<input type="text" id="gm-search-times" value="X"></div>
    </div>
</div>
<div class="gm-shadow"></div>
`
          el.historyPage = gm.el.history.querySelector('.gm-history-page')
          el.comment = gm.el.history.querySelector('.gm-comment')
          el.content = null
          el.saveTimes = gm.el.history.querySelector('#gm-save-times')
          el.recordNum = gm.el.history.querySelector('#gm-record-num')
          el.removeNum = gm.el.history.querySelector('#gm-remove-num')
          el.shadow = gm.el.history.querySelector('.gm-shadow')
        }

        /** 维护内部元素和数据 */
        var handleItem = () => {
          // 使用 el.searchTimes.current 代替本地变量记录数据，可以保证任何情况下闭包中都能获取到正确数据
          el.searchTimes = gm.el.history.querySelector('#gm-search-times')
          el.searchTimes.current = gm.config.removeHistorySearchTimes < gm.config.removeHistoryData.size ? gm.config.removeHistorySearchTimes : gm.config.removeHistoryData.size
          el.searchTimes.value = el.searchTimes.current

          var stMax = gm.config.removeHistoryData.size
          var stMin = 1
          el.searchTimes.oninput = function() {
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
          el.searchTimes.onblur = function() {
            if (this.value === '') {
              this.value = stMax
            }
            if (this.value != el.searchTimes.current) {
              el.searchTimes.current = this.value
              gm.menu.history.openHandler()
            }
          }
          el.searchTimes.onkeyup = function(e) {
            if (e.keyCode == 13) {
              this.onblur()
            }
          }

          gm.menu.history.openHandler = onOpen
          window.addEventListener('resize', setContentTop)
          el.shadow.onclick = () => {
            closeMenuItem('history')
          }
        }

        /** 移除记录打开时执行 */
        var onOpen = () => {
          if (el.content) {
            var oldContent = el.content
            oldContent.style.opacity = '0'
            setTimeout(() => {
              oldContent.remove()
            }, gm.const.textFadeTime)
          }
          el.content = el.historyPage.appendChild(document.createElement('div'))
          el.content.className = 'gm-content'

          GM_xmlhttpRequest({
            method: 'GET',
            url: gm.url.api_queryWatchlaterList,
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
                  var removeData = gm.config.removeHistoryData.toArray(el.searchTimes.current)
                  el.saveTimes.innerText = removeData.length
                  for (var i = removeData.length - 1; i >= 0; i--) { // 后面的数据较旧，从后往前遍历
                    for (var record of removeData[i]) {
                      map.set(record.bvid, record)
                    }
                  }
                  el.recordNum.innerText = map.size
                  for (var id of bvid) {
                    map.delete(id)
                  }
                  var result = []
                  for (var rm of map.values()) {
                    result.push(`<span>${rm.title}</span><br><a href="${gm.url.page_videoNormalMode}/${rm.bvid}" target="_blank">${rm.bvid}</a>`)
                  }
                  el.removeNum.innerText = result.length

                  setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
                  if (result.length > 0) {
                    el.content.innerHTML = result.join('<br><br>')
                  } else {
                    el.content.innerText = `在最近 ${el.searchTimes.current} 次列表页面数据中没有找到被移除的记录，请尝试增大历史回溯深度`
                    el.content.style.color = 'gray'
                  }
                  el.content.style.opacity = '1'
                } catch (e) {
                  var errorInfo = `网络连接错误，重置脚本数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`
                  setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
                  el.content.innerHTML = errorInfo
                  el.content.style.opacity = '1'
                  el.content.style.color = 'gray'

                  console.error(errorInfo)
                  console.error(e)
                }
              }
            }
          })
        }

        var setContentTop = () => {
          if (el.content) {
            el.content.style.top = el.comment.offsetTop + el.comment.offsetHeight + 'px'
          }
        }
      }
    }

    /** 重置脚本数据 */
    function resetScript() {
      var result = confirm('是否要重置脚本数据？')
      if (result) {
        var gmKeys = GM_listValues()
        for (var gmKey of gmKeys) {
          GM_deleteValue(gmKey)
        }

        gm.configVersion = 0
        GM_setValue('configVersion', gm.configVersion)
        location.reload()
      }
    }

    /** 对“打开菜单项”这一操作进行处理，包括显示菜单项、设置当前菜单项的状态、关闭其他菜单项 */
    function openMenuItem(name) {
      if (!gm.menu[name].state) {
        for (var key in gm.menu) {
          var menu = gm.menu[key]
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

    /** 对“关闭菜单项”这一操作进行处理，包括隐藏菜单项、设置当前菜单项的状态 */
    function closeMenuItem(name) {
      var menu = gm.menu[name]
      if (menu.state) {
        menu.state = false
        fade(false, menu.el)
        menu.closeHandler && setTimeout(() => {
          menu.closeHandler()
        }, gm.const.fadeTime)
      }
    }

    /**
     * 用户通知
     *
     * @param {string} msg 信息
     * @param {number} [ms=gm.const.messageTime] 显示时间（单位：ms）
     * @param {boolean} [html=false] 是否将 msg 理解为 HTML
     */
    function message(msg, ms = gm.const.messageTime, html = false) {
      var msgbox = document.body.appendChild(document.createElement('div'))
      msgbox.id = `${gm.id}-msgbox`
      if (html) {
        msgbox.innerHTML = msg
      } else {
        msgbox.innerText = msg
      }
      fade(true, msgbox)
      setTimeout(() => {
        fade(false, msgbox)
        setTimeout(() => msgbox.remove(), gm.const.fadeTime)
      }, ms - 2 * gm.const.fadeTime)
    }

    /**
     * 处理 HTML 元素的渐显和渐隐
     * @param {boolean} inOut 渐显/渐隐
     * @param {HTMLElement} target HTML 元素
     */
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
        }, gm.const.fadeTime)
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
     * @param {Function} options.condition 条件，当 condition() 返回的 result 为真值时满足条件
     * @param {Function} options.callback 当满足条件时执行 callback(result)
     * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
     * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
     * @param {Function} options.onTimeout 检测超时时执行 onTimeout()
     * @param {Function} options.stopCondition 终止条件，当 stopCondition() 返回的 stopResult 为真值时终止检测
     * @param {Function} options.stopCallback 终止条件达成时执行 stopCallback()（包括终止条件的二次判断达成）
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
     * @param {Function} options.selector 该选择器指定要等待加载的元素 element
     * @param {Function} options.callback 当 element 加载成功时执行 callback(element)
     * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
     * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
     * @param {Function} options.onTimeout 检测超时时执行 onTimeout()
     * @param {Function} options.stopCondition 该选择器指定终止元素 stopElement，若该元素加载成功则终止检测
     * @param {Function} options.stopCallback 终止元素加载成功后执行 stopCallback()（包括终止元素的二次加载）
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
     * @returns {Object} 弹出的数据
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
     * @returns {Array} 队列数据的数组形式
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
      for (var i = this.index - 1; i >= end && i >= 0; i--) {
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
      if (this.size > 0) {
        var start = this.index - 1
        var end = this.index - this.size
        if (end < 0) {
          end += this.capacity
        }
        if (start >= end) {
          for (var i = 0; i < end; i++) {
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

    /** 添加脚本样式 */
    function addStyle() {
      GM_addStyle(`
#${gm.id} .gm-setting {
    font-size: 12px;
    transition: opacity ${gm.const.fadeTime}ms ease-in-out;
    opacity: 0;
    display: none;
    position: fixed;
    z-index: 10000;
}
#${gm.id} .gm-setting .gm-setting-page {
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
#${gm.id} .gm-setting #gm-maintitle {
    cursor: pointer;
}
#${gm.id} .gm-setting #gm-maintitle:hover {
    color: #0075FF;
}
#${gm.id} .gm-setting .gm-items {
    margin: 0 2.2em;
    font-size: 1.2em;
}
#${gm.id} .gm-setting .gm-item {
    display: block;
    padding: 0.4em;
}
#${gm.id} .gm-setting .gm-subitem {
    display: block;
    margin-left: 6em;
    margin-top: 0.3em;
}
#${gm.id} .gm-setting .gm-item:hover {
    color: #0075FF;
}
#${gm.id} .gm-setting .gm-subitem[disabled] {
    color: gray;
}
#${gm.id} .gm-setting .gm-subitem:hover:not([disabled]) {
    color: #0075FF;
}
#${gm.id} .gm-setting input[type=checkbox] {
    vertical-align: middle;
    margin: 3px 0 0 10px;
    float: right;
}
#${gm.id} .gm-setting input[type=text] {
    float: right;
    border-width: 0 0 1px 0;
    width: 2em;
    text-align: right;
    padding: 0 0.2em;
    margin-right: -0.2em;
}
#${gm.id} .gm-setting select {
    border-width: 0 0 1px 0;
    cursor: pointer;
}
#${gm.id} .gm-setting .gm-bottom {
    margin: 0.8em 2em 1.8em 2em;
    text-align: center;
}
#${gm.id} .gm-setting .gm-bottom button {
    font-size: 1em;
    padding: 0.2em 0.8em;
    margin: 0 0.6em;
    cursor: pointer;
}
#${gm.id} .gm-setting .gm-bottom button[disabled] {
    cursor: not-allowed;
}

#${gm.id} .gm-history {
    transition: opacity ${gm.const.fadeTime}ms ease-in-out;
    opacity: 0;
    display: none;
    position: fixed;
    z-index: 10000;
}
#${gm.id} .gm-history .gm-history-page {
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
#${gm.id} .gm-history .gm-comment {
    margin: 0 2em;
    color: gray;
    text-indent: 2em;
}
#${gm.id} .gm-history .gm-comment span,
#${gm.id} .gm-history .gm-comment input {
    padding: 0 0.2em;
    font-weight: bold;
    color: #666666;
}
#${gm.id} .gm-history .gm-comment input{
    text-align: center;
    width: 3em;
    border-width: 0 0 1px 0;
}
#${gm.id} .gm-history .gm-content {
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
    transition: opacity ${gm.const.textFadeTime}ms ease-in-out;
}
#${gm.id} .gm-history .gm-content::-webkit-scrollbar {
    display: none;
}

#${gm.id} #gm-reset {
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 0.6em 0.8em;
    color: #b4b4b4;
    cursor: pointer;
}
#${gm.id} #gm-reset:hover {
    color: #666666;
}

#${gm.id} .gm-title {
    font-size: 1.6em;
    margin: 1.6em 0.8em 0.8em 0.8em;
    text-align: center;
}

#${gm.id} .gm-subtitle {
    font-size: 0.4em;
    margin-top: 0.4em;
}

#${gm.id} .gm-shadow {
    background: #000000b0;
    position: fixed;
    top: 0%;
    left: 0%;
    z-index: 10000;
    width: 100%;
    height: 100%;
}
#${gm.id} .gm-shadow[disabled] {
    cursor: auto;
}

#${gm.id} label {
    cursor: pointer;
}
#${gm.id} input,
#${gm.id} select {
    color: black;
}

#${gm.id} [disabled],
#${gm.id} [disabled] input,
#${gm.id} [disabled] select {
    cursor: not-allowed;
}

#${gm.id}-watchlater-video-btn {
    float: left;
    margin-right: 1em;
    cursor: pointer;
    font-size: 12px;
}
#${gm.id}-normal-video-btn input[type=checkbox],
#${gm.id}-watchlater-video-btn input[type=checkbox] {
    vertical-align: middle;
    margin: 0 2px 2px 0;
}

#${gm.id}-msgbox {
    position: absolute;
    top: 70%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 65535;
    background-color: #000000bf;
    font-size: 16px;
    color: white;
    padding: 0.5em 1em;
    border-radius: 0.6em;
    opacity: 0;
    transition: opacity ${gm.const.fadeTime}ms ease-in-out;
}
      `)
    }
  })

  // 一般情况下，读取用户配置；如果配置出错，则沿用默认值，并将默认值写入配置中
  function gmValidate(gmKey, defaultValue, writeBack = true) {
    var value = GM_getValue(gmKey)
    if (typeof value == typeof defaultValue) { // typeof null == 'object'，对象默认值赋 null 无需额外处理
      return value
    } else {
      if (writeBack) {
        GM_setValue(gmKey, defaultValue)
      }
      return defaultValue
    }
  }

  /** document-start 时期初始化 */
  function initAtDocumentStart() {
    // document-start 级用户配置读取
    if (gm.configVersion > 0) {
      gm.config.redirect = gmValidate('redirect', gm.config.redirect)
    } else {
      GM_setValue('redirect', gm.config.redirect)
    }
  }

  /** 稍后再看模式重定向至正常模式播放 */
  function fnRedirect() {
    window.stop() // 停止原页面的加载
    GM_xmlhttpRequest({
      method: 'GET',
      url: 'https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp',
      onload: function(response) {
        if (response && response.responseText) {
          try {
            var part = 1
            if (urlMatch(/watchlater\/p\d+/)) {
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
              gm.config.redirect = false
              GM_setValue('redirect', gm.config.redirect)
              location.reload()
            } else {
              location.replace('https://www.bilibili.com/watchlater/#/list')
            }
          }
        }
      }
    })
  }

  /**
   * 判断当前 URL 是否匹配
   *
   * @param {RegExp} reg 用于判断是否匹配的正则表达纯
   * @returns {boolean} 是否匹配
   */
  function urlMatch(reg) {
    return reg.test(location.href)
  }
})()
