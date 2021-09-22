// ==UserScript==
// @name            B站防剧透进度条
// @version         2.4.2.20210922
// @namespace       laster2800
// @author          Laster2800
// @description     看比赛、看番总是被进度条剧透？装上这个脚本再也不用担心这些问题了
// @icon            https://www.bilibili.com/favicon.ico
// @homepageURL     https://greasyfork.org/zh-CN/scripts/411092
// @supportURL      https://greasyfork.org/zh-CN/scripts/411092/feedback
// @license         LGPL-3.0
// @noframes
// @include         *://www.bilibili.com/video/*
// @include         *://www.bilibili.com/medialist/play/watchlater
// @include         *://www.bilibili.com/medialist/play/watchlater/*
// @include         *://www.bilibili.com/bangumi/play/*
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=972855
// @require         https://greasyfork.org/scripts/431998-userscriptapidom/code/UserscriptAPIDom.js?version=972856
// @require         https://greasyfork.org/scripts/432000-userscriptapimessage/code/UserscriptAPIMessage.js?version=971987
// @require         https://greasyfork.org/scripts/432002-userscriptapiwait/code/UserscriptAPIWait.js?version=971988
// @require         https://greasyfork.org/scripts/432003-userscriptapiweb/code/UserscriptAPIWeb.js?version=969305
// @require         https://greasyfork.org/scripts/432807-inputnumber/code/InputNumber.js?version=972863
// @grant           GM_registerMenuCommand
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           unsafeWindow
// @grant           window.onurlchange
// @connect         api.bilibili.com
// @compatible      edge 版本不小于 85
// @compatible      chrome 版本不小于 85
// @compatible      firefox 版本不小于 90
// ==/UserScript==

