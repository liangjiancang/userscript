// ==UserScript==
// @id              BilibiliWatchlaterPlus@Laster2800
// @name            B站稍后再看功能增强
// @version         3.5.0.20200801
// @namespace       laster2800
// @author          Laster2800
// @description     与稍后再看功能相关，一切你能想到和想不到的功能
// @icon            https://www.bilibili.com/favicon.ico
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
   * @property {URLSearchParams} searchParams URL 查询参数
   * @property {GMObject_config} config 用户配置
   * @property {GMObject_data} data 脚本数据
   * @property {GMObject_url} url URL
   * @property {GMObject_regex} regex 正则表达式
   * @property {GMObject_const} const 常量
   * @property {GMObject_menu} menu 菜单
   * @property {{[s: string]: HTMLElement}} el HTML 元素
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
   * @property {boolean} forceConsistentVideo 确保打开与列表页面一致的视频
   * @property {boolean} removeHistory 稍后再看移除记录
   * @property {number} removeHistorySaves 列表页数数据保存次数
   * @property {number} removeHistorySearchTimes 历史回溯深度
   * @property {boolean} removeButton_removeAll 移除“一键清空”按钮
   * @property {boolean} removeButton_removeWatched 移除“移除已观看视频”按钮
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
   * @property {{ title: string, bvid: string }[]} watchlaterListData 当前列表页面的数据
   */
  /**
   * @typedef GMObject_url
   * @property {string} api_queryWatchlaterList 稍后再看列表数据
   * @property {string} api_addToWatchlater 将视频添加至稍后再看，要求 POST 一个含 `aid` 和 `csrf` 的表单
   * @property {string} api_removeFromWatchlater 将视频从稍后再看移除，要求 POST 一个含 `aid` 和 `csrf` 的表单
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
   * @property {number} defaultRhst 默认历史回溯深度
   * @property {number} rhsWarning 列表页面数据保存数警告线
   * @property {number} fadeTime UI 渐变时间
   * @property {number} textFadeTime 文字渐变时间
   * @property {number} messageTime 默认信息显示时间
   * @property {string} messageTop 信息显示默认 `style.top`
   * @property {string} messageLeft 信息显示默认 `style.left`
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
  const gm = {
    id: 'gm395456',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20200723,
    searchParams: new URL(location.href).searchParams,
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
    },
  }

  /**
   * 脚本内用到的枚举定义
   */
  const Enums = {
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
  Enums.headerButtonOpL = Enums.headerButtonOpR = Enums.headerButtonOp

  // 为了保证重定向的效率，外层函数不作封装处理
  // 鱼和熊掌不可兼得，OOP 就是个锤子
  documentStartInit()
  if (urlMatch(gm.regex.page_videoWatchlaterMode)) {
    if (gm.config.redirect) { // 重定向，document-start 就执行，尽可能快地将原页面掩盖过去
      fnRedirect()
      return // 必须 return，否则后面的内容还会执行使得加载速度超级慢
    }
  }

  // 脚本的其他部分推迟至 DOMContentLoaded 执行
  document.addEventListener('DOMContentLoaded', function() {
    const script = new Script()
    const webpage = new Webpage()

    script.init()
    script.updateVersion()
    script.readConfig()
    script.addScriptMenu()

    // 所有页面
    if (gm.config.headerButton) {
      webpage.fnHeaderButton()
    }
    if (urlMatch(gm.regex.page_watchlaterList)) {
      // 列表页面
      webpage.fnOpenListVideo()
      webpage.adjustWatchlaterListUI()
      if (gm.config.removeHistory || gm.config.forceConsistentVideo) {
        webpage.saveWatchlaterListData()
        if (gm.config.forceConsistentVideo) {
          webpage.fnForceConsistentVideo()
        }
      }
    } else if (urlMatch(gm.regex.page_videoNormalMode)) {
      // 播放页面（正常模式）
      if (gm.config.videoButton) {
        webpage.fnVideoButton_Normal()
      }
    } else if (urlMatch(gm.regex.page_videoWatchlaterMode)) {
      // 播放页面（稍后再看模式）
      if (gm.config.videoButton) {
        webpage.fnVideoButton_Watchlater()
      }
      if (gm.config.forceConsistentVideo) {
        webpage.forceConsistentVideoInWatchlaterMode()
      }
    } else if (urlMatch(gm.regex.page_dynamicMenu)) {
      // 动态入口弹出菜单页面的处理
      webpage.addMenuScrollbarStyle()
      return
    }
    webpage.addStyle()
  })

  /* ----- END ----- */

  /**
   * GM 读取流程
   *
   * 一般情况下，读取用户配置；如果配置出错，则沿用默认值，并将默认值写入配置中
   *
   * @param {string} gmKey 键名
   * @param {*} defaultValue 默认值
   * @param {boolean} [writeback=true] 配置出错时是否将默认值回写入配置中
   * @returns {*} 通过校验时是配置值，不能通过校验时是默认值
   */
  function gmValidate(gmKey, defaultValue, writeback = true) {
    const value = GM_getValue(gmKey)
    if (Enums && gmKey in Enums) {
      if (Enums[gmKey][value]) {
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
    // 这里不能用读取页面 Vue 或者 window.aid 的方式来直接获取目标 URL，那样太慢了，直接从 URL 反推才是最快的。
    // 不要担心由于稍后再看列表在其他地方被改动，导致当前分 P 与实际位置对不上，从而导致重定向到另一个视频上。之所以
    // 这样说，不是因为这种情况不会发生，而是因为这是 B 站自己的问题，即使不做重定向，在这种情况下也必然会打开到另一
    // 个视频上。
    // 为了彻底解决这种特殊情况，引入另一个功能“避免在特殊情况下，点击A视频却打开B视频的情况”。
    GM_xmlhttpRequest({
      method: 'GET',
      url: gm.url.api_queryWatchlaterList,
      onload: function(response) {
        try {
          let part = 1
          if (urlMatch(/watchlater\/p\d+/)) {
            part = parseInt(location.href.match(/(?<=\/watchlater\/p)\d+(?=\/?)/)[0])
          } // 如果匹配不上，就是以 watchlater/ 直接结尾，等同于 watchlater/p1
          const json = JSON.parse(response.responseText)
          const watchlaterList = json.data.list || []
          location.replace(gm.url.page_videoNormalMode + '/' + watchlaterList[part - 1].bvid)
        } catch (e) {
          const errorInfo = gm.error.REDIRECT
          console.error(errorInfo)
          console.error(e)

          const rc = confirm(errorInfo + '\n\n是否暂时关闭模式切换功能？')
          if (rc) {
            gm.config.redirect = false
            GM_setValue('redirect', gm.config.redirect)
            location.reload()
          } else {
            location.replace(gm.url.page_watchlaterList)
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
   * 脚本运行的抽象，脚本独立于网站、为脚本本身服务的部分
   */
  class Script {
    constructor() {
      this.api = new API()
    }

    /**
     * 初始化
     */
    init() {
      gm.url = {
        ...gm.url,
        api_addToWatchlater: 'https://api.bilibili.com/x/v2/history/toview/add',
        api_removeFromWatchlater: 'https://api.bilibili.com/x/v2/history/toview/del',
        page_videoWatchlaterMode: 'https://www.bilibili.com/medialist/play/watchlater',
        page_watchlaterPlayAll: 'https://www.bilibili.com/medialist/play/watchlater/p1',
        gm_changelog: 'https://greasyfork.org/zh-CN/scripts/395456/versions',
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
        defaultRhst: 16,
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
        headerButtonOpL: Enums.headerButtonOp.openListInCurrent,
        headerButtonOpR: Enums.headerButtonOp.openUserSetting,
        openHeaderMenuLink: Enums.openHeaderMenuLink.openInCurrent,
        menuScrollbarSetting: Enums.menuScrollbarSetting.beautify,
        videoButton: true,
        openListVideo: Enums.openListVideo.openInCurrent,
        forceConsistentVideo: true,
        removeHistory: true,
        removeHistorySaves: gm.const.defaultRhs,
        removeHistorySearchTimes: gm.const.defaultRhst,
        removeButton_removeAll: false,
        removeButton_removeWatched: false,
        resetAfterFnUpdate: false,
        reloadAfterSetting: true,
      }

      gm.data = {
        removeHistoryData: remove => {
          const _ = gm.data._
          if (remove) {
            _.removeHistoryData = undefined
          } else {
            if (!_.removeHistoryData) {
              let data = GM_getValue('removeHistoryData')
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
        watchlaterListData: null,
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
    updateVersion() {
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
            const removeHistory = GM_getValue('removeHistory')
            if (removeHistory) {
              // 修改容量
              const removeHistoryData = GM_getValue('removeHistoryData')
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
            const openHeaderMenuLink = gmValidate('openHeaderDropdownLink', gm.config.openHeaderMenuLink, false)
            GM_setValue('openHeaderMenuLink', openHeaderMenuLink)
            GM_deleteValue('openHeaderDropdownLink')

            gm.configVersion = 20200721
            GM_setValue('configVersion', gm.configVersion)
          }
          // 3.1.0.20200722
          if (gm.configVersion < 20200722) {
            const exec = name => {
              let cfg = GM_getValue(name)
              if (typeof cfg == 'string') {
                cfg = cfg.replace(/^[a-z]*_/, '')
              }
              GM_setValue(name, cfg)
            }
            for (const name of ['headerButtonOpL', 'headerButtonOpR', 'openHeaderMenuLink', 'openListVideo']) {
              exec(name)
            }

            gm.configVersion = 20200722
            GM_setValue('configVersion', gm.configVersion)
          }
        } else if (gm.configVersion === undefined) {
          if (GM_getValue('gm395456') > 0) {
            // 2.6.0.20200717 版本重构
            for (const name in gm.config) {
              const oldName = 'gm395456_' + name
              const value = GM_getValue(oldName)
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
    readConfig() {
      const cfgDocumentStart = { redirect: true } // document-start 时期就处理过的配置
      if (gm.configVersion > 0) {
        // 对配置进行校验
        const cfgManual = { resetAfterFnUpdate: true } // 手动处理的配置
        const cfgNoWriteback = { removeHistorySearchTimes: true } // 不进行回写的配置
        for (const name in gm.config) {
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
        const cfgManual = { removeHistorySaves: true, removeHistorySearchTimes: true }
        for (const name in gm.config) {
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
    addScriptMenu() {
      const self = this
      // 用户配置设置
      GM_registerMenuCommand('用户设置', () => self.openUserSetting())
      if (!gm.configVersion) { // 初始化
        self.openUserSetting(true)
      }
      if (gm.config.removeHistory) {
        // 稍后再看移除记录
        GM_registerMenuCommand('稍后再看移除记录', () => self.openRemoveHistory()) // 注意不要直接传函数对象，否则 this 不对
        // 清空列表页面数据
        GM_registerMenuCommand('清空列表页面数据', () => self.cleanRemoveHistoryData())
      }
      // 强制初始化
      GM_registerMenuCommand('初始化脚本', () => self.resetScript())
    }

    /**
     * 打开用户设置
     * @param {boolean} [initial] 是否进行初始化设置
     */
    openUserSetting(initial) {
      const self = this
      if (gm.el.setting) {
        self.openMenuItem('setting')
      } else {
        const el = {}
        const configMap = {
          // { attr, manual, needNotReload }
          headerButton: { attr: 'checked' },
          openHeaderMenuLink: { attr: 'value' },
          menuScrollbarSetting: { attr: 'value' },
          headerButtonOpL: { attr: 'value' },
          headerButtonOpR: { attr: 'value' },
          videoButton: { attr: 'checked' },
          redirect: { attr: 'checked' },
          openListVideo: { attr: 'value' },
          forceConsistentVideo: { attr: 'checked' },
          removeHistory: { attr: 'checked', manual: true },
          removeHistorySaves: { attr: 'value', manual: true, needNotReload: true },
          removeHistorySearchTimes: { attr: 'value', manual: true, needNotReload: true },
          removeButton_removeAll: { attr: 'checked' },
          removeButton_removeWatched: { attr: 'checked' },
          resetAfterFnUpdate: { attr: 'checked', needNotReload: true },
          reloadAfterSetting: { attr: 'checked', needNotReload: true },
        }
        setTimeout(() => {
          initSetting()
          processConfigItem()
          processSettingItem()
          self.openMenuItem('setting')
        })

        /**
         * 设置页面初始化
         */
        const initSetting = () => {
          gm.el.setting = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.setting.el = gm.el.setting
          gm.el.setting.className = 'gm-setting'
          gm.el.setting.innerHTML = `
<div id="gm-setting-page">
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
                  <option value="${Enums.openHeaderMenuLink.openInCurrent}">在当前页面打开</option>
                  <option value="${Enums.openHeaderMenuLink.openInNew}">在新标签页打开</option>
              </select>
          </div>
          <div class="gm-subitem" title="对弹出菜单中滚动条样式进行设置。为了保持行为一致，这个选项也会影响“动态”、“历史”等其他入口的弹出菜单。">
              <span>对于弹出菜单中的滚动条</span>
              <select id="gm-menuScrollbarSetting">
                  <option value="${Enums.menuScrollbarSetting.beautify}">修改其外观为扁平化风格</option>
                  <option value="${Enums.menuScrollbarSetting.hidden}">将其隐藏（不影响鼠标滚动）</option>
                  <option value="${Enums.menuScrollbarSetting.original}">维持官方的滚动条样式</option>
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
              <option value="${Enums.openListVideo.openInCurrent}">在当前页面打开</option>
              <option value="${Enums.openListVideo.openInNew}">在新标签页打开</option>
          </select>
      </label>
      <label class="gm-item" title="见弹出说明">
          <span>【列表页面】避免在特殊情况下，点击A视频却打开B视频的情况</span>
          <span id="gm-fcvInformation" class="gm-information" title="">💬</span>
          <input id="gm-forceConsistentVideo" type="checkbox">
      </label>
      <div class="gm-item">
          <label title="保留最近几次打开【${gm.url.page_watchlaterList}】页面时稍后再看列表的记录，以查找出这段时间内将哪些视频移除出稍后再看，用于防止误删操作。关闭该选项后，会将内部历史数据清除！">
              <span>【列表页面】开启稍后再看移除记录</span>
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
      <label class="gm-item" title="这个按钮太危险了，看着就让人不舒服……">
          <span>【列表页面】移除“一键清空”按钮</span><input id="gm-removeButton_removeAll" type="checkbox"></label>
      <label class="gm-item" title="这个按钮太危险了，看着就让人不舒服……">
          <span>【列表页面】移除“移除已观看视频”按钮</span><input id="gm-removeButton_removeWatched" type="checkbox"></label>
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
          for (const name in gm.config) {
            el[name] = gm.el.setting.querySelector('#gm-' + name)
          }

          el.settingPage = gm.el.setting.querySelector('#gm-setting-page')
          el.save = gm.el.setting.querySelector('#gm-save')
          el.cancel = gm.el.setting.querySelector('#gm-cancel')
          el.shadow = gm.el.setting.querySelector('.gm-shadow')
          el.reset = gm.el.setting.querySelector('#gm-reset')
          el.reset.onclick = () => self.resetScript()
          el.cleanRemoveHistoryData = gm.el.setting.querySelector('#gm-cleanRemoveHistoryData')
          el.cleanRemoveHistoryData.onclick = function() {
            el.removeHistory.checked && self.cleanRemoveHistoryData()
          }

          el.fcvInformation = gm.el.setting.querySelector('#gm-fcvInformation')
          self.api.message.advanced(el.fcvInformation, `
<div style="text-indent:2em;line-height:1.6em;">
  <p>从列表页面打开视频时，其URL使用该视频在列表中的位置来标识。假如列表在其他页面上被修改，这种定位方式就会出错。这是B站新版稍后再看播放页面的设计缺陷，本设置开启后能修复这个问题。</>
  <p>假设先打开列表页面，此时列表的第1个视频是A，然后在其他页面将B视频添加到稍后再看，最后回到刚才列表页面点击A视频，结果播放的会是此时真正位于列表第1位的B视频。</p>
  <p>在正常使用的情况下，这个问题出现的频率并不高；此外，如果没有开启模式切换功能，在修复成功后浏览器的历史回退功能会受到影响，且修复过程可能会伴随页面内容切换和不明显的URL变动。如果不希望见到这些问题，或者只是单纯不想在页面引入不必要的脚本操作，可以选择关闭。</p>
</div>
        `, '💬', { width: '36em', flagSize: '2em' }) // 谨慎地调这个宽度，不然又会引起字体发虚问题
          el.rhWarning = gm.el.setting.querySelector('#gm-rhWarning')
          self.api.message.advanced(el.rhWarning, '关闭移除记录，或将列表页面数据保存次数设置为比原来小的值，都会造成对内部过期历史数据的清理！', '⚠')
          el.rhsWarning = gm.el.setting.querySelector('#gm-rhsWarning')
          self.api.message.advanced(el.rhsWarning, `该项设置过大时，在极端情况下可能会造成明显的卡顿，一般不建议该项超过${gm.const.rhsWarning}。当然，如果对机器的读写性能自信，可以无视该警告。`, '⚠')

          el.headerButtonOpL.innerHTML = el.headerButtonOpR.innerHTML = `
<option value="${Enums.headerButtonOp.openListInCurrent}">在当前页面打开列表页面</option>
<option value="${Enums.headerButtonOp.openListInNew}">在新标签页打开列表页面</option>
<option value="${Enums.headerButtonOp.playAllInCurrent}">在当前页面播放全部</option>
<option value="${Enums.headerButtonOp.playAllInNew}">在新标签页播放全部</option>
<option value="${Enums.headerButtonOp.openUserSetting}">打开用户设置</option>
<option value="${Enums.headerButtonOp.openRemoveHistory}">打开稍后再看移除记录</option>
<option value="${Enums.headerButtonOp.noOperation}">不执行操作</option>
      `
        }

        /**
         * 维护与设置项相关的数据和元素
         */
        const processConfigItem = () => {
          // 子项与父项相关联
          const subitemChange = (item, subs) => {
            for (const el of subs) {
              const parent = el.parentNode
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
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
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
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
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
        const processSettingItem = () => {
          const self = this
          el.save.onclick = onSave
          gm.menu.setting.openHandler = onOpen
          el.cancel.onclick = () => self.closeMenuItem('setting')
          el.shadow.onclick = function() {
            if (!this.getAttribute('disabled')) {
              self.closeMenuItem('setting')
            }
          }
          if (initial) {
            el.reset.style.display = 'none'
            el.cancel.disabled = true
            el.shadow.setAttribute('disabled', 'disabled')
          }
        }

        let needReload = false
        /**
         * 设置保存时执行
         */
        const onSave = () => {
          // 通用处理
          for (const name in configMap) {
            const cfg = configMap[name]
            if (!cfg.manual) {
              const change = saveConfig(name, cfg.attr)
              if (!cfg.needNotReload) {
                needReload = needReload || change
              }
            }
          }

          // 特殊处理
          let resetMaxSize = false
          // removeHistory
          if (gm.config.removeHistory != el.removeHistory.checked) {
            gm.config.removeHistory = el.removeHistory.checked
            GM_setValue('removeHistory', gm.config.removeHistory)
            resetMaxSize = true
            needReload = true
          }
          // “因”中无 removeHistory，就说明 needReload 需要设置为 true，除非“果”不需要刷新页面就能生效
          if (gm.config.removeHistory) {
            const rhsV = parseInt(el.removeHistorySaves.value)
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
            const rhstV = parseInt(el.removeHistorySearchTimes.value)
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

          self.closeMenuItem('setting')
          if (initial) {
            // 更新配置版本
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
            // 关闭初始化状态
            setTimeout(() => {
              el.reset.style.display = ''
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
        const onOpen = () => {
          for (const name in configMap) {
            const attr = configMap[name].attr
            el[name][attr] = gm.config[name]
          }
          el.headerButton.onchange()
          el.removeHistory.onchange()

          if (gm.config.removeHistory) {
            setTimeout(() => {
              const arrayData = gm.data.removeHistoryData().toArray()
              const total = arrayData.reduce((prev, current) => {
                return prev + current.length
              }, 0)
              if (gm.menu.setting.state && typeof total == 'number') {
                el.cleanRemoveHistoryData.innerText = `清空数据(${total}条)`
              }
            })
          } else {
            el.cleanRemoveHistoryData.innerText = '清空数据(0条)'
          }

          el.settingPage.parentNode.style.display = 'block'
          setTimeout(() => {
            self.api.dom.setAbsoluteCenter(el.settingPage)
          }, 10)
        }

        /**
         * 保存配置
         * @param {string} name 配置名称
         * @param {string} attr 从对应元素的什么属性读取
         * @returns {boolean} 是否有实际更新
         */
        const saveConfig = (name, attr) => {
          const elValue = el[name][attr]
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
        const setRhWaring = () => {
          let warn = false
          const rh = el.removeHistory.checked
          if (!rh) {
            warn = true
          } else {
            let rhs = parseInt(el.removeHistorySaves.value)
            if (isNaN(rhs)) {
              rhs = 0
            }
            if (rhs < gm.config.removeHistorySaves) {
              warn = true
            }
          }

          if (el.rhWarning.show) {
            if (!warn) {
              self.api.dom.fade(false, el.rhWarning)
              el.rhWarning.show = false
            }
          } else {
            if (warn) {
              self.api.dom.fade(true, el.rhWarning)
              el.rhWarning.show = true
            }
          }
        }

        /**
         * 设置 removeHistorySaves 警告项
         */
        const setRhsWarning = () => {
          let value = parseInt(el.removeHistorySaves.value)
          if (isNaN(value)) {
            value = 0
          }
          if (el.rhsWarning.show) {
            if (value <= gm.const.rhsWarning) {
              self.api.dom.fade(false, el.rhsWarning)
              el.rhsWarning.show = false
            }
          } else {
            if (value > gm.const.rhsWarning) {
              self.api.dom.fade(true, el.rhsWarning)
              el.rhsWarning.show = true
            }
          }
        }
      }
    }

    /**
     * 打开移除记录
     */
    openRemoveHistory() {
      const self = this
      if (!gm.config.removeHistory) {
        self.api.message.create('请在设置中开启稍后再看移除记录')
        return
      }

      const el = {}
      if (gm.el.history) {
        el.searchTimes = gm.el.history.querySelector('#gm-search-times')
        el.searchTimes.current = gm.config.removeHistorySearchTimes < gm.data.removeHistoryData().size ? gm.config.removeHistorySearchTimes : gm.data.removeHistoryData().size
        el.searchTimes.value = el.searchTimes.current

        el.historySort = gm.el.history.querySelector('#gm-history-sort')
        if (el.historySort.type !== 0) {
          el.historySort.setType(0) // 倒序
        }

        self.openMenuItem('history')
      } else {
        setTimeout(() => {
          initHistory()
          processItem()
          self.openMenuItem('history')
        })

        /**
         * 初始化移除记录页面
         */
        const initHistory = () => {
          gm.el.history = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.history.el = gm.el.history
          gm.el.history.className = 'gm-history'
          gm.el.history.innerHTML = `
<div class="gm-history-page">
  <div class="gm-title">稍后再看移除记录</div>
  <div class="gm-comment">
      <div>根据最近<span id="gm-save-times">0</span>次打开列表页面时获取到的<span id="gm-record-num">0</span>条不重复的记录生成（总计<span id="gm-record-num-repeat">0</span>条），共筛选出<span id="gm-remove-num">0</span>条移除记录。排序由视频最后一次加入到稍后再看的时间决定，与移除出稍后再看的时间无关。如果记录太多难以定位被误删的视频，请在下方设置减少历史回溯深度。鼠标移动到内容区域可向下滚动翻页，点击对话框以外的位置退出。</div>
      <div style="text-align:right;font-weight:bold">
          <span id="gm-history-sort" style="text-decoration:underline;cursor:pointer">倒序</span>
          <span title="搜寻时在最近多少次列表页面数据中查找，设置较小的值能较好地定位最近移除的视频。按下回车键或输入框失去焦点时刷新数据，输入框为空时自动设为可取的最大值。">历史回溯深度：<input type="text" id="gm-search-times" value="0"></span>
      </div>
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
        const processItem = () => {
          // 使用 el.searchTimes.current 代替本地变量记录数据，可以保证任何情况下闭包中都能获取到正确数据
          el.searchTimes = gm.el.history.querySelector('#gm-search-times')
          el.searchTimes.current = gm.config.removeHistorySearchTimes < gm.data.removeHistoryData().size ? gm.config.removeHistorySearchTimes : gm.data.removeHistoryData().size
          el.searchTimes.value = el.searchTimes.current

          const stMin = 1
          el.searchTimes.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              const stMax = gm.data.removeHistoryData().size
              let value = parseInt(v0)
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
              this.value = gm.data.removeHistoryData().size
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

          // 排序方式
          el.historySort = gm.el.history.querySelector('#gm-history-sort')
          el.historySort.type = 0
          el.historySort.typeText = ['降序', '升序']
          // el.historySort.innerText = el.historySort.typeText[el.historySort.type]
          el.historySort.title = '点击切换升序'
          el.historySort.setType = function(type) {
            this.type = type
            this.innerText = this.typeText[type]
            this.title = '点击切换' + this.typeText[(type + 1) % 2]
          }
          el.historySort.onclick = function() {
            this.setType((this.type + 1) % 2)
            gm.menu.history.openHandler()
          }

          gm.menu.history.openHandler = onOpen
          window.addEventListener('resize', setContentTop)
          el.shadow.onclick = () => self.closeMenuItem('history')
        }

        /**
         * 移除记录打开时执行
         */
        const onOpen = () => {
          if (el.content) {
            const oldContent = el.content
            oldContent.style.opacity = '0'
            setTimeout(() => {
              oldContent.remove()
            }, gm.const.textFadeTime)
          }
          el.content = el.historyPage.appendChild(document.createElement('div'))
          el.content.className = 'gm-content'

          el.historyPage.parentNode.style.display = 'block'
          setTimeout(() => {
            self.api.dom.setAbsoluteCenter(el.historyPage)
          }, 10)

          GM_xmlhttpRequest({
            method: 'GET',
            url: gm.url.api_queryWatchlaterList,
            onload: function(response) {
              try {
                const bvid = []
                const json = JSON.parse(response.responseText)
                const watchlaterList = json.data.list || []
                for (const e of watchlaterList) {
                  bvid.push(e.bvid)
                }
                const map = new Map()
                const removeData = gm.data.removeHistoryData().toArray(el.searchTimes.current)
                el.saveTimes.innerText = removeData.length
                let total = 0
                // 升序时，假如视频 A 在早期就加入了稍后再看，但是很久都没有看
                // 之后再次加入，这种情况下我们认为视频 A 是很晚才加入，而选择性忽略它早期就加入的事实
                for (const records of removeData) {
                  for (const record of records) {
                    if (!map.has(record.bvid)) {
                      map.set(record.bvid, record) // 往后是旧的信息，弃之不用
                    }
                  }
                  total += records.length
                }
                el.recordNum.innerText = map.size
                el.recordNumRepeat.innerText = total
                for (const id of bvid) {
                  map.delete(id)
                }
                const result = []
                for (const rm of map.values()) {
                  result.push(`<div><div>${rm.title}</div><a href="${gm.url.page_videoNormalMode}/${rm.bvid}" target="_blank">${rm.bvid}</a></div>`)
                }
                el.removeNum.innerText = result.length

                setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
                if (result.length > 0) {
                  if (el.historySort.type === 1) {
                    result.reverse()
                  }
                  el.content.innerHTML = result.join('<br>')
                } else {
                  el.content.innerText = `在最近 ${el.searchTimes.current} 次列表页面数据中没有找到被移除的记录，请尝试增大历史回溯深度`
                  el.content.style.color = 'gray'
                }
                el.content.style.opacity = '1'
              } catch (e) {
                const errorInfo = gm.error.NETWORK
                setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
                el.content.innerHTML = errorInfo
                el.content.style.opacity = '1'
                el.content.style.color = 'gray'

                console.error(errorInfo)
                console.error(e)
              }
            }
          })
        }

        const setContentTop = () => {
          if (el.content) {
            el.content.style.top = el.comment.offsetTop + el.comment.offsetHeight + 'px'
          }
        }
      }
    }

    /**
     * 初始化脚本
     */
    resetScript() {
      const result = confirm('是否要初始化脚本？\n\n注意：本操作不会清理内部保存的列表页面数据，要清理列表页面数据请在用户设置中操作。')
      if (result) {
        const keyNoReset = { removeHistorySaves: true, removeHistoryData: true }
        const gmKeys = GM_listValues()
        for (const gmKey of gmKeys) {
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
    cleanRemoveHistoryData() {
      const result = confirm('是否要清空列表页面数据？')
      if (result) {
        this.closeMenuItem('setting')
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
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 打开菜单项后的回调函数
     */
    openMenuItem(name, callback) {
      const self = this
      if (!gm.menu[name].state) {
        for (const key in gm.menu) {
          /** @type {GMObject_menu_item} */
          const menu = gm.menu[key]
          if (key == name) {
            menu.state = true
            menu.openHandler && menu.openHandler.call(menu)
            self.api.dom.fade(true, menu.el, callback)
          } else {
            if (menu.state) {
              self.closeMenuItem(key)
            }
          }
        }
      }
    }

    /**
     * 对“关闭菜单项”这一操作进行处理，包括隐藏菜单项、设置当前菜单项的状态
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 关闭菜单项后的回调函数
     */
    closeMenuItem(name, callback) {
      /** @type {GMObject_menu_item} */
      const menu = gm.menu[name]
      if (menu.state) {
        menu.state = false
        this.api.dom.fade(false, menu.el, () => {
          menu.closeHandler && menu.closeHandler.call(menu)
          callback && callback.call(menu)
        })
      }
    }
  }

  /**
   * 页面处理的抽象，脚本围绕网站的特化部分
   */
  class Webpage {
    constructor() {
      this.script = new Script()
      this.api = new API()
    }

    /**
     * 顶栏中加入稍后再看入口
     */
    fnHeaderButton() {
      const self = this
      self.api.wait.executeAfterElementLoaded({
        selector: '.user-con.signin',
        callback: header => {
          if (header) {
            const collect = header.children[4]
            const watchlater = document.createElement('div')
            watchlater.className = 'item'
            const link = watchlater.appendChild(document.createElement('a'))
            const text = link.appendChild(document.createElement('span'))
            text.className = 'name'
            text.innerText = '稍后再看'
            header.insertBefore(watchlater, collect)

            processLeftClick(link)
            processRightClick(watchlater)
            processTooltip({ collect, watchlater })
          }
        },
      })

      /**
       * 处理鼠标左键点击
       */
      const processLeftClick = link => {
        // 使用 href 和 target 的方式设置，保留浏览器中键强制新标签页打开的特性
        const left = getHrefAndTarget(gm.config.headerButtonOpL)
        link.href = left.href
        link.target = left.target
        switch (gm.config.headerButtonOpL) {
          case Enums.headerButtonOp.openUserSetting:
            link.onclick = () => self.script.openUserSetting()
            break
          case Enums.headerButtonOp.openRemoveHistory:
            link.onclick = () => self.script.openRemoveHistory()
            break
        }
      }

      /**
       * 处理鼠标右键点击
       */
      const processRightClick = watchlater => {
        watchlater.oncontextmenu = function(e) {
          if (gm.config.headerButtonOpR != Enums.headerButtonOp.noOperation) {
            e && e.preventDefault && e.preventDefault()
          }
          switch (gm.config.headerButtonOpR) {
            case Enums.headerButtonOp.openListInCurrent:
            case Enums.headerButtonOp.openListInNew:
            case Enums.headerButtonOp.playAllInCurrent:
            case Enums.headerButtonOp.playAllInNew: {
              const right = getHrefAndTarget(gm.config.headerButtonOpR)
              window.open(right.href, right.target)
              break
            }
            case Enums.headerButtonOp.openUserSetting:
              self.script.openUserSetting()
              break
            case Enums.headerButtonOp.openRemoveHistory:
              self.script.openRemoveHistory()
              break
          }
        }
      }

      /**
       * 处理弹出菜单
       */
      function processTooltip({ collect, watchlater }) {
        // 鼠标移动到稍后再看入口上时，以 Tooltip 形式显示稍后再看列表
        const menuSelector = open => { // 注意，该 selector 无法直接选出对应的弹出菜单，只能用作拼接
          if (typeof open == 'boolean') {
            return `[role=tooltip][aria-hidden=${!open}]`
          } else {
            return '[role=tooltip][aria-hidden]'
          }
        }
        const tabsPanelSelector = open => `${menuSelector(open)} .tabs-panel`
        const videoPanelSelector = open => `${menuSelector(open)} .favorite-video-panel`

        const defaultCollectPanelChildSelector = open => `${tabsPanelSelector(open)} [title=默认收藏夹]`
        const watchlaterPanelChildSelector = open => `${tabsPanelSelector(open)} [title=稍后再看]`
        const activePanelSelector = open => `${tabsPanelSelector(open)} .tab-item--active`

        // 运行到这里的时候，menu 其实在收藏入口元素下面，后来不知道为什么被移到外面
        const menu = document.querySelector(tabsPanelSelector(false)).parentNode.parentNode
        const dispVue = collect.firstChild.__vue__

        setTimeout(() => {
          processMenuClose()
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
        const processMenuClose = function() {
          const miniFavorite = collect.querySelector('.mini-favorite')
          const listener = dispVue.handleMouseLeave
          // 真以为我就没法拦截到你？
          miniFavorite.removeEventListener('mouseleave', listener)
          const collectListener = function() {
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
          const menuListener = function() {
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
        const onEnterWatchlater = async function() {
          this.mouseOver = true
          addHeaderMenuLinkObserver()
          try {
            const activePanel = document.querySelector(activePanelSelector(true))
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
            const watchlaterPanelChild = await self.api.wait.waitForElementLoaded({
              selector: watchlaterPanelChildSelector(true),
              interval: 50,
              timeout: 2000,
            })
            watchlaterPanelChild.parentNode.click()
          } catch (e) {
            console.error(gm.error.HTML_PARSING)
            console.error(e)
          }
          setMenuArrow()
        }

        /**
         * 离开稍后再看入口的处理
         */
        const onLeaveWatchlater = function() {
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
        const onEnterCollect = async function() {
          this.mouseOver = true
          addHeaderMenuLinkObserver()
          try {
            const activePanel = await self.api.wait.waitForElementLoaded({
              selector: activePanelSelector(true),
              interval: 50,
              timeout: 1500,
            })
            const activeTitle = activePanel.firstChild.title
            if (activeTitle == '稍后再看') {
              if (!collect._activePanel || collect._activeTitle == '稍后再看') {
                // 一般来说，只有当打开页面后直接通过稍后再看入口打开弹出菜单，然后再将鼠标移动到收藏入口上，才会执行进来
                const defaultCollectPanelChild = await self.api.wait.waitForElementLoaded({
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
          setMenuArrow()
        }

        /**
         * 离开收藏入口的处理
         */
        const onLeaveCollect = function() {
          this.mouseOver = false
        }

        /**
         * 为稍后再看菜单中添加一个 ob，实时追踪内部的链接并进行处理
         * @async
         */
        const addHeaderMenuLinkObserver = async () => {
          // 目前默认原来是 _blank，如果以后 B 站改成默认 _self，那要反过来
          if (!menu._addLinkObserver && gm.config.openHeaderMenuLink == Enums.openHeaderMenuLink.openInCurrent) {
            menu._addLinkObserver = true
            try {
              // const target = gm.config.openHeaderMenuLink == enums.openHeaderMenuLink.openInNew ? '_blank' : '_self'
              const target = '_self'
              const videoPanel = await self.api.wait.waitForElementLoaded(videoPanelSelector())
              // 添加一个 ob，在给右边视频面板添加链接时，对其进行处理
              const ob = new MutationObserver(records => {
                for (const record of records) {
                  for (const addedNode of record.addedNodes) {
                    if (addedNode.nodeName == 'A' && addedNode.target != target) {
                      addedNode.target = target
                    }
                  }
                }
                // 不要 observer.disconnect()，需一直监听变化
              })
              ob.observe(videoPanel.firstChild, { childList: true })
            } catch (e) {
              menu._addLinkObserver = false
              console.error(gm.error.HTML_PARSING)
              console.error(e)
            }
          }
        }

        /**
         * 设置弹出菜单的顶上的小箭头位置
         */
        const setMenuArrow = () => {
          setTimeout(() => {
            const menuArrow = menu.querySelector('.popper__arrow')
            let left = menuArrow.style.left
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
      }

      function getHrefAndTarget(op) {
        let href = ''
        if (/openList/i.test(op)) {
          href = gm.url.page_watchlaterList
        } else if (/playAll/.test(op)) {
          href = gm.url.page_watchlaterPlayAll
        } else {
          href = gm.url.noop
        }
        let target = ''
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
    fnVideoButton_Normal() {
      const self = this

      /**
       * 继续执行的条件
       */
      const executeCondition = () => {
        // 必须在确定 Vue 加载完成后再修改 DOM 结构，否则会导致 Vue 加载出错造成页面错误
        const app = document.querySelector('#app')
        const vueLoad = app && app.__vue__
        if (!vueLoad) {
          return false
        }
        const atr = document.querySelector('#arc_toolbar_report')
        const original = atr && atr.querySelector('.van-watchlater')
        if (original && original.__vue__) {
          return { atr, original }
        } else {
          return false
        }
      }

      self.api.wait.executeAfterConditionPassed({
        condition: executeCondition,
        callback: ({ atr, original }) => {
          const oVue = original.__vue__
          const btn = document.createElement('label')
          btn.id = `${gm.id}-normal-video-btn`
          const cb = document.createElement('input')
          cb.type = 'checkbox'
          btn.appendChild(cb)
          const text = document.createElement('span')
          text.innerText = '稍后再看'
          btn.className = 'appeal-text'
          cb.onclick = function() { // 不要附加到 btn 上，否则点击时会执行两次
            oVue.handler()
            const checked = !oVue.added
            // 检测操作是否生效，失败时弹出提示
            self.api.wait.executeAfterConditionPassed({
              condition: () => checked === oVue.added,
              callback: () => { cb.checked = checked },
              interval: 50,
              timeout: 500,
              onTimeout: () => {
                cb.checked = oVue.added
                self.api.message.create(checked ? '添加至稍后再看失败' : '从稍后再看移除失败')
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
      const setButtonStatus = async (oVue, cb) => {
        const aid = oVue.aid // also unsafeWindow.aid
        const status = await self.getVideoWatchlaterStatusByAid(aid)
        oVue.added = status
        cb.checked = status
      }
    }

    /**
     * 稍后再看播放页加入快速切换稍后再看状态的按钮
     */
    fnVideoButton_Watchlater() {
      const self = this
      let bus = {}
      /**
       * 继续执行的条件
       */
      const executeCondition = () => {
        // 必须在确定 Vue 加载完成后再修改 DOM 结构，否则会导致 Vue 加载出错造成页面错误
        const app = document.querySelector('#app')
        const vueLoad = app && app.__vue__
        if (!vueLoad) {
          return false
        }
        const playContainer = app.querySelector('#playContainer')
        if (playContainer.__vue__.playId) {
          // 等到能获取到 aid 再进入，免得等下处处都要异步处理
          return playContainer
        }
      }

      self.api.wait.executeAfterConditionPassed({
        condition: executeCondition,
        callback: playContainer => {
          const more = playContainer.querySelector('#playContainer .left-container .play-options .play-options-more')
          const btn = document.createElement('label')
          btn.id = `${gm.id}-watchlater-video-btn`
          btn.onclick = e => e.stopPropagation()
          const cb = document.createElement('input')
          cb.type = 'checkbox'
          btn.appendChild(cb)
          const text = document.createElement('span')
          text.innerText = '稍后再看'
          btn.appendChild(text)

          // 确保与其他脚本配合时相关 UI 排列顺序不会乱
          let gmContainer = more.querySelector('[id=gm-container]')
          if (!gmContainer) {
            gmContainer = more.appendChild(document.createElement('span'))
            gmContainer.id = 'gm-container'
            gmContainer.style.float = 'left'
          }
          gmContainer.appendChild(btn)

          btn.added = true
          cb.checked = true // 第一次打开时，默认在稍后再看中
          const csrf = getCsrf()
          cb.onclick = () => executeSwitch() // 不要附加到 btn 上，否则点击时会执行两次
          bus = { ...bus, playContainer, btn, cb, csrf }
          bus.aid = getAid()

          // 切换视频时的处理
          createLocationchangeEvent()
          window.addEventListener('locationchange', async function() {
            try {
              bus.aid = await self.api.wait.waitForConditionPassed({
                condition: () => {
                  const aid = getAid()
                  if (aid && aid != bus.aid) {
                    return aid
                  }
                },
              })
              const status = await self.getVideoWatchlaterStatusByAid(bus.aid)
              btn.added = status
              cb.checked = status
            } catch (e) {
              console.error(gm.error.HTML_PARSING)
              console.error(e)
            }
          })
        },
      })

      /**
       * 处理视频状态的切换
       */
      const executeSwitch = () => {
        const btn = bus.btn
        const cb = bus.cb
        bus.aid = getAid()
        if (!bus.aid) {
          cb.checked = btn.added
          self.api.message.create('网络错误，操作失败')
          return
        }
        const data = new FormData()
        data.append('aid', bus.aid)
        data.append('csrf', bus.csrf)
        GM_xmlhttpRequest({
          method: 'POST',
          url: btn.added ? gm.url.api_removeFromWatchlater : gm.url.api_addToWatchlater,
          data: data,
          onload: function(response) {
            try {
              const note = btn.added ? '从稍后再看移除' : '添加到稍后再看'
              if (JSON.parse(response.response).code == 0) {
                btn.added = !btn.added
                cb.checked = btn.added
                self.api.message.create(note + '成功')
              } else {
                cb.checked = btn.added
                self.api.message.create(`网络错误，${note}失败`)
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
      const getCsrf = () => {
        let cookies = document.cookie.split('; ')
        cookies = cookies.reduce((prev, val) => {
          const parts = val.split('=')
          const key = parts[0]
          const value = parts[1]
          prev[key] = value
          return prev
        }, {})
        const csrf = cookies.bili_jct
        return csrf
      }

      /**
       * 获取当前页面对应的 aid
       */
      const getAid = () => {
        return unsafeWindow.aid || bus.playContainer.__vue__.playId
      }

      /**
       * 创建 locationchange 事件
       * @see {@link https://stackoverflow.com/a/52809105 How to detect if URL has changed after hash in JavaScript}
       */
      const createLocationchangeEvent = () => {
        if (!unsafeWindow._createLocationchangeEvent) {
          history.pushState = (f => function pushState() {
            const ret = f.apply(this, arguments)
            window.dispatchEvent(new Event('pushstate'))
            window.dispatchEvent(new Event('locationchange'))
            return ret
          })(history.pushState)
          history.replaceState = (f => function replaceState() {
            const ret = f.apply(this, arguments)
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
    async getVideoWatchlaterStatusByAid(aid) {
      // oVue.added 第一次取到的值总是 false，从页面无法获取到该视频是否已经在稍后再看列表中，需要使用API查询
      return new Promise(resolve => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: gm.url.api_queryWatchlaterList,
          onload: function(response) {
            try {
              const json = JSON.parse(response.responseText)
              const watchlaterList = json.data.list || []
              for (const e of watchlaterList) {
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
        })
      })
    }

    /**
     * 处理列表页面点击视频时的行为
     */
    fnOpenListVideo() {
      if (gm.config.openListVideo == Enums.openListVideo.openInNew) {
        // 如果列表页面在新标签页打开视频
        const base = document.head.appendChild(document.createElement('base'))
        base.id = 'gm-base'
        base.target = '_blank'
      }
    }

    /**
     * 避免在当前列表非最新的情况下，点击链接打开 A 视频，却实际打开 B 视频的情况
     * @async
     */
    async fnForceConsistentVideo() {
      const self = this
      try {
        const watchLaterList = await self.api.wait.waitForElementLoaded('.watch-later-list')
        let ob = new MutationObserver(async (records, observer) => {
          for (const record of records) {
            for (const addedNode of record.addedNodes) {
              if (addedNode.className == 'list-box') {
                let watchlaterListData = gm.data.watchlaterListData
                if (!watchlaterListData) {
                  try {
                    watchlaterListData = await self.api.wait.waitForConditionPassed({
                      condition: () => {
                        if (gm.data.watchlaterListData) {
                          return gm.data.watchlaterListData
                        }
                      },
                      interval: 50,
                      timeout: 2000,
                    })
                  } catch (e) {
                    console.error(gm.error.HTML_PARSING)
                    console.error(e)
                  }
                }
                const listBox = addedNode
                const list = listBox.firstChild.children
                for (let i = 0; i < list.length; i++) {
                  const links = list[i].querySelectorAll('a:not([class=user])') // 排除 .user，那是指向 UP 主的链接
                  for (const link of links) {
                    if (gm.config.redirect) {
                      link.href = gm.url.page_videoNormalMode + '/' + watchlaterListData[i].bvid
                    } else {
                      const url = new URL(link.href)
                      url.searchParams.set(`${gm.id}_bvid`, watchlaterListData[i].bvid)
                      link.href = url.href
                    }
                    link._bvlink = link.href
                  }
                }
                observer.disconnect()

                // 当从列表页面移除视频时，所有 <a> 的 href 会被改变，需要监听并重新修改
                const obCfg = { // 以 <a> 父节点为对象，再监听其子节点
                  attributes: true,
                  subtree: true, // 监听子节点
                }
                ob = new MutationObserver((records, observer) => {
                  observer.disconnect() // 先把 ob 停一下，不然你自己改的时候也会被监听到，死循环了
                  for (const record of records) {
                    if (record.target.nodeName == 'A' && record.attributeName == 'href') {
                      record.target.href = record.target._bvlink
                    }
                  }
                  observer.observe(listBox.firstChild, obCfg) // 继续
                })
                ob.observe(listBox.firstChild, obCfg)
                return
              }
            }
          }
        })
        ob.observe(watchLaterList, { childList: true })
      } catch (e) {
        console.error(gm.error.HTML_PARSING)
        console.error()
      }
    }

    /**
     * 对于稍后再看模式播放页，根据 URL 上的查询参数，强制切换到准确的视频上
     */
    async forceConsistentVideoInWatchlaterMode() {
      const self = this
      const paramBvid = gm.searchParams.get(`${gm.id}_bvid`)
      if (paramBvid) {
        try {
          const playlist = await self.api.wait.waitForElementLoaded('.player-auxiliary-collapse-playlist')
          const targetItem = await self.api.wait.waitForElementLoaded(`[data-bvid=${paramBvid}]`, playlist)
          const itemImg = targetItem.querySelector('.player-auxiliary-playlist-item-img')
          const playingImg = itemImg.querySelector('.player-auxiliary-playlist-item-img-playing')
          if (getComputedStyle(playingImg).display == 'none') {
            itemImg.click()
          }
        } catch (e) {
          console.error(gm.error.HTML_PARSING)
          console.error(e)
        }
      }
    }

    /**
     * 保存列表页面数据，用于后续操作
     */
    saveWatchlaterListData() {
      GM_xmlhttpRequest({
        method: 'GET',
        url: gm.url.api_queryWatchlaterList,
        onload: function(response) {
          const current = []
          try {
            const json = JSON.parse(response.responseText)
            const watchlaterList = json.data.list || []
            for (const e of watchlaterList) {
              current.push({
                title: e.title,
                bvid: e.bvid,
              })
            }
            gm.data.watchlaterListData = current
            if (gm.config.removeHistory) {
              gm.data.removeHistoryData().push(current)
              GM_setValue('removeHistoryData', gm.data.removeHistoryData())
            }
          } catch (e) {
            console.error(gm.error.NETWORK)
            console.error(e)
          }
        }
      })
    }

    /**
     * 调整列表页面的 UI
     * @async
     */
    async adjustWatchlaterListUI() {
      const self = this
      const r_con = await self.api.wait.waitForElementLoaded('.watch-later-list.bili-wrapper header .r-con')
      if (gm.config.removeHistory) {
        // 在列表页面加入“移除记录”
        const removeHistoryButton = r_con.appendChild(document.createElement('div'))
        removeHistoryButton.innerText = '移除记录'
        removeHistoryButton.className = 's-btn'
        removeHistoryButton.onclick = () => self.script.openRemoveHistory() // 要避免 MouseEvent 的传递
      }
      // 在列表页面加如“增强设置”
      const plusButton = r_con.appendChild(document.createElement('div'))
      plusButton.innerText = '增强设置'
      plusButton.className = 's-btn'
      plusButton.onclick = () => self.script.openUserSetting() // 要避免 MouseEvent 的传递
      // 移除“一键清空”按钮
      if (gm.config.removeButton_removeAll) {
        r_con.children[1].style.display = 'none'
      }
      // 移除“移除已观看视频”按钮
      if (gm.config.removeButton_removeWatched) {
        r_con.children[2].style.display = 'none'
      }
    }

    /**
     * 添加弹出菜单的滚动条样式
     */
    addMenuScrollbarStyle() {
      let menuScrollbarStyle
      switch (gm.config.menuScrollbarSetting) {
        case Enums.menuScrollbarSetting.beautify:
          // 目前在不借助 JavaScript 的情况下，无法完美实现类似于移动端滚动条浮动在内容上的效果。
          menuScrollbarStyle = `
[role=tooltip] ::-webkit-scrollbar,
#app > .out-container > .container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  background-color: #00000000;
}
[role=tooltip] ::-webkit-scrollbar-thumb,
#app > .out-container > .container::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: #00000000;
}
[role=tooltip] :hover::-webkit-scrollbar-thumb,
#app > .out-container > .container:hover::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: #0000002b;
}
[role=tooltip] ::-webkit-scrollbar-corner,
#app > .out-container > .container::-webkit-scrollbar-corner {
background-color: #00000000;
}
        `
          break
        case Enums.menuScrollbarSetting.hidden:
          menuScrollbarStyle = `
[role=tooltip] ::-webkit-scrollbar,
#app > .out-container > .container::-webkit-scrollbar {
  display: none;
}
        `
          break
        case Enums.menuScrollbarSetting.original:
        default:
          menuScrollbarStyle = ''
      }
      GM_addStyle(menuScrollbarStyle)
    }

    /**
     * 添加脚本样式
     */
    addStyle() {
      // 弹出菜单滚动条样式
      this.addMenuScrollbarStyle()
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
#${gm.id} .gm-setting #gm-setting-page {
  background-color: #ffffff;
  border-radius: 10px;
  z-index: 65535;
  min-width: 53em;
  padding: 1em 1.4em;
  transition: top 100ms, left 100ms;
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
#${gm.id} .gm-setting .gm-information {
  margin: 0 0.2em;
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
  background-color: #ffffff;
  border-radius: 10px;
  z-index: 65535;
  height: 75vh;
  width: 60vw;
  min-width: 40em;
  min-height: 50em;
  transition: top 100ms, left 100ms;
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
  background-color: #00000000;
}
#${gm.id} .gm-history .gm-content::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: #00000000;
}
#${gm.id} .gm-history .gm-content:hover::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: #0000002b;
}
#${gm.id} .gm-history .gm-content::-webkit-scrollbar-corner {
background-color: #00000000;
}
#${gm.id} .gm-history .gm-content > div:hover {
  font-weight: bold;
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
#${gm.id} a {
color: #0075FF
}
#${gm.id} a:visited {
color: #551a8b
}

#${gm.id} [disabled],
#${gm.id} [disabled] input,
#${gm.id} [disabled] select {
  cursor: not-allowed;
  color: gray;
}

#${gm.id}-watchlater-video-btn {
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
  }

  /**
   * API
   */
  class API {
    constructor() {
      const api = this
      this.dom = {
        /**
         * 将一个元素绝对居中
         * 
         * 要求该元素此时可见且尺寸为确定值（一般要求为块状元素）。运行后会在 `target` 上附加 `_absoluteCenter` 方法，若该方法已存在，则无视 `config` 直接执行 `target._absoluteCenter()`。
         * @param {HTMLElement} target 目标元素
         * @param {Object} [config] 配置
         * @param {string} [config.position='fixed'] 定位方式
         * @param {string} [config.top='50%'] `style.top`
         * @param {string} [config.left='50%'] `style.left`
         */
        setAbsoluteCenter(target, config) {
          if (!target._absoluteCenter) {
            const defaultConfig = {
              position: 'fixed',
              top: '50%',
              left: '50%',
            }
            config = { ...defaultConfig, ...config }
            target._absoluteCenter = () => {
              const style = getComputedStyle(target)
              const top = (parseFloat(style.height) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)) / 2
              const left = (parseFloat(style.width) + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)) / 2
              target.style.top = `calc(${config.top} - ${top}px)`
              target.style.left = `calc(${config.left} - ${left}px)`
              target.style.position = config.position
            }

            // 实现一个简单的 debounce 来响应 resize 事件
            let tid
            window.addEventListener('resize', function() {
              if (target._absoluteCenter) {
                if (tid) {
                  clearTimeout(tid)
                  tid = null
                }
                tid = setTimeout(() => {
                  target._absoluteCenter()
                }, 500)
              }
            })
          }
          target._absoluteCenter()
        },

        /**
         * 处理 HTML 元素的渐显和渐隐
         * @param {boolean} inOut 渐显/渐隐
         * @param {HTMLElement} target HTML 元素
         * @param {() => void} [callback] 处理完成的回调函数
         */
        fade(inOut, target, callback) {
          // fadeId 等同于当前时间戳，其意义在于保证对于同一元素，后执行的操作必将覆盖前的操作
          const fadeId = new Date().getTime()
          target._fadeId = fadeId
          if (inOut) { // 渐显
            // 只有 display 可视情况下修改 opacity 才会触发 transition
            if (getComputedStyle(target).display == 'none') {
              target.style.display = 'unset'
            }
            setTimeout(() => {
              let success = false
              if (target._fadeId <= fadeId) {
                target.style.opacity = '1'
                success = true
              }
              callback && callback(success)
            }, 10) // 此处的 10ms 是为了保证修改 display 后在浏览器上真正生效，按 HTML5 定义，浏览器需保证 display 在修改 4ms 后保证生效，但实际上大部分浏览器貌似做不到，等个 10ms 再修改 opacity
          } else { // 渐隐
            target.style.opacity = '0'
            setTimeout(() => {
              let success = false
              if (target._fadeId <= fadeId) {
                target.style.display = 'none'
                success = true
              }
              callback && callback(success)
            }, gm.const.fadeTime)
          }
        },
      }
      this.message = {
        /**
         * 创建信息
         * @param {string} msg 信息
         * @param {Object} [config] 设置
         * @param {boolean} [config.autoClose=true] 是否自动关闭信息，配合 `config.ms` 使用
         * @param {number} [config.ms=gm.const.messageTime] 显示时间（单位：ms，不含渐显/渐隐时间）
         * @param {boolean} [config.html=false] 是否将 `msg` 理解为 HTML
         * @param {string} [config.width] 信息框的宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
         * @param {{top: string, left: string}} [config.position] 信息框的位置，不设置该项时，相当于设置为 `{ top: gm.const.messageTop, left: gm.const.messageLeft }`
         * @return {HTMLElement} 信息框元素
         */
        create(msg, config) {
          const defaultConfig = {
            autoClose: true,
            ms: gm.const.messageTime,
            html: false,
            width: null,
            position: {
              top: gm.const.messageTop,
              left: gm.const.messageLeft,
            },
          }
          config = { ...defaultConfig, ...config }

          const msgbox = document.body.appendChild(document.createElement('div'))
          msgbox.className = `${gm.id}-msgbox`
          if (config.width) {
            msgbox.style.minWidth = 'auto' // 为什么一个是 auto 一个是 none？真是神奇的设计
            msgbox.style.maxWidth = 'none'
            msgbox.style.width = config.width
          }

          msgbox.style.display = 'block'
          setTimeout(() => {
            api.dom.setAbsoluteCenter(msgbox, config.position)
          }, 10)

          if (config.html) {
            msgbox.innerHTML = msg
          } else {
            msgbox.innerText = msg
          }
          api.dom.fade(true, msgbox, () => {
            if (config.autoClose) {
              setTimeout(() => {
                this.close(msgbox)
              }, config.ms)
            }
          })
          return msgbox
        },

        /**
         * 关闭信息
         * @param {HTMLElement} msgbox 信息框元素
         */
        close(msgbox) {
          if (msgbox) {
            api.dom.fade(false, msgbox, () => {
              msgbox && msgbox.remove()
            })
          }
        },

        /**
         * 创建高级信息
         * @param {HTMLElement} el 启动元素
         * @param {string} msg 信息
         * @param {string} flag 标志信息
         * @param {Object} [config] 设置
         * @param {string} [config.flagSize='1.8em'] 标志大小
         * @param {string} [config.width] 信息框的宽度，不设置的情况下根据内容决定，但有最小宽度和最大宽度的限制
         * @param {{top: string, left: string}} [config.position] 信息框的位置，不设置该项时，相当于设置为 `{ top: gm.const.messageTop, left: gm.const.messageLeft }`
         */
        advanced(el, msg, flag, config) {
          const defaultConfig = {
            flagSize: '1.8em',
            // 不能把数据列出，否则解构的时候会出问题
          }
          config = { ...defaultConfig, ...config }

          const self = this
          el.show = false
          el.onmouseenter = function() {
            const htmlMsg = `
<table><tr>
  <td style="font-size:${config.flagSize};line-height:${config.flagSize};padding-right:0.6em;">${flag}</td>
  <td>${msg}</td>
</tr></table>
`
            this.msgbox = self.create(htmlMsg, { ...config, html: true, autoClose: false })

            // 可能信息框刚好生成覆盖在 elWarning 上，需要做一个处理
            this.msgbox.onmouseenter = function() {
              this.mouseOver = true
            }
            // 从信息框出来也会关闭信息框，防止覆盖的情况下无法关闭
            this.msgbox.onmouseleave = function() {
              self.close(this)
            }
          }
          el.onmouseleave = function() {
            setTimeout(() => {
              if (this.msgbox && !this.msgbox.mouseOver) {
                this.msgbox.onmouseleave = null
                self.close(this.msgbox)
              }
            })
          }
        },
      }
      this.wait = {
        /**
         * 在条件满足后执行操作
         *
         * 当条件满足后，如果不存在终止条件，那么直接执行 `callback(result)`。
         *
         * 当条件满足后，如果存在终止条件，且 `stopTimeout` 大于 0，则还会在接下来的 `stopTimeout` 时间内判断是否满足终止条件，称为终止条件的二次判断。
         * 如果在此期间，终止条件通过，则表示依然不满足条件，故执行 `onStop()` 而非 `callback(result)`。
         * 如果在此期间，终止条件一直失败，则顺利通过检测，执行 `callback(result)`。
         *
         * @param {Object} options 选项
         * @param {() => *} options.condition 条件，当 `condition()` 返回的 `result` 为真值时满足条件
         * @param {(result) => void} [options.callback] 当满足条件时执行 `callback(result)`
         * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
         * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
         * @param {() => void} [options.onTimeout] 检测超时时执行 `onTimeout()`
         * @param {() => *} [options.stopCondition] 终止条件，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测
         * @param {() => void} [options.onStop] 终止条件达成时执行 `onStop()`（包括终止条件的二次判断达成）
         * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
         * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
         * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
         */
        executeAfterConditionPassed(options) {
          const defaultOptions = {
            callback: result => console.log(result),
            interval: 100,
            timeout: 5000,
            onTimeout: null,
            stopCondition: null,
            onStop: null,
            stopInterval: 50,
            stopTimeout: 0,
            timePadding: 0,
          }
          options = {
            ...defaultOptions,
            ...options
          }

          let tid
          let cnt = 0
          const maxCnt = (options.timeout - options.timePadding) / options.interval
          const task = () => {
            const result = options.condition()
            const stopResult = options.stopCondition && options.stopCondition()
            if (stopResult) {
              clearInterval(tid)
              options.onStop && options.onStop.call(options)
            } else if (++cnt > maxCnt) {
              clearInterval(tid)
              options.onTimeout && options.onTimeout.call(options)
            } else if (result) {
              clearInterval(tid)
              if (options.stopCondition && options.stopTimeout > 0) {
                this.executeAfterConditionPassed({
                  condition: options.stopCondition,
                  callback: options.onStop,
                  interval: options.stopInterval,
                  timeout: options.stopTimeout,
                  onTimeout: () => options.callback.call(options, result)
                })
              } else {
                options.callback.call(options, result)
              }
            }
          }
          setTimeout(() => {
            tid = setInterval(task, options.interval)
            task()
          }, options.timePadding)
        },

        /**
         * 在元素加载完成后执行操作
         *
         * 当条件满足后，如果不存在终止条件，那么直接执行 `callback(element)`。
         *
         * 当条件满足后，如果存在终止条件，且 `stopTimeout` 大于 `0`，则还会在接下来的 `stopTimeout` 时间内判断是否满足终止条件，称为终止条件的二次判断。
         * 如果在此期间，终止条件通过，则表示依然不满足条件，故执行 `onStop()` 而非 `callback(element)`。
         * 如果在此期间，终止条件一直失败，则顺利通过检测，执行 `callback(element)`。
         *
         * @param {Object} options 选项
         * @param {string} options.selector 该选择器指定要等待加载的元素 `element`
         * @param {HTMLElement} [options.base=document] 基元素
         * @param {(element: HTMLElement) => void} [options.callback] 当 `element` 加载成功时执行 `callback(element)`
         * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
         * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
         * @param {() => void} [options.onTimeout] 检测超时时执行 `onTimeout()`
         * @param {string | (() => *)} [options.stopCondition] 终止条件。若为函数，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测；若为字符串，则作为元素选择器指定终止元素 `stopElement`，若该元素加载成功则终止检测
         * @param {() => void} [options.onStop] 终止条件达成时执行 `onStop()`（包括终止条件的二次判断达成）
         * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
         * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
         * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
         */
        executeAfterElementLoaded(options) {
          const defaultOptions = {
            base: document,
            callback: el => console.log(el),
            interval: 100,
            timeout: 5000,
            onTimeout: null,
            stopCondition: null,
            onStop: null,
            stopInterval: 50,
            stopTimeout: 0,
            timePadding: 0,
          }
          options = {
            ...defaultOptions,
            ...options
          }
          this.executeAfterConditionPassed({
            ...options,
            condition: () => options.base.querySelector(options.selector),
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
        },

        /**
         * 等待条件满足
         * 
         * 执行细节类似于 {@link executeAfterConditionPassed}。在原来执行 `callback(result)` 的地方执行 `resolve(result)`，被终止或超时执行 `reject()`。
         * @async
         * @see executeAfterConditionPassed
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
        async waitForConditionPassed(options) {
          return new Promise((resolve, reject) => {
            this.executeAfterConditionPassed({
              ...options,
              callback: result => resolve(result),
              onTimeout: function() {
                reject(['TIMEOUT', 'waitForConditionPassed', this])
              },
              onStop: function() {
                reject(['STOP', 'waitForConditionPassed', this])
              },
            })
          })
        },

        /**
         * 等待元素加载
         * 
         * 执行细节类似于 {@link executeAfterElementLoaded}。在原来执行 `callback(element)` 的地方执行 `resolve(element)`，被终止或超时执行 `reject()`。
         * @async
         * @see executeAfterElementLoaded
         * @param {string} selector 该选择器指定要等待加载的元素 `element`
         * @param {HTMLElement} [base=document] 基元素
         */
        /**
         * 等待元素加载
         * 
         * 执行细节类似于 {@link executeAfterElementLoaded}。在原来执行 `callback(element)` 的地方执行 `resolve(element)`，被终止或超时执行 `reject()`。
         * @async
         * @see executeAfterElementLoaded
         * @param {Object} options 选项
         * @param {string} options.selector 该选择器指定要等待加载的元素 `element`
         * @param {HTMLElement} [options.base=document] 基元素
         * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
         * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
         * @param {string | (() => *)} [options.stopCondition] 终止条件。若为函数，当 `stopCondition()` 返回的 `stopResult` 为真值时终止检测；若为字符串，则作为元素选择器指定终止元素 `stopElement`，若该元素加载成功则终止检测
         * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
         * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
         * @param {number} [options.timePadding=0] 等待 `timePadding`ms 后才开始执行；包含在 `timeout` 中，因此不能大于 `timeout`
         * @returns {Promise<HTMLElement>} `element`
         */
        async waitForElementLoaded() {
          let options
          if (arguments.length > 0) {
            if (typeof arguments[0] == 'string') {
              options = { selector: arguments[0] }
              if (arguments[1]) {
                options.base = arguments[1]
              }
            } else {
              options = arguments[0]
            }
          }
          return new Promise((resolve, reject) => {
            this.executeAfterElementLoaded({
              ...options,
              callback: element => resolve(element),
              onTimeout: function() {
                reject(['TIMEOUT', 'waitForElementLoaded', this])
              },
              onStop: function() {
                reject(['STOP', 'waitForElementLoaded', this])
              },
            })
          })
        },
      }
    }
  }

  /**
   * 推入队列，循环数组实现
   */
  class PushQueue {
    /**
     * @param {number} maxSize 队列的最大长度，达到此长度后继续推入数据，将舍弃末尾处的数据
     * @param {number} [capacity=maxSize] 容量，即循环数组的长度，不能小于 maxSize
     */
    constructor(maxSize, capacity) {
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
    setMaxSize(maxSize) {
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
    setCapacity(capacity) {
      if (this.maxSize > capacity) {
        this.maxSize = capacity
        if (this.size > capacity) {
          this.size = capacity
        }
        // no need to gc()
      }
      const raw = this.toArray()
      const data = [...raw.reverse()]
      this.index = data.length
      data.length = capacity
      this.data = data
    }

    /**
     * 队列是否为空
     */
    empty() {
      return this.size == 0
    }

    /**
     * 向队列中推入数据，若队列已达到最大长度，则舍弃末尾处数据
     * @param {*} value 推入队列的数据
     */
    push(value) {
      this.data[this.index] = value
      this.index += 1
      if (this.index >= this.capacity) {
        this.index = 0
      }
      if (this.size < this.maxSize) {
        this.size += 1
      }
      if (this.maxSize < this.capacity && this.size == this.maxSize) { // maxSize 等于 capacity 时资源刚好完美利用，不必回收资源
        let release = this.index - this.size - 1
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
    pop() {
      if (this.size > 0) {
        let index = this.index - this.size
        if (index < 0) {
          index += this.capacity
        }
        this.size -= 1
        const result = this.data[index]
        this.data[index] = null
        return result
      }
    }

    /**
     * 将推入队列以数组的形式返回
     * @param {number} [maxLength=size] 读取的最大长度
     * @returns {Array} 队列数据的数组形式
     */
    toArray(maxLength) {
      if (typeof maxLength != 'number') {
        maxLength = parseInt(maxLength)
      }
      if (isNaN(maxLength) || maxLength > this.size || maxLength < 0) {
        maxLength = this.size
      }
      const ar = []
      let end = this.index - maxLength
      for (let i = this.index - 1; i >= end && i >= 0; i--) {
        ar.push(this.data[i])
      }
      if (end < 0) {
        end += this.capacity
        for (let i = this.capacity - 1; i >= end; i--) {
          ar.push(this.data[i])
        }
      }
      return ar
    }

    /**
     * 清理内部无效数据，释放内存
     */
    gc() {
      if (this.size > 0) {
        const start = this.index - 1
        let end = this.index - this.size
        if (end < 0) {
          end += this.capacity
        }
        if (start >= end) {
          for (let i = 0; i < end; i++) {
            this.data[i] = null
          }
          for (let i = start + 1; i < this.capacity; i++) {
            this.data[i] = null
          }
        } else if (start < end) {
          for (let i = start + 1; i < end; i++) {
            this.data[i] = null
          }
        }
      } else {
        this.data = new Array(this.capacity)
      }
    }
  }
})()
