// ==UserScript==
// @name            B站封面获取
// @version         5.4.6.20210908
// @namespace       laster2800
// @author          Laster2800
// @description     获取B站各播放页及直播间封面，支持手动及实时预览等多种模式，支持点击下载、封面预览、快速复制，可高度自定义
// @icon            https://www.bilibili.com/favicon.ico
// @homepageURL     https://greasyfork.org/zh-CN/scripts/395575
// @supportURL      https://greasyfork.org/zh-CN/scripts/395575/feedback
// @license         LGPL-3.0
// @noframes
// @include         *://www.bilibili.com/video/*
// @include         *://www.bilibili.com/bangumi/play/*
// @include         *://www.bilibili.com/medialist/play/watchlater
// @include         *://www.bilibili.com/medialist/play/watchlater/*
// @include         *://live.bilibili.com/*
// @exclude         *://live.bilibili.com/
// @exclude         *://live.bilibili.com/?*
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=968206
// @require         https://greasyfork.org/scripts/431998-userscriptapidom/code/UserscriptAPIDom.js?version=968204
// @require         https://greasyfork.org/scripts/431999-userscriptapilogger/code/UserscriptAPILogger.js?version=968360
// @require         https://greasyfork.org/scripts/432000-userscriptapimessage/code/UserscriptAPIMessage.js?version=968668
// @require         https://greasyfork.org/scripts/432001-userscriptapitool/code/UserscriptAPITool.js?version=968361
// @require         https://greasyfork.org/scripts/432002-userscriptapiwait/code/UserscriptAPIWait.js?version=968207
// @require         https://greasyfork.org/scripts/432003-userscriptapiweb/code/UserscriptAPIWeb.js?version=967891
// @grant           GM_download
// @grant           GM_notification
// @grant           GM_xmlhttpRequest
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           GM_registerMenuCommand
// @grant           GM_unregisterMenuCommand
// @grant           window.onurlchange
// @grant           unsafeWindow
// @connect         api.bilibili.com
// @compatible      edge 版本不小于 85
// @compatible      chrome 版本不小于 85
// @compatible      firefox 版本不小于 90
// ==/UserScript==

