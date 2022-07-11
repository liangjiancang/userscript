// ==UserScript==
// @name            B站稍后再看功能增强
// @version         4.28.5.20220711
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
// @exclude         *://www.bilibili.com/correspond/*
// @exclude         *://www.bilibili.com/page-proxy/*
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=974252
// @require         https://greasyfork.org/scripts/431998-userscriptapidom/code/UserscriptAPIDom.js?version=1005139
// @require         https://greasyfork.org/scripts/432000-userscriptapimessage/code/UserscriptAPIMessage.js?version=1055883
// @require         https://greasyfork.org/scripts/432002-userscriptapiwait/code/UserscriptAPIWait.js?version=1035042
// @require         https://greasyfork.org/scripts/432003-userscriptapiweb/code/UserscriptAPIWeb.js?version=977807
// @require         https://greasyfork.org/scripts/432936-pushqueue/code/PushQueue.js?version=978730
// @require         https://greasyfork.org/scripts/432807-inputnumber/code/InputNumber.js?version=1068774
// @grant           GM_registerMenuCommand
// @grant           GM_notification
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           GM_addValueChangeListener
// @connect         api.bilibili.com
// @run-at          document-start
// @compatible      edge 版本不小于 85
// @compatible      chrome 版本不小于 85
// @compatible      firefox 版本不小于 90
// ==/UserScript==