(function() {
  'use strict'

  if (GM_info.scriptHandler != 'Tampermonkey') {
    const script = GM_info.script
    script.author ??= 'Laster2800'
    script.homepage ??= 'https://greasyfork.org/zh-CN/scripts/411092'
    script.supportURL ??= 'https://greasyfork.org/zh-CN/scripts/411092/feedback'
  }

  /**
   * 脚本内用到的枚举定义
   */
  const Enums = {}

  /**
   * 全局对象
   * @typedef GMObject
   * @property {string} id 脚本标识
   * @property {number} configVersion 配置版本，为最后一次执行初始化设置或功能性更新设置时脚本对应的配置版本号
   * @property {number} configUpdate 当前版本对应的配置版本号，只要涉及到配置的修改都要更新；若同一天修改多次，可以追加小数来区分
   * @property {GMObject_config} config 用户配置
   * @property {GMObject_configMap} configMap 用户配置属性
   * @property {GMObject_infoMap} infoMap 信息属性
   * @property {GMObject_data} data 脚本数据
   * @property {GMObject_url} url URL
   * @property {GMObject_regex} regex 正则表达式
   * @property {{[c: string]: *}} const 常量
   * @property {GMObject_menu} menu 菜单
   * @property {{[s: string]: HTMLElement}} el HTML 元素
   */
  /**
   * @typedef GMObject_config
   * @property {boolean} bangumiEnabled 番剧自动启用功能
   * @property {boolean} simpleScriptControl 是否简化进度条上方的脚本控制
   * @property {boolean} disableCurrentPoint 隐藏当前播放时间
   * @property {boolean} disableDuration 隐藏视频时长
   * @property {boolean} disablePreview 隐藏进度条预览
   * @property {boolean} disablePartInformation 隐藏分P信息
   * @property {boolean} disableSegmentInformation 隐藏分段信息
   * @property {number} offsetTransformFactor 进度条极端偏移因子
   * @property {number} offsetLeft 进度条偏移极左值
   * @property {number} offsetRight 进度条偏移极右值
   * @property {number} reservedLeft 进度条左侧预留区
   * @property {number} reservedRight 进度条右侧预留区
   * @property {boolean} postponeOffset 延后进度条偏移的时间点
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
   * @callback uploaderList 不传入/传入参数时获取/修改防剧透UP主名单
   * @param {string} [updateData] 更新数据
   * @returns {string} 防剧透UP主名单
   */
  /**
   * @callback uploaderListSet 通过懒加载方式获取格式化的防剧透UP主名单
   * @param {boolean} [reload] 是否重新加载数据
   * @returns {Set<String>} 防剧透UP主名单
   */
  /**
   * @typedef GMObject_data
   * @property {uploaderList} uploaderList 防剧透UP主名单
   * @property {uploaderListSet} uploaderListSet 防剧透UP主名单集合
   */
  /**
   * @callback api_videoInfo
   * @param {string} id `aid` 或 `bvid`
   * @param {'aid' | 'bvid'} type `id` 类型
   * @returns {string} 查询视频信息的 URL
   */
  /**
   * @typedef GMObject_url
   * @property {api_videoInfo} api_videoInfo 视频信息
   * @property {string} gm_readme 说明文档
   * @property {string} gm_changelog 更新日志
   * @property {string} noop 无操作
   */
  /**
   * @typedef GMObject_regex
   * @property {RegExp} page_videoNormalMode 匹配正常模式播放页
   * @property {RegExp} page_videoWatchlaterMode 匹配稍后再看模式播放页
   * @property {RegExp} page_bangumi 匹配番剧播放页
   */
  /**
   * @typedef GMObject_menu
   * @property {GMObject_menu_item} setting 设置
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
    id: 'gm411092',
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210806,
    config: {},
    configMap: {
      bangumiEnabled: { default: false, attr: 'checked', needNotReload: true },
      simpleScriptControl: { default: false, attr: 'checked' },
      disableCurrentPoint: { default: true, attr: 'checked', configVersion: 20200912 },
      disableDuration: { default: true, attr: 'checked' },
      disablePreview: { default: false, attr: 'checked' },
      disablePartInformation: { default: true, attr: 'checked', configVersion: 20210302 },
      disableSegmentInformation: { default: true, attr: 'checked', configVersion: 20210806 },
      offsetTransformFactor: { default: 0.65, type: 'float', attr: 'value', needNotReload: true, max: 5.0, configVersion: 20210722 },
      offsetLeft: { default: 40, type: 'int', attr: 'value', needNotReload: true, configVersion: 20210722 },
      offsetRight: { default: 40, type: 'int', attr: 'value', needNotReload: true, configVersion: 20210722 },
      reservedLeft: { default: 10, type: 'int', attr: 'value', needNotReload: true, configVersion: 20210722 },
      reservedRight: { default: 10, type: 'int', attr: 'value', needNotReload: true, configVersion: 20210722 },
      postponeOffset: { default: true, attr: 'checked', needNotReload: true, configVersion: 20200911 },
      reloadAfterSetting: { default: true, attr: 'checked', needNotReload: true },
    },
    infoMap: {
      help: {},
      uploaderList: {},
      resetParam: {},
    },
    data: {
      uploaderList: null,
      uploaderListSet: null,
    },
    url: {
      api_videoInfo: (id, type) => `https://api.bilibili.com/x/web-interface/view?${type}=${id}`,
      gm_readme: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliNoSpoilProgressBar/README.md',
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliNoSpoilProgressBar/changelog.md',
      noop: 'javascript:void(0)',
    },
    regex: {
      page_videoNormalMode: /\.com\/video([#/?]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater([#/?]|$)/,
      page_bangumi: /\.com\/bangumi\/play([#/?]|$)/,
    },
    const: {
      fadeTime: 400,
    },
    menu: {
      setting: { state: 0, wait: 0, el: null },
    },
    el: {
      gmRoot: null,
      setting: null,
    },
  }

  /* global UserscriptAPI */
  const api = new UserscriptAPI({
    id: gm.id,
    label: GM_info.script.name,
    fadeTime: gm.const.fadeTime,
    wait: { element: { timeout: 15000 } },
  })

  /** @type {Script} */
  let script = null
  /** @type {Webpage} */
  let webpage = null

  /**
   * 脚本运行的抽象，为脚本本身服务的核心功能
   */
  class Script {
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
     * 初始化
     */
    init() {
      const _self = this
      try {
        _self.initGMObject()
        _self.updateVersion()
        _self.readConfig()
      } catch (e) {
        api.logger.error(e)
        api.message.confirm('初始化错误！是否彻底清空内部数据以重置脚本？').then(result => {
          if (result) {
            _self.method.reset()
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
        uploaderList: updateData => {
          if (typeof updateData == 'string') {
            // 注意多行模式「\n」位置为「line$\n^line」，且「\n」是空白符，被视为在下一行「行首」
            updateData = updateData.replace(/\s+$/gm, '') // 除空行及行尾空白符（有效的换行符被「^」隔断而得以保留），除下面的特殊情况
              .replace(/^\n/, '') // 移除为作为「\s*$」且有后续的首行的换行符，此时该换行符被视为在第二行「行首」
            GM_setValue('uploaderList', updateData)
            this.#data.uploaderListSet = undefined
            return updateData
          } else {
            let uploaderList = GM_getValue('uploaderList')
            if (typeof uploaderList != 'string') {
              uploaderList = ''
              GM_setValue('uploaderList', uploaderList)
            }
            return uploaderList
          }
        },
        uploaderListSet: reload => {
          const $data = this.#data
          if (!$data.uploaderListSet || reload) {
            const set = new Set()
            const content = gm.data.uploaderList()
            if (content.startsWith('*')) {
              set.add('*')
            } else {
              const rows = content.split('\n')
              for (const row of rows) {
                const m = /^\d+/.exec(row)
                if (m) {
                  set.add(m[0])
                }
              }
            }
            $data.uploaderListSet = set
          }
          return $data.uploaderListSet
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
      if (gm.configVersion >= 20210627) { // 1.5.5.20210627
        if (gm.configVersion < gm.configUpdate) {
          // 必须按从旧到新的顺序写
          // 内部不能使用 gm.configUpdate，必须手写更新后的配置版本号！

          // 2.0.0.20210806
          if (gm.configVersion < 20210806) {
            GM_deleteValue('disablePbp')
          }

          // 功能性更新后更新此处配置版本，通过时跳过功能性更新设置，否则转至 readConfig() 中处理
          if (gm.configVersion >= 20210806) {
            gm.configVersion = gm.configUpdate
            GM_setValue('configVersion', gm.configVersion)
          }
        }
      } else {
        _self.method.reset()
        gm.configVersion = null
      }
    }

    /**
     * 用户配置读取
     */
    readConfig() {
      const _self = this
      if (gm.configVersion > 0) {
        // 对配置进行校验
        for (const name in gm.configMap) {
          gm.config[name] = _self.method.getConfig(name, gm.configMap[name].default)
        }
        if (gm.configVersion != gm.configUpdate) {
          _self.openUserSetting(2)
        }
      } else {
        // 用户强制初始化，或第一次安装脚本，或版本过旧
        gm.configVersion = 0
        for (const name in gm.configMap) {
          gm.config[name] = gm.configMap[name].default
          GM_setValue(name, gm.configMap[name].default)
        }
        _self.openUserSetting(1)

        setTimeout(async () => {
          const result = await api.message.confirm('脚本有一定使用门槛，如果不理解防剧透机制效果将会剧减，这种情况下用户甚至完全不明白脚本在「干什么」，建议在阅读说明后使用。是否立即打开防剧透机制说明？')
          if (result) {
            window.open(`${gm.url.gm_readme}#防剧透机制说明`)
          }
        }, 2000)
      }
    }

    /**
     * 添加脚本菜单
     */
    addScriptMenu() {
      const _self = this
      // 用户配置设置
      GM_registerMenuCommand('用户设置', () => _self.openUserSetting())
      // 防剧透UP主名单
      GM_registerMenuCommand('防剧透UP主名单', () => _self.openUploaderList())
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

          const getItemHTML = (label, ...items) => {
            let html = `<div class="gm-item-container"><div class="gm-item-label">${label}</div><div class="gm-item-content">`
            for (const item of items) {
              html += `<div class="${item.className ? `${item.className}` : 'gm-item'}"${item.desc ? ` title="${item.desc}"` : ''}>${item.html}</div>`
            }
            html += '</div></div>'
            return html
          }
          let itemsHTML = ''
          itemsHTML += getItemHTML('说明', {
            desc: '查看脚本防剧透机制的实现原理。',
            html: `<div>
              <span>防剧透机制说明</span>
              <a id="gm-help" class="gm-info" href="${gm.url.gm_readme}#防剧透机制说明" target="_blank"">查看</a>
            </div>`,
          })
          itemsHTML += getItemHTML('自动化', {
            desc: '加入防剧透名单UP主的视频，会在打开视自动开启防剧透进度条。',
            html: `<div>
              <span>防剧透UP主名单</span>
              <span id="gm-uploaderList" class="gm-info">编辑</span>
            </div>`,
          })
          itemsHTML += getItemHTML('自动化', {
            desc: '番剧是否自动打开防剧透进度条？',
            html: `<label>
              <span>番剧自动启用防剧透进度条</span>
              <input id="gm-bangumiEnabled" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('用户接口', {
            desc: '是否简化进度条上方的脚本控制？',
            html: `<label>
              <span>简化进度条上方的脚本控制</span>
              <input id="gm-simpleScriptControl" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('用户接口', {
            desc: '这些功能可能会造成剧透，根据需要在防剧透进度条中进行隐藏。',
            html: `<div>
              <span>启用功能时</span>
            </div>`,
          }, {
            desc: '是否在防剧透进度条中隐藏当前播放时间？该功能可能会造成剧透。',
            html: `<label>
              <span>隐藏当前播放时间</span>
              <input id="gm-disableCurrentPoint" type="checkbox">
            </label>`,
          }, {
            desc: '是否在防剧透进度条中隐藏视频时长？该功能可能会造成剧透。',
            html: `<label>
              <span>隐藏视频时长</span>
              <input id="gm-disableDuration" type="checkbox">
            </label>`,
          }, {
            desc: '是否在防剧透进度条中隐藏进度条预览？该功能可能会造成剧透。',
            html: `<label>
              <span>隐藏进度条预览</span>
              <input id="gm-disablePreview" type="checkbox">
            </label>`,
          }, {
            desc: '是否隐藏视频分P信息？它们可能会造成剧透。该功能对番剧无效。',
            html: `<label>
              <span>隐藏分P信息</span>
              <input id="gm-disablePartInformation" type="checkbox">
            </label>`,
          }, {
            desc: '是否隐藏视频分段信息？它们可能会造成剧透。',
            html: `<label>
              <span>隐藏分段信息</span>
              <input id="gm-disableSegmentInformation" type="checkbox">
            </label>`,
          })
          itemsHTML += getItemHTML('高级设置', {
            desc: '防剧透参数设置，请务必在理解参数作用的前提下修改！',
            html: `<div>
              <span>防剧透参数</span>
              <span id="gm-resetParam" class="gm-info" title="重置防剧透参数。">重置</span>
            </div>`,
          }, {
            desc: '进度条极端偏移因子设置。',
            html: `<div>
              <span>进度条极端偏移因子</span>
              <span id="gm-offsetTransformFactorInformation" class="gm-information" title="">💬</span>
              <input is="laster2800-input-number" id="gm-offsetTransformFactor" value="${gm.configMap.offsetTransformFactor.default}" max="${gm.configMap.offsetTransformFactor.max}" digits="1">
            </div>`,
          }, {
            desc: '进度条偏移极左值设置。',
            html: `<div>
              <span>进度条偏移极左值</span>
              <span id="gm-offsetLeftInformation" class="gm-information" title="">💬</span>
              <input is="laster2800-input-number" id="gm-offsetLeft" value="${gm.configMap.offsetLeft.default}" max="100">
            </div>`,
          }, {
            desc: '进度条偏移极右值设置。',
            html: `<div>
              <span>进度条偏移极右值</span>
              <span id="gm-offsetRightInformation" class="gm-information" title="">💬</span>
              <input is="laster2800-input-number" id="gm-offsetRight" value="${gm.configMap.offsetRight.default}" max="100">
            </div>`,
          }, {
            desc: '进度条左侧预留区设置。',
            html: `<div>
              <span>进度条左侧预留区</span>
              <span id="gm-reservedLeftInformation" class="gm-information" title="">💬</span>
              <input is="laster2800-input-number" id="gm-reservedLeft" value="${gm.configMap.reservedLeft.default}" max="100">
            </div>`,
          }, {
            desc: '进度条右侧预留区设置。',
            html: `<div>
              <span>进度条右侧预留区</span>
              <span id="gm-reservedRightInformation" class="gm-information" title="">💬</span>
              <input is="laster2800-input-number" id="gm-reservedRight" value="${gm.configMap.reservedRight.default}" max="100">
            </div>`,
          }, {
            desc: '是否延后进度条偏移的时间点，使得在启用功能或改变播放进度后立即进行进度条偏移？',
            html: `<label>
              <span>延后进度条偏移的时间点</span>
              <span id="gm-postponeOffsetInformation" class="gm-information" title="">💬</span>
              <input id="gm-postponeOffset" type="checkbox">
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
              <div class="gm-reset" title="重置脚本设置及内部数据（防剧透UP主名单除外），也许能解决脚本运行错误的问题。无法解决请联系脚本作者：${GM_info.script.supportURL}">初始化脚本</div>
              <a class="gm-changelog" title="显示更新日志" href="${gm.url.gm_changelog}" target="_blank">更新日志</a>
            </div>
            <div class="gm-shadow"></div>
          `

          // 找出配置对应的元素
          for (const name in { ...gm.configMap, ...gm.infoMap }) {
            el[name] = gm.el.setting.querySelector(`#gm-${name}`)
          }

          el.settingPage = gm.el.setting.querySelector('.gm-setting-page')
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
                    if (map[name].configVersion > gm.configVersion) {
                      const item = api.dom.findAncestor(el[name], el => el.classList.contains('gm-item'))
                      item?.classList.add('gm-updated')
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
          el.offsetTransformFactorInformation = gm.el.setting.querySelector('#gm-offsetTransformFactorInformation')
          api.message.hoverInfo(el.offsetTransformFactorInformation, `
            <style>
              .${gm.id}-infobox ul > li {
                list-style: disc;
                margin-left: 1em;
              }
            </style>
            <div style="line-height:1.6em">
              <div>进度条极端偏移因子（范围：0.00 ~ 5.00），用于控制进度条偏移量的概率分布。更多信息请阅读说明文档。</div>
              <ul>
                <li>因子的值越小，则出现极限偏移的概率越高。最小可取值为 <b>0</b>，此时偏移值必定为极左值或极右值。</li>
                <li>因子的值越大，则出现极限偏移的概率越低，偏移值趋向于 0。无理论上限，但实际取值达到 3 效果就已经非常明显，限制最大值为 5。</li>
                <li>因子取值为 <b>1</b> 时，偏移量的概率会在整个区间平滑分布。</li>
              </ul>
            </div>
          `, null, { width: '36em', flagSize: '2em', position: { top: '80%' } })
          el.offsetLeftInformation = gm.el.setting.querySelector('#gm-offsetLeftInformation')
          api.message.hoverInfo(el.offsetLeftInformation, `
            <div style="line-height:1.6em">
              极限情况下进度条向左偏移的距离（百分比），该选项用于解决进度条后向剧透问题。设置为 <b>0</b> 可以禁止进度条左偏。更多信息请阅读说明文档。
            </div>
          `, null, { width: '36em', flagSize: '2em' })
          el.offsetRightInformation = gm.el.setting.querySelector('#gm-offsetRightInformation')
          api.message.hoverInfo(el.offsetRightInformation, `
            <div style="line-height:1.6em">
              极限情况下进度条向右偏移的距离（百分比），该选项用于解决进度条前向剧透问题。设置为 <b>0</b> 可以禁止进度条右偏。更多信息请阅读说明文档。
            </div>
          `, null, { width: '36em', flagSize: '2em' })
          el.reservedLeftInformation = gm.el.setting.querySelector('#gm-reservedLeftInformation')
          api.message.hoverInfo(el.reservedLeftInformation, `
            <div style="line-height:1.6em">
              进度条左侧预留区间大小（百分比）。若进度条向左偏移后导致滑块进入区间，则调整偏移量使得滑块位于区间最右侧（特别地，若播放进度比偏移量小则不偏移）。该选项是为了保证在任何情况下都能通过点击滑块左侧区域向前调整进度。更多信息请阅读说明文档。
            </div>
          `, null, { width: '36em', flagSize: '2em' })
          el.reservedRightInformation = gm.el.setting.querySelector('#gm-reservedRightInformation')
          api.message.hoverInfo(el.reservedRightInformation, `
            <div style="line-height:1.6em">
              进度条右侧预留区间大小（百分比）。若进度条向右偏移后导致滑块进入区间，则调整偏移量使得滑块位于区间最左侧。该选项是为了保证在任何情况下都能通过点击滑块右侧区域向后调整进度。更多信息请阅读说明文档。
            </div>
          `, null, { width: '36em', flagSize: '2em' })
          el.postponeOffsetInformation = gm.el.setting.querySelector('#gm-postponeOffsetInformation')
          api.message.hoverInfo(el.postponeOffsetInformation, `
            <div style="line-height:1.6em">
              在启用功能或改变播放进度后，不要立即对进度条进行偏移，而是在下次进度条显示出来时偏移。这样可以避免用户观察到处理过程，从而防止用户推测出偏移方向与偏移量。更多信息请阅读说明文档。
            </div>
          `, null, { width: '36em', flagSize: '2em' })
        }

        /**
         * 处理与设置页相关的数据和元素
         */
        const processSettingItem = () => {
          gm.menu.setting.openHandler = onOpen
          gm.el.setting.fadeInDisplay = 'flex'
          el.save.addEventListener('click', onSave)
          el.cancel.addEventListener('click', () => _self.closeMenuItem('setting'))
          el.shadow.addEventListener('click', function() {
            if (!this.hasAttribute('disabled')) {
              _self.closeMenuItem('setting')
            }
          })
          el.reset.addEventListener('click', () => _self.resetScript())
          el.resetParam.addEventListener('click', function() {
            el.offsetTransformFactor.value = gm.configMap.offsetTransformFactor.default
            el.offsetLeft.value = gm.configMap.offsetLeft.default
            el.offsetRight.value = gm.configMap.offsetRight.default
            el.reservedLeft.value = gm.configMap.reservedLeft.default
            el.reservedRight.value = gm.configMap.reservedRight.default
            el.postponeOffset.checked = gm.configMap.postponeOffset.default
          })
          el.uploaderList.addEventListener('click', () => _self.openUploaderList())
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
                needReload ||= change
              }
            }
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
      }
    }

    /**
     * 打开防剧透UP主名单
     */
    openUploaderList() {
      const dialog = api.message.dialog(`
        <div style="color:var(--${gm.id}-hint-text-color);font-size:0.8em;text-indent:2em;line-height:1.6em">
          当打开名单内UP主的视频时，会自动启用防剧透进度条。在下方文本框内填入UP主的 UID，其中 UID 可在UP主的个人空间中找到。每行必须以 UID 开头，UID 后可以用空格隔开进行注释。<b>第一行以&nbsp;&nbsp;*&nbsp;&nbsp;开头</b>时，匹配所有UP主。<span id="gm-uploader-list-example" class="gm-info">点击填充示例。</span>
        </div>
      `, {
        html: true,
        title: '防剧透UP主名单',
        boxInput: true,
        buttons: ['保存', '取消'],
        width: '28em',
      })
      const list = dialog.interactives[0]
      const save = dialog.interactives[1]
      const cancel = dialog.interactives[2]
      const example = dialog.querySelector('#gm-uploader-list-example')

      list.style.height = '15em'
      list.value = gm.data.uploaderList()
      save.addEventListener('click', function() {
        gm.data.uploaderList(list.value)
        api.message.info('防剧透UP主名单保存成功')
        dialog.close()
      })
      cancel.addEventListener('click', function() {
        dialog.close()
      })
      example.addEventListener('click', () => {
        list.value = '# 非 UID 起始的行不会影响名单读取\n204335848 # 皇室战争电竞频道\n50329118 # 哔哩哔哩英雄联盟赛事'
      })
      dialog.open()
    }

    /**
     * 初始化脚本
     */
    async resetScript() {
      const result = await api.message.confirm('是否要初始化脚本？本操作不会重置「防剧透UP主名单」。')
      if (result) {
        const keyNoReset = { uploaderList: true }
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
    /**
     * 播放控制
     * @type {HTMLElement}
     */
    control = null
    /**
     * 播放控制面板
     * @type {HTMLElement}
     */
    controlPanel = null
    /**
     * 进度条
     * @typedef ProgressBar
     * @property {HTMLElement} root 进度条根元素
     * @property {HTMLElement} thumb 进度条滑块
     * @property {HTMLElement} preview 进度条预览
     * @property {HTMLElement[]} dispEl 进度条中应该被隐藏的可视部分
     */
    /**
     * 进度条
     * @type {ProgressBar}
     */
    progress = {}
    /**
     * 伪进度条
     * @typedef FakeProgressBar
     * @property {HTMLElement} root 伪进度条根元素
     * @property {HTMLElement} track 伪进度条滑槽
     * @property {HTMLElement} played 伪进度条已播放部分
     */
    /**
     * 伪进度条
     * @type {FakeProgressBar}
     */
    fakeProgress = {}

    /**
     * 脚本控制条
     * @type {HTMLElement}
     */
    scriptControl = null

    /**
     * 是否开启防剧透功能
     * @type {boolean}
     */
    enabled = false
    /**
     * 当前UP主是否在防剧透名单中
     */
    uploaderEnabled = false

    /** 通用方法 */
    method = {
      obj: this,

      /**
       * 判断播放器是否为 V3
       * @returns {boolean} 播放器是否为 V3
       */
      isV3Player() {
        return !!document.querySelector('.bpx-player-video-area')
      },

      /**
       * 判断播放器是否启用分段进度条
       * @returns {boolean} 播放器是否启用分段进度条
       */
      isSegmentedProgress() {
        return !!document.querySelector('.bilibili-player-video-btn-viewpointlist')
      },

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
       * 获取视频信息
       * @param {string} id `aid` 或 `bvid`
       * @param {'aid' | 'bvid'} [type='bvid'] `id` 类型
       * @returns {Promise<JSON>} 视频信息
       */
      async getVideoInfo(id, type = 'bvid') {
        const resp = await api.web.request({
          url: gm.url.api_videoInfo(id, type),
        }, { check: r => r.code === 0 })
        return resp.data
      },

      /**
       * 获取当前播放时间
       * @returns {number} 当前播放时间（单位：秒）
       */
      getCurrentTime() {
        const el = this.obj.control.querySelector('.bilibili-player-video-time-now, .squirtle-video-time-now')
        return this.getTimeFromElement(el)
      },

      /**
       * 获取视频时长
       * @returns {number} 视频时长（单位：秒）
       */
      getDuration() {
        const el = this.obj.control.querySelector('.bilibili-player-video-time-total, .squirtle-video-time-total')
        return this.getTimeFromElement(el)
      },

      /**
       * 从元素中提取时间
       * @param {HTMLElement} el 元素
       * @returns {number} 时间（单位：秒）
       */
      getTimeFromElement(el) {
        let result = 0
        const factors = [24 * 3600, 3600, 60, 1]
        const parts = el.textContent.split(':')
        while (parts.length > 0) {
          result += parts.pop() * factors.pop()
        }
        return result
      },
    }

    /**
     * 初始化页面内容
     */
    async initWebpage() {
      const _self = this
      const selector = {
        control: '.bilibili-player-video-control, .squirtle-controller',
        controlPanel: '.bilibili-player-video-control-bottom, .squirtle-controller-wrap',
        progressRoot: '.bilibili-player-video-progress, .squirtle-progress-wrap',
      }
      _self.control = await api.wait.$(selector.control)
      _self.controlPanel = await api.wait.$(selector.controlPanel, _self.control)
      _self.progress.root = await api.wait.$(selector.progressRoot, _self.control)
      _self.initScriptControl()
    }

    /**
     * 初始化进度条
     */
    async initProgress() {
      const _self = this
      const segmented = _self.method.isSegmentedProgress() // 目前还没出现 V3 的分段进度条
      const selector = {
        thumb: segmented
          ? '.bilibili-player-video-segmentation-progress-slider .bui-thumb'
          : '.bui-thumb, .squirtle-progress-dot',
        preview: '.bilibili-player-video-progress-detail, .squirtle-progress-detail',
      }
      if (_self.method.isV3Player()) {
        selector.dispEl = [
          '.squirtle-progress-totalline', // 进度条背景
          '.squirtle-progress-timeline', // 已播放条
          '.squirtle-progress-buffer', // 缓冲条
        ]
      } else {
        if (segmented) {
          selector.dispEl = [
            '/* <select-all> */.bilibili-player-video-segmentation-progress-slider .bui-bar-wrap.bui-segmented', // 各分段可视部分
            '.bilibili-player-video-progress-shadow.segmented', // 影子进度条
          ]
        } else {
          selector.dispEl = [
            '.bui-bar-wrap', // 进度条可视部分
            '.bilibili-player-video-progress-shadow', // 影子进度条
          ]
        }
      }

      _self.progress.thumb = await api.wait.$(selector.thumb, _self.control)
      _self.progress.preview = await api.wait.$(selector.preview, _self.control)
      _self.progress.dispEl = []
      for (const elSelector of selector.dispEl) {
        if (elSelector.includes('<select-all>')) {
          await api.wait.$(elSelector, _self.control)
          _self.control.querySelectorAll(elSelector).forEach(el => _self.progress.dispEl.push(el))
        } else {
          _self.progress.dispEl.push(await api.wait.$(elSelector, _self.control))
        }
      }

      if (!_self.control.contains(_self.fakeProgress.root)) {
        _self.fakeProgress.root = _self.progress.root.insertAdjacentElement('beforebegin', document.createElement('div'))
        _self.fakeProgress.root.id = `${gm.id}-fake-progress`
        if (_self.method.isV3Player()) {
          _self.fakeProgress.root.className = 'gm-v3'
        }
        _self.fakeProgress.root.innerHTML = `
            <div class='fake-track'></div>
            <div class='fake-played'></div>
          `
        _self.fakeProgress.track = _self.fakeProgress.root.children[0]
        _self.fakeProgress.played = _self.fakeProgress.root.children[1]
      }

      if (!_self.progress.thumb._replaceDetect) {
        // 有些播放页面，自动跳转到上次播放进度时，thumb 被会被替换成新的
        // 似乎最多只会变一次，暂时就只处理一次
        api.wait.executeAfterElementLoaded({
          selector: selector.thumb,
          base: _self.progress.root,
          exclude: [_self.progress.thumb],
          onTimeout: null,
          callback: thumb => {
            _self.progress.thumb = thumb
          },
        })
        _self.progress.thumb._replaceDetect = true
      }
    }

    /**
     * 判断当前页面时是否自动启用功能
     * @returns {Promise<boolean>} 当前页面时是否自动启用功能
     */
    async detectEnabled() {
      const _self = this
      if (api.base.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode])) {
        try {
          const ulSet = gm.data.uploaderListSet()
          if (ulSet.has('*')) {
            return true
          }
          const vid = await _self.method.getVid()
          const videoInfo = await _self.method.getVideoInfo(vid.id, vid.type)
          const uid = String(videoInfo.owner.mid)
          if (ulSet.has(uid)) {
            _self.uploaderEnabled = true
            return true
          }
        } catch (e) {
          api.logger.error(e)
        }
      } else if (api.base.urlMatch(gm.regex.page_bangumi) && gm.config.bangumiEnabled) {
        return true
      }
      return false
    }

    /**
     * 隐藏必要元素（相关设置修改后需刷新页面）
     */
    hideElementStatic() {
      const _self = this
      // 隐藏进度条预览
      if (_self.enabled) {
        _self.progress.preview.style.visibility = gm.config.disablePreview ? 'hidden' : 'visible'
      } else {
        _self.progress.preview.style.visibility = 'visible'
      }

      // 隐藏当前播放时间
      api.wait.$('.bilibili-player-video-time-now:not(.fake), .squirtle-video-time-now:not(.fake)').then(currentPoint => {
        if (_self.enabled && gm.config.disableCurrentPoint) {
          if (!currentPoint._fake) {
            currentPoint._fake = currentPoint.insertAdjacentElement('afterend', currentPoint.cloneNode(true))
            currentPoint._fake.textContent = '???'
            currentPoint._fake.classList.add('fake')
          }
          currentPoint.style.display = 'none'
          currentPoint._fake.style.display = 'unset'
        } else {
          currentPoint.style.display = 'unset'
          if (currentPoint._fake) {
            currentPoint._fake.style.display = 'none'
          }
        }
      })
      // 隐藏视频预览上的当前播放时间（鼠标移至进度条上显示）
      api.wait.$('.bilibili-player-video-progress-detail-time, .squirtle-progress-time').then(currentPoint => {
        if (_self.enabled && gm.config.disableCurrentPoint) {
          currentPoint.style.visibility = 'hidden'
        } else {
          currentPoint.style.visibility = 'visible'
        }
      })

      // 隐藏视频时长
      api.wait.$('.bilibili-player-video-time-total:not(.fake), .squirtle-video-time-total:not(.fake)').then(duration => {
        if (_self.enabled && gm.config.disableDuration) {
          if (!duration._fake) {
            duration._fake = duration.insertAdjacentElement('afterend', duration.cloneNode(true))
            duration._fake.textContent = '???'
            duration._fake.classList.add('fake')
          }
          duration.style.display = 'none'
          duration._fake.style.display = 'unset'
        } else {
          duration.style.display = 'unset'
          if (duration._fake) {
            duration._fake.style.display = 'none'
          }
        }
      })
      // 隐藏进度条自动跳转提示（可能存在）
      api.wait.$('.bilibili-player-video-toast-wrp, .bpx-player-toast-wrap', document, true).then(tip => {
        if (_self.enabled) {
          tip.style.display = 'none'
        } else {
          tip.style.display = 'unset'
        }
      }).catch(() => {})

      // 隐藏高能进度条的「热度」曲线（可能存在）
      api.wait.$('#bilibili_pbp', _self.control, true).then(pbp => {
        pbp.style.visibility = _self.enabled ? 'hidden' : ''
      }).catch(() => {})

      // 隐藏 pakku 扩展引入的弹幕密度显示（可能存在）
      api.wait.$('.pakku-fluctlight', _self.control, true).then(pakku => {
        pakku.style.visibility = _self.enabled ? 'hidden' : ''
      }).catch(() => {})

      // 隐藏分P信息（番剧没有必要隐藏）
      if (gm.config.disablePartInformation && !api.base.urlMatch(gm.regex.page_bangumi)) {
        // 全屏播放时的分P选择（即使没有分P也存在）
        if (_self.enabled) {
          api.wait.$('.bilibili-player-video-btn-menu').then(menu => {
            menu.querySelectorAll('.bilibili-player-video-btn-menu-list').forEach((item, idx) => {
              item.textContent = `P${idx + 1}`
            })
          })
        }
        // 全屏播放时显示的分P标题
        api.wait.$('.bilibili-player-video-top-title').then(el => {
          el.style.visibility = _self.enabled ? 'hidden' : 'visible'
        })
        // 播放页右侧分P选择（可能存在）
        if (api.base.urlMatch(gm.regex.page_videoNormalMode)) {
          api.wait.$('#multi_page', document, true).then(multiPage => {
            multiPage.querySelectorAll('.clickitem .part, .clickitem .duration').forEach(el => {
              el.style.visibility = _self.enabled ? 'hidden' : 'visible'
            })
            if (_self.enabled) {
              multiPage.querySelectorAll('[title]').forEach(el => el.title = '') // 隐藏提示信息
            }
          }).catch(() => {})
        } else if (api.base.urlMatch(gm.regex.page_videoWatchlaterMode)) {
          api.wait.$('.player-auxiliary-playlist-list').then(list => {
            const exec = () => {
              if (_self.enabled) {
                list.querySelectorAll('.player-auxiliary-playlist-item-p-item').forEach(item => {
                  const m = /^(p\d+)\D/i.exec(item.textContent)
                  if (m) {
                    item.textContent = m[1]
                  }
                })
              }
            }
            exec()
            if (!list._obHidePart) { // 如果 list 中发生修改，则重新处理
              list._obHidePart = new MutationObserver(exec)
              list._obHidePart.observe(list, { childList: true })
            }
          })
        }
      }

      // 隐藏分段信息
      if (gm.config.disableSegmentInformation && _self.method.isSegmentedProgress()) {
        if (!_self.method.isV3Player()) {
          // 分段按钮
          api.wait.$('.bilibili-player-video-btn-viewpointlist', _self.control).then(btn => {
            btn.style.visibility = _self.enabled ? 'hidden' : ''
          })
          // 分段列表
          api.wait.$('.player-auxiliary-collapse-viewpointlist').then(list => {
            list.style.display = 'none' // 一律隐藏即可，用户要看就再点一次分段按钮
          })
          // 进度条预览上的分段标题（必定存在）
          api.wait.$('.bilibili-player-video-progress-detail-content').then(content => {
            content.style.display = _self.enabled ? 'none' : ''
          })
        }
      }
    }

    /**
     * 防剧透功能处理流程
     */
    async processNoSpoil() {
      const _self = this
      if (unsafeWindow.player) {
        await api.wait.waitForConditionPassed({
          condition: () => unsafeWindow.player.isInitialized(),
        })
      }
      await _self.initProgress()
      _self.hideElementStatic()
      processControlShow()
      core()
      if (_self.enabled) {
        _self.scriptControl.enabled.setAttribute('enabled', '')
      } else {
        _self.scriptControl.enabled.removeAttribute('enabled')
      }

      /**
       * 处理视频控制的显隐
       */
      function processControlShow() {
        if (!_self.enabled) return

        const addObserver = target => {
          if (!target._obPlayRate) {
            target._obPlayRate = new MutationObserver(api.base.throttle(() => {
              _self.processFakePlayed()
            }, 500))
            target._obPlayRate.observe(_self.progress.thumb, { attributeFilter: ['style'] })
          }
        }
        if (_self.method.isV3Player()) {
          const panel = _self.controlPanel
          if (!_self.controlPanel._obControlShow) {
            // 切换视频控制显隐时，添加或删除 ob 以控制伪进度条
            panel._obControlShow = new MutationObserver(() => {
              if (panel.style.display != 'none') {
                if (_self.enabled) {
                  _self.fakeProgress.root.style.visibility = 'visible'
                  core(true)
                  addObserver(panel)
                }
              } else {
                if (_self.enabled) {
                  _self.fakeProgress.root.style.visibility = ''
                }
                if (panel._obPlayRate) {
                  panel._obPlayRate.disconnect()
                  panel._obPlayRate = null
                }
              }
            })
            panel._obControlShow.observe(panel, { attributeFilter: ['style'] })
          }
          if (panel.style.display != 'none') {
            addObserver(panel)
          }
        } else {
          const clzControlShow = 'video-control-show'
          const playerArea = document.querySelector('.bilibili-player-area')
          if (!playerArea._obControlShow) {
            // 切换视频控制显隐时，添加或删除 ob 以控制伪进度条
            playerArea._obControlShow = new MutationObserver(records => {
              if (records[0].oldValue == playerArea.className) return // 不能去，有个东西一直在原地修改 class……
              const before = new RegExp(String.raw`(^|\s)${clzControlShow}(\s|$)`).test(records[0].oldValue)
              const current = playerArea.classList.contains(clzControlShow)
              if (before != current) {
                if (current) {
                  if (_self.enabled) {
                    core(true)
                    addObserver(playerArea)
                  }
                } else if (playerArea._obPlayRate) {
                  playerArea._obPlayRate.disconnect()
                  playerArea._obPlayRate = null
                }
              }
            })
            playerArea._obControlShow.observe(playerArea, {
              attributeFilter: ['class'],
              attributeOldValue: true,
            })
          }
          if (playerArea.classList.contains(clzControlShow)) {
            addObserver(playerArea)
          }
        }
      }

      /**
       * 防剧透处理核心流程
       * @param {boolean} [noPostpone] 不延后执行
       */
      function core(noPostpone) {
        let offset = 'offset'
        let playRate = 0
        if (_self.enabled) {
          playRate = _self.method.getCurrentTime() / _self.method.getDuration()
          offset = getEndPoint() - 100
          const reservedLeft = gm.config.reservedLeft
          const reservedRight = 100 - gm.config.reservedRight
          if (playRate * 100 < reservedLeft) {
            offset = 0
          } else {
            const offsetRate = playRate * 100 + offset
            if (offsetRate < reservedLeft) {
              offset = reservedLeft - playRate * 100
            } else if (offsetRate > reservedRight) {
              offset = reservedRight - playRate * 100
            }
          }
        } else if (_self.progress._noSpoil) {
          offset = 0
        }

        if (typeof offset == 'number') {
          const handler = () => {
            _self.progress.root._offset = offset
            _self.progress.root.style.transform = `translateX(${offset}%)`
          }

          if (_self.enabled) {
            _self.progress.dispEl.forEach(el => {
              el.style.visibility = 'hidden'
            })
            if (_self.method.isV3Player()) {
              _self.progress.thumb.parentElement.style.backgroundColor = 'unset'
            }
            _self.fakeProgress.root.style.visibility = 'visible'

            if (noPostpone || !gm.config.postponeOffset) {
              handler()
            } else if (!_self.progress._noSpoil) { // 首次打开
              _self.progress.root._offset = 0
              _self.progress.root.style.transform = 'translateX(0)'
              _self.fakeProgress.played.style.transform = 'scaleX(0)'
            }
            _self.processFakePlayed()

            _self.progress._noSpoil = true
          } else {
            _self.progress.dispEl.forEach(el => {
              el.style.visibility = ''
            })
            if (_self.method.isV3Player()) {
              _self.progress.thumb.parentElement.style.backgroundColor = ''
            }
            _self.fakeProgress.root.style.visibility = ''
            handler()

            _self.progress._noSpoil = false
          }
        }

        if (api.base.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode])) {
          if (_self.uploaderEnabled) {
            _self.scriptControl.uploaderEnabled.setAttribute('enabled', '')
          } else {
            _self.scriptControl.uploaderEnabled.removeAttribute('enabled')
          }
        }
        if (api.base.urlMatch(gm.regex.page_bangumi)) {
          if (gm.config.bangumiEnabled) {
            _self.scriptControl.bangumiEnabled.setAttribute('enabled', '')
          } else {
            _self.scriptControl.bangumiEnabled.removeAttribute('enabled')
          }
        }
      }

      /**
       * 获取偏移后进度条尾部位置
       * @returns {number} 偏移后进度条尾部位置
       */
      function getEndPoint() {
        if (!_self.progress._noSpoil) {
          _self.progress._fakeRandom = Math.random()
        }
        let r = _self.progress._fakeRandom
        const origin = 100 // 左右分界点
        const left = gm.config.offsetLeft
        const right = gm.config.offsetRight
        const factor = gm.config.offsetTransformFactor
        const mid = left / (left + right) // 概率中点
        if (r <= mid) { // 向左偏移
          r = 1 - r / mid
          r **= factor
          return origin - r * left
        } else { // 向右偏移
          r = (r - mid) / (1 - mid)
          r **= factor
          return origin + r * right
        }
      }
    }

    /**
     * 初始化防剧透功能
     */
    async initNoSpoil() {
      const _self = this
      _self.uploaderEnabled = false
      _self.enabled = await _self.detectEnabled()
      await _self.initWebpage()
      if (_self.enabled) {
        await _self.processNoSpoil()
      }
    }

    /**
     * 切换分P、页面内切换视频、播放器刷新等各种情况下，重新初始化防剧透流程
     */
    initSwitch() {
      const _self = this
      if (_self.method.isV3Player()) {
        // V3 会使用原来的大部分组件，刷一下 static 就行
        let currentPathname = location.pathname
        window.addEventListener('urlchange', function() {
          if (location.pathname != currentPathname) {
            currentPathname = location.pathname
            // 其实只有 pbp 需要重刷，但是 pbp 来得很晚且不好检测，而且影响也不是很大，稍微延迟一下得了
            setTimeout(() => _self.hideElementStatic(), 5000)
          }
        })
      } else {
        // V2 在这些情况下会自动刷新
        if (unsafeWindow.player) {
          unsafeWindow.player.addEventListener('video_destroy', async () => {
            await _self.initNoSpoil()
            _self.initSwitch()
          })
        } else {
          api.wait.executeAfterElementLoaded({
            selector: '.bilibili-player-video-control',
            exclude: [_self.control],
            repeat: true,
            throttleWait: 2000,
            timeout: 0,
            callback: () => _self.initNoSpoil(),
          })
        }
      }
    }

    /**
     * 初始化脚本控制条
     */
    initScriptControl() {
      const _self = this
      if (!_self.controlPanel.contains(_self.scriptControl)) {
        _self.scriptControl = _self.controlPanel.appendChild(document.createElement('div'))
        _self.control._scriptControl = _self.scriptControl
        if (_self.method.isV3Player()) {
          _self.scriptControl.className = `${gm.id}-scriptControl gm-v3`
        } else {
          _self.scriptControl.className = `${gm.id}-scriptControl`
        }
        _self.scriptControl.innerHTML = `
          <span id="${gm.id}-enabled">防剧透</span>
          <span id="${gm.id}-uploaderEnabled" style="display:none">将UP主加入防剧透名单</span>
          <span id="${gm.id}-bangumiEnabled" style="display:none">番剧自动启用防剧透</span>
          <span id="${gm.id}-setting" style="display:none">设置</span>
        `
        _self.scriptControl.enabled = _self.scriptControl.querySelector(`#${gm.id}-enabled`)
        _self.scriptControl.uploaderEnabled = _self.scriptControl.querySelector(`#${gm.id}-uploaderEnabled`)
        _self.scriptControl.bangumiEnabled = _self.scriptControl.querySelector(`#${gm.id}-bangumiEnabled`)
        _self.scriptControl.setting = _self.scriptControl.querySelector(`#${gm.id}-setting`)

        _self.scriptControl.enabled.addEventListener('click', function() {
          _self.enabled = !_self.enabled
          _self.processNoSpoil()
        })

        if (!gm.config.simpleScriptControl) {
          if (api.base.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode])) {
            if (!gm.data.uploaderListSet().has('*')) { // * 匹配所有UP主不显示该按钮
              _self.scriptControl.uploaderEnabled.style.display = 'unset'
              _self.scriptControl.uploaderEnabled.addEventListener('click', async function() {
                const ulSet = gm.data.uploaderListSet() // 必须每次读取
                const vid = await _self.method.getVid()
                const videoInfo = await _self.method.getVideoInfo(vid.id, vid.type)
                const uid = String(videoInfo.owner.mid)

                _self.uploaderEnabled = !_self.uploaderEnabled
                if (_self.uploaderEnabled) {
                  this.setAttribute('enabled', '')
                  if (!ulSet.has(uid)) {
                    const ul = gm.data.uploaderList()
                    gm.data.uploaderList(`${ul}\n${uid} # ${videoInfo.owner.name}`)
                  }
                } else {
                  this.removeAttribute('enabled')
                  if (ulSet.has(uid)) {
                    let ul = gm.data.uploaderList()
                    ul = ul.replace(new RegExp(String.raw`^${uid}(?=\D|$).*\n?`, 'gm'), '')
                    gm.data.uploaderList(ul)
                  }
                }
              })
            }
          }

          if (api.base.urlMatch(gm.regex.page_bangumi)) {
            _self.scriptControl.bangumiEnabled.style.display = 'unset'
            _self.scriptControl.bangumiEnabled.addEventListener('click', function() {
              gm.config.bangumiEnabled = !gm.config.bangumiEnabled
              if (gm.config.bangumiEnabled) {
                this.setAttribute('enabled', '')
              } else {
                this.removeAttribute('enabled')
              }
              GM_setValue('bangumiEnabled', gm.config.bangumiEnabled)
            })
          }

          _self.scriptControl.setting.style.display = 'unset'
          _self.scriptControl.setting.addEventListener('click', function() {
            script.openUserSetting()
          })
        }

        api.dom.fade(true, _self.scriptControl)
      }

      if (!_self.progress.root._scriptControlListeners) {
        // 临时将 z-index 调至底层，不要影响信息的显示
        // 不通过样式直接将 z-index 设为最底层，是因为会被 pbp 遮盖导致点击不了
        // 问题的关键在于，B站已经给进度条和 pbp 内所有元素都设定好 z-index，只能用这种奇技淫巧来解决
        _self.progress.root.addEventListener('mouseenter', function() {
          _self.scriptControl.style.zIndex = '-1'
        })
        _self.progress.root.addEventListener('mouseleave', function() {
          _self.scriptControl.style.zIndex = ''
        })
        _self.progress.root._scriptControlListeners = true
      }
    }

    /**
     * 更新用于模拟已播放进度的伪已播放条
     */
    processFakePlayed() {
      const _self = this
      if (!_self.enabled) return
      const playRate = _self.method.getCurrentTime() / _self.method.getDuration()
      let offset = _self.progress.root._offset ?? 0
      // 若处于播放进度小于左侧预留区的特殊情况，不要进行处理
      // 注意，一旦离开这种特殊状态，就再也不可能进入该特殊状态了，因为这样反而会暴露信息
      if (offset !== 0) {
        let reservedZone = false
        const offsetPlayRate = offset + playRate * 100
        const reservedLeft = gm.config.reservedLeft
        const reservedRight = 100 - gm.config.reservedRight
        // 当实际播放进度小于左侧保留区时，不作特殊处理，因为这样反而会暴露信息
        if (offsetPlayRate < reservedLeft) {
          offset += reservedLeft - offsetPlayRate
          reservedZone = true
        } else if (offsetPlayRate > reservedRight) {
          offset -= offsetPlayRate - reservedRight
          reservedZone = true
        }
        if (reservedZone) {
          _self.progress.root._offset = offset
          _self.progress.root.style.transform = `translateX(${offset}%)`
        }
      }
      _self.fakeProgress.played.style.transform = `scaleX(${playRate + offset / 100})`
    }

    /**
     * 添加脚本样式
     */
    addStyle() {
      api.base.addStyle(`
        :root {
          --${gm.id}-progress-track-color: hsla(0, 0%, 100%, .3);
          --${gm.id}-progress-played-color: rgba(35, 173, 229, 1);
          --${gm.id}-control-item-selected-color: #00c7ff;
          --${gm.id}-control-item-shadow-color: #00000080;
          --${gm.id}-text-color: black;
          --${gm.id}-text-bold-color: #3a3a3a;
          --${gm.id}-light-text-color: white;
          --${gm.id}-hint-text-color: gray;
          --${gm.id}-hint-text-hightlight-color: #555555;
          --${gm.id}-background-color: white;
          --${gm.id}-background-hightlight-color: #ebebeb;
          --${gm.id}-update-hightlight-color: #4cff9c;
          --${gm.id}-update-hightlight-hover-color: red;
          --${gm.id}-border-color: black;
          --${gm.id}-shadow-color: #000000bf;
          --${gm.id}-hightlight-color: #0075FF;
          --${gm.id}-important-color: red;
          --${gm.id}-disabled-color: gray;
          --${gm.id}-opacity-fade-transition: opacity ${gm.const.fadeTime}ms ease-in-out;
          --${gm.id}-scrollbar-background-color: transparent;
          --${gm.id}-scrollbar-thumb-color: #0000002b;
        }

        .${gm.id}-scriptControl {
          position: absolute;
          left: 0;
          bottom: 100%;
          color: var(--${gm.id}-light-text-color);
          margin-bottom: 0.3em;
          font-size: 13px;
          z-index: 1; /* 需保证不被 pbp 等元素遮盖 */
          display: flex;
          opacity: 0;
          transition: opacity ${gm.const.fadeTime}ms ease-in-out;
        }
        .mode-fullscreen .${gm.id}-scriptControl,
        .mode-webfullscreen .${gm.id}-scriptControl {
          margin-bottom: 1em;
        }
        .${gm.id}-scriptControl.gm-v3 {
          left: 1em;
          margin-bottom: 0.4em;
        }
        [data-screen=full] .${gm.id}-scriptControl.gm-v3,
        [data-screen=web] .${gm.id}-scriptControl.gm-v3 {
          margin-bottom: 0.2em;
        }

        .${gm.id}-scriptControl > * {
          cursor: pointer;
          border-radius: 4px;
          padding: 0.3em;
          margin: 0 0.12em;
          background-color: var(--${gm.id}-control-item-shadow-color);
          line-height: 1em;
          opacity: 0.7;
          transition: opacity ease-in-out ${gm.const.fadeTime}ms;
        }
        .${gm.id}-scriptControl > *:hover {
          opacity: 1;
        }
        .${gm.id}-scriptControl > *[enabled] {
          color: var(--${gm.id}-control-item-selected-color);
        }

        #${gm.id} {
          color: var(--${gm.id}-text-color);
        }
        #${gm.id} * {
          box-sizing: content-box;
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
          min-width: 42em;
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
          width: 100%;
        }
        #${gm.id} .gm-setting .gm-item {
          padding: 0.2em;
          border-radius: 2px;
        }
        #${gm.id} .gm-setting .gm-item > * {
          display: flex;
          align-items: center;
        }
        #${gm.id} .gm-setting .gm-item:hover {
          color: var(--${gm.id}-hightlight-color);
        }

        #${gm.id} .gm-setting input[type=checkbox] {
          margin-left: auto;
        }
        #${gm.id} .gm-setting input[is=laster2800-input-number] {
          border-width: 0 0 1px 0;
          width: 2.4em;
          text-align: right;
          padding: 0 0.2em;
          margin-left: auto;
        }

        #${gm.id} .gm-setting .gm-information {
          margin: 0 0.4em;
          cursor: pointer;
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

        #${gm.id} .gm-info,
        .${gm.id}-dialog .gm-info {
          font-size: 0.8em;
          color: var(--${gm.id}-hint-text-color);
          text-decoration: underline;
          padding: 0 0.2em;
          cursor: pointer;
        }
        #${gm.id} .gm-info:hover,
        .${gm.id}-dialog .gm-info:hover {
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
        #${gm.id} [setting-type=updated] .gm-item.gm-updated:hover {
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
          color: var(--${gm.id}-text-color);
          outline: none;
          border-radius: 0;
          appearance: auto; /* 番剧播放页该项被覆盖 */
        }

        #${gm.id} [disabled],
        #${gm.id} [disabled] * {
          cursor: not-allowed !important;
          color: var(--${gm.id}-disabled-color) !important;
        }

        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar {
          width: 6px;
          height: 6px;
          background-color: var(--${gm.id}-scrollbar-background-color);
        }
        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-thumb {
          border-radius: 3px;
          background-color: var(--${gm.id}-scrollbar-thumb-color);
        }
        #${gm.id} .gm-setting .gm-items::-webkit-scrollbar-corner {
          background-color: var(--${gm.id}-scrollbar-background-color);
        }

        #${gm.id}-fake-progress {
          position: absolute;
          top: 42%;
          left: 0;
          height: 4px;
          width: 100%;
          pointer-events: none;
          visibility: hidden;
        }
        #${gm.id}-fake-progress.gm-v3 {
          top: 10%;
          left: 1.5%;
          width: 97%;
        }
        #${gm.id}-fake-progress > * {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%
        }
        #${gm.id}-fake-progress .fake-track {
          background-color: var(--${gm.id}-progress-track-color);
        }
        #${gm.id}-fake-progress .fake-played {
          background-color: var(--${gm.id}-progress-played-color);
          transform-origin: left;
          transform: scaleX(0);
        }

        /* 隐藏番剧中的进度条自动跳转提示（该提示出现太快，常规方式处理不及，这里先用样式覆盖一下） */
        .bpx-player-toast-wrap {
          display: none;
        }
      `)
    }
  }

  document.readyState != 'complete' ? window.addEventListener('load', main) : main()

  function main() {
    if (GM_info.scriptHandler != 'Tampermonkey') {
      api.base.initUrlchangeEvent()
    }
    script = new Script()
    webpage = new Webpage()

    script.init()
    script.addScriptMenu()
    webpage.addStyle()

    webpage.initNoSpoil().then(() => {
      webpage.initSwitch()
    })
  }
})()
