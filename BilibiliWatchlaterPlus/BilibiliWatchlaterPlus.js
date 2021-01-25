// ==UserScript==
// @name            B站稍后再看功能增强
// @version         4.8.5.20210125
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
// @exclude         /.*:\/\/.*:\/\/.*/
// @require         https://greasyfork.org/scripts/409641-api/code/API.js?version=849812
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @connect         api.bilibili.com
// @run-at          document-start
// @incompatible    firefox 不支持 Greasemonkey！Tampermonkey、Violentmonkey 可用
// ==/UserScript==

(function() {
  'use strict'

  // 脚本兼容
  let incompatible = false
  let scriptHandler = '当前脚本管理器'
  if (!GM_info || !GM_info.script || !GM_info.scriptHandler) {
    incompatible = true
  }
  if (GM_info && GM_info.scriptHandler) {
    scriptHandler = GM_info.scriptHandler
    if (scriptHandler == 'Greasemonkey') {
      incompatible = true
    }
  }
  if (incompatible) {
    const label = GM_info && GM_info.script && GM_info.script.name ? `【${GM_info.script.name}】\n\n` : ''
    alert(`${label}脚本不支持${scriptHandler}！请改用Tampermonkey或Violentmonkey。`)
    return
  }
  if (scriptHandler != 'Tampermonkey') {
    const script = GM_info.script
    if (!script.author) {
      script.author = 'Laster2800'
    }
    if (!script.homepage) {
      script.homepage = 'https://greasyfork.org/zh-CN/scripts/395456'
    }
    if (!script.supportURL) {
      script.supportURL = 'https://greasyfork.org/zh-CN/scripts/395456/feedback'
    }
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
   * @property {GMObject_error} error 错误信息
   */
  /**
   * @typedef GMObject_config
   * @property {boolean} headerButton 顶栏入口
   * @property {headerButtonOp} headerButtonOpL 顶栏入口左键点击行为
   * @property {headerButtonOp} headerButtonOpR 顶栏入口右键点击行为
   * @property {headerButtonOp} headerButtonOpM 顶栏入口中键点击行为
   * @property {openHeaderMenuLink} openHeaderMenuLink 顶栏弹出菜单链接点击行为
   * @property {menuScrollbarSetting} menuScrollbarSetting 弹出菜单的滚动条设置
   * @property {boolean} removeHistory 稍后再看移除记录
   * @property {removeHistorySavePoint} removeHistorySavePoint 保存稍后再看历史数据的时间点
   * @property {boolean} removeHistoryFuzzyCompare 开启模糊比对模式以舍弃重复数据
   * @property {number} removeHistorySaves 稍后再看历史数据保存次数
   * @property {number} removeHistorySearchTimes 历史回溯深度
   * @property {fillWatchlaterStatus} fillWatchlaterStatus 填充稍后再看状态
   * @property {boolean} videoButton 视频播放页稍后再看状态快速切换
   * @property {autoRemove} autoRemove 自动将视频从播放列表移除
   * @property {boolean} redirect 稍后再看模式重定向至普通模式播放
   * @property {openListVideo} openListVideo 列表页面视频点击行为
   * @property {boolean} forceConsistentVideo 确保视频的一致性
   * @property {boolean} removeButton_removeAll 移除【一键清空】按钮
   * @property {boolean} removeButton_removeWatched 移除【移除已观看视频】按钮
   * @property {number} watchlaterListCacheValidPeriod 稍后再看列表数据本地缓存有效期（单位：秒）
   * @property {boolean} openSettingAfterConfigUpdate 功能性更新后打开设置页面
   * @property {boolean} reloadAfterSetting 设置生效后刷新页面
   */
  /**
   * @typedef {{[config: string]: GMObject_configMap_item}} GMObject_configMap
   */
  /**
   * @typedef GMObject_configMap_item
   * @property {*} default 默认值
   * @property {'checked'|'value'} attr 对应 `DOM` 节点上的属性
   * @property {boolean} [manual] 配置保存时是否需要手动处理
   * @property {boolean} [needNotReload] 配置改变后是否不需要重新加载就能生效
   * @property {number} [min] 最小值
   * @property {number} [max] 最大值
   * @property {number} [configVersion] 涉及配置更改的最后配置版本
   */
  /**
   * @callback removeHistoryData 通过懒加载方式获取 `removeHistoryData`
   * @param {boolean} [remove] 是否将 `removeHistoryData` 移除
   * @returns {PushQueue<GMObject_data_list>} `removeHistoryData`
   */
  /**
   * @async
   * @callback watchlaterListData 通过懒加载方式获取稍后再看列表数据
   * @param {boolean} [reload] 是否重新加载稍后再看列表数据
   * @param {boolean} [cache=true] 是否使用本地缓存
   * @returns {Promise<GMObject_data_item0[]>} 稍后再看列表数据
   */
  /**
   * `api_queryWatchlaterList` 返回数据中的视频单元
   * @see {@link https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/history%26toview/toview.md#获取稍后再看视频列表 获取稍后再看视频列表}
   * @typedef GMObject_data_item0
   * @property {number} aid 视频 AV 号，务必统一为字符串格式再使用
   * @property {string} bvid 视频 BV 号
   * @property {string} title 视频标题
   */
  /**
   * @typedef {GMObject_data_item[]} GMObject_data_list
   */
  /**
   * @typedef GMObject_data_item
   * @property {string} bvid 视频 BV 号
   * @property {string} title 视频标题
   */
  /**
   * @typedef GMObject_data
   * @property {removeHistoryData} removeHistoryData 为生成移除记录而保存的稍后再看历史数据
   * @property {watchlaterListData} watchlaterListData 当前稍后再看列表数据
   */
  /**
   * @callback api_videoInfo
   * @param {string} id `aid` 或 `bvid`
   * @param {'aid'|'bvid'} type `id` 类型
   * @returns {string} 查询视频信息的 URL
   */
  /**
   * @typedef GMObject_url
   * @property {string} api_queryWatchlaterList 稍后再看列表数据
   * @property {api_videoInfo} api_videoInfo 视频信息
   * @property {string} api_addToWatchlater 将视频添加至稍后再看，要求 POST 一个含 `aid` 和 `csrf` 的表单
   * @property {string} api_removeFromWatchlater 将视频从稍后再看移除，要求 POST 一个含 `aid` 和 `csrf` 的表单
   * @property {string} api_clearWatchlater 清空稍后再看，要求 POST 一个含 `csrf` 的表单
   * @property {string} page_watchlaterList 列表页面
   * @property {string} page_videoNormalMode 正常模式播放页
   * @property {string} page_videoWatchlaterMode 稍后再看模式播放页
   * @property {string} page_watchlaterPlayAll 稍后再看播放全部
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
   * @property {string} DOM_PARSE DOM 解析错误
   * @property {string} NETWORK 网络错误
   * @property {string} REDIRECT 重定向错误
   * @property {string} UNKNOWN 未知错误
   */
  /**
   * 全局对象
   * @type {GMObject}
   */
  const gm = {
    id: 'gm395456',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20201016,
    searchParams: new URL(location.href).searchParams,
    config: {},
    configMap: {
      headerButton: { default: true, attr: 'checked' },
      headerButtonOpL: { default: Enums.headerButtonOp.openListInCurrent, attr: 'value', configVersion: 20201016 },
      headerButtonOpR: { default: Enums.headerButtonOp.openUserSetting, attr: 'value', configVersion: 20201016 },
      headerButtonOpM: { default: Enums.headerButtonOp.openListInNew, attr: 'value', configVersion: 20201016 },
      openHeaderMenuLink: { default: Enums.openHeaderMenuLink.openInCurrent, attr: 'value', configVersion: 20200717 },
      menuScrollbarSetting: { default: Enums.menuScrollbarSetting.beautify, attr: 'value', configVersion: 20200722 },
      removeHistory: { default: true, attr: 'checked', manual: true },
      removeHistorySavePoint: { default: Enums.removeHistorySavePoint.listAndMenu, attr: 'value', configVersion: 20200815 },
      removeHistoryFuzzyCompare: { default: true, attr: 'checked', needNotReload: true, configVersion: 20200819 },
      removeHistorySaves: { default: 64, attr: 'value', manual: true, needNotReload: true, min: 1, max: 1024, configVersion: 20200721 },
      removeHistorySearchTimes: { default: 16, attr: 'value', manual: true, needNotReload: true, configVersion: 20200716 },
      fillWatchlaterStatus: { default: Enums.fillWatchlaterStatus.dynamicAndVideo, attr: 'value', configVersion: 20200819 },
      videoButton: { default: true, attr: 'checked' },
      autoRemove: { default: Enums.autoRemove.openFromList, attr: 'value', configVersion: 20200805 },
      redirect: { default: false, attr: 'checked' },
      openListVideo: { default: Enums.openListVideo.openInCurrent, attr: 'value', configVersion: 20200717 },
      forceConsistentVideo: { default: true, attr: 'checked', configVersion: 20200723 },
      removeButton_removeAll: { default: false, attr: 'checked', configVersion: 20200722 },
      removeButton_removeWatched: { default: false, attr: 'checked', configVersion: 20200722 },
      watchlaterListCacheValidPeriod: { default: 15, attr: 'value', manual: true, needNotReload: true, max: 600, configVersion: 20200927 },
      openSettingAfterConfigUpdate: { default: true, attr: 'checked', configVersion: 20200805 },
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
      page_watchlaterPlayAll: 'https://www.bilibili.com/medialist/play/watchlater/p1',
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/BilibiliWatchlaterPlus/changelog.md',
      noop: 'javascript:void(0)',
    },
    regex: {
      page_watchlaterList: /\.com\/watchlater\/.*#.*\/list(?=\/|$)/,
      page_videoNormalMode: /\.com\/video(?=\/|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater(?=\/|$)/,
      page_dynamic: /t\.bilibili\.com(?=\/|$)/,
      page_dynamicMenu: /\.com\/pages\/nav\/index_new#(?=\/|$)/,
    },
    const: {
      rhsWarning: 256,
      fadeTime: 400,
      textFadeTime: 100,
    },
    menu: {
      setting: { state: false, el: null },
      history: { state: false, el: null },
    },
    el: {
      gmRoot: null,
      setting: null,
      history: null,
    },
    error: {
      DOM_PARSE: `DOM解析错误。大部分情况下是由于网络加载速度不足造成的，不影响脚本工作；否则就是B站网页改版，请联系脚本作者进行修改：${GM_info.script.supportURL}`,
      NETWORK: `网络连接错误，出现这个问题有可能是因为网络加载速度不足或者B站后台API被改动。也不排除是脚本内部数据出错造成的，初始化脚本或清空稍后再看历史数据也许能解决问题。无法解决请联系脚本作者：${GM_info.script.supportURL}`,
      REDIRECT: `重定向错误，可能是网络问题，如果重新加载页面依然出错请联系脚本作者：${GM_info.script.supportURL}`,
      UNKNOWN: `未知错误，请联系脚本作者：${GM_info.script.supportURL}`,
    },
  }

  /* global API */
  const api = new API({
    id: gm.id,
    label: GM_info.script.name,
    fadeTime: gm.const.fadeTime,
  })

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
            if (!_.removeHistoryData) {
              let data = GM_getValue('removeHistoryData')
              if (data && typeof data == 'object') {
                Object.setPrototypeOf(data, PushQueue.prototype) // 还原类型信息
                if (data.maxSize != gm.config.removeHistorySaves) {
                  data.setMaxSize(gm.config.removeHistorySaves)
                }
              } else {
                data = new PushQueue(gm.config.removeHistorySaves, gm.configMap.removeHistorySaves.max)
                GM_setValue('removeHistoryData', data)
              }
              _.removeHistoryData = data
            }
            return _.removeHistoryData
          }
        },
        watchlaterListData: async (reload, cache = true) => {
          const _ = gm.data._
          if (!_.watchlaterListData || reload) {
            if (_.watchlaterListData_loading) {
              try {
                return await api.wait.waitForConditionPassed({
                  condition: () => {
                    if (!_.watchlaterListData_loading) {
                      return _.watchlaterListData
                    }
                  }
                })
              } catch (e) {
                _.watchlaterListData_loading = false
                api.logger.error(gm.error.NETWORK)
                api.logger.error(e)
                // 不要 return，继续执行，重新请求
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
                    return list
                  }
                }
              }
            }

            _.watchlaterListData = null // 一旦重新获取，将原来的数据舍弃
            _.watchlaterListData_loading = true
            try {
              const resp = await api.web.request({
                method: 'GET',
                url: gm.url.api_queryWatchlaterList,
              })
              const json = JSON.parse(resp.responseText)
              const current = json.data.list
              if (gm.config.watchlaterListCacheValidPeriod > 0) {
                GM_setValue('watchlaterListCacheTime', new Date().getTime())
                GM_setValue('watchlaterListCache', current)
              }
              _.watchlaterListData = current
              return current
            } catch (e) {
              api.logger.error(gm.error.NETWORK)
              api.logger.error(e)
              return null
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
      // 该项与更新相关，在此处处理
      gm.config.openSettingAfterConfigUpdate = _self.method.gmValidate('openSettingAfterConfigUpdate', gm.config.openSettingAfterConfigUpdate)
      if (gm.configVersion > 0) {
        if (gm.configVersion < gm.configUpdate) {
          if (gm.config.openSettingAfterConfigUpdate) {
            _self.openUserSetting(2)
          }

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
                removeHistoryData.setCapacity(gm.configMap.removeHistorySaves.max)
                GM_setValue('removeHistoryData', removeHistoryData)
              }
            } else {
              // 如果 removeHistory 关闭则移除 removeHistoryData
              GM_setValue('removeHistoryData', null)
            }
          }

          // 3.0.0.20200721
          if (gm.configVersion < 20200721) {
            const openHeaderMenuLink = _self.method.gmValidate('openHeaderDropdownLink', gm.config.openHeaderMenuLink, false)
            GM_setValue('openHeaderMenuLink', openHeaderMenuLink)
            GM_deleteValue('openHeaderDropdownLink')
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
          }

          // 4.0.0.20200806
          if (gm.configVersion < 20200805) {
            GM_deleteValue('resetAfterFnUpdate')
          }

          // 4.7.4.20200927
          if (gm.configVersion < 20200927) {
            GM_setValue('watchlaterListCacheValidPeriod', 15)
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
        const cfgManual = { openSettingAfterConfigUpdate: true } // 手动处理的配置
        const cfgNoWriteback = { removeHistorySearchTimes: true } // 不进行回写的配置
        for (const name in gm.config) {
          if (!cfgDocumentStart[name] && !cfgManual[name]) {
            gm.config[name] = _self.method.gmValidate(name, gm.config[name], !cfgNoWriteback[name])
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
        gm.config.removeHistorySaves = _self.method.gmValidate('removeHistorySaves', gm.config.removeHistorySaves, true)
        // removeHistorySearchTimes 使用默认值，但不能比 removeHistorySaves 大
        if (gm.config.removeHistorySearchTimes > gm.config.removeHistorySaves) {
          gm.config.removeHistorySearchTimes = gm.config.removeHistorySaves
        }
        GM_setValue('removeHistorySearchTimes', gm.config.removeHistorySearchTimes)

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
          gm.el.setting.className = 'gm-setting'
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
                  <tr class="gm-item" title="在顶栏“动态”和“收藏”之间加入稍后再看入口，鼠标移至上方时弹出列表菜单，支持点击功能设置。">
                    <td rowspan="6"><div>全局功能</div></td>
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
                  <tr class="gm-subitem" title="选择在弹出菜单中点击视频的行为。为了保持行为一致，这个选项也会影响弹出菜单中收藏夹视频的打开，但不影响“动态”、“历史”等其他弹出菜单中点击视频的行为。">
                    <td>
                      <div>
                        <span>在弹出菜单中点击视频时</span>
                        <select id="gm-openHeaderMenuLink">
                          <option value="${Enums.openHeaderMenuLink.openInCurrent}">在当前页面打开</option>
                          <option value="${Enums.openHeaderMenuLink.openInNew}">在新标签页打开</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="对弹出菜单中滚动条样式进行设置。为了保持行为一致，这个选项也会影响“动态”、“历史”等其他入口的弹出菜单。">
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

                  <tr class="gm-item" title="保留最近几次打开【${gm.url.page_watchlaterList}】页面时稍后再看列表的记录，以查找出这段时间内将哪些视频移除出稍后再看，用于防止误删操作。关闭该选项后，会将内部历史数据清除！">
                    <td rowspan="5"><div>全局功能</div></td>
                    <td>
                      <label>
                        <span>开启稍后再看移除记录</span>
                        <input id="gm-removeHistory" type="checkbox">
                        <span id="gm-rhWarning" class="gm-warning" title="">⚠</span>
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="选择在何时保存稍后再看历史数据。无论选择哪一种方式，在同一个URL对应的页面下至多保存一次。">
                      <td>
                        <div>
                          <span>为了生成移除记录，</span>
                          <select id="gm-removeHistorySavePoint">
                            <option value="${Enums.removeHistorySavePoint.list}">在打开列表页面时保存数据</option>
                            <option value="${Enums.removeHistorySavePoint.listAndMenu}">在打开列表页面或弹出入口菜单时保存数据</option>
                            <option value="${Enums.removeHistorySavePoint.anypage}">在打开任意相关页面时保存数据</option>
                          </select>
                          <span id="gm-rhspInformation" class="gm-information" title="">💬</span>
                        </div>
                      </td>
                  </tr>
                  <tr class="gm-subitem" title="开启模糊比对模式以舍弃重复数据，从而提高数据密度并降低开销，但可能会造成部分记录的遗漏。关闭后，不会判断获取到的稍后再看列表数据是否重复，直接进行保存。">
                    <td>
                      <label>
                        <span>开启模糊比对模式以舍弃重复数据</span>
                        <span id="gm-rhfcInformation" class="gm-information" title="">💬</span>
                        <input id="gm-removeHistoryFuzzyCompare" type="checkbox">
                      </label>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="较大的数值可能会带来较大的开销，经过性能测试，作者认为在设置在${gm.const.rhsWarning}以下时，即使在极限情况下也不会产生让人能察觉到的卡顿（存取总时不超过100ms），但在没有特殊要求的情况下依然不建议设置到这么大。该项修改后，会立即对过期记录进行清理，重新修改为原来的值无法还原被清除的记录，设置为比原来小的值需慎重！（范围：${gm.configMap.removeHistorySaves.min} ~ ${gm.configMap.removeHistorySaves.max}）">
                    <td>
                      <div>
                        <span>稍后再看历史数据保存次数</span>
                        <span id="gm-cleanRemoveHistoryData" class="gm-hint-option" title="清理已保存的稍后再看历史数据，不可恢复！">清空数据(0条)</span>
                        <input id="gm-removeHistorySaves" type="text">
                        <span id="gm-rhsWarning" class="gm-warning" title="">⚠</span>
                      </div>
                    </td>
                  </tr>
                  <tr class="gm-subitem" title="搜寻时在最近保存的多少次稍后再看历史数据中查找，设置较小的值能较好地定位最近移除的视频。设置较大的值几乎不会对性能造成影响，但不能大于最近稍后再看历史数据保存次数。">
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
                        <span id="gm-fwsInformation" class="gm-information" title="">💬</span>
                      </div>
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
                          <option value="${Enums.autoRemove.never}">从不执行自动移除功能</option>
                        </select>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="打开【${gm.url.page_videoWatchlaterMode}】页面时，自动切换至【${gm.url.page_videoNormalMode}】页面进行播放。">
                    <td><div>播放页面</div></td>
                    <td>
                      <label>
                        <span>从稍后再看模式强制切换到普通模式播放</span>
                        <input id="gm-redirect" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="设置在【${gm.url.page_watchlaterList}】页面点击视频时的行为。">
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

                  <tr class="gm-item" title="见弹出说明">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>确保视频的一致性（避免点击A视频却打开B视频的问题）</span>
                        <span id="gm-fcvInformation" class="gm-information" title="">💬</span>
                        <input id="gm-forceConsistentVideo" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="这个按钮太危险了……">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>移除【一键清空】按钮</span>
                        <input id="gm-removeButton_removeAll" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="这个按钮太危险了……">
                    <td><div>列表页面</div></td>
                    <td>
                      <label>
                        <span>移除【移除已观看视频】按钮</span>
                        <input id="gm-removeButton_removeWatched" type="checkbox">
                      </label>
                    </td>
                  </tr>

                  <tr class="gm-item" title="稍后再看列表数据本地缓存有效期（单位：秒）">
                    <td><div>脚本设置</div></td>
                    <td>
                      <div>
                        <span>稍后再看列表数据本地缓存有效期（单位：秒）</span>
                        <input id="gm-watchlaterListCacheValidPeriod" type="text">
                        <span id="gm-wlcvpInformation" class="gm-information" title="">💬</span>
                      </div>
                    </td>
                  </tr>

                  <tr class="gm-item" title="功能性更新后，是否打开用户设置？">
                    <td><div>用户设置</div></td>
                    <td>
                      <label>
                        <span>功能性更新后打开用户设置</span>
                        <input id="gm-openSettingAfterConfigUpdate" type="checkbox">
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
                    if (!node) {
                      api.logger.error(gm.error.DOM_PARSE)
                      break
                    }
                  }
                  if (node && node.firstElementChild) {
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
              <p>选择更多的保存时间点，可以提高移除记录的准确度，降低遗漏历史数据的情况。但是数据冲刷速度更快，数据利用率低，可能会导致真正有价值的记录被冲洗掉，并且增大IO和运算负担。无论选择哪一种方式，在同一个URL对应的页面下至多保存一次。</p>
              <p>如果你习惯于先点开稍后再看列表页面，再点击视频观看，建议选择第一项，当然选择第二项提高准确度也是合理的。如果你习惯于直接在顶栏弹出菜单中点击视频观看，请选择第二项。第三项【在打开任意相关页面时保存数据】性价比低，如果没有特别需求请不要选择，否则务必开启模糊比对模式。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhspInformation.parentNode.hasAttribute('disabled') })
          el.rhfcInformation = gm.el.setting.querySelector('#gm-rhfcInformation')
          api.message.advanced(el.rhfcInformation, `
            <div style="line-height:1.6em">
              模糊比对模式：设当前时间点获取到的稍后再看列表数据为A，上一次获取到的稍后再看列表数据为B。若A与B列表中的第一个视频以及总视频数相同，则认为A与B完全一致，并将A舍弃。
            </div>
          `, '💬', { width: '36em', flagSize: '2em', disabled: () => el.rhfcInformation.parentNode.hasAttribute('disabled') })
          el.fwsInformation = gm.el.setting.querySelector('#gm-fwsInformation')
          api.message.advanced(el.fwsInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>在动态页、视频播放页以及其他页面，视频卡片的右下角方存在一个将视频加入或移除出稍后再看的快捷按钮。然而，在刷新页面后，B站不会为之加载稍后再看的状态——即使视频已经在稍后再看中，也不会显示出来。启用该功能后，会自动填充这些缺失的状态信息。</p>
              <p>第三项【所有页面】，会用一套固定的逻辑对脚本能匹配到的所有非特殊页面尝试进行信息填充。脚本本身没有匹配所有B站页面，如果有需要，请在脚本管理器（如Tampermonkey）中为脚本设置额外的页面匹配规则。由于B站各页面的设计不是很规范，某些页面中视频卡片的设计可能跟其他地方不一致，所以不保证必定能填充成功。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.fcvInformation = gm.el.setting.querySelector('#gm-fcvInformation')
          api.message.advanced(el.fcvInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>从列表页面打开视频时，其URL使用该视频在列表中的位置来标识。假如列表在其他页面上被修改，这种定位方式就会出错。这是B站新版稍后再看播放页面的设计缺陷，本设置开启后能修复这个问题。</p>
              <p>假设先打开列表页面，此时列表的第1个视频是A，然后在其他页面将B视频添加到稍后再看，最后回到刚才列表页面点击A视频，结果播放的会是此时真正位于列表第1位的B视频。</p>
              <p>在正常使用的情况下，这个问题出现的频率并不高；此外，如果没有开启模式切换功能，在修复成功后浏览器的历史回退功能会受到影响，且修复过程可能会伴随页面内容切换和不明显的URL变动。如果不希望见到这些问题，或者只是单纯不想在页面引入不必要的脚本操作，请选择关闭。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })
          el.wlcvpInformation = gm.el.setting.querySelector('#gm-wlcvpInformation')
          api.message.advanced(el.wlcvpInformation, `
            <div style="text-indent:2em;line-height:1.6em">
              <p>在本地缓存的有效期内脚本将会使用本地缓存来代替网络请求，除非是在有必要确保数据正确性的场合。设置为 <b>0</b> 可以禁止使用本地缓存。</p>
              <p>本地缓存无法确保数据的正确性，设置过长时甚至可能导致各种诡异的现象。请根据个人需要将本地缓存有效期设置为一个合理的值。</p>
              <p>不推荐设置为 0 将其完全禁用，而是设置为一个较小值（如 2）。这样几乎不会影响正确性，同时保留从 0 到 1 的质变。</p>
            </div>
          `, '💬', { width: '36em', flagSize: '2em' })

          el.rhWarning = gm.el.setting.querySelector('#gm-rhWarning')
          api.message.advanced(el.rhWarning, '关闭移除记录，或将稍后再看历史数据保存次数设置为比原来小的值，都会造成对内部过期历史数据的清理！', '⚠')
          el.rhsWarning = gm.el.setting.querySelector('#gm-rhsWarning')
          api.message.advanced(el.rhsWarning, `该项设置过大时，在极端情况下可能会造成明显的卡顿，一般不建议该项超过${gm.const.rhsWarning}。当然，如果对机器的读写性能自信，可以无视该警告。`, '⚠')

          el.headerButtonOpL.innerHTML = el.headerButtonOpR.innerHTML = el.headerButtonOpM.innerHTML = `
            <option value="${Enums.headerButtonOp.openListInCurrent}">在当前页面打开列表页面</option>
            <option value="${Enums.headerButtonOp.openListInNew}">在新标签页打开列表页面</option>
            <option value="${Enums.headerButtonOp.playAllInCurrent}">在当前页面播放全部</option>
            <option value="${Enums.headerButtonOp.playAllInNew}">在新标签页播放全部</option>
            <option value="${Enums.headerButtonOp.clearWatchlater}">清空稍后再看</option>
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
          el.headerButton.init = el.headerButton.onchange = function() {
            subitemChange(this, [el.headerButtonOpL, el.headerButtonOpR, el.headerButtonOpM, el.openHeaderMenuLink, el.menuScrollbarSetting])
          }
          el.removeHistory.init = el.removeHistory.onchange = function() {
            subitemChange(this, [el.removeHistorySavePoint, el.removeHistoryFuzzyCompare, el.removeHistorySaves, el.removeHistorySearchTimes])
            setRhWaring()
          }

          // 输入框内容处理
          el.removeHistorySaves.oninput = function() {
            const v0 = this.value.replace(/[^\d]/g, '')
            if (v0 === '') {
              this.value = ''
            } else {
              let value = parseInt(v0)
              if (value > gm.configMap.removeHistorySaves.max) {
                value = gm.configMap.removeHistorySaves.max
              } else if (value < gm.configMap.removeHistorySaves.min) {
                value = gm.configMap.removeHistorySaves.min
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
              // removeHistorySearchTimes 的极值受 removeHistorySaves 约束
              let value = parseInt(v0)
              if (value > gm.configMap.removeHistorySaves.max) {
                value = gm.configMap.removeHistorySaves.max
              } else if (value < gm.configMap.removeHistorySaves.min) {
                value = gm.configMap.removeHistorySaves.min
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
              GM_setValue('removeHistorySaves', rhsV)
              GM_setValue('removeHistoryData', gm.data.removeHistoryData())
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
          } else if (resetMaxSize) {
            // 因：removeHistory
            // 果：removeHistoryData
            gm.data.removeHistoryData(true)
            GM_deleteValue('removeHistoryData')
          }

          const wlcvp = parseInt(el.watchlaterListCacheValidPeriod.value)
          if (wlcvp != gm.config.watchlaterListCacheValidPeriod && !isNaN(wlcvp)) {
            gm.config.watchlaterListCacheValidPeriod = wlcvp
            GM_setValue('watchlaterListCacheValidPeriod', wlcvp)
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
            el[name].init && el[name].init()
          }

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
            api.dom.setAbsoluteCenter(el.settingPage)
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
        el.searchTimes.current = gm.config.removeHistorySearchTimes < gm.data.removeHistoryData().size ? gm.config.removeHistorySearchTimes : gm.data.removeHistoryData().size
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
                <div>根据最近保存的<span id="gm-save-times">0</span>次稍后再看历史数据中的<span id="gm-record-num">0</span>条不重复记录生成（总计<span id="gm-record-num-repeat">0</span>条），共筛选出<span id="gm-remove-num">0</span>条移除记录。排序由视频最后一次加入到稍后再看的时间决定，与移除出稍后再看的时间无关。如果记录太多难以定位被误删的视频，请在下方设置减少历史回溯深度。鼠标移动到内容区域可向下滚动翻页，点击对话框以外的位置退出。</div>
                <div style="text-align:right;font-weight:bold">
                  <span id="gm-history-sort" style="text-decoration:underline;cursor:pointer">倒序</span>
                  <span title="搜寻时在最近保存的多少次稍后再看历史数据中查找，设置较小的值能较好地定位最近移除的视频。按下回车键或输入框失去焦点时刷新数据，输入框为空时自动设为可取的最大值。">历史回溯深度：<input type="text" id="gm-search-times" value="0"></span>
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
            this.title = `点击切换${this.typeText[(type + 1) % 2]}`
          }
          el.historySort.onclick = function() {
            this.setType((this.type + 1) % 2)
            gm.menu.history.openHandler()
          }

          gm.menu.history.openHandler = onOpen
          window.addEventListener('resize', setContentTop)
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

          el.historyPage.parentNode.style.display = 'block'
          setTimeout(() => {
            api.dom.setAbsoluteCenter(el.historyPage)
          }, 10)

          try {
            const resp = await api.web.request({
              method: 'GET',
              url: gm.url.api_queryWatchlaterList,
            })
            const bvid = []
            const json = JSON.parse(resp.responseText)
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
              el.content.innerText = `在最近保存的 ${el.searchTimes.current} 次稍后再看历史数据中没有找到被移除的记录，请尝试增大历史回溯深度`
              el.content.style.color = 'gray'
            }
            el.content.style.opacity = '1'
          } catch (e) {
            const errorInfo = gm.error.NETWORK
            setContentTop() // 在设置内容前设置好 top，这样看不出修改的痕迹
            el.content.innerHTML = errorInfo
            el.content.style.opacity = '1'
            el.content.style.color = 'gray'

            api.logger.error(errorInfo)
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
      const result = confirm(`【${GM_info.script.name}】\n\n是否要清空稍后再看历史数据？`)
      if (result) {
        this.closeMenuItem('setting')
        GM_deleteValue('removeHistorySaves')
        GM_deleteValue('removeHistoryData')
        if (gm.config.reloadAfterSetting) {
          location.reload()
        } else {
          if (gm.config.removeHistory) {
            gm.config.removeHistorySaves = gm.configMap.removeHistorySaves.default
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
      const _self = this
      if (!gm.menu[name].state) {
        for (const key in gm.menu) {
          /** @type {GMObject_menu_item} */
          const menu = gm.menu[key]
          if (key == name) {
            menu.state = true
            menu.openHandler && menu.openHandler.call(menu)
            api.dom.fade(true, menu.el, callback)
            if (document.fullscreenElement) {
              document.exitFullscreen()
            }
          } else {
            if (menu.state) {
              _self.closeMenuItem(key)
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
        api.dom.fade(false, menu.el, () => {
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

      /** 通用方法 */
      this.method = {
        /** 内部数据 */
        _: {},

        /**
         * 获取 CSRF
         * @param {boolean} [reload] 是否重新从 Cookie 中获取
         * @returns {string} `csrf`
         */
        getCSRF(reload) {
          const _ = this._
          if (!_.csrf || reload) {
            let cookies = document.cookie.split('; ')
            cookies = cookies.reduce((prev, val) => {
              const parts = val.split('=')
              const key = parts[0]
              const value = parts[1]
              prev[key] = value
              return prev
            }, {})
            _.csrf = cookies.bili_jct
          }
          return _.csrf
        },

        /**
         * 获取视频信息
         * @async
         * @param {string} id `aid` 或 `bvid`
         * @param {'aid'|'bvid'} [type='bvid'] `id` 类型
         * @returns {Promise<JSON>} 视频信息
         */
        async getVideoInfo(id, type = 'bvid') {
          try {
            const resp = await api.web.request({
              method: 'GET',
              url: gm.url.api_videoInfo(id, type),
            })
            return JSON.parse(resp.responseText).data
          } catch (e) {
            api.logger.error(gm.error.NETWORK)
            api.logger.error(e)
          }
        },

        /**
         * 获取 `aid`
         * @async
         * @returns {Promise<string>} `aid`
         */
        async getAid() {
          let aid
          try {
            if (unsafeWindow.aid) {
              aid = unsafeWindow.aid
            } else {
              aid = await api.wait.waitForConditionPassed({
                condition: () => {
                  const player = unsafeWindow.player
                  const message = player && player.getVideoMessage && player.getVideoMessage()
                  return message && message.aid
                },
              })
            }
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          }
          return String(aid || '')
        },

        /**
         * 根据 `aid` 获取视频的稍后再看状态
         * @async
         * @param {string} aid 视频 `aid`
         * @param {boolean} [pageCache=true] 是否使用页面缓存
         * @param {boolean} [localCache=true] 是否使用本地缓存
         * @returns {Promise<boolean>} 视频是否在稍后再看中
         */
        async getVideoWatchlaterStatusByAid(aid, pageCache = true, localCache = true) {
          const current = await gm.data.watchlaterListData(!pageCache, localCache)
          if (current && current.length > 0) {
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
         * @param {string} aid 视频 `aid`
         * @param {boolean} [status=true] 添加 `true` / 移除 `false`
         * @returns {Promise<boolean>} 操作是否成功
         */
        async switchVideoWatchlaterStatus(aid, status = true) {
          try {
            const data = new FormData()
            data.append('aid', aid)
            data.append('csrf', this.getCSRF())
            const resp = await api.web.request({
              method: 'POST',
              url: status ? gm.url.api_addToWatchlater : gm.url.api_removeFromWatchlater,
              data: data,
            })
            return JSON.parse(resp.response).code == 0
          } catch (e) {
            api.logger.error(gm.error.NETWORK)
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
            return JSON.parse(resp.response).code == 0
          } catch (e) {
            api.logger.error(gm.error.NETWORK)
            api.logger.error(e)
            return false
          }
        },

        /**
         * 保存稍后再看列表数据，用于后续操作
         *
         * 此操作回引起稍后再看历史数据的保存
         * @async
         * @param {boolean} [reload] 是否重新加载稍后再看列表数据
         */
        saveWatchlaterListData(reload) {
          const _ = this._
          if (gm.config.removeHistory) {
            if (!_.watchLaterListData_saved || reload) {
              if (!_.watchlaterListData_saving) {
                _.watchlaterListData_saving = true
                return gm.data.watchlaterListData(reload).then(current => {
                  if (current && current.length > 0) {
                    if (gm.config.removeHistoryFuzzyCompare) {
                      const last = gm.data.removeHistoryData().get(0)
                      if (last && current.length > 0) {
                        const s0 = current.length == last.length
                        const s1 = current[0].bvid == last[0].bvid
                        if (s0 && s1) {
                          _.watchLaterListData_saved = true
                          return
                        }
                      }
                    }

                    const data = []
                    for (const e of current) {
                      data.push({
                        // aid: String(e.aid),
                        bvid: e.bvid,
                        title: e.title,
                      })
                    }
                    gm.data.removeHistoryData().push(data)
                    GM_setValue('removeHistoryData', gm.data.removeHistoryData())
                    _.watchLaterListData_saved = true
                  }
                }).catch(e => {
                  api.logger.error(gm.error.UNKNOWN)
                  api.logger.error(e)
                }).finally(() => {
                  _.watchlaterListData_saving = false
                })
              }
            }
          }
        },

        /**
         * 获取稍后再看列表数据以 `aid` 为键的映射
         * @async
         * @param {boolean} [reload] 是否重新加载稍后再看列表数据
         * @param {boolean} [cache=true] 是否使用稍后再看列表数据本地缓存
         * @returns {Map<string, GMObject_data_item0>} 稍后再看列表数据以 `aid` 为键的映射
         */
        async getWatchlaterDataMap(reload, cache = true) {
          const _ = this._
          if (!_.watchlaterDataMap || reload) {
            const map = new Map()
            const current = await gm.data.watchlaterListData(reload, cache) || []
            for (const item of current) {
              map.set(String(item.aid), item)
            }
            _.watchlaterDataMap = map
          }
          return _.watchlaterDataMap
        },
      }
    }

    /**
     * 顶栏中加入稍后再看入口
     */
    addHeaderButton() {
      const _self = this
      api.wait.waitForElementLoaded('.user-con.signin').then(header => {
        const collect = header.children[4]
        const watchlater = document.createElement('div')
        watchlater.className = 'item'
        const link = watchlater.appendChild(document.createElement('a'))
        const text = link.appendChild(document.createElement('span'))
        text.className = 'name'
        text.innerText = '稍后再看'
        header.insertBefore(watchlater, collect)

        processClickEvent(watchlater)
        processTooltip({ collect, watchlater })
      }).catch(e => {
        api.logger.error(gm.error.DOM_PARSE)
        api.logger.error(e)
      })

      /**
       * 处理清空稍后再看
       * @async
       */
      const clearWatchlater = async () => {
        const result = confirm(`【${GM_info.script.name}】\n\n是否清空稍后再看？`)
        if (result) {
          const success = await this.method.clearWatchlater()
          api.message.create(`清空稍后再看${success ? '成功' : '失败'}`)
          if (success && api.web.urlMatch(gm.regex.page_watchlaterList)) {
            location.reload()
          }
        }
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
            case Enums.headerButtonOp.openUserSetting:
              _self.script.openUserSetting()
              break
            case Enums.headerButtonOp.openRemoveHistory:
              _self.script.openRemoveHistory()
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
        const dispVue = collect.firstElementChild.__vue__

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
              collect._activeTitle = activePanel.firstElementChild.title
              collect._activePanel = activePanel
            }

            if (!dispVue.showPopper) {
              dispVue.showPopper = true
            }
            // 等待弹出菜单的状态变为“打开”再操作，会比较安全，虽然此时 DOM 上的菜单可能没有真正打开
            // 时间可以给长一点，否则有时候加载得比较慢会 timeout
            const watchlaterPanelChild = await api.wait.waitForElementLoaded({
              selector: watchlaterPanelChildSelector(true),
              interval: 50,
              timeout: 2000,
            })
            watchlaterPanelChild.parentNode.click()
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          }
          setMenuArrow()

          if (gm.config.removeHistory && gm.config.removeHistorySavePoint == Enums.removeHistorySavePoint.listAndMenu) {
            _self.method.saveWatchlaterListData()
          }
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
            const activePanel = await api.wait.waitForElementLoaded({
              selector: activePanelSelector(true),
              interval: 50,
              timeout: 1500,
            })
            const activeTitle = activePanel.firstElementChild.title
            if (activeTitle == '稍后再看') {
              if (!collect._activePanel || collect._activeTitle == '稍后再看') {
                // 一般来说，只有当打开页面后直接通过稍后再看入口打开弹出菜单，然后再将鼠标移动到收藏入口上，才会执行进来
                const defaultCollectPanelChild = await api.wait.waitForElementLoaded({
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
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
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
          if (!menu._addLinkObserver) {
            const openLinkInCurrent = gm.config.openHeaderMenuLink == Enums.openHeaderMenuLink.openInCurrent
            const autoRemove = gm.config.autoRemove == Enums.autoRemove.openFromList
            if (openLinkInCurrent || autoRemove) {
              menu._addLinkObserver = true
              try {
                // 目前默认原来是 _blank，如果以后 B 站改成默认 _self，那要反过来
                // const target = gm.config.openHeaderMenuLink == enums.openHeaderMenuLink.openInNew ? '_blank' : '_self'
                const videoPanel = await api.wait.waitForElementLoaded(videoPanelSelector())
                // 添加一个 ob，在给右边视频面板添加链接时，对其进行处理
                const ob = new MutationObserver(async records => {
                  for (const record of records) {
                    for (const addedNode of record.addedNodes) {
                      const node = addedNode.firstElementChild
                      if (node && node.nodeName == 'A') {
                        /** @type {HTMLAnchorElement} */
                        const link = node
                        if (openLinkInCurrent && link.target != '_self') {
                          link.target = '_self'
                        }

                        if (autoRemove) {
                          const activePanel = await api.wait.waitForElementLoaded({
                            selector: activePanelSelector(true),
                            interval: 50,
                            timeout: 1500,
                          })
                          const activeTitle = activePanel.firstElementChild.title
                          if (activeTitle == '稍后再看') {
                            const url = new URL(link.href)
                            url.searchParams.set(`${gm.id}_remove_from_list`, 'true')
                            link.href = url.href
  
                            link.addEventListener('mouseup', function(e) {
                              // 不能 mousedown，隐藏之后无法触发事件
                              if (e.button == 0 || e.button == 1) { // 左键或中键
                                link.parentNode.style.display = 'none'
                              }
                            })
                          }
                        }
                      }
                    }
                  }
                  // 不要 observer.disconnect()，需一直监听变化
                })
                ob.observe(videoPanel.firstElementChild, { childList: true })
              } catch (e) {
                menu._addLinkObserver = false
                api.logger.error(gm.error.DOM_PARSE)
                api.logger.error(e)
              }
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

      /**
       * 获取入口点击的链接设置
       * @param {headerButtonOp} op
       * @returns {{href: string, target: '_self'|'_blank'}}
       */
      function getHeaderButtonOpConfig(op) {
        /** @type {{href: string, target: '_self'|'_blank'}} */
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
     */
    fillWatchlaterStatus() {
      const _self = this
      setTimeout(() => {
        switch (gm.config.fillWatchlaterStatus) {
          case Enums.fillWatchlaterStatus.dynamic:
            if (api.web.urlMatch(gm.regex.page_dynamic)) {
              fillWatchlaterStatus_dynamic()
            }
            return
          case Enums.fillWatchlaterStatus.dynamicAndVideo:
            if (api.web.urlMatch(gm.regex.page_dynamic)) {
              fillWatchlaterStatus_dynamic()
            } else if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
              fillWatchlaterStatus_main()
            }
            return
          case Enums.fillWatchlaterStatus.anypage:
            if (api.web.urlMatch(gm.regex.page_dynamic)) {
              fillWatchlaterStatus_dynamic()
            } else if (!api.web.urlMatch(gm.regex.page_dynamicMenu)) {
              fillWatchlaterStatus_main()
            }
            return
          case Enums.fillWatchlaterStatus.never:
          default:
            return
        }
      })

      /**
       * 填充动态页稍后再看状态
       */
      const fillWatchlaterStatus_dynamic = () => {
        const execute = async root => {
          let videos
          if (api.dom.containsClass(root, '.video-container')) {
            videos = [root]
          } else {
            videos = root.querySelectorAll('.video-container')
          }
          for (const video of videos) {
            if (!video._fillWatchlaterStatus) {
              try {
                // 这个 video 未必是最后加入到页面的视频卡片，有可能是作为 Vue 处理过程中的中转元素
                video._fillWatchlaterStatus = true
                const vue = video.__vue__ // 此时理应有 Vue 对象，如果没有就说明它可能是中转元素
                // 但是，即使 video 真是中转元素，也有可能出现存在 __vue__ 的情况，实在没搞懂是什么原理
                // 总之，只要有 Vue 对象，一率进行处理就不会有问题！
                if (vue) {
                  const aid = String(vue.aid)
                  const map = await _self.method.getWatchlaterDataMap()
                  if (map.has(aid)) {
                    vue.seeLaterStatus = 1
                  }
                }
              } catch (e) {
                api.logger.error(gm.error.DOM_PARSE)
                api.logger.error(e)
              }
            }
          }
        }

        execute(document.body)
        const ob = new MutationObserver(async records => {
          for (const record of records) {
            for (const addedNode of record.addedNodes) {
              if (addedNode instanceof HTMLElement) {
                execute(addedNode)
              }
            }
          }
        })
        ob.observe(document.body, {
          childList: true,
          subtree: true,
        })
      }

      /**
       * 填充稍后再看状态（通用逻辑）
       */
      const fillWatchlaterStatus_main = () => {
        const execute = async root => {
          let videos
          if (api.dom.containsClass(root, ['watch-later-video', 'watch-later-trigger'])) {
            videos = [root]
          } else {
            videos = root.querySelectorAll('.watch-later-video, .watch-later-trigger')
          }
          for (const video of videos) {
            if (!video._fillWatchlaterStatus) {
              try {
                video._fillWatchlaterStatus = true
                const vue = video.__vue__
                if (vue) {
                  const aid = String(vue.aid)
                  const map = await _self.method.getWatchlaterDataMap()
                  if (map.has(aid)) {
                    vue.added = true
                  }
                }
              } catch (e) {
                api.logger.error(gm.error.DOM_PARSE)
                api.logger.error(e)
              }
            }
          }
        }

        execute(document.body)
        const ob = new MutationObserver(async records => {
          for (const record of records) {
            for (const addedNode of record.addedNodes) {
              if (addedNode instanceof HTMLElement) {
                execute(addedNode)
              }
            }
          }
        })
        ob.observe(document.body, {
          childList: true,
          subtree: true,
        })
      }
    }

    /**
     * 正常模式播放页加入快速切换稍后再看状态的按钮
     */
    addVideoButton_Normal() {
      const _self = this
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
        const atr = document.querySelector('#arc_toolbar_report')
        const original = atr && atr.querySelector('.van-watchlater')
        if (original && original.__vue__) {
          return { atr, original }
        } else {
          return false
        }
      }

      api.wait.waitForConditionPassed({
        condition: executeCondition,
      }).then(async ({ atr, original }) => {
        const btn = document.createElement('label')
        btn.id = `${gm.id}-normal-video-btn`
        const cb = document.createElement('input')
        cb.type = 'checkbox'
        btn.appendChild(cb)
        const text = document.createElement('span')
        text.innerText = '稍后再看'
        btn.className = 'appeal-text'
        cb.onclick = function() { // 不要附加到 btn 上，否则点击时会执行两次
          processSwitch()
        }
        btn.appendChild(text)
        atr.appendChild(btn)

        const aid = await _self.method.getAid()
        bus = { ...bus, btn, cb, aid }
        initButtonStatus()
        original.parentNode.style.display = 'none'

        bus.pathname = location.pathname
        api.dom.createLocationchangeEvent()
        window.addEventListener('locationchange', async function() {
          if (location.pathname == bus.pathname) { // 并非切换视频（如切分 P）
            return
          }
          try {
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
            const removed = await _self.processAutoRemoveInNormalMode()
            if (gm.config.removeHistory && gm.config.removeHistorySavePoint == Enums.removeHistorySavePoint.anypage) {
              await _self.method.saveWatchlaterListData(true)
              reloaded = true
            }
            const status = removed ? false : await _self.method.getVideoWatchlaterStatusByAid(bus.aid, reloaded)
            btn.added = status
            cb.checked = status
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          }
        })
      }).catch(e => {
        api.logger.error(gm.error.DOM_PARSE)
        api.logger.error(e)
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
        const spRemove = gm.searchParams.get(`${gm.id}_remove_from_list`) === 'true'
        if (!alwaysAutoRemove && !spRemove) {
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
      // 不要担心由于稍后再看列表在其他地方被改动，导致当前分 P 与实际位置对不上，从而导致重定向到另一个视频上。之所以
      // 这样说，不是因为这种情况不会发生，而是因为这是 B 站自己的问题，即使不做重定向，在这种情况下也必然会打开到另一
      // 个视频上。
      // 为了彻底解决这种特殊情况，引入另一个功能“确保视频的一致性”。
      try {
        const resp = await api.web.request({
          method: 'GET',
          url: gm.url.api_queryWatchlaterList,
        })
        let part = 1
        if (api.web.urlMatch(/watchlater\/p\d+/)) {
          part = parseInt(location.href.match(/(?<=\/watchlater\/p)\d+(?=\/?)/)[0])
        } // 如果匹配不上，就是以 watchlater/ 直接结尾，等同于 watchlater/p1
        const json = JSON.parse(resp.responseText)
        const watchlaterList = json.data.list || []
        location.replace(`${gm.url.page_videoNormalMode}/${watchlaterList[part - 1].bvid}`)
      } catch (e) {
        const errorInfo = gm.error.REDIRECT
        api.logger.error(errorInfo)
        api.logger.error(e)

        alert(`【${GM_info.script.name}】\n\n${errorInfo}`)
        const result = confirm(`【${GM_info.script.name}】\n\n是否暂时关闭模式切换功能？`)
        if (result) {
          gm.config.redirect = false
          GM_setValue('redirect', gm.config.redirect)
          location.reload()
        } else {
          location.replace(gm.url.page_watchlaterList)
        }
      }
    }

    /**
     * 稍后再看模式播放页加入快速切换稍后再看状态的按钮
     */
    addVideoButton_Watchlater() {
      const _self = this
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

      api.wait.waitForConditionPassed({
        condition: executeCondition,
      }).then(async playContainer => {
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

        cb.onclick = () => processSwitch() // 不要附加到 btn 上，否则点击时会执行两次
        bus = { ...bus, btn, cb }
        bus.aid = await _self.method.getAid()
        initButtonStatus()

        // 切换视频时的处理
        bus.pathname = location.pathname
        api.dom.createLocationchangeEvent()
        window.addEventListener('locationchange', async function() {
          if (location.pathname == bus.pathname) { // 并非切换视频（如切分 P）
            return
          }
          try {
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
            const removed = await _self.processAutoRemoveInWatchlaterMode()
            if (gm.config.removeHistory && gm.config.removeHistorySavePoint == Enums.removeHistorySavePoint.anypage) {
              await _self.method.saveWatchlaterListData(true)
              reloaded = true
            }
            const status = removed ? false : await _self.method.getVideoWatchlaterStatusByAid(bus.aid, reloaded)
            btn.added = status
            cb.checked = status
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          }
        })
      }).catch(e => {
        api.logger.error(gm.error.DOM_PARSE)
        api.logger.error(e)
      })

      /**
       * 初始化按钮的稍后再看状态
       * @async
       */
      const initButtonStatus = async () => {
        const setStatus = () => {
          // 既然是稍后再看播放模式，那就默认视频在稍后再看中
          bus.btn.added = true
          bus.cb.checked = true
        }

        const alwaysAutoRemove = gm.config.autoRemove == Enums.autoRemove.always
        const spRemove = gm.searchParams.get(`${gm.id}_remove_from_list`) === 'true'
        if (!alwaysAutoRemove && !spRemove) {
          setStatus()
        } else {
          const _self = this
          let aid
          const spBvid = gm.searchParams.get(`${gm.id}_bvid`)
          if (spBvid) {
            // 如果查询参数上存在 bvid，要作进一步处理
            try {
              const info = await _self.method.getVideoInfo(spBvid)
              aid = String(info.aid)
              // 必须要等到页面上的 aid 与之完全一致才行，那样说明已经切换到正确的视频上，然后再进行处理
              await api.wait.waitForConditionPassed({ // 这里 await 是为了将异常抛出来统一处理，而不是在 catch() 中处理
                condition: async () => {
                  const currentAid = await _self.method.getAid()
                  if (aid == currentAid) {
                    return aid
                  }
                },
              })
              // 无需切换视频，那就不必读取状态了，默认不在稍后再看即可
            } catch (e) {
              api.logger.error(gm.error.NETWORK)
              api.logger.error(e)
              // 说明当前播放视频并非所寻的与 spBvid 对应的视频，则继续处理
              setStatus()
            }
          }
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
        bus.aid = await _self.method.getAid()
        if (bus.aid) {
          const success = await _self.method.switchVideoWatchlaterStatus(bus.aid, !btn.added)
          if (success) {
            btn.added = !btn.added
            cb.checked = btn.added
            api.message.create(`${note}成功`)
            return
          }
        }
        // 获取不到 aid，或网络请求失败，或请求成功但添加失败
        cb.checked = btn.added
        api.message.create(`${note}失败${!btn.added ? '，可能是因为不支持当前稿件类型（如互动视频）' : ''}`)
      }
    }

    /**
     * 处理列表页面点击视频时的行为
     */
    processOpenListVideo() {
      if (gm.config.openListVideo == Enums.openListVideo.openInNew) {
        // 如果列表页面在新标签页打开视频
        const base = document.head.appendChild(document.createElement('base'))
        base.id = 'gm-base'
        base.target = '_blank'
      }
    }

    /**
     * 对稍后再看列表页面的链接进行处理
     * @async
     */
    async processWatchlaterListLink() {
      try {
        const watchLaterList = await api.wait.waitForElementLoaded('.watch-later-list')
        let ob = new MutationObserver(async (records, observer) => {
          for (const record of records) {
            for (const addedNode of record.addedNodes) {
              if (api.dom.containsClass(addedNode, 'list-box')) {
                let watchlaterListData = null
                if (gm.config.forceConsistentVideo) {
                  watchlaterListData = await gm.data.watchlaterListData(false, false) // 此处若使用本地缓存可能会导致列表同步错位
                }
                const listBox = addedNode
                const list = listBox.firstElementChild.children
                for (let i = 0; i < list.length; i++) {
                  const links = list[i].querySelectorAll('a:not([class=user])') // 排除 .user，那是指向 UP 主的链接
                  for (const link of links) {
                    if (gm.config.forceConsistentVideo) {
                      processLink_forceConsistentVideo(link, watchlaterListData[i])
                    }
                    if (gm.config.autoRemove != Enums.autoRemove.never) {
                      processLink_autoRemove(link)
                    }
                    link._processedLink = link.href
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
                      record.target.href = record.target._processedLink
                    }
                  }
                  observer.observe(listBox.firstElementChild, obCfg) // 继续
                })
                ob.observe(listBox.firstElementChild, obCfg)
                return
              }
            }
          }
        })
        ob.observe(watchLaterList, { childList: true })
      } catch (e) {
        api.logger.error(gm.error.DOM_PARSE)
        api.logger.error()
      }

      /**
       * 根据 `forceConsistentVideo` 处理链接
       * @param {HTMLAnchorElement} link 链接元素
       * @param {GMObject_data_item0} itemData 对应项数据
       */
      const processLink_forceConsistentVideo = (link, itemData) => {
        if (gm.config.redirect) {
          link.href = `${gm.url.page_videoNormalMode}/${itemData.bvid}`
        } else {
          const url = new URL(link.href)
          url.searchParams.set(`${gm.id}_bvid`, itemData.bvid)
          link.href = url.href
        }
      }

      /**
       * 根据 `autoRemove` 处理链接
       * @param {HTMLAnchorElement} link 链接元素
       */
      const processLink_autoRemove = link => {
        if (gm.config.autoRemove == Enums.autoRemove.openFromList) {
          const url = new URL(link.href)
          url.searchParams.set(`${gm.id}_remove_from_list`, 'true')
          link.href = url.href
        }

        let base = link
        while (base.className.split(' ').indexOf('av-item') < 0) {
          base = base.parentNode
          if (!base) {
            api.logger.error(gm.error.DOM_PARSE)
            return
          }
        }
        link.addEventListener('mouseup', function(e) {
          // 不能 mousedown，隐藏之后无法触发事件
          if (e.button == 0 || e.button == 1) { // 左键或中键
            base.style.display = 'none'
          }
        })
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
        await _self.processAutoRemoveInNormalMode()
      } else if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
        // 播放页面（稍后再看模式）
        await _self.forceConsistentVideoInWatchlaterMode()
        await _self.processAutoRemoveInWatchlaterMode()
      }

      // 移除 URL 上的查询参数
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
    }

    /**
     * 对于稍后再看模式播放页，根据 URL 上的查询参数，强制切换到准确的视频上
     * @async
     * @param {boolean} [selfCall] 自调用
     */
    async forceConsistentVideoInWatchlaterMode(selfCall) {
      const _self = this
      const spBvid = gm.searchParams.get(`${gm.id}_bvid`)
      if (spBvid) {
        try {
          const playlist = await api.wait.waitForElementLoaded('.player-auxiliary-collapse-playlist')
          try {
            const targetItem = await api.wait.waitForElementLoaded({
              selector: `[data-bvid=${spBvid}]`,
              base: playlist,
              interval: 50,
              timeout: 800,
            })
            const itemImg = targetItem.querySelector('.player-auxiliary-playlist-item-img')
            const playingImg = itemImg.querySelector('.player-auxiliary-playlist-item-img-playing')
            if (getComputedStyle(playingImg).display == 'none') {
              itemImg.click()
            }
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)

            const result = confirm(`【${GM_info.script.name}】\n\n视频 ${spBvid} 不在稍后再看中，是否转到普通模式播放？`)
            if (result) {
              location.replace(`${gm.url.page_videoNormalMode}/${spBvid}`)
            }
          }
        } catch (e) {
          try {
            if (selfCall) {
              throw e
            } else {
              const rightContainer = await api.wait.waitForElementLoaded('.right-container')
              const ob = new MutationObserver((records, observer) => {
                observer.disconnect()
                _self.forceConsistentVideoInWatchlaterMode(true)
              })
              ob.observe(rightContainer, {
                childList: true,
                subtree: true,
              })
            }
          } catch (e) {
            api.logger.error(gm.error.DOM_PARSE)
            api.logger.error(e)
          }
        }
      }
    }

    /**
     * 对于正常模式播放页，根据用户配置或 URL 上的查询参数，将视频从稍后再看移除
     * @async
     * @returns {Promise<boolean>} 执行后视频是否已经不在稍后再看中（可能是在本方法内被移除，也可能是本身就不在）
     */
    async processAutoRemoveInNormalMode() {
      const alwaysAutoRemove = gm.config.autoRemove == Enums.autoRemove.always
      const spRemove = gm.searchParams.get(`${gm.id}_remove_from_list`) === 'true'
      if (alwaysAutoRemove || spRemove) {
        const _self = this
        const aid = await _self.method.getAid()
        if (alwaysAutoRemove) { // 如果总是自动移除，要检查视频是否已经在稍后再看中，确定在再移除
          const status = await _self.method.getVideoWatchlaterStatusByAid(aid) // 偏向于认为视频在其中，因此即使缓存很可能有问题也没有必要纠正
          if (!status) {
            return true
          }
        }
        const success = await _self.method.switchVideoWatchlaterStatus(aid, false)
        if (!success) {
          api.message.create('从稍后再看移除失败')
        }
        return success
      }
      return false
    }

    /**
     * 对于稍后再看模式播放页，根据用户配置或 URL 上的查询参数，将视频从稍后再看移除
     * @async
     * @returns {Promise<boolean>} 执行后视频是否已经不在稍后再看中（可能是在本方法内被移除，也可能是本身就不在）
     */
    async processAutoRemoveInWatchlaterMode() {
      const alwaysAutoRemove = gm.config.autoRemove == Enums.autoRemove.always
      const spRemove = gm.searchParams.get(`${gm.id}_remove_from_list`) === 'true'
      if (alwaysAutoRemove || spRemove) {
        const _self = this
        let aid
        const spBvid = gm.searchParams.get(`${gm.id}_bvid`)
        if (spBvid) {
          // 如果查询参数上存在 bvid，要作进一步处理
          try {
            const info = await _self.method.getVideoInfo(spBvid)
            aid = String(info.aid)
            // 必须要等到页面上的 aid 与之完全一致才行，那样说明已经切换到正确的视频上
            // 否则，先将视频移除出稍后再看，那么根本就无法在稍后再看模式中观看该视频
            await api.wait.waitForConditionPassed({
              condition: async () => {
                const currentAid = await _self.method.getAid()
                if (aid == currentAid) {
                  return aid
                }
              },
            })
          } catch (e) {
            api.logger.error(gm.error.NETWORK)
            api.logger.error(e)
            return false
          }
        }
        if (!aid) {
          aid = await _self.method.getAid()
        }

        if (alwaysAutoRemove) { // 如果总是自动移除，要检查视频是否已经在稍后再看中，确定在再移除
          // 尽管从理论上来说，稍后再看模式中的视频必然是在稍后再看中的，但由于本脚本的功能，未必如此，还是要检查一遍
          const status = await _self.method.getVideoWatchlaterStatusByAid(aid)
          if (!status) {
            return true
          }
        }
        const success = await _self.method.switchVideoWatchlaterStatus(aid, false)
        if (!success) {
          api.message.create('从稍后再看移除失败')
        }
        return success
      }
      return false
    }

    /**
     * 根据 `removeHistorySavePoint` 保存稍后再看历史数据
     */
    processWatchlaterListDataSaving() {
      const _self = this
      // 执行列表数据的保存会引起历史数据的保存
      switch (gm.config.removeHistorySavePoint) {
        case Enums.removeHistorySavePoint.list:
          if (api.web.urlMatch(gm.regex.page_watchlaterList)) {
            _self.method.saveWatchlaterListData()
          }
          break
        case Enums.removeHistorySavePoint.listAndMenu:
        default:
          if (api.web.urlMatch(gm.regex.page_watchlaterList)) {
            // 从入口打开，而设置为 listAndMenu，则数据必然刚刚刷新过
            if (gm.searchParams.get(`${gm.id}_from_header`) != 'true') {
              _self.method.saveWatchlaterListData()
            }
          }
          break
        case Enums.removeHistorySavePoint.anypage:
          if (!api.web.urlMatch(gm.regex.page_dynamicMenu)) {
            // anypage 时弹出入口菜单不会引起数据刷新，不必检测 ${gm.id}_from_header
            _self.method.saveWatchlaterListData()
          }
          break
      }
    }

    /**
     * 调整列表页面的 UI
     * @async
     */
    async adjustWatchlaterListUI() {
      const _self = this
      const r_con = await api.wait.waitForElementLoaded('.watch-later-list.bili-wrapper header .r-con')
      if (gm.config.removeHistory) {
        // 在列表页面加入“移除记录”
        const removeHistoryButton = r_con.appendChild(document.createElement('div'))
        removeHistoryButton.innerText = '移除记录'
        removeHistoryButton.className = 's-btn'
        removeHistoryButton.onclick = () => _self.script.openRemoveHistory() // 要避免 MouseEvent 的传递
      }
      // 在列表页面加如“增强设置”
      const plusButton = r_con.appendChild(document.createElement('div'))
      plusButton.innerText = '增强设置'
      plusButton.className = 's-btn'
      plusButton.onclick = () => _self.script.openUserSetting() // 要避免 MouseEvent 的传递
      // 移除【一键清空】按钮
      if (gm.config.removeButton_removeAll) {
        r_con.children[1].style.display = 'none'
      }
      // 移除【移除已观看视频】按钮
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
            :root {
              --scrollbar-background-color: transparent;
              --scrollbar-thumb-color: #0000002b;
            }

            [role=tooltip] ::-webkit-scrollbar,
            #app>.out-container>.container::-webkit-scrollbar {
              width: 6px;
              height: 6px;
              background-color: var(--scrollbar-background-color);
            }

            [role=tooltip] ::-webkit-scrollbar-thumb,
            #app>.out-container>.container::-webkit-scrollbar-thumb {
              border-radius: 3px;
              background-color: var(--scrollbar-background-color);
            }

            [role=tooltip] :hover::-webkit-scrollbar-thumb,
            #app>.out-container>.container:hover::-webkit-scrollbar-thumb {
              border-radius: 3px;
              background-color: var(--scrollbar-thumb-color);
            }

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
          --text-color: black;
          --text-bold-color: #3a3a3a;
          --light-text-color: white;
          --hint-text-color: gray;
          --hint-text-emphasis-color: #666666;
          --hint-text-hightlight-color: #555555;
          --background-color: white;
          --background-hightlight-color: #ebebeb;
          --update-hightlight-color: #c2ffc2;
          --update-hightlight-hover-color: #a90000;
          --border-color: black;
          --shadow-color: #000000bf;
          --hightlight-color: #0075FF;
          --important-color: red;
          --warn-color: #e37100;
          --disabled-color: gray;
          --link-visited-color: #551a8b;
          --scrollbar-background-color: transparent;
          --scrollbar-thumb-color: #0000002b;
          --opacity-fade-transition: opacity ${gm.const.fadeTime}ms ease-in-out;
        }

        #${gm.id} {
          color: var(--text-color);
        }

        #${gm.id} .gm-setting {
          font-size: 12px;
          line-height: normal;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          position: fixed;
          z-index: 10000;
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
          width: 2.4em;
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
          right: -1.1em;
          color: var(--warn-color);
          font-size: 1.4em;
          line-height: 1em;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          cursor: pointer;
        }

        #${gm.id} .gm-history {
          font-size: 12px;
          line-height: normal;
          transition: var(--opacity-fade-transition);
          opacity: 0;
          display: none;
          position: fixed;
          z-index: 10000;
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
        #${gm.id} .gm-history .gm-content > div:hover {
          font-weight: bold;
          color: var(--text-bold-color);
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
        #${gm.id} select,
        #${gm.id} button {
          color: var(--text-color);
          outline: none;
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
     * 将推入队列以数组的形式返回
     * @param {number} [maxLength=size] 读取的最大长度
     * @returns {Array<T>} 队列数据的数组形式
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

  (function() {
    const script = new Script()
    const webpage = new Webpage()

    script.initAtDocumentStart()
    if (api.web.urlMatch(gm.regex.page_videoWatchlaterMode)) {
      if (gm.config.redirect) { // 重定向，document-start 就执行，尽可能快地将原页面掩盖过去
        webpage.redirect()
        return // 必须 return，否则后面的内容还会执行使得加载速度超级慢
      }
    }

    // 脚本的其他部分推迟至 DOMContentLoaded 执行
    document.addEventListener('DOMContentLoaded', function() {
      script.init()
      script.addScriptMenu()

      // 非特殊页面
      if (!api.web.urlMatch(gm.regex.page_dynamicMenu)) {
        if (gm.config.headerButton) {
          webpage.addHeaderButton()
        }
        if (gm.config.fillWatchlaterStatus != Enums.fillWatchlaterStatus.never) {
          webpage.fillWatchlaterStatus()
        }
        if (gm.config.removeHistory) {
          webpage.processWatchlaterListDataSaving()
        }
      }

      if (api.web.urlMatch(gm.regex.page_watchlaterList)) {
        // 列表页面
        webpage.processOpenListVideo()
        webpage.adjustWatchlaterListUI()
        if (gm.config.forceConsistentVideo || gm.config.autoRemove != Enums.autoRemove.never) {
          webpage.processWatchlaterListLink()
        }
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
