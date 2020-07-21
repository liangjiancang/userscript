// ==UserScript==
// @id              BilibiliWatchlaterPlus@Laster2800
// @name            B站稍后再看功能增强
// @version         3.1.0.20200722
// @namespace       laster2800
// @author          Laster2800
// @description     B站稍后再看功能增强，目前功能包括UI增强、稍后再看模式自动切换至普通模式播放（重定向）、稍后再看移除记录等，支持功能设置
// @homepage        https://greasyfork.org/zh-CN/scripts/395456
// @supportURL      https://greasyfork.org/zh-CN/scripts/395456/feedback
// @include         *://www.bilibili.com/*
// @include         /^(.*):\/\/t\.bilibili\.com(\/([^\/]*\/?|pages\/nav\/index_new.*))?$/
// @include         *://message.bilibili.com/*
// @include         *://search.bilibili.com/*
// @include         *://space.bilibili.com/*
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

  /**
   * @typedef GMObject
   * @property {string} id 当前脚本的标识
   * @property {number} configVersion 配置版本，为执行初始化的代码版本对应的配置版本号
   * @property {number} configUpdate 当前版本对应的配置版本号；若同一天修改多次，可以追加小数来区分
   * @property {GMObject_config} config 用户配置
   * @property {GMObject_data} data 脚本数据
   * @property {GMObject_url} url URL
   * @property {GMObject_regex} regex 正则表达式
   * @property {GMObject_const} const 常量
   * @property {GMObject_menu} menu 菜单
   * @property {GMObject_error} error 错误信息
   */
  /**
   * @typedef GMObject_config
   * @property {boolean} headerButton 顶栏入口
   * @property {headerButtonOp} headerButtonOpL 顶栏入口左击行为
   * @property {headerButtonOp} headerButtonOpR 顶栏入口右击行为
   * @property {openHeaderMenuLink} openHeaderMenuLink 顶栏弹出菜单链接点击行为
   * @property {menuScrollbarSetting} menuScrollbarSetting 弹出菜单的滚动条设置
   * @property {boolean} videoButton 视频播放页稍后再看状态快速切换
   * @property {boolean} redirect 稍后再看模式重定向至普通模式播放
   * @property {openListVideo} openListVideo 列表页面视频点击行为
   * @property {boolean} removeHistory 稍后再看移除记录
   * @property {number} removeHistorySaves 列表页数数据保存次数
   * @property {number} removeHistorySearchTimes 历史回溯深度
   * @property {boolean} resetAfterFnUpdate 功能性更新后初始化
   * @property {boolean} reloadAfterSetting 设置生效后刷新页面
   */
  /**
   * @callback removeHistoryData 通过懒加载方式获取 `removeHistoryData`
   * @param {boolean} [remove] 是否将 `removeHistoryData` 移除
   * @returns {PushQueue} `removeHistoryData`
   */
  /**
   * @typedef GMObject_data
   * @property {removeHistoryData} removeHistoryData 为生成移除记录而保存的列表页面数据
   */
  /**
   * @typedef GMObject_url
   * @property {string} api_queryWatchlaterList 稍后再看列表数据
   * @property {string} api_addToWatchlater 将视频添加至稍后再看，要求 POST 一个含 aid 和 csrf 的表单
   * @property {string} api_removeFromWatchlater 将视频从稍后再看移除，要求 POST 一个含 aid 和 csrf 的表单
   * @property {string} page_watchlaterList 列表页面
   * @property {string} page_videoNormalMode 正常模式播放页
   * @property {string} page_videoWatchlaterMode 稍后再看模式播放页
   * @property {string} page_watchlaterPlayAll 稍后再看播放全部
   * @property {string} gm_changelog 更新日志
   * @property {string} noop 无操作
   */
  /**
   * @typedef GMObject_regex
   * @property {RegExp} page_videoNormalMode 匹配正常模式播放页
   * @property {RegExp} page_videoWatchlaterMode 匹配稍后再看播放页
   * @property {RegExp} page_watchlaterList 匹配列表页面
   * @property {RegExp} page_dynamicMenu 匹配顶栏动态入口菜单
   */
  /**
   * @typedef GMObject_const
   * @property {number} rhsMin 列表页面数据最小保存次数
   * @property {number} rhsMax 列表页面数据最大保存次数
   * @property {number} defaultRhs 列表页面数据的默认保存次数
   * @property {number} rhsWarning 列表页面数据保存数警告线
   * @property {number} fadeTime UI 渐变时间
   * @property {number} textFadeTime 文字渐变时间
   * @property {number} messageTime 默认信息显示时间
   * @property {string} messageTop 信息显示默认 `style.top`
   * @property {string} messageLeft 信息显示默认 `stele.left`
   */
  /**
   * @typedef GMObject_menu
   * @property {GMObject_menu_item} setting 设置
   * @property {GMObject_menu_item} history 移除记录
   */
  /**
   * @typedef GMObject_menu_item
   * @property {boolean} state 打开状态
   * @property {HTMLElement} el 菜单元素
   * @property {() => void} [openHandler] 打开菜单的回调函数
   * @property {() => void} [closeHandler] 关闭菜单的回调函数
   */
  /**
   * @typedef GMObject_error
   * @property {string} HTML_PARSING HTML 解析错误
   * @property {string} NETWORK 网络错误
   * @property {string} REDIRECT 重定向错误
   */
  /**
   * 全局对象
   * @type {GMObject}
   */
  var gm = {
    id: 'gm395456',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20200722,
    config: {
      redirect: false,
    },
    url: {
      api_queryWatchlaterList: 'https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp',
      page_videoNormalMode: 'https://www.bilibili.com/video',
      page_watchlaterList: 'https://www.bilibili.com/watchlater/#/list',
    },
    regex: {
      page_videoWatchlaterMode: /bilibili.com\/medialist\/play\/watchlater(?=\/|$)/,
    },
    error: {
      REDIRECT: `重定向错误，可能是网络问题，如果重新加载页面依然出错请联系脚本作者：${GM_info.script.supportURL}`,
    }
  }

  documentStartInit()
  if (urlMatch(gm.regex.page_videoWatchlaterMode)) {
    if (gm.config.redirect) { // 重定向，document-start 就执行，尽可能快地将原页面掩盖过去
      fnRedirect()
      return // 必须 return，否则后面的内容还会执行使得加载速度超级慢
    }
  }

  var enums = {
    /**
     * @readonly
     * @enum {string}
     */
    headerButtonOp: {
      openListInCurrent: 'openListInCurrent',
      openListInNew: 'openListInNew',
      playAllInCurrent: 'playAllInCurrent',
      playAllInNew: 'playAllInNew',
      openUserSetting: 'openUserSetting',
      openRemoveHistory: 'openRemoveHistory',
      noOperation: 'noOperation',
    },
    /**
     * @readonly
     * @enum {string}
     */
    openHeaderMenuLink: {
      openInCurrent: 'openInCurrent',
      openInNew: 'openInNew',
    },
    /**
     * @readonly
     * @enum {string}
     */
    menuScrollbarSetting: {
      beautify: 'beautify',
      hidden: 'hidden',
      original: 'original',
    },
    /**
     * @readonly
     * @enum {string}
     */
    openListVideo: {
      openInCurrent: 'openInCurrent',
      openInNew: 'openInNew',
    },
  }
  // 将名称不完全对应的补上，这样校验才能生效
  enums.headerButtonOpL = enums.headerButtonOpR = enums.headerButtonOp

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
    } else if (urlMatch(gm.regex.page_dynamicMenu)) {
      // 动态入口弹出菜单页面的处理
      addMenuScrollbarStyle()
      return
    }
    addStyle()

    /* END OF PROC, BEGIN OF FUNCTION */

    /**
     * 初始化
     */
    function init() {
      gm.url = {
        ...gm.url,
        api_addToWatchlater: 'https://api.bilibili.com/x/v2/history/toview/add',
        api_removeFromWatchlater: 'https://api.bilibili.com/x/v2/history/toview/del',
        page_videoWatchlaterMode: 'https://www.bilibili.com/medialist/play/watchlater',
        page_watchlaterPlayAll: 'https://www.bilibili.com/medialist/play/watchlater/p1',
        gm_changelog: 'https://greasyfork.org/zh-CN/scripts/395456-b站稍后再看功能增强/versions?show_all_versions=1',
        noop: 'javascript:void(0)',
      }

      gm.regex = {
        ...gm.regex,
        page_videoNormalMode: /\.com\/video(?=\/|$)/,
        page_watchlaterList: /\.com\/watchlater\/.*#.*\/list(?=\/|$)/,
        page_dynamicMenu: /\.com\/pages\/nav\/index_new#(?=\/|$)/,
      }

      gm.const = {
        ...gm.const,
        // 移除记录保存相关
        rhsMin: 1,
        rhsMax: 1024, // 经过性能测试，放宽到 1024 应该没有太大问题
        defaultRhs: 64, // 就目前的PC运算力，即使达到 gm.const.rhsWarning 且在极限情况下也不会有明显的卡顿
        rhsWarning: 256,
        // 渐变时间
        fadeTime: 400,
        textFadeTime: 100,
        // 信息框
        messageTime: 1200,
        messageTop: '70%',
        messageLeft: '50%',
      }

      gm.config = {
        ...gm.config,
        headerButton: true,
        headerButtonOpL: enums.headerButtonOp.openListInCurrent,
        headerButtonOpR: enums.headerButtonOp.openUserSetting,
        openHeaderMenuLink: enums.openHeaderMenuLink.openInCurrent,
        menuScrollbarSetting: enums.menuScrollbarSetting.beautify,
        videoButton: true,
        openListVideo: enums.openListVideo.openInCurrent,
        removeHistory: true,
        removeHistorySaves: gm.const.defaultRhs,
        removeHistorySearchTimes: 8,
        resetAfterFnUpdate: false,
        reloadAfterSetting: true,
      }

      gm.data = {
        removeHistoryData: remove => {
          var _ = gm.data._
          if (remove) {
            _.removeHistoryData = undefined
          } else {
            if (!_.removeHistoryData) {
              var data = GM_getValue('removeHistoryData')
              if (data && typeof data == 'object') {
                Object.setPrototypeOf(data, PushQueue.prototype) // 还原类型信息
                if (data.maxSize != gm.config.removeHistorySaves) {
                  data.setMaxSize(gm.config.removeHistorySaves)
                }
              } else {
                data = new PushQueue(gm.config.removeHistorySaves, gm.const.rhsMax)
                GM_setValue('removeHistoryData', data)
              }
              _.removeHistoryData = data
            }
            return _.removeHistoryData
          }
        },
        _: {}, // 用于存储内部数据，不公开访问
      }

      gm.menu = {
        ...gm.menu,
        setting: { state: false },
        history: { state: false },
      }

      gm.el = {
        ...gm.el,
        gmRoot: document.body.appendChild(document.createElement('div')),
        setting: null,
        history: null,
      }
      gm.el.gmRoot.id = gm.id

      gm.error = {
        ...gm.error,
        HTML_PARSING: `HTML解析错误。大部分情况下是由于网络加载速度不足造成的，不影响脚本工作；否则就是B站网页改版，请联系脚本作者修改：${GM_info.script.supportURL}`,
        NETWORK: `网络连接错误，有可能是网络加载速度不足或者 B 站后台 API 修改。不排除是脚本内部数据出错造成的，初始化脚本或清空列表页面数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`,
      }
    }

    /**
     * 版本更新处理
     */
    function updateVersion() {
      // 该项与更新相关，在此处处理
      gm.config.resetAfterFnUpdate = gmValidate('resetAfterFnUpdate', gm.config.resetAfterFnUpdate)

      if (gm.configVersion !== 0 && gm.configVersion !== gm.configUpdate) {
        if (gm.config.resetAfterFnUpdate) {
          gm.configVersion = 0
          return
        }

        if (gm.configVersion < gm.configUpdate) {
          // 必须按从旧到新的顺序写
          // 内部不能使用 gm.cofigUpdate，必须手写更新后的配置版本号！

          // 2.8.0.20200718
          if (gm.configVersion < 20200718) {
            // 强制设置为新的默认值
            GM_setValue('removeHistorySaves', gm.config.removeHistorySaves)
            var removeHistory = GM_getValue('removeHistory')
            if (removeHistory) {
              // 修改容量
              var removeHistoryData = GM_getValue('removeHistoryData')
              if (removeHistoryData) {
                Object.setPrototypeOf(removeHistoryData, PushQueue.prototype)
                removeHistoryData.setCapacity(gm.const.rhsMax)
                GM_setValue('removeHistoryData', removeHistoryData)
              }
            } else {
              // 如果 removeHistory 关闭则移除 removeHistoryData
              GM_setValue('removeHistoryData', null)
            }
            // 升级配置版本
            gm.configVersion = 20200718
            GM_setValue('configVersion', gm.configVersion)
          }
          // 3.0.0.20200721
          if (gm.configVersion < 20200721) {
            var openHeaderMenuLink = gmValidate('openHeaderDropdownLink', gm.config.openHeaderMenuLink, false)
            GM_setValue('openHeaderMenuLink', openHeaderMenuLink)
            GM_deleteValue('openHeaderDropdownLink')

            gm.configVersion = 20200721
            GM_setValue('configVersion', gm.configVersion)
          }
          // 3.1.0.20200722
          if (gm.configVersion < 20200722) {
            var exec = name => {
              var cfg = GM_getValue(name)
              if (typeof cfg == 'string') {
                cfg = cfg.replace(/^[a-z]*_/, '')
              }
              GM_setValue(name, cfg)
            }
            for (var name of ['headerButtonOpL', 'headerButtonOpR', 'openHeaderMenuLink', 'openListVideo']) {
              exec(name)
            }

            gm.configVersion = 20200722
            GM_setValue('configVersion', gm.configVersion)
          }
        } else if (gm.configVersion === undefined) {
          if (GM_getValue('gm395456') > 0) {
            // 2.6.0.20200717 版本重构
            for (name in gm.config) {
              var oldName = 'gm395456_' + name
              var value = GM_getValue(oldName)
              GM_setValue(name, value)
              GM_deleteValue(oldName)
            }
            gm.configVersion = GM_getValue('gm395456')
            GM_setValue('configVersion', gm.configVersion) // 保留配置版本
            GM_deleteValue('gm395456')
          }
        }
      }
    }

    /**
     * 用户配置读取
     */
    function readConfig() {
      var cfgDocumentStart = { redirect: true } // document-start 时期就处理过的配置
      if (gm.configVersion > 0) {
        // 对配置进行校验
        var cfgManual = { resetAfterFnUpdate: true } // 手动处理的配置
        var cfgNoWriteback = { removeHistorySearchTimes: true } // 不进行回写的配置
        for (var name in gm.config) {
          if (!cfgDocumentStart[name] && !cfgManual[name]) {
            gm.config[name] = gmValidate(name, gm.config[name], !cfgNoWriteback[name])
          }
        }
        // 特殊处理
        if (gm.config.removeHistorySearchTimes > gm.config.removeHistorySaves) {
          gm.config.removeHistorySearchTimes = gm.config.removeHistorySaves
          GM_setValue('removeHistorySearchTimes', gm.config.removeHistorySearchTimes)
        }
      } else {
        // 用户强制初始化，或者第一次安装脚本
        gm.configVersion = 0
        cfgManual = { removeHistorySaves: true, removeHistorySearchTimes: true }
        for (name in gm.config) {
          if (!cfgDocumentStart[name] && !cfgManual[name]) {
            GM_setValue(name, gm.config[name])
          }
        }

        // 特殊处理
        // removeHistorySaves 读取旧值
        gm.config.removeHistorySaves = gmValidate('removeHistorySaves', gm.config.removeHistorySaves, true)
        // removeHistorySearchTimes 使用默认值，但不能比 removeHistorySaves 大
        if (gm.config.removeHistorySearchTimes > gm.config.removeHistorySaves) {
          gm.config.removeHistorySearchTimes = gm.config.removeHistorySaves
        }
        GM_setValue('removeHistorySearchTimes', gm.config.removeHistorySearchTimes)
      }
    }

    /**
     * 添加脚本菜单
     */
    function addScriptMenu() {
      // 用户配置设置
      GM_registerMenuCommand('用户设置', openUserSetting)
      if (!gm.configVersion) { // 初始化
        openUserSetting(true)
      }
      if (gm.config.removeHistory) {
        // 稍后再看移除记录
        GM_registerMenuCommand('稍后再看移除记录', openRemoveHistory)
        // 清空列表页面数据
        GM_registerMenuCommand('清空列表页面数据', cleanRemoveHistoryData)
      }
      // 强制初始化
      GM_registerMenuCommand('初始化脚本', resetScript)
    }

    /**
     * 顶栏中加入稍后再看入口
     */
    function fnHeaderButton() {
      executeAfterElementLoad({
        selector: '.user-con.signin',
        callback: header => {
          if (header) {
            var collect = header.children[4]
            var watchlater = document.createElement('div')
            watchlater.className = 'item'
            var link = watchlater.appendChild(document.createElement('a'))
            var text = link.appendChild(document.createElement('span'))
            text.className = 'name'
            text.innerText = '稍后再看'
            header.insertBefore(watchlater, collect)

            executeLeftClick(link)
            executeRightClick(watchlater)
            executeTooltip({ collect, watchlater })
          }
        },
      })

      /**
       * 处理鼠标左键点击
       */
      var executeLeftClick = link => {
        // 使用 href 和 target 的方式设置，保留浏览器中键强制新标签页打开的特性
        var left = getHrefAndTarget(gm.config.headerButtonOpL)
        link.href = left.href
        link.target = left.target
        switch (gm.config.headerButtonOpL) {
          case enums.headerButtonOp.openUserSetting:
            link.onclick = () => openUserSetting()
            break
          case enums.headerButtonOp.openRemoveHistory:
            link.onclick = () => openRemoveHistory()
            break
        }
      }

      /**
       * 处理鼠标右键点击
       */
      var executeRightClick = watchlater => {
        watchlater.oncontextmenu = function(e) {
          if (gm.config.headerButtonOpR != enums.headerButtonOp.noOperation) {
            e && e.preventDefault && e.preventDefault()
          }
          switch (gm.config.headerButtonOpR) {
            case enums.headerButtonOp.openListInCurrent:
            case enums.headerButtonOp.openListInNew:
            case enums.headerButtonOp.playAllInCurrent:
            case enums.headerButtonOp.playAllInNew:
              var right = getHrefAndTarget(gm.config.headerButtonOpR)
              window.open(right.href, right.target)
              break
            case enums.headerButtonOp.openUserSetting:
              openUserSetting()
              break
            case enums.headerButtonOp.openRemoveHistory:
              openRemoveHistory()
              break
          }
        }
      }

      /**
       * 处理弹出菜单
       */
      function executeTooltip({ collect, watchlater }) {
        // 鼠标移动到稍后再看入口上时，以 Tooltip 形式显示稍后再看列表
        var menuSelector = open => { // 注意，该 selector 无法直接选出对应的弹出菜单，只能用作拼接
          if (typeof open == 'boolean') {
            return `[role=tooltip][aria-hidden=${!open}]`
          } else {
            return '[role=tooltip][aria-hidden]'
          }
        }
        var tabsPanelSelector = open => `${menuSelector(open)} .tabs-panel`
        var videoPanelSelector = open => `${menuSelector(open)} .favorite-video-panel`

        var defaultCollectPanelChildSelector = open => `${tabsPanelSelector(open)} [title=默认收藏夹]`
        var watchlaterPanelChildSelector = open => `${tabsPanelSelector(open)} [title=稍后再看]`
        var activePanelSelector = open => `${tabsPanelSelector(open)} .tab-item--active`

        // 运行到这里的时候，menu 其实在收藏入口元素下面，后来不知道为什么被移到外面
        var menu = document.querySelector(tabsPanelSelector(false)).parentNode.parentNode
        var dispVue = collect.firstChild.__vue__

        setTimeout(() => {
          handleMenuClose()
          // addEventListener 尽量避免冲掉事件
          watchlater.addEventListener('mouseenter', onEnterWatchlater)
          watchlater.addEventListener('mouseleave', onLeaveWatchlater)
          collect.addEventListener('mouseenter', onEnterCollect)
          collect.addEventListener('mouseleave', onLeaveCollect)
          menu.addEventListener('mouseenter', function() {
            this.mouseOver = true
          })
          menu.addEventListener('mouseleave', function() {
            this.mouseOver = false
          })
        })

        /**
         * 拦截鼠标从收藏入口以及菜单离开导致的菜单关闭，修改之使得如果此时鼠标已经移到稍后再看入口上就不关闭菜单。
         *
         * 借助 Chrome 命令行函数 getEventListeners() 可以定位（猜）到监听器在哪里。需要一点运气……
         */
        var handleMenuClose = function() {
          var miniFavorite = collect.querySelector('.mini-favorite')
          var listener = dispVue.handleMouseLeave
          // 真以为我就没法拦截到你？
          miniFavorite.removeEventListener('mouseleave', listener)
          var collectListener = function() {
            setTimeout(() => {
              if (!watchlater.mouseOver && !menu.mouseOver) {
                listener.apply(this, arguments)
              }
            }, 50)
          }
          // 改绑到 collect 上，让两者之间完全没有空隙
          collect.addEventListener('mouseleave', collectListener)
          // 用 padding 代替 margin，使得 leave 的时候就直接接触到 watchlater
          collect.style.paddingLeft = '12px'
          collect.style.marginLeft = '0'

          menu.removeEventListener('mouseleave', listener)
          var menuListener = function() {
            setTimeout(() => {
              if (!watchlater.mouseOver && !collect.mouseOver) {
                listener.apply(this, arguments)
              }
            }, 50)
          }
          menu.addEventListener('mouseleave', menuListener)
          menu.style.paddingTop = '12px'
          menu.style.marginTop = '0'
        }

        /**
         * 进入稍后再看入口的处理
         * @async
         */
        var onEnterWatchlater = async function() {
          this.mouseOver = true
          try {
            var activePanel = document.querySelector(activePanelSelector(true))
            if (activePanel) {
              // 在没有打开弹出菜单前，获取不到 activePanel
              collect._activeTitle = activePanel.firstChild.title
              collect._activePanel = activePanel
            }

            if (!dispVue.showPopper) {
              dispVue.showPopper = true
            }
            // 等待弹出菜单的状态变为“打开”再操作，会比较安全，虽然此时 DOM 上的菜单可能没有真正打开
            // 时间可以给长一点，否则有时候加载得比较慢会 timeout
            var watchlaterPanelChild = await waitForElementLoad({
              selector: watchlaterPanelChildSelector(true),
              interval: 10,
              timeout: 2000,
            })
            watchlaterPanelChild.parentNode.click()
          } catch (e) {
            console.error(gm.error.HTML_PARSING)
            console.error(e)
          }
          // 到这里才添加，避免掉前面 click 的影响，保持一致性
          addTabsPanelClickEvent()
          setMenuArrow()
        }

        /**
         * 离开稍后再看入口的处理
         */
        var onLeaveWatchlater = function() {
          this.mouseOver = false
          // 要留出足够空间让 collect.mouseOver 和 container.mouseOver 变化
          setTimeout(() => {
            if (!menu.mouseOver && !collect.mouseOver) {
              dispVue.showPopper = false
            }
          }, 20)
        }

        /**
         * 进入收藏入口的处理
         * @async
         */
        var onEnterCollect = async function() {
          this.mouseOver = true
          try {
            var activePanel = await waitForElementLoad({
              selector: activePanelSelector(true),
              interval: 50,
              timeout: 1500,
            })
            var activeTitle = activePanel.firstChild.title
            if (activeTitle == '稍后再看') {
              if (!collect._activePanel || collect._activeTitle == '稍后再看') {
                // 一般来说，只有当打开页面后直接通过稍后再看入口打开弹出菜单，然后再将鼠标移动到收藏入口上，才会执行进来
                var defaultCollectPanelChild = await waitForElementLoad({
                  selector: defaultCollectPanelChildSelector(true),
                  interval: 50,
                  timeout: 1500,
                })
                collect._activeTitle = defaultCollectPanelChild.title
                collect._activePanel = defaultCollectPanelChild.parentNode
              }
              collect._activePanel.click()
            }
          } catch (e) {
            console.error(gm.error.HTML_PARSING)
            console.error(e)
          }
          addTabsPanelClickEvent()
          setMenuArrow()
        }

        /**
         * 离开收藏入口的处理
         */
        var onLeaveCollect = function() {
          this.mouseOver = false
        }

        /**
         * 给 tabsPanel 中每个收藏夹和稍后再看添加点击事件
         * @async
         */
        var addTabsPanelClickEvent = async () => {
          if (!collect._addTabsPanelClickEvent && gm.config.openHeaderMenuLink == enums.openHeaderMenuLink.openInCurrent) {
            try {
              collect._addTabsPanelClickEvent = true
              var tabsPanel = await waitForElementLoad({
                selector: tabsPanelSelector(),
              })
              // 给各项添加点击事件
              for (var child of tabsPanel.children) {
                child.addEventListener('click', () => setVideoPanelLinkTarget())
              }
              // 还要先执行一次，让当前 videoPanel 中的 target 改变
              setVideoPanelLinkTarget()
            } catch (e) {
              collect._addTabsPanelClickEvent = false
              console.error(gm.error.HTML_PARSING)
              console.error(encodeURI)
            }
          }
        }

        /**
         * 设置弹出菜单的顶上的小箭头位置
         */
        var setMenuArrow = () => {
          setTimeout(() => {
            var menuArrow = menu.querySelector('.popper__arrow')
            var left = menuArrow.style.left
            if (left) {
              // 用常规的变量标识方式要处理的方式非常复杂，因为有很多个自变量会影响到该标识符
              // 这里投机取巧，直接用 calc 作为特殊的标识符，大大简化了过程
              if (watchlater.mouseOver) {
                if (!left.startsWith('calc')) {
                  // 向左移动
                  menuArrow.style.left = `calc(${parseFloat(left) - 52}px)`
                }
              } else if (collect.mouseOver) {
                if (left.startsWith('calc')) {
                  // 还原
                  left = parseFloat(left.replace(/calc\(/, ''))
                  menuArrow.style.left = `${left + 52}px`
                }
              }
            }
          }, 50)
        }

        /**
         * 设置弹出菜单面板中视频链接的 target
         * @async
         */
        var setVideoPanelLinkTarget = async () => {
          var videoPanel = await waitForElementLoad({
            selector: videoPanelSelector(),
          })
          await waitForConditionPass({
            condition: () => {
              var list = videoPanel.firstChild
              if (list.children.length > 0 || list.className.split(' ').indexOf('empty-list') > 0) {
                return true
              }
            }
          })
          // var target = gm.config.openHeaderMenuLink == enums.openHeaderMenuLink.openInNew ? '_blank' : '_self'
          var target = '_self'
          var links = document.querySelectorAll(`${videoPanelSelector()} a`)
          for (var link of links) {
            link.target = target
          }
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

    /**
     * 常规播放页加入快速切换稍后再看状态的按钮
     */
    function fnVideoButton_Normal() {
      /**
       * 继续执行的条件
       */
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

      /**
       * 设置按钮的稍后再看状态
       * @async
       */
      var setButtonStatus = async (oVue, cb) => {
        var aid = oVue.aid // also unsafeWindow.aid
        var status = await getVideoWatchlaterStatusByAid(aid)
        oVue.added = status
        cb.checked = status
      }
    }

    /**
     * 稍后再看播放页加入快速切换稍后再看状态的按钮
     */
    function fnVideoButton_Watchlater() {
      var bus = {}
      /**
       * 继续执行的条件
       */
      var executeCondition = () => {
        // 必须在确定 Vue 加载完成后再修改 DOM 结构，否则会导致 Vue 加载出错造成页面错误
        var app = document.querySelector('#app')
        var vueLoad = app && app.__vue__
        if (!vueLoad) {
          return false
        }
        var playContainer = app.querySelector('#playContainer')
        if (playContainer.__vue__.playId) {
          // 等到能获取到 aid 再进入，免得等下处处都要异步处理
          return playContainer
        }
      }

      executeAfterConditionPass({
        condition: executeCondition,
        callback: playContainer => {
          var more = playContainer.querySelector('#playContainer .left-container .play-options .play-options-more')
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

          btn.added = true
          cb.checked = true // 第一次打开时，默认在稍后再看中
          var csrf = getCsrf()
          cb.onclick = () => executeSwitch() // 不要附加到 btn 上，否则点击时会执行两次
          bus = { ...bus, playContainer, btn, cb, csrf }
          bus.aid = getAid()

          // 切换视频时的处理
          createLocationchangeEvent()
          window.addEventListener('locationchange', function() {
            executeAfterConditionPass({
              condition: () => {
                var aid = getAid()
                if (aid && aid != bus.aid) {
                  return aid
                }
              },
              callback: async aid => {
                bus.aid = aid
                var status = await getVideoWatchlaterStatusByAid(bus.aid)
                btn.added = status
                cb.checked = status
              }
            })
          })
        },
      })

      /**
       * 处理视频状态的切换
       */
      var executeSwitch = () => {
        var btn = bus.btn
        var cb = bus.cb
        bus.aid = getAid()
        if (!bus.aid) {
          cb.checked = btn.added
          message('网络错误，操作失败')
          return
        }
        var data = new FormData()
        data.append('aid', bus.aid)
        data.append('csrf', bus.csrf)
        GM_xmlhttpRequest({
          method: 'POST',
          url: btn.added ? gm.url.api_removeFromWatchlater : gm.url.api_addToWatchlater,
          data: data,
          onload: function(response) {
            try {
              var note = btn.added ? '从稍后再看移除' : '添加到稍后再看'
              if (JSON.parse(response.response).code == 0) {
                btn.added = !btn.added
                cb.checked = btn.added
                message(note + '成功')
              } else {
                cb.checked = btn.added
                message(`网络错误，${note}失败`)
              }
            } catch (e) {
              console.error(gm.error.NETWORK)
              console.error(e)
            }
          }
        })
      }

      /**
       * 获取 CSRF
       */
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

      /**
       * 获取当前页面对应的 aid
       */
      var getAid = () => {
        return unsafeWindow.aid || bus.playContainer.__vue__.playId
      }

      /**
       * 创建 locationchange 事件
       * @see {@link https://stackoverflow.com/a/52809105 How to detect if URL has changed after hash in JavaScript}
       */
      var createLocationchangeEvent = () => {
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
    }

    /**
     * 根据 aid 获取视频的稍后再看状态
     * @async
     * @param {number} aid AV号
     * @returns {Promise<boolean>} 视频是否在稍后再看中
     */
    async function getVideoWatchlaterStatusByAid(aid) {
      // oVue.added 第一次取到的值总是 false，从页面无法获取到该视频是否已经在稍后再看列表中，需要使用API查询
      return new Promise(resolve => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: gm.url.api_queryWatchlaterList,
          onload: function(response) {
            if (response && response.responseText) {
              try {
                var json = JSON.parse(response.responseText)
                var watchlaterList = json.data.list
                for (var e of watchlaterList) {
                  if (aid == e.aid) {
                    resolve(true)
                    return
                  }
                }
                resolve(false)
              } catch (e) {
                console.error(gm.error.NETWORK)
                console.error(e)
              }
            }
          }
        })
      })
    }

    /**
     * 处理列表页面点击视频时的行为
     */
    function fnOpenListVideo() {
      if (gm.config.openListVideo == enums.openListVideo.openInNew) {
        // 如果列表页面在新标签页打开视频
        var base = document.head.appendChild(document.createElement('base'))
        base.id = 'gm-base'
        base.target = '_blank'
      }
    }

    /**
     * 保存列表页面数据，用于生成移除记录
     */
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
              gm.data.removeHistoryData().push(current)
              GM_setValue('removeHistoryData', gm.data.removeHistoryData())
            } catch (e) {
              console.error(gm.error.NETWORK)
              console.error(e)
            }
          }
        }
      })
    }

    /**
     * 生成列表页面的 UI
     */
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
     * @param {boolean} [initial] 是否进行初始化设置
     */
    function openUserSetting(initial) {
      if (gm.el.setting) {
        openMenuItem('setting')
      } else {
        var el = {}
        var configMap = {
          // { attr, manual, needNotReload }
          headerButton: { attr: 'checked' },
          openHeaderMenuLink: { attr: 'value' },
          menuScrollbarSetting: { attr: 'value' },
          headerButtonOpL: { attr: 'value' },
          headerButtonOpR: { attr: 'value' },
          videoButton: { attr: 'checked' },
          redirect: { attr: 'checked' },
          openListVideo: { attr: 'value' },
          removeHistory: { attr: 'checked', manual: true },
          removeHistorySaves: { attr: 'value', manual: true, needNotReload: true },
          removeHistorySearchTimes: { attr: 'value', manual: true, needNotReload: true },
          resetAfterFnUpdate: { attr: 'checked', needNotReload: true },
          reloadAfterSetting: { attr: 'checked', needNotReload: true },
        }
        setTimeout(() => {
          initSetting()
          handleConfigItem()
          handleSettingItem()
          openMenuItem('setting')
        })

        /**
         * 设置页面初始化
         */
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
            <label title="在顶栏“动态”和“收藏”之间加入稍后再看入口，鼠标移至上方时弹出列表菜单，支持点击功能设置。">
                <span>【所有页面】在顶栏中加入稍后再看入口</span><input id="gm-headerButton" type="checkbox"></label>
            <div class="gm-subitem" title="选择左键点击入口时执行的操作。">
                <span>在入口上点击鼠标左键时</span>
                <select id="gm-headerButtonOpL"></select>
            </div>
            <div class="gm-subitem" title="选择右键点击入口时执行的操作。">
                <span>在入口上点击鼠标右键时</span>
                <select id="gm-headerButtonOpR"></select>
            </div>
            <div class="gm-subitem" title="选择在弹出菜单中点击视频的行为。为了保持行为一致，这个选项也会影响弹出菜单中收藏夹视频的打开，但不影响“动态”、“历史”等其他弹出菜单中点击视频的行为。">
                <span>在弹出菜单中点击视频时</span>
                <select id="gm-openHeaderMenuLink">
                    <option value="${enums.openHeaderMenuLink.openInCurrent}">在当前页面打开</option>
                    <option value="${enums.openHeaderMenuLink.openInNew}">在新标签页打开</option>
                </select>
            </div>
            <div class="gm-subitem" title="对弹出菜单中滚动条样式进行设置。为了保持行为一致，这个选项也会影响“动态”、“历史”等其他入口的弹出菜单。">
                <span>对于弹出菜单中的滚动条</span>
                <select id="gm-menuScrollbarSetting">
                    <option value="${enums.menuScrollbarSetting.beautify}">修改其外观为扁平化风格</option>
                    <option value="${enums.menuScrollbarSetting.hidden}">将其隐藏（不影响鼠标滚动）</option>
                    <option value="${enums.menuScrollbarSetting.original}">维持官方的滚动条样式</option>
                </select>
            </div>
        </div>
        <label class="gm-item" title="在播放页面（包括普通模式和稍后再看模式）中加入能将视频快速切换添加或移除出稍后再看列表的按钮。">
            <span>【播放页面】加入快速切换视频稍后再看状态的按钮</span><input id="gm-videoButton" type="checkbox"></label>
        <label class="gm-item" title="打开【${gm.url.page_videoWatchlaterMode}】页面时，自动切换至【${gm.url.page_videoNormalMode}】页面进行播放。">
            <span>【播放页面】从稍后再看模式切换到普通模式播放</span><input id="gm-redirect" type="checkbox"></label>
        <label class="gm-item" title="设置在【${gm.url.page_watchlaterList}】页面点击视频时的行为。">
            <span>【列表页面】点击视频时</span>
            <select id="gm-openListVideo">
                <option value="${enums.openListVideo.openInCurrent}">在当前页面打开</option>
                <option value="${enums.openListVideo.openInNew}">在新标签页打开</option>
            </select>
        </label>
        <div class="gm-item">
            <label title="保留最近几次打开【${gm.url.page_watchlaterList}】页面时稍后再看列表的记录，以查找出这段时间内将哪些视频移除出稍后再看，用于防止误删操作。关闭该选项后，会将内部历史数据清除！">
                <span>【列表页面】开启稍后再看移除记录（防误删）</span>
                <input id="gm-removeHistory" type="checkbox">
                <span id="gm-rhWarning" class="gm-warning" title="">⚠</span>
            </label>
            <div class="gm-subitem" title="较大的数值可能会带来较大的开销，经过性能测试，作者认为在设置在${gm.const.rhsWarning}以下时，即使在极限情况下也不会产生让人能察觉到的卡顿（存取总时不超过100ms），但在没有特殊要求的情况下依然不建议设置到这么大。该项修改后，会立即对过期记录进行清理，重新修改为原来的值无法还原被清除的记录，设置为比原来小的值需慎重！（范围：${gm.const.rhsMin} ~ ${gm.const.rhsMax}）">
                <span>保存最近几次列表页面数据用于生成移除记录</span>
                <span id="gm-cleanRemoveHistoryData" class="gm-hint-option" title="清理已保存的列表页面数据，不可恢复！">清空数据(0条)</span>
                <input id="gm-removeHistorySaves" type="text">
                <span id="gm-rhsWarning" class="gm-warning" title="">⚠</span>
            </div>
            <div class="gm-subitem" title="搜寻时在最近多少次列表页面数据中查找，设置较小的值能较好地定位最近移除的视频。设置较大的值几乎不会对性能造成影响，但不能大于最近列表页面数据保存次数。">
                <span>默认历史回溯深度</span><input id="gm-removeHistorySearchTimes" type="text"></div>
        </div>
        <label class="gm-item" title="功能性更新后，是否强制进行初始化设置？特别地，该选项的设置在初始化设置时将被保留，但初始化脚本时依然会被重置。">
            <span>【用户设置】功能性更新后进行初始化设置</span><input id="gm-resetAfterFnUpdate" type="checkbox"></label>
        <label class="gm-item" title="勾选后，如果更改的配置需要重新加载才能生效，那么会在设置完成后重新加载页面。">
            <span>【用户设置】必要时在设置完成后重新加载页面</span><input id="gm-reloadAfterSetting" type="checkbox"></label>
    </div>
    <div class="gm-bottom">
        <button id="gm-save">保存</button><button id="gm-cancel">取消</button>
    </div>
    <div id="gm-reset" title="重置脚本设置及内部数据，也许能解决脚本运行错误的问题。该操作不会清除已保存的列表页面数据，因此不会导致移除记录丢失。无法解决请联系脚本作者：${GM_info.script.supportURL}">初始化脚本</div>
    <div id="gm-changelog" title="显示更新日志" onclick="window.open('${gm.url.gm_changelog}')">更新日志</div>
</div>
<div class="gm-shadow"></div>
`

          // 找出配置对应的元素
          for (var name in gm.config) {
            el[name] = gm.el.setting.querySelector('#gm-' + name)
          }

          el.save = gm.el.setting.querySelector('#gm-save')
          el.cancel = gm.el.setting.querySelector('#gm-cancel')
          el.shadow = gm.el.setting.querySelector('.gm-shadow')
          el.reset = gm.el.setting.querySelector('#gm-reset')
          el.reset.onclick = resetScript
          el.cleanRemoveHistoryData = gm.el.setting.querySelector('#gm-cleanRemoveHistoryData')
          el.cleanRemoveHistoryData.onclick = function() {
            el.removeHistory.checked && cleanRemoveHistoryData()
          }

          el.rhWarning = gm.el.setting.querySelector('#gm-rhWarning')
          initWarning(el.rhWarning, '关闭移除记录，或将列表页面数据保存次数设置为比原来小的值，都会造成对内部过期历史数据的清理！')
          el.rhsWarning = gm.el.setting.querySelector('#gm-rhsWarning')
          initWarning(el.rhsWarning, `该项设置过大时，在极端情况下可能会造成明显的卡顿，一般不建议该项超过${gm.const.rhsWarning}。当然，如果对机器的读写性能自信，可以无视该警告。`)

          el.headerButtonOpL.innerHTML = el.headerButtonOpR.innerHTML = `
<option value="${enums.headerButtonOp.openListInCurrent}">在当前页面打开列表页面</option>
<option value="${enums.headerButtonOp.openListInNew}">在新标签页打开列表页面</option>
<option value="${enums.headerButtonOp.playAllInCurrent}">在当前页面播放全部</option>
<option value="${enums.headerButtonOp.playAllInNew}">在新标签页播放全部</option>
<option value="${enums.headerButtonOp.openUserSetting}">打开用户设置</option>
<option value="${enums.headerButtonOp.openRemoveHistory}">打开稍后再看移除记录</option>
<option value="${enums.headerButtonOp.noOperation}">不执行操作</option>
        `
        }

        /**
         * 维护与设置项相关的数据和元素
         */
        var handleConfigItem = () => {
          // 子项与父项相关联
          var subitemChange = (item, subs) => {
            for (var el of subs) {
              var parent = el.parentNode
              if (item.checked) {
                parent.removeAttribute('disabled')
              } else {
                parent.setAttribute('disabled', 'disabled')
              }
              el.disabled = !item.checked
            }
          }
          el.headerButton.onchange = function() {
            subitemChange(this, [el.headerButtonOpL, el.headerButtonOpR, el.openHeaderMenuLink, el.menuScrollbarSetting])
          }
          el.removeHistory.onchange = function() {
            subitemChange(this, [el.removeHistorySaves, el.removeHistorySearchTimes])
            setRhWaring()
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
            setRhWaring()
            setRhsWarning()
          }
          el.removeHistorySaves.onblur = function() {
            if (this.value === '') {
              this.value = el.removeHistorySearchTimes.value
            }
            if (parseInt(el.removeHistorySearchTimes.value) > parseInt(this.value)) {
              el.removeHistorySearchTimes.value = this.value
            }
            setRhWaring()
            setRhsWarning()
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
              setRhWaring()
              setRhsWarning()
            }
          }
        }

        /**
         * 处理与设置页面相关的数据和元素
         */
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

        var needReload = false
        /**
         * 设置保存时执行
         */
        var onSave = () => {
          // 通用处理
          for (var name in configMap) {
            var cfg = configMap[name]
            if (!cfg.manual) {
              var change = saveConfig(name, cfg.attr)
              if (!cfg.needNotReload) {
                needReload = needReload || change
              }
            }
          }

          // 特殊处理
          var resetMaxSize = false
          // removeHistory
          if (gm.config.removeHistory != el.removeHistory.checked) {
            gm.config.removeHistory = el.removeHistory.checked
            GM_setValue('removeHistory', gm.config.removeHistory)
            resetMaxSize = true
            needReload = true
          }
          // “因”中无 removeHistory，就说明 needReload 需要设置为 true，除非“果”不需要刷新页面就能生效
          if (gm.config.removeHistory) {
            var rhsV = parseInt(el.removeHistorySaves.value)
            if (rhsV != gm.config.removeHistorySaves && !isNaN(rhsV)) {
              // 因：removeHistorySaves
              // 果：removeHistorySaves & removeHistoryData
              gm.data.removeHistoryData().setMaxSize(rhsV)
              gm.config.removeHistorySaves = rhsV
              GM_setValue('removeHistorySaves', gm.config.removeHistorySaves)
              GM_setValue('removeHistoryData', gm.data.removeHistoryData())
              // 不需要修改 needReload
            }
            // 因：removeHistorySearchTimes
            // 果：removeHistorySearchTimes
            var rhstV = parseInt(el.removeHistorySearchTimes.value)
            if (rhstV != gm.config.removeHistorySearchTimes && !isNaN(rhstV)) {
              gm.config.removeHistorySearchTimes = rhstV
              GM_setValue('removeHistorySearchTimes', gm.config.removeHistorySearchTimes)
              // 不需要修改 needReload
            }
          } else if (resetMaxSize) {
            // 因：removeHistory
            // 果：removeHistoryData
            gm.data.removeHistoryData(true)
            GM_deleteValue('removeHistoryData')
          }

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

          if (gm.config.reloadAfterSetting && needReload) {
            needReload = false
            location.reload()
          }
        }

        /**
         * 设置打开时执行
         */
        var onOpen = () => {
          for (var name in configMap) {
            var attr = configMap[name].attr
            el[name][attr] = gm.config[name]
          }
          el.headerButton.onchange()
          el.removeHistory.onchange()

          if (gm.config.removeHistory) {
            setTimeout(() => {
              var arrayData = gm.data.removeHistoryData().toArray()
              var total = arrayData.reduce((prev, current) => {
                return prev + current.length
              }, 0)
              if (gm.menu.setting.state && typeof total == 'number') {
                el.cleanRemoveHistoryData.innerText = `清空数据(${total}条)`
              }
            })
          } else {
            el.cleanRemoveHistoryData.innerText = '清空数据(0条)'
          }
        }

        /**
         * 保存配置
         * @param {string} name 配置名称
         * @param {string} attr 从对应元素的什么属性读取
         * @returns {boolean} 是否有实际更新
         */
        var saveConfig = (name, attr) => {
          var elValue = el[name][attr]
          if (gm.config[name] != elValue) {
            gm.config[name] = elValue
            GM_setValue(name, gm.config[name])
            return true
          }
          return false
        }

        /**
         * 设置 removeHistory 警告项
         */
        var setRhWaring = () => {
          var warn = false
          var rh = el.removeHistory.checked
          if (!rh) {
            warn = true
          } else {
            var rhs = parseInt(el.removeHistorySaves.value)
            if (isNaN(rhs)) {
              rhs = 0
            }
            if (rhs < gm.config.removeHistorySaves) {
              warn = true
            }
          }

          if (el.rhWarning.show) {
            if (!warn) {
              fade(false, el.rhWarning)
              el.rhWarning.show = false
            }
          } else {
            if (warn) {
              fade(true, el.rhWarning)
              el.rhWarning.show = true
            }
          }
        }

        /**
         * 设置 removeHistorySaves 警告项
         */
        var setRhsWarning = () => {
          var value = parseInt(el.removeHistorySaves.value)
          if (isNaN(value)) {
            value = 0
          }
          if (el.rhsWarning.show) {
            if (value <= gm.const.rhsWarning) {
              fade(false, el.rhsWarning)
              el.rhsWarning.show = false
            }
          } else {
            if (value > gm.const.rhsWarning) {
              fade(true, el.rhsWarning)
              el.rhsWarning.show = true
            }
          }
        }
      }

      /**
       * 设置警告项
       * @param {HTMLElement} elWarning 警告元素
       * @param {string} msg 警告信息
       */
      var initWarning = (elWarning, msg) => {
        elWarning.show = false
        elWarning.onmouseover = function() {
          var htmlMsg = `
<table><tr>
    <td style="font-size:1.8em;line-height:1.8em;padding-right:0.6em;">⚠</td>
    <td>${msg}</td>
</tr></table>
`
          this.msgbox = message(htmlMsg, { html: true, autoClose: false })
        }
        elWarning.onmouseleave = function() {
          if (this.msgbox) {
            closeMessage(this.msgbox)
          }
        }
      }
    }

    /**
     * 打开移除记录
     */
    function openRemoveHistory() {
      if (!gm.config.removeHistory) {
        message('请在设置中开启稍后再看移除记录')
        return
      }

      var el = {}
      el.searchTimes = null
      if (gm.el.history) {
        el.searchTimes = gm.el.history.querySelector('#gm-search-times')
        el.searchTimes.current = gm.config.removeHistorySearchTimes < gm.data.removeHistoryData().size ? gm.config.removeHistorySearchTimes : gm.data.removeHistoryData().size
        el.searchTimes.value = el.searchTimes.current
        openMenuItem('history')
      } else {
        setTimeout(() => {
          initHistory()
          handleItem()
          openMenuItem('history')
        })

        /**
         * 初始化移除记录页面
         */
        var initHistory = () => {
          gm.el.history = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.history.el = gm.el.history
          gm.el.history.className = 'gm-history'
          gm.el.history.innerHTML = `
<div class="gm-history-page">
    <div class="gm-title">稍后再看移除记录</div>
    <div class="gm-comment">
        <div>根据最近<span id="gm-save-times">X</span>次打开列表页面时获取到的<span id="gm-record-num">X</span>条不重复的记录生成（总计<span id="gm-record-num-repeat">X</span>条），共筛选出<span id="gm-remove-num">X</span>条移除记录。排序由加入到稍后再看的顺序决定，与移除出稍后再看的时间无关。如果记录太多难以定位被误删的视频，请在下方设置减少历史回溯深度。鼠标移动到内容区域可向下滚动翻页，点击对话框以外的位置退出。</div>
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
          el.recordNumRepeat = gm.el.history.querySelector('#gm-record-num-repeat')
          el.removeNum = gm.el.history.querySelector('#gm-remove-num')
          el.shadow = gm.el.history.querySelector('.gm-shadow')
        }

        /**
         * 维护内部元素和数据
         */
        var handleItem = () => {
          // 使用 el.searchTimes.current 代替本地变量记录数据，可以保证任何情况下闭包中都能获取到正确数据
          el.searchTimes = gm.el.history.querySelector('#gm-search-times')
          el.searchTimes.current = gm.config.removeHistorySearchTimes < gm.data.removeHistoryData().size ? gm.config.removeHistorySearchTimes : gm.data.removeHistoryData().size
          el.searchTimes.value = el.searchTimes.current

          var stMax = gm.data.removeHistoryData().size
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

        /**
         * 移除记录打开时执行
         */
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
                  var removeData = gm.data.removeHistoryData().toArray(el.searchTimes.current)
                  el.saveTimes.innerText = removeData.length
                  var total = 0
                  for (var i = removeData.length - 1; i >= 0; i--) { // 后面的数据较旧，从后往前遍历
                    for (var record of removeData[i]) {
                      map.set(record.bvid, record)
                    }
                    total += removeData[i].length
                  }
                  el.recordNum.innerText = map.size
                  el.recordNumRepeat.innerText = total
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
                  var errorInfo = gm.error.NETWORK
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

    /**
     * 初始化脚本
     */
    function resetScript() {
      var result = confirm('是否要初始化脚本？\n\n注意：本操作不会清理内部保存的列表页面数据，要清理列表页面数据请在用户设置中操作。')
      if (result) {
        var keyNoReset = { removeHistorySaves: true, removeHistoryData: true }
        var gmKeys = GM_listValues()
        for (var gmKey of gmKeys) {
          if (!keyNoReset[gmKey]) {
            GM_deleteValue(gmKey)
          }
        }

        gm.configVersion = 0
        GM_setValue('configVersion', gm.configVersion)
        location.reload()
      }
    }

    /**
     * 清空 removeHistoryData
     */
    function cleanRemoveHistoryData() {
      var result = confirm('是否要清空列表页面数据？')
      if (result) {
        closeMenuItem('setting')
        GM_deleteValue('removeHistorySaves')
        GM_deleteValue('removeHistoryData')
        if (gm.config.reloadAfterSetting) {
          location.reload()
        } else {
          if (gm.config.removeHistory) {
            gm.config.removeHistorySaves = gm.const.defaultRhs
            gm.data.removeHistoryData(true)
          }
        }
      }
    }

    /**
     * 对“打开菜单项”这一操作进行处理，包括显示菜单项、设置当前菜单项的状态、关闭其他菜单项
     */
    function openMenuItem(name) {
      if (!gm.menu[name].state) {
        for (var key in gm.menu) {
          var menu = gm.menu[key]
          if (key == name) {
            menu.state = true
            menu.openHandler && menu.openHandler()
            fade(true, menu.el)
          } else {
            if (menu.state) {
              closeMenuItem(key)
            }
          }
        }
      }
    }

    /**
     * 对“关闭菜单项”这一操作进行处理，包括隐藏菜单项、设置当前菜单项的状态
     * @param {string} name 菜单项的名称
     */
    function closeMenuItem(name) {
      var menu = gm.menu[name]
      if (menu.state) {
        menu.state = false
        fade(false, menu.el, () => {
          menu.closeHandler && menu.closeHandler()
        })
      }
    }

    /**
     * 用户通知
     * @param {string} msg 信息
     * @param {Object} [config] 设置
     * @param {boolean} [config.autoClose=true] 是否自动关闭信息，配合 `config.ms` 使用
     * @param {number} [config.ms=gm.const.messageTime] 显示时间（单位：ms，不含渐显/渐隐时间）
     * @param {boolean} [config.html=false] 是否将 `msg` 理解为 HTML
     * @param {{top: string, left: string}} [config.position] 信息框的位置，不设置该项时，相当于设置为 `{ top: gm.const.messageTop, left: gm.const.messageLeft }`
     * @return {HTMLElement} 信息框元素
     */
    function message(msg, config = {}) {
      var defaultConfig = {
        autoClose: true,
        ms: gm.const.messageTime,
        html: false,
        position: null,
      }
      config = { ...defaultConfig, ...config }

      var msgbox = document.body.appendChild(document.createElement('div'))
      msgbox.className = `${gm.id}-msgbox`
      if (config.position) {
        msgbox.style.top = config.position.top
        msgbox.style.left = config.position.left
      }

      if (config.html) {
        msgbox.innerHTML = msg
      } else {
        msgbox.innerText = msg
      }
      fade(true, msgbox, () => {
        if (config.autoClose) {
          setTimeout(() => {
            closeMessage(msgbox)
          }, config.ms)
        }
      })
      return msgbox
    }

    /**
     * 关闭信息
     * @param {HTMLElement} msgbox 信息框元素
     */
    function closeMessage(msgbox) {
      if (msgbox) {
        fade(false, msgbox, () => {
          msgbox && msgbox.remove()
        })
      }
    }

    /**
     * 处理 HTML 元素的渐显和渐隐
     * @param {boolean} inOut 渐显/渐隐
     * @param {HTMLElement} target HTML 元素
     * @param {() => void} [callback] 处理完成的回调函数
     */
    function fade(inOut, target, callback) {
      // fadeId 等同于当前时间戳，其意义在于保证对于同一元素，后执行的操作必将覆盖前的操作
      var fadeId = new Date().getTime()
      target._fadeId = fadeId
      if (inOut) { // 渐显
        // 只有 display 可视情况下修改 opacity 才会触发 transition
        target.style.display = 'unset'
        setTimeout(() => {
          var success = false
          if (target._fadeId <= fadeId) {
            target.style.opacity = '1'
            success = true
          }
          callback && callback(success)
        }, 10) // 此处的 10ms 是为了保证修改 display 后在浏览器上真正生效，按 HTML5 定义，浏览器需保证 display 在修改 4ms 后保证生效，但实际上大部分浏览器貌似做不到，等个 10ms 再修改 opacity
      } else { // 渐隐
        target.style.opacity = '0'
        setTimeout(() => {
          var success = false
          if (target._fadeId <= fadeId) {
            target.style.display = 'none'
            success = true
          }
          callback && callback(success)
        }, gm.const.fadeTime)
      }
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
    function executeAfterConditionPass(options) {
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
            executeAfterConditionPass({
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

    /**
     * 在元素加载完成后执行操作
     *
     * 当条件满足后，如果不存在终止条件，那么直接执行 `callback(element)`。
     *
     * 当条件满足后，如果存在终止条件，且 `stopTimeout` 大于 `0`，则还会在接下来的 `stopTimeout` 时间内判断是否满足终止条件，称为终止条件的二次判断。
     * 如果在此期间，终止条件通过，则表示依然不满足条件，故执行 `stopCallback()` 而非 `callback(element)`。
     * 如果在此期间，终止条件一直失败，则顺利通过检测，执行 `callback(element)`。
     *
     * @param {Object} options 选项
     * @param {string} options.selector 该选择器指定要等待加载的元素 `element`
     * @param {(element: HTMLElement) => void} [options.callback] 当 `element` 加载成功时执行 `callback(element)`
     * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
     * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
     * @param {() => void} [options.onTimeout] 检测超时时执行 `onTimeout()`
     * @param {string | (() => *)} [options.stopCondition] 终止条件。若为函数，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测；若为字符串，则作为元素选择器指定终止元素 `stopElement`，若该元素加载成功则终止检测
     * @param {() => void} [options.stopCallback] 终止条件达成时执行 `stopCallback()`（包括终止条件的二次判断达成）
     * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
     * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
     * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
     */
    function executeAfterElementLoad(options) {
      var defaultOptions = {
        selector: '',
        callback: el => console.log(el),
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
      executeAfterConditionPass({
        ...options,
        condition: () => document.querySelector(options.selector),
        stopCondition: () => {
          if (options.stopCondition) {
            if (options.stopCondition) {
              return options.stopCondition()
            } else if (typeof options.stopCondition == 'string') {
              return document.querySelector(options.stopCondition)
            }
          }
        },
      })
    }

    /**
     * 等待条件满足
     * 
     * 执行细节类似于 {@link executeAfterConditionPass}。在原来执行 `callback(result)` 的地方执行 `resolve(result)`，被终止或超时执行 `reject()`。
     * 
     * @async
     * @see executeAfterConditionPass
     * @param {Object} options 选项
     * @param {() => *} options.condition 条件，当 `condition()` 返回的 `result` 为真值时满足条件
     * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
     * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
     * @param {() => *} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
     * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
     * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
     * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
     * @returns {Promise} `result`
     */
    async function waitForConditionPass(options) {
      return new Promise((resolve, reject) => {
        executeAfterConditionPass({
          ...options,
          callback: result => resolve(result),
          onTimeout: () => reject(['TIMEOUT', 'waitForConditionPass']),
          stopCallback: () => reject(['STOP', 'waitForConditionPass']),
        })
      })
    }

    /**
     * 等待元素加载
     * 
     * 执行细节类似于 {@link executeAfterElementLoad}。在原来执行 `callback(element)` 的地方执行 `resolve(element)`，被终止或超时执行 `reject()`。
     * 
     * @async
     * @see executeAfterElementLoad
     * @param {Object} options 选项
     * @param {string} options.selector 该选择器指定要等待加载的元素 `element`
     * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
     * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
     * @param {string | (() => *)} [options.stopCondition] 终止条件。若为函数，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测；若为字符串，则作为元素选择器指定终止元素 `stopElement`，若该元素加载成功则终止检测
     * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
     * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
     * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
     * @returns {Promise<HTMLElement>} `element`
     */
    async function waitForElementLoad(options) {
      return new Promise((resolve, reject) => {
        executeAfterElementLoad({
          ...options,
          callback: element => resolve(element),
          onTimeout: () => reject(['TIMEOUT', 'waitForElementLoad']),
          stopCallback: () => reject(['STOP', 'waitForElementLoad']),
        })
      })
    }

    /**
     * 添加弹出菜单的滚动条样式
     * */
    function addMenuScrollbarStyle() {
      var menuScrollbarStyle
      switch (gm.config.menuScrollbarSetting) {
        case enums.menuScrollbarSetting.beautify:
          // 目前在不借助 JavaScript 的情况下，无法完美实现类似于移动端滚动条浮动在内容上的效果。
          menuScrollbarStyle = `
[role=tooltip] ::-webkit-scrollbar,
#app > .out-container > .container::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
[role=tooltip] ::-webkit-scrollbar-thumb,
#app > .out-container > .container::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: #00000000;
}
[role=tooltip] :hover::-webkit-scrollbar-thumb,
#app > .out-container > .container:hover::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: #0000002b;
}
          `
          break
        case enums.menuScrollbarSetting.hidden:
          menuScrollbarStyle = `
[role=tooltip] ::-webkit-scrollbar,
#app > .out-container > .container::-webkit-scrollbar {
    display: none;
}
          `
          break
        case enums.menuScrollbarSetting.original:
        default:
          menuScrollbarStyle = ''
      }
      GM_addStyle(menuScrollbarStyle)
    }

    /**
     * 添加脚本样式
     */
    function addStyle() {
      // 弹出菜单滚动条样式
      addMenuScrollbarStyle()
      // 通用样式
      GM_addStyle(`
#${gm.id} {
    color: black;
}

#${gm.id} .gm-setting {
    font-size: 12px;
    transition: opacity ${gm.const.fadeTime}ms ease-in-out;
    opacity: 0;
    display: none;
    position: fixed;
    z-index: 10000;
    user-select: none;
}
#${gm.id} .gm-setting .gm-setting-page {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #ffffff;
    border-radius: 10px;
    z-index: 65535;
    min-width: 53em;
    padding: 1em 1.4em;
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
    padding: 0.6em;
}
#${gm.id} .gm-setting .gm-item:hover {
  color: #0075FF;
}
#${gm.id} .gm-setting .gm-subitem {
    display: block;
    margin-left: 6em;
    margin-top: 0.3em;
}
#${gm.id} .gm-setting .gm-subitem[disabled] {
    color: gray;
}
#${gm.id} .gm-setting .gm-subitem:hover:not([disabled]) {
    color: #0075FF;
}
#${gm.id} .gm-setting .gm-hint-option {
    font-size: 0.8em;
    color: gray;
    text-decoration: underline;
    padding: 0 0.2em;
    cursor: pointer;
}
#${gm.id} .gm-setting .gm-hint-option:hover {
    color: #ca0000;
}
#${gm.id} .gm-setting [disabled] .gm-hint-option {
    color: gray;
    cursor: not-allowed;
}
#${gm.id} .gm-setting input[type=checkbox] {
    vertical-align: middle;
    margin: 3px 0 0 10px;
    float: right;
}
#${gm.id} .gm-setting input[type=text] {
    float: right;
    border-width: 0 0 1px 0;
    width: 2.4em;
    text-align: right;
    padding: 0 0.2em;
    margin-right: -0.2em;
}
#${gm.id} .gm-setting select {
    border-width: 0 0 1px 0;
    cursor: pointer;
}
#${gm.id} .gm-setting .gm-warning {
    position: absolute;
    right: 1.4em;
    color: #e37100;
    font-size: 1.4em;
    line-height: 1em;
    transition: opacity ${gm.const.fadeTime}ms ease-in-out;
    opacity: 0;
    display: none;
    cursor: pointer;
}
#${gm.id} .gm-setting .gm-bottom {
    margin: 0.8em 2em 1.5em 2em;
    text-align: center;
}
#${gm.id} .gm-setting .gm-bottom button {
    font-size: 1em;
    padding: 0.3em 1em;
    margin: 0 0.8em;
    cursor: pointer;
    background-color: white;
    border: 1px solid black;
    border-radius: 2px;
}
#${gm.id} .gm-setting .gm-bottom button:hover {
    background-color: #ebebeb;
}
#${gm.id} .gm-setting .gm-bottom button[disabled] {
    cursor: not-allowed;
    border-color: gray;
    background-color: white;
}

#${gm.id} .gm-history {
    transition: opacity ${gm.const.fadeTime}ms ease-in-out;
    opacity: 0;
    display: none;
    position: fixed;
    z-index: 10000;
    user-select: none;
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
    margin: 1.6em 0.2em 2em 0.2em;
    padding: 0 1.8em;
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
    user-select: text;
}
#${gm.id} .gm-history .gm-content::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
#${gm.id} .gm-history .gm-content::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: #00000000;
}
#${gm.id} .gm-history .gm-content:hover::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: #0000002b;
}

#${gm.id} #gm-reset {
    position: absolute;
    right: 0;
    bottom: 0;
    margin: 1em 1.6em;
    color: #cfcfcf;
    cursor: pointer;
}
#${gm.id} #gm-changelog {
  position: absolute;
  right: 0;
  bottom: 1.8em;
  margin: 1em 1.6em;
  color: #cfcfcf;
  cursor: pointer;
}
#${gm.id} #gm-reset:hover,
#${gm.id} #gm-changelog:hover {
    color: #666666;
    text-decoration: underline;
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
    color: gray;
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

.${gm.id}-msgbox {
    position: fixed;
    top: ${gm.const.messageTop};
    left: ${gm.const.messageLeft};
    transform: translate(-50%, -50%);
    z-index: 65535;
    background-color: #000000bf;
    font-size: 16px;
    max-width: 24em;
    min-width: 2em;
    color: white;
    padding: 0.5em 1em;
    border-radius: 0.6em;
    opacity: 0;
    transition: opacity ${gm.const.fadeTime}ms ease-in-out;
    user-select: none;
}
      `)
    }
  })

  /**
   * GM 读取流程
   *
   * 一般情况下，读取用户配置；如果配置出错，则沿用默认值，并将默认值写入配置中
   *
   * @param {string} gmKey 键名
   * @param {*} defaultValue 默认值
   * @param {boolean} [writeback=true] 配置出错时是否将默认值回写入配置中
   * @param {*} 通过校验时是配置值，不能通过校验时是默认值
   */
  function gmValidate(gmKey, defaultValue, writeback = true) {
    var value = GM_getValue(gmKey)
    if (enums && enums[gmKey]) {
      if (enums[gmKey][value]) {
        return value
      }
    } else if (typeof value == typeof defaultValue) { // typeof null == 'object'，对象默认值赋 null 无需额外处理
      return value
    }

    if (writeback) {
      GM_setValue(gmKey, defaultValue)
    }
    return defaultValue
  }

  /**
   * document-start 级别初始化
   */
  function documentStartInit() {
    // document-start 级用户配置读取
    if (gm.configVersion > 0) {
      gm.config.redirect = gmValidate('redirect', gm.config.redirect)
    } else {
      GM_setValue('redirect', gm.config.redirect)
    }
  }

  /**
   * 稍后再看模式重定向至正常模式播放
   */
  function fnRedirect() {
    window.stop() // 停止原页面的加载
    // 这里不能用读取页面 Vue 或者 window.aid 的方式来直接获取目标 URL，那样太慢了，直接从 URL 反推才是最快的
    GM_xmlhttpRequest({
      method: 'GET',
      url: gm.url.api_queryWatchlaterList,
      onload: function(response) {
        if (response && response.responseText) {
          try {
            var part = 1
            if (urlMatch(/watchlater\/p\d+/)) {
              part = parseInt(location.href.match(/(?<=\/watchlater\/p)\d+(?=\/?)/)[0])
            } // 如果匹配不上，就是以 watchlater/ 直接结尾，等同于 watchlater/p1
            var json = JSON.parse(response.responseText)
            var watchlaterList = json.data.list
            location.replace(gm.url.page_videoNormalMode + '/' + watchlaterList[part - 1].bvid)
          } catch (e) {
            var errorInfo = gm.error.REDIRECT
            console.error(errorInfo)
            console.error(e)

            var rc = confirm(errorInfo + '\n\n是否暂时关闭模式切换功能？')
            if (rc) {
              gm.config.redirect = false
              GM_setValue('redirect', gm.config.redirect)
              location.reload()
            } else {
              location.replace(gm.url.page_watchlaterList)
            }
          }
        }
      }
    })
  }

  /**
   * 判断当前 URL 是否匹配
   * @param {RegExp} reg 用于判断是否匹配的正则表达式
   * @returns {boolean} 是否匹配
   */
  function urlMatch(reg) {
    return reg.test(location.href)
  }

  /**
   * 推入队列，循环数组实现
   * @class
   * @param {number} maxSize 队列的最大长度，达到此长度后继续推入数据，将舍弃末尾处的数据
   * @param {number} [capacity=maxSize] 容量，即循环数组的长度，不能小于 maxSize
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
   * 重新设置推入队列的容量
   * @param {number} capacity 容量
   */
  PushQueue.prototype.setCapacity = function(capacity) {
    if (this.maxSize > capacity) {
      this.maxSize = capacity
      if (this.size > capacity) {
        this.size = capacity
      }
      // no need to gc()
    }
    var raw = this.toArray()
    var data = [...raw.reverse()]
    this.index = data.length
    data.length = capacity
    this.data = data
  }
  /**
   * 队列是否为空
   */
  PushQueue.prototype.empty = function() {
    return this.size == 0
  }
  /**
   * 向队列中推入数据，若队列已达到最大长度，则舍弃末尾处数据
   * @param {*} value 推入队列的数据
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
   * @returns {*} 弹出的数据
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
})()
