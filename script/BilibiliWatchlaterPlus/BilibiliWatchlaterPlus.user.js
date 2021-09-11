// ==UserScript==
// @name            B站稍后再看功能增强
// @version         4.21.3.20210911
// @namespace       laster2800
// @author          Laster2800
// @description     与稍后再看功能相关，一切你能想到和想不到的功能
// @icon            https://www.bilibili.com/favicon.ico
// @homepageURL     https://greasyfork.org/zh-CN/scripts/395456
// @supportURL      https://greasyfork.org/zh-CN/scripts/395456/feedback
// @license         LGPL-3.0
// @include         *://www.bilibili.com/*
// @include         *://t.bilibili.com/*
// @include         *://message.bilibili.com/*
// @include         *://search.bilibili.com/*
// @include         *://space.bilibili.com/*
// @include         *://account.bilibili.com/*
// @exclude         *://message.bilibili.com/*/*
// @exclude         *://t.bilibili.com/h5/*
// @exclude         *://www.bilibili.com/page-proxy/*
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=969309
// @require         https://greasyfork.org/scripts/431998-userscriptapidom/code/UserscriptAPIDom.js?version=969308
// @require         https://greasyfork.org/scripts/432000-userscriptapimessage/code/UserscriptAPIMessage.js?version=969307
// @require         https://greasyfork.org/scripts/432002-userscriptapiwait/code/UserscriptAPIWait.js?version=969564
// @require         https://greasyfork.org/scripts/432003-userscriptapiweb/code/UserscriptAPIWeb.js?version=969305
// @grant           GM_registerMenuCommand
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           unsafeWindow
// @grant           window.onurlchange
// @connect         api.bilibili.com
// @connect         api.vc.bilibili.com
// @run-at          document-start
// @compatible      edge 版本不小于 85
// @compatible      chrome 版本不小于 85
// @compatible      firefox 版本不小于 90
// ==/UserScript==