/* global UserscriptAPI, PushQueue */
(function() {
  'use strict'

  if (GM_info.scriptHandler !== 'Tampermonkey') {
    const { script } = GM_info
    script.author ??= 'Laster2800'
    script.homepage ??= 'https://greasyfork.org/zh-CN/scripts/395456'
    script.supportURL ??= 'https://greasyfork.org/zh-CN/scripts/395456/feedback'
  }

  const sortType = {
    default: 'serial',
    defaultR: 'serial:R',
    duration: 'duration',
    durationR: 'duration:R',
    pubtime: 'pubtime',
    pubtimeR: 'pubtime:R',
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
   * @property {GMObject_infoMap} infoMap 信息属性
   * @property {GMObject_runtime} runtime 运行时变量
   * @property {string[]} configDocumentStart document-start 时期配置
   * @property {GMObject_data} data 脚本数据
   * @property {GMObject_url} url URL
   * @property {GMObject_regex} regex 正则表达式
   * @property {{[c: string]: *}} const 常量
   * @property {GMObject_panel} panel 面板
   * @property {{[s: string]: HTMLElement}} el HTML 元素
   */
  /**
   * @typedef GMObject_config
   * @property {boolean} headerButton 顶栏入口
   * @property {headerButtonOp} headerButtonOpL 顶栏入口左键点击行为
   * @property {headerButtonOp} headerButtonOpR 顶栏入口右键点击行为
   * @property {headerButtonOp} headerButtonOpM 顶栏入口中键点击行为
   * @property {headerMenu} headerMenu 顶栏入口弹出面板设置
   * @property {openHeaderMenuLink} openHeaderMenuLink 弹出面板内链接点击行为
   * @property {boolean} headerMenuKeepRemoved 弹出面板保留被移除视频
   * @property {boolean} headerMenuSearch 弹出面板搜索框
   * @property {boolean} headerMenuSortControl 弹出面板排序控制器
   * @property {boolean} headerMenuAutoRemoveControl 弹出面板自动移除控制器
   * @property {boolean} headerMenuFnSetting 弹出面板：设置
   * @property {boolean} headerMenuFnHistory 弹出面板：历史
   * @property {boolean} headerMenuFnRemoveAll 弹出面板：清空
   * @property {boolean} headerMenuFnRemoveWatched 弹出面板：移除已看
   * @property {boolean} headerMenuFnShowAll 弹出面板：显示
   * @property {boolean} headerMenuFnPlayAll 弹出面板：播放
   * @property {boolean} removeHistory 稍后再看移除记录
   * @property {removeHistorySavePoint} removeHistorySavePoint 保存稍后再看历史数据的时间点
   * @property {number} removeHistorySavePeriod 数据保存最小时间间隔
   * @property {number} removeHistoryFuzzyCompare 模糊比对深度
   * @property {number} removeHistorySaves 稍后再看历史数据记录保存数
   * @property {boolean} removeHistoryTimestamp 使用时间戳优化移除记录
   * @property {number} removeHistorySearchTimes 历史回溯深度
   * @property {boolean} batchAddLoadForward 批量添加：加载关注者转发的稿件
   * @property {boolean} batchAddLoadAfterTimeSync 批量添加：执行时间同步后是否自动加载稿件
   * @property {fillWatchlaterStatus} fillWatchlaterStatus 填充稍后再看状态
   * @property {boolean} searchDefaultValue 激活搜索框默认值功能
   * @property {autoSort} autoSort 自动排序
   * @property {boolean} videoButton 视频播放页稍后再看状态快速切换
   * @property {autoRemove} autoRemove 自动将视频从播放列表移除
   * @property {boolean} redirect 稍后再看模式重定向至常规模式播放
   * @property {boolean} dynamicBatchAddManagerButton 动态主页批量添加管理器按钮
   * @property {number} autoReloadList 自动刷新列表页面
   * @property {openListVideo} openListVideo 列表页面视频点击行为
   * @property {boolean} listStickControl 列表页面控制栏随页面滚动
   * @property {boolean} listSearch 列表页面搜索框
   * @property {boolean} listSortControl 列表页面排序控制器
   * @property {boolean} listAutoRemoveControl 列表页面自动移除控制器
   * @property {boolean} listBatchAddManagerButton 列表页面批量添加管理器按钮
   * @property {boolean} removeButton_removeAll 移除「一键清空」按钮
   * @property {boolean} removeButton_removeWatched 移除「移除已观看视频」按钮
   * @property {boolean} headerCompatible 兼容第三方顶栏
   * @property {menuScrollbarSetting} menuScrollbarSetting 弹出面板的滚动条设置
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
   * @property {'old' | '2022' | '3rd-party'} headerType 顶栏版本
   * @property {boolean} reloadWatchlaterListData 刷新稍后再看列表数据
   * @property {boolean} loadingWatchlaterListData 正在加载稍后再看列表数据
   * @property {boolean} savingRemoveHistoryData 正在存储稍后再看历史数据
   * @property {number} autoReloadListTid 列表页面自动刷新定时器 ID
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
   * @property {number} [pubdate] 视频发布时间
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
   * @property {string} api_dynamicList 动态列表
   * @property {string} page_watchlaterList 列表页面
   * @property {string} page_videoNormalMode 常规播放页
   * @property {string} page_videoWatchlaterMode 稍后再看播放页
   * @property {string} page_watchlaterPlayAll 稍后再看播放全部（临时禁用重定向）
   * @property {page_userSpace} page_userSpace 用户空间
   * @property {string} gm_changelog 更新日志
   */
  /**
   * @typedef GMObject_regex
   * @property {RegExp} page_watchlaterList 匹配列表页面
   * @property {RegExp} page_videoNormalMode 匹配常规播放页
   * @property {RegExp} page_videoWatchlaterMode 匹配稍后再看播放页
   * @property {RegExp} page_dynamic 匹配动态页面
   * @property {RegExp} page_dynamicMenu 匹配旧版动态面板
   * @property {RegExp} page_userSpace 匹配用户空间
   * @property {RegExp} page_search 匹配搜索页面
   */
  /**
   * @typedef GMObject_panel
   * @property {GMObject_panel_item} setting 设置
   * @property {GMObject_panel_item} history 移除记录
   * @property {GMObject_panel_item} batchAddManager 批量添加管理器
   * @property {GMObject_panel_item} entryPopup 入口弹出面板
   */
  /**
   * @typedef GMObject_panel_item
   * @property {0 | 1 | 2 | 3 | -1} state 打开状态（关闭 | 开启中 | 打开 | 关闭中 | 错误）
   * @property {0 | 1 | 2} wait 等待阻塞状态（无等待阻塞 | 等待开启 | 等待关闭）
   * @property {HTMLElement} el 面板元素
   * @property {() => (void | Promise<void>)} [openHandler] 打开面板的回调函数
   * @property {() => (void | Promise<void>)} [closeHandler] 关闭面板的回调函数
   * @property {() => void} [openedHandler] 彻底打开面板后的回调函数
   * @property {() => void} [closedHandler] 彻底关闭面板后的回调函数
   */
  /**
   * 全局对象
   * @type {GMObject}
   */
  const gm = {
    id: gmId,
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20220710,
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
      removeHistory: { default: true, attr: 'checked', manual: true, configVersion: 20210911 },
      removeHistorySavePoint: { default: Enums.removeHistorySavePoint.listAndMenu, attr: 'value', configVersion: 20210628 },
      removeHistorySavePeriod: { default: 60, type: 'int', attr: 'value', max: 600, needNotReload: true, configVersion: 20210908 },
      removeHistoryFuzzyCompare: { default: 1, type: 'int', attr: 'value', max: 5, needNotReload: true, configVersion: 20210722 },
      removeHistorySaves: { default: 100, type: 'int', attr: 'value', manual: true, needNotReload: true, min: 10, max: 500, configVersion: 20210808 },
      removeHistoryTimestamp: { default: true, attr: 'checked', needNotReload: true, configVersion: 20210703 },
      removeHistorySearchTimes: { default: 100, type: 'int', attr: 'value', manual: true, needNotReload: true, min: 1, max: 500, configVersion: 20210819 },
      batchAddLoadForward: { default: true, attr: 'checked', configVersion: 20220607, needNotReload: true },
      batchAddLoadAfterTimeSync: { default: true, attr: 'checked', configVersion: 20220513, needNotReload: true },
      fillWatchlaterStatus: { default: Enums.fillWatchlaterStatus.dynamic, attr: 'value', configVersion: 20200819 },
      searchDefaultValue: { default: true, attr: 'checked', configVersion: 20220606 },
      autoSort: { default: Enums.autoSort.auto, attr: 'value', configVersion: 20220115 },
      videoButton: { default: true, attr: 'checked' },
      autoRemove: { default: Enums.autoRemove.openFromList, attr: 'value', configVersion: 20210612 },
      redirect: { default: false, attr: 'checked', configVersion: 20210322.1 },
      dynamicBatchAddManagerButton: { default: true, attr: 'checked', configVersion: 20210902 },
      autoReloadList: { default: 0, type: 'int', attr: 'value', min: 5, max: 600, configVersion: 20220710 },
      openListVideo: { default: Enums.openListVideo.openInCurrent, attr: 'value', configVersion: 20200717 },
      listStickControl: { default: true, attr: 'checked', configVersion: 20220410 },
      listSearch: { default: true, attr: 'checked', configVersion: 20210810.1 },
      listSortControl: { default: true, attr: 'checked', configVersion: 20210810 },
      listAutoRemoveControl: { default: true, attr: 'checked', configVersion: 20210908 },
      listBatchAddManagerButton: { default: true, attr: 'checked', configVersion: 20210908 },
      removeButton_removeAll: { default: false, attr: 'checked', configVersion: 20200722 },
      removeButton_removeWatched: { default: false, attr: 'checked', configVersion: 20200722 },
      headerCompatible: { default: Enums.headerCompatible.none, attr: 'value', configVersion: 20220410 },
      menuScrollbarSetting: { default: Enums.menuScrollbarSetting.beautify, attr: 'value', configVersion: 20210808.1 },
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
      api_dynamicList: 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all',
      page_watchlaterList: 'https://www.bilibili.com/watchlater/#/list',
      page_videoNormalMode: 'https://www.bilibili.com/video',
      page_videoWatchlaterMode: 'https://www.bilibili.com/medialist/play/watchlater',
      page_watchlaterPlayAll: `https://www.bilibili.com/medialist/play/watchlater/?${gmId}_disable_redirect=true`,
      page_userSpace: uid => `https://space.bilibili.com/${uid}`,
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliWatchlaterPlus/changelog.md',
      external_fixHeader: 'https://greasyfork.org/zh-CN/scripts/430292',
    },
    regex: {
      // 只要第一个「#」后是「/list([/?#]|$)」即被视为列表页面
      // B站并不会将「#/list」之后的「[/?#]」视为锚点的一部分，这不符合 URL 规范，但只能将错就错了
      page_watchlaterList: /\.com\/watchlater\/[^#]*#\/list([#/?]|$)/,
      page_videoNormalMode: /\.com\/video([#/?]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/(watchlater|ml\d+)([#/?]|$)/,
      page_dynamic: /\/t\.bilibili\.com(\/|$)/,
      page_dynamicMenu: /\.com\/pages\/nav\/index_new([#/?]|$)/,
      page_userSpace: /space\.bilibili\.com([#/?]|$)/,
      page_search: /search\.bilibili\.com\/.+/, // 不含搜索主页
    },
    const: {
      fadeTime: 400,
      textFadeTime: 100,
      noticeTimeout: 5600,
      updateHighlightColor: '#4cff9c',
      inputThrottleWait: 250,
      batchAddRequestInterval: 350,
      fixerHint: '固定在列表最后，并禁用自动移除及排序功能\n右键点击可取消所有固定项',
      searchDefaultValueHint: '右键点击保存默认值，中键点击清空默认值\n当前默认值：$1',
    },
    panel: {
      setting: { state: 0, wait: 0, el: null },
      history: { state: 0, wait: 0, el: null },
      batchAddManager: { state: 0, wait: 0, el: null },
      entryPopup: { state: 0, wait: 0, el: null },
    },
    el: {
      gmRoot: null,
      setting: null,
      history: null,
    },
  }

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
      getConfig(gmKey, defaultValue, writeback = true) {
        let invalid = false
        let value = GM_getValue(gmKey)
        if (Enums && gmKey in Enums) {
          if (!Object.values(Enums[gmKey]).includes(value)) {
            invalid = true
          }
        } else if (typeof value === typeof defaultValue) { // 对象默认赋 null 无需额外处理
          const { type } = gm.configMap[gmKey]
          if (type === 'int' || type === 'float') {
            invalid = gm.configMap[gmKey].min > value || gm.configMap[gmKey].max < value
          }
        } else {
          invalid = true
        }
        if (invalid) {
          value = defaultValue
          writeback && GM_setValue(gmKey, value)
        }
        return value
      },

      /**
       * 重置脚本
       */
      reset() {
        const gmKeys = GM_listValues()
        for (const gmKey of gmKeys) {
          GM_deleteValue(gmKey)
        }
      },
    }

    /**
     * document-start 级别初始化
     */
    initAtDocumentStart() {
      if (gm.configVersion > 0) {
        for (const name of gm.configDocumentStart) {
          gm.config[name] = this.method.getConfig(name, gm.configMap[name].default)
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

        if (self === top) {
          if (gm.config.searchDefaultValue) {
            GM_addValueChangeListener('searchDefaultValue_value', (name, oldVal, newVal) => window.dispatchEvent(new CustomEvent('updateSearchTitle', { detail: { value: newVal } })))
          }
        }
      } catch (e) {
        api.logger.error(e)
        api.message.confirm('初始化错误！是否彻底清空内部数据以重置脚本？').then(result => {
          if (result) {
            this.method.reset()
            location.reload()
          }
        })
      }
    }

    /**
     * 初始化全局对象
     */
    initGMObject() {
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
              if (data && typeof data === 'object') {
                Reflect.setPrototypeOf(data, PushQueue.prototype) // 初始化替换原型不会影响内联缓存
                if (data.maxSize !== gm.config.removeHistorySaves) {
                  data.setMaxSize(gm.config.removeHistorySaves)
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
                GM_setValue('watchlaterListCache', current.map(item => ({
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
                  pubdate: item.pubdate,
                  videos: item.videos,
                })))
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
      if (gm.configVersion >= 20211013) { // 4.23.12.20211013
        if (gm.configVersion < gm.configUpdate) {
          // 必须按从旧到新的顺序写
          // 内部不能使用 gm.configUpdate，必须手写更新后的配置版本号！

          // 4.24.1.20220104
          if (gm.configVersion < 20220104) {
            GM_deleteValue('hideWatchlaterInCollect')
          }

          // 4.24.4.20220115
          if (gm.configVersion < 20220115) {
            GM_deleteValue('watchlaterListCacheTime')
            GM_deleteValue('watchlaterListCache')
          }

          // 4.26.13.20220513
          if (gm.configVersion < 20220513) {
            GM_deleteValue('batchAddLoadAfterTimeSync')
          }

          // 4.27.0.20220605
          if (gm.configVersion < 20220605) {
            const bp = GM_getValue('batchParams')
            if (bp && (!bp.id4a || Number.parseInt(bp.id4a) < 350)) {
              bp.id4a = '350'
              GM_setValue('batchParams', bp)
            }
          }

          // 功能性更新后更新此处配置版本，通过时跳过功能性更新设置，否则转至 readConfig() 中处理
          if (gm.configVersion >= 20220710) {
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
          }
        }
      } else {
        this.method.reset()
        gm.configVersion = null
      }
    }

    /**
     * 用户配置读取
     */
    readConfig() {
      if (gm.configVersion > 0) {
        for (const [name, item] of Object.entries(gm.configMap)) {
          if (!gm.configDocumentStart.includes(name)) {
            gm.config[name] = this.method.getConfig(name, item.default)
          }
        }
        if (gm.configVersion !== gm.configUpdate) {
          this.openUserSetting(2)
        }
      } else {
        // 用户强制初始化，或第一次安装脚本，或版本过旧
        gm.configVersion = 0
        for (const [name, item] of Object.entries(gm.configMap)) {
          gm.config[name] = item.default
          GM_setValue(name, item.default)
        }
        this.openUserSetting(1)
      }
    }

    /**
     * 添加脚本菜单
     */
    addScriptMenu() {
      // 用户配置设置
      GM_registerMenuCommand('用户设置', () => this.openUserSetting())
      // 批量添加管理器
      GM_registerMenuCommand('批量添加管理器', () => this.openBatchAddManager())
      if (gm.config.removeHistory) {
        // 稍后再看移除记录
        GM_registerMenuCommand('稍后再看移除记录', () => this.openRemoveHistory())
      }
      // 强制初始化
      GM_registerMenuCommand('初始化脚本', () => this.resetScript())
    }

    /**
     * 打开用户设置
     * @param {number} [type=0] 常规 `0` | 初始化 `1` | 功能性更新 `2`
     */
    openUserSetting(type = 0) {
      if (gm.el.setting) {
        this.openPanelItem('setting')
      } else {
        /** @type {{[n: string]: HTMLElement}} */
        const el = {}
        setTimeout(() => {
          initSetting()
          processConfigItem()
          processSettingItem()
          this.openPanelItem('setting')
        })

        /**
         * 设置页初始化
         */
        const initSetting = () => {
          gm.el.setting = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.panel.setting.el = gm.el.setting
          gm.el.setting.className = 'gm-setting gm-modal-container'
          if (gm.config.hideDisabledSubitems) {
            gm.el.setting.classList.add('gm-hideDisabledSubitems')
          }

          const getItemHTML = (label, ...items) => {
            let html = `<div class="gm-item-container"><div class="gm-item-label">${label}</div><div class="gm-item-content">`
            for (const item of items) {
              html += `<div class="gm-item${item.className ? ` ${item.className}` : ''}"${item.desc ? ` title="${item.desc}"` : ''}>${item.html}</div>`
            }
            html += '</div></div>'
            return html
          }
          let itemsHTML = ''
          itemsHTML += getItemHTML('全局功能', {
            desc: '在顶栏「动态」和「收藏」之间加入稍后再看入口，鼠标移至上方时弹出列表面板，支持点击功能设置。',
            html: `<label>
              <span>在顶栏中加入稍后再看入口</span>
              <input id="gm-headerButton" type="checkbox">
            </label>`,
          }, {
            desc: '选择左键点击入口时执行的操作。',
            html: `<div>
              <span>在入口上点击鼠标左键时</span>
              <select id="gm-headerButtonOpL"></select>
            </div>`,
          }, {
            desc: '选择右键点击入口时执行的操作。',
            html: `<div>
              <span>在入口上点击鼠标右键时</span>
              <select id="gm-headerButtonOpR"></select>
            </div>`,
          }, {
            desc: '选择中键点击入口时执行的操作。',
            html: `<div>
              <span>在入口上点击鼠标中键时</span>
              <select id="gm-headerButtonOpM"></select>
            </div>`,
          }, {
            desc: '设置入口弹出面板。',
            html: `<div>
              <span>将鼠标移动至入口上方时</span>
              <select id="gm-headerMenu">
                <option value="${Enums.headerMenu.enable}">弹出稍后再看列表</option>
                <option value="${Enums.headerMenu.enableSimple}">弹出简化的稍后再看列表</option>
                <option value="${Enums.headerMenu.disable}">不执行操作</option>
              </select>
            </div>`,
          }, {
            desc: '选择在弹出面板中点击链接的行为。',
            html: `<div>
              <span>在弹出面板中点击链接时</span>
              <select id="gm-openHeaderMenuLink">
                <option value="${Enums.openHeaderMenuLink.openInCurrent}">在当前页面打开</option>
                <option value="${Enums.openHeaderMenuLink.openInNew}">在新标签页打开</option>
              </select>
            </div>`,
          }, {
            desc: '在弹出面板中显示自当前页面打开以来从弹出面板移除的视频。',
            html: `<label>
              <span>在弹出面板中显示被移除的视频</span>
              <input id="gm-headerMenuKeepRemoved" type="checkbox">
            </label>`,
          }, {
            desc: '在弹出面板顶部显示搜索框。',
            html: `<label>
              <span>在弹出面板顶部显示搜索框</span>
              <input id="gm-headerMenuSearch" type="checkbox">
            </label>`,
          }, {
            desc: '在弹出面板底部显示排序控制器。',
            html: `<label>
              <span>在弹出面板底部显示排序控制器</span>
              <input id="gm-headerMenuSortControl" type="checkbox">
            </label>`,
          }, {
            desc: '在弹出面板底部显示自动移除控制器。',
            html: `<label>
              <span>在弹出面板底部显示自动移除控制器</span>
              <input id="gm-headerMenuAutoRemoveControl" type="checkbox">
            </label>`,
          }, {
            desc: '设置在弹出列表显示的快捷功能。',
            html: `<div>
              <span>在弹出面板底部显示：</span>
              <span class="gm-lineitems">
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
              </span>
            </div>`,
          })
          itemsHTML += getItemHTML('全局功能', {
            desc: '保留稍后再看列表中的数据，以查找出一段时间内将哪些视频移除出稍后再看，用于拯救误删操作。关闭该选项会将内部历史数据清除！',
            html: `<label>
              <span>开启稍后再看移除记录</span>
              <input id="gm-removeHistory" type="checkbox">
              <span id="gm-rhWarning" class="gm-warning" title>⚠</span>
            </label>`,
          }, {
            desc: '选择在何时保存稍后再看历史数据。',
            html: `<div>
              <span>为了生成移除记录，</span>
              <select id="gm-removeHistorySavePoint">
                <option value="${Enums.removeHistorySavePoint.list}">在打开列表页面时保存数据</option>
                <option value="${Enums.removeHistorySavePoint.listAndMenu}">在打开列表页面或弹出面板时保存数据</option>
                <option value="${Enums.removeHistorySavePoint.anypage}">在打开任意相关页面时保存数据</option>
              </select>
            </div>`,
          }, {
            desc: '距离上一次保存稍后再看历史数据间隔超过该时间，才会再次进行保存。',
            html: `<div>
              <span>数据保存最小时间间隔（单位：秒）</span>
              <input is="laster2800-input-number" id="gm-removeHistorySavePeriod" value="${gm.configMap.removeHistorySavePeriod.default}" max="${gm.configMap.removeHistorySavePeriod.max}">
            </div>`,
          }, {
            desc: '设置模糊比对深度以快速舍弃重复数据从而降低开销，但可能会造成部分记录遗漏。',
            html: `<div>
              <span>模糊比对模式深度</span>
              <span id="gm-rhfcInformation" class="gm-information" title>💬</span>
              <input is="laster2800-input-number" id="gm-removeHistoryFuzzyCompare" value="${gm.configMap.removeHistoryFuzzyCompare.default}" max="${gm.configMap.removeHistoryFuzzyCompare.max}">
            </div>`,
          }, {
            desc: '较大的数值可能会带来较大的开销（具体参考右侧弹出说明）。将该项修改为比原来小的值会清理过期数据，无法恢复！',
            html: `<div>
              <span>不重复数据记录保存数</span>
              <span id="gm-rhsInformation" class="gm-information" title>💬</span>
              <span id="gm-clearRemoveHistoryData" class="gm-info" title="清理已保存的稍后再看历史数据，不可恢复！">清空数据(0条)</span>
              <input is="laster2800-input-number" id="gm-removeHistorySaves" value="${gm.configMap.removeHistorySaves.default}" min="${gm.configMap.removeHistorySaves.min}" max="${gm.configMap.removeHistorySaves.max}">
            </div>`,
          }, {
            desc: '在稍后再看历史数据记录中保存时间戳，以其优化对数据记录的排序及展示。',
            html: `<label>
              <span>使用时间戳优化移除记录</span>
              <span id="gm-rhtInformation" class="gm-information" title>💬</span>
              <input id="gm-removeHistoryTimestamp" type="checkbox">
            </label>`,
          }, {
            desc: '搜寻时在最近多少条数据记录中查找，设置较小的值能较好地定位最近被添加到稍后再看的视频。',
            html: `<div>
              <span>默认历史回溯深度</span>
              <input is="laster2800-input-number" id="gm-removeHistorySearchTimes" value="${gm.configMap.removeHistorySearchTimes.default}" min="${gm.configMap.removeHistorySearchTimes.min}" max="${gm.configMap.removeHistorySearchTimes.max}">
            </div>`,
          })
          itemsHTML += getItemHTML('全局功能', {
            desc: '在批量添加管理器中，执行加载步骤时是否加载关注者转发的稿件？',
            html: `<label>
              <span>批量添加：加载关注者转发的稿件</span>
              <input id="gm-batchAddLoadForward" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('全局功能', {
            desc: '在批量添加管理器中，执行时间同步后，是否自动执行稿件加载步骤？',
            html: `<label>
              <span>批量添加：执行时间同步后是否自动加载稿件</span>
              <span id="gm-balatsInformation" class="gm-information" title>💬</span>
              <input id="gm-batchAddLoadAfterTimeSync" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('全局功能', {
            desc: '填充默认情况下缺失的稍后再看状态信息。',
            html: `<div>
              <span>填充缺失的稍后再看状态信息：</span>
              <select id="gm-fillWatchlaterStatus">
                <option value="${Enums.fillWatchlaterStatus.dynamic}">仅动态页面</option>
                <option value="${Enums.fillWatchlaterStatus.dynamicAndVideo}">仅动态和视频播放页面</option>
                <option value="${Enums.fillWatchlaterStatus.anypage}">所有页面</option>
                <option value="${Enums.fillWatchlaterStatus.never}">禁用功能</option>
              </select>
              <span id="gm-fwsInformation" class="gm-information" title>💬</span>
            </div>`,
          })
          itemsHTML += getItemHTML('全局功能', {
            desc: '激活后在搜索框上右键点击保存默认值，中键点击清空默认值。',
            html: `<label>
              <span>搜索：激活搜索框默认值功能</span>
              <span id="gm-sdvInformation" class="gm-information" title>💬</span>
              <input id="gm-searchDefaultValue" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('全局功能', {
            desc: '决定首次打开列表页面或弹出面板时，如何对稍后再看列表内容进行排序。',
            html: `<div>
              <span>自动排序：</span>
              <select id="gm-autoSort">
                <option value="${Enums.autoSort.auto}">使用上一次排序控制器的选择</option>
                <option value="${Enums.autoSort.default}">禁用功能</option>
                <option value="${Enums.autoSort.defaultR}">使用 [ 默认↓ ] 排序</option>
                <option value="${Enums.autoSort.duration}">使用 [ 时长 ] 排序</option>
                <option value="${Enums.autoSort.durationR}">使用 [ 时长↓ ] 排序</option>
                <option value="${Enums.autoSort.pubtime}">使用 [ 发布 ] 排序</option>
                <option value="${Enums.autoSort.pubtimeR}">使用 [ 发布↓ ] 排序</option>
                <option value="${Enums.autoSort.progress}">使用 [ 进度 ] 排序</option>
                <option value="${Enums.autoSort.uploader}">使用 [ UP主 ] 排序</option>
                <option value="${Enums.autoSort.title}">使用 [ 标题 ] 排序</option>
                <option value="${Enums.autoSort.fixed}">使用 [ 固定 ] 排序</option>
              </select>
            </div>`,
          })
          itemsHTML += getItemHTML('全局功能', {
            desc: '指定使用收藏功能时，将视频从稍后再看移动至哪个收藏夹。',
            html: `<div>
              <span>稍后再看收藏夹</span>
              <span id="gm-watchlaterMediaList" class="gm-info">设置</span>
            </div>`,
          })
          itemsHTML += getItemHTML('播放页面', {
            desc: '在播放页面中加入能将视频快速切换添加或移除出稍后再看列表的按钮。',
            html: `<label>
              <span>加入快速切换视频稍后再看状态的按钮</span>
              <input id="gm-videoButton" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('播放页面', {
            desc: '打开播放页面时，自动将视频从稍后再看列表中移除，或在特定条件下执行自动移除。',
            html: `<div>
              <span>打开页面时，</span>
              <select id="gm-autoRemove">
                <option value="${Enums.autoRemove.always}">若视频在稍后再看中，则移除出稍后再看</option>
                <option value="${Enums.autoRemove.openFromList}">若是从列表页面或弹出面板点击进入，则移除出稍后再看</option>
                <option value="${Enums.autoRemove.never}">不执行自动移除功能（可通过自动移除控制器临时开启）</option>
                <option value="${Enums.autoRemove.absoluteNever}">彻底禁用自动移除功能</option>
              </select>
            </div>`,
          })
          itemsHTML += getItemHTML('播放页面', {
            desc: `打开「${gm.url.page_videoWatchlaterMode}」页面时，自动切换至「${gm.url.page_videoNormalMode}」页面进行播放，但不影响「播放全部」等相关功能。`,
            html: `<label>
              <span>从稍后再看模式强制切换到常规模式播放（重定向）</span>
              <input id="gm-redirect" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('动态主页', {
            desc: '批量添加管理器可以将投稿批量添加到稍后再看。',
            html: `<label>
              <span>显示批量添加管理器按钮</span>
              <input id="gm-dynamicBatchAddManagerButton" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('列表页面', {
            desc: `设置「${gm.url.page_watchlaterList}」页面的自动刷新策略。`,
            html: `<div>
              <span>自动刷新时间间隔（单位：分钟）</span>
              <span id="gm-arlInformation" class="gm-information" title>💬</span>
              <input is="laster2800-input-number" id="gm-autoReloadList" value="${gm.configMap.autoReloadList.default}" min="${gm.configMap.autoReloadList.min}" max="${gm.configMap.autoReloadList.max}" allow-zero="true">
            </div>`,
          })
          itemsHTML += getItemHTML('列表页面', {
            desc: `设置在「${gm.url.page_watchlaterList}」页面点击视频时的行为。`,
            html: `<div>
              <span>点击视频时</span>
              <select id="gm-openListVideo">
                <option value="${Enums.openListVideo.openInCurrent}">在当前页面打开</option>
                <option value="${Enums.openListVideo.openInNew}">在新标签页打开</option>
              </select>
            </div>`,
          })
          itemsHTML += getItemHTML('列表页面', {
            desc: '控制栏跟随页面滚动，建议配合「[相关调整] 将顶栏固定在页面顶部」使用。',
            html: `<label>
              <span>控制栏随页面滚动</span>
              <input id="gm-listStickControl" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('列表页面', {
            desc: '在列表页面显示搜索框。',
            html: `<label>
              <span>显示搜索框</span>
              <input id="gm-listSearch" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('列表页面', {
            desc: '在列表页面显示排序控制器。',
            html: `<label>
              <span>显示排序控制器</span>
              <input id="gm-listSortControl" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('列表页面', {
            desc: '在列表页面显示自动移除控制器。',
            html: `<label>
              <span>显示自动移除控制器</span>
              <input id="gm-listAutoRemoveControl" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('列表页面', {
            desc: '批量添加管理器可以将投稿批量添加到稍后再看。',
            html: `<label>
              <span>显示批量添加管理器按钮</span>
              <input id="gm-listBatchAddManagerButton" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('列表页面', {
            desc: '这个按钮太危险了……',
            html: `<label>
              <span>移除「一键清空」按钮</span>
              <input id="gm-removeButton_removeAll" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('列表页面', {
            desc: '这个按钮太危险了……',
            html: `<label>
              <span>移除「移除已观看视频」按钮</span>
              <input id="gm-removeButton_removeWatched" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('相关调整', {
            desc: '无须兼容第三方顶栏时务必选择「无」，否则脚本无法正常工作！\n若列表中没有提供你需要的第三方顶栏，且该第三方顶栏有一定用户基数，可在脚本反馈页发起请求。',
            html: `<div>
              <span>兼容第三方顶栏：</span>
              <select id="gm-headerCompatible">
                <option value="${Enums.headerCompatible.none}">无</option>
                <option value="${Enums.headerCompatible.bilibiliEvolved}">Bilibili Evolved</option>
              </select>
              <span id="gm-hcWarning" class="gm-warning gm-trailing" title>⚠</span>
            </div>`,
          })
          itemsHTML += getItemHTML('相关调整', {
            desc: '安装固顶官方顶栏的用户样式（建议使用 Stylus 安装）。',
            html: `<div>
              <span>将顶栏固定在页面顶部</span>
              <a id="gm-fixHeader" class="gm-info" href="${gm.url.external_fixHeader}" target="_blank">安装功能</a>
            </div>`,
          })
          itemsHTML += getItemHTML('相关调整', {
            desc: '对顶栏各入口弹出面板中滚动条的样式进行设置。',
            html: `<div>
              <span>对于弹出面板中的滚动条</span>
              <select id="gm-menuScrollbarSetting">
                <option value="${Enums.menuScrollbarSetting.beautify}">修改其外观为现代风格</option>
                <option value="${Enums.menuScrollbarSetting.hidden}">将其隐藏（不影响鼠标滚动）</option>
                <option value="${Enums.menuScrollbarSetting.original}">维持官方的滚动条样式</option>
              </select>
            </div>`,
          })
          itemsHTML += getItemHTML('脚本设置', {
            desc: '选择脚本主要逻辑的运行时期。',
            html: `<div>
              <span>脚本运行时期：</span>
              <select id="gm-mainRunAt">
                <option value="${Enums.mainRunAt.DOMContentLoaded}">DOMContentLoaded</option>
                <option value="${Enums.mainRunAt.load}">load</option>
              </select>
              <span id="gm-mraInformation" class="gm-information" title>💬</span>
            </div>`,
          })
          itemsHTML += getItemHTML('脚本设置', {
            desc: '稍后再看列表数据本地缓存有效期（单位：秒）',
            html: `<div>
              <span>稍后再看列表数据本地缓存有效期（单位：秒）</span>
              <span id="gm-wlcvpInformation" class="gm-information" title>💬</span>
              <input is="laster2800-input-number" id="gm-watchlaterListCacheValidPeriod" value="${gm.configMap.watchlaterListCacheValidPeriod.default}" min="${gm.configMap.watchlaterListCacheValidPeriod.min}" max="${gm.configMap.watchlaterListCacheValidPeriod.max}">
            </div>`,
          })
          itemsHTML += getItemHTML('用户设置', {
            desc: '一般情况下，是否在用户设置中隐藏被禁用项的子项？',
            html: `<label>
              <span>一般情况下隐藏被禁用项的子项</span>
              <input id="gm-hideDisabledSubitems" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('用户设置', {
            desc: '如果更改的配置需要重新加载才能生效，那么在设置完成后重新加载页面。',
            html: `<label>
              <span>必要时在设置完成后重新加载页面</span>
              <input id="gm-reloadAfterSetting" type="checkbox">
            </label>`,
          })

          gm.el.setting.innerHTML = `
            <div class="gm-setting-page gm-modal">
              <div class="gm-title">
                <a class="gm-maintitle" title="${GM_info.script.homepage}" href="${GM_info.script.homepage}" target="_blank">
                  <span>${GM_info.script.name}</span>
                </a>
                <div class="gm-subtitle">V${GM_info.script.version} by ${GM_info.script.author}</div>
              </div>
              <div class="gm-items">${itemsHTML}</div>
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
          for (const name of Object.keys({ ...gm.configMap, ...gm.infoMap })) {
            el[name] = gm.el.setting.querySelector(`#gm-${name}`)
          }

          el.settingPage = gm.el.setting.querySelector('.gm-setting-page')
          el.items = gm.el.setting.querySelector('.gm-items')
          el.maintitle = gm.el.setting.querySelector('.gm-maintitle')
          el.changelog = gm.el.setting.querySelector('.gm-changelog')
          switch (type) {
            case 1:
              el.settingPage.dataset.type = 'init'
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(初始化设置)</span>'
              break
            case 2:
              el.settingPage.dataset.type = 'updated'
              el.maintitle.innerHTML += '<br><span style="font-size:0.8em">(功能性更新设置)</span>'
              for (const [name, item] of Object.entries({ ...gm.configMap, ...gm.infoMap })) {
                if (item.configVersion > gm.configVersion) {
                  const updated = api.dom.findAncestor(el[name], el => el.matches('.gm-item, .gm-lineitem'))
                  updated?.classList.add('gm-updated')
                }
              }
              break
            default:
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
          `, null, { width: '36em', position: { top: '80%' } })
          el.rhsInformation = gm.el.setting.querySelector('#gm-rhsInformation')
          api.message.hoverInfo(el.rhsInformation, `
            <div style="line-height:1.6em">
              即使突破限制将该项设置为最大限制值的两倍，保存与读取对页面加载的影响仍可忽略不计（毫秒级），最坏情况下生成移除记录的耗时也能被控制在 1 秒以内。但仍不建议取太大的值，原因是移除记录本质上是一种误删后的挽回手段，非常近期的历史足以达到效果。
            </div>
          `, null, { width: '36em', position: { top: '80%' } })
          el.rhtInformation = gm.el.setting.querySelector('#gm-rhtInformation')
          api.message.hoverInfo(el.rhtInformation, `
            <div style="line-height:1.6em">
              在历史数据记录中添加时间戳，用于改善移除记录中的数据排序，使得排序以「视频『最后一次』被观察到处于稍后再看的时间点」为基准，而非以「视频『第一次』被观察到处于稍后再看的时间点」为基准；同时也利于数据展示与查看。注意，此功能在数据存读及处理上都有额外开销。
            </div>
          `, null, { width: '36em', position: { top: '80%' } })
          el.balatsInformation = gm.el.setting.querySelector('#gm-balatsInformation')
          api.message.hoverInfo(el.balatsInformation, '若同步时间距离当前时间超过 48 小时，则不会执行自动加载。', null, { width: '28em', position: { top: '80%' } })
          el.sdvInformation = gm.el.setting.querySelector('#gm-sdvInformation')
          api.message.hoverInfo(el.sdvInformation, '激活后在搜索框上右键点击保存默认值，中键点击清空默认值。', null, { width: '28em', position: { top: '80%' } })
          el.fwsInformation = gm.el.setting.querySelector('#gm-fwsInformation')
          api.message.hoverInfo(el.fwsInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>在动态页、视频播放页以及其他页面，视频卡片的右下角方存在一个将视频加入或移除出稍后再看的快捷按钮。然而，在刷新页面后，B站不会为之加载稍后再看的状态——即使视频已经在稍后再看中，也不会显示出来。启用该功能后，会自动填充这些缺失的状态信息。</p>
              <p>第三项「所有页面」，会用一套固定的逻辑对脚本能匹配到的所有非特殊页面尝试进行信息填充。脚本本身没有匹配所有B站页面，如果有需要，请在脚本管理器（如 Tampermonkey）中为脚本设置额外的页面匹配规则。由于B站各页面的设计不是很规范，某些页面中视频卡片的设计可能跟其他地方不一致，所以不保证必定能填充成功。</p>
            </div>
          `, null, { width: '36em', position: { top: '80%' } })
          el.mraInformation = gm.el.setting.querySelector('#gm-mraInformation')
          api.message.hoverInfo(el.mraInformation, `
            <div style="line-height:1.6em">
              <p style="margin-bottom:0.5em"><b>DOMContentLoaded</b>：与页面内容同步加载，避免脚本在页面加载度较高时才对页面作修改。上述情况会给人页面加载时间过长的错觉，并且伴随页面变化突兀的不适感。</p>
              <p><b>load</b>：在页面初步加载完成时运行。从理论上来说这个时间点更为合适，且能保证脚本在网页加载速度极慢时仍可正常工作。但要注意的是，以上所说「网页加载速度极慢」的情况并不常见，以下为常见原因：1. 短时间内（在后台）打开十几乃至数十个网页；2. 网络问题。</p>
            </div>
          `, null, { width: '36em', flagSize: '2em', position: { top: '80%' } })
          el.arlInformation = gm.el.setting.querySelector('#gm-arlInformation')
          api.message.hoverInfo(el.arlInformation, `
            <div style="line-height:1.6em">
              <p>设置列表页面自动刷新的时间间隔。</p>
              <p>设置为 <b>0</b> 时禁用自动刷新。</p>
            </div>
          `)
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
          const subitemChange = (target, disabled) => {
            const content = api.dom.findAncestor(target, el => el.classList.contains('gm-item-content'))
            for (const option of content.querySelectorAll('[id|=gm]:not(:first-child)')) {
              if (!target.contains(option)) {
                option.disabled = disabled
              }
            }
            for (let i = 1; i < content.childElementCount; i++) {
              const item = content.children[i]
              if (disabled) {
                item.setAttribute('disabled', '')
              } else {
                item.removeAttribute('disabled')
              }
            }
          }
          el.headerMenuFn = el.headerMenuFnSetting.parentElement.parentElement
          el.headerButton.init = () => {
            const target = el.headerButton
            subitemChange(target, !target.checked)
          }
          el.headerButton.addEventListener('change', el.headerButton.init)
          el.headerCompatible.init = () => setHcWarning()
          el.headerCompatible.addEventListener('change', el.headerCompatible.init)
          el.removeHistory.init = () => {
            const target = el.removeHistory
            subitemChange(target, !target.checked)
            setRhWaring()
          }
          el.removeHistory.addEventListener('change', el.removeHistory.init)
          el.removeHistorySaves.addEventListener('input', setRhWaring)
          el.removeHistorySaves.addEventListener('blur', setRhWaring)
        }

        /**
         * 处理与设置页相关的数据和元素
         */
        const processSettingItem = () => {
          gm.panel.setting.openHandler = onOpen
          gm.panel.setting.openedHandler = onOpened
          gm.el.setting.fadeInDisplay = 'flex'
          el.save.addEventListener('click', onSave)
          el.cancel.addEventListener('click', () => this.closePanelItem('setting'))
          el.shadow.addEventListener('click', () => {
            if (!el.shadow.hasAttribute('disabled')) {
              this.closePanelItem('setting')
            }
          })
          el.reset.addEventListener('click', () => this.resetScript())
          el.clearRemoveHistoryData.addEventListener('click', () => {
            el.removeHistory.checked && this.clearRemoveHistoryData()
          })
          el.watchlaterMediaList.addEventListener('click', async () => {
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
            if (type === 2) {
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
          for (const [name, item] of Object.entries(gm.configMap)) {
            if (!item.manual) {
              const change = saveConfig(name, item.attr)
              if (!item.needNotReload) {
                needReload ||= change
              }
            }
          }

          let shutDownRemoveHistory = false
          // removeHistory
          if (gm.config.removeHistory !== el.removeHistory.checked) {
            gm.config.removeHistory = el.removeHistory.checked
            GM_setValue('removeHistory', gm.config.removeHistory)
            shutDownRemoveHistory = true
            needReload = true
          }
          // 「因」中无 removeHistory，就说明 needReload 需要设置为 true，除非「果」不需要刷新页面就能生效
          if (gm.config.removeHistory) {
            const rhsV = Number.parseInt(el.removeHistorySaves.value)
            if (rhsV !== gm.config.removeHistorySaves && !Number.isNaN(rhsV)) {
              // 因：removeHistorySaves
              // 果：removeHistorySaves & removeHistoryData
              const data = gm.data.removeHistoryData()
              data.setMaxSize(rhsV)
              gm.config.removeHistorySaves = rhsV
              GM_setValue('removeHistorySaves', rhsV)
              GM_setValue('removeHistoryData', data)
              // 不需要修改 needReload
            }
            // 因：removeHistorySearchTimes
            // 果：removeHistorySearchTimes
            const rhstV = Number.parseInt(el.removeHistorySearchTimes.value)
            if (rhstV !== gm.config.removeHistorySearchTimes && !Number.isNaN(rhstV)) {
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

          this.closePanelItem('setting')
          if (type > 0) {
            // 更新配置版本
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
            // 关闭特殊状态
            setTimeout(() => {
              delete el.settingPage.dataset.type
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
          for (const [name, item] of Object.entries(gm.configMap)) {
            const { attr } = item
            el[name][attr] = gm.config[name]
          }
          for (const name of Object.keys(gm.configMap)) {
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
          if (type === 2) {
            const resetSave = () => {
              el.save.title = ''
              el.save.disabled = false
            }

            const points = []
            const totalLength = el.items.scrollHeight
            const items = el.items.querySelectorAll('.gm-updated')
            for (const item of items) {
              points.push(item.offsetTop / totalLength * 100)
            }

            if (points.length > 0) {
              let range = 5 // 显示宽度
              const actualRange = items[0].offsetHeight / totalLength * 100 // 实际宽度
              let realRange = actualRange // 校正后原点到真实末尾的宽度
              if (actualRange > range) {
                range = actualRange
              } else {
                const offset = (actualRange - range) / 2
                for (let i = 0; i < points.length; i++) {
                  points[i] += offset
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
                #${gm.id} [data-type=updated] .gm-items::-webkit-scrollbar {
                  background: linear-gradient(${linear})
                }
              `)

              if (el.items.scrollHeight === el.items.clientHeight) {
                resetSave()
              } else {
                const last = Math.min((points.pop() + realRange) / 100, 0.95) // 给计算误差留点余地
                const onScroll = api.base.throttle(() => {
                  const { items } = el
                  const bottom = (items.scrollTop + items.clientHeight) / items.scrollHeight
                  if (bottom > last) { // 可视区底部超过最后一个更新点
                    resetSave()
                    items.removeEventListener('scroll', onScroll)
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
          const { type } = gm.configMap[name]
          if (type === 'int' || type === 'float') {
            if (typeof val !== 'number') {
              val = type === 'int' ? Number.parseInt(val) : Number.parseFloat(val)
            }
            if (Number.isNaN(val)) {
              val = gm.configMap[name].default
            }
          }
          if (gm.config[name] !== val) {
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
          const warn = el.headerCompatible.value !== Enums.headerCompatible.none
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
        script.openPanelItem('batchAddManager')
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
          script.openPanelItem('batchAddManager')
        })

        /**
         * 初始化管理器
         */
        const initManager = () => {
          gm.el.batchAddManager = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.panel.batchAddManager.el = gm.el.batchAddManager
          gm.el.batchAddManager.className = 'gm-batchAddManager gm-modal-container'
          gm.el.batchAddManager.innerHTML = `
            <div class="gm-batchAddManager-page gm-modal">
              <div class="gm-title">批量添加管理器</div>
              <div class="gm-comment">
                <div>请执行以下步骤以将投稿批量添加到稍后再看（可以跳过部分步骤）。执行过程中可以关闭对话框，但不能关闭页面；也不建议将当前页面置于后台，否则浏览器可能会暂缓甚至暂停任务执行。</div>
                <div>脚本会优先添加投稿时间较早的投稿，达到稍后再看容量上限 100 时终止执行。注意，该功能会在短时间内向后台发起大量请求，滥用可能会导致一段时间内无法正常访问B站，你可以增加平均请求间隔以降低触发拦截机制的概率。</div>
                <div>第一步：加载最近 <input is="laster2800-input-number" id="gm-batch-1a" value="24" digits="Infinity"> <select id="gm-batch-1b" style="border:none;margin: 0 -4px">
                  <option value="${3600 * 24}">天</option>
                  <option value="3600" selected>小时</option>
                  <option value="60">分钟</option>
                </select> 以内发布且不存在于稍后再看的视频投稿<button id="gm-batch-1c">执行</button><button id="gm-batch-1d" disabled>终止</button></div>
                <div>第二步：缩小时间范围到 <input is="laster2800-input-number" id="gm-batch-2a" digits="Infinity"> <select id="gm-batch-2b" style="border:none;margin: 0 -4px">
                  <option value="${3600 * 24}">天</option>
                  <option value="3600" selected>小时</option>
                  <option value="60">分钟</option>
                </select> 以内；可使用上下方向键（配合 Alt/Shift/Ctrl）调整数值大小<button id="gm-batch-2c" disabled hidden>执行</button></div>
                <div>第三步：筛选 <input id="gm-batch-3a" type="text" style="width:10em">，过滤 <input id="gm-batch-3b" type="text" style="width:10em">；支持通配符 ( ? * )，使用 | 分隔关键词<button id="gm-batch-3c" disabled hidden>执行</button></div>
                <div>第四步：将选定稿件添加到稍后再看（平均请求间隔：<input is="laster2800-input-number" id="gm-batch-4a" value="${gm.const.batchAddRequestInterval}" min="250">ms）<button id="gm-batch-4b" disabled>执行</button><button id="gm-batch-4c" disabled>终止</button></div>
              </div>
              <div class="gm-items"></div>
              <div class="gm-bottom">
                <button id="gm-last-add-time">时间同步</button>
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
          el.lastAddTime = gm.el.batchAddManager.querySelector('#gm-last-add-time')
          el.uncheckedDisplay = gm.el.batchAddManager.querySelector('#gm-unchecked-display')
          el.saveParams = gm.el.batchAddManager.querySelector('#gm-save-batch-params')
          el.resetParams = gm.el.batchAddManager.querySelector('#gm-reset-batch-params')
          el.shadow = gm.el.batchAddManager.querySelector('.gm-shadow')

          el.saveParams.paramIds = ['1a', '1b', '3a', '3b', '4a']
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
          el.shadow.addEventListener('click', () => script.closePanelItem('batchAddManager'))

          // 时间同步
          const setLastAddTime = (time = null, writeBack = true) => {
            writeBack && GM_setValue('batchLastAddTime', time)
            el.lastAddTime.val = time
            el.lastAddTime.title = `将一个合适的时间点同步到加载步骤中，以便与上次批量添加操作无缝对接。\n若上一次执行加载步骤时，没有找到新稿件，同步「加载完成时间」。\n若上一次执行添加步骤成功，同步「加载完成时间」；否则（失败或中断），同步「最后一个添加成功的稿件的投稿时间」。${time ? `\n当前同步时间：${new Date(time).toLocaleString()}` : ''}`
            el.lastAddTime.disabled = !time
          }
          setLastAddTime(GM_getValue('batchLastAddTime'), false)
          el.lastAddTime.addEventListener('click', () => {
            if (executing) return api.message.info('执行中，无法同步')
            const target = el.lastAddTime
            if (target.val == null) return
            const secInterval = (Date.now() - target.val) / 1000
            el.id1a.value = secInterval / el.id1b.value // 取精确时间要比向上取整好
            if (gm.config.batchAddLoadAfterTimeSync) {
              if ((Date.now() - target.val) / (1000 * 3600) <= 48) {
                el.id1c.dispatchEvent(new Event('click'))
              } else {
                api.message.info(`已同步到 ${new Date(target.val).toLocaleString()}。同步时间距离当前时间超过 48 小时，不执行自动加载。`, { ms: 2000 })
              }
            } else {
              api.message.info(`已同步到 ${new Date(target.val).toLocaleString()}`)
            }
          })
          // 避免不同标签页中脚本实例互相影响而产生的同步时间错误
          GM_addValueChangeListener('batchLastAddTime', (name, oldVal, newVal, remote) => remote && setLastAddTime(newVal))

          // 非选显示
          const setUncheckedDisplayText = () => {
            el.uncheckedDisplay.textContent = el.uncheckedDisplay._hide ? '显示非选' : '隐藏非选'
          }
          el.uncheckedDisplay._hide = GM_getValue('batchUncheckedDisplay') ?? false
          setUncheckedDisplayText()
          el.uncheckedDisplay.addEventListener('click', () => {
            const target = el.uncheckedDisplay
            target._hide = !target._hide
            GM_setValue('batchUncheckedDisplay', target._hide)
            setUncheckedDisplayText()
            const display = target._hide ? 'none' : ''
            for (let i = 0; i < el.items.childElementCount; i++) {
              const item = el.items.children[i]
              if (!item.firstElementChild.checked) {
                item.style.display = display
              }
            }
          })
          el.items.addEventListener('click', e => {
            if (e.target.type === 'checkbox' && el.uncheckedDisplay._hide) {
              if (!e.target.checked) {
                e.target.parentElement.style.display = 'none'
              }
            }
          })

          // 参数
          el.saveParams.addEventListener('click', () => {
            const batchParams = {}
            for (const id of el.saveParams.paramIds) {
              batchParams[`id${id}`] = el[`id${id}`].value
            }
            GM_setValue('batchParams', batchParams)
            api.message.info('保存成功，重新加载页面后当前参数会被自动加载', 1800)
          })
          el.resetParams.addEventListener('click', () => {
            GM_deleteValue('batchParams')
            api.message.info('重置成功，重新加载页面后参数将加载默认值', 1800)
          })

          let executing = false
          let loadTime = 0

          // 加载投稿
          let stopLoad = false
          el.id1c.addEventListener('click', async () => {
            if (executing) return
            let error = false
            try {
              executing = true
              let page = 1
              let offset = -1
              const tzo = new Date().getTimezoneOffset()
              const v1a = Number.parseFloat(el.id1a.value)
              if (Number.isNaN(v1a)) throw new TypeError('v1a is NaN')
              el.id1a.value = v1a
              el.id1c.disabled = true
              el.id1c.textContent = '执行中'
              el.id1d.disabled = false
              el.id4b.disabled = true
              el.id2a.defaultValue = el.id2a.max = v1a
              el.id2b.syncVal = el.id1b.value
              el.items.textContent = ''
              loadTime = Date.now() // 提前记录 loadTime，这样衔接时绝对不会遗漏动态
              const end = loadTime - v1a * el.id1b.value * 1000
              const avSet = new Set()
              gm.runtime.reloadWatchlaterListData = true
              // eslint-disable-next-line no-unmodified-loop-condition
              while (!stopLoad) {
                const data = new URLSearchParams()
                data.append('timezone_offset', tzo)
                data.append('type', 'all') // video 分类会遗漏一些内容，需手动筛选
                data.append('page', page++) // page 似乎只在第 1 页有意义
                if (offset > 0) { // 后续通过 offset 而非 page 确定位置
                  data.append('offset', offset)
                }
                const resp = await api.web.request({
                  url: `${gm.url.api_dynamicList}?${data.toString()}`,
                }, { check: r => r.code === 0 })
                const { items } = resp.data
                if (!resp.data.has_more || !items || items.length === 0) return // -> finally
                offset = resp.data.offset // data.offset 是字符串类型，不会丢失精度；无需 +1 额外偏移
                let html = ''
                for (let item of items) {
                  let ts = -1
                  // 关注者转发的动态
                  if (gm.config.batchAddLoadForward && item.type === 'DYNAMIC_TYPE_FORWARD') {
                    ts = item.modules.module_author.pub_ts // 使用转发时间
                    item = item.orig
                  }
                  // [视频投稿, 已订阅合集]
                  if (['DYNAMIC_TYPE_AV', 'DYNAMIC_TYPE_UGC_SEASON'].includes(item.type)) {
                    const { modules } = item
                    const author = modules.module_author
                    if (ts < 0) ts = author.pub_ts
                    if (ts * 1000 < end) {
                      el.items.insertAdjacentHTML('afterbegin', html)
                      return // -> finally
                    }
                    const { major } = modules.module_dynamic
                    const core = major[major.type.replace(/^MAJOR_TYPE_/, '').toLowerCase()]
                    const aid = String(core.aid)
                    if (!await webpage.method.getVideoWatchlaterStatusByAid(aid, false, true)) { // 完全跳过存在于稍后再看的视频
                      if (avSet.has(aid)) continue
                      avSet.add(aid)
                      const uncheck = history?.has(aid)
                      const displayNone = uncheck && el.uncheckedDisplay._hide
                      html = `<label class="gm-item" data-aid="${aid}" data-timestamp="${ts}"${displayNone ? ' style="display:none"' : ''}><input type="checkbox"${uncheck ? '' : ' checked'}> <span>${author.label ? `[${author.label}]` : ''}[${author.name}] ${core.title}</span></label>` + html
                    }
                  }
                }
                el.items.insertAdjacentHTML('afterbegin', html)
                await new Promise(resolve => setTimeout(resolve, 250 * (Math.random() * 0.5 + 0.75))) // 切线程，顺便给请求留点间隔
              }
              // 执行到这里只有一个原因：stopLoad 导致任务终止
              api.message.info('批量添加：任务终止', 1800)
            } catch (e) {
              error = true
              loadTime = 0
              api.message.alert('执行失败')
              api.logger.error(e)
            } finally {
              if (!error && !stopLoad) {
                api.message.info('批量添加：稿件加载完成', 1800)
                if (loadTime > 0 && el.items.querySelectorAll('label input:checked').length === 0) {
                  // 无有效新稿件时直接更新同步时间
                  setLastAddTime(loadTime)
                }
              }
              executing = false
              stopLoad = false
              el.id1c.disabled = false
              el.id1c.textContent = '重新执行'
              el.id1d.disabled = true
              el.id4b.disabled = false
              el.id4b.textContent = '执行'
              // 更新第二步的时间范围
              if (el.id2a.defaultValue && el.id2b.syncVal) {
                el.id2a.value = el.id2a.defaultValue
                el.id2b.value = el.id2b.syncVal // 非用户操作不会触发 change 事件
                el.id2b.prevVal = el.id2b.value
              }
              // 自动执行第三步
              el.id3c.dispatchEvent(new Event('click'))
            }
          })
          el.id1d.addEventListener('click', () => {
            stopLoad = true
          })
          el.id1a.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
              const target = el[executing ? 'id1d' : 'id1c']
              if (!target.disabled) {
                target.dispatchEvent(new Event('click'))
              }
            }
          })

          // 时间过滤
          function filterTime() {
            if (executing) return
            try {
              executing = true
              const v2a = Number.parseFloat(el.id2a.value)
              if (Number.isNaN(v2a)) {
                for (let i = 0; i < el.items.childElementCount; i++) {
                  el.items.children[i].classList.remove('gm-filtered-time')
                }
              } else {
                const newEnd = Date.now() - v2a * el.id2b.value * 1000
                for (let i = 0; i < el.items.childElementCount; i++) {
                  const item = el.items.children[i]
                  const timestamp = Number.parseInt(item.dataset.timestamp)
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
          el.id2a.addEventListener('change', throttledFilterTime)
          el.id2b.addEventListener('change', filterTime)
          el.id2c.addEventListener('click', filterTime)

          // 正则过滤
          function filterRegex() {
            if (executing) return
            try {
              const getRegex = str => {
                let result = null
                str = str.trim()
                if (str !== '') {
                  try {
                    str = str.replace(/\s*\|\s*/g, '|') // 移除关键词首末空白符
                      .replace(/[$()+.[\\\]^{}]/g, '\\$&') // escape regex except |
                      .replaceAll('?', '.').replaceAll('*', '.*') // 通配符
                    result = new RegExp(str, 'i')
                  } catch {}
                }
                return result
              }
              executing = true
              el.id3a.value = el.id3a.value.trimStart()
              el.id3b.value = el.id3b.value.trimStart()
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
          el.id4b.addEventListener('click', async () => {
            if (executing) return
            let added = false
            let lastAddTime = 0
            try {
              executing = true
              let v4a = Number.parseFloat(el.id4a.value)
              if (Number.isNaN(v4a)) {
                v4a = gm.const.batchAddRequestInterval
              } else {
                v4a = Math.max(v4a, 250)
              }
              el.id4a.value = v4a
              el.id4b.disabled = true
              el.id4b.textContent = '执行中'
              el.id4c.disabled = false
              el.id1c.disabled = true

              let available = 100 - (await gm.data.watchlaterListData()).length
              const checks = el.items.querySelectorAll('label:not([class*=gm-filtered-]) input:checked')
              for (const check of checks) {
                if (stopAdd) return api.message.info('批量添加：任务终止', 1800) // -> finally
                if (available <= 0) return api.message.info('批量添加：稍后再看已满', 1800) // -> finally
                const item = check.parentElement
                const success = await webpage.method.switchVideoWatchlaterStatus(item.dataset.aid)
                if (!success) throw new Error('add request error')
                lastAddTime = item.dataset.timestamp
                check.checked = false
                if (el.uncheckedDisplay._hide) {
                  item.style.display = 'none'
                }
                available -= 1
                added = true
                await new Promise(resolve => setTimeout(resolve, v4a * (Math.random() * 0.5 + 0.75)))
              }
              lastAddTime = loadTime
              api.message.info('批量添加：已将所有选定稿件添加到稍后再看', 1800)
            } catch (e) {
              api.message.alert('执行失败：可能是因为目标稿件不可用或稍后再看不支持该稿件类型（如互动视频），请尝试取消勾选当前列表中第一个选定的稿件后重新执行')
              api.logger.error(e)
            } finally {
              if (lastAddTime) {
                if (lastAddTime !== loadTime) {
                  lastAddTime = Number.parseInt(lastAddTime) * 1000
                }
                if (lastAddTime > 0) {
                  setLastAddTime(lastAddTime)
                }
              }
              executing = false
              stopAdd = false
              el.id4b.disabled = false
              el.id4b.textContent = '重新执行'
              el.id4c.disabled = true
              el.id1c.disabled = false
              gm.runtime.reloadWatchlaterListData = true
              window.dispatchEvent(new CustomEvent('reloadWatchlaterListData'))

              if (added && api.base.urlMatch(gm.regex.page_watchlaterList)) {
                webpage.reloadWatchlaterListPage(null)
              }
            }
          })
          el.id4c.addEventListener('click', () => {
            stopAdd = true
          })
          el.id4a.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
              const target = el[executing ? 'id4c' : 'id4b']
              if (!target.disabled) {
                target.dispatchEvent(new Event('click'))
              }
            }
          })

          // 时间单位转换
          const syncTimeUnit = (unitEl, valEl) => {
            unitEl.prevVal = unitEl.value
            unitEl.addEventListener('change', () => {
              if (valEl.max !== Number.POSITIVE_INFINITY) {
                valEl.max = (valEl.max * unitEl.prevVal / unitEl.value).toFixed(1)
              }
              if (valEl.defaultValue) {
                valEl.defaultValue = (valEl.defaultValue * unitEl.prevVal / unitEl.value).toFixed(1)
              }
              if (valEl.value) {
                valEl.value = (valEl.value * unitEl.prevVal / unitEl.value).toFixed(1)
                unitEl.prevVal = unitEl.value
              }
            }, true)
          }
          syncTimeUnit(el.id1b, el.id1a)
          syncTimeUnit(el.id2b, el.id2a)
        }
      }
    }

    /**
     * 打开移除记录
     */
    openRemoveHistory() {
      if (!gm.config.removeHistory) {
        api.message.info('请在设置中开启稍后再看移除记录')
        return
      }
      GM_deleteValue('removeHistorySaveTime') // 保险起见，清理一下

      /** @type {{[n: string]: HTMLElement}} */
      const el = {}
      if (gm.el.history) {
        el.searchTimes = gm.el.history.querySelector('#gm-history-search-times')
        el.searchTimes.value = gm.config.removeHistorySearchTimes
        el.searchTimes.current = el.searchTimes.value
        el.sort = gm.el.history.querySelector('#gm-history-sort')
        if (el.sort.type !== 0) {
          el.sort.type = 0 // 降序
        }
        this.openPanelItem('history')
      } else {
        setTimeout(() => {
          initHistory()
          processItem()
          this.openPanelItem('history')
        })

        /**
         * 初始化移除记录页面
         */
        const initHistory = () => {
          gm.el.history = gm.el.gmRoot.appendChild(document.createElement('div'))
          gm.panel.history.el = gm.el.history
          gm.el.history.className = 'gm-history gm-modal-container'
          gm.el.history.innerHTML = `
            <div class="gm-history-page gm-modal">
              <div class="gm-title">稍后再看移除记录</div>
              <div class="gm-comment">
                <div>根据<span id="gm-history-new-or-old" style="padding-right:0"></span><span id="gm-history-save-times">0</span>条不重复数据记录生成，共筛选出<span id="gm-history-removed-num">0</span>条移除记录。排序由视频<span id="gm-history-time-point"></span>被观察到处于稍后再看的时间决定，与被移除出稍后再看的时间无关。如果记录太少请设置增加历史回溯深度；记录太多则减少之，并善用浏览器搜索功能辅助定位。</div>
                <div style="text-align:right;font-weight:bold">
                  <span id="gm-history-sort" style="text-decoration:underline;cursor:pointer"></span>
                  <span title="搜寻时在最近/最早保存的多少条稍后再看历史数据记录中查找。按下回车键或输入框失去焦点时刷新数据。">历史回溯深度：<input is="laster2800-input-number" id="gm-history-search-times" value="${gm.config.removeHistorySearchTimes}" min="${gm.configMap.removeHistorySearchTimes.min}" max="${gm.configMap.removeHistorySearchTimes.max}"></span>
                </div>
              </div>
              <div class="gm-content"></div>
            </div>
            <div class="gm-shadow"></div>
          `
          el.historyPage = gm.el.history.querySelector('.gm-history-page')
          el.comment = gm.el.history.querySelector('.gm-comment')
          el.content = gm.el.history.querySelector('.gm-content')
          el.sort = gm.el.history.querySelector('#gm-history-sort')
          el.timePoint = gm.el.history.querySelector('#gm-history-time-point')
          el.saveTimes = gm.el.history.querySelector('#gm-history-save-times')
          el.removedNum = gm.el.history.querySelector('#gm-history-removed-num')
          el.searchTimes = gm.el.history.querySelector('#gm-history-search-times')
          el.newOrOld = gm.el.history.querySelector('#gm-history-new-or-old')
          el.shadow = gm.el.history.querySelector('.gm-shadow')
        }

        /**
         * 维护内部元素和数据
         */
        const processItem = () => {
          el.content.fadeOutDisplay = 'block'
          el.content.fadeInTime = gm.const.textFadeTime
          el.content.fadeOutTime = gm.const.textFadeTime
          el.searchTimes.current = el.searchTimes.value
          el.searchTimes.addEventListener('blur', () => {
            const target = el.searchTimes
            if (target.value !== el.searchTimes.current) {
              el.searchTimes.current = target.value
              gm.panel.history.openHandler()
            }
          })
          el.searchTimes.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
              el.searchTimes.dispatchEvent(new Event('blur'))
            }
          })

          el.content.addEventListener('click', async e => {
            if (e.target.type === 'checkbox') {
              const box = e.target
              const status = box.checked
              const { bvid } = box.dataset
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
          const typeText = ['降序', '升序', '完全升序']
          const typeDesc = [
            '降序回溯历史，降序显示结果',
            '降序回溯历史，升序显示结果',
            '升序回溯历史，升序显示结果',
          ]
          Reflect.defineProperty(el.sort, 'type', {
            get: function() { return Number.parseInt(this.dataset.type) },
            set: function(val) {
              this.dataset.type = val
              this.textContent = typeText[val]
              this.title = typeDesc[val]
              el.newOrOld.textContent = val < 2 ? '最近' : '最早'
            },
          })
          el.sort.type = 0
          el.sort.addEventListener('click', () => {
            const target = el.sort
            target.type = (target.type + 1) % typeText.length
            gm.panel.history.openHandler()
          })

          gm.panel.history.openHandler = onOpen
          gm.el.history.fadeInDisplay = 'flex'
          el.shadow.addEventListener('click', () => this.closePanelItem('history'))
        }

        /**
         * 移除记录打开时执行
         */
        const onOpen = async () => {
          api.dom.fade(false, el.content)
          el.timePoint.textContent = gm.config.removeHistoryTimestamp ? '最后一次' : '第一次'

          try {
            const map = await webpage.method.getWatchlaterDataMap(item => item.bvid, 'bvid', true)
            const depth = Number.parseInt(el.searchTimes.value)
            let data = null
            if (el.sort.type < 2) {
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
                // ES2019 后 Array#sort() 为稳定排序
                history.sort((a, b) => (b[2] ?? 0) - (a[2] ?? 0))
                if (el.sort.type >= 1) {
                  history.reverse()
                }
              }
              for (const rm of history) {
                result.push(`
                  <div>
                    <a href="${gm.url.page_videoNormalMode}/${rm[0]}" target="_blank">${rm[1]}</a>
                    <input type="checkbox" data-bvid="${rm[0]}">
                    ${rm[2] ? `<div class="gm-history-date">${new Date(rm[2]).toLocaleString()}</div>` : ''}
                  </div>
                `)
              }
            } else {
              if (history.length > 1 && el.sort.type >= 1) {
                history.reverse()
              }
              for (const rm of history) {
                result.push(`
                  <div>
                    <a href="${gm.url.page_videoNormalMode}/${rm[0]}" target="_blank">${rm[1]}</a>
                    <input type="checkbox" data-bvid="${rm[0]}">
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
        for (const item of document.querySelectorAll('.gm-fixed')) {
          item.classList?.remove('gm-fixed')
        }
        api.message.info('已取消所有固定项')
      }
    }

    /**
     * 打开面板项
     * @param {string} name 面板项名称
     * @param {(panel: GMObject_panel_item) => void} [callback] 打开面板项后的回调函数
     * @param {boolean} [keepOthers] 打开时保留其他面板项
     * @returns {Promise<boolean>} 操作是否成功
     */
    async openPanelItem(name, callback, keepOthers) {
      let success = false
      /** @type {GMObject_panel_item}  */
      const panel = gm.panel[name]
      if (panel.wait > 0) return false
      try {
        try {
          if (panel.state === 1) {
            panel.wait = 1
            await api.wait.waitForConditionPassed({
              condition: () => panel.state === 2,
              timeout: 1500 + (panel.el.fadeInTime ?? gm.const.fadeTime),
            })
            return true
          } else if (panel.state === 3) {
            panel.wait = 1
            await api.wait.waitForConditionPassed({
              condition: () => panel.state === 0,
              timeout: 1500 + (panel.el.fadeOutTime ?? gm.const.fadeTime),
            })
          }
        } catch (e) {
          panel.state = -1
          api.logger.error(e)
        } finally {
          panel.wait = 0
        }
        if (panel.state === 0 || panel.state === -1) {
          panel.state = 1
          if (!keepOthers) {
            for (const [key, curr] of Object.entries(gm.panel)) {
              if (key === name || curr.state === 0) continue
              this.closePanelItem(key)
            }
          }
          await panel.openHandler?.()
          await new Promise(resolve => {
            api.dom.fade(true, panel.el, () => {
              resolve()
              panel.openedHandler?.()
              callback?.(panel)
            })
          })
          panel.state = 2
          success = true
        }
        if (success && document.fullscreenElement) {
          document.exitFullscreen()
        }
      } catch (e) {
        panel.state = -1
        api.logger.error(e)
      }
      return success
    }

    /**
     * 关闭面板项
     * @param {string} name 面板项名称
     * @param {(panel: GMObject_panel_item) => void} [callback] 关闭面板项后的回调函数
     * @returns {Promise<boolean>} 操作是否成功
     */
    async closePanelItem(name, callback) {
      /** @type {GMObject_panel_item} */
      const panel = gm.panel[name]
      if (panel.wait > 0) return
      try {
        try {
          if (panel.state === 1) {
            panel.wait = 2
            await api.wait.waitForConditionPassed({
              condition: () => panel.state === 2,
              timeout: 1500 + (panel.el.fadeInTime ?? gm.const.fadeTime),
            })
          } else if (panel.state === 3) {
            panel.wait = 2
            await api.wait.waitForConditionPassed({
              condition: () => panel.state === 0,
              timeout: 1500 + (panel.el.fadeOutTime ?? gm.const.fadeTime),
            })
            return true
          }
        } catch (e) {
          panel.state = -1
          api.logger.error(e)
        } finally {
          panel.wait = 0
        }
        if (panel.state === 2 || panel.state === -1) {
          panel.state = 3
          await panel.closeHandler?.()
          await new Promise(resolve => {
            api.dom.fade(false, panel.el, () => {
              resolve()
              panel.closedHandler?.()
              callback?.(panel)
            })
          })
          panel.state = 0
          return true
        }
      } catch (e) {
        panel.state = -1
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
      /** @type {Webpage} */
      obj: null,

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
       * av/bv 互转工具类
       *
       * 保证 av < 2 ** 27 时正确，同时应该在 av < 2 ** 30 时正确。
       *
       * 结合 `xor` 与 `add` 可推断出，运算过程中不会出现超过 `2 ** 34 - 1` 的数值，远不会触及到 `Number.MAX_SAFE_INTEGER === 2 ** 53 - 1`，故无须引入 BigInt 进行计算。
       * @see {@link https://www.zhihu.com/question/381784377/answer/1099438784 如何看待 2020 年 3 月 23 日哔哩哔哩将稿件的「av 号」变更为「BV 号」？ - 知乎 - mcfx 的回答}
       */
      bvTool: new class BvTool {
        constructor() {
          const table = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF'
          const tr = Object.fromEntries([...table].map((c, i) => [c, i]))
          const s = [11, 10, 3, 8, 4, 6]
          const xor = 177451812
          const add = 8728348608
          const tl = table.length
          const sl = s.length
          this.bv2av = dec
          this.av2bv = enc

          function dec(x) {
            let r = 0
            for (let i = 0; i < sl; i++) {
              r += tr[x[s[i]]] * tl ** i
            }
            return String((r - add) ^ xor)
          }

          function enc(x) {
            x = Number.parseInt(x)
            x = (x ^ xor) + add
            const r = [...'BV1  4 1 7  ']
            for (let i = 0; i < sl; i++) {
              r[s[i]] = table[Math.floor(x / tl ** i) % tl]
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
        return null
      },

      /**
       * 从 URL 获取视频 `aid`
       * @param {string} [url=location.pathname] 提取视频 `aid` 的源字符串
       * @returns {string} `aid`
       */
      getAid(url = location.pathname) {
        const vid = this.getVid(url)
        if (vid) {
          if (vid.type === 'bvid') {
            return this.bvTool.bv2av(vid.id)
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
        const vid = this.getVid(url)
        if (vid) {
          if (vid.type === 'aid') {
            return this.bvTool.av2bv(vid.id)
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
        try {
          let typeA = /^\d+$/.test(id)
          if (!typeA && !status) { // 移除 API 只支持 aid，先作转换
            id = this.bvTool.bv2av(id)
            typeA = true
          }
          const data = new URLSearchParams()
          if (typeA) {
            data.append('aid', id)
          } else {
            data.append('bvid', id)
          }
          data.append('csrf', this.getCSRF())
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
      async updateRemoveHistoryData(reload) {
        if (gm.config.removeHistory) {
          const removeHistorySaveTime = GM_getValue('removeHistorySaveTime') ?? 0
          const removeHistorySavePeriod = GM_getValue('removeHistorySavePeriod') ?? gm.configMap.removeHistorySavePeriod.default
          if (Date.now() - removeHistorySaveTime > removeHistorySavePeriod * 1000) {
            if (!gm.runtime.savingRemoveHistoryData) {
              gm.runtime.savingRemoveHistoryData = true
              await gm.data.watchlaterListData(reload).then(current => {
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
                            if (c.bvid !== r) {
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
                    for (const [index, record] of data.entries()) {
                      map.set(record[0], index)
                    }
                    for (let i = current.length - 1; i >= 0; i--) {
                      const item = current[i]
                      if (map.has(item.bvid)) {
                        const idx = map.get(item.bvid)
                        data.data[idx][2] = timestamp
                      } else {
                        data.enqueue([item.bvid, item.title, timestamp])
                      }
                    }
                    updated = true
                  } else {
                    const set = new Set()
                    for (const record of data) {
                      set.add(record[0])
                    }
                    for (let i = current.length - 1; i >= 0; i--) {
                      const item = current[i]
                      if (!set.has(item.bvid)) {
                        data.enqueue([item.bvid, item.title])
                        updated = true
                      }
                    }
                  }
                  if (updated) {
                    GM_setValue('removeHistoryData', data)
                  }
                  // current.length === 0 时不更新
                  // 不要提到前面，否则时间不准确
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
        for (const key of gm.searchParams.keys()) {
          if (key.startsWith(gm.id)) {
            url.searchParams.delete(key)
            removed = true
          }
        }
        if (removed && location.href !== url.href) {
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
          iM %= 60
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
          1: '橙色通过',
          0: '开放浏览',
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

    constructor() {
      this.method.obj = this
    }

    /**
     * 顶栏中加入稍后再看入口
     */
    async addHeaderButton() {
      const _self = this
      if (gm.config.headerCompatible === Enums.headerCompatible.bilibiliEvolved) {
        api.wait.$('.custom-navbar [data-name=watchlater]').then(el => {
          gm.runtime.headerType = '3rd-party'
          const watchlater = el.parentElement.appendChild(el.cloneNode(true))
          el.style.display = 'none'
          watchlater.querySelector('a.main-content').removeAttribute('href')
          watchlater.querySelector('.popup-container').style.display = 'none'
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
          #${gm.id} .gm-entrypopup[data-compatible="${gm.config.headerCompatible}"] {
            padding-top: 1em;
          }
          #${gm.id} .gm-entrypopup[data-compatible="${gm.config.headerCompatible}"] .gm-popup-arrow {
            display: none;
          }
          #${gm.id} .gm-entrypopup[data-compatible="${gm.config.headerCompatible}"] .gm-entrypopup-page {
            box-shadow: rgb(0 0 0 / 20%) 0 4px 8px 0;
            border-radius: 8px;
            margin-top: -12px;
          }
        `)
      } else {
        const anchor = await api.wait.$('.user-con.signin, .bili-header__bar .right-entry .v-popover-wrap')
        if (anchor.classList.contains('user-con')) { // 传统顶栏
          gm.runtime.headerType = 'old'
          const collect = anchor.children[4]
          const watchlater = document.createElement('div')
          watchlater.className = 'item'
          watchlater.innerHTML = '<a><span class="name">稍后再看</span></a>'
          collect.before(watchlater)
          processClickEvent(watchlater)
          processPopup(watchlater)
        } else { // 新版顶栏
          gm.runtime.headerType = '2022'
          const collect = anchor.parentElement.children[4]
          const watchlater = document.createElement('li')
          watchlater.className = 'v-popover-wrap'
          watchlater.innerHTML = '<a class="right-entry__outside" style="cursor:pointer"><svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" class="right-entry-icon"><path d="M3.7 3.7l13.9 6.8-13.9 6.8V3.7z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></svg><span class="right-entry-text">稍后再看</span></a>'
          collect.before(watchlater)
          processClickEvent(watchlater)
          processPopup(watchlater)
        }
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
              action.href && window.open(action.href, action.target)
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
            default:
              break
          }
        }
        watchlater.addEventListener('mousedown', e => {
          if (e.button !== 2) {
            process(e.button)
            e.preventDefault()
          }
        })
        watchlater.addEventListener('contextmenu', e => {
          process(2) // 整合写进 mousedown 中会导致无法阻止右键菜单弹出
          e.preventDefault()
        })
      }

      /**
       * 处理弹出面板
       * @param {HTMLElement} watchlater 稍后再看元素
       */
      function processPopup(watchlater) {
        if (gm.config.headerMenu === Enums.headerMenu.disable) return
        gm.panel.entryPopup.el = document.createElement('div')
        const popup = gm.panel.entryPopup.el
        // 模仿官方顶栏弹出面板的弹出与关闭效果
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
          if (watchlater._mouseOver) return
          watchlater._mouseOver = true
          // 预加载数据，延时以在避免误触与加载速度间作平衡
          if (gm.config.watchlaterListCacheValidPeriod > 0) {
            setTimeout(() => {
              if (watchlater._mouseOver) {
                gm.data.watchlaterListData()
              }
            }, 25) // 以鼠标快速掠过不触发为准
          }
          // 完整加载，延时以避免误触
          // 误触率与弹出速度正相关，与数据加载时间无关
          setTimeout(() => {
            if (watchlater._mouseOver) {
              const isHeaderFixed = api.dom.findAncestor(watchlater, el => {
                const { position } = window.getComputedStyle(el)
                return position === 'fixed' || position === 'sticky'
              }, true)
              popup.style.position = isHeaderFixed ? 'fixed' : ''
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
          watchlater._mouseOver = false
          if (withinHeader(e)) {
            script.closePanelItem('entryPopup')
          } else {
            setTimeout(() => {
              if (!watchlater._mouseOver && !popup._mouseOver) {
                script.closePanelItem('entryPopup')
              }
            }, 150)
          }
        }

        /**
         * 进入弹出面板的处理
         */
        function onEnterPopup() {
          popup._mouseOver = true
        }

        /**
         * 离开弹出面板的处理
         */
        function onLeavePopup() {
          popup._mouseOver = false
          setTimeout(() => {
            if (!popup._mouseOver && !watchlater._mouseOver) {
              script.closePanelItem('entryPopup')
            }
          }, 50)
        }
      }

      /**
       * 打开弹出面板
       */
      function openEntryPopup() {
        if (gm.el.entryPopup) {
          script.openPanelItem('entryPopup')
        } else {
          /** @type {{[n: string]: HTMLElement}} */
          const el = {}
          setTimeout(() => {
            initPopup()
            processPopup()
            script.openPanelItem('entryPopup')
          })

          /**
           * 初始化
           */
          const initPopup = () => {
            const openLinkInCurrent = gm.config.openHeaderMenuLink === Enums.openHeaderMenuLink.openInCurrent
            const target = openLinkInCurrent ? '_self' : '_blank'
            gm.el.entryPopup = gm.el.gmRoot.appendChild(gm.panel.entryPopup.el)
            gm.el.entryPopup.dataset.headerType = gm.runtime.headerType ?? '2022'
            if (gm.config.headerCompatible !== Enums.headerCompatible.none) {
              gm.el.entryPopup.dataset.compatible = gm.config.headerCompatible
            }
            gm.el.entryPopup.className = 'gm-entrypopup'
            gm.el.entryPopup.innerHTML = `
              <div class="gm-popup-arrow"></div>
              <div class="gm-entrypopup-page">
                <div class="gm-popup-header">
                  <div class="gm-search">
                    <input type="text" placeholder="搜索... 支持关键字排除 ( - ) 及通配符 ( ? * )">
                    <div class="gm-search-clear">✖</div>
                  </div>
                  <div class="gm-popup-total" title="列表条目数">0</div>
                </div>
                <div class="gm-entry-list-empty">稍后再看列表为空</div>
                <div class="gm-entry-list"></div>
                <div class="gm-entry-list gm-entry-removed-list"></div>
                <div class="gm-entry-bottom">
                  <a class="gm-entry-button" fn="setting">设置</a>
                  <a class="gm-entry-button" fn="history">历史</a>
                  <a class="gm-entry-button" fn="removeAll">清空</a>
                  <a class="gm-entry-button" fn="removeWatched">移除已看</a>
                  <a class="gm-entry-button" fn="showAll" href="${gm.url.page_watchlaterList}" target="${target}">显示</a>
                  <a class="gm-entry-button" fn="playAll" href="${gm.url.page_watchlaterPlayAll}" target="${target}">播放</a>
                  <a class="gm-entry-button" fn="sortControl">
                    <div class="gm-select">
                      <div class="gm-selected" data-value="">排序</div>
                      <div class="gm-options">
                        <div class="gm-option" data-value="${Enums.sortType.fixed}">固定</div>
                        <div class="gm-option" data-value="${Enums.sortType.title}">标题</div>
                        ${gm.config.headerMenu === Enums.headerMenu.enable ? `
                          <div class="gm-option" data-value="${Enums.sortType.uploader}">UP主</div>
                          <div class="gm-option" data-value="${Enums.sortType.progress}">进度</div>
                        ` : ''}
                        <div class="gm-option" data-value="${Enums.sortType.pubtimeR}">发布↓</div>
                        <div class="gm-option" data-value="${Enums.sortType.pubtime}">发布</div>
                        <div class="gm-option" data-value="${Enums.sortType.durationR}">时长↓</div>
                        <div class="gm-option" data-value="${Enums.sortType.duration}">时长</div>
                        <div class="gm-option" data-value="${Enums.sortType.defaultR}">默认↓</div>
                        <div class="gm-option gm-option-selected" data-value="${Enums.sortType.default}">默认</div>
                      </div>
                    </div>
                  </a>
                  <a class="gm-entry-button" fn="autoRemoveControl">移除</a>
                </div>
              </div>
            `
            el.entryList = gm.el.entryPopup.querySelector('.gm-entry-list')
            el.entryRemovedList = gm.el.entryPopup.querySelector('.gm-entry-removed-list')
            el.entryListEmpty = gm.el.entryPopup.querySelector('.gm-entry-list-empty')
            el.entryHeader = gm.el.entryPopup.querySelector('.gm-popup-header')
            el.searchBox = gm.el.entryPopup.querySelector('.gm-search')
            el.search = el.searchBox.querySelector('.gm-search input')
            el.searchClear = el.searchBox.querySelector('.gm-search-clear')
            el.popupTotal = gm.el.entryPopup.querySelector('.gm-popup-total')
            el.entryBottom = gm.el.entryPopup.querySelector('.gm-entry-bottom')
          }

          /**
           * 维护内部元素
           */
          const processPopup = () => {
            gm.panel.entryPopup.openHandler = onOpen
            gm.panel.entryPopup.openedHandler = () => {
              if (gm.config.headerMenuSearch) {
                el.search.setSelectionRange(0, el.search.value.length)
                el.search.focus()
              }
            }

            if (gm.config.headerMenuSearch) {
              el.search.addEventListener('input', () => {
                const { search, searchClear } = el
                const m = /^\s+(.*)/.exec(search.value)
                if (m) {
                  search.value = m[1]
                  search.setSelectionRange(0, 0)
                }
                searchClear.style.visibility = search.value.length > 0 ? 'visible' : ''
              })
              el.search.addEventListener('input', api.base.throttle(() => {
                let val = el.search.value.trim()
                let include = null
                let exclude = null
                const isIncluded = str => str && include?.test(str)
                const isExcluded = str => str && exclude?.test(str)
                const lists = gm.config.headerMenuKeepRemoved ? [el.entryList, el.entryRemovedList] : [el.entryList]
                if (val.length > 0) {
                  try {
                    val = val.replace(/[$()+.[\\\]^{|}]/g, '\\$&') // escape regex
                      .replaceAll('?', '.').replaceAll('*', '.*') // 通配符
                    for (const part of val.split(' ')) {
                      if (part) {
                        if (part.startsWith('-')) {
                          if (part.length === 1) continue
                          if (exclude) {
                            exclude += '|' + part.slice(1)
                          } else {
                            exclude = part.slice(1)
                          }
                        } else {
                          if (include) {
                            include += '|' + part
                          } else {
                            include = part
                          }
                        }
                      }
                    }
                    if (!include && exclude) {
                      include = '.*'
                    }
                    include = include && new RegExp(include, 'i')
                    exclude = exclude && new RegExp(exclude, 'i')
                  } catch {
                    include = exclude = null
                  }
                }
                const cnt = [0, 0]
                for (const [i, list] of lists.entries()) {
                  if (list.total > 0) {
                    for (let j = 0; j < list.childElementCount; j++) {
                      let valid = false
                      const card = list.children[j]
                      if (include || exclude) {
                        if (isIncluded(card.vTitle) || isIncluded(card.uploader)) {
                          if (!isExcluded(card.vTitle) && !isExcluded(card.uploader)) {
                            valid = true
                          }
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
                  el.entryListEmpty.style.display = ''
                } else {
                  el.entryListEmpty.style.display = 'unset'
                }
              }, gm.const.inputThrottleWait))
              el.searchClear.addEventListener('click', () => {
                el.search.value = ''
                el.search.dispatchEvent(new Event('input'))
              })
              if (gm.config.searchDefaultValue) {
                el.search.addEventListener('mousedown', e => {
                  if (e.button === 1) {
                    GM_deleteValue('searchDefaultValue_value')
                    api.message.info('已清空搜索框默认值')
                    e.preventDefault()
                  } else if (e.button === 2) {
                    GM_setValue('searchDefaultValue_value', el.search.value)
                    api.message.info('已保存搜索框默认值')
                    e.preventDefault()
                  }
                })
                el.search.addEventListener('contextmenu', e => e.preventDefault())

                const updateSearchTitle = e => {
                  let v = e ? e.detail.value : GM_getValue('searchDefaultValue_value')
                  if (!v) v = v === '' ? '[ 空 ]' : '[ 未设置 ]'
                  el.searchBox.title = gm.const.searchDefaultValueHint.replace('$1', v)
                }
                updateSearchTitle()
                window.addEventListener('updateSearchTitle', updateSearchTitle)
              }
            } else {
              el.entryHeader.style.display = 'none'
            }

            el.entryFn = {}
            for (const button of el.entryBottom.querySelectorAll('.gm-entry-button')) {
              const fn = button.getAttribute('fn')
              if (fn) {
                el.entryFn[fn] = button
              }
            }

            // 排序控制器
            {
              el.entryFn.sortControl.control = el.entryFn.sortControl.firstElementChild
              const { control } = el.entryFn.sortControl
              const selected = control.selected = control.children[0]
              const options = control.options = control.children[1]

              const defaultSelect = options.querySelector('.gm-option-selected') ?? options.firstElementChild
              if (gm.config.autoSort !== Enums.autoSort.default) {
                let type = gm.config.autoSort
                if (type === Enums.autoSort.auto) {
                  type = GM_getValue('autoSort_auto')
                  if (!type) {
                    type = Enums.sortType.default
                    GM_setValue('autoSort_auto', type)
                  }
                }
                selected.option = options.querySelector(`[data-value="${type}"]`)
                if (selected.option) {
                  defaultSelect?.classList.remove('gm-option-selected')
                  selected.option.classList.add('gm-option-selected')
                  selected.dataset.value = selected.option.dataset.value
                } else if (gm.config.autoSort === Enums.autoSort.auto) {
                  type = Enums.sortType.default
                  GM_setValue('autoSort_auto', type)
                }
              }
              if (!selected.option) {
                selected.option = defaultSelect
                if (selected.option) {
                  selected.option.classList.add('gm-option-selected')
                  selected.dataset.value = selected.option.dataset.value
                }
              }

              if (gm.config.headerMenuSortControl) {
                el.entryFn.sortControl.setAttribute('enabled', '')
                options.fadeOutNoInteractive = true

                el.entryFn.sortControl.addEventListener('click', () => {
                  if (!control.selecting) {
                    control.selecting = true
                    api.dom.fade(true, options)
                  }
                })
                el.entryFn.sortControl.addEventListener('mouseenter', () => {
                  control.selecting = true
                  api.dom.fade(true, options)
                })
                el.entryFn.sortControl.addEventListener('mouseleave', () => {
                  control.selecting = false
                  api.dom.fade(false, options)
                })
                options.addEventListener('click', /** @param {MouseEvent} e */ e => {
                  control.selecting = false
                  api.dom.fade(false, options)
                  const val = e.target.dataset.value
                  if (selected.dataset.value !== val) {
                    selected.option.classList.remove('gm-option-selected')
                    selected.dataset.value = val
                    selected.option = e.target
                    selected.option.classList.add('gm-option-selected')
                    if (gm.config.autoSort === Enums.autoSort.auto) {
                      GM_setValue('autoSort_auto', val)
                    }
                    sort(val)
                  }
                })
              }
            }

            // 自动移除控制器
            const cfgAutoRemove = gm.config.autoRemove
            const autoRemove = cfgAutoRemove === Enums.autoRemove.always || cfgAutoRemove === Enums.autoRemove.openFromList
            el.entryFn.autoRemoveControl.autoRemove = autoRemove
            if (gm.config.headerMenuAutoRemoveControl) {
              if (cfgAutoRemove === Enums.autoRemove.absoluteNever) {
                el.entryFn.autoRemoveControl.setAttribute('disabled', '')
                el.entryFn.autoRemoveControl.addEventListener('click', () => {
                  api.message.info('当前彻底禁用自动移除功能，无法执行操作')
                })
              } else {
                if (autoRemove) {
                  el.entryFn.autoRemoveControl.classList.add('gm-popup-auto-remove')
                }
                el.entryFn.autoRemoveControl.addEventListener('click', () => {
                  const target = el.entryFn.autoRemoveControl
                  if (target.autoRemove) {
                    target.classList.remove('gm-popup-auto-remove')
                    api.message.info('已临时关闭自动移除功能')
                  } else {
                    target.classList.add('gm-popup-auto-remove')
                    api.message.info('已临时开启自动移除功能')
                  }
                  target.autoRemove = !target.autoRemove
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
              el.entryFn.removeAll.addEventListener('click', () => {
                script.closePanelItem('entryPopup')
                clearWatchlater()
              })
            }
            if (gm.config.headerMenuFnRemoveWatched) {
              el.entryFn.removeWatched.setAttribute('enabled', '')
              el.entryFn.removeWatched.addEventListener('click', () => {
                script.closePanelItem('entryPopup')
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
           * 打开时弹出面板时执行
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
            gm.panel.entryPopup.sortType = Enums.sortType.default
            el.popupTotal.textContent = '0'
            el.entryList.textContent = ''
            el.entryList.total = 0
            el.entryRemovedList.textContent = ''
            el.entryRemovedList.total = 0
            const data = await gm.data.watchlaterListData()
            const simplePopup = gm.config.headerMenu === Enums.headerMenu.enableSimple
            let serial = 0
            if (data.length > 0) {
              const fixedItems = GM_getValue('fixedItems') ?? []
              const openLinkInCurrent = gm.config.openHeaderMenuLink === Enums.openHeaderMenuLink.openInCurrent
              const { autoRemoveControl } = el.entryFn
              for (const item of data) {
                /** @type {HTMLAnchorElement} */
                const card = el.entryList.appendChild(document.createElement('a'))
                card.serial = serial++
                const valid = item.state >= 0
                card.vTitle = item.title
                card.bvid = item.bvid
                card.duration = item.duration
                card.pubtime = item.pubdate
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
                      <div class="gm-card-title" title="${card.vTitle}">${valid ? card.vTitle : `<b>[${_self.method.getItemStateDesc(item.state)}]</b> ${card.vTitle}`}</div>
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
                  card.querySelector('.gm-card-switcher').addEventListener('click', e => {
                    e.preventDefault()
                    e.stopPropagation() // 兼容第三方的「链接转点击事件」处理
                    switchStatus(!card.added)
                  })

                  card.querySelector('.gm-card-collector').addEventListener('click', e => {
                    e.preventDefault() // 不能放到 async 中
                    e.stopPropagation() // 兼容第三方的「链接转点击事件」处理
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
                  fixer.addEventListener('click', e => {
                    e.preventDefault()
                    e.stopPropagation() // 兼容第三方的「链接转点击事件」处理
                    if (card.fixed) {
                      card.classList.remove('gm-fixed')
                    } else {
                      card.classList.add('gm-fixed')
                    }
                    card.fixed = !card.fixed
                    gm.data.fixedItem(card.bvid, card.fixed)
                  })
                  fixer.addEventListener('contextmenu', e => {
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
                  if (gm.config.redirect) {
                    card.href = `${gm.url.page_videoNormalMode}/${card.bvid}`
                  } else {
                    card.href = `${gm.url.page_videoWatchlaterMode}/${card.bvid}`
                  }
                  if (gm.config.autoRemove !== Enums.autoRemove.absoluteNever) {
                    const excludes = '.gm-card-switcher, .gm-card-uploader, .gm-card-fixer, .gm-card-collector'
                    card._href = card.href
                    card.addEventListener('mousedown', e => {
                      if (e.button === 0 || e.button === 1) { // 左键或中键
                        if (card.fixed) return
                        if (!simplePopup && e.target.matches(excludes)) return
                        if (autoRemoveControl.autoRemove) {
                          if (gm.config.autoRemove !== Enums.autoRemove.always) {
                            const url = new URL(card.href)
                            url.searchParams.set(`${gm.id}_remove`, 'true')
                            card.href = url.href
                          } else {
                            card.href = card._href
                          }
                        } else {
                          if (gm.config.autoRemove === Enums.autoRemove.always) {
                            const url = new URL(card.href)
                            url.searchParams.set(`${gm.id}_disable_remove`, 'true')
                            card.href = url.href
                          } else {
                            card.href = card._href
                          }
                        }
                      }
                    })
                    card.addEventListener('mouseup', e => {
                      if (e.button === 0 || e.button === 1) { // 左键或中键
                        if (card.fixed) return
                        if (!simplePopup) {
                          if (!card.added) return
                          if (e.target.matches(excludes)) return
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
                }
              }
              el.entryList.total = data.length
              el.entryListEmpty.style.display = ''

              // 现在仍在 fixedItems 中的是无效固定项，将它们移除
              // 仅在列表项不为空时才执行移除，因为「列表项为空」有可能是一些特殊情况造成的误判
              for (const item of fixedItems) {
                gm.data.fixedItem(item, false)
              }
            } else {
              el.entryListEmpty.style.display = 'unset'
            }

            // 添加已移除视频
            if (rmCards?.length > 0) {
              const addedBvid = new Set()
              for (const rmCard of rmCards) {
                rmCard.serial = serial++
                const { bvid } = rmCard
                if (addedBvid.has(bvid)) continue
                if (rmBvid.has(bvid)) {
                  if (rmCard.style.display === 'none') {
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
              const only1 = rmBvid.size === 1
              const h = simplePopup ? (only1 ? 6 : 9) : (only1 ? 6.4 : 11)
              el.entryList.style.height = `${42 - h}em`
              el.entryRemovedList.style.height = `${h}em`
              el.entryRemovedList.style.display = 'flex'
              el.entryRemovedList.total = rmBvid.size
              for (const fixedEl of el.entryRemovedList.querySelectorAll('.gm-fixed')) {
                fixedEl.classList.remove('gm-fixed')
                fixedEl.fixed = false
              }
            } else {
              el.entryList.style.height = ''
              el.entryRemovedList.style.display = ''
            }

            el.popupTotal.textContent = `${el.entryList.total}${el.entryRemovedList.total > 0 ? `/${el.entryList.total + el.entryRemovedList.total}` : ''}`
            if (gm.config.removeHistory && gm.config.removeHistorySavePoint === Enums.removeHistorySavePoint.listAndMenu) {
              _self.method.updateRemoveHistoryData()
            }

            gm.el.entryPopup.style.display = 'unset'
            el.entryList.scrollTop = 0
            el.entryRemovedList.scrollTop = 0

            const sortType = el.entryFn.sortControl.control.selected.dataset.value
            sortType && sort(sortType)

            if (gm.config.searchDefaultValue) {
              const sdv = GM_getValue('searchDefaultValue_value')
              if (typeof sdv === 'string') {
                el.search.value = sdv
              }
            }
            if (el.search.value.length > 0) {
              el.search.dispatchEvent(new Event('input'))
            }
          }

          /**
           * 对弹出面板列表中的内容进行排序
           * @param {sortType} type 排序类型
           */
          const sort = type => {
            if (type === gm.panel.entryPopup.sortType) return
            const prevBase = gm.panel.entryPopup.sortType.replace(/:R$/, '')
            gm.panel.entryPopup.sortType = type
            if (type === Enums.sortType.fixed) {
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
              if (k !== prevBase) {
                const cards = [...list.querySelectorAll('.gm-entry-list-item')]
                cards.sort((a, b) => {
                  let result = 0
                  const va = a[k]
                  const vb = b[k]
                  if (typeof va === 'string') {
                    result = va.localeCompare(vb)
                  } else {
                    result = va - vb
                  }
                  return result
                })
                for (const [idx, card] of cards.entries()) {
                  card.style.order = idx
                }
              }
              if (reverse) {
                list.setAttribute('gm-list-reverse', '')
                list.scrollTop = -list.scrollHeight

                // column-reverse + order + flex-end 无法生成滚动条
                // 只能改用一个定位元素加 margin: auto 来实现 flex-end 效果
                if (!list.querySelector('.gm-list-reverse-end')) {
                  const listEnd = document.createElement('div')
                  listEnd.className = 'gm-list-reverse-end'
                  list.append(listEnd)
                }
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
          default:
            break
        }
        if (result.href) {
          switch (op) {
            case Enums.headerButtonOp.openListInNew:
            case Enums.headerButtonOp.playAllInNew:
              result.target = '_blank'
              break
            default:
              result.target = '_self'
          }
        }
        return result
      }
    }

    /**
     * 填充稍后再看状态
     */
    fillWatchlaterStatus() {
      const _self = this
      /** @type {Map<string, GMObject_data_item0>} */
      let map = null
      const initMap = async () => {
        map = await this.method.getWatchlaterDataMap(item => String(item.aid), 'aid', false, true)
      }
      if (api.base.urlMatch(gm.regex.page_dynamicMenu)) { // 必须在动态页之前匹配
        fillWatchlaterStatus_dynamicMenu() // 旧版动态面板
      } else {
        if (api.base.urlMatch(gm.regex.page_dynamic)) {
          if (location.pathname === '/') { // 仅动态主页
            api.wait.$('.bili-dyn-list').then(async () => {
              api.wait.executeAfterElementLoaded({
                selector: '.bili-dyn-list-tabs__item:not(#gm-batch-manager-btn)',
                base: await api.wait.$('.bili-dyn-list-tabs__list'),
                multiple: true,
                callback: tab => {
                  tab.addEventListener('click', refillDynamicWatchlaterStatus)
                },
              })
              fillWatchlaterStatus_dynamic()
            })
          }
        } else if (api.base.urlMatch(gm.regex.page_userSpace)) {
          // 虽然长得跟动态主页一样，但这里用的是老代码，不过估计拖个半年又会改成跟动态主页一样吧……
          // 用户空间中也有动态，但用户未必切换到动态子页，故需长时间等待
          api.wait.waitForElementLoaded({
            selector: '.feed-card',
            timeout: 0,
          }).then(async () => {
            await initMap()
            api.wait.executeAfterElementLoaded({
              selector: '.video-container',
              base: await api.wait.$('.feed-card'),
              multiple: true,
              repeat: true,
              timeout: 0,
              callback: video => {
                const vue = video.__vue__
                if (vue) {
                  const aid = String(vue.aid)
                  if (map.has(aid)) {
                    vue.seeLaterStatus = 1
                  }
                }
              },
            })
          })

          if (gm.config.fillWatchlaterStatus === Enums.fillWatchlaterStatus.anypage) {
            fillWatchlaterStatus_main()
          }
        } else {
          // 两部分 URL 刚好不会冲突，放到 else 中即可
          switch (gm.config.fillWatchlaterStatus) {
            case Enums.fillWatchlaterStatus.dynamicAndVideo:
              if (api.base.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode])) {
                fillWatchlaterStatus_main()
              }
              break
            case Enums.fillWatchlaterStatus.anypage:
              fillWatchlaterStatus_main()
              break
            default:
              break
          }
        }
        fillWatchlaterStatus_dynamicPopup()

        window.addEventListener('reloadWatchlaterListData', api.base.debounce(refillDynamicWatchlaterStatus, 2000))
      }

      /**
       * 填充动态页稍后再看状态
       */
      async function fillWatchlaterStatus_dynamic() {
        await initMap()
        const feed = await api.wait.$('.bili-dyn-list__items')
        api.wait.executeAfterElementLoaded({
          selector: '.bili-dyn-card-video',
          base: feed,
          multiple: true,
          repeat: true,
          timeout: 0,
          callback: async video => {
            let vue = video.__vue__
            if (vue) {
              // 初始的卡片的 Vue 对象中缺少关键数据、缺少操作稍后再看状态按钮的方法与状态
              // 需要用户将鼠标移至稍后再看按钮，才会对以上数据、状态等进行加载，这里要模拟一下这个操作
              if (!vue.data.aid || !vue.mark) {
                const mark = await api.wait.$('.bili-dyn-card-video__mark', video)
                mark.dispatchEvent(new Event('mouseenter')) // 触发初始化
                await api.wait.waitForConditionPassed({
                  condition: () => video.__vue__.data.aid && video.__vue__.mark,
                })
                vue = video.__vue__ // 此时卡片 Vue 对象发生了替换！
              }
              const aid = String(vue.data.aid)
              if (map.has(aid)) {
                vue.mark.done = true
              }
            }
          },
        })
      }

      /**
       * 填充动态面板稍后再看状态
       */
      async function fillWatchlaterStatus_dynamicPopup() {
        await initMap()
        api.wait.executeAfterElementLoaded({
          selector: '.dynamic-video-item',
          multiple: true,
          repeat: true,
          timeout: 0,
          callback: async item => {
            const aid = webpage.method.getAid(item.href)
            if (map.has(aid)) {
              // 官方的实现太复杂，这里改一下显示效果算了
              const svg = await api.wait.$('.watch-later svg', item)
              svg.innerHTML = '<path d="M176.725 56.608c1.507 1.508 2.44 3.591 2.44 5.892s-.932 4.384-2.44 5.892l-92.883 92.892c-2.262 2.264-5.388 3.664-8.842 3.664s-6.579-1.4-8.842-3.664l-51.217-51.225a8.333 8.333 0 1 1 11.781-11.785l48.277 48.277 89.942-89.942c1.508-1.507 3.591-2.44 5.892-2.44s4.384.932 5.892 2.44z" fill="currentColor"></path>'
            }
          },
        })
      }

      /**
       * 填充旧版动态面板稍后再看状态
       */
      async function fillWatchlaterStatus_dynamicMenu() {
        await initMap()
        api.wait.executeAfterElementLoaded({
          selector: '.list-item',
          base: await api.wait.$('.video-list'),
          multiple: true,
          repeat: true,
          timeout: 0,
          callback: video => {
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
          callback: video => {
            const vue = video.__vue__
            if (vue) {
              const aid = String(vue.aid)
              if (map.has(aid)) {
                vue.added = true
              }
            }
          },
        })

        if (api.base.urlMatch(gm.regex.page_search)) {
          // 新版搜索页面
          api.wait.executeAfterElementLoaded({
            selector: '.bili-video-card .bili-video-card__wrap > [data-mod="search-card"]',
            base: document.body,
            multiple: true,
            repeat: true,
            timeout: 0,
            callback: async card => {
              const aid = webpage.method.getAid(card.href)
              if (map.has(aid)) {
                const svg = await api.wait.$('.bili-watch-later svg', card)
                svg.innerHTML = '<use xlink:href="#widget-watch-save"></use>'
              }
            },
          })
        } else if (api.base.urlMatch(gm.regex.page_userSpace)) {
          // 用户空间
          api.wait.executeAfterElementLoaded({
            selector: '.section.video [data-aid]',
            base: document.body,
            multiple: true,
            repeat: true,
            timeout: 0,
            callback: async item => {
              const aid = webpage.method.bvTool.bv2av(item.dataset.aid) // data-aid 实际上是 bvid
              if (map.has(aid)) {
                const wl = await api.wait.$('.i-watchlater', item)
                wl.classList.add('has-select')
              }
            },
          })
        }
      }

      /**
       * 重新填充与动态相关的稍后再看状态
       */
      async function refillDynamicWatchlaterStatus() {
        map = await _self.method.getWatchlaterDataMap(item => String(item.aid), 'aid', true)

        // 更新动态主页稍后再看状态
        if (api.base.urlMatch(gm.regex.page_dynamic)) {
          // map 更新期间，ob 偷跑可能会将错误的数据写入，重新遍历并修正之
          const feed = document.querySelector('.bili-dyn-list') // 更新已有项状态，同步找就行了
          if (feed) {
            for (const video of feed.querySelectorAll('.bili-dyn-card-video')) {
              const vue = video.__vue__
              if (vue && vue.data.aid && vue.mark) {
                const aid = String(vue.data.aid)
                if (map.has(aid)) {
                  vue.mark.done = true
                } else {
                  vue.mark.done = false
                }
              }
            }
          }
        }

        // 更新顶栏动态面板稍后再看状态
        for (const item of document.querySelectorAll('.dynamic-video-item')) {
          const aid = webpage.method.getAid(item.href)
          const svg = await api.wait.$('.watch-later svg', item)
          if (map.has(aid)) {
            svg.innerHTML = '<path d="M176.725 56.608c1.507 1.508 2.44 3.591 2.44 5.892s-.932 4.384-2.44 5.892l-92.883 92.892c-2.262 2.264-5.388 3.664-8.842 3.664s-6.579-1.4-8.842-3.664l-51.217-51.225a8.333 8.333 0 1 1 11.781-11.785l48.277 48.277 89.942-89.942c1.508-1.507 3.591-2.44 5.892-2.44s4.384.932 5.892 2.44z" fill="currentColor"></path>'
          } else {
            svg.innerHTML = '<path d="M17.5 100c0-45.563 36.937-82.5 82.501-82.5 44.504 0 80.778 35.238 82.442 79.334l-7.138-7.137a7.5 7.5 0 0 0-10.607 10.606l20.001 20a7.5 7.5 0 0 0 10.607 0l20.002-20a7.5 7.5 0 0 0-10.607-10.606l-7.245 7.245c-1.616-52.432-44.63-94.441-97.455-94.441-53.848 0-97.501 43.652-97.501 97.5s43.653 97.5 97.501 97.5c32.719 0 61.673-16.123 79.346-40.825a7.5 7.5 0 0 0-12.199-8.728c-14.978 20.934-39.472 34.553-67.147 34.553-45.564 0-82.501-36.937-82.501-82.5zm109.888-12.922c9.215 5.743 9.215 20.101 0 25.843l-29.62 18.46c-9.215 5.742-20.734-1.436-20.734-12.922V81.541c0-11.486 11.519-18.664 20.734-12.921l29.62 18.459z" fill="currentColor"></path>'
          }
        }
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
        cb.addEventListener('click', () => processSwitch())

        const version = atr.classList.contains('video-toolbar-v1') ? '2022' : 'old'
        btn.dataset.toolbarVersion = version
        if (version === '2022') {
          const right = await api.wait.$('.toolbar-right', atr)
          right.prepend(btn)
        } else {
          btn.className = 'appeal-text'
          atr.append(btn)
        }

        let aid = this.method.getAid()
        if (!aid) {
          aid = await api.wait.waitForConditionPassed({
            condition: () => this.method.getAid(),
            interval: 1000,
          })
        }
        bus = { btn, cb, aid }
        initButtonStatus()
        original.parentElement.style.display = 'none'

        window.addEventListener('urlchange', async e => {
          if (location.pathname === e.detail.prev.pathname) return // 并非切换视频（如切分P）
          bus.aid = this.method.getAid()
          let reloaded = false
          gm.searchParams = new URL(location.href).searchParams
          const removed = await this.processAutoRemove()
          if (gm.config.removeHistory && gm.config.removeHistorySavePoint === Enums.removeHistorySavePoint.anypage) {
            // 本来没必要强制刷新，但后面查询状态必须要新数据，搭个顺风车
            await this.method.updateRemoveHistoryData(true)
            reloaded = true
          }
          const status = removed ? false : await this.method.getVideoWatchlaterStatusByAid(bus.aid, !reloaded)
          btn.added = status
          cb.checked = status
        })
      })

      /**
       * 初始化按钮的稍后再看状态
       */
      function initButtonStatus() {
        const setStatus = async status => {
          status ??= await _self.method.getVideoWatchlaterStatusByAid(bus.aid, false, true)
          bus.btn.added = status
          bus.cb.checked = status
        }
        if (gm.data.fixedItem(_self.method.getBvid())) {
          setStatus(true)
        } else {
          const alwaysAutoRemove = gm.config.autoRemove === Enums.autoRemove.always
          const spRemove = gm.searchParams.get(`${gm.id}_remove`) === 'true'
          const spDisableRemove = gm.searchParams.get(`${gm.id}_disable_remove`) === 'true'
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
        const { btn, cb } = bus
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
     * 稍后再看模式重定向至常规模式播放
     */
    async redirect() {
      // stop() 并不能带来有效的重定向速度改善，反而可能会引起已加载脚本执行错误，也许会造成意外的不良影响
      try {
        let id = null
        const vid = this.method.getVid() // 必须从 URL 直接反推 bvid，其他方式都比这个慢
        if (vid) {
          if (vid.type === 'aid') {
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
     * 初始化列表页面
     */
    async initWatchlaterListPage() {
      const r_con = await api.wait.$('.watch-later-list header .r-con')
      // 页面上本来就存在的「全部播放」按钮不要触发重定向
      const setPlayAll = el => {
        el.href = gm.url.page_watchlaterPlayAll
        el.target = gm.config.openListVideo === Enums.openListVideo.openInCurrent ? '_self' : '_blank'
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
      // 移除「一键清空」按钮
      if (gm.config.removeButton_removeAll) {
        r_con.children[1].style.display = 'none'
      }
      // 移除「移除已观看视频」按钮
      if (gm.config.removeButton_removeWatched) {
        r_con.children[2].style.display = 'none'
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
      // 加入「刷新列表」
      const reload = document.createElement('div')
      reload.id = 'gm-list-reload'
      reload.textContent = '刷新列表'
      reload.className = 's-btn'
      r_con.prepend(reload)
      reload.addEventListener('click', () => {
        this.reloadWatchlaterListPage()
      })

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
            <input type="text" placeholder="搜索... 支持关键字排除 ( - ) 及通配符 ( ? * )">
            <div class="gm-search-clear">✖</div>
          </div>
        `
        const searchBox = searchContainer.firstElementChild
        const [search, searchClear] = searchBox.children

        search.addEventListener('mouseenter', () => search.focus())
        search.addEventListener('input', () => {
          const m = /^\s+(.*)/.exec(search.value)
          if (m) {
            search.value = m[1]
            search.setSelectionRange(0, 0)
          }
          if (search.value.length > 0) {
            searchBox.classList.add('gm-active')
            searchClear.style.visibility = 'visible'
          } else {
            searchBox.classList.remove('gm-active')
            searchClear.style.visibility = ''
          }
        })
        search.addEventListener('input', api.base.throttle(async () => {
          await this.searchWatchlaterListPage()
          await this.updateWatchlaterListPageTotal()
          this.triggerWatchlaterListPageContentLoad()
        }, gm.const.inputThrottleWait))
        searchClear.addEventListener('click', () => {
          search.value = ''
          search.dispatchEvent(new Event('input'))
        })
        if (gm.config.searchDefaultValue) {
          search.addEventListener('mousedown', e => {
            if (e.button === 1) {
              GM_deleteValue('searchDefaultValue_value')
              api.message.info('已清空搜索框默认值')
              e.preventDefault()
            } else if (e.button === 2) {
              GM_setValue('searchDefaultValue_value', search.value)
              api.message.info('已保存搜索框默认值')
              e.preventDefault()
            }
          })
          search.addEventListener('contextmenu', e => e.preventDefault())

          const sdv = GM_getValue('searchDefaultValue_value')
          if (sdv) {
            search.value = sdv
            searchBox.classList.add('gm-active')
            searchClear.style.visibility = 'visible'
          }
          const updateSearchTitle = e => {
            let v = e ? e.detail.value : sdv
            if (!v) v = v === '' ? '[ 空 ]' : '[ 未设置 ]'
            searchBox.title = gm.const.searchDefaultValueHint.replace('$1', v)
          }
          updateSearchTitle()
          window.addEventListener('updateSearchTitle', updateSearchTitle)
        }
      }

      // 增加排序控制
      {
        const sortControlButton = document.createElement('div')
        const control = sortControlButton.appendChild(document.createElement('select'))
        sortControlButton.className = 'gm-list-sort-control-container'
        control.id = 'gm-list-sort-control'
        control.innerHTML = `
          <option value="${Enums.sortType.default}" selected>排序：默认</option>
          <option value="${Enums.sortType.defaultR}">排序：默认↓</option>
          <option value="${Enums.sortType.duration}">排序：时长</option>
          <option value="${Enums.sortType.durationR}">排序：时长↓</option>
          <option value="${Enums.sortType.pubtime}">排序：发布</option>
          <option value="${Enums.sortType.pubtimeR}">排序：发布↓</option>
          <option value="${Enums.sortType.progress}">排序：进度</option>
          <option value="${Enums.sortType.uploader}">排序：UP主</option>
          <option value="${Enums.sortType.title}">排序：标题</option>
          <option value="${Enums.sortType.fixed}">排序：固定</option>
        `
        control.prevVal = control.value
        r_con.prepend(sortControlButton)

        if (gm.config.autoSort !== Enums.autoSort.default) {
          let type = gm.config.autoSort
          if (type === Enums.autoSort.auto) {
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

          control.addEventListener('change', () => {
            if (gm.config.autoSort === Enums.autoSort.auto) {
              GM_setValue('autoSort_auto', control.value)
            }
            this.sortWatchlaterListPage()
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
        if (gm.config.autoRemove !== Enums.autoRemove.absoluteNever) {
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
          const autoRemove = gm.config.autoRemove === Enums.autoRemove.always || gm.config.autoRemove === Enums.autoRemove.openFromList
          autoRemoveControl.className = 's-btn'
          autoRemoveControl.title = '临时切换在当前页面打开视频后是否将其自动移除出「稍后再看」。若要默认开启/关闭自动移除功能，请在「用户设置」中配置。'
          autoRemoveControl.autoRemove = autoRemove
          if (autoRemove) {
            autoRemoveControl.setAttribute('enabled', '')
          }
          autoRemoveControl.addEventListener('click', () => {
            if (autoRemoveControl.autoRemove) {
              autoRemoveControl.removeAttribute('enabled')
              api.message.info('已临时关闭自动移除功能')
            } else {
              autoRemoveControl.setAttribute('enabled', '')
              api.message.info('已临时开启自动移除功能')
            }
            autoRemoveControl.autoRemove = !autoRemoveControl.autoRemove
          })
        } else {
          autoRemoveControl.className = 'd-btn'
          autoRemoveControl.style.cursor = 'not-allowed'
          autoRemoveControl.addEventListener('click', () => {
            api.message.info('当前彻底禁用自动移除功能，无法执行操作')
          })
        }
      }

      // 将顶栏固定在页面顶部
      if (gm.config.listStickControl) {
        let p1 = '-0.3em'
        let p2 = '2.8em'

        if (gm.config.headerCompatible === Enums.headerCompatible.bilibiliEvolved) {
          api.base.addStyle(`
            .custom-navbar.transparent::before {
              height: calc(1.3 * var(--navbar-height)) !important;
            }
          `)
          p1 = '-3.5em'
          p2 = '6em'
        } else {
          const header = await api.wait.$('#internationalHeader .mini-header')
          const style = window.getComputedStyle(header)
          const isGm430292Fixed = style.position === 'fixed' && style.backgroundImage.startsWith('linear-gradient')
          if (isGm430292Fixed) { // https://greasyfork.org/zh-CN/scripts/430292
            p1 = '-3.1em'
            p2 = '5.6em'
          }
        }

        api.base.addStyle(`
          .watch-later-list {
            position: relative;
            top: ${p1};
          }

          .watch-later-list > header {
            position: sticky;
            top: 0;
            margin-top: 0;
            padding-top: ${p2};
            background: white;
            z-index: 1;
          }
        `)
      }
    }

    /**
     * 对稍后再看列表页面进行处理
     * @param {boolean} byReload 由页内刷新触发
     */
    async processWatchlaterListPage(byReload) {
      const _self = this
      const data = await gm.data.watchlaterListData(true)
      const fixedItems = GM_getValue('fixedItems') ?? []
      const sortable = gm.config.autoSort !== Enums.autoSort.default || gm.config.listSortControl
      let autoRemoveControl = null
      if (gm.config.autoRemove !== Enums.autoRemove.absoluteNever) {
        autoRemoveControl = await api.wait.$('#gm-list-auto-remove-control')
      }
      const listContainer = await api.wait.$('.watch-later-list')
      const listBox = await api.wait.$('.list-box', listContainer)
      const items = listBox.querySelectorAll('.av-item')
      for (const [idx, item] of items.entries()) {
        if (item.serial != null) {
          item.serial = idx
          continue
        }
        // info
        const d = data[idx]
        item.state = d.state
        item.serial = idx
        item.aid = String(d.aid)
        item.bvid = d.bvid
        item.vTitle = d.title
        item.uploader = d.owner.name
        item.duration = d.duration
        item.pubtime = d.pubdate
        item.multiP = d.videos > 1
        if (d.progress < 0) {
          d.progress = d.duration
        }
        item.progress = (d.videos > 1 && d.progress > 0) ? d.duration : d.progress

        initItem(item)
        for (const link of item.querySelectorAll('a:not([class=user])')) {
          processLink(item, link, autoRemoveControl)
        }
      }
      if (gm.config.searchDefaultValue) {
        await this.searchWatchlaterListPage()
      }
      this.updateWatchlaterListPageTotal()

      if (sortable) {
        const sortControl = await api.wait.$('#gm-list-sort-control')
        if (byReload || sortControl.value !== sortControl.prevVal) {
          this.sortWatchlaterListPage()
        }
      }

      if (!byReload) {
        // 现在仍在 fixedItems 中的是无效固定项，将它们移除
        // 仅在列表项不为空时才执行移除，因为「列表项为空」有可能是一些特殊情况造成的误判
        if (items.length > 0) {
          for (const item of fixedItems) {
            gm.data.fixedItem(item, false)
          }
        }

        this.handleAutoReloadWatchlaterListPage()
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
        const [fixer, collector, switcher] = tools.children
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
                _self.sortWatchlaterListPage()
              }
              _self.updateWatchlaterListPageTotal()
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

        switcher.addEventListener('click', () => {
          switchStatus(!item.added)
        })

        collector.addEventListener('click', async () => {
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

        fixer.addEventListener('click', () => {
          if (item.fixed) {
            item.classList.remove('gm-fixed')
          } else {
            item.classList.add('gm-fixed')
          }
          item.fixed = !item.fixed
          gm.data.fixedItem(item.bvid, item.fixed)
        })
        fixer.addEventListener('contextmenu', e => {
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
            progress = document.createElement('span')
            progress.className = 'looked'
            state.prepend(progress)
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
          link.target = gm.config.openListVideo === Enums.openListVideo.openInCurrent ? '_self' : '_blank'
          if (gm.config.redirect) {
            link.href = `${gm.url.page_videoNormalMode}/${base.bvid}`
          }
          if (arc) {
            link.addEventListener('mousedown', e => {
              if (e.button === 0 || e.button === 1) { // 左键或中键
                if (base.fixed) return
                if (!link._href) {
                  link._href = link.href
                }
                if (arc.autoRemove) {
                  if (gm.config.autoRemove !== Enums.autoRemove.always) {
                    const url = new URL(link.href)
                    url.searchParams.set(`${gm.id}_remove`, 'true')
                    link.href = url.href
                  } else {
                    link.href = link._href
                  }
                } else {
                  if (gm.config.autoRemove === Enums.autoRemove.always) {
                    const url = new URL(link.href)
                    url.searchParams.set(`${gm.id}_disable_remove`, 'true')
                    link.href = url.href
                  } else {
                    link.href = link._href
                  }
                }
              }
            })
            link.addEventListener('mouseup', e => {
              if (e.button === 0 || e.button === 1) { // 左键或中键
                if (base.fixed) return
                if (arc.autoRemove) {
                  // 添加移除样式并移动至列表末尾
                  base.classList.add('gm-removed')
                  base.added = false
                  base.switcher.checked = false
                  setTimeout(() => {
                    if (sortable) {
                      _self.sortWatchlaterListPage()
                    }
                    _self.updateWatchlaterListPageTotal()
                  }, 100)
                }
              }
            })
          }
        } else {
          link.removeAttribute('href')
        }
      }
    }

    /**
     * 对稍后再看列表进行搜索
     */
    async searchWatchlaterListPage() {
      const search = await api.wait.$('#gm-list-search input')
      let val = search.value.trim()
      let include = null
      let exclude = null
      const isIncluded = str => str && include?.test(str)
      const isExcluded = str => str && exclude?.test(str)
      if (val.length > 0) {
        try {
          val = val.replace(/[$()+.[\\\]^{|}]/g, '\\$&') // escape regex
            .replaceAll('?', '.').replaceAll('*', '.*') // 通配符
          for (const part of val.split(' ')) {
            if (part) {
              if (part.startsWith('-')) {
                if (part.length === 1) continue
                if (exclude) {
                  exclude += '|' + part.slice(1)
                } else {
                  exclude = part.slice(1)
                }
              } else {
                if (include) {
                  include += '|' + part
                } else {
                  include = part
                }
              }
            }
          }
          if (!include && exclude) {
            include = '.*'
          }
          include = include && new RegExp(include, 'i')
          exclude = exclude && new RegExp(exclude, 'i')
        } catch {
          include = exclude = null
        }
      }

      const listBox = await api.wait.$('.watch-later-list .list-box')
      for (const item of listBox.querySelectorAll('.av-item')) {
        let valid = false
        if (include || exclude) {
          if (isIncluded(item.vTitle) || isIncluded(item.uploader)) {
            if (!isExcluded(item.vTitle) && !isExcluded(item.uploader)) {
              valid = true
            }
          }
        } else {
          valid = true
        }
        if (valid) {
          item.classList.remove('gm-filtered')
        } else {
          item.classList.add('gm-filtered')
        }
      }
    }

    /**
     * 对稍后再看列表页面进行排序
     */
    async sortWatchlaterListPage() {
      const sortControl = await api.wait.$('#gm-list-sort-control')
      const listBox = await api.wait.$('.watch-later-list .list-box')
      let type = sortControl.value
      sortControl.prevVal = type
      if (type === Enums.sortType.fixed) {
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
          if (typeof va === 'string') {
            result = va.localeCompare(vb)
          } else {
            result = va - vb
          }
          return reverse ? -result : result
        })
        for (const item of items) {
          item.style.order = order++
        }
      }
      this.triggerWatchlaterListPageContentLoad()
    }

    /**
     * 刷新稍后再看列表页面
     * @param {[string, string]} msg [执行成功信息, 执行失败信息]，设置为 null 或对应项为空时静默执行
     */
    async reloadWatchlaterListPage(msg = ['刷新成功', '刷新失败']) {
      const list = await api.wait.$('.watch-later-list')
      const vue = await api.wait.waitForConditionPassed({
        condition: () => list.__vue__,
      })
      vue.state = 'loading' // 内部刷新过程中 state 依然保留原来的 loaded / error，很呆，手动改一下
      vue.getListData() // 更新内部 listData，其数据会同步到 DOM 上
      await api.wait.waitForConditionPassed({
        condition: () => vue.state !== 'loading',
        stopOnTimeout: false,
      })
      const success = vue.state === 'loaded'
      if (success) {
        // 刷新成功后，所有不存在的 item 都会被移除，没有被移除就说明该 item 又被重新加回稍后再看中
        for (const item of list.querySelectorAll('.av-item.gm-removed')) {
          item.classList.remove('gm-removed')
          item.querySelector('.gm-list-item-switcher').checked = true
        }
        await this.processWatchlaterListPage(true)

        if (gm.runtime.autoReloadListTid != null) {
          this.handleAutoReloadWatchlaterListPage() // 重新计时
        }
      }
      (await api.wait.$('#gm-list-reload')).title = `上次刷新时间：${new Date().toLocaleString()}`
      msg &&= success ? msg[0] : msg[1]
      msg && api.message.info(msg)
    }

    /**
     * 处理稍后再看列表页面自动刷新
     */
    handleAutoReloadWatchlaterListPage() {
      if (gm.config.autoReloadList > 0) {
        if (gm.runtime.autoReloadListTid != null) {
          clearTimeout(gm.runtime.autoReloadListTid)
        }
        const interval = gm.config.autoReloadList * 60 * 1000
        const autoReload = async () => {
          gm.runtime.autoReloadListTid = null
          await this.reloadWatchlaterListPage(null)
          gm.runtime.autoReloadListTid = setTimeout(autoReload, interval)
        }
        gm.runtime.autoReloadListTid = setTimeout(autoReload, interval)
      }
    }

    /**
     * 触发列表页面内容加载
     */
    triggerWatchlaterListPageContentLoad() {
      window.dispatchEvent(new Event('scroll'))
    }

    /**
     * 更新列表页面上方的视频总数统计
     */
    async updateWatchlaterListPageTotal() {
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
      if (api.base.urlMatch(gm.regex.page_videoNormalMode)) {
        // 常规播放页
        await this.processAutoRemove()
      } else if (api.base.urlMatch(gm.regex.page_videoWatchlaterMode)) {
        // 稍后再看播放页；推迟执行，否则稍后再看播放页会因为检测不到视频在稍后再看中而出错
        await this.processAutoRemove(5000)
      }
    }

    /**
     * 根据用户配置或 URL 上的查询参数，将视频从稍后再看移除
     * @param {number} [delay=0] 延迟执行（单位：ms）
     * @returns {Promise<boolean>} 执行后视频是否已经不在稍后再看中（可能是在本方法内被移除，也可能是本身就不在）
     */
    async processAutoRemove(delay = 0) {
      try {
        const alwaysAutoRemove = gm.config.autoRemove === Enums.autoRemove.always
        const spRemove = gm.searchParams.get(`${gm.id}_remove`) === 'true'
        const spDisableRemove = gm.searchParams.get(`${gm.id}_disable_remove`) === 'true'
        if ((alwaysAutoRemove || spRemove) && !spDisableRemove) {
          if (gm.data.fixedItem(this.method.getBvid())) return
          const aid = this.method.getAid()
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          const success = await this.method.switchVideoWatchlaterStatus(aid, false)
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
      switch (gm.config.removeHistorySavePoint) {
        case Enums.removeHistorySavePoint.list:
          if (api.base.urlMatch(gm.regex.page_watchlaterList)) {
            this.method.updateRemoveHistoryData()
          }
          break
        case Enums.removeHistorySavePoint.listAndMenu:
        default:
          if (api.base.urlMatch(gm.regex.page_watchlaterList)) {
            this.method.updateRemoveHistoryData()
          }
          break
        case Enums.removeHistorySavePoint.anypage:
          if (!api.base.urlMatch(gm.regex.page_dynamicMenu)) {
            this.method.updateRemoveHistoryData()
          }
          break
      }
    }

    /**
     * 添加批量添加管理器按钮
     */
    addBatchAddManagerButton() {
      if (location.pathname === '/') { // 仅动态主页
        api.wait.$('.bili-dyn-list-tabs__list').then(bar => {
          const btn = bar.firstElementChild.cloneNode(true)
          btn.id = 'gm-batch-manager-btn'
          btn.classList.remove('active')
          btn.textContent = '批量添加'
          btn.addEventListener('click', () => script.openBatchAddManager())
          bar.append(btn)
        })
      }
    }

    /**
     * 添加弹出面板的滚动条样式
     */
    addMenuScrollbarStyle() {
      const popup = `#${gm.id} .gm-entrypopup .gm-entry-list`
      const oldTooltip = '[role=tooltip]' // 旧版顶栏弹出面板
      const oldDynamic = '#app > .out-container > .container' // 旧版动态弹出面板
      switch (gm.config.menuScrollbarSetting) {
        case Enums.menuScrollbarSetting.beautify:
          // 目前在不借助 JavaScript 的情况下，无法完美实现类似于移动端滚动条浮动在内容上的效果
          api.base.addStyle(`
            :root {
              --${gm.id}-scrollbar-background-color: transparent;
              --${gm.id}-scrollbar-thumb-color: #0000002b;
            }

            ${popup}::-webkit-scrollbar,
            ${oldTooltip} ::-webkit-scrollbar,
            ${oldDynamic}::-webkit-scrollbar {
              width: 4px;
              height: 5px;
              background-color: var(--${gm.id}-scrollbar-background-color);
            }

            ${popup}::-webkit-scrollbar-thumb,
            ${oldTooltip} ::-webkit-scrollbar-thumb,
            ${oldDynamic}::-webkit-scrollbar-thumb {
              border-radius: 4px;
              background-color: var(--${gm.id}-scrollbar-background-color);
            }

            ${popup}:hover::-webkit-scrollbar-thumb,
            ${oldTooltip} :hover::-webkit-scrollbar-thumb,
            ${oldDynamic}:hover::-webkit-scrollbar-thumb {
              border-radius: 4px;
              background-color: var(--${gm.id}-scrollbar-thumb-color);
            }

            ${popup}::-webkit-scrollbar-corner,
            ${oldTooltip} ::-webkit-scrollbar-corner,
            ${oldDynamic}::-webkit-scrollbar-corner {
              background-color: var(--${gm.id}-scrollbar-background-color);
            }

            /* 优化官方顶栏弹出面板中的滚动条样式 */
            .dynamic-panel-popover .header-tabs-panel__content::-webkit-scrollbar,
            .history-panel-popover .header-tabs-panel__content::-webkit-scrollbar,
            .favorite-panel-popover__content .content-scroll::-webkit-scrollbar,
            .favorite-panel-popover__nav::-webkit-scrollbar {
              height: 5px !important;
            }
          `)
          break
        case Enums.menuScrollbarSetting.hidden:
          api.base.addStyle(`
            ${popup}::-webkit-scrollbar,
            ${oldTooltip} ::-webkit-scrollbar,
            ${oldDynamic}::-webkit-scrollbar {
              display: none;
            }

            /* 隐藏官方顶栏弹出面板中的滚动条 */
            .dynamic-panel-popover .header-tabs-panel__content::-webkit-scrollbar,
            .history-panel-popover .header-tabs-panel__content::-webkit-scrollbar,
            .favorite-panel-popover__content .content-scroll::-webkit-scrollbar,
            .favorite-panel-popover__nav::-webkit-scrollbar {
              display: none !important;
            }
          `)
          break
        default:
          break
      }
    }

    /**
     * 添加脚本样式
     */
    addStyle() {
      if (self === top) {
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
            padding-top: 1.3em;
          }
          #${gm.id} .gm-entrypopup[data-header-type=old] {
            padding-top: 1em;
          }
          #${gm.id} .gm-entrypopup[data-header-type=old] .gm-popup-arrow {
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
          #${gm.id} .gm-entrypopup[data-header-type=old] .gm-popup-arrow::after {
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

          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[fn=autoRemoveControl],
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button[fn=autoRemoveControl]:hover {
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-entrypopup .gm-entry-bottom .gm-entry-button.gm-popup-auto-remove[fn=autoRemoveControl] {
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
            min-width: 54em;
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
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 0.2em;
            margin: 0 0.2em;
            padding: 0 1.8em 0 2.2em;
            font-size: 1.2em;
            max-height: 66vh;
            overflow-y: auto;
          }
          #${gm.id} .gm-setting .gm-item-container {
            display: flex;
            gap: 1em;
          }
          #${gm.id} .gm-setting .gm-item-label {
            flex: none;
            font-weight: bold;
            color: var(--${gm.id}-text-bold-color);
            width: 4em;
            margin-top: 0.2em;
          }
          #${gm.id} .gm-setting .gm-item-content {
            display: flex;
            flex-direction: column;
            flex: auto;
          }
          #${gm.id} .gm-setting .gm-item {
            padding: 0.2em;
            border-radius: 2px;
          }
          #${gm.id} .gm-setting .gm-item > * {
            display: flex;
            align-items: center;
          }
          #${gm.id} .gm-setting .gm-item:hover,
          #${gm.id} .gm-setting .gm-lineitem:hover {
            color: var(--${gm.id}-hightlight-color);
          }
          #${gm.id} .gm-setting .gm-lineitems {
            display: inline-flex;
            gap: 0.3em;
            color: var(--${gm.id}-text-color);
          }
          #${gm.id} .gm-setting .gm-lineitem {
            display: inline-flex;
            align-items: center;
            gap: 0.1em;
            padding: 0 0.2em;
            border-radius: 2px;
          }
          #${gm.id} .gm-setting .gm-lineitem > * {
            flex: none;
          }

          #${gm.id} .gm-setting input[type=checkbox] {
            margin-top: 0.2em;
            margin-left: auto;
          }
          #${gm.id} .gm-setting input[is=laster2800-input-number] {
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
            pointer-events: none;
          }
          #${gm.id} .gm-setting .gm-warning {
            position: absolute;
            color: var(--${gm.id}-warn-color);
            font-size: 1.4em;
            line-height: 0.8em;
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
            right: 0.3em;
          }
          #${gm.id} .gm-setting [disabled] .gm-warning {
            visibility: hidden;
          }

          #${gm.id} .gm-hideDisabledSubitems .gm-setting-page:not([data-type]) .gm-item[disabled] {
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
          #${gm.id} [data-type=updated] .gm-changelog {
            font-weight: bold;
            color: var(--${gm.id}-update-hightlight-hover-color);
          }
          #${gm.id} [data-type=updated] .gm-changelog:hover {
            color: var(--${gm.id}-update-hightlight-hover-color);
          }
          #${gm.id} [data-type=updated] .gm-updated,
          #${gm.id} [data-type=updated] .gm-updated input,
          #${gm.id} [data-type=updated] .gm-updated select {
            background-color: var(--${gm.id}-update-hightlight-color);
          }
          #${gm.id} [data-type=updated] .gm-updated option {
            background-color: var(--${gm.id}-background-color);
          }
          #${gm.id} [data-type=updated] .gm-updated:hover {
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
          #${gm.id} .gm-batchAddManager .gm-comment input {
            width: 3em;
            padding: 0 0.2em;
            border-width: 0 0 1px 0;
            text-align: center;
          }
          #${gm.id} .gm-batchAddManager .gm-comment input,
          #${gm.id} .gm-batchAddManager .gm-comment button {
            line-height: normal;
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
            cursor: unset !important;
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
          #${gm.id} [disabled] * {
            cursor: not-allowed !important;
            color: var(--${gm.id}-disabled-color) !important;
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
          }
          #${gm.id}-video-btn[data-toolbar-version="2022"] {
            margin-right: 18px;
          }
          #${gm.id}-video-btn[data-toolbar-version="2022"]:hover {
            color: var(--brand_blue); /* 官方提供的 CSS 变量 */
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
          .watch-later-list .list-box > [sort-type-fixed] .gm-fixed,
          #${gm.id} .gm-entrypopup .gm-entry-list[gm-list-reverse] .gm-fixed,
          #${gm.id} .gm-entrypopup .gm-entry-list[sort-type-fixed] .gm-fixed {
            order: -1000 !important;
          }

          [gm-list-reverse] {
            flex-direction: column-reverse !important;
          }
          .gm-list-reverse-end {
            order: unset !important;
          }
          [gm-list-reverse] .gm-list-reverse-end {
            margin-top: auto !important;
            order: -9999 !important;
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

  (function() {
    script = new Script()
    webpage = new Webpage()
    if (!webpage.method.isLogin()) {
      api.logger.info('终止执行：脚本只能工作在B站登录状态下。')
      return
    }

    script.initAtDocumentStart()
    if (api.base.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      if (gm.config.redirect && gm.searchParams.get(`${gm.id}_disable_redirect`) !== 'true') {
        webpage.redirect()
        return
      }
    }

    webpage.method.cleanSearchParams()
    webpage.addStyle()
    if (gm.config.mainRunAt === Enums.mainRunAt.DOMContentLoaded) {
      document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', main) : main()
    } else {
      document.readyState !== 'complete' ? window.addEventListener('load', main) : main()
    }

    function main() {
      script.init()
      if (self === top) {
        script.addScriptMenu()
        api.base.initUrlchangeEvent()

        if (gm.config.headerButton) {
          webpage.addHeaderButton()
        }
        if (gm.config.removeHistory) {
          webpage.processWatchlaterListDataSaving()
        }
        if (gm.config.fillWatchlaterStatus !== Enums.fillWatchlaterStatus.never) {
          webpage.fillWatchlaterStatus()
        }

        if (api.base.urlMatch(gm.regex.page_watchlaterList)) {
          webpage.initWatchlaterListPage()
          webpage.processWatchlaterListPage()
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
          if (gm.config.fillWatchlaterStatus !== Enums.fillWatchlaterStatus.never) {
            webpage.fillWatchlaterStatus()
          }
        }
      }
    }
  })()
})()