(function() {
  'use strict'

  const gmId = 'gm395575'
  const defaultRealtimeStyle = `
    #${gmId}-realtime-cover {
      display: block;
      margin-bottom: 10px;
      border-radius: 3px;
      overflow: hidden;
      box-shadow: #00000038 0px 3px 6px;
    }
    #${gmId}-realtime-cover img {
      display: block;
      width: 100%;
    }
  `.trim().replace(/\s+/g, ' ')

  const gm = {
    id: gmId,
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210815,
    config: {},
    configMap: {
      mode: { default: -1, name: '视频/番剧：工作模式' },
      customModeSelector: { default: '#danmukuBox' },
      customModePosition: { default: 'beforebegin' },
      customModeQuality: { default: '480w_90p' }, // 320w 会有肉眼可见的质量损失
      customModeStyle: { default: defaultRealtimeStyle },
      download: { default: true, name: '全局：点击下载', checkItem: true },
      preview: { default: true, name: '视频/番剧：封面预览', checkItem: true },
      previewLive: { default: true, name: '直播间：封面预览', checkItem: true },
      bangumiSeries: { default: false, name: '番剧：获取系列封面而非分集封面', checkItem: true },
      switchQuickCopy: { default: false, name: '全局：交换「右键」与「Ctrl+右键」功能', checkItem: true, needNotReload: true },
      disableContextMenu: { default: true, name: '全局：在预览图上禁用右键菜单', checkItem: true },
    },
    runtime: {
      /** @type {'legacy' | 'realtime'} */
      layer: null,
      modeName: null,
      preview: null,
      realtimeSelector: null,
      /** @type {'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend'} */
      realtimePosition: null,
      realtimeQuality: null,
      realtimeStyle: null,
    },
    url: {
      api_videoInfo: (id, type) => `https://api.bilibili.com/x/web-interface/view?${type}=${id}`,
      gm_changelog: 'https://gitee.com/liangjiancang/userscript/blob/master/script/BilibiliCover/changelog.md',
      noop: 'javascript:void(0)',
    },
    regex: {
      page_videoNormalMode: /\.com\/video([/?#]|$)/,
      page_videoWatchlaterMode: /\.com\/medialist\/play\/watchlater([/?#]|$)/,
      page_bangumi: /\/bangumi\/play([/?#]|$)/,
      page_live: /live\.bilibili\.com\/\d+([/?#]|$)/, // 只含具体的直播间页面
    },
    const: {
      hintText: '左键：下载或在新标签页中打开封面\n中键：在新标签页中打开封面\n右键：复制封面链接/内容\nCtrl+右键：复制封面内容/链接',
      errorMsg: '获取失败，请尝试在页面加载完成后获取',
      customMode: 32767,
      fadeTime: 200,
      noticeTimeout: 5600,
    },
  }

  /* global UserscriptAPI */
  const api = new UserscriptAPI({
    id: gm.id,
    label: GM_info.script.name,
  })

  /** @type {Script} */
  let script = null
  /** @type {Webpage} */
  let webpage = null

  /**
   * 脚本运行的抽象，为脚本本身服务的核心功能
   */
  class Script {
    /**
     * 初始化脚本
     */
    init() {
      try {
        this.updateVersion()
        for (const name in gm.configMap) {
          const v = GM_getValue(name)
          const dv = gm.configMap[name].default
          gm.config[name] = typeof v == typeof dv ? v : dv
        }
        this.initRuntime()

        if (gm.config.mode == gm.configMap.mode.default) {
          this.configureMode(true)
        }
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
     * 初始化运行时变量
     */
    initRuntime() {
      const rt = gm.runtime
      const mode = gm.config.mode
      rt.layer = mode > 1 ? 'realtime' : 'legacy'
      rt.preview = api.web.urlMatch(gm.regex.page_live) ? gm.config.previewLive : gm.config.preview
      rt.modeName = { '-1': '初始化', '1': '传统', '2': '实时预览', [gm.const.customMode]: '自定义' }[mode] ?? '未知'
      if (rt.layer == 'realtime') {
        for (const s of ['Selector', 'Position', 'Style']) {
          rt['realtime' + s] = mode == 2 ? gm.configMap['customMode' + s].default : gm.config['customMode' + s]
        }
        rt.realtimeQuality = mode == 2 ? gm.configMap.customModeQuality.default : gm.config.customModeQuality
      }
    }

    /**
     * 初始化脚本菜单
     */
    initScriptMenu() {
      const _self = this
      const cfgName = id => `[ ${config[id] ? '✓' : '✗'} ] ${configMap[id].name}`
      const config = gm.config
      const configMap = gm.configMap
      const menuId = {}

      menuId.mode = GM_registerMenuCommand(`${gm.configMap.mode.name} [ ${gm.runtime.modeName} ]`, () => _self.configureMode())
      for (const id in config) {
        if (configMap[id].checkItem) {
          menuId[id] = createMenuItem(id)
        }
      }
      menuId.reset = GM_registerMenuCommand('初始化脚本', () => this.resetScript())

      function createMenuItem(id) {
        return GM_registerMenuCommand(cfgName(id), () => {
          config[id] = !config[id]
          GM_setValue(id, config[id])
          GM_notification({
            text: `已${config[id] ? '开启' : '关闭'}「${configMap[id].name}」功能${configMap[id].needNotReload ? '' : '，刷新页面以生效（点击通知以刷新）'}。`,
            timeout: gm.const.noticeTimeout,
            onclick: configMap[id].needNotReload ? null : () => location.reload(),
          })
          clearMenu()
          _self.initScriptMenu()
        })
      }

      function clearMenu() {
        for (const id in menuId) {
          GM_unregisterMenuCommand(menuId[id])
        }
      }
    }

    /**
     * 版本更新处理
     */
    updateVersion() {
      if (isNaN(gm.configVersion) || gm.configVersion < 0) {
        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
      } else if (gm.configVersion < gm.configUpdate) {
        // 必须按从旧到新的顺序写
        // 内部不能使用 gm.configUpdate，必须手写更新后的配置版本号！

        // 5.0.0.20210811
        if (gm.configVersion < 20210811) {
          GM_deleteValue('liveKeyFrame')
        }

        // 5.0.5.20210812
        if (gm.configVersion < 20210812) {
          GM_deleteValue('mode')
          GM_deleteValue('customModeStyle')
        }

        // 5.2.0.20210813
        if (gm.configVersion < 20210813) {
          GM_deleteValue('preview')
        }

        // 功能性更新后更新此处配置版本
        if (gm.configVersion < 20210815) {
          GM_notification({
            text: '功能性更新完毕，您可能需要重新设置脚本。点击查看更新日志。',
            onclick: () => window.open(gm.url.gm_changelog),
          })
        }
        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
      }
    }

    /**
     * 初始化脚本
     */
    async resetScript() {
      const result = await api.message.confirm('是否要初始化脚本？')
      if (result) {
        const gmKeys = GM_listValues()
        for (const gmKey of gmKeys) {
          GM_deleteValue(gmKey)
        }
        gm.configVersion = gm.configUpdate
        GM_setValue('configVersion', gm.configVersion)
        location.reload()
      }
    }

    /**
     * 设置工作模式
     * @param {boolean} [reload] 强制刷新
     */
    async configureMode(reload) {
      let result = null
      let msg = null
      let val = null

      val = gm.config.mode
      val = val == -1 ? 1 : val
      msg = `
        <p style="margin-bottom:0.5em">输入对应序号选择脚本工作模式。输入值应该是一个数字。</p>
        <p>[ 1 ] - 传统模式。在视频播放器下方添加一个「获取封面」按钮，与该按钮交互以获得封面。</p>
        <p>[ 2 ] - 实时预览模式。直接在视频播放器右方显示封面，与其交互可进行更多操作。</p>
        <p>[ ${gm.const.customMode} ] - 自定义模式。底层机制与预览模式相同，但封面位置及显示效果由用户自定义，运行效果仅局限于想象力。</p>
      `
      result = await api.message.prompt(msg, val, { html:true })
      if (result == null) return
      result = parseInt(result)
      if ([1, 2, gm.const.customMode].indexOf(result) >= 0) {
        gm.config.mode = result
        GM_setValue('mode', result)
      } else {
        gm.config.mode = -1
        await api.message.alert('设置失败，请填入正确的参数。')
        return this.configureMode()
      }

      if (gm.config.mode == gm.const.customMode) {
        val = gm.config.customModeSelector
        msg = `
          <p style="margin-bottom:0.5em">请认真阅读以下说明：</p>
          <p>1. 应填入 CSS 选择器，脚本会以此选择定位元素，将封面元素「<code>#${gm.id}-realtime-cover</code>」插入到其附近（相对位置稍后设置）。</p>
          <p>2. 确保该选择器在「常规播放页」「稍后再看播放页」「番剧播放页」中均有对应元素，否则脚本在对应页面无法工作。PS：逗号「<code>,</code>」以 OR 规则拼接多个选择器。</p>
          <p>3. 不要选择广告为定位元素，否则封面元素可能会插入失败或被误杀。</p>
          <p>4. 不要选择时有时无的元素，或第三方插入的元素作为定位元素，否则封面元素可能会插入失败。</p>
          <p>5. 在 A 时间点插入的图片元素，有可能被 B 时间点插入的新元素 C 挤到目标以外的位置。只要将定位元素选择为 C 再更改相对位置即可解决问题。</p>
          <p>6. 置空时使用默认设置。</p>
        `
        result = await api.message.prompt(msg, val, { html:true })
        if (result != null) {
          result = result.trim()
          if (result === '') {
            result = gm.configMap.customModeSelector.default
          }
          gm.config.customModeSelector = result
          GM_setValue('customModeSelector', result)
        }

        val = gm.config.customModePosition
        msg = `
          <p style="margin-bottom:0.5em">设置封面元素相对于定位元素的位置。</p>
          <p>[ <code>beforebegin</code> ] - 作为兄弟元素插入到定位元素前方</p>
          <p>[ <code>afterbegin</code> ] - 作为第一个子元素插入到定位元素内</p>
          <p>[ <code>beforeend</code> ] - 作为最后一个子元素插入到定位元素内</p>
          <p>[ <code>afterend</code> ] - 作为兄弟元素插入到定位元素后方</p>
        `
        result = null
        const loop = () => ['beforebegin', 'afterbegin', 'beforeend', 'afterend'].indexOf(result) < 0
        while (loop()) {
          result = await api.message.prompt(msg, val, { html:true })
          if (result == null) break
          result = result.trim()
          if (loop()) {
            await api.message.alert('设置失败，请填入正确的参数。')
          }
        }
        if (result != null) {
          gm.config.customModePosition = result
          GM_setValue('customModePosition', result)
        }

        val = gm.config.customModeQuality
        msg = `
          <p>设置实时预览图片的质量，该项会明显影响页面加载的视觉体验。</p>
          <p>设置为 [ <code>best</code> ] 加载原图（不推荐），置空时使用默认设置。</p>
          <p style="margin-bottom:0.5em">PS：B站推荐的视频封面长宽比为 16:10（非强制性标准）。</p>
          <p>格式：[ <code>${'${width}w_${height}h_${clip}c_${quality}q'}</code> ]</p>
          <p>可省略部分参数，如 [ <code>320w_1q</code> ] 表示「宽度 320 像素，高度自动，拉伸，压缩质量 1」</p>
          <div style="text-indent:3em">
            <p><code>width</code>：&emsp;图片宽度</p>
            <p><code>height</code>：&emsp;图片高度</p>
            <p><code>clip</code>：&emsp;1 裁剪，0 拉伸；默认 0</p>
            <p><code>quality</code>：&emsp;有损压缩参数，100 为无损；默认 100</p>
          </div>
        `
        result = await api.message.prompt(msg, val, { html:true })
        if (result != null) {
          result = result.trim()
          if (result === '') {
            result = gm.configMap.customModeQuality.default
          }
          gm.config.customModeQuality = result
          GM_setValue('customModeQuality', result)
        }

        val = gm.config.customModeStyle
        msg = `
          <p style="margin-bottom:0.5em">设置封面元素的样式。设置为 [<code>disable</code>] 禁用样式，置空时使用默认设置。</p>
          <p>这里提供几种目标效果以便拓宽思路：</p>
          <p>* 鼠标悬浮至封面元素上方时放大封面实现预览效果（图片质量应与放大后的尺寸匹配）。</p>
          <p>* 将内部 <code>&lt;img&gt;</code> 隐藏，使用 Base64 图片或 SVG 将封面元素改成任何样子。</p>
          <p>* 将封面元素做成透明层覆盖在视频投稿时间上，实现点击投稿时间下载封面的效果。</p>
          <p>* 将页面背景替换为视频封面，再加个滤镜也许还会有不错的设计感？</p>
          <p>* ......</p>
        `
        result = await api.message.prompt(msg, val, { html:true })
        if (result != null) {
          result = result.trim()
          if (result === '') {
            result = gm.configMap.customModeStyle.default
          } else {
            result = result.replace(/\s+/g, ' ')
          }
          gm.config.customModeStyle = result
          GM_setValue('customModeStyle', result)
        }
      }

      if (reload || await api.message.confirm('配置工作模式完成，需刷新页面方可生效。是否立即刷新页面？')) {
        location.reload()
      }
    }
  }

  /**
   * 页面处理的抽象，脚本围绕网站的特化部分
   */
  class Webpage {
    /** 通用方法 */
    method = {
      /**
       * 下载封面
       * @param {string} url 封面 URL
       * @param {string} [name='Cover'] 保存文件名
       */
      download(url, name) {
        name ||= 'Cover'
        const onerror = async function(error) {
          if (error?.error == 'not_whitelisted') {
            await api.message.alert('该封面的文件格式不在下载模式白名单中，从而触发安全限制导致无法直接下载。可修改脚本管理器的「下载模式」或「文件扩展名白名单」设置以放开限制。')
            window.open(url)
          } else {
            GM_notification({
              text: '下载错误',
              timeout: gm.const.noticeTimeout,
            })
          }
        }
        const ontimeout = function() {
          GM_notification({
            text: '下载超时',
            timeout: gm.const.noticeTimeout,
          })
          window.open(url)
        }
        api.web.download({ url, name, onerror, ontimeout })
      },

      /**
       * 从 URL 获取视频 ID
       * @param {string} [url=location.pathname] 提取视频 ID 的源字符串
       * @returns {{id: string, type: 'aid' | 'bvid'}} `{id, type}`
       */
      getVid(url = location.pathname) {
        let m = null
        if ((m = /\/bv([0-9a-z]+)([/?#]|$)/i.exec(url))) {
          return { id: 'BV' + m[1], type: 'bvid' }
        } else if ((m = /\/(av)?(\d+)([/?#]|$)/i.exec(url))) { // 兼容 URL 中 BV 号被第三方修改为 AV 号的情况
          return { id: m[2], type: 'aid' }
        }
      },

      /**
       * 从 URL 获取番剧 ID
       * @param {string} [url=location.pathname] 提取视频 ID 的源字符串
       * @returns {{id: string, type: 'ssid' | 'epid'}} `{id, type}`
       */
      getBgmid(url = location.pathname) {
        let m = null
        if ((m = /\/(ss\d+)([/?#]|$)/.exec(url))) {
          return { id: m[1], type: 'ssid' }
        } else if ((m = /\/(ep\d+)([/?#]|$)/.exec(url))) {
          return { id: m[1], type: 'epid' }
        }
      },

      /**
       * 添加下载图片事件
       * @param {HTMLElement} target 触发元素
       */
      addDownloadEvent(target) {
        if (!target._downloadEvent) {
          const _self = this
          // 此处必须用 mousedown，否则无法与动态获取封面的代码达成正确的联动
          target.addEventListener('mousedown', function(e) {
            if (target.loaded && gm.config.download && e.button == 0) {
              _self.download(this.href, document.title)
            }
          })
          // 开启下载时，若没有以下处理器，则鼠标左键长按图片按钮，过一段时间后再松开，松开时依然会触发默认点击事件（在新标签页打开封面）
          target.addEventListener('click', function(e) {
            if (target.loaded && gm.config.download) {
              e.preventDefault()
            }
          })
          target._downloadEvent = true
        }
      },

      /**
       * 添加复制事件
       * @param {HTMLElement} target 触发元素
       */
      addCopyEvent(target) {
        if (!target._copyLinkEvent) {
          target.addEventListener('mousedown', async function(e) {
            if (target.loaded && e.button == 2) {
              let ctrl = e.ctrlKey
              if (gm.config.switchQuickCopy) {
                ctrl = !ctrl
              }
              if (ctrl) {
                // 借助 image 中转避免跨域；网络请求其实更简单，但还是防一手某些封面图不在 i0.hdslb.com 的情况
                // 理论上来说这里可以复用 realtime-image 或者 preview，但是很麻烦，再考虑到图片缓存也没必要
                const image = new Image()
                image.crossOrigin = 'Anonymous'
                image.src = target.href
                image.addEventListener('load', function() {
                  const canvas = document.createElement('canvas')
                  const ctx = canvas.getContext('2d')
                  canvas.width = this.width
                  canvas.height = this.height
                  ctx.drawImage(image, 0, 0)
                  canvas.toBlob(async blob => {
                    try {
                      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
                      api.message.info('已复制封面内容')
                    } catch (e) {
                      api.logger.warn(e)
                      api.message.info('当前浏览器不支持复制图片')
                    }
                  })
                })
              } else {
                try {
                  await navigator.clipboard.writeText(target.href)
                  api.message.info('已复制封面链接')
                } catch (e) {
                  // 只要脚本管理器有向浏览器要剪贴板权限就没问题
                  api.logger.warn(e)
                  api.message.info('当前浏览器不支持剪贴板')
                }
              }
            }
          })
        }
      },

      /**
       * 提示错误信息
       * @param {HTMLElement} target 触发元素
       */
      addErrorEvent(target) {
        if (!target._errorEvent) {
          target.addEventListener('mousedown', function() {
            if (!target.loaded) {
              api.message.info(gm.const.errorMsg)
            }
          })
          target._errorEvent = true
        }
      },

      /**
       * 设置封面
       * @param {HTMLElement} target 封面元素
       * @param {HTMLElement} preview 预览元素，无预览元素时传空值即可
       * @param {string} url 封面 URL
       */
      setCover(target, preview, url) {
        if (url) {
          target.title = gm.const.hintText
          target.href = url
          target.target = '_blank'
          target.loaded = true
          this.addDownloadEvent(target)
          this.addCopyEvent(target)
          if (target.img) {
            if (gm.runtime.realtimeQuality != 'best') {
              target.img.src = `${url}@${gm.runtime.realtimeQuality}.webp`
              target.img.lossless = url
            } else {
              target.img.src = url
            }
          }
          if (preview) {
            preview._src = url
          }
        } else {
          target.title = gm.const.errorMsg
          target.href = gm.url.noop
          target.target = '_self'
          target.loaded = false
          this.addErrorEvent(target)
          if (target.img) {
            target.img.removeAttribute('src')
            target.img.lossless = null
          }
          if (preview) {
            preview.removeAttribute('src')
          }
        }
      },

      /**
       * 创建预览元素
       * @param {HTMLElement} target 触发元素
       * @returns {HTMLImageElement}
       */
      createPreview(target) {
        const _self = this
        const preview = document.body.appendChild(document.createElement('img'))
        preview.className = `${gm.id}-preview`
        preview.fadeOutNoInteractive = true
        const fade = inOut => api.dom.fade(inOut, preview)

        const onMouseenter = api.tool.debounce(async function() {
          if (gm.runtime.preview) {
            if (preview._src) {
              try {
                await new Promise((resolve, reject) => {
                  preview.addEventListener('load', resolve, { once: true })
                  preview.addEventListener('error', reject, { once: true })
                  preview.src = preview._src
                  preview._src = null
                })
              } catch (e) {
                _self.setCover(target, preview, false)
                api.logger.error(e)
                return
              }
            }
            this.mouseOver && preview.src && fade(true)
          }
        }, 200)
        const onMouseleave = api.tool.debounce(function() {
          if (gm.runtime.preview) {
            !preview.mouseOver && fade(false)
          }
        }, 200)
        target.addEventListener('mouseenter', function() {
          this.mouseOver = true
          onMouseenter.call(this)
        })
        target.addEventListener('mouseleave', function() {
          this.mouseOver = false
          onMouseleave.call(this)
        })

        // 在链接上左键打开链接，和中键在新标签页打开链接，都要求：
        // 鼠标点击与松开时都在链接元素上，也就是说链接元素上不能有覆盖物，需让 preview 回避一下
        // 不做这个处理，将鼠标快速移动至按钮/实时预览上点击时，操作有概率会被吞掉
        target.addEventListener('mousedown', function() {
          preview.style.pointerEvents = 'none'
        })
        target.addEventListener('mouseup', function() {
          setTimeout(() => {
            preview.style.pointerEvents = ''
          }, 10)
        })

        let startPos = null // 鼠标进入预览时的初始坐标
        preview.addEventListener('mouseenter', function() {
          this.mouseOver = true
          startPos = null
        })
        preview.addEventListener('mouseleave', function() {
          this.mouseOver = false
          if (this.style.pointerEvents == 'none') return
          setTimeout(() => {
            if (!target.mouseOver) {
              startPos = null
              fade(false)
            }
          }, 200)
        })
        preview.addEventListener('mousedown', function(e) {
          if (this.src) {
            if (e.button == 0 || e.button == 1) {
              if (e.button == 0) {
                if (gm.config.download) {
                  _self.download(this.src, document.title)
                } else {
                  window.open(this.src)
                }
              } else {
                window.open(this.src)
              }
            }
          }
        })
        preview.addEventListener('mousemove', function(e) {
          // 鼠标移动一段距离关闭预览，优化用户体验
          if (startPos) {
            const dSquare = (startPos.x - e.clientX) ** 2 + (startPos.y - e.clientY) ** 2
            if (dSquare > 20 ** 2) { // 20px
              // 鼠标需已移出触发元素范围方可
              const rect = target.getBoundingClientRect()
              if (!(e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom)) {
                fade(false)
              }
            }
          } else {
            startPos = {
              x: e.clientX,
              y: e.clientY,
            }
          }
        })
        // 滚动时关闭预览，优化用户体验
        preview.addEventListener('wheel', api.tool.throttle(function() {
          fade(false)
        }, 200))
        // 根据宽高比设置不同样式
        preview.addEventListener('load', function() {
          if (this.width > this.height) {
            if (this.naturalWidth < window.innerWidth) {
              this.style.width = `${this.naturalWidth * 1.5}px`
            }
            this.style.height = ''
          } else {
            if (this.naturalHeight < window.innerHeight) {
              this.style.height = `${this.naturalHeight * 1.5}px`
            }
            this.style.width = ''
          }
        })

        // 快速复制相关
        preview.addEventListener('mousedown', function(e) {
          if (e.button == 2) {
            target.dispatchEvent(_self.cloneEvent(e, ['button', 'ctrlKey']))
          }
        })
        if (gm.config.disableContextMenu) {
          _self.disableContextMenu(preview)
        }
        return preview
      },

      /**
       * 创建实时封面元素
       * @returns {Promise<HTMLElement>} 实时封面元素
       */
      async createRealtimeCover() {
        const _self = this
        const ref = await api.wait.$(gm.runtime.realtimeSelector)
        const cover = ref.insertAdjacentElement(gm.runtime.realtimePosition, document.createElement('a'))
        cover.id = `${gm.id}-realtime-cover`
        cover.img = cover.appendChild(document.createElement('img'))
        cover.error = cover.appendChild(document.createElement('div'))
        cover.error.textContent = '封面获取失败'
        cover.img.addEventListener('load', function() {
          cover.error.style.display = ''
        })
        cover.img.addEventListener('error', function(/** @type {Event} */ e) {
          if (this.lossless && this.src != this.lossless) {
            if (gm.config.mode == gm.const.customMode) {
              api.message.info(`缩略图获取失败，使用原图进行替换！请检查「${gm.runtime.realtimeQuality}」是否为有效的图片质量参数。可能是正常现象，因为年代久远的视频封面有可能不支持缩略图。`, { ms: 4000 })
            } else {
              api.message.info('缩略图获取失败，使用原图进行替换！可能是正常现象，因为年代久远的视频封面有可能不支持缩略图。', { ms: 3000 })
            }
            api.logger.warn(['缩略图获取失败，使用原图进行替换！', this.src, this.lossless])
            this.src = this.lossless
            this.lossless = null
          } else {
            _self.setCover(cover, null, false) // preview 会自动处理 error，不必理会
            cover.error.style.display = 'block'
            api.logger.error(e)
          }
        })
        if (gm.runtime.realtimeStyle != 'disable') {
          api.dom.addStyle(gm.runtime.realtimeStyle)
        }
        if (gm.config.disableContextMenu) {
          this.disableContextMenu(cover)
        } else if (gm.runtime.realtimeQuality != 'best') {
          // 将缩略图替换为原图，以便右键菜单获取到正确的图像
          cover.img.addEventListener('mousedown', function(/** @type {MouseEvent} */ e) {
            if (e.button == 2 && this.lossless && this.src != this.lossless) {
              this.src = this.lossless
              this.lossless = null
            }
          })
        }
        return cover
      },

      /**
       * 禁用右键菜单
       * @param {HTMLElement} target 目标元素
       */
      disableContextMenu(target) {
        target.addEventListener('contextmenu', function(e) {
          e.preventDefault()
        })
      },

      /**
       * 克隆事件
       *
       * 直接复用 event 在某些情况下会出问题，克隆可避免之。
       * @param {Event} event 原事件
       * @param {string[]} attrNames 需克隆的属性值
       * @returns {Event} 克隆事件
       */
      cloneEvent(event, attrNames = []) {
        const cloned = new Event(event.type)
        for (const name of attrNames) {
          cloned[name] = event[name]
        }
        return cloned
      },

      /**
       * @callback coverInteractionPre 封面交互前置处理
       * @param {Event} 事件
       * @returns {boolean | Promise<boolean>} 本次是否启用代理
       */
      /**
       * 代理封面交互
       *
       * 全面接管一切用户交互引起的行为，默认链接点击行为除外
       * @param {HTMLElement} target 目标元素
       * @param {coverInteractionPre} pre 封面交互前置处理
       */
      async proxyCoverInteraction(target, pre) {
        const _self = this
        addEventListeners()

        async function main(event) {
          if (!await pre(event)) return
          removeEventListeners()
          if (event.type == 'mousedown') {
            // 鼠标左键点击链接可通过 click 拦截但没必要，中键点击链接无法通过 js 拦截不过也没必要拦
            // 同样地，无法通过 mousedown 事件中让浏览器模拟出链接被左键或中键点击的结果，需手动模拟
            let needDispatch = true
            if (event.button == 0) {
              if (!gm.config.download && target.loaded) {
                window.open(target.href)
                needDispatch = false
              }
            } else if (event.button == 1) {
              if (target.loaded) {
                window.open(target.href)
                needDispatch = false
              }
            }
            if (needDispatch) {
              target.dispatchEvent(_self.cloneEvent(event, ['button', 'ctrlKey']))
            }
          } else if (event.type == 'mouseenter') {
            target.dispatchEvent(_self.cloneEvent(event))
          }
          addEventListeners()
        }

        function addEventListeners() {
          target.addEventListener('mousedown', main, true)
          if (gm.runtime.preview) {
            target.addEventListener('mouseenter', main, true)
          }
        }

        function removeEventListeners() {
          target.removeEventListener('mousedown', main, true)
          if (gm.runtime.preview) {
            target.removeEventListener('mouseenter', main, true)
          }
        }
      },
    }

    async initVideo() {
      const _self = this
      const app = await api.wait.$('#app')
      const atr = await api.wait.$('#arc_toolbar_report') // 无论如何都卡一下时间
      await api.wait.waitForConditionPassed({
        condition: () => app.__vue__,
      })

      let cover = null
      if (gm.runtime.layer == 'legacy') {
        cover = document.createElement('a')
        cover.textContent = '获取封面'
        cover.className = 'appeal-text'
        // 确保与其他脚本配合时相关 UI 排列顺序不会乱
        const gm395456 = atr.querySelector('[id|=gm395456]')
        if (gm395456) {
          atr.insertBefore(cover, gm395456)
        } else {
          atr.appendChild(cover)
        }
        _self.method.disableContextMenu(cover)
      } else {
        cover = await _self.method.createRealtimeCover()
      }
      const preview = gm.runtime.preview && _self.method.createPreview(cover)
      cover.title = gm.const.hintText

      if (api.web.urlMatch(gm.regex.page_videoNormalMode)) {
        api.wait.executeAfterElementLoaded({
          selector: 'meta[itemprop=image]',
          base: document.head,
          subtree: false,
          repeat: true,
          timeout: 0,
          onError: function(e) {
            _self.method.setCover(cover, preview, false)
            api.logger.error(e)
          },
          callback: function(meta) {
            _self.method.setCover(cover, preview, meta.content)
          },
        })
      } else {
        if (gm.runtime.layer == 'legacy') {
          _self.method.proxyCoverInteraction(cover, async event => {
            try {
              const vid = _self.method.getVid()
              if (cover._cover_id == vid.id) return false
              // 在异步等待前拦截，避免逻辑倒置
              event.stopPropagation()
              const url = await getCover(vid)
              _self.method.setCover(cover, preview, url)
            } catch (e) {
              event.stopPropagation()
              _self.method.setCover(cover, preview, false)
              api.logger.error(e)
            }
            return true
          })
        } else {
          const main = async function() {
            try {
              const vid = _self.method.getVid()
              if (cover._cover_id == vid.id) return
              const url = await getCover(vid)
              _self.method.setCover(cover, preview, url)
            } catch (e) {
              _self.method.setCover(cover, preview, false)
              api.logger.error(e)
            }
          }

          setTimeout(main)
          window.addEventListener('urlchange', main)
        }

        const getCover = async (vid = _self.method.getVid()) => {
          if (cover._cover_id != vid.id) {
            const resp = await api.web.request({
              url: gm.url.api_videoInfo(vid.id, vid.type),
            }, { check: r => r.code === 0 })
            cover._cover_url = resp.data.pic ?? ''
            cover._cover_id = vid.id
          }
          return cover._cover_url
        }
      }
    }

    async initBangumi() {
      const _self = this
      const app = await api.wait.$('#app')
      const tm = await api.wait.$('#toolbar_module') // 无论如何都卡一下时间
      await api.wait.waitForConditionPassed({
        condition: () => app.__vue__,
      })

      let cover = null
      if (gm.runtime.layer == 'legacy') {
        cover = document.createElement('a')
        cover.textContent = '获取封面'
        cover.className = `${gm.id}-bangumi-cover-btn`
        tm.appendChild(cover)
        _self.method.disableContextMenu(cover)
      } else {
        cover = await _self.method.createRealtimeCover()
      }
      const preview = gm.runtime.preview && _self.method.createPreview(cover)
      cover.title = gm.const.hintText

      if (gm.config.bangumiSeries) {
        const setCover = img => _self.method.setCover(cover, preview, img.src.replace(/@[^@]*$/, ''))
        api.wait.$('.media-cover img').then(img => {
          setCover(img)
          const ob = new MutationObserver(() => setCover(img))
          ob.observe(img, { attributeFilter: ['src'] })
        }).catch(e => {
          _self.method.setCover(cover, preview, false)
          api.logger.error(e)
        })
      } else {
        if (gm.runtime.layer == 'legacy') {
          _self.method.proxyCoverInteraction(cover, event => {
            try {
              const bgmid = _self.method.getBgmid()
              if (cover._cover_id == bgmid.id) return false
              const url = getCover(bgmid)
              _self.method.setCover(cover, preview, url)
            } catch (e) {
              _self.method.setCover(cover, preview, false)
              api.logger.error(e)
            }
            event.stopPropagation()
            return true
          })
        } else {
          const main = async function() {
            try {
              const bgmid = _self.method.getBgmid()
              if (cover._cover_id == bgmid.id) return
              const url = getCover(bgmid)
              _self.method.setCover(cover, preview, url)
            } catch (e) {
              _self.method.setCover(cover, preview, false)
              api.logger.error(e)
            }
          }

          setTimeout(main)
          window.addEventListener('urlchange', main)
        }

        const getParams = () => unsafeWindow.getPlayerExtraParams?.()
        const getCover = (bgmid = _self.method.getBgmid()) => {
          if (cover._cover_id != bgmid.id) {
            const params = getParams()
            cover._cover_url = params.epCover
            cover._cover_id = bgmid.id
          }
          return cover._cover_url
        }
      }
    }

    async initLive() {
      const _self = this
      let win = unsafeWindow
      let doc = document
      let container = await api.wait.$(`
        #head-info-vm .right-ctnr,
        #head-info-vm .upper-right-ctnr,
        #player-ctnr iframe
      `)
      if (container.tagName == 'IFRAME') {
        const frame = container
        win = frame.contentWindow
        doc = frame.contentDocument
        // 依执行至此的页面加载进度（与网络正相关、与 CPU 负相关），这里 doc 有以下三种情况：
        // 1. frame 未初始化，获取到其默认 document：`<html><head></head><body></body></html>`，且 `readyState == 'complete'`
        // 2. frame 正在初始化，默认 document 被移除，获取到 null
        // 3. 获取到正确的 frame document
        if (!doc?.documentElement.textContent) { // 可应对以上状态的条件
          api.logger.info('Waiting for live room iframe document...')
          await new Promise(resolve => {
            frame.addEventListener('load', function() {
              win = frame.contentWindow
              doc = frame.contentDocument
              resolve()
            })
          })
        }
        container = await api.wait.$('#head-info-vm .right-ctnr, #head-info-vm .upper-right-ctnr', doc)
        _self.addStyle(doc)
      }
      // 这里再获取 hiVm，提前获取到的 hiVm 有可能会被替换成新的
      const hiVm = await api.wait.$('#head-info-vm', doc)
      await api.wait.waitForConditionPassed({
        condition: async () => hiVm.__vue__,
      })

      const cover = doc.createElement('a')
      cover.textContent = '获取封面'
      cover.className = `${gm.id}-live-cover-btn`
      container.insertAdjacentElement('afterbegin', cover)
      _self.method.disableContextMenu(cover)
      const preview = gm.runtime.preview && _self.method.createPreview(cover)
      cover.title = gm.const.hintText

      _self.method.proxyCoverInteraction(cover, async event => {
        try {
          if (cover.loaded) return false
          // 在异步等待前拦截，避免逻辑倒置
          event.stopPropagation()
          const url = await getCover(win)
          _self.method.setCover(cover, preview, url)
        } catch (e) {
          event.stopPropagation()
          _self.method.setCover(cover, preview, false)
          api.logger.error(e)
        }
        return true
      })

      async function getCover(win) {
        if (!cover.loaded) {
          cover._cover_url = await api.wait.waitForConditionPassed({
            condition: () => win.__NEPTUNE_IS_MY_WAIFU__?.roomInfoRes?.data?.room_info?.cover ?? win.__STORE__?.baseInfoRoom?.coverUrl,
            timeout: 2000,
          })
        }
        return cover._cover_url
      }
    }

    addStyle(doc = document) {
      api.dom.addStyle(`
        .${gm.id}-bangumi-cover-btn {
          float: right;
          cursor: pointer;
          font-size: 12px;
          margin-right: 16px;
          line-height: 36px;
          color: #505050;
        }
        .${gm.id}-bangumi-cover-btn:hover {
          color: #0075ff;
        }

        .${gm.id}-live-cover-btn {
          cursor: pointer;
          color: #999999;
        }
        .${gm.id}-live-cover-btn:hover {
          color: #23ADE5;
        }

        .${gm.id}-preview {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000000;
          max-width: 65vw; /* 自适应宽度和高度 */
          max-height: 95vh;
          border-radius: 8px;
          display: none;
          opacity: 0;
          transition: opacity ${gm.const.fadeTime}ms ease-in-out;
          cursor: pointer;
          box-shadow: #000000AA 0px 3px 6px;
        }

        #${gmId}-realtime-cover div {
          color: gray;
          padding: 5px;
          font-size: 18px;
          text-align: center;
          display: none;
        }
      `, doc)
    }
  }

  document.readyState != 'complete' ? window.addEventListener('load', main) : main()

  async function main() {
    if (GM_info.scriptHandler != 'Tampermonkey') {
      api.dom.initUrlchangeEvent()
    }
    script = new Script()
    webpage = new Webpage()

    script.init()
    script.initScriptMenu()
    webpage.addStyle()

    if (api.web.urlMatch([gm.regex.page_videoNormalMode, gm.regex.page_videoWatchlaterMode], 'OR')) {
      webpage.initVideo()
    } else if (api.web.urlMatch(gm.regex.page_bangumi)) {
      webpage.initBangumi()
    } else if (api.web.urlMatch(gm.regex.page_live)) {
      webpage.initLive()
    }
  }
})()