(function() {
  'use strict'

  if (GM_info.scriptHandler != 'Tampermonkey') {
    const script = GM_info.script
    script.author ??= 'Laster2800'
    script.homepage ??= 'https://greasyfork.org/zh-CN/scripts/395456'
    script.supportURL ??= 'https://greasyfork.org/zh-CN/scripts/395456/feedback'
  }

  const sortType = {
    default: 'serial',
    defaultR: 'serial:R',
    duration: 'duration',
    durationR: 'duration:R',
    progress: 'progress',
    uploader: 'uploader',
    title: 'vTitle',
    fixed: 'fixed',
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
      openBatchAddManager: 'openBatchAddManager',
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
    sortType: sortType,
    /**
     * @readonly
     * @enum {string}
     */
    autoSort: {
      auto: 'auto',
      ...sortType,
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
    mainRunAt: {
      DOMContentLoaded: 'DOMContentLoaded',
      load: 'load',
    }
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
   * @property {GMObject_infoMap} infoMap 信息属性
   * @property {GMObject_runtime} runtime 运行时变量
   * @property {string[]} configDocumentStart document-start 时期配置
   * @property {GMObject_data} data 脚本数据
   * @property {GMObject_url} url URL
   * @property {GMObject_regex} regex 正则表达式
   * @property {{[c: string]: *}} const 常量
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
   * @property {boolean} headerMenuKeepRemoved 弹出菜单保留被移除视频
   * @property {boolean} headerMenuSearch 弹出菜单搜索框
   * @property {boolean} headerMenuSortControl 弹出菜单排序控制器
   * @property {boolean} headerMenuAutoRemoveControl 弹出菜单自动移除控制器
   * @property {boolean} headerMenuFnSetting 弹出菜单：设置
   * @property {boolean} headerMenuFnHistory 弹出菜单：历史
   * @property {boolean} headerMenuFnRemoveAll 弹出菜单：清空
   * @property {boolean} headerMenuFnRemoveWatched 弹出菜单：移除已看
   * @property {boolean} headerMenuFnShowAll 弹出菜单：显示
   * @property {boolean} headerMenuFnPlayAll 弹出菜单：播放
   * @property {boolean} headerCompatible 兼容第三方顶栏
   * @property {boolean} removeHistory 稍后再看移除记录
   * @property {removeHistorySavePoint} removeHistorySavePoint 保存稍后再看历史数据的时间点
   * @property {number} removeHistorySavePeriod 数据保存最小时间间隔
   * @property {number} removeHistoryFuzzyCompare 模糊比对深度
   * @property {number} removeHistorySaves 稍后再看历史数据记录保存数
   * @property {boolean} removeHistoryTimestamp 使用时间戳优化移除记录
   * @property {number} removeHistorySearchTimes 历史回溯深度
   * @property {fillWatchlaterStatus} fillWatchlaterStatus 填充稍后再看状态
   * @property {autoSort} autoSort 自动排序
   * @property {boolean} videoButton 视频播放页稍后再看状态快速切换
   * @property {autoRemove} autoRemove 自动将视频从播放列表移除
   * @property {boolean} redirect 稍后再看模式重定向至常规模式播放
   * @property {boolean} dynamicBatchAddManagerButton 动态主页批量添加管理器按钮
   * @property {boolean} listBatchAddManagerButton 列表页面批量添加管理器按钮
   * @property {boolean} listSearch 列表页面搜索框
   * @property {boolean} listSortControl 列表页面排序控制器
   * @property {boolean} listAutoRemoveControl 列表页面自动移除控制器
   * @property {openListVideo} openListVideo 列表页面视频点击行为
   * @property {boolean} removeButton_removeAll 移除「一键清空」按钮
   * @property {boolean} removeButton_removeWatched 移除「移除已观看视频」按钮
   * @property {menuScrollbarSetting} menuScrollbarSetting 弹出菜单的滚动条设置
   * @property {boolean} hideWatchlaterInCollect 隐藏「收藏」中的「稍后再看」
   * @property {mainRunAt} mainRunAt 主要逻辑运行时期
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
   * @property {'checked' | 'value'} attr 对应 `DOM` 元素上的属性
   * @property {boolean} [manual] 配置保存时是否需要手动处理
   * @property {boolean} [needNotReload] 配置改变后是否不需要重新加载就能生效
   * @property {number} [min] 最小值
   * @property {number} [max] 最大值
   * @property {number} [configVersion] 涉及配置更改的最后配置版本
   */
  /**
   * @typedef {{[info: string]: GMObject_infoMap_item}} GMObject_infoMap
   */
  /**
   * @typedef GMObject_infoMap_item
   * @property {number} [configVersion] 涉及信息更改的最后配置版本
   */
  /**
   * @typedef GMObject_runtime
   * @property {boolean} reloadWatchlaterListData 刷新稍后再看列表数据
   * @property {boolean} loadingWatchlaterListData 正在加载稍后再看列表数据
   * @property {boolean} savingRemoveHistoryData 正在存储稍后再看历史数据
   */
  /**
   * @callback removeHistoryData 通过懒加载方式获取稍后再看历史数据
   * @param {boolean} [remove] 是否将稍后再看历史数据移除
   * @returns {PushQueue<GMObject_data_item>} 稍后再看历史数据
   */
  /**
   * @callback watchlaterListData 通过懒加载方式获取稍后再看列表数据
   * @param {boolean} [reload] 是否重新加载稍后再看列表数据
   * @param {boolean} [pageCache=false] 是否使用页面缓存
   * @param {boolean} [localCache=true] 是否使用本地缓存
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
   * @property {Object} [owner] UP主信息
   * @property {number} [owner.mid] UP主 ID
   * @property {string} [owner.name] UP主名字
   * @property {number} [progress] 视频播放进度
   * @property {number} [duration] 视频时长
   * @property {number} [videos] 稿件分P数
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
   * @callback fixedItem 访问固定列表项
   * @param {string} id 项目标识
   * @param {boolean} [op] 不设置 - 只读；`true` - 添加；`false` - 移除
   * @returns {boolean} 访问后项目是否在固定列表项中
   */
  /**
   * @typedef GMObject_data
   * @property {removeHistoryData} removeHistoryData 稍后再看历史数据
   * @property {watchlaterListData} watchlaterListData 当前稍后再看列表数据
   * @property {fixedItem} fixedItem 固定列表项
   */
  /**
   * @callback page_userSpace
   * @param {number} [uid] `uid`
   * @returns {string} 用户空间 URL
   */
  /**
   * @typedef GMObject_url
   * @property {string} api_queryWatchlaterList 稍后再看列表数据
   * @property {string} api_addToWatchlater 将视频添加至稍后再看
   * @property {string} api_removeFromWatchlater 将视频从稍后再看移除
   * @property {string} api_clearWatchlater 清空稍后再看，要求 POST 一个含 `csrf` 的表单
   * @property {string} api_listFav 列出所有收藏夹
   * @property {string} api_dealFav 将视频添加/移除至收藏夹
   * @property {string} api_dynamicNew 动态列表（首次）
   * @property {string} api_dynamicHistory 动态列表（后续）
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
   * @typedef GMObject_menu
   * @property {GMObject_menu_item} setting 设置
   * @property {GMObject_menu_item} history 移除记录
   * @property {GMObject_menu_item} batchAddManager 批量添加管理器
   * @property {GMObject_menu_item} entryPopup 入口弹出菜单
   */
  /**
   * @typedef GMObject_menu_item
   * @property {0 | 1 | 2 | 3 | -1} state 打开状态（关闭 | 开启中 | 打开 | 关闭中 | 错误）
   * @property {0 | 1 | 2} wait 等待阻塞状态（无等待阻塞 | 等待开启 | 等待关闭）
   * @property {HTMLElement} el 菜单元素
   * @property {() => (void | Promise<void>)} [openHandler] 打开菜单的回调函数
   * @property {() => void} [closeHandler] 关闭菜单的回调函数
   * @property {() => (void | Promise<void>)} [openedHandler] 彻底打开菜单后的回调函数
   * @property {() => void} [closedHandler] 彻底关闭菜单后的回调函数
   */
  /**
   * 全局对象
   * @type {GMObject}
   */
  const gm = {
    id: gmId,
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210911,
    searchParams: new URL(location.href).searchParams,
    config: {},
    configMap: {
      headerButton: { default: true, attr: 'checked' },
      headerButtonOpL: { default: Enums.headerButtonOp.openListInCurrent, attr: 'value', configVersion: 20210902.1 },
      headerButtonOpR: { default: Enums.headerButtonOp.openUserSetting, attr: 'value', configVersion: 20210902.1 },
      headerButtonOpM: { default: Enums.headerButtonOp.openListInNew, attr: 'value', configVersion: 20210902.1 },
      headerMenu: { default: Enums.headerMenu.enable, attr: 'value', configVersion: 20210706 },
      openHeaderMenuLink: { default: Enums.openHeaderMenuLink.openInCurrent, attr: 'value', configVersion: 20200717 },
      headerMenuKeepRemoved: { default: true, attr: 'checked', needNotReload: true, configVersion: 20210724 },
      headerMenuSearch: { default: true, attr: 'checked', configVersion: 20210323.1 },
      headerMenuSortControl: { default: true, attr: 'checked', configVersion: 20210810 },
      headerMenuAutoRemoveControl: { default: true, attr: 'checked', configVersion: 20210723 },
      headerMenuFnSetting: { default: true, attr: 'checked', configVersion: 20210322 },
      headerMenuFnHistory: { default: true, attr: 'checked', configVersion: 20210322 },
      headerMenuFnRemoveAll: { default: false, attr: 'checked', configVersion: 20210322 },
      headerMenuFnRemoveWatched: { default: false, attr: 'checked', configVersion: 20210723 },
      headerMenuFnShowAll: { default: false, attr: 'checked', configVersion: 20210322 },
      headerMenuFnPlayAll: { default: true, attr: 'checked', configVersion: 20210322 },
      headerCompatible: { default: Enums.headerCompatible.none, attr: 'value', configVersion: 20210721 },
      removeHistory: { default: true, attr: 'checked', manual: true, configVersion: 20210911 },
      removeHistorySavePoint: { default: Enums.removeHistorySavePoint.listAndMenu, attr: 'value', configVersion: 20210628 },
      removeHistorySavePeriod: { default: 60, type: 'int', attr: 'value', max: 600, needNotReload: true, configVersion: 20210908 },
      removeHistoryFuzzyCompare: { default: 1, type: 'int', attr: 'value', max: 5, needNotReload: true, configVersion: 20210722 },
      removeHistorySaves: { default: 100, type: 'int', attr: 'value', manual: true, needNotReload: true, min: 10, max: 500, configVersion: 20210808 },
      removeHistoryTimestamp: { default: true, attr: 'checked', needNotReload: true, configVersion: 20210703 },
      removeHistorySearchTimes: { default: 100, type: 'int', attr: 'value', manual: true, needNotReload: true, min: 1, max: 500, configVersion: 20210819 },
      fillWatchlaterStatus: { default: Enums.fillWatchlaterStatus.dynamic, attr: 'value', configVersion: 20200819 },
      autoSort: { default: Enums.autoSort.default, attr: 'value', configVersion: 20210819 },
      videoButton: { default: true, attr: 'checked' },
      autoRemove: { default: Enums.autoRemove.openFromList, attr: 'value', configVersion: 20210612 },
      redirect: { default: false, attr: 'checked', configVersion: 20210322.1 },
      dynamicBatchAddManagerButton: { default: true, attr: 'checked', configVersion: 20210902 },
      listBatchAddManagerButton: { default: true, attr: 'checked', configVersion: 20210908 },
      listSearch: { default: true, attr: 'checked', configVersion: 20210810.1 },
      listSortControl: { default: true, attr: 'checked', configVersion: 20210810 },
      listAutoRemoveControl: { default: true, attr: 'checked', configVersion: 20210908 },
      openListVideo: { default: Enums.openListVideo.openInCurrent, attr: 'value', configVersion: 20200717 },
      removeButton_removeAll: { default: false, attr: 'checked', configVersion: 20200722 },
      removeButton_removeWatched: { default: false, attr: 'checked', configVersion: 20200722 },
      menuScrollbarSetting: { default: Enums.menuScrollbarSetting.beautify, attr: 'value', configVersion: 20210808.1 },
      hideWatchlaterInCollect: { default: false, attr: 'checked', configVersion: 20210808.1 },
      mainRunAt: { default: Enums.mainRunAt.DOMContentLoaded, attr: 'value', needNotReload: true, configVersion: 20210726 },
      watchlaterListCacheValidPeriod: { default: 15, type: 'int', attr: 'value', needNotReload: true, min: 8, max: 600, configVersion: 20210908 },
      hideDisabledSubitems: { default: true, attr: 'checked', configVersion: 20210505 },
      reloadAfterSetting: { default: true, attr: 'checked', needNotReload: true, configVersion: 20200715 },
    },
    infoMap: {
      clearRemoveHistoryData: {},
      watchlaterMediaList: { configVersion: 20210822 },
      fixHeader: { configVersion: 20210810.1 },
    },
    runtime: {},
    configDocumentStart: ['redirect', 'menuScrollbarSetting', 'mainRunAt'],
    data: {},
    url: {
      api_queryWatchlaterList: 'https://api.bilibili.com/x/v2/history/toview/web',
      api_addToWatchlater: 'https://api.bilibili.com/x/v2/history/toview/add',
      api_removeFromWatchlater: 'https://api.bilibili.com/x/v2/history/toview/del',
      api_clearWatchlater: 'http://api.bilibili.com/x/v2/history/toview/clear',
      api_listFav: 'http://api.bilibili.com/x/v3/fav/folder/created/list-all',
      api_dealFav: 'http://api.bilibili.com/x/v3/fav/resource/deal',
      api_dynamicNew: 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new',
      api_dynamicHistory: 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_history',
      page_watchlaterList: 'https://www.bilibili.com/watchlater/#/list',
      page_videoNormalMode: 'https://www.bilibili.com/video',
      page_videoWatchlaterMode: 'https://www.bilibili.com/medialist/play/watchlater',
      page_watchlaterPlayAll: `https://www.bilibili.com/medialist/play/watchlater/?${gmId}_disable_redirect=true`,
      page_userSpace: uid => `https://space.bilibili.com/${uid}`,
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliWatchlaterPlus/changelog.md',
      external_fixHeader: 'https://greasyfork.org/zh-CN/scripts/430292',
      noop: 'javascript:void(0)',
    },
    regex: {
      // 只要第一个「#」后是「/list([/?#]|$)」即被视为列表页面
      // B站并不会将「#/list」之后的「[/?#]」视为锚点的一部分，这不符合 URL 规范，但只能将错就错了
      page_watchlaterList: /\.com\/watchlater\/[^#]*#\/list([#/?]|$)/,
      page_videoNormalMode: /\.com\/video([#/?]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater([#/?]|$)/,
      page_dynamic: /\/t\.bilibili\.com(\/|$)/,
      page_dynamicMenu: /\.com\/pages\/nav\/index_new([#/?]|$)/,
      page_userSpace: /space\.bilibili\.com([#/?]|$)/,
    },
    const: {
      fadeTime: 400,
      textFadeTime: 100,
      updateHighlightColor: '#4cff9c',
      inputThrottleWait: 250,
      batchAddRequestInterval: 300,
      fixerHint: '固定在列表最后，并禁用自动移除及排序功能。\n右键点击可取消所有固定项。',
    },
    menu: {
      setting: { state: 0, wait: 0, el: null },
      history: { state: 0, wait: 0, el: null },
      batchAddManager: { state: 0, wait: 0, el: null },
      entryPopup: { state: 0, wait: 0, el: null }
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
   * 脚本运行的抽象，为脚本本身服务的核心功能
   */
  class Script {
    /** 内部数据 */
    #data = {}

    /** 通用方法 */
    method = {
      /**
       * GM 读取流程
       *
       * 一般情况下，读取用户配置；如果配置出错，则沿用默认值，并将默认值写入配置中
       * @param {string} gmKey 键名
       * @param {*} defaultValue 默认值
       * @param {boolean} [writeback=true] 配置出错时是否将默认值回写入配置中
       * @returns {*} 通过校验时是配置值，不能通过校验时是默认值
       */
      gmValidate(gmKey, defaultValue, writeback = true) {
        let invalid = false
        let value = GM_getValue(gmKey)
        if (Enums && gmKey in Enums) {
          if (!Object.values(Enums[gmKey]).includes(value)) {
            invalid = true
          }
        } else if (typeof value == typeof defaultValue) { // 对象默认赋 null 无需额外处理
          const type = gm.configMap[gmKey].type
          if (type == 'int' || type == 'float') {
            invalid = gm.configMap[gmKey].min > value || gm.configMap[gmKey].max < value
          }
        } else {
          invalid = true
        }
        if (invalid) {
          value = defaultValue
          if (writeback) {
            GM_setValue(gmKey, value)
          }
        }
        return value
      },
    }

    /**
     * document-start 级别初始化
     */
    initAtDocumentStart() {
      // document-start 级用户配置读取
      if (gm.configVersion > 0) {
        for (const name of gm.configDocumentStart) {
          gm.config[name] = this.method.gmValidate(name, gm.configMap[name].default)
        }
      } else {
        for (const name of gm.configDocumentStart) {
          gm.config[name] = gm.configMap[name].default
          GM_setValue(name, gm.config[name])
        }
      }
    }

    /**
     * 初始化
     */
    init() {
      try {
        this.initGMObject()
        this.updateVersion()
        this.readConfig()
      } catch (e) {
        api.logger.error(e)
        api.message.confirm('初始化错误！是否彻底清空内部数据以重置脚本？').then(result => {
          if (result) {
            const gmKeys = GM_listValues()
            for (const gmKey of gmKeys) {
              GM_deleteValue(gmKey)
            }
            location.reload()
          }
        })
      }
    }

    /**
     * 初始化全局对象
     */
    initGMObject() {
      for (const name in gm.configMap) {
        if (!gm.configDocumentStart.includes(name)) {
          gm.config[name] = gm.configMap[name].default
        }
      }

      gm.data = {
        ...gm.data,
        removeHistoryData: remove => {
          const $data = this.#data
          if (remove) {
            $data.removeHistoryData = undefined
          } else {
            if ($data.removeHistoryData == null) {
              /** @type {PushQueue<GMObject_data_item>} */
              let data = GM_getValue('removeHistoryData')
              if (data && typeof data == 'object') {
                Reflect.setPrototypeOf(data, PushQueue.prototype) // 初始化替换原型不会影响内联缓存
                let updated = false
                if (data.capacity != gm.config.removeHistorySaves) {
                  data.setCapacity(gm.config.removeHistorySaves)
                  updated = true
                }
                if (data.maxSize != gm.config.removeHistorySaves) {
                  data.setMaxSize(gm.config.removeHistorySaves)
                  updated = true
                }
                if (updated) {
                  GM_setValue('removeHistoryData', data)
                }
              } else {
                data = new PushQueue(gm.config.removeHistorySaves)
                GM_setValue('removeHistoryData', data)
              }
              $data.removeHistoryData = data
            }
            return $data.removeHistoryData
          }
        },
        watchlaterListData: async (reload, pageCache, localCache = true) => {
          const $data = this.#data
          if (gm.runtime.reloadWatchlaterListData) {
            reload = true
            gm.runtime.reloadWatchlaterListData = false
          }
          if ($data.watchlaterListData == null || reload || !pageCache) {
            if (gm.runtime.loadingWatchlaterListData) {
              // 一旦数据已在加载中，那么直接等待该次加载完成
              // 无论加载成功与否，所有被阻塞的数据请求均都使用该次加载的结果，完全保持一致
              // 注意：加载失败时，返回的空数组并非同一对象
              try {
                return await api.wait.waitForConditionPassed({
                  condition: () => {
                    if (!gm.runtime.loadingWatchlaterListData) {
                      return $data.watchlaterListData ?? []
                    }
                  },
                })
              } catch (e) {
                gm.runtime.loadingWatchlaterListData = false
                api.logger.error(e)
                return $data.watchlaterListData ?? []
              }
            }

            if (!reload && localCache && gm.config.watchlaterListCacheValidPeriod > 0) {
              const cacheTime = GM_getValue('watchlaterListCacheTime')
              if (cacheTime) {
                const current = Date.now()
                if (current - cacheTime < gm.config.watchlaterListCacheValidPeriod * 1000) {
                  const list = GM_getValue('watchlaterListCache')
                  if (list) {
                    $data.watchlaterListData = list
                    return list // 默认缓存不为空
                  }
                }
              }
            }

            gm.runtime.loadingWatchlaterListData = true
            try {
              const resp = await api.web.request({
                url: gm.url.api_queryWatchlaterList,
              }, { check: r => r.code === 0 })
              const current = resp.data.list ?? []
              if (gm.config.watchlaterListCacheValidPeriod > 0) {
                GM_setValue('watchlaterListCacheTime', Date.now())
                GM_setValue('watchlaterListCache', current.map(item => {
                  return {
                    aid: item.aid,
                    bvid: item.bvid,
                    title: item.title,
                    state: item.state,
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
              }
              $data.watchlaterListData = current
              return current
            } catch (e) {
              api.logger.error(e)
              return $data.watchlaterListData ?? []
            } finally {
              gm.runtime.loadingWatchlaterListData = false
            }
          } else {
            return $data.watchlaterListData
          }
        },
        fixedItem: (id, op) => {
          const items = GM_getValue('fixedItems') ?? []
          const idx = items.indexOf(id)
          const fixed = idx >= 0
          if (op == null) {
            return fixed
          } else if (op) {
            if (!fixed) {
              items.push(id)
              GM_setValue('fixedItems', items)
            }
            return true
          } else {
            if (fixed) {
              items.splice(idx, 1)
              GM_setValue('fixedItems', items)
            }
            return false
          }
        },
      }

      gm.el.gmRoot = document.createElement('div')
      gm.el.gmRoot.id = gm.id
      api.wait.executeAfterElementLoaded({ // body 已存在时无异步
        selector: 'body',
        callback: body => body.append(gm.el.gmRoot),
      })
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

          // 4.16.23.20210808
          if (gm.configVersion < 20210808) {
            GM_deleteValue('removeHistorySaves')
          }

          // 4.17.0.20210808
          if (gm.configVersion < 20210808.1) {
            GM_deleteValue('hideWatchlaterInCollect')
          }

          // 4.17.4.20210810
          if (gm.configVersion < 20210810.1) {
            GM_deleteValue('fixHeader')
          }

          // 4.18.0.20210819
          if (gm.configVersion < 20210819) {
            GM_deleteValue('removeHistorySearchTimes')
            GM_deleteValue('watchlaterListCacheTime')
            GM_deleteValue('watchlaterListCache')
          }

          // 4.20.5.20210908
          if (gm.configVersion < 20210908) {
            GM_deleteValue('disablePageCache')
          }

          // 4.21.1.20210911
          if (gm.configVersion < 20210911) {
            GM_deleteValue('removeHistoryData')
            GM_deleteValue('removeHistoryFuzzyCompareReference')
          }

          // 功能性更新后更新此处配置版本
          if (gm.configVersion < 20210911) {
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
      if (gm.configVersion > 0) {
        // 对配置进行校验
        for (const name in gm.config) {
          if (!gm.configDocumentStart.includes(name)) {
            gm.config[name] = _self.method.gmValidate(name, gm.config[name])
          }
        }
      } else {
        // 用户强制初始化，或者第一次安装脚本
        gm.configVersion = 0
        for (const name in gm.config) {
          if (!gm.configDocumentStart.includes(name)) {
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
      // 批量添加管理器
      GM_registerMenuCommand('批量添加管理器', () => _self.openBatchAddManager())
      if (gm.config.removeHistory) {
        // 稍后再看移除记录
        GM_registerMenuCommand('稍后再看移除记录', () => _self.openRemoveHistory())
      }
      // 强制初始化
      GM_registerMenuCommand('初始化脚本', () => _self.resetScript())
    }

    /**
     * 打开用户设置
     * @param {number} [type=0] 常规 `0` | 初始化 `1` | 功能性更新 `2`
     */
    openUserSetting(type = 0) {
      const _self = this
      if (gm.el.setting) {
        _self.openMenuItem('setting')
      } else {
        /** @type {{[n: string]: HTMLElement}} */
        const el = {}
        setTimeout(() => {
          initSetting()
          processConfigItem()
          processSettingItem()
          _self.openMenuItem('setting')
        })

        /**
         * 设置页初始化
         */
        const initSetting = () => {
          gm.el.setting = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.setting.el = gm.el.setting
          gm.el.setting.className = 'gm-setting gm-modal-container'
          if (gm.config.hideDisabledSubitems) {
            gm.el.setting.classList.add('gm-hideDisabledSubitems')
          }
          gm.el.setting.innerHTML = `
            <div class="gm-setting-page gm-modal">
              <div class="gm-title">
                <a class="gm-maintitle" title="${GM_info.script.homepage}" href="${GM_info.script.homepage}" target="_blank">
                  <span>${GM_info.script.name}</span>
                </a>
                <div class="gm-subtitle">V${GM_info.script.version} by ${GM_info.script.author}</div>
              </div>
              <div class="gm-items">
                <table>
                  <tr class="gm-item" title="在顶栏「动态」和「收藏」之间加入稍后再看入口，鼠标移至上方时弹出列表菜单，支持点击功能设置。">
                    <td rowspan="12"><div>全局功能</div></td>
                    <td>
                      <label>
                        <span>在顶栏中加入稍后再看入口</span>
                        <input id="gm-headerButton" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="选择左键点击入口时执行的操作。">
                    <td>
                      <div>
                        <span>在入口上点击鼠标左键时</span>
                        <select id="gm-headerButtonOpL"></select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="选择右键点击入口时执行的操作。">
                    <td>
                      <div>
                        <span>在入口上点击鼠标右键时</span>
                        <select id="gm-headerButtonOpR"></select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="选择中键点击入口时执行的操作。">
                    <td>
                      <div>
                        <span>在入口上点击鼠标中键时</span>
                        <select id="gm-headerButtonOpM"></select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="设置入口弹出菜单。">
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
                  <tr class="gm-subitem" sup="headerButton" title="选择在弹出菜单中点击链接的行为。">
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
                  <tr class="gm-subitem" sup="headerButton" title="在弹出菜单中显示自页面打开以来，从弹出菜单移除的视频。">
                    <td>
                      <label>
                        <span>在弹出菜单中显示被移除的视频</span>
                        <input id="gm-headerMenuKeepRemoved" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="在弹出菜单顶部显示搜索框。">
                    <td>
                      <label>
                        <span>在弹出菜单顶部显示搜索框</span>
                        <input id="gm-headerMenuSearch" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="在弹出菜单底部显示排序控制器。">
                    <td>
                      <label>
                        <span>在弹出菜单底部显示排序控制器</span>
                        <input id="gm-headerMenuSortControl" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="在弹出菜单底部显示自动移除控制器。">
                    <td>
                      <label>
                        <span>在弹出菜单底部显示自动移除控制器</span>
                        <input id="gm-headerMenuAutoRemoveControl" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="headerButton" title="设置在弹出列表显示的快捷功能。">
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
                  <tr class="gm-subitem" sup="headerButton" title="无须兼容第三方顶栏时务必选择「无」，否则脚本无法正常工作！若列表中没有提供您需要的第三方顶栏，且该第三方顶栏有一定用户基数，可在脚本反馈页发起请求。">
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
                    <td rowspan="7"><div>全局功能</div></td>
                    <td>
                      <label>
                        <span>开启稍后再看移除记录</span>
                        <input id="gm-removeHistory" type="checkbox">
                        <span id="gm-rhWarning" class="gm-warning" title>⚠</span>
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="选择在何时保存稍后再看历史数据。">
                      <td>
                        <div>
                          <span>为了生成移除记录，</span>
                          <select id="gm-removeHistorySavePoint">
                            <option value="${Enums.removeHistorySavePoint.list}">在打开列表页面时保存数据</option>
                            <option value="${Enums.removeHistorySavePoint.listAndMenu}">在打开列表页面或弹出入口菜单时保存数据</option>
                            <option value="${Enums.removeHistorySavePoint.anypage}">在打开任意相关页面时保存数据</option>
                          </select>
                        </div>
                      </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="距离上一次保存稍后再看历史数据间隔超过该时间，才会再次进行保存。">
                    <td>
                      <div>
                        <span>数据保存最小时间间隔（单位：秒）</span>
                        <input id="gm-removeHistorySavePeriod" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="设置模糊比对深度以快速舍弃重复数据从而降低开销，但可能会造成部分记录遗漏。">
                    <td>
                      <div>
                        <span>模糊比对模式深度</span>
                        <span id="gm-rhfcInformation" class="gm-information" title>💬</span>
                        <input id="gm-removeHistoryFuzzyCompare" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="较大的数值可能会带来较大的开销（具体参考右侧弹出说明）。将该项修改为比原来小的值会清理过期数据，无法恢复！">
                    <td>
                      <div>
                        <span>不重复数据记录保存数</span>
                        <span id="gm-rhsInformation" class="gm-information" title>💬</span>
                        <span id="gm-clearRemoveHistoryData" class="gm-info" title="清理已保存的稍后再看历史数据，不可恢复！">清空数据(0条)</span>
                        <input id="gm-removeHistorySaves" type="text">
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="在稍后再看历史数据记录中保存时间戳，以其优化对数据记录的排序及展示。">
                    <td>
                      <label>
                        <span>使用时间戳优化移除记录</span>
                        <span id="gm-rhtInformation" class="gm-information" title>💬</span>
                        <input id="gm-removeHistoryTimestamp" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" sup="removeHistory" title="搜寻时在最近多少条数据记录中查找，设置较小的值能较好地定位最近被添加到稍后再看的视频。">
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

                  <tr class="gm-item" title="决定首次打开列表页面或顶栏入口弹出菜单时，如何对稍后再看列表内容进行排序。">
                    <td><div>全局功能</div></td>
                    <td>
                      <div>
                        <span>自动排序：</span>
                        <select id="gm-autoSort">
                          <option value="${Enums.autoSort.auto}">使用上一次排序控制器的选择</option>
                          <option value="${Enums.autoSort.default}">禁用功能</option>
                          <option value="${Enums.autoSort.defaultR}">使用 [ 默认↓ ] 排序</option>
                          <option value="${Enums.autoSort.duration}">使用 [ 时长 ] 排序</option>
                          <option value="${Enums.autoSort.durationR}">使用 [ 时长↓ ] 排序</option>
                          <option value="${Enums.autoSort.progress}">使用 [ 进度 ] 排序</option>
                          <option value="${Enums.autoSort.uploader}">使用 [ UP主 ] 排序</option>
                          <option value="${Enums.autoSort.title}">使用 [ 标题 ] 排序</option>
                          <option value="${Enums.autoSort.fixed}">使用 [ 固定 ] 排序</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="指定使用收藏功能时，将视频从稍后再看移动至哪个收藏夹。">
                    <td><div>全局功能</div></td>
                    <td>
                      <div>
                        <span>稍后再看收藏夹</span>
                        <span id="gm-watchlaterMediaList" class="gm-info">设置</span>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="在播放页面中加入能将视频快速切换添加或移除出稍后再看列表的按钮。">
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
                          <option value="${Enums.autoRemove.never}">不执行自动移除功能（可通过自动移除控制器临时开启功能）</option>
                          <option value="${Enums.autoRemove.absoluteNever}">彻底禁用自动移除功能</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="打开「${gm.url.page_videoWatchlaterMode}」页面时，自动切换至「${gm.url.page_videoNormalMode}」页面进行播放，但不影响「播放全部」等相关功能。">
                    <td><div>播放页面</div></td>
                    <td>
                      <label>
                        <span>从稍后再看模式强制切换到常规模式播放（重定向）</span>
                        <input id="gm-redirect" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="批量添加管理器可以将投稿批量添加到稍后再看。">
                    <td><div>动态主页</div></td>
                    <td>
                      <label>
                        <span>显示批量添加管理器按钮</span>
                        <input id="gm-dynamicBatchAddManagerButton" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="批量添加管理器可以将投稿批量添加到稍后再看。">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>显示批量添加管理器按钮</span>
                        <input id="gm-listBatchAddManagerButton" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="在列表页面显示搜索框。">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>显示搜索框</span>
                        <input id="gm-listSearch" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="在列表页面显示排序控制器。">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>显示排序控制器</span>
                        <input id="gm-listSortControl" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="在列表页面显示自动移除控制器。">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>显示自动移除控制器</span>
                        <input id="gm-listAutoRemoveControl" type="checkbox">
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

                  <tr class="gm-item" title="安装固顶官方顶栏的用户样式（建议使用 Stylus 安装）。">
                    <td><div>相关调整</div></td>
                    <td>
                      <div>
                        <span>将顶栏固定在页面顶部</span>
                        <a id="gm-fixHeader" class="gm-info" href="${gm.url.external_fixHeader}" target="_blank">安装功能</a>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="对顶栏各入口弹出菜单中滚动条的样式进行设置。">
                    <td><div>相关调整</div></td>
                    <td>
                      <div>
                        <span>对于弹出菜单中的滚动条</span>
                        <select id="gm-menuScrollbarSetting">
                          <option value="${Enums.menuScrollbarSetting.beautify}">修改其外观为现代风格</option>
                          <option value="${Enums.menuScrollbarSetting.hidden}">将其隐藏（不影响鼠标滚动）</option>
                          <option value="${Enums.menuScrollbarSetting.original}">维持官方的滚动条样式</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="隐藏顶栏「收藏」入口弹出菜单中的「稍后再看」。">
                    <td><div>相关调整</div></td>
                    <td>
                      <label>
                        <span>隐藏「收藏」中的「稍后再看」</span>
                        <input id="gm-hideWatchlaterInCollect" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="选择脚本主要逻辑的运行时期。">
                    <td><div>脚本设置</div></td>
                    <td>
                      <div>
                        <span>脚本运行时期：</span>
                        <select id="gm-mainRunAt">
                          <option value="${Enums.mainRunAt.DOMContentLoaded}">DOMContentLoaded</option>
                          <option value="${Enums.mainRunAt.load}">load</option>
                        </select>
                        <span id="gm-mraInformation" class="gm-information" title>💬</span>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="稍后再看列表数据本地缓存有效期（单位：秒）">
                    <td><div>脚本设置</div></td>
                    <td>
                      <div>
                        <span>稍后再看列表数据本地缓存有效期（单位：秒）</span>
                        <span id="gm-wlcvpInformation" class="gm-information" title>💬</span>
                        <input id="gm-watchlaterListCacheValidPeriod" type="text">
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
                <button class="gm-save">保存</button>
                <button class="gm-cancel">取消</button>
              </div>
              <div class="gm-reset" title="重置脚本设置及内部数据（稍后再看历史数据除外），也许能解决脚本运行错误的问题。无法解决请联系脚本作者：${GM_info.script.supportURL}">初始化脚本</div>
              <a class="gm-changelog" title="显示更新日志" href="${gm.url.gm_changelog}" target="_blank">更新日志</a>
            </div>
            <div class="gm-shadow"></div>
          `

          // 找出配置对应的元素
          for (const name in { ...gm.configMap, ...gm.infoMap }) {
            el[name] = gm.el.setting.querySelector(`#gm-${name}`)
          }

          el.settingPage = gm.el.setting.querySelector('.gm-setting-page')
          el.items = gm.el.setting.querySelector('.gm-items')
          el.maintitle = gm.el.setting.querySelector('.gm-maintitle')
          el.changelog = gm.el.setting.querySelector('.gm-changelog')
          switch (type) {
            case 1:
              el.settingPage.setAttribute('setting-type', 'init')
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(初始化设置)</span>'
              break
            case 2:
              el.settingPage.setAttribute('setting-type', 'updated')
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(功能性更新设置)</span>'
              {
                (function(map) {
                  for (const name in map) {
                    const configVersion = map[name].configVersion
                    if (configVersion && configVersion > gm.configVersion) {
                      let element = el[name]
                      while (element.nodeName != 'TD') {
                        element = element.parentElement
                        if (!element) break
                      }
                      if (element?.firstElementChild) {
                        element.firstElementChild.classList.add('gm-updated')
                      }
                    }
                  }
                })({ ...gm.configMap, ...gm.infoMap })
              }
              break
          }
          el.save = gm.el.setting.querySelector('.gm-save')
          el.cancel = gm.el.setting.querySelector('.gm-cancel')
          el.shadow = gm.el.setting.querySelector('.gm-shadow')
          el.reset = gm.el.setting.querySelector('.gm-reset')

          // 提示信息
          el.rhfcInformation = gm.el.setting.querySelector('#gm-rhfcInformation')
          api.message.hoverInfo(el.rhfcInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>模糊比对模式：设当前时间点获取到的稍后再看列表数据为 A，上一次获取到的数据为 B。若 A 与 B 的前 <b>N</b> 项均一致就认为这段时间没有往稍后再看中添加新视频，直接跳过后续处理。</p>
              <p>其中，<b>N</b> 即为模糊比对深度。注意，<b>深度设置过大反而会降低比对效率</b>，建议先设置较小的值，若后续观察到有记录被误丢弃，再增加该项的值。最佳参数与个人使用习惯相关，请根据自身情况微调。你也可以选择设置 <b>0</b> 以关闭模糊比对模式（不推荐）。</p>
            </div>
          `, null, { width: '36em', flagSize: '2em', position: { top: '80%' }, disabled: () => el.rhfcInformation.parentElement.hasAttribute('disabled') })
          el.rhsInformation = gm.el.setting.querySelector('#gm-rhsInformation')
          api.message.hoverInfo(el.rhsInformation, `
            <div style="line-height:1.6em">
              即使突破限制将该项设置为最大限制值的两倍，保存与读取对页面加载的影响仍可忽略不计（毫秒级），最坏情况下生成移除记录的耗时也能被控制在 1 秒以内。但仍不建议取太大的值，原因是移除记录本质上是一种误删后的挽回手段，非常近期的历史足以达到效果。
            </div>
          `, null, { width: '36em', flagSize: '2em', position: { top: '80%' }, disabled: () => el.rhsInformation.parentElement.hasAttribute('disabled') })
          el.rhtInformation = gm.el.setting.querySelector('#gm-rhtInformation')
          api.message.hoverInfo(el.rhtInformation, `
            <div style="line-height:1.6em">
              在历史数据记录中添加时间戳，用于改善移除记录中的数据排序，使得排序以「视频『最后一次』被观察到处于稍后再看的时间点」为基准，而非以「视频『第一次』被观察到处于稍后再看的时间点」为基准；同时也利于数据展示与查看。注意，此功能在数据存读及处理上都有额外开销。
            </div>
          `, null, { width: '36em', flagSize: '2em', position: { top: '80%' }, disabled: () => el.rhtInformation.parentElement.hasAttribute('disabled') })
          el.fwsInformation = gm.el.setting.querySelector('#gm-fwsInformation')
          api.message.hoverInfo(el.fwsInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>在动态页、视频播放页以及其他页面，视频卡片的右下角方存在一个将视频加入或移除出稍后再看的快捷按钮。然而，在刷新页面后，B站不会为之加载稍后再看的状态——即使视频已经在稍后再看中，也不会显示出来。启用该功能后，会自动填充这些缺失的状态信息。</p>
              <p>第三项「所有页面」，会用一套固定的逻辑对脚本能匹配到的所有非特殊页面尝试进行信息填充。脚本本身没有匹配所有B站页面，如果有需要，请在脚本管理器（如 Tampermonkey）中为脚本设置额外的页面匹配规则。由于B站各页面的设计不是很规范，某些页面中视频卡片的设计可能跟其他地方不一致，所以不保证必定能填充成功。</p>
            </div>
          `, null, { width: '36em', flagSize: '2em', position: { top: '80%' } })
          el.mraInformation = gm.el.setting.querySelector('#gm-mraInformation')
          api.message.hoverInfo(el.mraInformation, `
            <div style="line-height:1.6em">
              <p style="margin-bottom:0.5em"><b>DOMContentLoaded</b>：与页面内容同步加载，避免脚本在页面加载度较高时才对页面作修改。上述情况会给人页面加载时间过长的错觉，并且伴随页面变化突兀的不适感。</p>
              <p><b>load</b>：在页面初步加载完成时运行。从理论上来说这个时间点更为合适，且能保证脚本在网页加载速度极慢时仍可正常工作。但要注意的是，以上所说「网页加载速度极慢」的情况并不常见，以下为常见原因：1. 短时间内（在后台）打开十几乃至数十个网页；2. 网络问题。</p>
            </div>
          `, null, { width: '36em', flagSize: '2em', position: { top: '80%' } })
          el.wlcvpInformation = gm.el.setting.querySelector('#gm-wlcvpInformation')
          api.message.hoverInfo(el.wlcvpInformation, `
            <div style="line-height:1.6em">
              在有效期内使用本地缓存代替网络请求——除非是须确保数据正确性的场合。有效期过大会导致各种诡异现象，取值最好能匹配自身的B站使用习惯。
            </div>
          `, null, { width: '36em', flagSize: '2em' })

          el.hcWarning = gm.el.setting.querySelector('#gm-hcWarning')
          api.message.hoverInfo(el.hcWarning, '无须兼容第三方顶栏时务必选择「无」，否则脚本无法正常工作！', '⚠')
          el.rhWarning = gm.el.setting.querySelector('#gm-rhWarning')
          api.message.hoverInfo(el.rhWarning, '关闭移除记录，或将稍后再看历史数据保存次数设置为比原来小的值，都会造成对内部过期历史数据的清理！', '⚠')

          el.headerButtonOpL.innerHTML = el.headerButtonOpR.innerHTML = el.headerButtonOpM.innerHTML = `
            <option value="${Enums.headerButtonOp.openListInCurrent}">在当前页面打开列表页面</option>
            <option value="${Enums.headerButtonOp.openListInNew}">在新标签页打开列表页面</option>
            <option value="${Enums.headerButtonOp.playAllInCurrent}">在当前页面播放全部</option>
            <option value="${Enums.headerButtonOp.playAllInNew}">在新标签页播放全部</option>
            <option value="${Enums.headerButtonOp.clearWatchlater}">清空稍后再看</option>
            <option value="${Enums.headerButtonOp.clearWatchedInWatchlater}">移除稍后再看已观看视频</option>
            <option value="${Enums.headerButtonOp.openUserSetting}">打开用户设置</option>
            <option value="${Enums.headerButtonOp.openRemoveHistory}">打开稍后再看移除记录</option>
            <option value="${Enums.headerButtonOp.openBatchAddManager}">打开批量添加管理器</option>
            <option value="${Enums.headerButtonOp.noOperation}">不执行操作</option>
          `
        }

        /**
         * 维护与设置项相关的数据和元素
         */
        const processConfigItem = () => {
          // 子项与父项相关联
          const subitemChange = (item, sup) => {
            el.items.querySelectorAll(`[sup="${sup}"] [id|=gm]`).forEach(option => {
              const parent = option.parentElement
              if (item.checked) {
                parent.removeAttribute('disabled')
              } else {
                parent.setAttribute('disabled', '')
              }
              option.disabled = !item.checked
            })
          }
          el.headerMenuFn = el.headerMenuFnSetting.parentElement.parentElement
          el.headerButton.init = function() {
            subitemChange(this, 'headerButton')
            if (this.checked) {
              el.headerMenuFn.removeAttribute('disabled')
            } else {
              el.headerMenuFn.setAttribute('disabled', '')
            }
          }
          el.headerButton.addEventListener('change', el.headerButton.init)
          el.headerCompatible.init = function() {
            setHcWarning()
          }
          el.headerCompatible.addEventListener('change', el.headerCompatible.init)
          el.removeHistory.init = function() {
            subitemChange(this, 'removeHistory')
            setRhWaring()
          }
          el.removeHistory.addEventListener('change', el.removeHistory.init)

          // 输入框内容处理
          const positiveIntInputs = ['removeHistorySavePeriod', 'removeHistoryFuzzyCompare', 'removeHistorySaves', 'removeHistorySearchTimes', 'watchlaterListCacheValidPeriod']
          for (const name of positiveIntInputs) {
            el[name].addEventListener('input', function() {
              const v0 = this.value.replace(/\D/g, '')
              if (v0 === '') {
                this.value = ''
              } else if (typeof gm.configMap[name].max == 'number') {
                let value = Number.parseInt(v0)
                if (value > gm.configMap[name].max) {
                  value = gm.configMap[name].max
                }
                this.value = value
              }
            })
            el[name].addEventListener('blur', function() {
              if (this.value === '') {
                this.value = gm.configMap[name].default
              } else if (typeof gm.configMap[name].min == 'number') {
                let value = Number.parseInt(this.value)
                if (value < gm.configMap[name].min) {
                  value = gm.configMap[name].min
                }
                this.value = value
              }
            })
          }

          el.removeHistorySaves.addEventListener('input', setRhWaring)
          el.removeHistorySaves.addEventListener('blur', setRhWaring)
        }

        /**
         * 处理与设置页相关的数据和元素
         */
        const processSettingItem = () => {
          gm.menu.setting.openHandler = onOpen
          gm.menu.setting.openedHandler = onOpened
          gm.el.setting.fadeInDisplay = 'flex'
          el.save.addEventListener('click', onSave)
          el.cancel.addEventListener('click', () => _self.closeMenuItem('setting'))
          el.shadow.addEventListener('click', function() {
            if (!this.hasAttribute('disabled')) {
              _self.closeMenuItem('setting')
            }
          })
          el.reset.addEventListener('click', () => _self.resetScript())
          el.clearRemoveHistoryData.addEventListener('click', function() {
            el.removeHistory.checked && _self.clearRemoveHistoryData()
          })
          el.watchlaterMediaList.addEventListener('click', async function() {
            const uid = webpage.method.getDedeUserID()
            const mlid = await api.message.prompt(`
              <p>指定使用收藏功能时，将视频从稍后再看移动至哪个收藏夹。</p>
              <p>下方应填入目标收藏夹 ID，置空时使用默认收藏夹。收藏夹页面网址为「https://space.bilibili.com/\${uid}/favlist?fid=\${mlid}」，mlid 即收藏夹 ID。</p>
            `, GM_getValue(`watchlaterMediaList_${uid}`) ?? undefined, { html: true })
            if (mlid != null) {
              GM_setValue(`watchlaterMediaList_${uid}`, mlid)
              api.message.info('已保存稍后再看收藏夹设置')
            }
          })
          if (type > 0) {
            if (type == 2) {
              el.save.title = '向下滚动……'
              el.save.disabled = true
            }
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
                needReload ||= change
              }
            }
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
            const rhsV = Number.parseInt(el.removeHistorySaves.value)
            if (rhsV != gm.config.removeHistorySaves && !Number.isNaN(rhsV)) {
              // 因：removeHistorySaves
              // 果：removeHistorySaves & removeHistoryData
              const data = gm.data.removeHistoryData()
              data.setCapacity(rhsV)
              data.setMaxSize(rhsV)
              gm.config.removeHistorySaves = rhsV
              GM_setValue('removeHistorySaves', rhsV)
              GM_setValue('removeHistoryData', data)
              // 不需要修改 needReload
            }
            // 因：removeHistorySearchTimes
            // 果：removeHistorySearchTimes
            const rhstV = Number.parseInt(el.removeHistorySearchTimes.value)
            if (rhstV != gm.config.removeHistorySearchTimes && !Number.isNaN(rhstV)) {
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
              el.maintitle.textContent = GM_info.script.name
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
            el.clearRemoveHistoryData.textContent = `清空数据(${gm.data.removeHistoryData().size}条)`
          } else {
            el.clearRemoveHistoryData.textContent = '清空数据(0条)'
          }
        }

        /**
         * 设置打开后执行
         */
        const onOpened = () => {
          el.items.scrollTop = 0
          if (type == 2) {
            const resetSave = () => {
              el.save.title = ''
              el.save.disabled = false
            }

            const points = []
            const totalLength = el.items.firstElementChild.offsetHeight
            const items = el.items.querySelectorAll('.gm-updated')
            for (const item of items) {
              const tr = item.parentElement.parentElement
              points.push(tr.offsetTop / totalLength * 100)
            }

            if (points.length > 0) {
              let range = 5 // 显示宽度
              const actualRange = items[0].parentElement.parentElement.offsetHeight / totalLength * 100 // 实际宽度
              let realRange = actualRange // 校正后原点到真实末尾的宽度
              if (actualRange > range) {
                range = actualRange
              } else {
                const offset = (actualRange - range) / 2
                for (let i = 0; i < points.length; i++) {
                  points[i] = points[i] + offset
                }
                realRange = range + offset
              }
              const start = []
              const end = []
              let currentStart = points[0]
              let currentEnd = points[0] + range
              for (let i = 1; i < points.length; i++) {
                const point = points[i]
                if (point < currentEnd) {
                  currentEnd = point + range
                } else {
                  start.push(currentStart)
                  end.push(currentEnd)
                  currentStart = point
                  currentEnd = point + range
                  if (currentEnd >= 100) {
                    currentEnd = 100
                    break
                  }
                }
              }
              start.push(currentStart)
              end.push(currentEnd)

              let linear = ''
              for (const [idx, val] of start.entries()) {
                linear += `, transparent ${val}%, ${gm.const.updateHighlightColor} ${val}%, ${gm.const.updateHighlightColor} ${end[idx]}%, transparent ${end[idx]}%`
              }
              linear = linear.slice(2)

              api.base.addStyle(`
                #${gm.id} [setting-type=updated] .gm-items::-webkit-scrollbar {
                  background: linear-gradient(${linear})
                }
              `)

              if (el.items.scrollHeight == el.items.clientHeight) {
                resetSave()
              } else {
                const last = Math.min((points.pop() + realRange) / 100, 0.95) // 给计算误差留点余地
                const onScroll = api.base.throttle(function() {
                  const bottom = (this.scrollTop + this.clientHeight) / this.scrollHeight
                  if (bottom > last) { // 可视区底部超过最后一个更新点
                    resetSave()
                    this.removeEventListener('scroll', onScroll)
                  }
                }, 200)
                el.items.addEventListener('scroll', onScroll)
                el.items.dispatchEvent(new Event('scroll'))
              }
            } else {
              resetSave()
            }
          }
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
              val = type == 'int' ? Number.parseInt(val) : Number.parseFloat(val)
            }
            if (Number.isNaN(val)) {
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
            let rhs = Number.parseInt(el.removeHistorySaves.value)
            if (Number.isNaN(rhs)) {
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
      }
    }

    /**
     * 打开批量添加管理器
     */
    openBatchAddManager() {
      if (gm.el.batchAddManager) {
        script.openMenuItem('batchAddManager')
      } else {
        /** @type {{[n: string]: HTMLElement}} */
        const el = {}
        let history = null
        if (gm.config.removeHistory) {
          const records = gm.data.removeHistoryData().toArray(50) // 回溯限制到 50 条
          if (records.length > 0) {
            history = new Set()
            for (const record of records) {
              history.add(webpage.method.bvTool.bv2av(record[0]))
            }
          }
        }
        setTimeout(() => {
          initManager()
          processItem()
          script.openMenuItem('batchAddManager')
        })

        /**
         * 初始化管理器
         */
        const initManager = () => {
          gm.el.batchAddManager = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.menu.batchAddManager.el = gm.el.batchAddManager
          gm.el.batchAddManager.className = 'gm-batchAddManager gm-modal-container'
          gm.el.batchAddManager.innerHTML = `
            <div class="gm-batchAddManager-page gm-modal">
              <div class="gm-title">批量添加管理器</div>
              <div class="gm-comment">
                <div>请执行以下步骤以将投稿批量添加到稍后再看（可以跳过部分步骤）。执行过程中可以关闭对话框，但不能关闭页面——且将当前页面置于后台时，浏览器会暂缓甚至暂停任务执行。</div>
                <div>脚本会优先添加投稿时间较早的投稿，达到稍后再看容量上限 100 时终止执行。注意，该功能会向后台发起大量请求，滥用可能会导致一段时间内无法正常访问B站，您可以增加平均请求间隔以降低被 BAN 的概率。</div>
                <div>第一步：加载最近 <input id="gm-batch-1a" type="text" value="24"> <select id="gm-batch-1b" style="border:none;margin: 0 -4px">
                  <option value="${3600 * 24}">天</option>
                  <option value="3600" selected>小时</option>
                  <option value="60">分钟</option>
                </select> 以内发布且不存在于稍后再看的视频投稿<button id="gm-batch-1c">执行</button><button id="gm-batch-1d" disabled>终止</button></div>
                <div>第二步：缩小时间范围到 <input id="gm-batch-2a" type="text"> <select id="gm-batch-2b" style="border:none;margin: 0 -4px">
                  <option value="${3600 * 24}">天</option>
                  <option value="3600" selected>小时</option>
                  <option value="60">分钟</option>
                </select> 以内；可使用上下方向键（配合 Alt/Shift/Ctrl）调整数值大小<button id="gm-batch-2c" disabled>执行</button></div>
                <div>第三步：筛选 <input id="gm-batch-3a" type="text" style="width:10em">，过滤 <input id="gm-batch-3b" type="text" style="width:10em">；支持通配符 ( ? * )，使用 | 分隔关键词<button id="gm-batch-3c" disabled>执行</button></div>
                <div>第四步：将选定稿件添加到稍后再看（平均请求间隔：<input id="gm-batch-4a" type="text" value="${gm.const.batchAddRequestInterval}">ms）<button id="gm-batch-4b" disabled>执行</button><button id="gm-batch-4c" disabled>终止</button></div>
              </div>
              <div class="gm-items"></div>
              <div class="gm-bottom">
                <button id="gm-unchecked-display"></button>
                <button id="gm-save-batch-params">保存参数</button>
                <button id="gm-reset-batch-params">重置参数</button>
              </div>
            </div>
            <div class="gm-shadow"></div>
          `
          const ids = ['1a', '1b', '1c', '1d', '2a', '2b', '2c', '3a', '3b', '3c', '4a', '4b', '4c']
          for (const id of ids) {
            el[`id${id}`] = gm.el.batchAddManager.querySelector(`#gm-batch-${id}`)
          }
          el.items = gm.el.batchAddManager.querySelector('.gm-items')
          el.uncheckedDisplay = gm.el.batchAddManager.querySelector('#gm-unchecked-display')
          el.saveParams = gm.el.batchAddManager.querySelector('#gm-save-batch-params')
          el.resetParams = gm.el.batchAddManager.querySelector('#gm-reset-batch-params')
          el.shadow = gm.el.batchAddManager.querySelector('.gm-shadow')

          el.saveParams.paramIds = ['1a', '1b', '2a', '2b', '3a', '3b', '4a']
          const batchParams = GM_getValue('batchParams')
          if (batchParams) {
            for (const id of el.saveParams.paramIds) {
              el[`id${id}`].value = batchParams[`id${id}`]
            }
          }
        }

        /**
         * 维护内部元素和数据
         */
        const processItem = () => {
          gm.el.batchAddManager.fadeInDisplay = 'flex'
          el.shadow.addEventListener('click', () => script.closeMenuItem('batchAddManager'))

          // 非选显示
          const setUncheckedDisplayText = () => {
            el.uncheckedDisplay.textContent = el.uncheckedDisplay.hide ? '显示非选' : '隐藏非选'
          }
          el.uncheckedDisplay.hide = GM_getValue('batchUncheckedDisplay') ?? false
          setUncheckedDisplayText()
          el.uncheckedDisplay.addEventListener('click', function() {
            this.hide = !this.hide
            GM_setValue('batchUncheckedDisplay', this.hide)
            setUncheckedDisplayText()
            const display = this.hide ? 'none' : ''
            for (let i = 0; i < el.items.childElementCount; i++) {
              const item = el.items.children[i]
              if (!item.firstElementChild.checked) {
                item.style.display = display
              }
            }
          })
          el.items.addEventListener('click', function(e) {
            if (e.target.type == 'checkbox' && el.uncheckedDisplay.hide) {
              if (!e.target.checked) {
                e.target.parentElement.style.display = 'none'
              }
            }
          })

          // 参数
          el.saveParams.addEventListener('click', function() {
            const batchParams = {}
            for (const id of el.saveParams.paramIds) {
              batchParams[`id${id}`] = el[`id${id}`].value
            }
            GM_setValue('batchParams', batchParams)
            api.message.info('保存成功，重新加载页面后当前参数会被自动加载')
          })
          el.resetParams.addEventListener('click', function() {
            GM_deleteValue('batchParams')
            api.message.info('重置成功，重新加载页面后参数将加载默认值')
          })

          let executing = false

          // 加载投稿
          let stopLoad = false
          el.id1c.addEventListener('click', async function() {
            if (executing) return
            let error = false
            try {
              executing = true
              const v1a = Number.parseFloat(el.id1a.value)
              if (Number.isNaN(v1a)) throw 'v1a is NaN'
              el.id1a.value = v1a
              this.disabled = true
              this.textContent = '执行中'
              el.id1d.disabled = false
              el.id2c.disabled = true
              el.id3c.disabled = true
              el.id4b.disabled = true
              el.id2a.maxVal = v1a
              el.items.textContent = ''
              const uid = webpage.method.getDedeUserID()
              let dynamicOffset = await (async () => {
                // 一定要确保取到的是视频投稿的 dynamic_id
                // 某些动态（如直播）会显示在动态列表前方，但它们 dynamic_id 对应的时间点却可以是几天前的，非常诡异
                const data = new URLSearchParams()
                data.append('uid', uid)
                data.append('type_list', 8) // 视频（8 表示视频列表是猜的，目前测试下来应该没问题）
                const resp = await api.web.request({
                  url: `${gm.url.api_dynamicNew}?${data.toString()}`,
                }, { check: r => r.code === 0 })
                const items = resp.data.cards
                if (items.length === 0) return // -> finally
                // dynamic_id 数值过大，直接运算会丢失精度，必须转为 BigInt 运算
                return BigInt(items[0].desc.dynamic_id_str) + 1n // +1 才能获取到当前首项
              })()
              const end = Date.now() - v1a * el.id1b.value * 1000
              gm.runtime.reloadWatchlaterListData = true
              while (!stopLoad) {
                const data = new URLSearchParams()
                data.append('uid', uid)
                data.append('offset_dynamic_id', dynamicOffset)
                data.append('type', 8) // 视频（参考动态入口弹出菜单的请求）
                const resp = await api.web.request({
                  url: `${gm.url.api_dynamicHistory}?${data.toString()}`,
                }, { check: r => r.code === 0 })
                const items = resp.data.cards
                if (items.length === 0) return // -> finally
                // 不要用 json.data.next_offset，会丢失精度
                // offset 本身不会被获取，末项 offset 即下次查询 offset
                dynamicOffset = items[items.length - 1].desc.dynamic_id_str
                let html = ''
                for (const item of items) {
                  const info = JSON.parse(item.card)
                  if (item.desc.timestamp * 1000 < end) {
                    el.items.insertAdjacentHTML('afterbegin', html)
                    return // -> finally
                  }
                  const aid = String(info.aid)
                  if (!await webpage.method.getVideoWatchlaterStatusByAid(aid, false, true)) { // 完全跳过存在于稍后再看的视频
                    const uncheck = history?.has(aid)
                    const displayNone = uncheck && el.uncheckedDisplay.hide
                    html = `<label class="gm-item" aid="${info.aid}" timestamp="${item.desc.timestamp}"${displayNone ? ' style="display:none"' : ''}><input type="checkbox"${uncheck ? '' : ' checked'}> <span>[${info.owner.name}] ${info.title}</span></label>` + html
                  }
                }
                el.items.insertAdjacentHTML('afterbegin', html)
                await new Promise(resolve => setTimeout(resolve, 250 * (Math.random() + 0.5))) // 多让点时间给其他线程，顺便给请求留点间隔
              }
              // 执行到这里只有一个原因：stopLoad 导致任务终止
              api.message.info('批量添加：任务终止', { ms: 1800 })
            } catch (e) {
              error = true
              api.message.alert('执行失败')
              api.logger.error(e)
            } finally {
              if (!error && !stopLoad) {
                api.message.info('批量添加：稿件加载完成', { ms: 1800 })
              }
              executing = false
              stopLoad = false
              this.disabled = false
              this.textContent = '重新执行'
              el.id1d.disabled = true
              el.id2c.disabled = false
              el.id3c.disabled = false
              el.id4b.disabled = false
              if (!el.id2a.value) {
                el.id2a.value = el.id2a.maxVal ?? 0
              }
            }
          })
          el.id1d.addEventListener('click', function() {
            stopLoad = true
          })
          el.id1a.addEventListener('keyup', function(e) {
            if (e.key == 'Enter') {
              const target = el[executing ? 'id1d' : 'id1c']
              if (!target.disabled) {
                target.dispatchEvent(new Event('click'))
              }
            }
          })

          // 时间过滤
          const filterTime = function() {
            if (executing) return
            try {
              executing = true
              el.id2c.disabled = true
              let v2a = Number.parseFloat(el.id2a.value)
              if (Number.isNaN(v2a)) {
                for (let i = 0; i < el.items.childElementCount; i++) {
                  el.items.children[i].classList.remove('gm-filtered-time')
                }
              } else {
                if (el.id2a.maxVal < v2a) {
                  v2a = el.id2a.maxVal
                  el.id2a.value = v2a
                }
                const newEnd = Date.now() - v2a * el.id2b.value * 1000
                for (let i = 0; i < el.items.childElementCount; i++) {
                  const item = el.items.children[i]
                  const timestamp = Number.parseInt(item.getAttribute('timestamp'))
                  if (timestamp * 1000 < newEnd) {
                    item.classList.add('gm-filtered-time')
                  } else {
                    item.classList.remove('gm-filtered-time')
                  }
                }
              }
            } catch (e) {
              api.message.alert('执行失败')
              api.logger.error(e)
            } finally {
              executing = false
            }
          }
          const throttledFilterTime = api.base.throttle(filterTime, gm.const.inputThrottleWait)
          el.id2a.addEventListener('input', throttledFilterTime)
          el.id2b.addEventListener('change', filterTime)
          el.id2c.addEventListener('click', filterTime)
          el.id2a.addEventListener('input', function() {
            const val = Number.parseFloat(this.value)
            if (Number.isNaN(val)) {
              this.value = ''
            } else {
              let valStr = String(val)
              if (!valStr.includes('.') && this.value.includes('.')) {
                valStr += '.'
              }
              this.value = valStr
            }
          })
          el.id2a.addEventListener('blur', function() {
            if (this.value.endsWith('.')) {
              this.value = this.value.slice(0, -1)
            }
          })
          el.id2a.addEventListener('keydown', api.base.throttle(function(/** @type {KeyboardEvent} */ e) {
            let val = Number.parseFloat(this.value)
            if (Number.isNaN(val)) {
              val = this.maxVal ?? 0
            }
            let move = ({ ArrowUp: 1, ArrowDown: -1 })[e.key]
            if (move) {
              if (e.altKey) {
                move *= 0.1
              } else if (e.shiftKey) {
                move *= 10
              } else if (e.ctrlKey) {
                move *= 100
              }
              val += move
              if (val < 0) {
                val = 0
              } else if (this.maxVal < val) {
                val = this.maxVal
              }
              this.value = val.toFixed(1)
              throttledFilterTime()
            }
          }, 100))

          // 正则过滤
          const filterRegex = function() {
            if (executing) return
            try {
              const getRegex = str => {
                let result = null
                str = str.trim()
                if (str !== '') {
                  try {
                    str = str.replace(/[$()+.[\\\]^{}]/g, '\\$&') // escape regex except |
                      .replaceAll('?', '.').replaceAll('*', '.+') // 通配符
                    result = new RegExp(str, 'i')
                  } catch {}
                }
                return result
              }
              executing = true
              el.id3c.disabled = true
              el.id3a.value = el.id3a.value.trim()
              el.id3b.value = el.id3b.value.trim()
              const v3a = getRegex(el.id3a.value)
              const v3b = getRegex(el.id3b.value)
              for (let i = 0; i < el.items.childElementCount; i++) {
                const item = el.items.children[i]
                const tc = item.textContent
                if ((v3a && !v3a.test(tc)) || v3b?.test(tc)) {
                  item.classList.add('gm-filtered-regex')
                } else {
                  item.classList.remove('gm-filtered-regex')
                }
              }
            } catch (e) {
              api.message.alert('执行失败')
              api.logger.error(e)
            } finally {
              executing = false
            }
          }
          const throttledFilterRegex = api.base.throttle(filterRegex, gm.const.inputThrottleWait)
          el.id3a.addEventListener('input', throttledFilterRegex)
          el.id3b.addEventListener('input', throttledFilterRegex)
          el.id3c.addEventListener('click', throttledFilterRegex)

          // 添加到稍后再看
          let stopAdd = false
          el.id4b.addEventListener('click', async function() {
            if (executing) return
            try {
              executing = true
              let v4a = Number.parseFloat(el.id4a.value)
              if (Number.isNaN(v4a)) {
                v4a = gm.const.batchAddRequestInterval
              } else {
                v4a = Math.max(v4a, 200)
              }
              el.id4a.value = v4a
              this.disabled = true
              this.textContent = '执行中'
              el.id4c.disabled = false
              el.id1c.disabled = true
              el.id2c.disabled = true
              el.id3c.disabled = true

              let available = 100 - (await gm.data.watchlaterListData()).length
              const checks = el.items.querySelectorAll('label:not([class*=gm-filtered-]) input')
              for (const check of checks) {
                if (stopAdd) return api.message.info('批量添加：任务终止', { ms: 1800 }) // -> finally
                if (available <= 0) break
                if (!check.checked) continue
                const item = check.parentElement
                const success = await webpage.method.switchVideoWatchlaterStatus(item.getAttribute('aid'))
                if (!success) throw 'add request error'
                check.checked = false
                if (el.uncheckedDisplay.hide) {
                  item.style.display = 'none'
                }
                available -= 1
                await new Promise(resolve => setTimeout(resolve, v4a * (Math.random() + 0.5)))
              }
              api.message.info('批量添加：已将所有选定稿件添加到稍后再看', { ms: 1800 })
            } catch (e) {
              api.message.alert('执行失败：可能是因为该稿件不可用或稍后再看不支持该稿件类型（如互动视频），请尝试取消勾选当前列表中第一个选定的稿件后重新执行')
              api.logger.error(e)
            } finally {
              executing = false
              stopAdd = false
              this.disabled = false
              this.textContent = '重新执行'
              el.id4c.disabled = true
              el.id1c.disabled = false
              el.id2c.disabled = false
              el.id3c.disabled = false
              gm.runtime.reloadWatchlaterListData = true
              window.dispatchEvent(new CustomEvent('reloadWatchlaterListData'))
            }
          })
          el.id4c.addEventListener('click', function() {
            stopAdd = true
          })
          el.id4a.addEventListener('keyup', function(e) {
            if (e.key == 'Enter') {
              const target = el[executing ? 'id4c' : 'id4b']
              if (!target.disabled) {
                target.dispatchEvent(new Event('click'))
              }
            }
          })
        }
      }
    }

    /**
     * 打开移除记录
     */
    openRemoveHistory() {
      const _self = this
      if (!gm.config.removeHistory) {
        api.message.info('请在设置中开启稍后再看移除记录')
        return
      }
      GM_deleteValue('removeHistorySaveTime') // 保险起见，清理一下

      /** @type {{[n: string]: HTMLElement}} */
      const el = {}
      if (gm.el.history) {
        el.searchTimes = gm.el.history.querySelector('#gm-search-times')
        el.searchTimes.current = gm.config.removeHistorySearchTimes
        el.searchTimes.value = el.searchTimes.current

        el.historySort = gm.el.history.querySelector('#gm-history-sort')
        if (el.historySort.type !== 0) {
          el.historySort.setType(0) // 降序
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
          gm.el.history.className = 'gm-history gm-modal-container'
          gm.el.history.innerHTML = `
            <div class="gm-history-page gm-modal">
              <div class="gm-title">稍后再看移除记录</div>
              <div class="gm-comment">
                <div>根据最近<span id="gm-save-times">0</span>条不重复数据记录生成，共筛选出<span id="gm-removed-num">0</span>条移除记录。排序由视频<span id="gm-history-time-point"></span>被观察到处于稍后再看的时间决定，与被移除出稍后再看的时间无关。如果记录太少请设置增加历史回溯深度；记录太多则减少之，并善用浏览器搜索功能辅助定位。</div>
                <div style="text-align:right;font-weight:bold">
                  <span id="gm-history-sort" style="text-decoration:underline;cursor:pointer">降序</span>
                  <span title="搜寻时在最近保存的多少条稍后再看历史数据记录中查找。按下回车键或输入框失去焦点时刷新数据，设置较小的值能较好地定位最近被添加到稍后再看的视频。">历史回溯深度：<input type="text" id="gm-search-times" value="0"></span>
                </div>
              </div>
              <div class="gm-content"></div>
            </div>
            <div class="gm-shadow"></div>
          `
          el.historyPage = gm.el.history.querySelector('.gm-history-page')
          el.comment = gm.el.history.querySelector('.gm-comment')
          el.content = gm.el.history.querySelector('.gm-content')
          el.timePoint = gm.el.history.querySelector('#gm-history-time-point')
          el.saveTimes = gm.el.history.querySelector('#gm-save-times')
          el.removedNum = gm.el.history.querySelector('#gm-removed-num')
          el.searchTimes = gm.el.history.querySelector('#gm-search-times')
          el.shadow = gm.el.history.querySelector('.gm-shadow')
        }

        /**
         * 维护内部元素和数据
         */
        const processItem = () => {
          el.content.fadeOutDisplay = 'block'
          el.content.fadeInTime = gm.const.textFadeTime
          el.content.fadeOutTime = gm.const.textFadeTime
          el.searchTimes.current = gm.config.removeHistorySearchTimes
          el.searchTimes.value = el.searchTimes.current
          const stMin = gm.configMap.removeHistorySearchTimes.min
          el.searchTimes.addEventListener('input', function() {
            const v0 = this.value.replace(/\D/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              const stMax = gm.configMap.removeHistorySearchTimes.max
              let value = Number.parseInt(v0)
              if (value > stMax) {
                value = stMax
              } else if (value < stMin) {
                value = stMin
              }
              this.value = value
            }
          })
          el.searchTimes.addEventListener('blur', function() {
            if (this.value === '') {
              this.value = gm.config.removeHistorySearchTimes
            }
            if (this.value != el.searchTimes.current) {
              el.searchTimes.current = this.value
              gm.menu.history.openHandler()
            }
          })
          el.searchTimes.addEventListener('keyup', function(e) {
            if (e.key == 'Enter') {
              this.dispatchEvent(new Event('blur'))
            }
          })

          el.content.addEventListener('click', async function(e) {
            if (e.target.type == 'checkbox') {
              const box = e.target
              const status = box.checked
              const bvid = box.getAttribute('bvid')
              const note = status ? '添加到稍后再看' : '从稍后再看移除'
              const success = await webpage?.method.switchVideoWatchlaterStatus(bvid, status)
              if (success) {
                api.message.info(`${note}成功`)
              } else {
                box.checked = !status
                api.message.info(`${note}失败${status ? '，可能是因为该稿件不可用' : ''}`)
              }
            }
          })

          // 排序方式
          el.historySort = gm.el.history.querySelector('#gm-history-sort')
          el.historySort.type = 0
          el.historySort.typeText = ['降序', '升序', '完全升序']
          el.historySort.title = '点击切换升序'
          el.historySort.setType = function(type) {
            this.type = type
            this.textContent = this.typeText[type]
            this.title = `点击切换${this.typeText[(type + 1) % this.typeText.length]}`
          }
          el.historySort.addEventListener('click', function() {
            this.setType((this.type + 1) % this.typeText.length)
            gm.menu.history.openHandler()
          })

          gm.menu.history.openHandler = onOpen
          gm.el.history.fadeInDisplay = 'flex'
          el.shadow.addEventListener('click', () => _self.closeMenuItem('history'))
        }

        /**
         * 移除记录打开时执行
         */
        const onOpen = async () => {
          api.dom.fade(false, el.content)
          el.timePoint.textContent = gm.config.removeHistoryTimestamp ? '最后一次' : '第一次'

          try {
            const map = await webpage.method.getWatchlaterDataMap(item => item.bvid, 'bvid', true)
            const depth = Number.parseInt(el.searchTimes.current)
            let data = null
            if (el.historySort.type < 2) {
              data = gm.data.removeHistoryData().toArray(depth)
            } else {
              const rhd = gm.data.removeHistoryData()
              data = rhd.toArray(depth, rhd.size - depth)
            }
            el.saveTimes.textContent = data.length
            const history = []
            const result = []
            for (const record of data) {
              if (!map.has(record[0])) {
                history.push(record)
              }
            }

            if (gm.config.removeHistoryTimestamp) { // 两种情况有大量同类项，但合并后处理速度会降不少
              if (history.length > 1) {
                // ES2019 后 Array.prototype.sort() 为稳定排序
                history.sort((a, b) => (b[2] ?? 0) - (a[2] ?? 0))
                if (el.historySort.type >= 1) {
                  history.reverse()
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
              if (history.length > 1 && el.historySort.type >= 1) {
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
            el.removedNum.textContent = result.length

            if (result.length > 0) {
              el.content.innerHTML = result.join('')
              el.content.scrollTop = 0
            } else {
              setEmptyContent('没有找到移除记录，请尝试增大历史回溯深度')
            }
          } catch (e) {
            setEmptyContent(`网络连接错误或内部数据错误，初始化脚本或清空稍后再看历史数据或许能解决问题。无法解决时请提供反馈：<br><a style="color:inherit;font-weight:normal" href="${GM_info.script.supportURL}" target="_blank">${GM_info.script.supportURL}<a>`)
            api.logger.error(e)
          } finally {
            api.dom.fade(true, el.content)
          }
        }

        const setEmptyContent = text => {
          el.content.innerHTML = `<div class="gm-empty"><div>${text}</div></div>`
        }
      }
    }

    /**
     * 初始化脚本
     */
    async resetScript() {
      const result = await api.message.confirm('是否要初始化脚本？本操作不会清理稍后再看历史数据，要清理之请在用户设置中操作。')
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
    async clearRemoveHistoryData() {
      const result = await api.message.confirm('是否要清空稍后再看历史数据？')
      if (result) {
        GM_deleteValue('removeHistoryData')
        GM_deleteValue('removeHistoryFuzzyCompareReference')
        location.reload()
      }
    }

    /**
     * 取消所有固定项
     */
    async clearFixedItems() {
      const result = await api.message.confirm('是否要取消所有固定项？')
      if (result) {
        GM_setValue('fixedItems', [])
        document.querySelectorAll('.gm-fixed').forEach(item => item.classList?.remove('gm-fixed'))
        api.message.info('已取消所有固定项')
      }
    }

    /**
     * 对「打开菜单项」这一操作进行处理，包括显示菜单项、设置当前菜单项的状态、关闭其他菜单项
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 打开菜单项后的回调函数
     * @param {boolean} [keepOthers] 打开时保留其他菜单项
     * @returns {Promise<boolean>} 操作是否成功
     */
    async openMenuItem(name, callback, keepOthers) {
      const _self = this
      let success = false
      const menu = gm.menu[name]
      if (menu.wait > 0) return false
      try {
        try {
          if (menu.state == 1) {
            menu.wait = 1
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 2,
              timeout: 1500 + (menu.el.fadeInTime ?? gm.const.fadeTime),
            })
            return true
          } else if (menu.state == 3) {
            menu.wait = 1
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 0,
              timeout: 1500 + (menu.el.fadeOutTime ?? gm.const.fadeTime),
            })
          }
        } catch (e) {
          menu.state = -1
          api.logger.error(e)
        } finally {
          menu.wait = 0
        }
        if (menu.state == 0 || menu.state == -1) {
          for (const key in gm.menu) {
            /** @type {GMObject_menu_item} */
            const menu = gm.menu[key]
            if (key == name) {
              menu.state = 1
              await menu.openHandler?.()
              await new Promise(resolve => {
                api.dom.fade(true, menu.el, () => {
                  resolve()
                  menu.openedHandler?.()
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
     * @param {string} name 菜单项的名称
     * @param {() => void} [callback] 关闭菜单项后的回调函数
     * @returns {Promise<boolean>} 操作是否成功
     */
    async closeMenuItem(name, callback) {
      /** @type {GMObject_menu_item} */
      const menu = gm.menu[name]
      if (menu.wait > 0) return
      try {
        try {
          if (menu.state == 1) {
            menu.wait = 2
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 2,
              timeout: 1500 + (menu.el.fadeInTime ?? gm.const.fadeTime),
            })
          } else if (menu.state == 3) {
            menu.wait = 2
            await api.wait.waitForConditionPassed({
              condition: () => menu.state == 0,
              timeout: 1500 + (menu.el.fadeOutTime ?? gm.const.fadeTime),
            })
            return true
          }
        } catch (e) {
          menu.state = -1
          api.logger.error(e)
        } finally {
          menu.wait = 0
        }
        if (menu.state == 2 || menu.state == -1) {
          menu.state = 3
          await menu.closeHandler?.()
          await new Promise(resolve => {
            api.dom.fade(false, menu.el, () => {
              resolve()
              menu.closedHandler?.()
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
    /** 内部数据 */
    #data = {}

    /** 通用方法 */
    method = {
      obj: this,

      /**
       * 获取指定 Cookie
       * @param {string} key 键
       * @returns {string} 值
       * @see {@link https://developer.mozilla.org/zh-CN/docs/Web/API/Document/cookie#示例2_得到名为test2的cookie Document.cookie - Web API 接口参考 | MDN}
       */
      cookie(key) {
        return document.cookie.replace(new RegExp(String.raw`(?:(?:^|.*;\s*)${key}\s*=\s*([^;]*).*$)|^.*$`), '$1')
      },

      /**
       * 判断用户是否已登录
       * @returns {boolean} 用户是否已登录
       */
      isLogin() {
        return Boolean(this.getCSRF())
      },

      /**
       * 获取当前登录用户 ID
       * @returns {string} `DedeUserID`
       */
      getDedeUserID() {
        return this.cookie('DedeUserID')
      },

      /**
       * 获取 CSRF
       * @returns {string} `csrf`
       */
      getCSRF() {
        return this.cookie('bili_jct')
      },

      /**
       * av/bv 互转
       *
       * 保证 av < 2 ** 27 时正确，同时应该在 av < 2 ** 30 时正确
       * @see {@link https://www.zhihu.com/question/381784377/answer/1099438784 如何看待 2020 年 3 月 23 日哔哩哔哩将稿件的「av 号」变更为「BV 号」？ - 知乎 - mcfx 的回答}
       */
      bvTool: new class BvTool {
        constructor() {
          const table = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF'
          const tr = {}
          for (let i = 0; i < 58; i++) {
            tr[table[i]] = i
          }
          const s = [11, 10, 3, 8, 4, 6]
          const xor = 177451812
          const add = 8728348608
          this.bv2av = dec
          this.av2bv = enc

          function dec(x) {
            let r = 0
            for (let i = 0; i < 6; i++) {
              r += tr[x[s[i]]] * 58 ** i
            }
            return String((r - add) ^ xor)
          }

          function enc(x) {
            x = Number.parseInt(x)
            x = (x ^ xor) + add
            const r = 'BV1  4 1 7  '.split('')
            for (let i = 0; i < 6; i++) {
              r[s[i]] = table[Math.floor(x / 58 ** i) % 58]
            }
            return r.join('')
          }
        }
      }(),

      /**
       * 从 URL 获取视频 ID
       * @param {string} [url=location.pathname] 提取视频 ID 的源字符串
       * @returns {{id: string, type: 'aid' | 'bvid'}} `{id, type}`
       */
      getVid(url = location.pathname) {
        let m = null
        if ((m = /\/bv([\da-z]+)([#/?]|$)/i.exec(url))) {
          return { id: 'BV' + m[1], type: 'bvid' }
        } else if ((m = /\/(av)?(\d+)([#/?]|$)/i.exec(url))) { // 兼容 URL 中 BV 号被第三方修改为 AV 号的情况
          return { id: m[2], type: 'aid' }
        }
      },

      /**
       * 从 URL 获取视频 `aid`
       * @param {string} [url=location.pathname] 提取视频 `aid` 的源字符串
       * @returns {string} `aid`
       */
      getAid(url = location.pathname) {
        const _self = this
        const vid = _self.getVid(url)
        if (vid) {
          if (vid.type == 'bvid') {
            return _self.bvTool.bv2av(vid.id)
          }
          return vid.id
        }
        return null
      },

      /**
       * 从 URL 获取视频 `bvid`
       * @param {string} [url=location.pathname] 提取视频 `bvid` 的源字符串
       * @returns {string} `bvid`
       */
      getBvid(url = location.pathname) {
        const _self = this
        const vid = _self.getVid(url)
        if (vid) {
          if (vid.type == 'aid') {
            return _self.bvTool.av2bv(vid.id)
          }
          return vid.id
        }
        return null
      },

      /**
       * 根据 `aid` 获取视频的稍后再看状态
       * @param {string} aid 视频 `aid`
       * @param {boolean} [reload] 是否重新加载
       * @param {boolean} [pageCache] 是否禁用页面缓存
       * @param {boolean} [localCache=true] 是否使用本地缓存
       * @returns {Promise<boolean>} 视频是否在稍后再看中
       */
      async getVideoWatchlaterStatusByAid(aid, reload, pageCache, localCache = true) {
        const map = await this.getWatchlaterDataMap(item => String(item.aid), 'aid', reload, pageCache, localCache)
        return map.has(aid)
      },

      /**
       * 将视频加入稍后再看，或从稍后再看移除
       * @param {string} id 视频 `aid` 或 `bvid`（执行移除时优先选择 `aid`）
       * @param {boolean} [status=true] 添加 `true` / 移除 `false`
       * @returns {Promise<boolean>} 操作是否成功（视频不在稍后在看中不被判定为失败）
       */
      async switchVideoWatchlaterStatus(id, status = true) {
        const _self = this
        try {
          let typeA = !Number.isNaN(id)
          if (!typeA && !status) { // 移除 API 只支持 aid，先作转换
            id = _self.bvTool.bv2av(id)
            typeA = true
          }
          const data = new URLSearchParams()
          if (typeA) {
            data.append('aid', id)
          } else {
            data.append('bvid', id)
          }
          data.append('csrf', _self.getCSRF())
          return await api.web.request({
            method: 'POST',
            url: status ? gm.url.api_addToWatchlater : gm.url.api_removeFromWatchlater,
            data: data,
          }, { parser: 'check', check: r => r.code === 0 })
        } catch (e) {
          api.logger.error(e)
          return false
        }
      },

      /**
       * 清空稍后再看
       * @returns {Promise<boolean>} 操作是否成功
       */
      async clearWatchlater() {
        try {
          const data = new URLSearchParams()
          data.append('csrf', this.getCSRF())
          const success = await api.web.request({
            method: 'POST',
            url: gm.url.api_clearWatchlater,
            data: data,
          }, { parser: 'check', check: r => r.code === 0 })
          if (success) {
            gm.runtime.reloadWatchlaterListData = true
            window.dispatchEvent(new CustomEvent('reloadWatchlaterListData'))
          }
          return success
        } catch (e) {
          api.logger.error(e)
          return false
        }
      },

      /**
       * 移除稍后再看已观看视频
       * @returns {Promise<boolean>} 操作是否成功
       */
      async clearWatchedInWatchlater() {
        try {
          const data = new URLSearchParams()
          data.append('viewed', true)
          data.append('csrf', this.getCSRF())
          const success = await api.web.request({
            method: 'POST',
            url: gm.url.api_removeFromWatchlater,
            data: data,
          }, { parser: 'check', check: r => r.code === 0 })
          if (success) {
            gm.runtime.reloadWatchlaterListData = true
            window.dispatchEvent(new CustomEvent('reloadWatchlaterListData'))
          }
          return success
        } catch (e) {
          api.logger.error(e)
          return false
        }
      },

      /**
       * 使用稍后再看列表数据更新稍后再看历史数据
       * @param {boolean} [reload] 是否重新加载稍后再看列表数据
       */
      updateRemoveHistoryData(reload) {
        if (gm.config.removeHistory) {
          const removeHistorySaveTime = GM_getValue('removeHistorySaveTime') ?? 0
          const removeHistorySavePeriod = GM_getValue('updateRemoveHistoryData') ?? gm.configMap.removeHistorySavePeriod.default
          if (Date.now() - removeHistorySaveTime > removeHistorySavePeriod * 1000) {
            if (!gm.runtime.savingRemoveHistoryData) {
              gm.runtime.savingRemoveHistoryData = true
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
                      GM_setValue('removeHistorySaveTime', Date.now())
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
                    const timestamp = Date.now()
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
                  GM_setValue('removeHistorySaveTime', Date.now())
                }
              }).finally(() => {
                gm.runtime.savingRemoveHistoryData = false
              })
            }
          }
        }
      },

      /**
       * 获取稍后再看列表数据以指定值为键的映射
       * @param {(item: GMObject_data_item0) => *} key 计算键值的方法
       * @param {string} [cacheId] 缓存 ID，传入空值时不缓存
       * @param {boolean} [reload] 是否重新加载
       * @param {boolean} [pageCache] 是否使用页面缓存
       * @param {boolean} [localCache=true] 是否使用本地缓存
       * @returns {Promise<Map<string, GMObject_data_item0>>} 稍后再看列表数据以指定值为键的映射
       */
      async getWatchlaterDataMap(key, cacheId, reload, pageCache, localCache = true) {
        if (gm.runtime.reloadWatchlaterListData) {
          reload = true
        }
        let obj = null
        if (cacheId) {
          const $data = this.obj.#data
          if (!$data.watchlaterDataSet) {
            $data.watchlaterDataSet = {}
          }
          obj = $data.watchlaterDataSet
        }
        if (!obj?.[cacheId] || reload || !pageCache) {
          const map = new Map()
          const current = await gm.data.watchlaterListData(reload, pageCache, localCache)
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
        if (!location.search.includes(gm.id)) return
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
      },

      /**
       * 获取默认收藏夹 ID
       * @param {string} [uid] 用户 ID，缺省时指定当前登录用户
       * @returns {Promise<string>} `mlid`
       */
      async getDefaultMediaListId(uid = this.getDedeUserID()) {
        let mlid = GM_getValue(`defaultMediaList_${uid}`)
        if (!mlid) {
          const data = new URLSearchParams()
          data.append('up_mid', uid)
          data.append('type', 2)
          const resp = await api.web.request({
            url: `${gm.url.api_listFav}?${data.toString()}`,
          }, { check: r => r.code === 0 })
          mlid = String(resp.data.list[0].id)
          GM_setValue(`defaultMediaList_${uid}`, mlid)
        }
        return mlid
      },

      /**
       * 将视频添加到收藏夹
       * @param {string} aid `aid`
       * @param {string} mlid 收藏夹 ID
       * @returns {Promise<boolean>} 操作是否成功
       */
      async addToFav(aid, mlid) {
        try {
          const data = new URLSearchParams()
          data.append('rid', aid)
          data.append('type', 2)
          data.append('add_media_ids', mlid)
          data.append('csrf', this.getCSRF())
          return await api.web.request({
            method: 'POST',
            url: gm.url.api_dealFav,
            data: data,
          }, { parser: 'check', check: r => r.code === 0 })
        } catch (e) {
          api.logger.error(e)
          return false
        }
      },

      /**
       * 获取稿件 `state` 说明
       * @param {number} state 稿件状态
       * @returns {string} 说明
       * @see {@link https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/attribute_data.md#state字段值稿件状态 state字段值(稿件状态)}
       */
      getItemStateDesc(state) {
        return ({
          [1]: '橙色通过',
          [0]: '开放浏览',
          [-1]: '待审',
          [-2]: '被打回',
          [-3]: '网警锁定',
          [-4]: '被锁定',
          [-5]: '管理员锁定',
          [-6]: '修复待审',
          [-7]: '暂缓审核',
          [-8]: '补档待审',
          [-9]: '等待转码',
          [-10]: '延迟审核',
          [-11]: '视频源待修',
          [-12]: '转储失败',
          [-13]: '允许评论待审',
          [-14]: '临时回收站',
          [-15]: '分发中',
          [-16]: '转码失败',
          [-20]: '创建未提交',
          [-30]: '创建已提交',
          [-40]: '定时发布',
          [-100]: '用户删除',
        })[state] ?? '未知状态'
      },
    }

    /**
     * 顶栏中加入稍后再看入口
     */
    addHeaderButton() {
      const _self = this
      if (gm.config.headerCompatible == Enums.headerCompatible.bilibiliEvolved) {
        api.wait.$('.custom-navbar [data-name=watchlaterList]').then(el => {
          const watchlater = el.parentElement.appendChild(el.cloneNode(true))
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
        api.base.addStyle(`
          #${gm.id} .gm-entrypopup[gm-compatible] .gm-popup-arrow {
            display: none;
          }
          #${gm.id} .gm-entrypopup[gm-compatible] .gm-entrypopup-page {
            box-shadow: rgb(0 0 0 / 20%) 0 4px 8px 0;
            border-radius: 8px;
            margin-top: -12px;
          }
        `)
      } else {
        api.wait.$('.user-con.signin').then(header => {
          const collect = header.children[4]
          const watchlater = document.createElement('div')
          watchlater.className = 'item'
          watchlater.innerHTML = '<a><span class="name">稍后再看</span></a>'
          collect.before(watchlater)
          processClickEvent(watchlater)
          processPopup(watchlater)
        })
      }

      /**
       * 处理清空稍后再看
       * @returns {Promise<boolean>} 是否清空成功
       */
      async function clearWatchlater() {
        let success = false
        const result = await api.message.confirm('是否清空稍后再看？')
        if (result) {
          success = await _self.method.clearWatchlater()
          if (success && api.base.urlMatch(gm.regex.page_watchlaterList)) {
            location.reload()
          } else {
            api.message.info(`清空稍后再看${success ? '成功' : '失败'}`)
          }
        }
        return success
      }

      /**
       * 移除稍后再看已观看视频
       * @returns {Promise<boolean>} 是否移除成功
       */
      async function clearWatchedInWatchlater() {
        let success = false
        const result = await api.message.confirm('是否移除已观看视频？')
        if (result) {
          success = await _self.method.clearWatchedInWatchlater()
          if (success && api.base.urlMatch(gm.regex.page_watchlaterList)) {
            location.reload()
          } else {
            api.message.info(`移除已观看视频${success ? '成功' : '失败'}`)
          }
        }
        return success
      }

      /**
       * 处理鼠标点击事件
       * @param {HTMLElement} watchlater 稍后再看入口元素
       */
      function processClickEvent(watchlater) {
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
            case Enums.headerButtonOp.openBatchAddManager:
              script.openBatchAddManager()
              break
          }
        }
        watchlater.addEventListener('mousedown', function(e) {
          if (e.button != 2) {
            process(e.button)
            e.preventDefault()
          }
        })
        watchlater.addEventListener('contextmenu', function(e) {
          process(2) // 整合写进 mousedown 中会导致无法阻止右键菜单弹出
          e.preventDefault()
        })
      }

      /**
       * 处理弹出菜单
       * @param {HTMLElement} watchlater 稍后再看元素
       */
      function processPopup(watchlater) {
        if (gm.config.headerMenu == Enums.headerMenu.disable) return
        gm.menu.entryPopup.el = document.createElement('div')
        const popup = gm.menu.entryPopup.el
        // 模仿官方顶栏弹出菜单的弹出与关闭效果
        popup.fadeInFunction = 'cubic-bezier(0.68, -0.55, 0.27, 1.55)'
        popup.fadeOutFunction = 'cubic-bezier(0.6, -0.3, 0.65, 1)'
        popup.fadeOutNoInteractive = true
        // 此处必须用 over；若用 enter，且网页刚加载完成时鼠标正好在入口上，无法轻移鼠标以触发事件
        watchlater.addEventListener('mouseover', onOverWatchlater)
        watchlater.addEventListener('mouseleave', onLeaveWatchlater)
        popup.addEventListener('mouseenter', onEnterPopup)
        popup.addEventListener('mouseleave', onLeavePopup)

        /**
         * 鼠标是否在顶栏内
         * @param {MouseEvent} e 事件
         */
        function withinHeader(e) {
          const y = e.clientY
          const rect = watchlater.getBoundingClientRect()
          const trim = 2 // e.clientY 在旧标准中为长整型，向内修正以确保正确性（此处理论取 1 即可）
          return y >= rect.top + trim && y <= rect.bottom - trim
        }

        /**
         * 进入稍后再看入口的处理
         */
        function onOverWatchlater() {
          if (this.mouseOver) return
          this.mouseOver = true
          // 预加载数据，延时以在避免误触与加载速度间作平衡
          if (gm.config.watchlaterListCacheValidPeriod > 0) {
            setTimeout(() => {
              if (this.mouseOver) {
                gm.data.watchlaterListData()
              }
            }, 25) // 以鼠标快速掠过不触发为准
          }
          // 完整加载，延时以避免误触
          // 误触率与弹出速度正相关，与数据加载时间无关
          setTimeout(() => {
            if (this.mouseOver) {
              popup.style.position = api.dom.isFixed(watchlater.offsetParent) ? 'fixed' : ''
              const rect = watchlater.getBoundingClientRect()
              popup.style.top = `${rect.bottom}px`
              popup.style.left = `calc(${(rect.left + rect.right) / 2}px - 16em)`
              openEntryPopup()
            }
          }, 125) // 以鼠标中速掠过不触发为准
        }

        /**
         * 离开稍后再看入口的处理
         * @param {MouseEvent} e 事件
         */
        function onLeaveWatchlater(e) {
          this.mouseOver = false
          if (withinHeader(e)) {
            script.closeMenuItem('entryPopup')
          } else {
            setTimeout(() => {
              if (!this.mouseOver && !popup.mouseOver) {
                script.closeMenuItem('entryPopup')
              }
            }, 150)
          }
        }

        /**
         * 进入弹出菜单的处理
         */
        function onEnterPopup() {
          this.mouseOver = true
        }

        /**
         * 离开弹出菜单的处理
         */
        function onLeavePopup() {
          this.mouseOver = false
          setTimeout(() => {
            if (!this.mouseOver && !watchlater.mouseOver) {
              script.closeMenuItem('entryPopup')
            }
          }, 50)
        }
      }

      /**
       * 打开入口弹出菜单
       */
      function openEntryPopup() {
        if (gm.el.entryPopup) {
          script.openMenuItem('entryPopup')
        } else {
          /** @type {{[n: string]: HTMLElement}} */
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
              <div class="gm-entrypopup-page">
                <div class="gm-popup-header">
                  <div class="gm-search">
                    <input type="text" placeholder="在列表中搜索... 支持通配符 ( ? * )">
                    <div class="gm-search-clear">✖</div>
                  </div>
                  <div class="gm-popup-total" title="列表条目数">0</div>
                </div>
                <div class="gm-entry-list-empty">稍后再看列表为空</div>
                <div class="gm-entry-list"></div>
                <div class="gm-entry-list gm-entry-removed-list"></div>
                <div class="gm-entry-bottom">
                  <a class="gm-entry-button" fn="setting" href="${gm.url.noop}" target="_self">设置</a>
                  <a class="gm-entry-button" fn="history" href="${gm.url.noop}" target="_self">历史</a>
                  <a class="gm-entry-button" fn="removeAll" href="${gm.url.noop}" target="_self">清空</a>
                  <a class="gm-entry-button" fn="removeWatched" href="${gm.url.noop}" target="_self">移除已看</a>
                  <a class="gm-entry-button" fn="showAll" href="${gm.url.page_watchlaterList}" target="${target}">显示</a>
                  <a class="gm-entry-button" fn="playAll" href="${gm.url.page_watchlaterPlayAll}" target="${target}">播放</a>
                  <a class="gm-entry-button" fn="sortControl" href="${gm.url.noop}" target="_self">
                    <div class="gm-select">
                      <div class="gm-selected" value="">排序</div>
                      <div class="gm-options">
                        <div class="gm-option" value="${Enums.sortType.fixed}">固定</div>
                        <div class="gm-option" value="${Enums.sortType.title}">标题</div>
                        ${gm.config.headerMenu == Enums.headerMenu.enable ? `
                          <div class="gm-option" value="${Enums.sortType.uploader}">UP主</div>
                          <div class="gm-option" value="${Enums.sortType.progress}">进度</div>
                        ` : ''}
                        <div class="gm-option" value="${Enums.sortType.durationR}">时长↓</div>
                        <div class="gm-option" value="${Enums.sortType.duration}">时长</div>
                        <div class="gm-option" value="${Enums.sortType.defaultR}">默认↓</div>
                        <div class="gm-option gm-option-selected" value="${Enums.sortType.default}">默认</div>
                      </div>
                    </div>
                  </a>
                  <a class="gm-entry-button" fn="autoRemoveControl" href="${gm.url.noop}" target="_self">移除</a>
                </div>
              </div>
            `
            el.entryList = gm.el.entryPopup.querySelector('.gm-entry-list')
            el.entryRemovedList = gm.el.entryPopup.querySelector('.gm-entry-removed-list')
            el.entryListEmpty = gm.el.entryPopup.querySelector('.gm-entry-list-empty')
            el.entryHeader = gm.el.entryPopup.querySelector('.gm-popup-header')
            el.search = gm.el.entryPopup.querySelector('.gm-search input')
            el.searchClear = gm.el.entryPopup.querySelector('.gm-search-clear')
            el.popupTotal = gm.el.entryPopup.querySelector('.gm-popup-total')
            el.entryBottom = gm.el.entryPopup.querySelector('.gm-entry-bottom')
          }

          /**
           * 维护内部元素
           */
          const processPopup = () => {
            gm.menu.entryPopup.openHandler = onOpen
            gm.menu.entryPopup.openedHandler = () => {
              if (gm.config.headerMenuSearch) {
                el.search.setSelectionRange(0, el.search.value.length)
                el.search.focus()
              }
            }

            if (gm.config.headerMenuSearch) {
              el.search.addEventListener('input', function() {
                const m = /^\s+(.*)/.exec(this.value)
                if (m) {
                  this.value = m[1]
                  this.setSelectionRange(0, 0)
                }
                el.searchClear.style.visibility = this.value.length > 0 ? 'visible' : ''
              })
              el.search.addEventListener('input', api.base.throttle(function() {
                let val = this.value.trim()
                const match = str => str && val?.test(str)
                const lists = gm.config.headerMenuKeepRemoved ? [el.entryList, el.entryRemovedList] : [el.entryList]
                if (val.length > 0) {
                  try {
                    val = val.replace(/[$()+.[\\\]^{|}]/g, '\\$&') // escape regex
                      .replaceAll('?', '.').replaceAll('*', '.+') // 通配符
                    val = new RegExp(val, 'i')
                  } catch {
                    val = null
                  }
                } else {
                  val = null
                }
                const cnt = [0, 0]
                for (const [i, list] of lists.entries()) {
                  if (list.total > 0) {
                    for (let j = 0; j < list.childElementCount; j++) {
                      let valid = false
                      const card = list.children[j]
                      if (val) {
                        if (match(card.vTitle)) {
                          valid = true
                        } else if (match(card.uploader)) {
                          valid = true
                        }
                      } else {
                        valid = true
                      }
                      if (valid) {
                        cnt[i] += 1
                        card.classList.remove('gm-filtered')
                      } else {
                        card.classList.add('gm-filtered')
                      }
                    }
                    list.scrollTop = 0
                  }
                }
                el.popupTotal.textContent = `${cnt[0]}${cnt[1] > 0 ? `/${cnt[0] + cnt[1]}` : ''}`
                if (cnt[0]) {
                  el.entryListEmpty.style.display = 'none'
                } else {
                  el.entryListEmpty.style.display = 'unset'
                }
              }, gm.const.inputThrottleWait))
              el.searchClear.addEventListener('click', function() {
                el.search.value = ''
                el.search.dispatchEvent(new Event('input'))
              })
            } else {
              el.entryHeader.style.display = 'none'
            }

            el.entryFn = {}
            el.entryBottom.querySelectorAll('.gm-entry-button').forEach(button => {
              const fn = button.getAttribute('fn')
              if (fn) {
                el.entryFn[fn] = button
              }
            })

            // 排序控制器
            {
              el.entryFn.sortControl.control = el.entryFn.sortControl.firstElementChild
              const control = el.entryFn.sortControl.control
              const selected = control.selected = control.children[0]
              const options = control.options = control.children[1]

              const defaultSelect = options.querySelector('.gm-option-selected') ?? options.firstElementChild
              if (gm.config.autoSort != Enums.autoSort.default) {
                let type = gm.config.autoSort
                if (type == Enums.autoSort.auto) {
                  type = GM_getValue('autoSort_auto')
                  if (!type) {
                    type = Enums.sortType.default
                    GM_setValue('autoSort_auto', type)
                  }
                }
                selected.option = options.querySelector(`[value="${type}"]`)
                if (selected.option) {
                  defaultSelect?.classList.remove('gm-option-selected')
                  selected.option.classList.add('gm-option-selected')
                  selected.setAttribute('value', selected.option.getAttribute('value'))
                } else if (gm.config.autoSort == Enums.autoSort.auto) {
                  type = Enums.sortType.default
                  GM_setValue('autoSort_auto', type)
                }
              }
              if (!selected.option) {
                selected.option = defaultSelect
                if (selected.option) {
                  selected.option.classList.add('gm-option-selected')
                  selected.setAttribute('value', selected.option.getAttribute('value'))
                }
              }

              if (gm.config.headerMenuSortControl) {
                el.entryFn.sortControl.setAttribute('enabled', '')
                options.fadeOutNoInteractive = true

                el.entryFn.sortControl.addEventListener('click', function() {
                  if (!control.selecting) {
                    control.selecting = true
                    api.dom.fade(true, options)
                  }
                })
                el.entryFn.sortControl.addEventListener('mouseenter', function() {
                  control.selecting = true
                  api.dom.fade(true, options)
                })
                el.entryFn.sortControl.addEventListener('mouseleave', function() {
                  control.selecting = false
                  api.dom.fade(false, options)
                })
                options.addEventListener('click', function(/** @type {MouseEvent} */ e) {
                  control.selecting = false
                  api.dom.fade(false, this)
                  const val = e.target.getAttribute('value')
                  if (selected.getAttribute('value') != val) {
                    selected.option.classList.remove('gm-option-selected')
                    selected.setAttribute('value', val)
                    selected.option = e.target
                    selected.option.classList.add('gm-option-selected')
                    if (gm.config.autoSort == Enums.autoSort.auto) {
                      GM_setValue('autoSort_auto', val)
                    }
                    sort(val)
                  }
                })
              }
            }

            // 自动移除控制器
            const cfgAutoRemove = gm.config.autoRemove
            const autoRemove = cfgAutoRemove == Enums.autoRemove.always || cfgAutoRemove == Enums.autoRemove.openFromList
            el.entryFn.autoRemoveControl.autoRemove = autoRemove
            if (gm.config.headerMenuAutoRemoveControl) {
              if (cfgAutoRemove == Enums.autoRemove.absoluteNever) {
                el.entryFn.autoRemoveControl.setAttribute('disabled', '')
                el.entryFn.autoRemoveControl.addEventListener('click', function() {
                  api.message.info('当前彻底禁用自动移除功能，无法执行操作')
                })
              } else {
                if (autoRemove) {
                  el.entryFn.autoRemoveControl.classList.add('gm-popup-auto-remove')
                }
                el.entryFn.autoRemoveControl.addEventListener('click', function() {
                  if (this.autoRemove) {
                    this.classList.remove('gm-popup-auto-remove')
                    api.message.info('已临时关闭自动移除功能')
                  } else {
                    this.classList.add('gm-popup-auto-remove')
                    api.message.info('已临时开启自动移除功能')
                  }
                  this.autoRemove = !this.autoRemove
                })
              }
              el.entryFn.autoRemoveControl.setAttribute('enabled', '')
            }
            // 常规项
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
            if (el.entryBottom.querySelectorAll('[enabled]').length === 0) {
              el.entryBottom.style.display = 'none'
            }
          }

          /**
           * 打开时弹出菜单时执行
           */
          const onOpen = async () => {
            // 上半区被移除卡片先于下半区被查询到，恰巧使得后移除视频最后生成在被移除列表前方，无须额外排序
            const rmCards = gm.config.headerMenuKeepRemoved ? gm.el.entryPopup.querySelectorAll('.gm-removed') : null
            let rmBvid = null
            if (rmCards?.length > 0) {
              rmBvid = new Set()
              for (const rmCard of rmCards) {
                rmBvid.add(rmCard.bvid)
              }
            }
            const fixedItems = GM_getValue('fixedItems') ?? []
            gm.menu.entryPopup.sortType = Enums.sortType.default
            el.popupTotal.textContent = '0'
            el.entryList.textContent = ''
            el.entryList.total = 0
            el.entryRemovedList.textContent = ''
            el.entryRemovedList.total = 0
            const data = await gm.data.watchlaterListData()
            const simplePopup = gm.config.headerMenu == Enums.headerMenu.enableSimple
            let serial = 0
            if (data.length > 0) {
              const openLinkInCurrent = gm.config.openHeaderMenuLink == Enums.openHeaderMenuLink.openInCurrent
              const redirect = gm.config.redirect
              const autoRemoveControl = el.entryFn.autoRemoveControl
              for (const item of data) {
                /** @type {HTMLAnchorElement} */
                const card = el.entryList.appendChild(document.createElement('a'))
                card.serial = serial++
                const valid = item.state >= 0
                card.vTitle = item.title
                card.bvid = item.bvid
                card.duration = item.duration
                if (rmBvid?.size > 0) {
                  if (rmBvid.has(card.bvid)) {
                    rmBvid.delete(card.bvid)
                  }
                }
                if (simplePopup) {
                  if (valid) {
                    card.textContent = card.vTitle
                  } else {
                    card.innerHTML = `<b>[${_self.method.getItemStateDesc(item.state)}]</b> ${card.vTitle}`
                  }
                  card.className = 'gm-entry-list-simple-item'
                } else {
                  card.uploader = item.owner.name
                  const multiP = item.videos > 1
                  const duration = _self.method.getSTimeString(item.duration)
                  const durationP = multiP ? `${item.videos}P` : duration
                  if (item.progress < 0) {
                    item.progress = card.duration
                  }
                  const played = item.progress > 0
                  card.progress = (multiP && played) ? card.duration : item.progress
                  let progress = ''
                  if (played) {
                    if (multiP) {
                      progress = '已观看'
                    } else {
                      progress = _self.method.getSTimeString(item.progress)
                    }
                  }
                  card.className = `gm-entry-list-item${multiP ? ' gm-card-multiP' : ''}`
                  card.innerHTML = `
                    <div class="gm-card-left">
                      <img class="gm-card-cover" src="${item.pic}@156w_88h_1c_100q.webp">
                      <div class="gm-card-switcher"></div>
                      <div class="gm-card-duration">
                        <div${multiP ? ' class="gm-hover"' : ''}>${duration}</div>
                        ${multiP ? `<div>${durationP}</div>` : ''}
                      </div>
                    </div>
                    <div class="gm-card-right">
                      <div class="gm-card-title">${valid ? card.vTitle : `<b>[${_self.method.getItemStateDesc(item.state)}]</b> ${card.vTitle}`}</div>
                      <a class="gm-card-uploader" target="_blank" href="${gm.url.page_userSpace(item.owner.mid)}">${card.uploader}</a>
                      <div class="gm-card-corner">
                        <span class="gm-card-progress">${progress}</span>
                        <span class="gm-card-fixer gm-hover" title="${gm.const.fixerHint}">固定</span>
                        <span class="gm-card-collector gm-hover" title="将视频移动至指定收藏夹">收藏</span>
                      </div>
                    </div>
                  `
                  if (played) {
                    card.querySelector('.gm-card-progress').style.display = 'unset'
                  }

                  const switchStatus = async (status, dispInfo = true) => {
                    if (status) { // 先改了 UI 再说，不要给用户等待感
                      card.classList.remove('gm-removed')
                    } else {
                      card.classList.add('gm-removed')
                    }
                    const note = status ? '添加到稍后再看' : '从稍后再看移除'
                    const success = await _self.method.switchVideoWatchlaterStatus(item.aid, status)
                    if (success) {
                      card.added = status
                      if (card.fixed) {
                        card.fixed = false
                        gm.data.fixedItem(card.bvid, false)
                        card.classList.remove('gm-fixed')
                      }
                      dispInfo && api.message.info(`${note}成功`)
                      gm.runtime.reloadWatchlaterListData = true
                      window.dispatchEvent(new CustomEvent('reloadWatchlaterListData'))
                    } else {
                      if (card.added) {
                        card.classList.remove('gm-removed')
                      } else {
                        card.classList.add('gm-removed')
                      }
                      dispInfo && api.message.info(`${note}失败`)
                    }
                  }

                  card.added = true
                  card.querySelector('.gm-card-switcher').addEventListener('click', function(e) {
                    e.preventDefault()
                    switchStatus(!card.added)
                  })

                  card.querySelector('.gm-card-collector').addEventListener('click', function(e) {
                    e.preventDefault() // 不能放到 async 中
                    setTimeout(async () => {
                      const uid = _self.method.getDedeUserID()
                      let mlid = GM_getValue(`watchlaterMediaList_${uid}`)
                      let dmlid = false
                      if (!mlid) {
                        mlid = await _self.method.getDefaultMediaListId(uid)
                        dmlid = true
                      }
                      const success = await _self.method.addToFav(item.aid, mlid)
                      if (success) {
                        api.message.info(dmlid ? '移动至默认收藏夹成功' : '移动至指定收藏夹成功')
                        if (card.added) {
                          switchStatus(false, false)
                        }
                      } else {
                        api.message.info(dmlid ? '移动至默认收藏夹失败' : `移动至收藏夹 ${mlid} 失败，请确认该收藏夹是否存在`)
                      }
                    })
                  })

                  const fixer = card.querySelector('.gm-card-fixer')
                  fixer.addEventListener('click', function(e) {
                    e.preventDefault()
                    if (card.fixed) {
                      card.classList.remove('gm-fixed')
                    } else {
                      card.classList.add('gm-fixed')
                    }
                    card.fixed = !card.fixed
                    gm.data.fixedItem(card.bvid, card.fixed)
                  })
                  fixer.addEventListener('contextmenu', function(e) {
                    e.preventDefault()
                    script.clearFixedItems()
                  })
                }
                const fixedIdx = fixedItems.indexOf(card.bvid)
                if (fixedIdx >= 0) {
                  fixedItems.splice(fixedIdx, 1)
                  card.fixed = true
                  card.classList.add('gm-fixed')
                }
                if (valid) {
                  card.target = openLinkInCurrent ? '_self' : '_blank'
                  if (redirect) {
                    card.href = `${gm.url.page_videoNormalMode}/${card.bvid}`
                  } else {
                    card.href = `${gm.url.page_videoWatchlaterMode}/${card.bvid}`
                  }
                  if (gm.config.autoRemove != Enums.autoRemove.absoluteNever) {
                    const excludes = ['gm-card-switcher', 'gm-card-uploader', 'gm-card-fixer', 'gm-card-collector']
                    card._originalHref = card.href
                    card.addEventListener('mousedown', function(e) {
                      if (e.button == 0 || e.button == 1) { // 左键或中键
                        if (card.fixed) return
                        if (!simplePopup && api.dom.containsClass(e.target, excludes)) return
                        if (autoRemoveControl.autoRemove) {
                          if (gm.config.autoRemove != Enums.autoRemove.always) {
                            const url = new URL(this.href)
                            url.searchParams.set(`${gm.id}_remove`, 'true')
                            this.href = url.href
                          } else {
                            this.href = this._originalHref
                          }
                        } else {
                          if (gm.config.autoRemove == Enums.autoRemove.always) {
                            const url = new URL(this.href)
                            url.searchParams.set(`${gm.id}_disable_remove`, 'true')
                            this.href = url.href
                          } else {
                            this.href = this._originalHref
                          }
                        }
                      }
                    })
                    card.addEventListener('mouseup', function(e) {
                      if (e.button == 0 || e.button == 1) { // 左键或中键
                        if (card.fixed) return
                        if (!simplePopup) {
                          if (!card.added) return
                          if (api.dom.containsClass(e.target, excludes)) return
                        }
                        if (autoRemoveControl.autoRemove) {
                          card.classList.add('gm-removed')
                          card.added = false
                          gm.runtime.reloadWatchlaterListData = true
                          // 移除由播放页控制，此时并为实际发生，不分发重载列表事件
                        }
                      }
                    })
                  }
                } else {
                  card.classList.add('gm-invalid')
                  card.target = '_self'
                  card.href = gm.url.noop
                }
              }
              el.entryList.total = data.length
            } else {
              el.entryListEmpty.style.display = 'unset'
            }

            // 移除无效固定项
            for (const item of fixedItems) {
              gm.data.fixedItem(item, false)
            }

            // 添加已移除视频
            if (rmCards?.length > 0) {
              const addedBvid = new Set()
              for (const rmCard of rmCards) {
                rmCard.serial = serial++
                const bvid = rmCard.bvid
                if (addedBvid.has(bvid)) continue
                if (rmBvid.has(bvid)) {
                  if (rmCard.style.display == 'none') {
                    rmCard.style.display = ''
                  }
                } else {
                  rmCard.style.display = 'none'
                }
                el.entryRemovedList.append(rmCard)
                addedBvid.add(bvid)
              }
            }
            if (rmBvid?.size > 0) {
              const only1 = rmBvid.size == 1
              const h = simplePopup ? (only1 ? 6 : 9) : (only1 ? 6.4 : 11)
              el.entryList.style.height = `${42 - h}em`
              el.entryRemovedList.style.height = `${h}em`
              el.entryRemovedList.style.display = 'flex'
              el.entryRemovedList.total = rmBvid.size
              el.entryRemovedList.querySelectorAll('.gm-fixed').forEach(el => {
                el.classList.remove('gm-fixed')
                el.fixed = false
              })
            } else {
              el.entryList.style.height = ''
              el.entryRemovedList.style.display = ''
            }

            el.popupTotal.textContent = `${el.entryList.total}${el.entryRemovedList.total > 0 ? `/${el.entryList.total + el.entryRemovedList.total}` : ''}`
            if (gm.config.removeHistory && gm.config.removeHistorySavePoint == Enums.removeHistorySavePoint.listAndMenu) {
              _self.method.updateRemoveHistoryData()
            }

            gm.el.entryPopup.style.display = 'unset'
            el.entryList.scrollTop = 0
            el.entryRemovedList.scrollTop = 0

            const sortType = el.entryFn.sortControl.control.selected.getAttribute('value')
            sortType && sort(sortType)
            if (el.search.value.length > 0) {
              el.search.dispatchEvent(new Event('input'))
            }
          }

          /**
           * 对弹出菜单列表中的内容进行排序
           * @param {sortType} type 排序类型
           */
          const sort = type => {
            if (type == gm.menu.entryPopup.sortType) return
            const prevBase = gm.menu.entryPopup.sortType.replace(/:R$/, '')
            gm.menu.entryPopup.sortType = type
            if (type == Enums.sortType.fixed) {
              type = Enums.sortType.default
              el.entryList.setAttribute('sort-type-fixed', '')
            } else {
              el.entryList.removeAttribute('sort-type-fixed')
            }
            const reverse = type.endsWith(':R')
            const k = type.replace(/:R$/, '')

            const lists = []
            if (el.entryList.total > 1) {
              lists.push(el.entryList)
            }
            if (el.entryRemovedList.total > 1) {
              lists.push(el.entryRemovedList)
            }
            for (const list of lists) {
              if (k != prevBase) {
                const cards = [...list.children]
                cards.sort((a, b) => {
                  let result = 0
                  const va = a[k]
                  const vb = b[k]
                  if (typeof va == 'string') {
                    result = va.localeCompare(vb)
                  } else if (!Number.isNaN(va)) {
                    result = va - vb
                  }
                  return result
                })
                cards.forEach((card, idx) => {
                  card.style.order = idx
                })
              }
              if (reverse) {
                list.setAttribute('gm-list-reverse', '')
                list.scrollTop = -list.scrollHeight
              } else {
                list.removeAttribute('gm-list-reverse')
                list.scrollTop = 0
              }
            }
          }
        }
      }

      /**
       * 获取入口点击的链接设置
       * @param {headerButtonOp} op
       * @returns {{href: string, target: '_self' | '_blank'}}
       */
      function getHeaderButtonOpConfig(op) {
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
          case Enums.headerButtonOp.openBatchAddManager:
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
        return result
      }
    }

    /**
     * 填充稍后再看状态
     */
    async fillWatchlaterStatus() {
      const _self = this
      let map = null
      const initMap = async () => {
        map = await _self.method.getWatchlaterDataMap(item => String(item.aid), 'aid', false, true)
      }
      if (api.base.urlMatch(gm.regex.page_dynamicMenu)) { // 必须在动态页之前匹配
        fillWatchlaterStatus_dynamicMenu()
      } else if (api.base.urlMatch(gm.regex.page_dynamic)) {
        if (location.pathname == '/') { // 仅动态主页
          api.wait.$('.feed-card').then(feed => {
            api.wait.executeAfterElementLoaded({
              selector: '.tab:not(#gm-batch-manager-btn)',
              base: feed,
              multiple: true,
              callback: tab => {
                tab.addEventListener('click', refillDynamicWatchlaterStatus)
              },
            })
            window.addEventListener('reloadWatchlaterListData', api.base.debounce(refillDynamicWatchlaterStatus, 2000))
            fillWatchlaterStatus_dynamic()

            async function refillDynamicWatchlaterStatus() {
              map = await _self.method.getWatchlaterDataMap(item => String(item.aid), 'aid', true)
              // map 更新期间，ob 偷跑可能会将错误的数据写入，重新遍历并修正之
              feed.querySelectorAll('.video-container').forEach(video => {
                const vue = video.__vue__
                if (vue) {
                  const aid = String(vue.aid)
                  if (map.has(aid)) {
                    vue.seeLaterStatus = 1
                  } else {
                    vue.seeLaterStatus = 0
                  }
                }
              })
            }
          })
        }
      } else if (api.base.urlMatch(gm.regex.page_userSpace)) {
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
            if (api.base.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode])) {
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

      /**
       * 填充动态页稍后再看状态
       */
      async function fillWatchlaterStatus_dynamic() {
        await initMap()
        api.wait.executeAfterElementLoaded({
          selector: '.video-container',
          base: await api.wait.$('.feed-card'),
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
       */
      async function fillWatchlaterStatus_dynamicMenu() {
        await initMap()
        api.wait.executeAfterElementLoaded({
          selector: '.list-item',
          base: await api.wait.$('.video-list'),
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
      async function fillWatchlaterStatus_main() {
        await initMap()
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
     * 在播放页加入快速切换稍后再看状态的按钮
     */
    async addVideoButton() {
      const _self = this
      let bus = {}

      const app = await api.wait.$('#app')
      const atr = await api.wait.$('#arc_toolbar_report', app)
      const original = await api.wait.$('.van-watchlater', atr)
      api.wait.waitForConditionPassed({
        condition: () => app.__vue__,
      }).then(async () => {
        const btn = document.createElement('label')
        btn.id = `${gm.id}-video-btn`
        const cb = btn.appendChild(document.createElement('input'))
        cb.type = 'checkbox'
        const text = btn.appendChild(document.createElement('span'))
        text.textContent = '稍后再看'
        btn.className = 'appeal-text'
        cb.addEventListener('click', function() {
          processSwitch()
        })
        atr.append(btn)

        const aid = _self.method.getAid()
        bus = { btn, cb, aid }
        initButtonStatus()
        original.parentElement.style.display = 'none'

        bus.pathname = location.pathname
        window.addEventListener('urlchange', async function() {
          if (location.pathname == bus.pathname) return // 并非切换视频（如切分P）
          bus.pathname = location.pathname
          bus.aid = _self.method.getAid()
          let reloaded = false
          gm.searchParams = new URL(location.href).searchParams
          const removed = await _self.processAutoRemove()
          if (gm.config.removeHistory && gm.config.removeHistorySavePoint == Enums.removeHistorySavePoint.anypage) {
            // 本来没必要强制刷新，但后面查询状态必须要新数据，搭个顺风车
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
       */
      async function initButtonStatus() {
        const setStatus = async status => {
          status ??= await _self.method.getVideoWatchlaterStatusByAid(bus.aid, false, true)
          bus.btn.added = status
          bus.cb.checked = status
        }
        if (gm.data.fixedItem(_self.method.getBvid())) {
          setStatus(true)
        } else {
          const alwaysAutoRemove = gm.config.autoRemove == Enums.autoRemove.always
          const spRemove = gm.searchParams.get(`${gm.id}_remove`) == 'true'
          const spDisableRemove = gm.searchParams.get(`${gm.id}_disable_remove`) == 'true'
          if ((!alwaysAutoRemove && !spRemove) || spDisableRemove) {
            setStatus()
          }
        }
        // 如果当前视频应当被移除，那就不必读取状态了
        // 注意，哪处代码先执行不确定，不过从理论上来说这里应该是会晚执行
        // 当然，自动移除的操作有可能会失败，但两处代码联动太麻烦了，还会涉及到切换其他视频的问题，综合考虑之下对这种小概率事件不作处理
      }

      /**
       * 处理视频状态的切换
       */
      async function processSwitch() {
        const btn = bus.btn
        const cb = bus.cb
        const note = btn.added ? '从稍后再看移除' : '添加到稍后再看'
        const success = await _self.method.switchVideoWatchlaterStatus(bus.aid, !btn.added)
        if (success) {
          btn.added = !btn.added
          cb.checked = btn.added
          api.message.info(`${note}成功`)
        } else {
          cb.checked = btn.added
          api.message.info(`${note}失败${!btn.added ? '，可能是因为稍后再看不支持该稿件类型（如互动视频）' : ''}`)
        }
      }
    }

    /**
     * 稍后再看模式重定向至正常模式播放
     */
    async redirect() {
      // stop() 并不能带来有效的重定向速度改善，反而可能会引起已加载脚本执行错误，也许会造成意外的不良影响
      try {
        let id = null
        const vid = this.method.getVid() // 必须从 URL 直接反推 bvid，其他方式都比这个慢
        if (vid) {
          if (vid.type == 'aid') {
            id = 'av' + vid.id
          } else {
            id = vid.id
          }
        } else { // pathname 以 watchlater/ 结尾，等同于稍后再看中的第一个视频
          const resp = await api.web.request({
            url: gm.url.api_queryWatchlaterList,
          }, { check: r => r.code === 0 })
          id = resp.data.list[0].bvid
        }
        location.replace(`${gm.url.page_videoNormalMode}/${id}${location.search}${location.hash}`)
      } catch (e) {
        api.logger.error(e)
        const result = await api.message.confirm('重定向错误，是否临时关闭此功能？')
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
     * 对稍后再看列表页面进行处理
     */
    async processWatchlaterList() {
      const _self = this
      const data = await gm.data.watchlaterListData(true)
      const fixedItems = GM_getValue('fixedItems') ?? []
      const sortable = gm.config.autoSort != Enums.autoSort.default || gm.config.listSortControl
      let autoRemoveControl = null
      if (gm.config.autoRemove != Enums.autoRemove.absoluteNever) {
        autoRemoveControl = await api.wait.$('#gm-list-auto-remove-control')
      }
      const listContainer = await api.wait.$('.watch-later-list')
      const listBox = await api.wait.$('.list-box', listContainer)
      listBox.querySelectorAll('.av-item').forEach((item, idx) => {
        // info
        const d = data[idx]
        item.state = d.state
        item.serial = idx
        item.aid = String(d.aid)
        item.bvid = d.bvid
        item.vTitle = d.title
        item.uploader = d.owner.name
        item.duration = d.duration
        item.multiP = d.videos > 1
        if (d.progress < 0) {
          d.progress = d.duration
        }
        item.progress = (d.videos > 1 && d.progress > 0) ? d.duration : d.progress

        initItem(item)
        item.querySelectorAll('a:not([class=user])').forEach(link => processLink(item, link, autoRemoveControl))
      })
      _self.updateWatchlaterListTotal()

      // 移除无效固定项
      for (const item of fixedItems) {
        gm.data.fixedItem(item, false)
      }

      if (sortable) {
        const sortControl = await api.wait.$('#gm-list-sort-control')
        if (sortControl.value != sortControl.prevVal) {
          _self.sortWatchlaterList()
        }
      }

      /**
       * 初始化项目
       * @param {HTMLElement} item 目标项元素
       */
      function initItem(item) {
        const state = item.querySelector('.info .state')
        state.insertAdjacentHTML('beforeend', `
          <span class="gm-list-item-tools">
            <span class="gm-list-item-fixer" title="${gm.const.fixerHint}">固定</span>
            <span class="gm-list-item-collector" title="将视频移动至指定收藏夹">收藏</span>
            <input class="gm-list-item-switcher" type="checkbox" checked>
          </span>
        `)
        const tools = state.querySelector('.gm-list-item-tools')
        const fixer = tools.children[0]
        const collector = tools.children[1]
        const switcher = tools.children[2]
        item.switcher = switcher

        const fixedIdx = fixedItems.indexOf(item.bvid)
        if (fixedIdx >= 0) {
          fixedItems.splice(fixedIdx, 1)
          item.fixed = true
          item.classList.add('gm-fixed')
        }

        item.added = true
        const switchStatus = async (status, dispInfo = true) => {
          if (status) { // 先改了 UI 再说，不要给用户等待感
            item.classList.remove('gm-removed')
          } else {
            item.classList.add('gm-removed')
          }
          const note = status ? '添加到稍后再看' : '从稍后再看移除'
          const success = await _self.method.switchVideoWatchlaterStatus(item.aid, status)
          if (success) {
            item.added = status
            if (item.fixed) {
              item.fixed = false
              gm.data.fixedItem(item.bvid, false)
              item.classList.remove('gm-fixed')
            }
            dispInfo && api.message.info(`${note}成功`)
            setTimeout(() => {
              if (sortable) {
                _self.sortWatchlaterList()
              }
              _self.updateWatchlaterListTotal()
            }, 100)
          } else {
            if (item.added) {
              item.classList.remove('gm-removed')
            } else {
              item.classList.add('gm-removed')
            }
            dispInfo && api.message.info(`${note}失败`)
          }
          switcher.checked = item.added
        }

        switcher.addEventListener('click', function() {
          switchStatus(!item.added)
        })

        collector.addEventListener('click', async function() {
          const uid = _self.method.getDedeUserID()
          let mlid = GM_getValue(`watchlaterMediaList_${uid}`)
          let dmlid = false
          if (!mlid) {
            mlid = await _self.method.getDefaultMediaListId(uid)
            dmlid = true
          }
          const success = await _self.method.addToFav(item.aid, mlid)
          if (success) {
            api.message.info(dmlid ? '移动至默认收藏夹成功' : '移动至指定收藏夹成功')
            if (item.added) {
              switchStatus(false, false)
            }
          } else {
            api.message.info(dmlid ? '移动至默认收藏夹失败' : `移动至收藏夹 ${mlid} 失败，请确认该收藏夹是否存在`)
          }
        })

        fixer.addEventListener('click', function() {
          if (item.fixed) {
            item.classList.remove('gm-fixed')
          } else {
            item.classList.add('gm-fixed')
          }
          item.fixed = !item.fixed
          gm.data.fixedItem(item.bvid, item.fixed)
        })
        fixer.addEventListener('contextmenu', function(e) {
          e.preventDefault()
          script.clearFixedItems()
        })

        if (item.state < 0) {
          item.classList.add('gm-invalid')
          const title = item.querySelector('.av-about .t')
          title.innerHTML = `<b>[${_self.method.getItemStateDesc(item.state)}]</b> ${title.textContent}`
        }

        if (item.progress > 0) {
          let progress = state.querySelector('.looked')
          if (progress) {
            if (item.multiP) return
          } else {
            progress = state.insertAdjacentElement('afterbegin', document.createElement('span'))
            progress.className = 'looked'
          }
          progress.textContent = item.multiP ? '已观看' : _self.method.getSTimeString(item.progress)
        }
      }

      /**
       * 根据 `autoRemove` 处理链接
       * @param {HTMLElement} base 基元素
       * @param {HTMLAnchorElement} link 链接元素
       * @param {HTMLElement} [arc] 自动移除按钮，为 `null` 时表示彻底禁用自动移除功能
       */
      function processLink(base, link, arc) {
        if (base.state >= 0) { // 过滤视频被和谐或其他特殊情况
          link.target = gm.config.openListVideo == Enums.openListVideo.openInCurrent ? '_self' : '_blank'
          if (gm.config.redirect) {
            link.href = `${gm.url.page_videoNormalMode}/${base.bvid}`
          }
          if (arc) {
            link.addEventListener('mousedown', function(e) {
              if (e.button == 0 || e.button == 1) { // 左键或中键
                if (base.fixed) return
                if (!this._originalHref) {
                  this._originalHref = this.href
                }
                if (arc.autoRemove) {
                  if (gm.config.autoRemove != Enums.autoRemove.always) {
                    const url = new URL(this.href)
                    url.searchParams.set(`${gm.id}_remove`, 'true')
                    this.href = url.href
                  } else {
                    this.href = this._originalHref
                  }
                } else {
                  if (gm.config.autoRemove == Enums.autoRemove.always) {
                    const url = new URL(this.href)
                    url.searchParams.set(`${gm.id}_disable_remove`, 'true')
                    this.href = url.href
                  } else {
                    this.href = this._originalHref
                  }
                }
              }
            })
            link.addEventListener('mouseup', function(e) {
              if (e.button == 0 || e.button == 1) { // 左键或中键
                if (base.fixed) return
                if (arc.autoRemove) {
                  // 添加移除样式并移动至列表末尾
                  base.classList.add('gm-removed')
                  base.added = false
                  base.switcher.checked = false
                  setTimeout(() => {
                    if (sortable) {
                      _self.sortWatchlaterList()
                    }
                    _self.updateWatchlaterListTotal()
                  }, 100)
                }
              }
            })
          }
        } else {
          link.href = gm.url.noop
          link.target = '_self'
        }
      }
    }

    /**
     * 对稍后再看列表进行搜索
     */
    async searchWatchlaterList() {
      const search = await api.wait.$('#gm-list-search input')
      let val = search.value.trim()
      const match = str => str && val?.test(str)
      if (val.length > 0) {
        try {
          val = val.replace(/[$()+.[\\\]^{|}]/g, '\\$&') // escape regex
            .replaceAll('?', '.').replaceAll('*', '.+') // 通配符
          val = new RegExp(val, 'i')
        } catch {
          val = null
        }
      } else {
        val = null
      }

      const listBox = await api.wait.$('.watch-later-list .list-box')
      listBox.querySelectorAll('.av-item').forEach(item => {
        let valid = false
        if (val) {
          if (match(item.vTitle)) {
            valid = true
          } else if (match(item.uploader)) {
            valid = true
          }
        } else {
          valid = true
        }
        if (valid) {
          item.classList.remove('gm-filtered')
        } else {
          item.classList.add('gm-filtered')
        }
      })
    }

    /**
     * 对稍后再看列表页面进行排序
     */
    async sortWatchlaterList() {
      const sortControl = await api.wait.$('#gm-list-sort-control')
      const listBox = await api.wait.$('.watch-later-list .list-box')
      let type = sortControl.value
      sortControl.prevVal = type
      if (type == Enums.sortType.fixed) {
        type = Enums.sortType.default
        listBox.firstElementChild.setAttribute('sort-type-fixed', '')
      } else {
        listBox.firstElementChild.removeAttribute('sort-type-fixed')
      }
      const reverse = type.endsWith(':R')
      const k = type.replace(/:R$/, '')

      const lists = [
        [...listBox.querySelectorAll('.av-item:not(.gm-removed)')],
        [...listBox.querySelectorAll('.av-item.gm-removed')],
      ]
      let order = -1000
      for (const items of lists) {
        order += 1000
        items.sort((a, b) => {
          let result = 0
          const va = a[k]
          const vb = b[k]
          if (typeof va == 'string') {
            result = va.localeCompare(vb)
          } else if (!Number.isNaN(va)) {
            result = va - vb
          }
          return reverse ? -result : result
        })
        for (const item of items) {
          item.style.order = order++
        }
      }
      this.triggerWatchlaterListContentLoad()
    }

    /**
     * 触发列表页面内容加载
     */
    triggerWatchlaterListContentLoad() {
      window.dispatchEvent(new Event('scroll'))
    }

    /**
     * 更新列表页面上方的视频总数统计
     */
    async updateWatchlaterListTotal() {
      const container = await api.wait.$('.watch-later-list')
      const listBox = await api.wait.$('.list-box', container)
      const elTotal = await api.wait.$('header .t em')
      const all = listBox.querySelectorAll('.av-item:not(.gm-filtered)').length
      const total = all - listBox.querySelectorAll('.gm-removed:not(.gm-filtered)').length
      elTotal.textContent = `（${total}/${all}）`

      const empty = container.querySelector('.abnormal-item')
      if (all > 0) {
        if (empty) {
          empty.style.display = 'none'
        }
      } else {
        if (empty) {
          empty.style.display = ''
        } else {
          container.insertAdjacentHTML('beforeend', '<div class="abnormal-item"><img src="//s1.hdslb.com/bfs/static/jinkela/watchlater/asserts/emptylist.png" class="pic"><div class="txt"><p>稍后再看列表还是空的哦，你可以通过以上方式添加~</p></div></div>')
        }
      }
    }

    /**
     * 根据 URL 上的查询参数作进一步处理
     */
    async processSearchParams() {
      const _self = this
      if (api.base.urlMatch(gm.regex.page_videoNormalMode)) {
        // 播放页面（正常模式）
        await _self.processAutoRemove()
      } else if (api.base.urlMatch(gm.regex.page_videoWatchlaterMode)) {
        // 播放页面（稍后再看模式）
        // 推迟一段时间执行，否则稍后再看模式播放页会因为检测不到视频在稍后再看中而出错
        await _self.processAutoRemove(5000)
      }
    }

    /**
     * 根据用户配置或 URL 上的查询参数，将视频从稍后再看移除
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
          if (gm.data.fixedItem(_self.method.getBvid())) return
          const aid = _self.method.getAid()
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          const success = await _self.method.switchVideoWatchlaterStatus(aid, false)
          if (!success) {
            api.message.info('从稍后再看移除失败')
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
          if (api.base.urlMatch(gm.regex.page_watchlaterList)) {
            _self.method.updateRemoveHistoryData()
          }
          break
        case Enums.removeHistorySavePoint.listAndMenu:
        default:
          if (api.base.urlMatch(gm.regex.page_watchlaterList)) {
            _self.method.updateRemoveHistoryData()
          }
          break
        case Enums.removeHistorySavePoint.anypage:
          if (!api.base.urlMatch(gm.regex.page_dynamicMenu)) {
            _self.method.updateRemoveHistoryData()
          }
          break
      }
    }

    /**
     * 调整列表页面的 UI
     */
    async adjustWatchlaterListUI() {
      const _self = this
      const r_con = await api.wait.$('.watch-later-list header .r-con')
      // 页面上本来就存在的「全部播放」按钮不要触发重定向
      const setPlayAll = el => {
        el.href = gm.url.page_watchlaterPlayAll
        el.target = gm.config.openListVideo == Enums.openListVideo.openInCurrent ? '_self' : '_blank'
      }
      const playAll = r_con.children[0]
      if (playAll.classList.contains('s-btn')) {
        // 理论上不会进来
        setPlayAll(playAll)
      } else {
        const ob = new MutationObserver((records, observer) => {
          setPlayAll(records[0].target)
          observer.disconnect()
        })
        ob.observe(playAll, { attributeFilter: ['href'] })
      }
      // 加入「批量添加」
      if (gm.config.listBatchAddManagerButton) {
        const batchButton = r_con.appendChild(document.createElement('div'))
        batchButton.textContent = '批量添加'
        batchButton.className = 's-btn'
        batchButton.addEventListener('click', () => script.openBatchAddManager())
      }
      // 加入「移除记录」
      if (gm.config.removeHistory) {
        const removeHistoryButton = r_con.appendChild(document.createElement('div'))
        removeHistoryButton.textContent = '移除记录'
        removeHistoryButton.className = 's-btn'
        removeHistoryButton.addEventListener('click', () => script.openRemoveHistory())
      }
      // 加入「增强设置」
      const plusButton = r_con.appendChild(document.createElement('div'))
      plusButton.textContent = '增强设置'
      plusButton.className = 's-btn'
      plusButton.addEventListener('click', () => script.openUserSetting())
      // 移除「一键清空」按钮
      if (gm.config.removeButton_removeAll) {
        r_con.children[1].style.display = 'none'
      }
      // 移除「移除已观看视频」按钮
      if (gm.config.removeButton_removeWatched) {
        r_con.children[2].style.display = 'none'
      }

      // 增加搜索框
      if (gm.config.listSearch) {
        api.base.addStyle(`
          #gm-list-search.gm-search {
            display: inline-block;
            font-size: 1.6em;
            line-height: 2em;
            margin: 10px 21px 0;
            padding: 0 0.5em;
            border-radius: 3px;
            transition: box-shadow ${gm.const.fadeTime}ms ease-in-out;
          }
          #gm-list-search.gm-search:hover,
          #gm-list-search.gm-search.gm-active {
            box-shadow: var(--${gm.id}-box-shadow);
          }
          #gm-list-search.gm-search input[type=text] {
            border: none;
            width: 18em;
          }
        `)
        const searchContainer = r_con.insertAdjacentElement('afterend', document.createElement('div'))
        searchContainer.className = 'gm-list-search-container'
        searchContainer.innerHTML = `
          <div id="gm-list-search" class="gm-search">
            <input type="text" placeholder="点击以在列表中搜索... 支持通配符 ( ? * )">
            <div class="gm-search-clear">✖</div>
          </div>
        `
        const searchBox = searchContainer.firstElementChild
        const search = searchBox.children[0]
        const searchClear = searchBox.children[1]

        search.addEventListener('mouseenter', function() {
          this.focus()
        })
        search.addEventListener('input', function() {
          const m = /^\s+(.*)/.exec(this.value)
          if (m) {
            this.value = m[1]
            this.setSelectionRange(0, 0)
          }
          if (this.value.length > 0) {
            searchBox.classList.add('gm-active')
            searchClear.style.visibility = 'visible'
          } else {
            searchBox.classList.remove('gm-active')
            searchClear.style.visibility = ''
          }
        })
        search.addEventListener('input', api.base.throttle(async () => {
          await _self.searchWatchlaterList()
          await _self.updateWatchlaterListTotal()
          _self.triggerWatchlaterListContentLoad()
        }, gm.const.inputThrottleWait))
        searchClear.addEventListener('click', function() {
          search.value = ''
          search.dispatchEvent(new Event('input'))
        })
      }

      // 增加排序控制
      {
        const sortControlButton = r_con.insertAdjacentElement('afterbegin', document.createElement('div'))
        const control = sortControlButton.appendChild(document.createElement('select'))
        sortControlButton.className = 'gm-list-sort-control-container'
        control.id = 'gm-list-sort-control'
        control.innerHTML = `
          <option value="${Enums.sortType.default}" selected>排序：默认</option>
          <option value="${Enums.sortType.defaultR}">排序：默认↓</option>
          <option value="${Enums.sortType.duration}">排序：时长</option>
          <option value="${Enums.sortType.durationR}">排序：时长↓</option>
          <option value="${Enums.sortType.progress}">排序：进度</option>
          <option value="${Enums.sortType.uploader}">排序：UP主</option>
          <option value="${Enums.sortType.title}">排序：标题</option>
          <option value="${Enums.sortType.fixed}">排序：固定</option>
        `
        control.prevVal = control.value

        if (gm.config.autoSort != Enums.autoSort.default) {
          let type = gm.config.autoSort
          if (type == Enums.autoSort.auto) {
            type = GM_getValue('autoSort_auto')
            if (!type) {
              type = Enums.sortType.default
              GM_setValue('autoSort_auto', type)
            }
          }
          control.value = type
        }

        if (gm.config.listSortControl) {
          /*
           * 在 control 外套一层，借助这层给 control 染色的原因是：
           * 如果不这样做，那么点击 control 弹出的下拉框与 control 之间有几个像素的距离，鼠标从 control 移动到
           * 下拉框的过程中，若鼠标移动速度较慢，会使 control 脱离 hover 状态。
           * 不管是标准还是浏览器的的锅：凭什么鼠标移动到 option 上 select「不一定」是 hover 状态——哪怕设计成
           * 「一定不」都是合理的。
           */
          api.base.addStyle(`
            .gm-list-sort-control-container {
              display: inline-block;
              padding-bottom: 5px;
            }
            .gm-list-sort-control-container:hover select {
              background: #00a1d6;
              color: #fff;
            }
            .gm-list-sort-control-container select {
              appearance: none;
              text-align-last: center;
              line-height: 16.6px;
            }
            .gm-list-sort-control-container option {
              background: var(--${gm.id}-background-color);
              color: var(--${gm.id}-text-color);
            }
          `)
          control.className = 's-btn'

          control.addEventListener('change', function() {
            if (gm.config.autoSort == Enums.autoSort.auto) {
              GM_setValue('autoSort_auto', this.value)
            }
            _self.sortWatchlaterList()
          })
        } else {
          sortControlButton.style.display = 'none'
        }
      }

      // 增加自动移除控制器
      {
        const autoRemoveControl = document.createElement('div')
        autoRemoveControl.id = 'gm-list-auto-remove-control'
        autoRemoveControl.textContent = '自动移除'
        if (!gm.config.listAutoRemoveControl) {
          autoRemoveControl.style.display = 'none'
        }
        r_con.prepend(autoRemoveControl)
        if (gm.config.autoRemove != Enums.autoRemove.absoluteNever) {
          api.base.addStyle(`
            #gm-list-auto-remove-control {
              background: #fff;
              color: #00a1d6;
            }
            #gm-list-auto-remove-control[enabled] {
              background: #00a1d6;
              color: #fff;
            }
          `)
          const autoRemove = gm.config.autoRemove == Enums.autoRemove.always || gm.config.autoRemove == Enums.autoRemove.openFromList
          autoRemoveControl.className = 's-btn'
          autoRemoveControl.title = '临时切换在当前页面打开视频后是否将其自动移除出「稍后再看」。若要默认开启/关闭自动移除功能，请在「用户设置」中配置。'
          autoRemoveControl.autoRemove = autoRemove
          if (autoRemove) {
            autoRemoveControl.setAttribute('enabled', '')
          }
          autoRemoveControl.addEventListener('click', function() {
            if (this.autoRemove) {
              autoRemoveControl.removeAttribute('enabled')
              api.message.info('已临时关闭自动移除功能')
            } else {
              autoRemoveControl.setAttribute('enabled', '')
              api.message.info('已临时开启自动移除功能')
            }
            this.autoRemove = !this.autoRemove
          })
        } else {
          autoRemoveControl.className = 'd-btn'
          autoRemoveControl.style.cursor = 'not-allowed'
          autoRemoveControl.addEventListener('click', function() {
            api.message.info('当前彻底禁用自动移除功能，无法执行操作')
          })
        }
      }
    }

    /**
     * 隐藏「收藏」中的「稍后再看」
     */
    async hideWatchlaterInCollect() {
      api.wait.$('.user-con .mini-favorite').then(fav => {
        const collect = fav.parentElement
        const process = function() {
          api.wait.$('[role=tooltip] .tab-item [title=稍后再看]', document, true).then(el => {
            el.parentElement.style.display = 'none'
            collect.removeEventListener('mouseover', process) // 确保移除后再解绑
          }).catch(() => {}) // 有时候鼠标经过收藏也没弹出来，不知道什么原因，就不报错了
        }
        collect.addEventListener('mouseover', process)
      })
    }

    /**
     * 添加批量添加管理器按钮
     */
    addBatchAddManagerButton() {
      if (location.pathname == '/') { // 仅动态主页
        api.wait.$('.feed-card .tab-bar').then(bar => {
          const btn = bar.firstElementChild.cloneNode(true)
          btn.id = 'gm-batch-manager-btn'
          btn.firstElementChild.classList.remove('selected')
          btn.firstElementChild.textContent = '批量添加'
          btn.addEventListener('click', () => script.openBatchAddManager())
          bar.append(btn)
        })
      }
    }

    /**
     * 添加弹出菜单的滚动条样式
     */
    addMenuScrollbarStyle() {
      const popup = `#${gm.id} .gm-entrypopup .gm-entry-list`
      const tooltip = '[role=tooltip]'
      const dynamic = '#app > .out-container > .container'
      switch (gm.config.menuScrollbarSetting) {
        case Enums.menuScrollbarSetting.beautify:
          // 目前在不借助 JavaScript 的情况下，无法完美实现类似于移动端滚动条浮动在内容上的效果。
          api.base.addStyle(`
            :root {
              --${gm.id}-scrollbar-background-color: transparent;
              --${gm.id}-scrollbar-thumb-color: #0000002b;
            }

            ${popup}::-webkit-scrollbar,
            ${tooltip} ::-webkit-scrollbar,
            ${dynamic}::-webkit-scrollbar {
              width: 6px;
              height: 6px;
              background-color: var(--${gm.id}-scrollbar-background-color);
            }

            ${popup}::-webkit-scrollbar-thumb,
            ${tooltip} ::-webkit-scrollbar-thumb,
            ${dynamic}::-webkit-scrollbar-thumb {
              border-radius: 3px;
              background-color: var(--${gm.id}-scrollbar-background-color);
            }

            ${popup}:hover::-webkit-scrollbar-thumb,
            ${tooltip} :hover::-webkit-scrollbar-thumb,
            ${dynamic}:hover::-webkit-scrollbar-thumb {
              border-radius: 3px;
              background-color: var(--${gm.id}-scrollbar-thumb-color);
            }

            ${popup}::-webkit-scrollbar-corner,
            ${tooltip} ::-webkit-scrollbar-corner,
            ${dynamic}::-webkit-scrollbar-corner {
              background-color: var(--${gm.id}-scrollbar-background-color);
            }
          `)
          return
        case Enums.menuScrollbarSetting.hidden:
          api.base.addStyle(`
            ${popup}::-webkit-scrollbar,
            ${tooltip} ::-webkit-scrollbar,
            ${dynamic}::-webkit-scrollbar {
              display: none;
            }
          `)
          return
        case Enums.menuScrollbarSetting.original:
        default:
          return
      }
    }

    /**
     * 添加脚本样式
     */
    addStyle() {
      if (self == top) {
        this.addMenuScrollbarStyle()
        // 通用样式
        api.base.addStyle(`
          :root {
            --${gm.id}-text-color: #0d0d0d;
            --${gm.id}-text-bold-color: #3a3a3a;
            --${gm.id}-light-text-color: white;
            --${gm.id}-hint-text-color: gray;
            --${gm.id}-light-hint-text-color: #909090;
            --${gm.id}-hint-text-emphasis-color: #666666;
            --${gm.id}-hint-text-hightlight-color: #555555;
            --${gm.id}-background-color: white;
            --${gm.id}-background-hightlight-color: #ebebeb;
            --${gm.id}-update-hightlight-color: ${gm.const.updateHighlightColor};
            --${gm.id}-update-hightlight-hover-color: red;
            --${gm.id}-border-color: black;
            --${gm.id}-light-border-color: #e7e7e7;
            --${gm.id}-shadow-color: #000000bf;
            --${gm.id}-text-shadow-color: #00000080;
            --${gm.id}-hightlight-color: #0075ff;
            --${gm.id}-important-color: red;
            --${gm.id}-warn-color: #e37100;
            --${gm.id}-disabled-color: gray;
            --${gm.id}-scrollbar-background-color: transparent;
            --${gm.id}-scrollbar-thumb-color: #0000002b;
            --${gm.id}-box-shadow: #00000033 0px 3px 6px;
            --${gm.id}-opacity-fade-transition: opacity ${gm.const.fadeTime}ms ease-in-out;
            --${gm.id}-opacity-fade-quick-transition: opacity ${gm.const.fadeTime}ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
          }

          #${gm.id} {
            color: var(--${gm.id}-text-color);
            font-family: Arial, Microsoft Yahei, Hiragino Sans GB, sans-serif;
          }
          #${gm.id} * {
            box-sizing: content-box;
          }

          #${gm.id} .gm-entrypopup {
            font-size: 12px;
            line-height: normal;
            transition: var(--${gm.id}-opacity-fade-transition);
            opacity: 0;
            display: none;
            position: absolute;
            z-index: 900000;
            user-select: none;
            width: 32em;
            padding-top: 1em;
          }
          #${gm.id} .gm-entrypopup .gm-popup-arrow {
            position: absolute;
            top: calc(1em - 6px);
            left: calc(16em - 6px);
            width: 0;
            height: 0;
            border-width: 6px;
            border-top-width: 0;
            border-style: solid;
            border-color: transparent;
            border-bottom-color: #dfdfdf; /* 必须在 border-color 后 */
            z-index: 1;
          }
          #${gm.id} .gm-entrypopup .gm-popup-arrow::after {
            content: " ";
            position: absolute;
            top: 1px;
            width: 0;
            height: 0;
            margin-left: -6px;
            border-width: 6px;
            border-top-width: 0;
            border-style: solid;
            border-color: transparent;
            border-bottom-color: var(--${gm.id}-background-color); /* 必须在 border-color 后 */
          }
          #${gm.id} .gm-entrypopup .gm-entrypopup-page {
            position: relative;
            border-radius: 4px;
            border: none;
            box-shadow: var(--${gm.id}-box-shadow);
            background-color: var(--${gm.id}-background-color);
            overflow: hidden;
          }
          #${gm.id} .gm-entrypopup .gm-popup-header {
            position: relative;
            height: 2.8em;
            border-bottom: 1px solid var(--${gm.id}-light-border-color);
          }
          #${gm.id} .gm-entrypopup .gm-popup-total {
            position: absolute;
            line-height: 2.6em;
            right: 1.3em;
            top: 0;
            font-size: 1.2em;
            color: var(--${gm.id}-hint-text-color);
          }

          #${gm.id} .gm-entrypopup .gm-entry-list {
            display: flex;
            flex-direction: column;
            position: relative;
            height: 42em;
            overflow-y: auto;
            overflow-anchor: none;
            padding: 0.2em 0;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list.gm-entry-removed-list {
            border-top: 3px solid var(--${gm.id}-light-border-color);
            display: none;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list-empty {
            position: absolute;
            display: none;
            top: 20%;
            left: calc(50% - 7em);
            line-height: 4em;
            width: 14em;
            font-size: 1.4em;
            text-align: center;
            color: var(--${gm.id}-hint-text-color);
          }

          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item {
            display: flex;
            height: 4.4em;
            padding: 0.5em 1em;
            color: var(--${gm.id}-text-color);
            font-size: 1.15em;
            cursor: pointer;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-invalid {
            cursor: not-allowed;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-invalid,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed {
            filter: grayscale(1);
            color: var(--${gm.id}-hint-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-left {
            position: relative;
            flex: none;
            cursor: default;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-cover {
            width: 7.82em; /* 16:9 */
            height: 4.40em;
            border-radius: 2px;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-switcher {
            position: absolute;
            background: center / contain no-repeat #00000099 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56'%3E%3Cpath fill='%23fff' fill-rule='evenodd' d='M35 17v-3H21v3h-8v3h5v22h20V20h5v-3h-8zm-9 22h-5V20h5v19zm9 0h-5V20h5v19z' clip-rule='evenodd'/%3E%3C/svg%3E");
            border-radius: 2px;
            width: 30px;
            height: 30px;
            top: calc(2.20em - 15px); /* 与缩略图显示尺寸匹配 */
            left: calc(3.91em - 15px);
            z-index: 2;
            display: none;
            cursor: pointer;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed .gm-card-switcher {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56'%3E%3Cpath d='M39.9 25.6h-9.5v-9.5c0-.9-.5-1.5-1.2-1.5h-2.4c-.7 0-1.2.6-1.2 1.5v9.5h-9.5c-.9 0-1.5.5-1.5 1.2v2.4c0 .7.6 1.2 1.5 1.2h9.5v9.5c0 .9.5 1.5 1.2 1.5h2.4c.7 0 1.2-.6 1.2-1.5v-9.5h9.5c.9 0 1.5-.5 1.5-1.2v-2.4c.1-.7-.6-1.2-1.5-1.2z' fill='%23fff'/%3E%3C/svg%3E");
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:hover .gm-card-switcher {
            display: unset;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:not(.gm-card-multiP) .gm-card-duration,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP .gm-card-duration > * {
            position: absolute;
            bottom: 0;
            right: 0;
            background: var(--${gm.id}-text-shadow-color);
            color: var(--${gm.id}-light-text-color);
            border-radius: 2px 0 2px 0; /* 需与缩略图圆角匹配 */
            padding: 1.5px 2px 0 3px;
            font-size: 0.8em;
            z-index: 1;
            word-break: keep-all;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP .gm-card-duration > * {
            transition: var(--${gm.id}-opacity-fade-quick-transition);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP:not(:hover) .gm-card-duration > .gm-hover,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-card-multiP:hover .gm-card-duration > :not(.gm-hover) {
            opacity: 0;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-right {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: auto;
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
            height: 2.8em;
            line-height: 1.4em;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed .gm-card-title {
            text-decoration: line-through;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-uploader {
            font-size: 0.8em;
            text-overflow: ellipsis;
            word-break: keep-all;
            overflow: hidden;
            width: fit-content;
            max-width: 15em;
            color: var(--${gm.id}-hint-text-color);
            cursor: pointer;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-corner {
            position: absolute;
            bottom: 0;
            right: 0;
            font-size: 0.8em;
            color: var(--${gm.id}-hint-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-corner > span {
            margin-left: 2px;
            cursor: pointer;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:hover .gm-card-corner > :not(.gm-hover),
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:not(:hover) .gm-card-corner > .gm-hover {
            display: none !important;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-progress {
            display: none;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-progress::before {
            content: "▶";
            padding-right: 1px;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item.gm-removed .gm-card-fixer {
            display: none;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-uploader:hover,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item .gm-card-corner > span:hover {
            text-decoration: underline;
            font-weight: bold;
            color: var(--${gm.id}-text-bold-color);
          }

          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item {
            display: block;
            color: var(--${gm.id}-text-color);
            font-size: 1.2em;
            padding: 0.5em 1em;
            cursor: pointer;
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item:not(:last-child) {
            border-bottom: 1px solid var(--${gm.id}-light-border-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item.gm-invalid,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item.gm-invalid:hover {
            cursor: not-allowed;
            color: var(--${gm.id}-hint-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item.gm-removed {
            text-decoration: line-through;
            color: var(--${gm.id}-hint-text-color);
          }

          #${gm.id} .gm-entrypopup .gm-entry-bottom {
            display: flex;
            border-top: 1px solid var(--${gm.id}-light-border-color);
            height: 3em;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button {
            flex: 1 0 auto;
            text-align: center;
            padding: 0.6em 0;
            font-size: 1.2em;
            cursor: pointer;
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button:not([enabled]) {
            display: none;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[disabled],
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[disabled]:hover {
            color: var(--${gm.id}-disabled-color);
            cursor: not-allowed;
          }

          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-select {
            position: relative;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-options {
            position: absolute;
            bottom: 1.8em;
            left: calc(50% - 2.5em);
            width: 5em;
            border-radius: 4px;
            box-shadow: var(--${gm.id}-box-shadow);
            background-color: var(--${gm.id}-background-color);
            color: var(--${gm.id}-text-color);
            padding: 0.15em 0;
            display: none;
            opacity: 0;
            transition: var(--${gm.id}-opacity-fade-quick-transition);
            z-index: 10;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-option {
            padding: 0.15em 0.6em;
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-option:hover {
            color: var(--${gm.id}-hightlight-color);
            background-color: var(--${gm.id}-background-hightlight-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button .gm-option.gm-option-selected {
            font-weight: bold;
          }

          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[fn=autoRemoveControl]:not([disabled]),
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[fn=autoRemoveControl]:not([disabled]):hover {
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button.gm-popup-auto-remove[fn=autoRemoveControl]:not([disabled]) {
            color: var(--${gm.id}-hightlight-color);
          }

          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-item:hover,
          #${gm.id} .gm-entrypopup .gm-entry-list .gm-entry-list-simple-item:hover,
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button:hover {
            color: var(--${gm.id}-hightlight-color);
            background-color: var(--${gm.id}-background-hightlight-color);
          }

          #${gm.id} .gm-modal-container {
            display: none;
            position: fixed;
            justify-content: center;
            align-items: center;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000000;
            font-size: 12px;
            line-height: normal;
            user-select: none;
            opacity: 0;
            transition: var(--${gm.id}-opacity-fade-transition);
          }

          #${gm.id} .gm-modal {
            position: relative;
            background-color: var(--${gm.id}-background-color);
            border-radius: 10px;
            z-index: 1;
          }

          #${gm.id} .gm-setting .gm-setting-page {
            min-width: 53em;
            max-width: 84em;
            padding: 1em 1.4em;
          }

          #${gm.id} .gm-setting .gm-maintitle {
            cursor: pointer;
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-setting .gm-maintitle:hover {
            color: var(--${gm.id}-hightlight-color);
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
            color: var(--${gm.id}-text-bold-color);
            word-break: keep-all;
          }
          #${gm.id} .gm-setting .gm-item:not(:first-child) td {
            padding-top: 0.5em;
          }
          #${gm.id} .gm-setting td > * {
            display: flex;
            align-items: center;
            padding: 0.2em;
            border-radius: 0.2em;
          }

          #${gm.id} .gm-setting .gm-item:hover {
            color: var(--${gm.id}-hightlight-color);
          }

          #${gm.id} .gm-setting .gm-subitem[disabled] {
            color: var(--${gm.id}-disabled-color);
          }
          #${gm.id} .gm-setting .gm-subitem:hover:not([disabled]) {
            color: var(--${gm.id}-hightlight-color);
          }

          #${gm.id} .gm-setting .gm-subitem .gm-lineitems[disabled] {
            color: var(--${gm.id}-disabled-color);
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitems {
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitem {
            display: inline-block;
            padding-right: 8px;
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitem:hover {
            color: var(--${gm.id}-hightlight-color);
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitems[disabled] .gm-lineitem {
            color: var(--${gm.id}-disabled-color);
          }
          #${gm.id} .gm-setting .gm-subitem .gm-lineitem input[type=checkbox] {
            margin-left: 2px;
            vertical-align: -2px;
          }

          #${gm.id} .gm-setting input[type=checkbox] {
            margin-left: auto;
          }
          #${gm.id} .gm-setting input[type=text] {
            border-width: 0 0 1px 0;
            width: 3.4em;
            text-align: right;
            padding: 0 0.2em;
            margin-left: auto;
          }
          #${gm.id} .gm-setting select {
            border-width: 0 0 1px 0;
            cursor: pointer;
          }

          #${gm.id} .gm-setting .gm-information {
            margin: 0 0.4em;
            cursor: pointer;
          }
          #${gm.id} .gm-setting [disabled] .gm-information {
            cursor: not-allowed;
          }

          #${gm.id} .gm-setting .gm-warning {
            position: absolute;
            color: var(--${gm.id}-warn-color);
            font-size: 1.4em;
            line-height: 1em;
            transition: var(--${gm.id}-opacity-fade-transition);
            opacity: 0;
            display: none;
            cursor: pointer;
          }
          #${gm.id} .gm-setting .gm-warning.gm-trailing {
            position: static;
            margin-left: 0.5em;
          }
          #${gm.id} .gm-setting .gm-warning:not(.gm-trailing) {
            right: -1em;
          }

          #${gm.id} .gm-hideDisabledSubitems .gm-setting-page:not([setting-type]) [disabled] {
            display: none;
          }

          #${gm.id} .gm-history .gm-history-page {
            width: 60vw;
            min-width: 40em;
            max-width: 80em;
          }

          #${gm.id} .gm-history .gm-comment {
            margin: 0 2em;
            color: var(--${gm.id}-hint-text-color);
            text-indent: 2em;
          }
          #${gm.id} .gm-history .gm-comment span,
          #${gm.id} .gm-history .gm-comment input {
            padding: 0 0.2em;
            font-weight: bold;
            color: var(--${gm.id}-hint-text-emphasis-color);
          }
          #${gm.id} .gm-history .gm-comment input {
            text-align: center;
            width: 3.5em;
            border-width: 0 0 1px 0;
          }

          #${gm.id} .gm-history .gm-content {
            margin: 0.6em 0.2em 2em 0.2em;
            padding: 0 1.8em;
            font-size: 1.2em;
            line-height: 1.6em;
            text-align: center;
            overflow-y: auto;
            overflow-wrap: break-word;
            height: 60vh;
            max-height: 60em;
            user-select: text;
            opacity: 0;
          }
          #${gm.id} .gm-history .gm-content > * {
            position: relative;
            margin: 1.6em 2em;
          }
          #${gm.id} .gm-history .gm-content a {
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-history .gm-content input[type=checkbox] {
            position: absolute;
            right: -2em;
            height: 1.5em;
            width: 1em;
            cursor: pointer;
          }
          #${gm.id} .gm-history .gm-content .gm-history-date {
            font-size: 0.5em;
            color: var(--${gm.id}-hint-text-color);
          }
          #${gm.id} .gm-history .gm-content > *:hover input[type=checkbox] {
            filter: brightness(0.9);
          }
          #${gm.id} .gm-history .gm-content > *:hover a {
            font-weight: bold;
            color: var(--${gm.id}-hightlight-color);
          }
          #${gm.id} .gm-history .gm-content .gm-empty {
            display: flex;
            justify-content: center;
            font-size: 1.5em;
            line-height: 1.6em;
            margin-top: 3.6em;
            color: gray;
          }
          #${gm.id} .gm-history .gm-content .gm-empty > * {
            width: fit-content;
            text-align: left;
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
            background-color: var(--${gm.id}-background-color);
            border: 1px solid var(--${gm.id}-border-color);
            border-radius: 2px;
          }
          #${gm.id} .gm-bottom button:hover {
            background-color: var(--${gm.id}-background-hightlight-color);
          }
          #${gm.id} .gm-bottom button[disabled] {
            cursor: not-allowed;
            border-color: var(--${gm.id}-disabled-color);
            background-color: var(--${gm.id}-background-color);
          }

          #${gm.id} .gm-info {
            font-size: 0.8em;
            color: var(--${gm.id}-hint-text-color);
            text-decoration: underline;
            padding: 0 0.2em;
            cursor: pointer;
          }
          #${gm.id} .gm-info:hover {
            color: var(--${gm.id}-important-color);
          }
          #${gm.id} [disabled] .gm-info {
            color: var(--${gm.id}-disabled-color);
            cursor: not-allowed;
          }

          #${gm.id} .gm-reset {
            position: absolute;
            right: 0;
            bottom: 0;
            margin: 1em 1.6em;
            color: var(--${gm.id}-hint-text-color);
            cursor: pointer;
          }

          #${gm.id} .gm-changelog {
            position: absolute;
            right: 0;
            bottom: 1.8em;
            margin: 1em 1.6em;
            color: var(--${gm.id}-hint-text-color);
            cursor: pointer;
          }
          #${gm.id} [setting-type=updated] .gm-changelog {
            font-weight: bold;
            color: var(--${gm.id}-update-hightlight-hover-color);
          }
          #${gm.id} [setting-type=updated] .gm-changelog:hover {
            color: var(--${gm.id}-update-hightlight-hover-color);
          }
          #${gm.id} [setting-type=updated] .gm-updated,
          #${gm.id} [setting-type=updated] .gm-updated input,
          #${gm.id} [setting-type=updated] .gm-updated select {
            background-color: var(--${gm.id}-update-hightlight-color);
          }
          #${gm.id} [setting-type=updated] .gm-updated option {
            background-color: var(--${gm.id}-background-color);
          }
          #${gm.id} [setting-type=updated] tr:hover .gm-updated,
          #${gm.id} [setting-type=updated] tr:hover .gm-updated .gm-lineitem {
            color: var(--${gm.id}-update-hightlight-hover-color);
            font-weight: bold;
          }

          #${gm.id} .gm-reset:hover,
          #${gm.id} .gm-changelog:hover {
            color: var(--${gm.id}-hint-text-hightlight-color);
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

          #${gm.id} .gm-batchAddManager .gm-batchAddManager-page {
            width: 70em;
            height: 56em;
          }
          #${gm.id} .gm-batchAddManager .gm-comment {
            margin: 1.4em 2.5em 0.5em;
            font-size: 1.2em;
            line-height: 1.8em;
          }
          #${gm.id} .gm-batchAddManager .gm-comment button {
            margin-left: 1em;
            padding: 0.1em 0.3em;
            border-radius: 2px;
            cursor: pointer;
          }
          #${gm.id} .gm-batchAddManager .gm-comment button:not([disabled]):hover {
            background-color: var(--${gm.id}-background-hightlight-color);
          }
          #${gm.id} .gm-batchAddManager .gm-comment button[disabled] {
            cursor: not-allowed;
          }
          #${gm.id} .gm-batchAddManager .gm-comment input {
            width: 3em;
            padding: 0 0.2em;
            border-width: 0 0 1px 0;
            text-align: center;
          }
          #${gm.id} .gm-batchAddManager .gm-items {
            width: calc(100% - 2.5em * 2);
            height: 24em;
            padding: 0.4em 0;
            margin: 0 2.5em;
            font-size: 1.1em;
            border: 1px solid var(--${gm.id}-scrollbar-thumb-color);
            border-radius: 4px;
            overflow-y: scroll;
          }
          #${gm.id} .gm-batchAddManager .gm-items label {
            display: block;
            padding: 0.2em 1em;
          }
          #${gm.id} .gm-batchAddManager .gm-items label:hover {
            background-color: var(--${gm.id}-background-hightlight-color);
          }
          #${gm.id} .gm-batchAddManager .gm-items label input {
            vertical-align: -0.15em;
          }

          #${gm.id} .gm-shadow {
            background-color: var(--${gm.id}-shadow-color);
            position: fixed;
            top: 0%;
            left: 0%;
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
            appearance: auto;
            outline: none;
            border: 1px solid var(--${gm.id}-border-color);
            border-radius: 0;
            color: var(--${gm.id}-text-color);
            background-color: var(--${gm.id}-background-color);
          }

          #${gm.id} [disabled],
          #${gm.id} [disabled] input,
          #${gm.id} [disabled] select {
            cursor: not-allowed;
            color: var(--${gm.id}-disabled-color);
          }

          #${gm.id}-video-btn {
            display: flex;
            align-items: center;
            user-select: none;
            cursor: pointer;
          }
          #${gm.id}-video-btn input[type=checkbox] {
            margin-right: 2px;
            cursor: pointer;
            appearance: auto;
          }

          #${gm.id} .gm-items::-webkit-scrollbar,
          #${gm.id} .gm-history .gm-content::-webkit-scrollbar {
            width: 6px;
            height: 6px;
            background-color: var(--${gm.id}-scrollbar-background-color);
          }
          #${gm.id} .gm-history .gm-content::-webkit-scrollbar-thumb {
            border-radius: 3px;
            background-color: var(--${gm.id}-scrollbar-background-color);
          }
          #${gm.id} .gm-items::-webkit-scrollbar-thumb,
          #${gm.id} .gm-history .gm-content:hover::-webkit-scrollbar-thumb {
            border-radius: 3px;
            background-color: var(--${gm.id}-scrollbar-thumb-color);
          }
          #${gm.id} gm-items::-webkit-scrollbar-corner,
          #${gm.id} .gm-history .gm-content::-webkit-scrollbar-corner {
            background-color: var(--${gm.id}-scrollbar-background-color);
          }

          #${gm.id} .gm-entrypopup .gm-search {
            font-size: 1.3em;
            line-height: 2.6em;
            padding-left: 0.9em;
          }
          #${gm.id} .gm-entrypopup .gm-search input[type=text] {
            border: none;
            width: 18em;
          }

          .gm-search input[type=text] {
            line-height: normal;
            outline: none;
            padding-right: 6px;
            color: var(--${gm.id}-text-color);
          }
          .gm-search input[type=text]::placeholder {
            font-size: 0.9em;
            color: var(--${gm.id}-light-hint-text-color);
          }
          .gm-search-clear {
            display: inline-block;
            color: var(--${gm.id}-hint-text-color);
            cursor: pointer;
            visibility: hidden;
          }
          .gm-filtered,
          [class*=gm-filtered-] {
            display: none !important;
          }

          .watch-later-list .list-box > span {
            display: flex;
            flex-direction: column;
            overflow-anchor: none; /* 禁用滚动锚定，避免滚动跟随项目位置变化 */
          }
          .watch-later-list .btn-del {
            display: none;
          }
          .watch-later-list .gm-list-item-tools {
            color: #999;
          }
          .watch-later-list .gm-list-item-tools > * {
            margin: 0 5px;
            cursor: pointer;
          }
          .watch-later-list .gm-list-item-tools span:hover {
            text-decoration: underline;
            font-weight: bold;
          }
          .watch-later-list .gm-list-item-tools input {
            vertical-align: -3px;
          }
          .watch-later-list .gm-removed .gm-list-item-fixer {
            display: none;
          }
          .watch-later-list .gm-removed,
          .watch-later-list .gm-invalid {
            filter: grayscale(1);
          }
          .watch-later-list .gm-fixed .key,
          .watch-later-list .gm-removed .key {
            visibility: hidden;
          }
          .watch-later-list .gm-removed .t {
            text-decoration: line-through !important;
          }
          .watch-later-list .gm-invalid .t {
            font-weight: unset !important;
          }
          .watch-later-list .gm-removed .t,
          .watch-later-list .gm-invalid .t {
            color: var(--${gm.id}-hint-text-color) !important;
          }
          .watch-later-list .gm-invalid a:not(.user) {
            cursor: not-allowed !important;
          }

          .gm-fixed {
            order: 1000 !important;
          }
          .gm-fixed .gm-list-item-fixer,
          .gm-fixed .gm-card-fixer {
            font-weight: bold;
          }
          .watch-later-list .list-box > span[sort-type-fixed] .gm-fixed,
          #${gm.id} .gm-entrypopup .gm-entry-list[gm-list-reverse] .gm-fixed,
          #${gm.id} .gm-entrypopup .gm-entry-list[sort-type-fixed] .gm-fixed {
            order: -1000 !important;
          }

          [gm-list-reverse] {
            flex-direction: column-reverse !important;
          }

          .gm-fixed {
            border: 2px dashed var(--${gm.id}-light-hint-text-color) !important;
          }
        `)
      } else {
        if (api.base.urlMatch(gm.regex.page_dynamicMenu)) {
          this.addMenuScrollbarStyle()
        }
      }
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
      }
      if (maxSize < this.size) {
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
      }
      if (this.size > capacity) {
        this.size = capacity
      }
      // no need to gc() here
      const data = this.toArray().reverse()
      this.capacity = capacity
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
     * @param {number} [offset=0] 起始点
     * @returns {Array<T>} 队列数据的数组形式
     */
    toArray(maxLength = this.size, offset = 0) {
      if (offset < 0) {
        offset = 0
      }
      if (offset + maxLength > this.size) {
        maxLength = this.size - offset
      }
      const ar = []
      let start = this.index - offset
      if (start < 0) {
        start += this.capacity
      }
      let end = start - maxLength
      for (let i = start - 1; i >= end && i >= 0; i--) {
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
        } else {
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
      api.base.initUrlchangeEvent()
    }
    script = new Script()
    webpage = new Webpage()
    if (!webpage.method.isLogin()) {
      api.logger.info('终止执行：脚本只能工作在B站登录状态下。')
      return
    }

    script.initAtDocumentStart()
    if (api.base.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      const disableRedirect = gm.searchParams.get(`${gm.id}_disable_redirect`) == 'true'
      if (gm.config.redirect && !disableRedirect) { // 重定向，document-start 就执行，尽可能快地将原页面掩盖过去
        webpage.redirect()
        return
      }
    }

    webpage.method.cleanSearchParams()
    webpage.addStyle()
    if (gm.config.mainRunAt == Enums.mainRunAt.DOMContentLoaded) {
      document.readyState == 'loading' ? document.addEventListener('DOMContentLoaded', main) : main()
    } else {
      document.readyState != 'complete' ? window.addEventListener('load', main) : main()
    }

    function main() {
      script.init()
      if (self == top) {
        script.addScriptMenu()

        if (gm.config.headerButton) {
          webpage.addHeaderButton()
        }
        if (gm.config.removeHistory) {
          webpage.processWatchlaterListDataSaving()
        }
        if (gm.config.fillWatchlaterStatus != Enums.fillWatchlaterStatus.never) {
          webpage.fillWatchlaterStatus()
        }
        if (gm.config.hideWatchlaterInCollect) {
          webpage.hideWatchlaterInCollect()
        }

        if (api.base.urlMatch(gm.regex.page_watchlaterList)) {
          webpage.adjustWatchlaterListUI()
          webpage.processWatchlaterList()
        } else if (api.base.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode])) {
          if (gm.config.videoButton) {
            webpage.addVideoButton()
          }
        } else if (api.base.urlMatch(gm.regex.page_dynamic)) {
          if (gm.config.dynamicBatchAddManagerButton) {
            webpage.addBatchAddManagerButton()
          }
        }

        webpage.processSearchParams()
      } else {
        if (api.base.urlMatch(gm.regex.page_dynamicMenu)) {
          if (gm.config.fillWatchlaterStatus != Enums.fillWatchlaterStatus.never) {
            webpage.fillWatchlaterStatus()
          }
        }
      }
    }
  })()
})()
