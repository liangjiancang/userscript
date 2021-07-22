// ==UserScript==
// @name            B站稍后再看功能增强
// @version         4.15.3.20210722
// @namespace       laster2800
// @author          Laster2800
// @description     与稍后再看功能相关，一切你能想到和想不到的功能
// @icon            https://www.bilibili.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/395456
// @supportURL      https://greasyfork.org/zh-CN/scripts/395456/feedback
// @license         LGPL-3.0
// @include         *://www.bilibili.com/*
// @include         *://t.bilibili.com/*
// @include         *://message.bilibili.com/*
// @include         *://search.bilibili.com/*
// @include         *://space.bilibili.com/*
// @include         *://account.bilibili.com/*
// @exclude         *://message.bilibili.com/pages/nav/index_new_pc_sync
// @exclude         *://t.bilibili.com/h5/dynamic/specification
// @exclude         *://www.bilibili.com/page-proxy/game-nav.html
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=953038
// @grant           GM_addStyle
// @grant           GM_registerMenuCommand
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           unsafeWindow
// @grant           window.onurlchange
// @connect         api.bilibili.com
// @run-at          document-start
// @incompatible    firefox 完全不兼容 Greasemonkey，不完全兼容 Violentmonkey
// ==/UserScript==

(function() {
  'use strict'

  if (GM_info.scriptHandler != 'Tampermonkey') {
    const script = GM_info.script
    script.author = script.author ?? 'Laster2800'
    script.homepage = script.homepage ?? 'https://greasyfork.org/zh-CN/scripts/395456'
    script.supportURL = script.supportURL ?? 'https://greasyfork.org/zh-CN/scripts/395456/feedback'
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
      clearWatchlater: 'clearWatchlater',
      clearWatchedInWatchlater: 'clearWatchedInWatchlater',
      openUserSetting: 'openUserSetting',
      openRemoveHistory: 'openRemoveHistory',
      noOperation: 'noOperation',
    },
    /**
     * @readonly
     * @enum {string}
     */
    headerMenu: {
      enable: 'enable',
      enableSimple: 'enableSimple',
      disable: 'disable',
    },
    /**
     * @readonly
     * @enum {string}
     */
    headerCompatible: {
      none: 'none',
      bilibiliEvolved: 'bilibiliEvolved',
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
    removeHistorySavePoint: {
      list: 'list',
      listAndMenu: 'listAndMenu',
      anypage: 'anypage',
    },
    /**
     * @readonly
     * @enum {string}
     */
    fillWatchlaterStatus: {
      dynamic: 'dynamic',
      dynamicAndVideo: 'dynamicAndVideo',
      anypage: 'anypage',
      never: 'never',
    },
    /**
     * @readonly
     * @enum {string}
     */
    autoRemove: {
      always: 'always',
      openFromList: 'openFromList',
      never: 'never',
      absoluteNever: 'absoluteNever',
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
  Enums.headerButtonOpL = Enums.headerButtonOpR = Enums.headerButtonOpM = Enums.headerButtonOp

  const gmId = 'gm395456'
  /**
   * 全局对象
   * @typedef GMObject
   * @property {string} id 脚本标识
   * @property {number} configVersion 配置版本，为最后一次执行初始化设置或功能性更新设置时脚本对应的配置版本号
   * @property {number} configUpdate 当前版本对应的配置版本号，只要涉及到配置的修改都要更新；若同一天修改多次，可以追加小数来区分
   * @property {URLSearchParams} searchParams URL 查询参数
   * @property {GMObject_config} config 用户配置
   * @property {GMObject_configMap} configMap 用户配置属性
   * @property {GMObject_data} data 脚本数据
   * @property {GMObject_url} url URL
   * @property {GMObject_regex} regex 正则表达式
   * @property {GMObject_const} const 常量
   * @property {GMObject_menu} menu 菜单
   * @property {{[s: string]: HTMLElement}} el HTML 元素
   */
  /**
   * @typedef GMObject_config
   * @property {boolean} headerButton 顶栏入口
   * @property {headerButtonOp} headerButtonOpL 顶栏入口左键点击行为
   * @property {headerButtonOp} headerButtonOpR 顶栏入口右键点击行为
   * @property {headerButtonOp} headerButtonOpM 顶栏入口中键点击行为
   * @property {headerMenu} headerMenu 顶栏入口弹出菜单设置
   * @property {openHeaderMenuLink} openHeaderMenuLink 顶栏弹出菜单链接点击行为
   * @property {menuScrollbarSetting} menuScrollbarSetting 弹出菜单的滚动条设置
   * @property {boolean} headerMenuSearch 弹出菜单搜索框
   * @property {boolean} headerMenuFnSetting 弹出菜单：设置
   * @property {boolean} headerMenuFnHistory 弹出菜单：历史
   * @property {boolean} headerMenuFnRemoveAll 弹出菜单：清空
   * @property {boolean} headerMenuFnRemoveWatched 弹出菜单：移除已看
   * @property {boolean} headerMenuFnShowAll 弹出菜单：显示
   * @property {boolean} headerMenuFnPlayAll 弹出菜单：播放
   * @property {boolean} headerCompatible 兼容第三方顶栏
   * @property {boolean} removeHistory 稍后再看移除记录
   * @property {removeHistorySavePoint} removeHistorySavePoint 保存稍后再看历史数据的时间点
   * @property {number} removeHistoryFuzzyCompare 模糊比对深度
   * @property {number} removeHistorySaves 稍后再看历史数据记录保存数
   * @property {boolean} removeHistoryTimestamp 使用时间戳优化移除记录
   * @property {number} removeHistorySearchTimes 历史回溯深度
   * @property {fillWatchlaterStatus} fillWatchlaterStatus 填充稍后再看状态
   * @property {boolean} hideWatchlaterInCollect 隐藏「收藏」中的「稍后再看」
   * @property {boolean} videoButton 视频播放页稍后再看状态快速切换
   * @property {autoRemove} autoRemove 自动将视频从播放列表移除
   * @property {boolean} redirect 稍后再看模式重定向至普通模式播放
   * @property {openListVideo} openListVideo 列表页面视频点击行为
   * @property {boolean} removeButton_removeAll 移除「一键清空」按钮
   * @property {boolean} removeButton_removeWatched 移除「移除已观看视频」按钮
   * @property {boolean} disablePageCache 禁用页面缓存
   * @property {number} watchlaterListCacheValidPeriod 稍后再看列表数据本地缓存有效期（单位：秒）
   * @property {boolean} hideDisabledSubitems 设置页隐藏被禁用项的子项
   * @property {boolean} reloadAfterSetting 设置生效后刷新页面
   */
  /**
   * @typedef {{[config: string]: GMObject_configMap_item}} GMObject_configMap
   */
  /**
   * @typedef GMObject_configMap_item
   * @property {*} default 默认值
   * @property {'string' | 'boolean' | 'int' | 'float'} [type] 数据类型
   * @property {'checked' | 'value'} attr 对应 `DOM` 节点上的属性
   * @property {boolean} [manual] 配置保存时是否需要手动处理
   * @property {boolean} [needNotReload] 配置改变后是否不需要重新加载就能生效
   * @property {number} [min] 最小值
   * @property {number} [max] 最大值
   * @property {number} [configVersion] 涉及配置更改的最后配置版本
   */
  /**
   * @callback removeHistoryData 通过懒加载方式获取 `removeHistoryData`
   * @param {boolean} [remove] 是否将 `removeHistoryData` 移除
   * @returns {PushQueue<GMObject_data_item>} `removeHistoryData`
   */
  /**
   * @async
   * @callback watchlaterListData 通过懒加载方式获取稍后再看列表数据
   * @param {boolean} [reload] 是否重新加载稍后再看列表数据
   * @param {boolean} [cache=true] 是否使用本地缓存
   * @param {boolean} [disablePageCache] 是否禁用页面缓存
   * @returns {Promise<GMObject_data_item0[]>} 稍后再看列表数据
   */
  /**
   * `api_queryWatchlaterList` 返回数据中的视频单元
   * @typedef GMObject_data_item0
   * @property {number} aid 视频 AV 号，务必统一为字符串格式再使用
   * @property {string} bvid 视频 BV 号
   * @property {string} title 视频标题
   * @property {number} state 视频状态
   * @property {string} [pic] 视频封面
   * @property {Object} [owner] UP 主信息
   * @property {number} [owner.mid] UP 主 ID
   * @property {string} [owner.name] UP 主名字
   * @property {number} [progress] 视频播放进度
   * @property {number} [duration] 视频时长
   * @property {number} [videos] 稿件分 P 数
   * @see {@link https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/history%26toview/toview.md#获取稍后再看视频列表 获取稍后再看视频列表}
   */
  /**
   * @typedef {[bvid: string, title: string, lastModified: number]} GMObject_data_item
   * `bvid` 视频 BV 号
   * 
   * `title` 视频标题
   * 
   * `[lastModified]` 时间戳：最后被观察到的时间点
   */
  /**
   * @typedef GMObject_data
   * @property {removeHistoryData} removeHistoryData 为生成移除记录而保存的稍后再看历史数据
   * @property {watchlaterListData} watchlaterListData 当前稍后再看列表数据
   */
  /**
   * @callback api_videoInfo
   * @param {string} id `aid` 或 `bvid`
   * @param {'aid' | 'bvid'} type `id` 类型
   * @returns {string} 查询视频信息的 URL
   */
  /**
   * @callback page_userSpace
   * @param {number} [uid] `uid`
   * @returns {string} 用户空间 URL
   */
  /**
   * @typedef GMObject_url
   * @property {string} api_queryWatchlaterList 稍后再看列表数据
   * @property {api_videoInfo} api_videoInfo 视频信息
   * @property {string} api_addToWatchlater 将视频添加至稍后再看，要求 POST 一个含 `aid` / 'bvid' 和 `csrf` 的表单
   * @property {string} api_removeFromWatchlater 将视频从稍后再看移除，移除一个视频要求 POST 一个含 `aid` 和 `csrf` 的表单，移除已观看要求 POST 一个含 `viewed=true` 和 `csrf` 的表单
   * @property {string} api_clearWatchlater 清空稍后再看，要求 POST 一个含 `csrf` 的表单
   * @property {string} page_watchlaterList 列表页面
   * @property {string} page_videoNormalMode 正常模式播放页
   * @property {string} page_videoWatchlaterMode 稍后再看模式播放页
   * @property {string} page_watchlaterPlayAll 稍后再看播放全部（临时禁用重定向）
   * @property {page_userSpace} page_userSpace 用户空间
   * @property {string} gm_changelog 更新日志
   * @property {string} noop 无操作
   */
  /**
   * @typedef GMObject_regex
   * @property {RegExp} page_watchlaterList 匹配列表页面
   * @property {RegExp} page_videoNormalMode 匹配正常模式播放页
   * @property {RegExp} page_videoWatchlaterMode 匹配稍后再看模式播放页
   * @property {RegExp} page_dynamic 匹配动态页面
   * @property {RegExp} page_dynamicMenu 匹配顶栏动态入口菜单
   * @property {RegExp} page_userSpace 匹配用户空间
   */
  /**
   * @typedef GMObject_const
   * @property {number} rhsWarning 稍后再看历史数据保存数警告线
   * @property {number} fadeTime UI 渐变时间（单位：ms）
   * @property {number} textFadeTime 文字渐变时间（单位：ms）
   */
  /**
   * @typedef GMObject_menu
   * @property {GMObject_menu_item} setting 设置
   * @property {GMObject_menu_item} history 移除记录
   * @property {GMObject_menu_item} entryPopup 入口弹出菜单
   */
  /**
   * @typedef GMObject_menu_item
   * @property {0 | 1 | 2 | 3 | -1} state 打开状态（关闭 | 开启中 | 打开 | 关闭中 | 错误）
   * @property {HTMLElement} el 菜单元素
   * @property {() => void} [openHandler] 打开菜单的回调函数
   * @property {() => void} [closeHandler] 关闭菜单的回调函数
   * @property {() => void} [openedHandler] 彻底打开菜单后的回调函数
   * @property {() => void} [closedHandler] 彻底关闭菜单后的回调函数
   */
  /**
   * 全局对象
   * @type {GMObject}
   */
  const gm = {
    id: gmId,
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210722,
    searchParams: new URL(location.href).searchParams,
    config: {},
    configMap: {
      headerButton: { default: true, attr: 'checked' },
      headerButtonOpL: { default: Enums.headerButtonOp.openListInCurrent, attr: 'value', configVersion: 20210323 },
      headerButtonOpR: { default: Enums.headerButtonOp.openUserSetting, attr: 'value', configVersion: 20210323 },
      headerButtonOpM: { default: Enums.headerButtonOp.openListInNew, attr: 'value', configVersion: 20210323 },
      headerMenu: { default: Enums.headerMenu.enable, attr: 'value', manual: true, configVersion: 20210706 },
      openHeaderMenuLink: { default: Enums.openHeaderMenuLink.openInCurrent, attr: 'value', configVersion: 20200717 },
      menuScrollbarSetting: { default: Enums.menuScrollbarSetting.beautify, attr: 'value', configVersion: 20200722 },
      headerMenuSearch: { default: true, attr: 'checked', configVersion: 20210323.1 },
      headerMenuFnSetting: { default: true, attr: 'checked', configVersion: 20210322 },
      headerMenuFnHistory: { default: true, attr: 'checked', configVersion: 20210322 },
      headerMenuFnRemoveAll: { default: false, attr: 'checked', configVersion: 20210322 },
      headerMenuFnRemoveWatched: { default: true, attr: 'checked', configVersion: 20210323 },
      headerMenuFnShowAll: { default: false, attr: 'checked', configVersion: 20210322 },
      headerMenuFnPlayAll: { default: true, attr: 'checked', configVersion: 20210322 },
      headerCompatible: { default: Enums.headerCompatible.none, attr: 'value', configVersion: 20210721 },
      removeHistory: { default: true, attr: 'checked', manual: true, configVersion: 20210628 },
      removeHistorySavePoint: { default: Enums.removeHistorySavePoint.listAndMenu, attr: 'value', configVersion: 20210628 },
      removeHistoryFuzzyCompare: { default: 1, type: 'int', attr: 'value', max: 5, needNotReload: true, configVersion: 20210722 },
      removeHistorySaves: { default: 500, type: 'int', attr: 'value', manual: true, needNotReload: true, min: 10, max: 100000, configVersion: 20210628 },
      removeHistoryTimestamp: { default: true, attr: 'checked', needNotReload: true, configVersion: 20210703 },
      removeHistorySearchTimes: { default: 500, type: 'int', attr: 'value', manual: true, needNotReload: true, min: 1, max: 100000, configVersion: 20210703 },
      fillWatchlaterStatus: { default: Enums.fillWatchlaterStatus.dynamic, attr: 'value', configVersion: 20200819 },
      hideWatchlaterInCollect: { default: true, attr: 'checked', configVersion: 20210322 },
      videoButton: { default: true, attr: 'checked' },
      autoRemove: { default: Enums.autoRemove.openFromList, attr: 'value', configVersion: 20210612 },
      redirect: { default: false, attr: 'checked', configVersion: 20210322.1 },
      openListVideo: { default: Enums.openListVideo.openInCurrent, attr: 'value', configVersion: 20200717 },
      removeButton_removeAll: { default: false, attr: 'checked', configVersion: 20200722 },
      removeButton_removeWatched: { default: false, attr: 'checked', configVersion: 20200722 },
      disablePageCache: { default: false, attr: 'checked', configVersion: 20210322 },
      watchlaterListCacheValidPeriod: { default: 15, type: 'int', attr: 'value', needNotReload: true, max: 600, configVersion: 20210722 },
      hideDisabledSubitems: { default: true, attr: 'checked', configVersion: 20210505 },
      reloadAfterSetting: { default: true, attr: 'checked', needNotReload: true, configVersion: 20200715 },
    },
    data: {
      removeHistoryData: null,
      watchlaterListData: null,
    },
    url: {
      api_queryWatchlaterList: 'https://api.bilibili.com/x/v2/history/toview/web?jsonp=jsonp',
      api_videoInfo: (id, type) => `https://api.bilibili.com/x/web-interface/view?${type}=${id}`,
      api_addToWatchlater: 'https://api.bilibili.com/x/v2/history/toview/add',
      api_removeFromWatchlater: 'https://api.bilibili.com/x/v2/history/toview/del',
      api_clearWatchlater: 'http://api.bilibili.com/x/v2/history/toview/clear',
      page_watchlaterList: 'https://www.bilibili.com/watchlater/#/list',
      page_videoNormalMode: 'https://www.bilibili.com/video',
      page_videoWatchlaterMode: 'https://www.bilibili.com/medialist/play/watchlater',
      page_watchlaterPlayAll: `https://www.bilibili.com/medialist/play/watchlater/?${gmId}_disable_redirect=true`,
      page_userSpace: uid => `https://space.bilibili.com/${uid}`,
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliWatchlaterPlus/changelog.md',
      noop: 'javascript:void(0)',
    },
    regex: {
      page_watchlaterList: /\.com\/watchlater\/.*#.*\/list(?=[/?#]|$)/,
      page_videoNormalMode: /\.com\/video(?=[/?#]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater(?=[/?#]|$)/,
      page_dynamic: /t\.bilibili\.com(?=\/|$)/,
      page_dynamicMenu: /\.com\/pages\/nav\/index_new(?=[/?#]|$)/,
      page_userSpace: /space\.bilibili\.com(?=[/?#]|$)/,
    },
    const: {
      rhsWarning: 10000,
      fadeTime: 400,
      textFadeTime: 100,
    },
    menu: {
      setting: { state: 0, el: null },
      history: { state: 0, el: null },
      entryPopup: { state: 0, el: document.createElement('div') }
    },
    el: {
      gmRoot: null,
      setting: null,
      history: null,
    },
  }

  /* global UserscriptAPI */
  const api = new UserscriptAPI({
    id: gm.id,
    label: GM_info.script.name,
    fadeTime: gm.const.fadeTime,
  })

  /** @type {Script} */
  let script = null
  /** @type {Webpage} */
  let webpage = null

  /**
   * 脚本运行的抽象，脚本独立于网站、为脚本本身服务的部分
   */
  class Script {
    constructor() {
      /**
       * 通用方法
       */
      this.method = {
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
        gmValidate(gmKey, defaultValue, writeback = true) {
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
        },
      }
    }

    /**
     * document-start 级别初始化
     */
    initAtDocumentStart() {
      // document-start 级用户配置读取
      if (gm.configVersion > 0) {
        gm.config.redirect = this.method.gmValidate('redirect', gm.configMap.redirect.default)
      } else {
        gm.config.redirect = gm.configMap.redirect.default
        GM_setValue('redirect', gm.configMap.redirect.default)
      }
    }

    /**
     * 初始化
     */
    init() {
      this.initGMObject()
      this.updateVersion()
      this.readConfig()
    }

    /**
     * 初始化全局对象
     */
    initGMObject() {
      const cfgDocumentStart = { redirect: true } // document-start 时期就处理过的配置
      for (const name in gm.configMap) {
        if (!cfgDocumentStart[name]) {
          gm.config[name] = gm.configMap[name].default
        }
      }

      gm.data = {
        ...gm.data,
        removeHistoryData: remove => {
          const _ = gm.data._
          if (remove) {
            _.removeHistoryData = undefined
          } else {
            if (_.removeHistoryData === undefined) {
              /** @type {PushQueue} */
              let data = GM_getValue('removeHistoryData')
              if (data && typeof data == 'object') {
                Object.setPrototypeOf(data, PushQueue.prototype) // 还原类型信息
                if (data.maxSize != gm.config.removeHistorySaves) {
                  data.setMaxSize(gm.config.removeHistorySaves)
                }
                if (data.capacity != gm.config.removeHistorySaves) {
                  data.setCapacity(gm.config.removeHistorySaves)
                }
              } else {
                data = new PushQueue(gm.config.removeHistorySaves)
                GM_setValue('removeHistoryData', data)
              }
              _.removeHistoryData = data
            }
            return _.removeHistoryData
          }
        },
        watchlaterListData: async (reload, cache = true, disablePageCache = false) => {
          const _ = gm.data._
          if (_.watchlaterListData === undefined || reload || disablePageCache || gm.config.disablePageCache) {
            if (_.watchlaterListData_loading) {
              // 一旦数据已在加载中，那么直接等待该次加载完成
              // 无论加载成功与否，所有被阻塞的数据请求均都使用该次加载的结果，完全保持一致
              // 注意：加载失败时，返回的空数组并非同一对象
              try {
                return await api.wait.waitForConditionPassed({
                  condition: () => {
                    if (!_.watchlaterListData_loading) {
                      return _.watchlaterListData ?? []
                    }
                  },
                })
              } catch (e) {
                _.watchlaterListData_loading = false
                api.logger.error(e)
                return _.watchlaterListData ?? []
              }
            }

            if (!reload && cache && gm.config.watchlaterListCacheValidPeriod > 0) {
              const cacheTime = GM_getValue('watchlaterListCacheTime')
              if (cacheTime) {
                const current = new Date().getTime()
                if (current - cacheTime < gm.config.watchlaterListCacheValidPeriod * 1000) {
                  const list = GM_getValue('watchlaterListCache')
                  if (list) {
                    _.watchlaterListData = list
                    return list // 默认缓存不为空
                  }
                }
              }
            }

            _.watchlaterListData_loading = true
            try {
              const resp = await api.web.request({
                method: 'GET',
                url: gm.url.api_queryWatchlaterList,
              })
              const json = JSON.parse(resp.responseText)
              const current = json.data.list ?? []
              if (gm.config.watchlaterListCacheValidPeriod > 0) {
                const base = item => {
                  return {
                    aid: item.aid,
                    bvid: item.bvid,
                    title: item.title,
                    state: item.state,
                  }
                }
                GM_setValue('watchlaterListCacheTime', new Date().getTime())
                if (gm.config.headerMenu == Enums.headerMenu.enable) {
                  GM_setValue('watchlaterListCache', current.map(item => {
                    return {
                      ...base(item),
                      pic: item.pic,
                      owner: {
                        mid: item.owner.mid,
                        name: item.owner.name,
                      },
                      progress: item.progress,
                      duration: item.duration,
                      videos: item.videos,
                    }
                  }))
                } else {
                  GM_setValue('watchlaterListCache', current.map(item => base(item)))
                }
              }
              _.watchlaterListData = current
              return current
            } catch (e) {
              api.logger.error(e)
              return _.watchlaterListData ?? []
            } finally {
              _.watchlaterListData_loading = false
            }
          } else {
            return _.watchlaterListData
          }
        },
        _: {}, // 用于存储内部数据，不公开访问
      }

      gm.el = {
        ...gm.el,
        gmRoot: document.body.appendChild(document.createElement('div')),
      }
      gm.el.gmRoot.id = gm.id
    }

    /**
     * 版本更新处理
     */
    updateVersion() {
      const _self = this
      if (gm.configVersion > 0) {
        if (gm.configVersion < gm.configUpdate) {
          // 必须按从旧到新的顺序写
          // 内部不能使用 gm.configUpdate，必须手写更新后的配置版本号！

          // 4.9.0.20210322
          if (gm.configVersion < 20210322) {
            GM_deleteValue('forceConsistentVideo')
          }

          // 4.11.0a.20210628
          if (gm.configVersion < 20210628) {
            GM_deleteValue('openSettingAfterConfigUpdate')
            // reset everything about history
            GM_deleteValue('removeHistoryData')
            GM_deleteValue('removeHistory')
            GM_deleteValue('removeHistorySavePoint')
            GM_deleteValue('removeHistoryFuzzyCompare')
            GM_deleteValue('removeHistorySaves')
            GM_deleteValue('removeHistorySearchTimes')
          }

          // 4.11.7.20210701
          if (gm.configVersion < 20210701) {
            const cvp = GM_getValue('watchlaterListCacheValidPeriod')
            if (cvp > 0 && cvp <= 2) {
              GM_setValue('watchlaterListCacheValidPeriod', 5)
            }
          }

          // 4.12.0.20210703
          if (gm.configVersion < 20210703) {
            GM_deleteValue('removeHistoryData')
            GM_deleteValue('removeHistoryFuzzyCompareReference')
            GM_deleteValue('removeHistorySearchTimes')
            GM_deleteValue('watchlaterListCacheTime')
            GM_deleteValue('watchlaterListCache')
          }

          // 4.12.3.20210708
          if (gm.configVersion < 20210708) {
            GM_deleteValue('watchlaterListCacheTime')
            GM_deleteValue('watchlaterListCache')
          }

          // 功能性更新后更新此处配置版本
          if (gm.configVersion < 20210722) {
            _self.openUserSetting(2)
          } else {
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
          }
        }
      }
    }

    /**
     * 用户配置读取
     */
    readConfig() {
      const _self = this
      const cfgDocumentStart = { redirect: true } // document-start 时期就处理过的配置
      if (gm.configVersion > 0) {
        // 对配置进行校验
        for (const name in gm.config) {
          if (!cfgDocumentStart[name]) {
            gm.config[name] = _self.method.gmValidate(name, gm.config[name])
          }
        }
      } else {
        // 用户强制初始化，或者第一次安装脚本
        gm.configVersion = 0
        for (const name in gm.config) {
          if (!cfgDocumentStart[name]) {
            GM_setValue(name, gm.config[name])
          }
        }
        _self.openUserSetting(1)
      }
    }

    /**
     * 添加脚本菜单
     */
    addScriptMenu() {
      const _self = this
      // 用户配置设置
      GM_registerMenuCommand('用户设置', () => _self.openUserSetting())
      if (gm.config.removeHistory) {
        // 稍后再看移除记录
        GM_registerMenuCommand('稍后再看移除记录', () => _self.openRemoveHistory()) // 注意不要直接传函数对象，否则 this 不对
        // 清空稍后再看历史数据
        GM_registerMenuCommand('清空稍后再看历史数据', () => _self.cleanRemoveHistoryData())
      }
      // 强制初始化
      GM_registerMenuCommand('初始化脚本', () => _self.resetScript())
    }

    /**
     * 打开用户设置
     * @param {number} [type=0] 普通 `0` | 初始化 `1` | 功能性更新 `2`
     */
    openUserSetting(type = 0) {
      const _self = this
      if (gm.el.setting) {
        _self.openMenuItem('setting')
      } else {
        const el = {}
        setTimeout(() => {
          initSetting()
          processConfigItem()
          processSettingItem()
          _self.openMenuItem('setting')
        })

        /**
         * 设置页面初始化
         */
        const initSetting = () => {
          gm.el.setting = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.setting.el = gm.el.setting
          if (gm.config.hideDisabledSubitems) {
            gm.el.setting.className = 'gm-setting gm-hideDisabledSubitems'
          } else {
            gm.el.setting.className = 'gm-setting'
          }
          gm.el.setting.innerHTML = `
            <div id="gm-setting-page">
              <div class="gm-title">
                <div id="gm-maintitle" title="${GM_info.script.homepage}">
                  <a href="${GM_info.script.homepage}" target="_blank">${GM_info.script.name}</a>
                </div>
                <div class="gm-subtitle">V${GM_info.script.version} by ${GM_info.script.author}</div>
              </div>
              <div class="gm-items">
                <table>
                  <tr class="gm-item" title="在顶栏「动态」和「收藏」之间加入稍后再看入口，鼠标移至上方时弹出列表菜单，支持点击功能设置。">
                    <td rowspan="10"><div>全局功能</div></td>
                    <td>
                      <label>
                        <span>在顶栏中加入稍后再看入口</span>
                        <input id="gm-headerButton" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="选择左键点击入口时执行的操作。">
                    <td>
                      <div>
                        <span>在入口上点击鼠标左键时</span>
                        <select id="gm-headerButtonOpL"></select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="选择右键点击入口时执行的操作。">
                    <td>
                      <div>
                        <span>在入口上点击鼠标右键时</span>
                        <select id="gm-headerButtonOpR"></select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="选择中键点击入口时执行的操作。">
                    <td>
                      <div>
                        <span>在入口上点击鼠标中键时</span>
                        <select id="gm-headerButtonOpM"></select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="设置入口弹出菜单。">
                    <td>
                      <div>
                        <span>将鼠标移动至入口上方时</span>
                        <select id="gm-headerMenu">
                          <option value="${Enums.headerMenu.enable}">弹出稍后再看列表</option>
                          <option value="${Enums.headerMenu.enableSimple}">弹出简化的稍后再看列表</option>
                          <option value="${Enums.headerMenu.disable}">不执行操作</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="选择在弹出菜单中点击链接的行为。">
                    <td>
                      <div>
                        <span>在弹出菜单中点击链接时</span>
                        <select id="gm-openHeaderMenuLink">
                          <option value="${Enums.openHeaderMenuLink.openInCurrent}">在当前页面打开</option>
                          <option value="${Enums.openHeaderMenuLink.openInNew}">在新标签页打开</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="对弹出菜单中滚动条样式进行设置。为了保持外观一致，这个选项也会影响「动态」「收藏」「历史」等其他入口的弹出菜单。">
                    <td>
                      <div>
                        <span>对于弹出菜单中的滚动条</span>
                        <select id="gm-menuScrollbarSetting">
                          <option value="${Enums.menuScrollbarSetting.beautify}">修改其外观为扁平化风格</option>
                          <option value="${Enums.menuScrollbarSetting.hidden}">将其隐藏（不影响鼠标滚动）</option>
                          <option value="${Enums.menuScrollbarSetting.original}">维持官方的滚动条样式</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="在弹出菜单顶部显示搜索框。">
                    <td>
                      <label>
                        <span>在弹出菜单顶部显示搜索框</span>
                        <input id="gm-headerMenuSearch" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="设置在弹出列表显示的快捷功能。">
                    <td>
                      <div class="gm-lineitems">
                        <span>在弹出菜单底部显示：</span>
                        <label class="gm-lineitem">
                          <span>设置</span><input id="gm-headerMenuFnSetting" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>历史</span><input id="gm-headerMenuFnHistory" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>清空</span><input id="gm-headerMenuFnRemoveAll" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>移除已看</span><input id="gm-headerMenuFnRemoveWatched" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>显示</span><input id="gm-headerMenuFnShowAll" type="checkbox">
                        </label>
                        <label class="gm-lineitem">
                          <span>播放</span><input id="gm-headerMenuFnPlayAll" type="checkbox">
                        </label>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="无须兼容第三方顶栏时务必选择「无」，否则脚本无法正常工作！若列表中没有提供您需要的第三方顶栏，且该第三方顶栏有一定用户基数，可在脚本反馈页发起请求。">
                    <td>
                      <div>
                        <span>兼容第三方顶栏：</span>
                        <select id="gm-headerCompatible">
                          <option value="${Enums.headerCompatible.none}">无</option>
                          <option value="${Enums.headerCompatible.bilibiliEvolved}">Bilibili Evolved</option>
                        </select>
                        <span id="gm-hcWarning" class="gm-warning gm-trailing" title>⚠</span>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="保留稍后再看列表中的数据，以查找出一段时间内将哪些视频移除出稍后再看，用于拯救误删操作。关闭该选项会将内部历史数据清除！">
                    <td rowspan="6"><div>全局功能</div></td>
                    <td>
                      <label>
                        <span>开启稍后再看移除记录</span>
                        <input id="gm-removeHistory" type="checkbox">
                        <span id="gm-rhWarning" class="gm-warning" title>⚠</span>
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="选择在何时保存稍后再看历史数据。无论选择哪一种方式，在同一个 URL 对应的页面下至多触发一次保存。">
                      <td>
                        <div>
                          <span>为了生成移除记录，</span>
                          <select id="gm-removeHistorySavePoint">
                            <option value="${Enums.removeHistorySavePoint.list}">在打开列表页面时保存数据</option>
                            <option value="${Enums.removeHistorySavePoint.listAndMenu}">在打开列表页面或弹出入口菜单时保存数据</option>
                            <option value="${Enums.removeHistorySavePoint.anypage}">在打开任意相关页面时保存数据</option>
                          </select>
                          <span id="gm-rhspInformation" class="gm-information" title>💬</span>
                        </div>
                      </td>
                  </tr>
                  <tr class="gm-subitem" title="设置模糊比对深度以快速舍弃重复数据从而降低开销，但可能会造成部分记录遗漏。">
                    <td>
                      <div>
                        <span>模糊比对模式深度</span>
                        <span id="gm-rhfcInformation" class="gm-information" title>💬</span>
                        <input id="gm-removeHistoryFuzzyCompare" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="较大的数值可能会带来较大的开销（具体参考右侧弹出说明）。将该项修改为比原来小的值会清理过期数据，无法恢复！">
                    <td>
                      <div>
                        <span>不重复数据记录保存数</span>
                        <span id="gm-rhsInformation" class="gm-information" title>💬</span>
                        <span id="gm-cleanRemoveHistoryData" class="gm-hint-option" title="清理已保存的稍后再看历史数据，不可恢复！">清空数据(0条)</span>
                        <input id="gm-removeHistorySaves" type="text">
                        <span id="gm-rhsWarning" class="gm-warning" title>⚠</span>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="在稍后再看历史数据记录中保存时间戳，以其优化对数据记录的排序及展示。">
                    <td>
                      <label>
                        <span>使用时间戳优化移除记录</span>
                        <span id="gm-rhtInformation" class="gm-information" title>💬</span>
                        <input id="gm-removeHistoryTimestamp" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="搜寻时在最近多少条数据记录中查找，设置较小的值能较好地定位最近被添加到稍后再看的视频。">
                    <td>
                      <div>
                        <span>默认历史回溯深度</span>
                        <input id="gm-removeHistorySearchTimes" type="text">
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="填充默认情况下缺失的稍后再看状态信息。">
                    <td><div>全局功能</div></td>
                    <td>
                      <div>
                        <span>填充缺失的稍后再看状态信息：</span>
                        <select id="gm-fillWatchlaterStatus">
                          <option value="${Enums.fillWatchlaterStatus.dynamic}">仅动态页面</option>
                          <option value="${Enums.fillWatchlaterStatus.dynamicAndVideo}">仅动态和视频播放页面</option>
                          <option value="${Enums.fillWatchlaterStatus.anypage}">所有页面</option>
                          <option value="${Enums.fillWatchlaterStatus.never}">禁用功能</option>
                        </select>
                        <span id="gm-fwsInformation" class="gm-information" title>💬</span>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="隐藏顶栏「收藏」入口弹出菜单中的「稍后再看」。">
                    <td><div>全局功能</div></td>
                    <td>
                      <label>
                        <span>隐藏「收藏」中的「稍后再看」</span>
                        <input id="gm-hideWatchlaterInCollect" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="在播放页面（包括普通模式和稍后再看模式）中加入能将视频快速切换添加或移除出稍后再看列表的按钮。">
                    <td><div>播放页面</div></td>
                    <td>
                      <label>
                        <span>加入快速切换视频稍后再看状态的按钮</span>
                        <input id="gm-videoButton" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="打开播放页面时，自动将视频从稍后再看列表中移除，或在特定条件下执行自动移除。">
                    <td><div>播放页面</div></td>
                    <td>
                      <div>
                        <span>打开页面时，</span>
                        <select id="gm-autoRemove">
                          <option value="${Enums.autoRemove.always}">若视频在稍后再看中，则移除出稍后再看</option>
                          <option value="${Enums.autoRemove.openFromList}">若是从列表页面或弹出菜单列表点击进入，则移除出稍后再看</option>
                          <option value="${Enums.autoRemove.never}">不执行自动移除功能，但在列表页面中可临时开启功能</option>
                          <option value="${Enums.autoRemove.absoluteNever}">彻底禁用自动移除功能</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="打开「${gm.url.page_videoWatchlaterMode}」页面时，自动切换至「${gm.url.page_videoNormalMode}」页面进行播放，但不影响「播放全部」等相关功能。">
                    <td><div>播放页面</div></td>
                    <td>
                      <label>
                        <span>从稍后再看模式强制切换到普通模式播放</span>
                        <input id="gm-redirect" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="设置在「${gm.url.page_watchlaterList}」页面点击视频时的行为。">
                    <td><div>列表页面</div></td>
                    <td>
                      <div>
                        <span>点击视频时</span>
                        <select id="gm-openListVideo">
                          <option value="${Enums.openListVideo.openInCurrent}">在当前页面打开</option>
                          <option value="${Enums.openListVideo.openInNew}">在新标签页打开</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="这个按钮太危险了……">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>移除「一键清空」按钮</span>
                        <input id="gm-removeButton_removeAll" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="这个按钮太危险了……">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>移除「移除已观看视频」按钮</span>
                        <input id="gm-removeButton_removeWatched" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="禁用页面缓存">
                    <td><div>脚本设置</div></td>
                    <td>
                      <label>
                        <span>禁用页面缓存</span>
                        <span id="gm-dpcInformation" class="gm-information" title>💬</span>
                        <input id="gm-disablePageCache" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="稍后再看列表数据本地缓存有效期（单位：秒）">
                    <td><div>脚本设置</div></td>
                    <td>
                      <div>
                        <span>稍后再看列表数据本地缓存有效期（单位：秒）</span>
                        <input id="gm-watchlaterListCacheValidPeriod" type="text">
                        <span id="gm-wlcvpInformation" class="gm-information" title>💬</span>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="一般情况下，是否在用户设置中隐藏被禁用项的子项？">
                    <td><div>用户设置</div></td>
                    <td>
                      <label>
                        <span>一般情况下隐藏被禁用项的子项</span>
                        <input id="gm-hideDisabledSubitems" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="勾选后，如果更改的配置需要重新加载才能生效，那么会在设置完成后重新加载页面。">
                    <td><div>用户设置</div></td>
                    <td>
                      <label>
                        <span>必要时在设置完成后重新加载页面</span>
                        <input id="gm-reloadAfterSetting" type="checkbox">
                      </label>
                    </td>
                  </tr>
                </table>
              </div>
              <div class="gm-bottom">
                <button id="gm-save">保存</button>
                <button id="gm-cancel">取消</button>
              </div>
              <div id="gm-reset" title="重置脚本设置及内部数据，也许能解决脚本运行错误的问题。该操作不会清除已保存的稍后再看历史数据，因此不会导致移除记录丢失。无法解决请联系脚本作者：${GM_info.script.supportURL}">初始化脚本</div>
              <a id="gm-changelog" title="显示更新日志" href="${gm.url.gm_changelog}" target="_blank">更新日志</a>
            </div>
            <div class="gm-shadow"></div>
          `

          // 找出配置对应的元素
          for (const name in gm.config) {
            el[name] = gm.el.setting.querySelector(`#gm-${name}`)
          }

          el.settingPage = gm.el.setting.querySelector('#gm-setting-page')
          el.items = gm.el.setting.querySelector('.gm-items')
          el.maintitle = gm.el.setting.querySelector('#gm-maintitle')
          el.changelog = gm.el.setting.querySelector('#gm-changelog')
          switch (type) {
            case 1:
              el.settingPage.setAttribute('setting-type', 'init')
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(初始化设置)</span>'
              break
            case 2:
              el.settingPage.setAttribute('setting-type', 'updated')
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(功能性更新设置)</span>'
              for (const name in gm.configMap) {
                const configVersion = gm.configMap[name].configVersion
                if (configVersion && configVersion > gm.configVersion) {
                  let node = el[name]
                  while (node.nodeName != 'TD') {
                    node = node.parentNode
                    if (!node) break
                  }
                  if (node?.firstElementChild) {
                    api.dom.addClass(node.firstElementChild, 'gm-updated')
                  }
                }
              }
              break
          }
          el.save = gm.el.setting.querySelector('#gm-save')
          el.cancel = gm.el.setting.querySelector('#gm-cancel')
          el.shadow = gm.el.setting.querySelector('.gm-shadow')
          el.reset = gm.el.setting.querySelector('#gm-reset')
          el.cleanRemoveHistoryData = gm.el.setting.querySelector('#gm-cleanRemoveHistoryData')

          // 提示信息
          el.rhspInformation = gm.el.setting.querySelector('#gm-rhspInformation')
          api.message.advanced(el.rhspInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>选择更多保存时间点能提高移除历史的准确度，但可能会伴随大量无意义的数据比较。无论选择哪一种方式，在同一个 URL 对应的页面下至多保存一次。</p>
              <p>若习惯于从稍后再看列表页面点击视频观看，建议选择第一项或第二项。若习惯于直接在顶栏弹出菜单中点击视频观看，请选择第二项。第三项性价比低，不推荐选择。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhspInformation.parentNode.hasAttribute('disabled') })
          el.rhfcInformation = gm.el.setting.querySelector('#gm-rhfcInformation')
          api.message.advanced(el.rhfcInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>模糊比对模式：设当前时间点获取到的稍后再看列表数据为 A，上一次获取到的数据为 B。若 A 与 B 的前 <b>N</b> 项均一致就认为这段时间没有往稍后再看中添加新视频，直接跳过后续处理。</p>
              <p>其中，<b>N</b> 即为模糊比对深度。注意，<b>深度设置过大反而会降低比对效率</b>，建议先设置较小的值，若后续观察到有记录被误丢弃，再增加该项的值。最佳参数与个人使用习惯相关，请根据自身情况微调。你也可以选择设置 <b>0</b> 以关闭模糊比对模式（不推荐）。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhfcInformation.parentNode.hasAttribute('disabled') })
          el.rhsInformation = gm.el.setting.querySelector('#gm-rhsInformation')
          api.message.advanced(el.rhsInformation, `
            <style type="text/css">
              .${gm.id}-rhsTmp {
                margin: 0.5em 0;
              }
              .${gm.id}-rhsTmp table {
                width: 100%;
              }
              .${gm.id}-rhsTmp table,
              .${gm.id}-rhsTmp th,
              .${gm.id}-rhsTmp td {
                border: 1px solid white;
                border-collapse: separate;
                border-spacing: 4px;
              }
              .${gm.id}-rhsTmp th,
              .${gm.id}-rhsTmp td {
                text-align: center;
              }
            </style>
            <div>作者所作的简单性能测试结果如下（单位：毫秒）。注意，此处「读取」不含脚本管理器对数据进行预加载的时间。</div>
            <div>测试条件为设想中的最差情况，100 次取平均。测试环境是不可能写的，反正仅供参考。</div>
            <div class="${gm.id}-rhsTmp">
              <table>
                <tr><th>N</th><th>读取</th><th>写入</th><th>处理</th></tr>
                <tr><td>5000</td><td>2.2</td><td>7.2</td><td>1.0</td></tr>
                <tr><td>10000</td><td>4.4</td><td>16</td><td>1.9</td></tr>
                <tr><td>100000</td><td>69</td><td>170</td><td>22</td></tr>
              </table>
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhsInformation.parentNode.hasAttribute('disabled') })
          el.rhtInformation = gm.el.setting.querySelector('#gm-rhtInformation')
          api.message.advanced(el.rhtInformation, `
            <div style="line-height:1.6em">
              在历史数据记录中添加时间戳，用于改善移除记录中的数据排序，使得排序以「视频『最后一次』被观察到处于稍后再看的时间点」为基准，而非以「视频『第一次』被观察到处于稍后再看的时间点」为基准；同时也利于数据展示与查看。注意，此功能在数据存读及处理上都有额外开销。
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhtInformation.parentNode.hasAttribute('disabled') })
          el.fwsInformation = gm.el.setting.querySelector('#gm-fwsInformation')
          api.message.advanced(el.fwsInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>在动态页、视频播放页以及其他页面，视频卡片的右下角方存在一个将视频加入或移除出稍后再看的快捷按钮。然而，在刷新页面后，B站不会为之加载稍后再看的状态——即使视频已经在稍后再看中，也不会显示出来。启用该功能后，会自动填充这些缺失的状态信息。</p>
              <p>第三项「所有页面」，会用一套固定的逻辑对脚本能匹配到的所有非特殊页面尝试进行信息填充。脚本本身没有匹配所有B站页面，如果有需要，请在脚本管理器（如 Tampermonkey）中为脚本设置额外的页面匹配规则。由于B站各页面的设计不是很规范，某些页面中视频卡片的设计可能跟其他地方不一致，所以不保证必定能填充成功。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.dpcInformation = gm.el.setting.querySelector('#gm-dpcInformation')
          api.message.advanced(el.dpcInformation, `
            <div style="line-height:1.6em">
              <p>部分情况下，在同一个页面中，若一份数据之前已经获取过，则使用页面中缓存的数据。当然，这种情况对数据的实时性没有要求，不建议禁用页面缓存。注意，启用该项不会禁用本地缓存。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.wlcvpInformation = gm.el.setting.querySelector('#gm-wlcvpInformation')
          api.message.advanced(el.wlcvpInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>在本地缓存的有效期内脚本将会使用本地缓存来代替网络请求，除非是在有必要确保数据正确性的场合。设置为 <b>0</b> 可以禁止使用本地缓存。</p>
              <p>本地缓存无法确保数据的正确性，设置过长时甚至可能导致各种诡异的现象。请根据个人需要将本地缓存有效期设置为一个合理的值。</p>
              <p>不推荐设置为 0 将其完全禁用，而是设置为一个较小值（如 5）。这样几乎不会影响正确性，同时避免大量无意义的网络请求。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })

          el.hcWarning = gm.el.setting.querySelector('#gm-hcWarning')
          api.message.advanced(el.hcWarning, '无须兼容第三方顶栏时务必选择「无」，否则脚本无法正常工作！', '⚠')
          el.rhWarning = gm.el.setting.querySelector('#gm-rhWarning')
          api.message.advanced(el.rhWarning, '关闭移除记录，或将稍后再看历史数据保存次数设置为比原来小的值，都会造成对内部过期历史数据的清理！', '⚠')
          el.rhsWarning = gm.el.setting.querySelector('#gm-rhsWarning')
          api.message.advanced(el.rhsWarning, `该项设置过大时，在极端情况下可能会造成明显的卡顿，一般不建议该项超过 ${gm.const.rhsWarning}（详见弹出说明）。当然，如果对机器性能自信，可以无视该警告。`, '⚠')

          el.headerButtonOpL.innerHTML = el.headerButtonOpR.innerHTML = el.headerButtonOpM.innerHTML = `
            <option value="${Enums.headerButtonOp.openListInCurrent}">在当前页面打开列表页面</option>
            <option value="${Enums.headerButtonOp.openListInNew}">在新标签页打开列表页面</option>
            <option value="${Enums.headerButtonOp.playAllInCurrent}">在当前页面播放全部</option>
            <option value="${Enums.headerButtonOp.playAllInNew}">在新标签页播放全部</option>
            <option value="${Enums.headerButtonOp.clearWatchlater}">清空稍后再看</option>
            <option value="${Enums.headerButtonOp.clearWatchedInWatchlater}">移除稍后再看已观看视频</option>
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
                parent.setAttribute('disabled', '')
              }
              el.disabled = !item.checked
            }
          }
          el.headerMenuFn = el.headerMenuFnSetting.parentNode.parentNode
          el.headerButton.init = function() {
            subitemChange(this, [el.headerButtonOpL, el.headerButtonOpR, el.headerButtonOpM, el.headerMenu, el.openHeaderMenuLink, el.menuScrollbarSetting, el.headerMenuSearch, el.headerMenuFnSetting, el.headerMenuFnHistory, el.headerMenuFnRemoveAll, el.headerMenuFnRemoveWatched, el.headerMenuFnShowAll, el.headerMenuFnPlayAll, el.headerCompatible])
            if (this.checked) {
              el.headerMenuFn.removeAttribute('disabled')
            } else {
              el.headerMenuFn.setAttribute('disabled', '')
            }
          }
          el.headerButton.onchange = function() {
            this.init()
            if (gm.config.hideDisabledSubitems) {
              api.dom.setAbsoluteCenter(el.settingPage)
            }
          }
          el.headerCompatible.init = el.headerCompatible.onchange = function() {
            setHcWarning()
          }
          el.removeHistory.init = function() {
            subitemChange(this, [el.removeHistorySavePoint, el.removeHistoryFuzzyCompare, el.removeHistorySaves, el.removeHistoryTimestamp, el.removeHistorySearchTimes])
            setRhWaring()
          }
          el.removeHistory.onchange = function() {
            this.init()
            if (gm.config.hideDisabledSubitems) {
              api.dom.setAbsoluteCenter(el.settingPage)
            }
          }

          // 输入框内容处理
          el.removeHistoryFuzzyCompare.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > gm.configMap.removeHistoryFuzzyCompare.max) {
                value = gm.configMap.removeHistoryFuzzyCompare.max
              }
              this.value = value
            }
          }
          el.removeHistoryFuzzyCompare.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.removeHistoryFuzzyCompare.default
            }
          }

          el.removeHistorySaves.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > gm.configMap.removeHistorySaves.max) {
                value = gm.configMap.removeHistorySaves.max
              }
              this.value = value
            }
            setRhWaring()
            setRhsWarning()
          }
          el.removeHistorySaves.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.removeHistorySaves.default
            } else {
              let value = parseInt(this.value)
              if (value < gm.configMap.removeHistorySaves.min) {
                value = gm.configMap.removeHistorySaves.min
              }
              this.value = value
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
              if (value > gm.configMap.removeHistorySearchTimes.max) {
                value = gm.configMap.removeHistorySearchTimes.max
              }
              this.value = value
            }
          }
          el.removeHistorySearchTimes.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.removeHistorySearchTimes.default
            } else {
              let value = parseInt(this.value)
              if (value < gm.configMap.removeHistorySearchTimes.min) {
                value = gm.configMap.removeHistorySearchTimes.min
              }
              this.value = value
            }
          }

          el.watchlaterListCacheValidPeriod.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > gm.configMap.watchlaterListCacheValidPeriod.max) {
                value = gm.configMap.watchlaterListCacheValidPeriod.max
              }
              this.value = value
            }
          }
          el.watchlaterListCacheValidPeriod.onblur = function() {
            if (this.value === '') {
              this.value = gm.configMap.watchlaterListCacheValidPeriod.default
            }
          }
        }

        /**
         * 处理与设置页面相关的数据和元素
         */
        const processSettingItem = () => {
          const _self = this
          gm.menu.setting.openHandler = onOpen
          gm.menu.setting.openedHandler = () => {
            api.dom.setAbsoluteCenter(el.settingPage)
            el.items.scrollTop = 0
          }
          el.save.onclick = onSave
          el.cancel.onclick = () => _self.closeMenuItem('setting')
          el.shadow.onclick = function() {
            if (!this.hasAttribute('disabled')) {
              _self.closeMenuItem('setting')
            }
          }
          el.reset.onclick = () => _self.resetScript()
          el.cleanRemoveHistoryData.onclick = function() {
            el.removeHistory.checked && _self.cleanRemoveHistoryData()
          }
          if (type > 0) {
            el.cancel.disabled = true
            el.shadow.setAttribute('disabled', '')
          }
        }

        let needReload = false
        /**
         * 设置保存时执行
         */
        const onSave = () => {
          // 通用处理
          for (const name in gm.configMap) {
            const cfg = gm.configMap[name]
            if (!cfg.manual) {
              const change = saveConfig(name, cfg.attr)
              if (!cfg.needNotReload) {
                needReload = needReload || change
              }
            }
          }

          // 特殊处理
          if (gm.config.headerMenu != el.headerMenu.value) {
            gm.config.headerMenu = el.headerMenu.value
            GM_setValue('headerMenu', gm.config.headerMenu)
            GM_deleteValue('watchlaterListCacheTime')
            GM_deleteValue('watchlaterListCache')
            needReload = true
          }
          let shutDownRemoveHistory = false
          // removeHistory
          if (gm.config.removeHistory != el.removeHistory.checked) {
            gm.config.removeHistory = el.removeHistory.checked
            GM_setValue('removeHistory', gm.config.removeHistory)
            shutDownRemoveHistory = true
            needReload = true
          }
          // 「因」中无 removeHistory，就说明 needReload 需要设置为 true，除非「果」不需要刷新页面就能生效
          if (gm.config.removeHistory) {
            const rhsV = parseInt(el.removeHistorySaves.value)
            if (rhsV != gm.config.removeHistorySaves && !isNaN(rhsV)) {
              // 因：removeHistorySaves
              // 果：removeHistorySaves & removeHistoryData
              const data = gm.data.removeHistoryData()
              data.setMaxSize(rhsV)
              data.setCapacity(rhsV)
              gm.config.removeHistorySaves = rhsV
              GM_setValue('removeHistorySaves', rhsV)
              GM_setValue('removeHistoryData', data)
              // 不需要修改 needReload
            }
            // 因：removeHistorySearchTimes
            // 果：removeHistorySearchTimes
            const rhstV = parseInt(el.removeHistorySearchTimes.value)
            if (rhstV != gm.config.removeHistorySearchTimes && !isNaN(rhstV)) {
              gm.config.removeHistorySearchTimes = rhstV
              GM_setValue('removeHistorySearchTimes', rhstV)
              // 不需要修改 needReload
            }
          } else if (shutDownRemoveHistory) {
            // 因：removeHistory
            // 果：most thing about history
            gm.data.removeHistoryData(true)
            GM_deleteValue('removeHistoryData')
            GM_deleteValue('removeHistoryFuzzyCompare')
            GM_deleteValue('removeHistoryFuzzyCompareReference')
            GM_deleteValue('removeHistorySaves')
          }

          _self.closeMenuItem('setting')
          if (type > 0) {
            // 更新配置版本
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
            // 关闭特殊状态
            setTimeout(() => {
              el.settingPage.removeAttribute('setting-type')
              el.maintitle.innerText = GM_info.script.name
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
          for (const name in gm.configMap) {
            const attr = gm.configMap[name].attr
            el[name][attr] = gm.config[name]
          }
          for (const name in gm.configMap) {
            // 需要等所有配置读取完成后再进行选项初始化
            el[name].init?.()
          }

          if (gm.config.removeHistory) {
            el.cleanRemoveHistoryData.innerText = `清空数据(${gm.data.removeHistoryData().size}条)`
          } else {
            el.cleanRemoveHistoryData.innerText = '清空数据(0条)'
          }

          el.settingPage.parentNode.style.display = 'block'
        }

        /**
         * 保存配置
         * @param {string} name 配置名称
         * @param {string} attr 从对应元素的什么属性读取
         * @returns {boolean} 是否有实际更新
         */
        const saveConfig = (name, attr) => {
          let val = el[name][attr]
          const type = gm.configMap[name].type
          if (type == 'int' || type == 'float') {
            if (typeof val != 'number') {
              val = type == 'int' ? parseInt(val) : parseFloat(val)
            }
            if (isNaN(val)) {
              val = gm.configMap[name].default
            }
          }
          if (gm.config[name] != val) {
            gm.config[name] = val
            GM_setValue(name, gm.config[name])
            return true
          }
          return false
        }

        /**
         * 设置 headerCompatible 警告项
         */
        const setHcWarning = () => {
          const warn = el.headerCompatible.value != Enums.headerCompatible.none
          if (el.hcWarning.show) {
            if (!warn) {
              api.dom.fade(false, el.hcWarning)
              el.hcWarning.show = false
            }
          } else {
            if (warn) {
              api.dom.fade(true, el.hcWarning)
              el.hcWarning.show = true
            }
          }
        }

        /**
         * 设置 removeHistory 警告项
         */
        const setRhWaring = () => {
          let warn = false
          const rh = el.removeHistory.checked
          if (!rh && gm.config.removeHistory) {
            warn = true
          } else {
            let rhs = parseInt(el.removeHistorySaves.value)
            if (isNaN(rhs)) {
              rhs = 0
            }
            if (rhs < gm.config.removeHistorySaves && gm.config.removeHistory) {
              warn = true
            }
          }

          if (el.rhWarning.show) {
            if (!warn) {
              api.dom.fade(false, el.rhWarning)
              el.rhWarning.show = false
            }
          } else {
            if (warn) {
              api.dom.fade(true, el.rhWarning)
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
              api.dom.fade(false, el.rhsWarning)
              el.rhsWarning.show = false
            }
          } else {
            if (value > gm.const.rhsWarning) {
              api.dom.fade(true, el.rhsWarning)
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
      const _self = this
      if (!gm.config.removeHistory) {
        api.message.create('请在设置中开启稍后再看移除记录')
        return
      }

      const el = {}
      if (gm.el.history) {
        el.searchTimes = gm.el.history.querySelector('#gm-search-times')
        el.searchTimes.current = gm.config.removeHistorySearchTimes
        el.searchTimes.value = el.searchTimes.current

        el.historySort = gm.el.history.querySelector('#gm-history-sort')
        if (el.historySort.type !== 0) {
          el.historySort.setType(0) // 倒序
        }

        _self.openMenuItem('history')
      } else {
        setTimeout(() => {
          initHistory()
          processItem()
          _self.openMenuItem('history')
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
                <div>根据最近<span id="gm-save-times">0</span>条不重复数据记录生成，共筛选出<span id="gm-removed-num">0</span>条移除记录。排序由视频<span id="gm-history-time-point"></span>被观察到处于稍后再看的时间决定，与被移除出稍后再看的时间无关。如果记录太少请在下方设置增加历史回溯深度；记录太多则减少之，并善用浏览器的搜索功能辅助定位。鼠标移动到内容区域可向下滚动翻页，点击对话框以外的位置退出。</div>
                <div style="text-align:right;font-weight:bold">
                  <span id="gm-history-sort" style="text-decoration:underline;cursor:pointer">倒序</span>
                  <span title="搜寻时在最近保存的多少条稍后再看历史数据记录中查找。按下回车键或输入框失去焦点时刷新数据，设置较小的值能较好地定位最近被添加到稍后再看的视频。">历史回溯深度：<input type="text" id="gm-search-times" value="0"></span>
                </div>
              </div>
            </div>
            <div class="gm-shadow"></div>
          `
          el.historyPage = gm.el.history.querySelector('.gm-history-page')
          el.comment = gm.el.history.querySelector('.gm-comment')
          el.content = null
          el.timePoint = gm.el.history.querySelector('#gm-history-time-point')
          el.saveTimes = gm.el.history.querySelector('#gm-save-times')
          el.removedNum = gm.el.history.querySelector('#gm-removed-num')
          el.shadow = gm.el.history.querySelector('.gm-shadow')
        }

        /**
         * 维护内部元素和数据
         */
        const processItem = () => {
          // 使用 el.searchTimes.current 代替本地变量记录数据，可以保证任何情况下闭包中都能获取到正确数据
          el.searchTimes = gm.el.history.querySelector('#gm-search-times')
          el.searchTimes.current = gm.config.removeHistorySearchTimes
          el.searchTimes.value = el.searchTimes.current
          const stMin = gm.configMap.removeHistorySearchTimes.min
          el.searchTimes.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              const stMax = gm.configMap.removeHistorySearchTimes.max
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
              this.value = gm.config.removeHistorySearchTimes
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
            this.title = `点击切换${this.typeText[(type + 1) % 2]}`
          }
          el.historySort.onclick = function() {
            this.setType((this.type + 1) % 2)
            gm.menu.history.openHandler()
          }

          gm.menu.history.openHandler = onOpen
          gm.menu.history.openedHandler = () => api.dom.setAbsoluteCenter(el.historyPage)
          window.addEventListener('resize', api.tool.throttle(setContentTop, 100))
          el.shadow.onclick = () => _self.closeMenuItem('history')
        }

        /**
         * 移除记录打开时执行
         * @async
         */
        const onOpen = async () => {
          if (el.content) {
            const oldContent = el.content
            oldContent.style.opacity = '0'
            setTimeout(() => {
              oldContent.remove()
            }, gm.const.textFadeTime)
          }
          el.content = el.historyPage.appendChild(document.createElement('div'))
          el.content.className = 'gm-content'
          el.timePoint.innerText = gm.config.removeHistoryTimestamp ? '最后一次' : '第一次'
          el.historyPage.parentNode.style.display = 'block'

          try {
            const map = await webpage.method.getWatchlaterDataMap(item => item.bvid, null, true)
            const data = gm.data.removeHistoryData().toArray(el.searchTimes.current)
            el.saveTimes.innerText = data.length
            let history = []
            const result = []
            for (const record of data) {
              if (!map.has(record[0])) {
                history.push(record)
              }
            }
            if (gm.config.removeHistoryTimestamp) {
              // 万恶的标准并没有对 Array.prototype.sort() 的稳定性作规定
              // 尽管目前 Chromium 上的 sort() 似乎是稳定排序，但还是手动处理一下吧
              const tsMap = new Map()
              for (let i = 0; i < history.length; i++) {
                const ts = history[i][2] ?? 0
                if (tsMap.has(ts)) {
                  const ar = tsMap.get(ts)
                  ar.push(history[i])
                } else {
                  const ar = []
                  ar.push(history[i])
                  tsMap.set(ts, ar)
                }
              }
              const tsIdx = Array.from(tsMap.keys())
              tsIdx.sort()
              history = []
              if (el.historySort.type != 1) {
                for (let i = tsIdx.length - 1; i >= 0; i--) {
                  history = history.concat(tsMap.get(tsIdx[i]))
                }
              } else {
                for (let i = 0; i < tsIdx.length; i++) {
                  history = history.concat(tsMap.get(tsIdx[i]).reverse())
                }
              }

              for (const rm of history) {
                result.push(`
                  <div>
                    <a href="${gm.url.page_videoNormalMode}/${rm[0]}" target="_blank">${rm[1]}</a>
                    <input type="checkbox" bvid="${rm[0]}">
                    ${rm[2] ? `<div class="gm-history-date">${new Date(rm[2]).toLocaleString()}</div>` : ''}
                  </div>
                `)
              }
            } else {
              if (history.length > 1 && el.historySort.type == 1) {
                history.reverse()
              }
              for (const rm of history) {
                result.push(`
                  <div>
                    <a href="${gm.url.page_videoNormalMode}/${rm[0]}" target="_blank">${rm[1]}</a>
                    <input type="checkbox" bvid="${rm[0]}">
                  </div>
                `)
              }
            }
            el.removedNum.innerText = result.length

            setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
            if (result.length > 0) {
              el.content.innerHTML = result.join('')
              const boxes = el.content.querySelectorAll('input[bvid]')
              for (const box of boxes) {
                box.addEventListener('click', async function() {
                  const status = this.checked
                  const bvid = this.getAttribute('bvid')
                  const note = status ? '添加到稍后再看' : '从稍后再看移除'
                  const success = await webpage?.method.switchVideoWatchlaterStatus(bvid, status)
                  if (success) {
                    api.message.create(`${note}成功`)
                  } else {
                    this.checked = !status
                    api.message.create(`${note}失败${status ? '，可能视频不可用，或为不支持的稿件类型（如互动视频）' : ''}`)
                  }
                })
              }
            } else {
              el.content.innerText = '没有找到移除记录，请尝试增大历史回溯深度'
              el.content.style.color = 'gray'
              el.content.style.fontSize = '1.5em'
              el.content.style.paddingTop = '1em'
            }
            el.content.style.opacity = '1'
          } catch (e) {
            setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
            el.content.innerHTML = `网络连接错误，出现这个问题有可能是因为网络加载速度不足或者B站后台 API 被改动。也不排除是脚本内部数据出错造成的，初始化脚本或清空稍后再看历史数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`
            el.content.style.color = 'gray'
            el.content.style.fontSize = '1.5em'
            el.content.style.paddingTop = '1em'
            api.logger.error(e)
          }
        }

        const setContentTop = () => {
          if (el.content) {
            el.content.style.top = `${el.comment.offsetTop + el.comment.offsetHeight}px`
          }
        }
      }
    }

    /**
     * 初始化脚本
     */
    resetScript() {
      const result = confirm(`【${GM_info.script.name}】\n\n是否要初始化脚本？\n\n注意：本操作不会清理内部保存的稍后再看历史数据，要清理稍后再看历史数据请在用户设置中操作。`)
      if (result) {
        const keyNoReset = { removeHistoryData: true, removeHistorySaves: true }
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
      const result = confirm(`【${GM_info.script.name}】\n\n是否要清空稍后再看历史数据？`)
      if (result) {
        this.closeMenuItem('setting')
        GM_deleteValue('removeHistoryData')
        GM_deleteValue('removeHistoryFuzzyCompareReference')
        if (gm.config.reloadAfterSetting) {
          location.reload()
        } else {
          if (gm.config.removeHistory) {
            gm.data.removeHistoryData(true)
          }
        }
      }
    }

    /**
     * 对「打开菜单项」这一操作进行处理，包括显示菜单项、设置当前菜单项的状态、关闭其他菜单项
     * @async
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 打开菜单项后的回调函数
     * @param {boolean} [keepOthers] 打开时保留其他菜单项
     * @returns {Promise<boolean>} 操作是否成功
     */
    async openMenuItem(name, callback, keepOthers) {
      const _self = this
      let success = false
      try {
        try {
          if (gm.menu[name].state == 1) {
            await api.wait.waitForConditionPassed({
              condition: () => gm.menu[name].state == 2,
              timeout: 2000,
            })
            return true
          } else if (gm.menu[name].state == 3) {
            await api.wait.waitForConditionPassed({
              condition: () => gm.menu[name].state == 0,
              timeout: 2000,
            })
          }
        } catch (e) {
          gm.menu[name].state = -1
          api.logger.error(e)
        }
        if (gm.menu[name].state == 0 || gm.menu[name].state == -1) {
          for (const key in gm.menu) {
            /** @type {GMObject_menu_item} */
            const menu = gm.menu[key]
            if (key == name) {
              menu.state = 1
              await menu.openHandler?.call(menu)
              await new Promise(resolve => {
                api.dom.fade(true, menu.el, () => {
                  resolve()
                  menu.openedHandler?.call(menu)
                  callback?.call(menu)
                })
              })
              menu.state = 2
              success = true
              // 不要返回，需将其他菜单项关闭
            } else if (!keepOthers) {
              if (menu.state == 2) {
                _self.closeMenuItem(key)
              }
            }
          }
        }
        if (success && document.fullscreenElement) {
          document.exitFullscreen()
        }
      } catch (e) {
        gm.menu[name].state = -1
        api.logger.error(e)
      }
      return success
    }

    /**
     * 对「关闭菜单项」这一操作进行处理，包括隐藏菜单项、设置当前菜单项的状态
     * @async
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 关闭菜单项后的回调函数
     * @returns {Promise<boolean>} 操作是否成功
     */
    async closeMenuItem(name, callback) {
      /** @type {GMObject_menu_item} */
      const menu = gm.menu[name]
      try {
        try {
          if (menu.state == 1) {
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 2,
              timeout: 2000,
            })
          } else if (menu.state == 3) {
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 0,
              timeout: 2000,
            })
            return true
          }
        } catch (e) {
          menu.state = -1
          api.logger.error(e)
        }
        if (menu.state == 2 || menu.state == -1) {
          menu.state = 3
          await menu.closeHandler?.call(menu)
          await new Promise(resolve => {
            api.dom.fade(false, menu.el, () => {
              resolve()
              menu.closedHandler?.call(menu)
              callback?.call(menu)
            })
          })
          menu.state = 0
          return true
        }
      } catch (e) {
        menu.state = -1
        api.logger.error(e)
      }
      return false
    }
  }

  /**
   * 页面处理的抽象，脚本围绕网站的特化部分
   */
  class Webpage {
    constructor() {
      /** 通用方法 */
      this.method = {
        /** 内部数据 */
        _: {},

        /**
         * 获取指定 Cookie
         * @param {string} key 键
         * @returns {string} 值
         * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/API/Document/cookie#示例2_得到名为test2的cookie Document.cookie - Web API 接口参考 | MDN}
         */
        cookie(key) {
          return document.cookie.replace(RegExp(String.raw`(?:(?:^|.*;\s*)${key}\s*=\s*([^;]*).*$)|^.*$`), '$1')
        },

        /**
         * 判断用户是否已登录
         * @returns {boolean} 用户是否已登录
         */
        isLogin() {
          return Boolean(this.getCSRF())
        },

        /**
         * 获取 CSRF
         * @returns {string} `csrf`
         */
        getCSRF() {
          return this.cookie('bili_jct')
        },

        /**
         * 获取视频信息
         * @async
         * @param {string} id `aid` 或 `bvid`
         * @param {'aid' | 'bvid'} [type='bvid'] `id` 类型
         * @returns {Promise<JSON>} 视频信息
         */
        async getVideoInfo(id, type = 'bvid') {
          const resp = await api.web.request({
            method: 'GET',
            url: gm.url.api_videoInfo(id, type),
          })
          return JSON.parse(resp.responseText).data
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
         * 根据 `aid` 获取视频的稍后再看状态
         * @async
         * @param {string} aid 视频 `aid`
         * @param {boolean} [reload] 是否重新加载
         * @param {boolean} [localCache=true] 是否使用本地缓存
         * @param {boolean} [disablePageCache] 是否禁用页面缓存
         * @returns {Promise<boolean>} 视频是否在稍后再看中
         */
        async getVideoWatchlaterStatusByAid(aid, reload = false, localCache = true, disablePageCache = false) {
          const current = await gm.data.watchlaterListData(reload, localCache, disablePageCache)
          if (current.length > 0) {
            for (const e of current) {
              if (aid == e.aid) {
                return true
              }
            }
          }
          return false
        },

        /**
         * 将视频加入稍后再看，或从稍后再看移除
         * @async
         * @param {string} id 视频 `aid` 或 `bvid`（执行移除时优先选择 `aid`）
         * @param {boolean} [status=true] 添加 `true` / 移除 `false`
         * @returns {Promise<boolean>} 操作是否成功（视频不在稍后在看中不被判定为失败）
         */
        async switchVideoWatchlaterStatus(id, status = true) {
          const _self = this
          try {
            let typeA = !isNaN(id)
            if (!typeA && !status) { // 移除 API 只支持 aid，先作转换
              // 知乎上的算法似乎在某些情况下并不正确，保险起见发请求查询好了
              const info = await _self.getVideoInfo(id, 'bvid')
              id = String(info.aid)
              typeA = true
            }
            const data = new FormData()
            if (typeA) {
              data.append('aid', id)
            } else {
              data.append('bvid', id)
            }
            data.append('csrf', _self.getCSRF())
            const resp = await api.web.request({
              method: 'POST',
              url: status ? gm.url.api_addToWatchlater : gm.url.api_removeFromWatchlater,
              data: data,
            })
            return JSON.parse(resp.response).code == 0
          } catch (e) {
            api.logger.error(e)
            return false
          }
        },

        /**
         * 清空稍后再看
         * @async
         * @returns {Promise<boolean>} 操作是否成功
         */
        async clearWatchlater() {
          try {
            const data = new FormData()
            data.append('csrf', this.getCSRF())
            const resp = await api.web.request({
              method: 'POST',
              url: gm.url.api_clearWatchlater,
              data: data,
            })
            const success = JSON.parse(resp.response).code == 0
            if (success) {
              const empty = []
              gm.data._.watchlaterListData = empty
              if (gm.config.watchlaterListCacheValidPeriod > 0) {
                GM_setValue('watchlaterListCacheTime', new Date().getTime())
                GM_setValue('watchlaterListCache', empty)
              }
            }
            return success
          } catch (e) {
            api.logger.error(e)
            return false
          }
        },

        /**
         * 移除稍后再看已观看视频
         * @async
         * @returns {Promise<boolean>} 操作是否成功
         */
        async clearWatchedInWatchlater() {
          try {
            const data = new FormData()
            data.append('viewed', true)
            data.append('csrf', this.getCSRF())
            const resp = await api.web.request({
              method: 'POST',
              url: gm.url.api_removeFromWatchlater,
              data: data,
            })
            const success = JSON.parse(resp.response).code == 0
            if (success) {
              gm.data._.watchlaterListData = null
              if (gm.config.watchlaterListCacheValidPeriod > 0) {
                GM_setValue('watchlaterListCacheTime', 0)
              }
            }
            return success
          } catch (e) {
            api.logger.error(e)
            return false
          }
        },

        /**
         * 使用稍后再看列表数据更新稍后再看历史数据
         * @async
         * @param {boolean} [reload] 是否重新加载稍后再看列表数据
         */
        updateRemoveHistoryData(reload) {
          const _ = this._
          if (gm.config.removeHistory) {
            if (!_.watchLaterListData_saved || reload) {
              if (!_.watchlaterListData_saving) {
                _.watchlaterListData_saving = true
                return gm.data.watchlaterListData(reload).then(current => {
                  if (current.length > 0) {
                    if (gm.config.removeHistoryFuzzyCompare > 0) {
                      const ref = GM_getValue('removeHistoryFuzzyCompareReference')
                      let same = true
                      if (ref) {
                        for (let i = 0; i < gm.config.removeHistoryFuzzyCompare; i++) {
                          const c = current[i]
                          const r = ref[i]
                          if (c) { // 如果 current 没有数据直接跳过得了
                            if (r) {
                              if (c.bvid != r) {
                                same = false
                                break
                              }
                            } else {
                              same = false
                              break
                            }
                          }
                        }
                      } else {
                        same = false
                      }
                      if (same) {
                        _.watchLaterListData_saved = true
                        return
                      } else {
                        if (current.length >= gm.config.removeHistoryFuzzyCompare) {
                          const newRef = []
                          for (let i = 0; i < gm.config.removeHistoryFuzzyCompare; i++) {
                            newRef.push(current[i].bvid)
                          }
                          GM_setValue('removeHistoryFuzzyCompareReference', newRef)
                        } else {
                          // 若 current 长度不够，那么加进去也白搭
                          GM_deleteValue('removeHistoryFuzzyCompareReference')
                        }
                      }
                    }

                    const data = gm.data.removeHistoryData()
                    let updated = false
                    if (gm.config.removeHistoryTimestamp) {
                      const timestamp = new Date().getTime()
                      const map = new Map()
                      for (let i = 0; i < data.size; i++) {
                        map.set(data.get(i)[0], i)
                      }
                      for (let i = current.length - 1; i >= 0; i--) {
                        const item = current[i]
                        if (map.has(item.bvid)) {
                          const idx = map.get(item.bvid)
                          data.get(idx)[2] = timestamp
                        } else {
                          data.push([item.bvid, item.title, timestamp])
                        }
                      }
                      updated = true
                    } else {
                      const set = new Set()
                      for (let i = 0; i < data.size; i++) {
                        set.add(data.get(i)[0])
                      }
                      for (let i = current.length - 1; i >= 0; i--) {
                        const item = current[i]
                        if (!set.has(item.bvid)) {
                          data.push([item.bvid, item.title])
                          updated = true
                        }
                      }
                    }
                    if (updated) {
                      GM_setValue('removeHistoryData', data)
                    }
                    _.watchLaterListData_saved = true
                  }
                }).finally(() => {
                  _.watchlaterListData_saving = false
                })
              }
            }
          }
        },

        /**
         * 获取稍后再看列表数据以指定值为键的映射
         * @async
         * @param {(GMObject_data_item0) => *} key 计算键值的方法
         * @param {string} [cacheId] 缓存 ID，保留空值时不缓存
         * @param {boolean} [reload] 是否重新加载稍后再看列表数据
         * @param {boolean} [cache=true] 是否使用稍后再看列表数据本地缓存
         * @param {boolean} [disablePageCache] 是否禁用稍后再看列表数据页面缓存
         * @returns {Map<string, GMObject_data_item0>} 稍后再看列表数据以指定值为键的映射
         */
        async getWatchlaterDataMap(key, cacheId, reload, cache = true, disablePageCache = false) {
          let obj = null
          if (cacheId) {
            const _ = this._
            if (!_.watchlaterDataSet) {
              _.watchlaterDataSet = {}
            }
            obj = _.watchlaterDataSet
          }
          if (!obj?.[cacheId] || reload || disablePageCache) {
            const map = new Map()
            const current = await gm.data.watchlaterListData(reload, cache, disablePageCache)
            for (const item of current) {
              map.set(key(item), item)
            }
            if (cacheId) {
              obj[cacheId] = map
            } else {
              obj = map
            }
          }
          return cacheId ? obj[cacheId] : obj
        },

        /**
         * 清理 URL 上的查询参数
         */
        cleanSearchParams() {
          if (location.search.indexOf(gm.id) < 0) return
          let removed = false
          const url = new URL(location.href)
          const searchParams = url.searchParams
          gm.searchParams.forEach((value, key) => {
            if (key.startsWith(gm.id)) {
              searchParams.delete(key)
              removed = true
            }
          })
          if (removed && location.href != url.href) {
            history.replaceState({}, null, url.href)
          }
        },

        /**
         * 将秒格式的时间转换为字符串形式
         * @param {number} sTime 秒格式的时间
         * @returns {string} 字符串形式
         */
        getSTimeString(sTime) {
          let iH = 0
          let iM = Math.floor(sTime / 60)
          if (iM >= 60) {
            iH = Math.floor(iM / 60)
            iM = iM % 60
          }
          const iS = sTime % 60

          let sH = ''
          if (iH > 0) {
            sH = String(iH)
            if (sH.length < 2) {
              sH = '0' + sH
            }
          }
          let sM = String(iM)
          if (sM.length < 2) {
            sM = '0' + sM
          }
          let sS = String(iS)
          if (sS.length < 2) {
            sS = '0' + sS
          }
          return `${sH ? sH + ':' : ''}${sM}:${sS}`
        }
      }
    }

    /**
     * 顶栏中加入稍后再看入口
     */
    addHeaderButton() {
      const _self = this
      if (gm.config.headerCompatible == Enums.headerCompatible.bilibiliEvolved) {
        api.wait.waitQuerySelector('.custom-navbar [data-name=watchlaterList]').then(el => {
          const watchlater = el.parentNode.appendChild(el.cloneNode(true))
          el.style.display = 'none'
          const link = watchlater.querySelector('a.main-content')
          link.href = gm.url.noop
          link.target = '_self'
          processClickEvent(watchlater)
          processPopup(watchlater)
          const ob = new MutationObserver((mutations, observer) => {
            for (const mutation of mutations) {
              if (mutation.attributeName) {
                watchlater.setAttribute(mutation.attributeName, el.getAttribute(mutation.attributeName))
              }
            }
            observer.disconnect()
            watchlater.style.display = ''
            el.style.display = 'none'
            observer.observe(el, { attributes: true })
          })
          ob.observe(el, { attributes: true })
        })
        GM_addStyle(`
          #${gm.id} .gm-entrypopup[gm-compatible] {
            box-shadow: rgb(0 0 0 / 20%) 0 4px 8px 0;
          }
        `)
      } else {
        api.wait.waitQuerySelector('.user-con.signin').then(header => {
          const collect = header.children[4]
          const watchlater = document.createElement('div')
          watchlater.className = 'item'
          watchlater.innerHTML = '<a><span class="name">稍后再看</span></a>'
          header.insertBefore(watchlater, collect)
          processClickEvent(watchlater)
          processPopup(watchlater)
        })
      }

      /**
       * 处理清空稍后再看
       * @async
       * @returns {boolean} 是否清空成功
       */
      const clearWatchlater = async () => {
        let success = false
        const result = confirm(`【${GM_info.script.name}】\n\n是否清空稍后再看？`)
        if (result) {
          success = await this.method.clearWatchlater()
          api.message.create(`清空稍后再看${success ? '成功' : '失败'}`)
          if (success && api.web.urlMatch(gm.regex.page_watchlaterList)) {
            location.reload()
          }
        }
        return success
      }

      /**
       * 移除稍后再看已观看视频
       * @async
       * @returns {boolean} 是否移除成功
       */
      const clearWatchedInWatchlater = async () => {
        let success = false
        const result = confirm(`【${GM_info.script.name}】\n\n是否移除稍后再看已观看视频？`)
        if (result) {
          success = await this.method.clearWatchedInWatchlater()
          api.message.create(`移除稍后再看已观看视频${success ? '成功' : '失败'}`)
          if (success && api.web.urlMatch(gm.regex.page_watchlaterList)) {
            location.reload()
          }
        }
        return success
      }

      /**
       * 处理鼠标点击事件
       * @param {HTMLElement} watchlater 稍后再看入口元素
       */
      const processClickEvent = watchlater => {
        const config = [gm.config.headerButtonOpL, gm.config.headerButtonOpM, gm.config.headerButtonOpR]
        /**
         * 处理鼠标点击事件
         * @param {1 | 2 | 3} button 左键 | 中键 | 右键
         */
        const process = button => {
          const cfg = config[button]
          switch (cfg) {
            case Enums.headerButtonOp.openListInCurrent:
            case Enums.headerButtonOp.openListInNew:
            case Enums.headerButtonOp.playAllInCurrent:
            case Enums.headerButtonOp.playAllInNew: {
              const action = getHeaderButtonOpConfig(cfg)
              window.open(action.href, action.target)
              break
            }
            case Enums.headerButtonOp.clearWatchlater:
              clearWatchlater()
              break
            case Enums.headerButtonOp.clearWatchedInWatchlater:
              clearWatchedInWatchlater()
              break
            case Enums.headerButtonOp.openUserSetting:
              script.openUserSetting()
              break
            case Enums.headerButtonOp.openRemoveHistory:
              script.openRemoveHistory()
              break
          }
        }
        watchlater.onmousedown = function(e) {
          if (e.button != 2) {
            process(e.button)
            e.preventDefault()
          }
        }
        watchlater.oncontextmenu = function(e) {
          process(2) // 整合写进 mousedown 中会导致无法阻止右键菜单弹出
          e.preventDefault()
        }
      }

      /**
       * 处理弹出菜单
       * @param {HTMLElement} watchlater 稍后再看元素
       */
      const processPopup = watchlater => {
        if (gm.config.headerMenu == Enums.headerMenu.disable) return
        const popup = gm.menu.entryPopup.el
        setTimeout(() => {
          // 此处必须用 over；若用 enter，且网页刚加载完成时光标正好在入口上，无法轻移光标以触发事件
          watchlater.addEventListener('mouseover', onOverWatchlater)
          watchlater.addEventListener('mouseleave', onLeaveWatchlater)
          popup.addEventListener('mouseenter', onEnterPopup)
          popup.addEventListener('mouseleave', onLeavePopup)
        })

        /**
         * 鼠标是否在顶栏内
         * @param {MouseEvent} e 事件
         */
        const withinHeader = e => {
          const y = e.clientY
          const top = api.dom.getElementTop(watchlater)
          const margin = 5
          return (y > top - margin) && (y < top + margin)
        }

        /**
         * 进入稍后再看入口的处理
         */
        const onOverWatchlater = function() {
          if (this.mouseOver) return
          this.mouseOver = true
          if (gm.config.hideDisabledSubitems) {
            popup.style.position = api.dom.isFixed(watchlater.parentNode) ? 'fixed' : ''
          }
          popup.style.top = `calc(${api.dom.getElementTop(watchlater) + watchlater.offsetHeight}px + 1em)`
          popup.style.left = `calc(${api.dom.getElementLeft(watchlater) + watchlater.offsetWidth / 2}px - 16em)`
          openEntryPopup()
        }

        /**
         * 离开稍后再看入口的处理
         * @param {MouseEvent} e 事件
         */
        const onLeaveWatchlater = function(e) {
          this.mouseOver = false
          setTimeout(() => {
            if ((gm.menu.entryPopup.state == 2 && !popup.mouseOver) || withinHeader(e)) {
              script.closeMenuItem('entryPopup')
            }
          }, 200)
        }

        /**
         * 进入弹出菜单的处理
         */
        const onEnterPopup = function() {
          this.mouseOver = true
        }

        /**
         * 离开弹出菜单的处理
         */
        const onLeavePopup = function() {
          this.mouseOver = false
          setTimeout(() => {
            if (!watchlater.mouseOver) {
              script.closeMenuItem('entryPopup')
            }
          }, 80)
        }
      }

      /**
       * 打开入口弹出菜单
       */
      const openEntryPopup = () => {
        if (gm.el.entryPopup) {
          script.openMenuItem('entryPopup')
        } else {
          const el = {}
          setTimeout(() => {
            initPopup()
            processPopup()
            script.openMenuItem('entryPopup')
          })

          /**
           * 初始化
           */
          const initPopup = () => {
            const openLinkInCurrent = gm.config.openHeaderMenuLink == Enums.openHeaderMenuLink.openInCurrent
            const target = openLinkInCurrent ? '_self' : '_blank'
            gm.el.entryPopup = gm.el.gmRoot.appendChild(gm.menu.entryPopup.el)
            if (gm.config.headerCompatible != Enums.headerCompatible.none) {
              gm.el.entryPopup.setAttribute('gm-compatible', gm.config.headerCompatible)
            }
            gm.el.entryPopup.className = 'gm-entrypopup'
            gm.el.entryPopup.innerHTML = `
              <div class="gm-popup-arrow"></div>
              <div class="gm-popup-header">
                <div class="gm-popup-search">
                  <input type="text" placeholder="搜索... 支持形如 /reg/ 的正则表达式">
                  <div class="gm-popup-search-clear">✖</div>
                </div>
                <div class="gm-popup-total" title="列表条目数">0</div>
              </div>
              <div class="gm-entry-list"></div>
              <div class="gm-entry-list gm-entry-removed-list"></div>
              <div class="gm-entry-bottom">
                <a class="gm-entry-button" fn="setting" href="${gm.url.noop}">设置</a>
                <a class="gm-entry-button" fn="history" href="${gm.url.noop}">历史</a>
                <a class="gm-entry-button" fn="removeAll" href="${gm.url.noop}">清空</a>
                <a class="gm-entry-button" fn="removeWatched" href="${gm.url.noop}">移除已看</a>
                <a class="gm-entry-button" fn="showAll" href="${gm.url.page_watchlaterList}" target="${target}">显示</a>
                <a class="gm-entry-button" fn="playAll" href="${gm.url.page_watchlaterPlayAll}" target="${target}">播放</a>
              </div>
            `
            el.entryList = gm.el.entryPopup.querySelector('.gm-entry-list')
            el.entryRemovedList = gm.el.entryPopup.querySelector('.gm-entry-removed-list')
            el.entryHeader = gm.el.entryPopup.querySelector('.gm-popup-header')
            el.search = gm.el.entryPopup.querySelector('.gm-popup-search input')
            el.searchClear = gm.el.entryPopup.querySelector('.gm-popup-search-clear')
            el.popupTotal = gm.el.entryPopup.querySelector('.gm-popup-total')
            el.entryBottom = gm.el.entryPopup.querySelector('.gm-entry-bottom')
          }

          /**
           * 维护内部元素
           */
          const processPopup = () => {
            gm.menu.entryPopup.openHandler = onOpen
            gm.menu.entryPopup.openedHandler = () => {
              gm.config.headerMenuSearch && el.search.focus()
              el.entryList.scrollTop = 0
              el.entryRemovedList.scrollTop = 0
            }

            if (gm.config.headerMenuSearch) {
              el.search.oninput = function() {
                const regex = /^\/.+\/$/.test(this.value)
                let val = null
                if (regex) {
                  try {
                    val = new RegExp(this.value.slice(1, -1), 'i')
                  } catch (e) { /* 正则表达式错误，让搜索结果为 0 */ }
                } else {
                  val = this.value.toLowerCase()
                }
                const match = str => {
                  if (regex) {
                    return val && str && val.test(str)
                  } else {
                    return str?.toLowerCase().indexOf(val) > -1
                  }
                }
                const lists = [el.entryList, el.entryRemovedList]
                if (this.value.length > 0) {
                  el.searchClear.style.visibility = 'visible'
                } else {
                  el.searchClear.style.visibility = 'hidden'
                }
                const cnt = [0, 0]
                for (let i = 0; i < lists.length; i++) {
                  const list = lists[i]
                  if (list.total > 0) {
                    for (let j = 0; j < list.childElementCount; j++) {
                      let valid = false
                      const card = list.children[j]
                      if (this.value.length > 0) {
                        if (match(card.title)) {
                          valid = true
                        } else if (match(card.uploader)) {
                          valid = true
                        }
                      } else {
                        valid = true
                      }
                      if (valid) {
                        cnt[i] += 1
                        if (card.searchHide) {
                          api.dom.removeClass(card, 'gm-search-hide')
                          card.searchHide = false
                        }
                      } else {
                        if (!card.searchHide) {
                          api.dom.addClass(card, 'gm-search-hide')
                          card.searchHide = true
                        }
                      }
                    }
                    list.scrollTop = 0
                  }
                }
                el.popupTotal.innerText = `${cnt[0]}${cnt[1] > 0 ? `/${cnt[0] + cnt[1]}` : ''}`
              }
              el.searchClear.onclick = function() {
                el.search.value = ''
                el.search.oninput()
              }
            } else {
              el.entryHeader.style.display = 'none'
            }

            el.entryFn = {}
            const buttons = el.entryBottom.querySelectorAll('.gm-entry-button')
            for (const button of buttons) {
              const fn = button.getAttribute('fn')
              if (fn) {
                el.entryFn[fn] = button
              }
            }
            if (gm.config.headerMenuFnSetting) {
              el.entryFn.setting.setAttribute('enabled', '')
              el.entryFn.setting.addEventListener('click', () => script.openUserSetting())
            }
            if (gm.config.headerMenuFnHistory) {
              el.entryFn.history.setAttribute('enabled', '')
              el.entryFn.history.addEventListener('click', () => script.openRemoveHistory())
            }
            if (gm.config.headerMenuFnRemoveAll) {
              el.entryFn.removeAll.setAttribute('enabled', '')
              el.entryFn.removeAll.addEventListener('click', function() {
                script.closeMenuItem('entryPopup')
                clearWatchlater()
              })
            }
            if (gm.config.headerMenuFnRemoveWatched) {
              el.entryFn.removeWatched.setAttribute('enabled', '')
              el.entryFn.removeWatched.addEventListener('click', function() {
                script.closeMenuItem('entryPopup')
                clearWatchedInWatchlater()
              })
            }
            if (gm.config.headerMenuFnShowAll) {
              el.entryFn.showAll.setAttribute('enabled', '')
            }
            if (gm.config.headerMenuFnPlayAll) {
              el.entryFn.playAll.setAttribute('enabled', '')
            }
            if (el.entryBottom.querySelectorAll('[enabled]').length < 1) {
              el.entryBottom.style.display = 'none'
            }
          }

          /**
           * 打开时弹出菜单时执行
           * @async
           */
          const onOpen = async () => {
            const rmCards = gm.el.entryPopup.querySelectorAll('.gm-removed')
            let rmBvid = null
            if (rmCards.length > 0) {
              rmBvid = new Set()
              for (const rmCard of rmCards) {
                rmBvid.add(rmCard.bvid)
              }
            }
            el.search.value = ''
            el.searchClear.style.visibility = 'hidden'
            el.popupTotal.innerText = '0'
            el.entryList.innerHTML = ''
            el.entryList.total = 0
            el.entryRemovedList.innerHTML = ''
            el.entryRemovedList.total = 0
            let data = []
            if (el.entryList.needReload) {
              el.entryList.needReload = false
              data = await gm.data.watchlaterListData(true)
            } else {
              data = await gm.data.watchlaterListData(false, true, true) // 启用本地缓存但禁用页面缓存
            }
            const simplePopup = gm.config.headerMenu == Enums.headerMenu.enableSimple
            if (data.length > 0) {
              const openLinkInCurrent = gm.config.openHeaderMenuLink == Enums.openHeaderMenuLink.openInCurrent
              const redirect = gm.config.redirect
              const autoRemove = gm.config.autoRemove == Enums.autoRemove.always || gm.config.autoRemove == Enums.autoRemove.openFromList
              for (const item of data) {
                /** @type {HTMLAnchorElement} */
                const card = el.entryList.appendChild(document.createElement('a'))
                const valid = item.state >= 0
                card.title = item.title
                card.bvid = item.bvid
                if (rmBvid?.size > 0) {
                  if (rmBvid.has(card.bvid)) {
                    rmBvid.delete(card.bvid)
                  }
                }
                if (simplePopup) {
                  if (valid) {
                    card.innerText = card.title
                  } else {
                    card.innerHTML = `<b>[已失效]</b> ${card.title}`
                  }
                  card.className = 'gm-entry-list-simple-item'
                } else {
                  card.uploader = item.owner.name
                  const multiP = item.videos > 1
                  const duration = multiP ? `${item.videos}P` : _self.method.getSTimeString(item.duration)
                  const played = item.progress > 0
                  let progress = ''
                  if (played) {
                    if (multiP) {
                      progress = '已观看'
                    } else {
                      progress = _self.method.getSTimeString(item.progress)
                    }
                  }
                  card.className = 'gm-entry-list-item'
                  card.innerHTML = `
                    <div class="gm-card-left" title>
                      <img class="gm-card-cover" src="${item.pic}@156w_88h_1c_100q.webp">
                      <div class="gm-card-switcher"></div>
                      <div class="gm-card-duration">${duration}</div>
                    </div>
                    <div class="gm-card-right" title>
                      <div class="gm-card-title">${valid ? card.title : `<b>[已失效]</b> ${card.title}`}</div>
                      <div class="gm-card-uploader">${card.uploader}</div>
                      <div class="gm-card-progress" title="已观看">${progress}</div>
                    </div>
                  `
                  if (played) {
                    card.querySelector('.gm-card-progress').style.display = 'unset'
                    card.querySelector('.gm-card-uploader').style.maxWidth = '15em'
                  }

                  card.added = true
                  const switcher = card.querySelector('.gm-card-switcher')
                  switcher.addEventListener('click', function(e) {
                    el.entryList.needReload = true
                    e.preventDefault() // 不能放到 async 中
                    setTimeout(async () => {
                      const added = card.added
                      // 先改了 UI 再说，不要给用户等待感
                      if (added) {
                        api.dom.addClass(card, 'gm-removed')
                      } else {
                        api.dom.removeClass(card, 'gm-removed')
                      }
                      const note = added ? '从稍后再看移除' : '添加到稍后再看'
                      const success = await _self.method.switchVideoWatchlaterStatus(item.aid, !added)
                      if (success) {
                        card.added = !added
                        api.message.create(`${note}成功`)
                      } else {
                        if (added) {
                          api.dom.removeClass(card, 'gm-removed')
                        } else {
                          api.dom.addClass(card, 'gm-removed')
                        }
                        api.message.create(`${note}失败`)
                      }
                    })
                  })

                  const uploader = card.querySelector('.gm-card-uploader')
                  uploader.addEventListener('click', function(e) {
                    e.preventDefault()
                    window.open(gm.url.page_userSpace(item.owner.mid), '_blank')
                  })
                }
                if (valid) {
                  card.target = openLinkInCurrent ? '_self' : '_blank'
                  if (redirect) {
                    card.href = `${gm.url.page_videoNormalMode}/${item.bvid}`
                  } else {
                    card.href = `${gm.url.page_videoWatchlaterMode}/${item.bvid}`
                  }
                  if (autoRemove) {
                    card.href = card.href + `?${gm.id}_remove=true`
                    card.addEventListener('mouseup', function(e) {
                      if (!simplePopup) {
                        if (!card.added) return
                        if (api.dom.containsClass(e.target, ['gm-card-switcher', 'gm-card-uploader'])) return
                      }
                      el.entryList.needReload = true
                      if (e.button == 0 || e.button == 1) { // 左键或中键
                        api.dom.addClass(card, 'gm-removed')
                        card.added = false
                      }
                    })
                  }
                } else {
                  api.dom.addClass(card, 'gm-invalid')
                  card.target = '_self'
                  card.href = gm.url.noop
                }
              }
              el.entryList.total = data.length
            } else {
              el.entryList.innerHTML = '<div class="gm-entry-list-empty">稍后再看列表为空</div>'
            }

            // 添加已移除视频
            if (rmCards.length > 0) {
              const addedBvid = new Set()
              for (const rmCard of rmCards) {
                const bvid = rmCard.bvid
                if (addedBvid.has(bvid)) continue
                if (rmBvid.has(bvid)) {
                  if (rmCard.style.display == 'none') {
                    rmCard.style.display = ''
                  }
                } else {
                  rmCard.style.display = 'none'
                }
                el.entryRemovedList.appendChild(rmCard)
                addedBvid.add(bvid)
              }
            }
            if (rmBvid?.size > 0) {
              const only1 = rmBvid.size == 1
              const h = simplePopup ? (only1 ? 6 : 9) : (only1 ? 6.4 : 11)
              el.entryList.style.height = `${42 - h}em`
              el.entryRemovedList.style.height = `${h}em`
              el.entryRemovedList.style.display = 'block'
              el.entryRemovedList.total = rmBvid.size
            } else {
              el.entryList.style.height = ''
              el.entryRemovedList.style.display = ''
            }

            el.popupTotal.innerText = `${el.entryList.total}${el.entryRemovedList.total > 0 ? `/${el.entryList.total + el.entryRemovedList.total}` : ''}` 
            if (gm.config.removeHistory && gm.config.removeHistorySavePoint == Enums.removeHistorySavePoint.listAndMenu) {
              _self.method.updateRemoveHistoryData()
            }
          }
        }
      }

      /**
       * 获取入口点击的链接设置
       * @param {headerButtonOp} op
       * @returns {{href: string, target: '_self' | '_blank'}}
       */
      const getHeaderButtonOpConfig = op => {
        /** @type {{href: string, target: '_self' | '_blank'}} */
        const result = {}
        switch (op) {
          case Enums.headerButtonOp.openListInCurrent:
          case Enums.headerButtonOp.openListInNew:
            result.href = gm.url.page_watchlaterList
            break
          case Enums.headerButtonOp.playAllInCurrent:
          case Enums.headerButtonOp.playAllInNew:
            result.href = gm.url.page_watchlaterPlayAll
            break
          case Enums.headerButtonOp.clearWatchlater:
          case Enums.headerButtonOp.openUserSetting:
          case Enums.headerButtonOp.openRemoveHistory:
          case Enums.headerButtonOp.noOperation:
            result.href = gm.url.noop
            break
        }
        switch (op) {
          case Enums.headerButtonOp.openListInNew:
          case Enums.headerButtonOp.playAllInNew:
            result.target = '_blank'
            break
          default:
            result.target = '_self'
        }
        if (result.href != gm.url.noop) {
          const url = new URL(result.href)
          url.searchParams.set(`${gm.id}_from_header`, 'true')
          result.href = url.href
        }
        return result
      }
    }

    /**
     * 填充稍后再看状态
     * @async
     */
    async fillWatchlaterStatus() {
      const _self = this
      let map = await _self.method.getWatchlaterDataMap(item => String(item.aid), 'aid')
      setTimeout(() => {
        if (api.web.urlMatch(gm.regex.page_dynamicMenu)) { // 必须在动态页之前匹配
          fillWatchlaterStatus_dynamicMenu()
        } else if (api.web.urlMatch(gm.regex.page_dynamic)) {
          if (location.pathname == '/') { // 仅动态主页
            api.wait.waitQuerySelector('.feed-card').then(feed => {
              api.wait.executeAfterElementLoaded({
                selector: '.tab',
                base: feed,
                multiple: true,
                callback: tab => {
                  tab.addEventListener('click', async function() {
                    map = await _self.method.getWatchlaterDataMap(item => String(item.aid), 'aid', true)
                    // map 更新期间，ob 偷跑可能会将错误的数据写入，重新遍历并修正之
                    const videos = feed.querySelectorAll('.video-container')
                    for (const video of videos) {
                      const vue = video.__vue__
                      if (vue) {
                        const aid = String(vue.aid)
                        if (map.has(aid)) {
                          vue.seeLaterStatus = 1
                        } else {
                          vue.seeLaterStatus = 0
                        }
                      }
                    }
                  })
                },
              })
              fillWatchlaterStatus_dynamic()
            })
          }
        } else if (api.web.urlMatch(gm.regex.page_userSpace)) {
          // 用户空间中也有动态，但用户未必切换到动态子窗口，故需长时间等待
          api.wait.waitForElementLoaded({
            selector: '.feed-card',
            timeout: 0,
          }).then(() => fillWatchlaterStatus_dynamic())
        } else {
          // 两部分 URL 刚好不会冲突，放到 else 中即可
          // 用户空间「投稿」理论上需要单独处理，但该处逻辑和数据都在一个闭包里，无法通过简单的方式实现，经考虑选择放弃
          switch (gm.config.fillWatchlaterStatus) {
            case Enums.fillWatchlaterStatus.dynamicAndVideo:
              if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
                fillWatchlaterStatus_main()
              }
              return
            case Enums.fillWatchlaterStatus.anypage:
              fillWatchlaterStatus_main()
              return
            case Enums.fillWatchlaterStatus.never:
            default:
              return
          }
        }
      })

      /**
       * 填充动态页稍后再看状态
       * @async
       */
      const fillWatchlaterStatus_dynamic = async () => {
        api.wait.executeAfterElementLoaded({
          selector: '.video-container',
          base: await api.wait.waitQuerySelector('.feed-card'),
          multiple: true,
          repeat: true,
          timeout: 0,
          callback: async video => {
            // 这个 video 未必是最后加入到页面的视频卡片，有可能是作为 Vue 处理过程中的中转元素
            const vue = video.__vue__ // 此时理应有 Vue 对象，如果没有就说明它可能是中转元素
            // 但是，即使 video 真是中转元素，也有可能出现存在 __vue__ 的情况，实在没搞懂是什么原理
            // 总之，只要有 Vue 对象，一率进行处理就不会有问题！
            if (vue) {
              const aid = String(vue.aid)
              if (map.has(aid)) {
                vue.seeLaterStatus = 1
              }
            }
          },
        })
      }

      /**
       * 填充动态入口菜单稍后再看状态
       * @async
       */
      const fillWatchlaterStatus_dynamicMenu = async () => {
        api.wait.executeAfterElementLoaded({
          selector: '.list-item',
          base: await api.wait.waitQuerySelector('.video-list'),
          multiple: true,
          repeat: true,
          timeout: 0,
          callback: async video => {
            const vue = video.__vue__
            if (vue) {
              const aid = String(vue.aid)
              if (map.has(aid)) {
                vue.added = true
              }
            }
          },
        })
      }

      /**
       * 填充稍后再看状态（通用逻辑）
       */
      const fillWatchlaterStatus_main = () => {
        api.wait.executeAfterElementLoaded({
          selector: '.watch-later-video, .watch-later-trigger, .watch-later, .w-later',
          base: document.body,
          multiple: true,
          repeat: true,
          timeout: 0,
          callback: async video => {
            const vue = video.__vue__
            if (vue) {
              const aid = String(vue.aid)
              if (map.has(aid)) {
                vue.added = true
              }
            }
          },
        })
      }
    }

    /**
     * 正常模式播放页加入快速切换稍后再看状态的按钮
     * @async
     */
    async addVideoButton_Normal() {
      const _self = this
      let bus = {}

      const app = await api.wait.waitQuerySelector('#app')
      const atr = await api.wait.waitQuerySelector('#arc_toolbar_report', app)
      const original = await api.wait.waitQuerySelector('.van-watchlater', atr)
      api.wait.waitForConditionPassed({
        condition: () => app.__vue__,
      }).then(async () => {
        const btn = document.createElement('label')
        btn.id = `${gm.id}-normal-video-btn`
        const cb = btn.appendChild(document.createElement('input'))
        cb.type = 'checkbox'
        const text = btn.appendChild(document.createElement('span'))
        text.innerText = '稍后再看'
        btn.className = 'appeal-text'
        cb.onclick = function() { // 不要附加到 btn 上，否则点击时会执行两次
          processSwitch()
        }
        atr.appendChild(btn)

        const aid = await _self.method.getAid()
        bus = { ...bus, btn, cb, aid }
        initButtonStatus()
        original.parentNode.style.display = 'none'

        bus.pathname = location.pathname
        window.addEventListener('urlchange', async function() {
          if (location.pathname == bus.pathname) return // 并非切换视频（如切分 P）
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
          let reloaded = false
          gm.searchParams = new URL(location.href).searchParams
          const removed = await _self.processAutoRemove()
          if (gm.config.removeHistory && gm.config.removeHistorySavePoint == Enums.removeHistorySavePoint.anypage) {
            await _self.method.updateRemoveHistoryData(true)
            reloaded = true
          }
          const status = removed ? false : await _self.method.getVideoWatchlaterStatusByAid(bus.aid, !reloaded)
          btn.added = status
          cb.checked = status
        })
      })

      /**
       * 初始化按钮的稍后再看状态
       * @async
       */
      const initButtonStatus = async () => {
        const setStatus = async () => {
          const status = await _self.method.getVideoWatchlaterStatusByAid(bus.aid)
          bus.btn.added = status
          bus.cb.checked = status
        }
        const alwaysAutoRemove = gm.config.autoRemove == Enums.autoRemove.always
        const spRemove = gm.searchParams.get(`${gm.id}_remove`) == 'true'
        const spDisableRemove = gm.searchParams.get(`${gm.id}_disable_remove`) == 'true'
        if ((!alwaysAutoRemove && !spRemove) || spDisableRemove) {
          setStatus()
        }
        // 如果当前视频应当被移除，那就不必读取状态了
        // 注意，哪处代码先执行不确定，不过从理论上来说这里应该是会晚执行
        // 当然，自动移除的操作有可能会失败，但两处代码联动太麻烦了，还会涉及到切换其他视频的问题，综合考虑之下对这种小概率事件不作处理
      }

      /**
       * 处理视频状态的切换
       * @async
       */
      const processSwitch = async () => {
        const btn = bus.btn
        const cb = bus.cb
        const note = btn.added ? '从稍后再看移除' : '添加到稍后再看'
        const success = await _self.method.switchVideoWatchlaterStatus(bus.aid, !btn.added)
        if (success) {
          btn.added = !btn.added
          cb.checked = btn.added
          api.message.create(`${note}成功`)
        } else {
          cb.checked = btn.added
          api.message.create(`${note}失败${!btn.added ? '，可能是因为不支持当前稿件类型（如互动视频）' : ''}`)
        }
      }
    }

    /**
     * 稍后再看模式重定向至正常模式播放
     * @async
     */
    async redirect() {
      window.stop() // 停止原页面的加载
      // 这里不能用读取页面 Vue 或者 window.aid 的方式来直接获取目标 URL，那样太慢了，直接从 URL 反推才是最快的。
      try {
        let bvid = null
        if (api.web.urlMatch(/watchlater\/(B|b)(V|v)[0-9a-zA-Z]+(?=[/?#]|$)/)) {
          bvid = location.href.match(/(?<=\/watchlater\/)(B|b)(V|v)[0-9a-zA-Z]+/)[0]
        }
        if (!bvid) { // 如果为空就是以 watchlater/ 直接结尾，等同于稍后再看中的第一个视频
          const resp = await api.web.request({
            method: 'GET',
            url: gm.url.api_queryWatchlaterList,
          })
          const json = JSON.parse(resp.responseText)
          bvid = json.data.list[0].bvid
        }
        location.replace(`${gm.url.page_videoNormalMode}/${bvid}${location.search}${location.hash}`)
      } catch (e) {
        api.logger.error(e)
        alert(`【${GM_info.script.name}】\n\n重定向错误，可能是网络问题，如果重新加载页面依然出错请联系脚本作者：${GM_info.script.supportURL}`)
        const result = confirm(`【${GM_info.script.name}】\n\n是否临时关闭模式切换功能？`)
        if (result) {
          const url = new URL(location.href)
          url.searchParams.set(`${gmId}_disable_redirect`, 'true')
          location.replace(url.href)
        } else {
          location.replace(gm.url.page_watchlaterList)
        }
      }
    }

    /**
     * 稍后再看模式播放页加入快速切换稍后再看状态的按钮
     * @async
     */
    async addVideoButton_Watchlater() {
      return await this.addVideoButton_Normal() // 改进后与普通模式播放页一致
    }

    /**
     * 对稍后再看列表页面进行处理
     * @async
     */
    async processWatchlaterList() {
      let autoRemoveButton = null
      if (gm.config.autoRemove != Enums.autoRemove.absoluteNever) {
        autoRemoveButton = await api.wait.waitQuerySelector('#gm-auto-remove')
      }
      const watchLaterList = await api.wait.waitQuerySelector('.watch-later-list')
      api.wait.executeAfterElementLoaded({
        selector: '.list-box a:not([class=user])',
        base: watchLaterList,
        multiple: true,
        repeat: true,
        timeout: 0,
        callback: link => {
          processLink(link, autoRemoveButton)
        },
      })

      /**
       * 根据 `autoRemove` 处理链接
       * @param {HTMLAnchorElement} link 链接元素
       * @param {HTMLElement} [arb] 自动移除按钮，为 `null` 时表示彻底禁用自动移除功能
       */
      const processLink = (link, arb) => {
        link.target = gm.config.openListVideo == Enums.openListVideo.openInCurrent ? '_self' : '_blank'
        if (arb) {
          let base = link
          while (base.className.split(' ').indexOf('av-item') < 0) {
            base = base.parentNode
            if (!base) {
              return
            }
          }
          if (link.href && gm.regex.page_videoWatchlaterMode.test(link.href)) { // 视频被和谐或其他特殊情况
            link.addEventListener('mousedown', function(e) {
              if (e.button == 0 || e.button == 1) { // 左键或中键
                if (arb.autoRemove) {
                  if (gm.config.autoRemove != Enums.autoRemove.always) {
                    const url = new URL(link.href)
                    url.searchParams.set(`${gm.id}_remove`, 'true')
                    link.href = url.href
                  }
                } else {
                  if (gm.config.autoRemove == Enums.autoRemove.always) {
                    const url = new URL(link.href)
                    url.searchParams.set(`${gm.id}_disable_remove`, 'true')
                    link.href = url.href
                  }
                }
              }
            })
            // 不能 mousedown，隐藏之后无法触发事件
            link.addEventListener('mouseup', function(e) {
              if (e.button == 0 || e.button == 1) { // 左键或中键
                if (arb.autoRemove) {
                  base.style.display = 'none'
                }
              }
            })
          }
        }
      }
    }

    /**
     * 根据 URL 上的查询参数作进一步处理
     * @async
     */
    async processSearchParams() {
      const _self = this
      if (api.web.urlMatch(gm.regex.page_videoNormalMode)) {
        // 播放页面（正常模式）
        await _self.processAutoRemove()
      } else if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
        // 播放页面（稍后再看模式）
        // 推迟一段时间执行，否则稍后再看模式播放页会因为检测不到视频在稍后再看中而出错
        await _self.processAutoRemove(5000)
      }
    }

    /**
     * 根据用户配置或 URL 上的查询参数，将视频从稍后再看移除
     * @async
     * @param {number} [delay=0] 延迟执行（单位：ms）
     * @returns {Promise<boolean>} 执行后视频是否已经不在稍后再看中（可能是在本方法内被移除，也可能是本身就不在）
     */
    async processAutoRemove(delay = 0) {
      try {
        const alwaysAutoRemove = gm.config.autoRemove == Enums.autoRemove.always
        const spRemove = gm.searchParams.get(`${gm.id}_remove`) == 'true'
        const spDisableRemove = gm.searchParams.get(`${gm.id}_disable_remove`) == 'true'
        if ((alwaysAutoRemove || spRemove) && !spDisableRemove) {
          const _self = this
          const aid = await _self.method.getAid()
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          const success = await _self.method.switchVideoWatchlaterStatus(aid, false)
          if (!success) {
            api.message.create('从稍后再看移除失败')
          }
          return success
        }
      } catch (e) {
        api.logger.error(e)
      }
      return false
    }

    /**
     * 根据 `removeHistorySavePoint` 保存稍后再看历史数据
     */
    processWatchlaterListDataSaving() {
      const _self = this
      switch (gm.config.removeHistorySavePoint) {
        case Enums.removeHistorySavePoint.list:
          if (api.web.urlMatch(gm.regex.page_watchlaterList)) {
            _self.method.updateRemoveHistoryData()
          }
          break
        case Enums.removeHistorySavePoint.listAndMenu:
        default:
          if (api.web.urlMatch(gm.regex.page_watchlaterList)) {
            // 从入口打开，而设置为 listAndMenu，则数据必然刚刚刷新过
            if (gm.searchParams.get(`${gm.id}_from_header`) != 'true') {
              _self.method.updateRemoveHistoryData()
            }
          }
          break
        case Enums.removeHistorySavePoint.anypage:
          if (!api.web.urlMatch(gm.regex.page_dynamicMenu)) {
            // anypage 时弹出入口菜单不会引起数据刷新，不必检测 ${gm.id}_from_header
            _self.method.updateRemoveHistoryData()
          }
          break
      }
    }

    /**
     * 调整列表页面的 UI
     * @async
     */
    async adjustWatchlaterListUI() {
      /** @type {HTMLElement} */
      const r_con = await api.wait.waitQuerySelector('.watch-later-list.bili-wrapper header .r-con')
      // 页面上本来就存在的「全部播放」按钮不要触发重定向
      const setPlayAll = el => {
        el.href = gm.url.page_watchlaterPlayAll
        el.target = gm.config.openListVideo == Enums.openListVideo.openInCurrent ? '_self' : '_blank'
      }
      const playAll = r_con.children[0]
      if (api.dom.containsClass(playAll, 's-btn')) {
        // 理论上不会进来
        setPlayAll(playAll)
      } else {
        const ob = new MutationObserver((records, observer) => {
          setPlayAll(records[0].target)
          observer.disconnect()
        })
        ob.observe(playAll, { attributeFilter: ['href'] })
      }
      // 在列表页面加入「移除记录」
      if (gm.config.removeHistory) {
        const removeHistoryButton = r_con.appendChild(document.createElement('div'))
        removeHistoryButton.innerText = '移除记录'
        removeHistoryButton.className = 's-btn'
        removeHistoryButton.onclick = () => script.openRemoveHistory() // 要避免 MouseEvent 的传递
      }
      // 在列表页面加如「增强设置」
      const plusButton = r_con.appendChild(document.createElement('div'))
      plusButton.innerText = '增强设置'
      plusButton.className = 's-btn'
      plusButton.onclick = () => script.openUserSetting() // 要避免 MouseEvent 的传递
      // 移除「一键清空」按钮
      if (gm.config.removeButton_removeAll) {
        r_con.children[1].style.display = 'none'
      }
      // 移除「移除已观看视频」按钮
      if (gm.config.removeButton_removeWatched) {
        r_con.children[2].style.display = 'none'
      }

      // 增加临时切换自动移除功能的「自动移除」按钮
      if (gm.config.autoRemove != Enums.autoRemove.absoluteNever) {
        GM_addStyle(`
          .watch-later-list header .s-btn.gm-s-btn.gm-s-btn-enabled {
            background: #00a1d6;
            color: #fff;
          }
          .watch-later-list header .s-btn.gm-s-btn:not(.gm-s-btn-enabled):hover {
            background: #fff;
            color: #00a1d6;
          }
        `)
        const autoRemove = gm.config.autoRemove == Enums.autoRemove.always || gm.config.autoRemove == Enums.autoRemove.openFromList
        const autoRemoveButton = r_con.insertBefore(document.createElement('div'), r_con.children[0])
        autoRemoveButton.id = 'gm-auto-remove'
        autoRemoveButton.innerText = '自动移除'
        autoRemoveButton.title = '临时切换在当前页面打开视频后是否将其自动移除出「稍后再看」。若要默认开启/关闭自动移除功能，请在「设置」中配置。'
        autoRemoveButton.className = 's-btn gm-s-btn'
        autoRemoveButton.autoRemove = autoRemove
        if (autoRemove) {
          api.dom.addClass(autoRemoveButton, 'gm-s-btn-enabled')
        }
        autoRemoveButton.onclick = function() {
          if (this.autoRemove) {
            api.dom.removeClass(this, 'gm-s-btn-enabled')
          } else {
            api.dom.addClass(autoRemoveButton, 'gm-s-btn-enabled')
          }
          this.autoRemove = !this.autoRemove
        }
      }
    }

    /**
     * 隐藏「收藏」中的「稍后再看」
     */
    async hideWatchlaterInCollect() {
      api.wait.waitQuerySelector('.user-con .mini-favorite').then(fav => {
        const collect = fav.parentNode
        const process = function() {
          api.wait.waitQuerySelector('[role=tooltip] .tab-item [title=稍后再看]', document, true).then(node => {
            node.parentNode.style.display = 'none'
            collect.removeEventListener('mouseover', process) // 确保移除后再解绑
          }).catch(() => {}) // 有时候鼠标经过收藏也没弹出来，不知道什么原因，就不报错了
        }
        collect.addEventListener('mouseover', process)
      })
    }

    /**
     * 添加弹出菜单的滚动条样式
     */
    addMenuScrollbarStyle() {
      let menuScrollbarStyle = null
      switch (gm.config.menuScrollbarSetting) {
        case Enums.menuScrollbarSetting.beautify:
          // 目前在不借助 JavaScript 的情况下，无法完美实现类似于移动端滚动条浮动在内容上的效果。
          menuScrollbarStyle = `
            :root {
              --scrollbar-background-color: transparent;
              --scrollbar-thumb-color: #0000002b;
            }

            #${gm.id} .gm-entrypopup .gm-entry-list::-webkit-scrollbar,
            [role=tooltip] ::-webkit-scrollbar,
            #app>.out-container>.container::-webkit-scrollbar {
              width: 6px;
              height: 6px;
              background-color: var(--scrollbar-background-color);
            }

            #${gm.id} .gm-entrypopup .gm-entry-list::-webkit-scrollbar-thumb,
            [role=tooltip] ::-webkit-scrollbar-thumb,
            #app>.out-container>.container::-webkit-scrollbar-thumb {
              border-radius: 3px;
              background-color: var(--scrollbar-background-color);
            }

            #${gm.id} .gm-entrypopup .gm-entry-list:hover::-webkit-scrollbar-thumb,
            [role=tooltip] :hover::-webkit-scrollbar-thumb,
            #app>.out-container>.container:hover::-webkit-scrollbar-thumb {
              border-radius: 3px;
              background-color: var(--scrollbar-thumb-color);
            }

            #${gm.id} .gm-entrypopup .gm-entry-list::-webkit-scrollbar-corner,
            [role=tooltip] ::-webkit-scrollbar-corner,
            #app>.out-container>.container::-webkit-scrollbar-corner {
              background-color: var(--scrollbar-background-color);
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
        :root {
          --text-color: #0d0d0d;
          --text-bold-color: #3a3a3a;
          --light-text-color: white;
          --hint-text-color: gray;
          --light-hint-text-color: #909090;
          --hint-text-emphasis-color: #666666;
          --hint-text-hightlight-color: #555555;
          --background-color: white;
          --background-hightlight-color: #ebebeb;
          --update-hightlight-color: #c2ffc2;
          --update-hightlight-hover-color: #a90000;
          --border-color: black;
          --light-border-color: #e7e7e7;
          --shadow-color: #000000bf;
          --text-shadow-color: #00000080;
          --box-shadow-color: #00000033;
          --hightlight-color: #0075ff;
          --important-color: red;
          --warn-color: #e37100;
          --disabled-color: gray;
          --link-visited-color: #551a8b;
          --scrollbar-background-color: transparent;
          --scrollbar-thumb-color: #0000002b;
          --opacity-fade-transition: opacity ${gm.const.fadeTime}ms ease-in-out;
          --opacity-fade-popup-transition: opacity ${gm.const.fadeTime}ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }

        #${gm.id} {
          color: var(--text-color);
        }
        #${gm.id} * {
          box-sizing: content-box;
        }

        #${gm.id} .gm-entrypopup {
          font-size: 12px;
          line-height: normal;
          transition: var(--opacity-fade-popup-transition);
          opacity: 0;
          display: none;
          position: absolute;
          z-index: 15000;
          user-select: none;
          border-radius: 4px;
          width: 32em;
          border: none;
          box-shadow: var(--box-shadow-color) 0px 3px 6px;
          background-color: var(--background-color);
        }
        #${gm.id} .gm-entrypopup .gm-popup-arrow {
          position: absolute;
          z-index: -1;
          top: -14px;
          left: calc(16em - 7px);
          width: 0;
          height: 0;
          border-width: 8px;
          border-bottom-width: 8px;
          border-style: solid;
          border-color: transparent;
          border-bottom-color: var(--background-color);
        }

        #${gm.id} .gm-entrypopup .gm-popup-header {
          position: relative;
          height: 2.8em;
          border-bottom: 1px solid var(--light-border-color);
        }
        #${gm.id} .gm-entrypopup .gm-popup-search {
          font-size: 1.3em;
          line-height: 2.6em;
          padding-left: 0.9em;
        }
        #${gm.id} .gm-entrypopup .gm-popup-search input[type=text] {
          line-height: normal;
          outline: none;
          border: none;
          width: 18em;
          padding-right: 6px;
          color: var(--text-color);
        }
        #${gm.id} .gm-entrypopup .gm-popup-search input[type=text]::placeholder {
          font-size: 0.9em;
          color: var(--light-hint-text-color);
        }
        #${gm.id} .gm-entrypopup .gm-popup-search-clear {
          display: inline-block;
          color: var(--hint-text-color);
          cursor: pointer;
          visibility: hidden;
        }
        #${gm.id} .gm-entrypopup .gm-popup-total {
          position: absolute;
          line-height: 2.6em;
          right: 1.3em;
          top: 0;
          font-size: 1.2em;
          color: var(--hint-text-color);
        }

        #${gm.id} .gm-entrypopup .gm-entry-list {
          position: relative;
          height: 42em;
          overflow-y: auto;
          padding: 0.2em 0;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list.gm-entry-removed-list {
          border-top: 3px solid var(--light-border-color);
          display: none;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-empty {
          position: absolute;
          top: calc(50% - 2em);
          left: calc(50% - 7em);
          line-height: 4em;
          width: 14em;
          font-size: 1.4em;
          text-align: center;
          color: var(--hint-text-color);
        }

        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item {
          display: flex;
          flex-shrink: 0;
          height: 4.4em;
          padding: 0.5em 1em;
          color: var(--text-color);
          font-size: 1.15em;
          cursor: pointer;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-invalid {
          cursor: not-allowed;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-invalid,
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed {
          filter: grayscale(1);
          color: var(--hint-text-color);
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-left {
          position: relative;
          flex-shrink: 0;
          cursor: default;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-cover {
          width: 7.82em;
          height: 4.40em;
          border-radius: 2px;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-switcher {
          position: absolute;
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAYAAACohjseAAAACXBIWXMAAAsSAAALEgHS3X78AAAA/ElEQVRoge3bsQ3CMBSE4bOBAmZIzSLUrMECjMACtLBGKgq2yQ4uHzJKgaIghHHAZ+6rQfKvnCIRBWdmiJxzWwAbAEtwCwCuZtbeuwCsAOwBNORhQ52ZHXx/1WqLi5q4yngFjxXM8pngK46Llr6AQ0xKgewUyE6B7BTIbj7F+c1sl/I959w591k0UXbx18Tp3YbUCX4qZcKaKLukiY55nO3YlIazfvWZXHdUTZSdAtkpkJ0C2SmQnQLZKZCdAtkpkN3PHvx+68mcJsou21O1Ummi7BTIToHsFMjuLwJDAeeYSpgBWABY19mHi+/fTu8KOExu8aX0tu6/FQC4AVY1Ql6j10UHAAAAAElFTkSuQmCC);
          background-size: contain;
          width: 34px;
          height: 34px;
          top: calc(2.2em - 17px);
          left: calc(3.9em - 17px);
          z-index: 1;
          display: none;
          cursor: pointer;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed .gm-card-switcher {
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAwFBMVEUAAAAGBgavr69EREQUFBQ1NTUODg7t7e3FxcV0dHRbW1sAAAAAAAAAAAD+/v77+/v4+Pj09PTj4+P8/PzV1dWpqamSkpIhISH19fXX19fLy8ulpaWdnZ1kZGRVVVUsLCz6+vrm5uba2tq9vb20tLSsrKyXl5eMjIx+fn54eHhsbGxpaWk+Pj4AAAAAAADv7+/e3t7AwMC3t7ehoaFLS0vo6OjR0dHOzs7CwsKCgoKCgoJiYmLp6enMzMywsLD////DVMIGAAAAP3RSTlOZmtOrnqec8927sopkEf38+ffu/eXPxqH45+DOyrWwpPvv6NnV0cjEv724t6qPAPTr2tbNru/j4tvAv7Tw4dTgAD9iAAABpElEQVRIx+ST13KCUBiEDyCCBRBQsaHGHrvp/Xv/twpDTBgRonjr3u0w38zu8h+xNsolkVGlsrEWxkpcoJUhyuISBVjpIi7Arli9bmE6mb0rUhZI6tZu2KuxK+TO5RYOB2pM8udgShWASlOXa8MnDYDN7DRX6AOVkf/bTemEqe9OdW0DluwdNH7VgKZ3knNUEVN+CGz/K3oLtJJGrJugp3MPFrSSy7wBnVRwAE7aTxuDq6YNCpaaehRN2KV8eoRaNMh8GesBKIlgEewoaAtTPoytw0gIXz4KJYMcORfQ5n/Wy4kuaMKHzzioQTFyhNJ7P27ZMNuSDb4Noxingi3FQSpTab8bWx0+YOMdV6yKIxAGSuCkZ6Dv9sEsJlzNSxKIex/ejgUkXkEdxokgLMJn4gBUpcygyH+BHYyVMWo4w/eMwXFIfOCgAVKiAxMQTgCYAH+S44MkOXRAOJGbYyRyHXU24rIVWgjqCNgbkZWRRYA+JrfoYKaksKK8eKS8QCZcBVBe6VBezRGuWGlalSMaD2KQxsMooCMgu6FLdtOa7MY82d0HAP3jZ1lFdjimAAAAAElFTkSuQmCC);
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:hover .gm-card-switcher {
          display: unset;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-duration {
          position: absolute;
          bottom: 0;
          right: 0;
          background: var(--text-shadow-color);
          color: var(--light-text-color);
          border-radius: 2px;
          padding: 2px 3px;
          font-size: 0.8em;
          z-index: 1;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-right {
          position: relative;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          justify-content: space-between;
          margin-left: 0.8em;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-title {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-all;
          text-align: justify;
          width: 16.8em;
          height: 2.8em;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed .gm-card-title {
          text-decoration: line-through;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-uploader {
          font-size: 0.8em;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          width: fit-content;
          max-width: 21em;
          color: var(--hint-text-color);
          cursor: pointer;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-uploader:hover {
          text-decoration: underline;
          font-weight: bold;
          color: var(--text-bold-color);
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-progress {
          position: absolute;
          bottom: 0;
          right: 0;
          font-size: 0.8em;
          color: var(--hint-text-color);
          display: none;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:hover .gm-card-progress {
          color: var(--hightlight-color);
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-progress::before {
          content: "▶";
          padding-right: 1px;
        }

        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item {
          display: block;
          color: var(--text-color);
          font-size: 1.2em;
          padding: 0.5em 1em;
          cursor: pointer;
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item:not(:last-child) {
          border-bottom: 1px solid var(--light-border-color);
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item.gm-invalid,
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item.gm-invalid:hover {
          cursor: not-allowed;
          color: var(--hint-text-color);
        }
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item.gm-removed {
          text-decoration: line-through;
          color: var(--hint-text-color);
        }

        #${gm.id} .gm-entrypopup .gm-entry-list .gm-search-hide {
          display: none;
        }

        #${gm.id} .gm-entrypopup .gm-entry-bottom {
          display: flex;
          border-top: 1px solid var(--light-border-color);
          height: 3em;
        }
        #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button {
          flex: 1;
          text-align: center;
          padding: 0.6em 0;
          font-size: 1.2em;
          cursor: pointer;
          color: var(--text-color);
        }
        #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button:not([enabled]) {
          display: none;
        }

        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:hover,
        #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item:hover,
        #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button:hover {
          color: var(--hightlight-color);
          background-color: var(--background-hightlight-color);
        }

        #${gm.id} .gm-setting {
          font-size: 12px;
          line-height: normal;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          position: fixed;
          z-index: 15000;
          user-select: none;
        }

        #${gm.id} .gm-setting #gm-setting-page {
          background-color: var(--background-color);
          border-radius: 10px;
          z-index: 65535;
          min-width: 53em;
          padding: 1em 1.4em;
          transition: top 100ms, left 100ms;
        }

        #${gm.id} .gm-setting #gm-maintitle * {
          cursor: pointer;
          color: var(--text-color);
        }
        #${gm.id} .gm-setting #gm-maintitle:hover * {
          color: var(--hightlight-color);
        }

        #${gm.id} .gm-setting .gm-items {
          margin: 0 0.2em;
          padding: 0 1.8em 0 2.2em;
          font-size: 1.2em;
          max-height: 66vh;
          overflow-y: auto;
        }

        #${gm.id} .gm-setting table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        #${gm.id} .gm-setting td {
          position: relative;
        }
        #${gm.id} .gm-setting .gm-item td:first-child {
          vertical-align: top;
          padding-right: 0.6em;
          font-weight: bold;
          color: var(--text-bold-color);
        }
        #${gm.id} .gm-setting .gm-item:not(:first-child) td {
          padding-top: 0.5em;
        }
        #${gm.id} .gm-setting td > * {
          padding: 0.2em;
          border-radius: 0.2em;
        }

        #${gm.id} .gm-setting .gm-item:hover {
          color: var(--hightlight-color);
        }

        #${gm.id} .gm-setting .gm-subitem[disabled] {
          color: var(--disabled-color);
        }
        #${gm.id} .gm-setting .gm-subitem:hover:not([disabled]) {
          color: var(--hightlight-color);
        }

        #${gm.id} .gm-setting .gm-subitem .gm-lineitems[disabled] {
          color: var(--disabled-color);
        }
        #${gm.id} .gm-setting .gm-subitem .gm-lineitems {
          color: var(--text-color);
        }
        #${gm.id} .gm-setting .gm-subitem .gm-lineitem {
          display: inline-block;
          padding-right: 8px;
        }
        #${gm.id} .gm-setting .gm-subitem .gm-lineitem:hover {
          color: var(--hightlight-color);
        }
        #${gm.id} .gm-setting .gm-subitem .gm-lineitems[disabled] .gm-lineitem {
          color: var(--disabled-color);
        }
        #${gm.id} .gm-setting .gm-subitem .gm-lineitem input[type=checkbox] {
          margin-left: 2px;
          vertical-align: -1px;
        }

        #${gm.id} .gm-setting .gm-hint-option {
          font-size: 0.8em;
          color: var(--hint-text-color);
          text-decoration: underline;
          padding: 0 0.2em;
          cursor: pointer;
        }
        #${gm.id} .gm-setting .gm-hint-option:hover {
          color: var(--important-color);
        }
        #${gm.id} .gm-setting [disabled] .gm-hint-option {
          color: var(--disabled-color);
          cursor: not-allowed;
        }

        #${gm.id} .gm-setting label {
          display: flex;
          align-items: center;
        }
        #${gm.id} .gm-setting input[type=checkbox] {
          margin-left: auto;
        }
        #${gm.id} .gm-setting input[type=text] {
          float: right;
          border-width: 0 0 1px 0;
          width: 3.4em;
          text-align: right;
          padding: 0 0.2em;
          margin: 0 -0.2em;
        }
        #${gm.id} .gm-setting select {
          border-width: 0 0 1px 0;
          cursor: pointer;
          margin: 0 -0.2em;
        }

        #${gm.id} .gm-setting .gm-information {
          margin: 0 0.2em;
          cursor: pointer;
        }
        #${gm.id} .gm-setting [disabled] .gm-information {
          cursor: not-allowed;
        }

        #${gm.id} .gm-setting .gm-warning {
          position: absolute;
          color: var(--warn-color);
          font-size: 1.4em;
          line-height: 1em;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          cursor: pointer;
        }
        #${gm.id} .gm-setting .gm-warning.gm-trailing {
          margin-left: 0.5em;
        }
        #${gm.id} .gm-setting .gm-warning:not(.gm-trailing) {
          right: -1.1em;
        }

        #${gm.id} .gm-setting.gm-hideDisabledSubitems #gm-setting-page:not([setting-type]) [disabled] {
          display: none;
        }

        #${gm.id} .gm-history {
          font-size: 12px;
          line-height: normal;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          position: fixed;
          z-index: 15000;
          user-select: none;
        }

        #${gm.id} .gm-history .gm-history-page {
          background-color: var(--background-color);
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
          color: var(--hint-text-color);
          text-indent: 2em;
        }
        #${gm.id} .gm-history .gm-comment span,
        #${gm.id} .gm-history .gm-comment input {
          padding: 0 0.2em;
          font-weight: bold;
          color: var(--hint-text-emphasis-color);
        }
        #${gm.id} .gm-history .gm-comment input{
          text-align: center;
          width: 3.5em;
          border-width: 0 0 1px 0;
        }

        #${gm.id} .gm-history .gm-content {
          margin: 0.6em 0.2em 2em 0.2em;
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
        #${gm.id} .gm-history .gm-content > * {
          position: relative;
          margin: 1.6em 2em;
        }
        #${gm.id} .gm-history .gm-content a {
          color: var(--text-color);
        }
        #${gm.id} .gm-history .gm-content a:hover {
          font-weight: bold;
          color: var(--hightlight-color);
        }
        #${gm.id} .gm-history .gm-content input[type=checkbox] {
          position: absolute;
          right: -2em;
          height: 1.5em;
          width: 1em;
        }
        #${gm.id} .gm-history .gm-content .gm-history-date {
          font-size: 0.5em;
          color: var(--hint-text-color);
        }

        #${gm.id} .gm-bottom {
          margin: 1.4em 2em 1em 2em;
          text-align: center;
        }

        #${gm.id} .gm-bottom button {
          font-size: 1em;
          padding: 0.3em 1em;
          margin: 0 0.8em;
          cursor: pointer;
          background-color: var(--background-color);
          border: 1px solid var(--border-color);
          border-radius: 2px;
        }
        #${gm.id} .gm-bottom button:hover {
          background-color: var(--background-hightlight-color);
        }
        #${gm.id} .gm-bottom button[disabled] {
          cursor: not-allowed;
          border-color: var(--disabled-color);
          background-color: var(--background-color);
        }

        #${gm.id} #gm-reset {
          position: absolute;
          right: 0;
          bottom: 0;
          margin: 1em 1.6em;
          color: var(--hint-text-color);
          cursor: pointer;
        }

        #${gm.id} #gm-changelog {
          position: absolute;
          right: 0;
          bottom: 1.8em;
          margin: 1em 1.6em;
          color: var(--hint-text-color);
          cursor: pointer;
        }
        #${gm.id} [setting-type=updated] #gm-changelog {
          font-weight: bold;
          color: var(--important-color);
        }
        #${gm.id} [setting-type=updated] #gm-changelog:hover {
          color: var(--important-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated,
        #${gm.id} [setting-type=updated] .gm-updated input,
        #${gm.id} [setting-type=updated] .gm-updated select {
          background-color: var(--update-hightlight-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated option {
          background-color: var(--background-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated:hover {
          color: var(--update-hightlight-hover-color);
        }
        #${gm.id} [setting-type=updated] .gm-updated .gm-lineitem:hover {
          color: var(--update-hightlight-hover-color);
        }

        #${gm.id} #gm-reset:hover,
        #${gm.id} #gm-changelog:hover {
          color: var(--hint-text-hightlight-color);
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
          background-color: var(--shadow-color);
          position: fixed;
          top: 0%;
          left: 0%;
          z-index: 15000;
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
        #${gm.id} select,
        #${gm.id} button {
          font-size: 100%;
          color: var(--text-color);
          outline: none;
          border: 1px solid var(--border-color); /* 在某些页面被覆盖 */
          border-radius: 0;
          appearance: auto; /* 番剧播放页该项被覆盖 */
        }

        #${gm.id} a {
        color: var(--hightlight-color)
        }
        #${gm.id} a:visited {
        color: var(--link-visited-color)
        }

        #${gm.id} [disabled],
        #${gm.id} [disabled] input,
        #${gm.id} [disabled] select {
          cursor: not-allowed;
          color: var(--disabled-color);
        }

        #${gm.id}-normal-video-btn {
          cursor: pointer;
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
          cursor: pointer;
          appearance: auto;
        }

        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar,
        #${gm.id} .gm-history .gm-content::-webkit-scrollbar {
          width: 6px;
          height: 6px;
          background-color: var(--scrollbar-background-color);
        }
        #${gm.id} .gm-history .gm-content::-webkit-scrollbar-thumb {
          border-radius: 3px;
          background-color: var(--scrollbar-background-color);
        }
        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-thumb,
        #${gm.id} .gm-history .gm-content:hover::-webkit-scrollbar-thumb {
          border-radius: 3px;
          background-color: var(--scrollbar-thumb-color);
        }
        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-corner,
        #${gm.id} .gm-history .gm-content::-webkit-scrollbar-corner {
          background-color: var(--scrollbar-background-color);
        }
      `)
    }
  }

  /**
   * 推入队列，循环数组实现
   * @template T 数据类型
   */
  class PushQueue {
    /**
     * @param {number} maxSize 队列的最大长度，达到此长度后继续推入数据，将舍弃末尾处的数据
     * @param {number} [capacity=maxSize] 容量，即循环数组的长度，不能小于 maxSize
     */
    constructor(maxSize, capacity) {
      /** 起始元素位置（指向起始元素后方） */
      this.index = 0
      /** 队列长度 */
      this.size = 0
      /** 最大长度 */
      this.maxSize = maxSize
      if (!capacity || capacity < maxSize) {
        capacity = maxSize
      }
      /** 容量 */
      this.capacity = capacity
      /** 内部数据 */
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
        // no need to gc() here
      }
      const data = this.toArray().reverse()
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
     * @param {T} value 推入队列的数据
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
     * @returns {T} 弹出的数据
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
     * 获取第 `n` 个元素（范围 `[0, size - 1]`）
     * @param {number} n 元素位置
     * @returns {T} 第 `n` 个元素
     */
    get(n) {
      if (this.size > 0 && n >= 0) {
        let index = this.index - n - 1
        if (index < 0) {
          index += this.capacity
        }
        return this.data[index]
      }
    }

    /**
     * 设置第 `n` 个元素的值为 `value`（范围 `[0, size - 1]`，且第 `n` 个元素必须已存在）
     * @param {number} n 元素位置
     * @param {T} value 要设置的值
     * @returns {boolean} 是否设置成功
     */
    set(n, value) {
      if (n <= this.size - 1 && n >= 0) {
        let index = this.index - n - 1
        if (index < 0) {
          index += this.capacity
        }
        this.data[index] = value
        return true
      } else {
        return false
      }
    }

    /**
     * 使用数组初始化推入队列
     * @param {Array<T>} array 初始化数组
     */
    fromArray(array) {
      if (this.maxSize < array.length) {
        this.data = array.slice(0, this.maxSize).reverse()
      } else {
        this.data = array.reverse()
      }
      this.index = this.data.length
      if (this.index >= this.capacity) {
        this.index = 0
      }
      this.size = this.data.length
      this.data.length = this.capacity
    }

    /**
     * 将推入队列以数组的形式返回
     * @param {number} [maxLength=size] 读取的最大长度
     * @returns {Array<T>} 队列数据的数组形式
     */
    toArray(maxLength) {
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

  (function() {
    if (GM_info.scriptHandler != 'Tampermonkey') {
      api.dom.initUrlchangeEvent()
    }
    script = new Script()
    webpage = new Webpage()
    if (!webpage.method.isLogin()) {
      api.logger.info('终止执行：脚本只能工作在B站登录状态下。')
      return
    }

    script.initAtDocumentStart()
    if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      const disableRedirect = gm.searchParams.get(`${gm.id}_disable_redirect`) == 'true'
      if (gm.config.redirect && !disableRedirect) { // 重定向，document-start 就执行，尽可能快地将原页面掩盖过去
        webpage.redirect()
        return // 必须 return，否则后面的内容还会执行使得加载速度超级慢
      }
    }

    webpage.method.cleanSearchParams()
    // 脚本的其他部分推迟至 DOMContentLoaded 执行
    document.addEventListener('DOMContentLoaded', function() {
      script.init()
      script.addScriptMenu()

      if (gm.config.fillWatchlaterStatus != Enums.fillWatchlaterStatus.never) {
        webpage.fillWatchlaterStatus()
      }
      // 非特殊页面
      if (!api.web.urlMatch(gm.regex.page_dynamicMenu)) {
        if (gm.config.headerButton) {
          webpage.addHeaderButton()
        }
        if (gm.config.removeHistory) {
          webpage.processWatchlaterListDataSaving()
        }
        if (gm.config.hideWatchlaterInCollect) {
          webpage.hideWatchlaterInCollect()
        }
      }

      if (api.web.urlMatch(gm.regex.page_watchlaterList)) {
        // 列表页面
        webpage.adjustWatchlaterListUI()
        webpage.processWatchlaterList()
      } else if (api.web.urlMatch(gm.regex.page_videoNormalMode)) {
        // 播放页面（正常模式）
        if (gm.config.videoButton) {
          webpage.addVideoButton_Normal()
        }
      } else if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
        // 播放页面（稍后再看模式）
        if (gm.config.videoButton) {
          webpage.addVideoButton_Watchlater()
        }
      } else if (api.web.urlMatch(gm.regex.page_dynamicMenu)) {
        // 动态入口弹出菜单页面的处理
        webpage.addMenuScrollbarStyle()
        return
      }
      webpage.processSearchParams()
      webpage.addStyle()
    })
  })()
})()
