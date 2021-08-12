// ==UserScript==
// @name            B站封面获取
// @version         5.1.0.20210812
// @namespace       laster2800
// @author          Laster2800
// @description     获取B站各播放页面及直播间封面，支持手动及实时预览等多种工作模式，支持封面预览及点击下载，可高度自定义
// @icon            https://www.bilibili.com/favicon.ico
// @homepage        https://greasyfork.org/zh-CN/scripts/395575
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
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=959256
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
// @incompatible    firefox 完全不兼容 Greasemonkey，不完全兼容 Violentmonkey
// ==/UserScript==

(function() {
  'use strict'

  const gmId = 'gm395575'
  const defaultRealtimeStyle = `
    #${gmId}-realtime-cover {
      display: block;
      margin-bottom: 10px;
      box-shadow: #00000033 0px 3px 6px;
    }
    #${gmId}-realtime-cover img {
      display: block;
      width: 100%;
    }
  `.trim().replace(/\s+/g, ' ')

  const gm = {
    id: gmId,
    configVersion: GM_getValue('configVersion'),
    configUpdate: 20210812,
    config: {},
    configMap: {
      mode: { default: -1, name: '工作模式' },
      customModeSelector: { default: '#danmukuBox' },
      customModePosition: { default: 'beforebegin' },
      customModeQuality: { default: '320w' },
      customModeStyle: { default: defaultRealtimeStyle },
      preview: { default: true, name: '封面预览', checkItem: true },
      download: { default: true, name: '点击下载', checkItem: true, needNotReload: true },
      bangumiSeries: { default: false, name: '番剧：获取系列总封面', checkItem: true },
    },
    runtime: {
      /** @type {'legacy' | 'realtime'} */
      layer: null,
      realtimeSelector: null,
      /** @type {'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend'} */
      realtimePosition: null,
      realtimeQuality: null,
      realtimeStyle: null,
      modeName: null,
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
      hintText: '左键：下载或在新标签页中打开封面。\n中键：在新标签页中打开封面。\n右键：可通过「另存为」直接保存图片。',
      errorMsg: '获取失败，若非网络问题请提供反馈',
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
        const result = api.message.confirm('初始化错误！是否彻底清空内部数据以重置脚本？')
        if (result) {
          const gmKeys = GM_listValues()
          for (const gmKey of gmKeys) {
            GM_deleteValue(gmKey)
          }
          location.reload()
        }
      }
    }

    /**
     * 初始化运行时变量
     */
    initRuntime() {
      const rt = gm.runtime
      const mode = gm.config.mode
      rt.layer = mode > 1 ? 'realtime' : 'legacy'
      if (rt.layer == 'realtime') {
        for (const s of ['Selector', 'Position', 'Style']) {
          rt['realtime' + s] = mode == 2 ? gm.configMap['customMode' + s].default : gm.config['customMode' + s]
        }
        rt.realtimeQuality = mode == 2 ? gm.configMap.customModeQuality.default : gm.config.customModeQuality
      }
      rt.modeName = { '-1': '初始化', '1': '传统', '2': '实时预览' }[mode] ?? (mode == gm.const.customMode ? '自定义' : '未知')
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

        // 4.10.0.20210711
        if (gm.configVersion < 20210711) {
          GM_deleteValue('preview')
        }

        // 5.0.0.20210811
        if (gm.configVersion < 20210811) {
          GM_deleteValue('liveKeyFrame')
        }

        // 5.0.5.20210812
        if (gm.configVersion < 20210812) {
          GM_deleteValue('mode')
          GM_deleteValue('customModeStyle')
        }

        // 功能性更新后更新此处配置版本
        if (gm.configVersion < 20210812) {
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
    resetScript() {
      const result = api.message.confirm('是否要初始化脚本？')
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
     * @async
     * @param {boolean} [reload] 强制刷新
     */
    async configureMode(reload) {
      let result = null
      let msg = null
      let val = null
      let msgbox = null
      const info = '请查看页面正中的说明'
      const display = msg => new Promise(resolve => {
        api.message.create(msg, {
          onOpened: function() { resolve(this) },
          autoClose: false,
          html: true,
          width: '42em',
          position: { top: '50%', left: '50%' },
        })
      })
      const close = msgbox => new Promise(resolve => api.message.close(msgbox, resolve))

      val = gm.config.mode
      val = val == -1 ? 1 : val
      msg = `
        <div style="line-height:1.6em">
          <p>输入对应序号选择脚本工作模式。输入值应该是一个数字。</p>
          <p style="margin-bottom:0.5em">该项仅对视频播放页和番剧播放页有效，直播间总是使用传统模式。</p>
          <p>[ 1 ] - 传统模式。在视频播放器下方添加一个「获取封面」按钮，与该按钮交互以获得封面。</p>
          <p>[ 2 ] - 实时预览模式。直接在视频播放器右方显示封面，与其交互可进行更多操作。</p>
          <p>[ 32767 ] - 自定义模式。底层机制与预览模式相同，但封面位置及显示效果由用户自定义，运行效果仅限于想象力。</p>
        </div>
      `
      msgbox = await display(msg)
      result = api.message.prompt(info, val)
      await close(msgbox)
      if (result === null) return
      result = parseInt(result)
      if ([1, 2, gm.const.customMode].indexOf(result) >= 0) {
        gm.config.mode = result
        GM_setValue('mode', result)
      } else {
        gm.config.mode = -1
        api.message.alert('设置失败，请填入正确的参数。')
        return this.configureMode()
      }

      if (gm.config.mode == gm.const.customMode) {
        val = gm.config.customModeSelector
        msg = `
          <div style="line-height:1.6em">
            <p style="margin-bottom:0.5em">请认真阅读以下说明：</p>
            <p>1. 应填入 CSS 选择器，脚本会以此选择定位元素，将封面元素「#${gm.id}-realtime-cover」插入到其附近（相对位置稍后设置）。</p>
            <p>2. 确保该选择器在「普通播放页」「稍后再看播放页」「番剧播放页」中均有对应元素，否则脚本在对应页面无法工作。PS：逗号「,」以 OR 规则拼接多个选择器。</p>
            <p>3. 不要选择广告为定位元素，否则封面元素可能会插入失败或被误杀。</p>
            <p>4. 不要选择时有时无的元素，或第三方插入的元素作为定位元素，否则封面元素可能会插入失败。</p>
            <p>5. 在 A 时间点插入的图片元素，有可能被 B 时间点插入的新元素 C 挤到目标以外的位置。只要将定位元素选择为 C 再更改相对位置即可解决问题。</p>
            <p>6. 置空时使用默认设置。</p>
          </div>
        `
        msgbox = await display(msg)
        result = api.message.prompt(info, val)
        if (result !== null) {
          result = result.trim()
          if (result === '') {
            result = gm.configMap.customModeSelector.default
          }
          gm.config.customModeSelector = result
          GM_setValue('customModeSelector', result)
        }
        await close(msgbox)

        val = gm.config.customModePosition
        msg = `
          <div style="line-height:1.6em">
            <p style="margin-bottom:0.5em">设置封面元素相对于定位元素的位置。</p>
            <p>[ beforebegin ] - 作为兄弟节点插入到定位元素前方</p>
            <p>[ afterbegin ] - 作为第一个子节点插入到定位元素内</p>
            <p>[ beforeend ] - 作为最后一个子节点插入到定位元素内</p>
            <p>[ afterend ] - 作为兄弟节点插入到定位元素后方</p>
          </div>
        `
        msgbox = await display(msg)
        result = null
        const loop = () => ['beforebegin', 'afterbegin', 'beforeend', 'afterend'].indexOf(result) < 0
        while (loop()) {
          result = api.message.prompt(info, val)
          if (result == null) break
          result = result.trim()
          if (loop()) {
            api.message.alert('设置失败，请填入正确的参数。')
          }
        }
        if (result !== null) {
          gm.config.customModePosition = result
          GM_setValue('customModePosition', result)
        }
        await close(msgbox)

        val = gm.config.customModeQuality
        msg = `
          <div style="line-height:1.6em">
            <p>设置实时预览图片的质量，该项会明显影响页面加载的视觉体验。</p>
            <p>设置为 [ best ] 加载原图（不推荐），置空时使用默认设置。</p>
            <p style="margin-bottom:0.5em">PS：B站推荐的视频封面长宽比为 16:9（非强制性标准）。</p>
            <p>格式：[ ${'${width}w_${height}h_${clip}c_${quality}q'} ]</p>
            <p>可省略部分参数，如 [ 320w_1q ] 表示「宽度 320 像素，高度自动，拉伸，压缩质量 1」</p>
            <p>- width - 图片宽度</p>
            <p>- height - 图片高度</p>
            <p>- clip - 1 裁剪，0 拉伸；默认 0</p>
            <p>- quality - 有损压缩参数，100 为无损；默认 100</p>
          </div>
        `
        msgbox = await display(msg)
        result = api.message.prompt(info, val)
        if (result !== null) {
          result = result.trim()
          if (result === '') {
            result = gm.configMap.customModeQuality.default
          }
          gm.config.customModeQuality = result
          GM_setValue('customModeQuality', result)
        }
        await close(msgbox)

        val = gm.config.customModeStyle
        msg = `
          <div style="line-height:1.6em">
            <p style="margin-bottom:0.5em">设置封面元素的样式。设置为 [disable] 禁用样式，置空时使用默认设置。</p>
            <p>这里提供几种目标效果以便拓宽思路：</p>
            <p>* 鼠标悬浮至封面元素上方时放大封面实现预览效果（图片质量应与放大后的尺寸匹配）。</p>
            <p>* 将内部 &lt;img&gt; 隐藏，使用 Base64 图片将封面元素改成任何样子。</p>
            <p>* 将封面元素做成透明层覆盖在视频投稿时间上，实现点击投稿时间下载封面的效果。</p>
            <p>* 将页面背景替换为视频封面，再加个滤镜也许还会有不错的设计感？</p>
            <p>* ......</p>
          </div>
        `
        msgbox = await display(msg)
        result = api.message.prompt(info, val)
        if (result !== null) {
          result = result.trim()
          if (result === '') {
            result = gm.configMap.customModeStyle.default
          } else {
            result = result.replace(/\s+/g, ' ')
          }
          gm.config.customModeStyle = result
          GM_setValue('customModeStyle', result)
        }
        await close(msgbox)
      }

      if (reload || api.message.confirm('配置工作模式完成，需刷新页面方可生效。是否立即刷新页面？')) {
        location.reload()
      }
    }
  }

  class Webpage {
    constructor() {
      this.method = {
        /**
         * 下载封面
         * @param {string} url 封面 URL
         * @param {string} [name='Cover'] 保存文件名
         */
        download(url, name) {
          name = name || 'Cover'
          const onerror = function(error) {
            if (error?.error == 'not_whitelisted') {
              api.message.alert('该封面的文件格式不在下载模式白名单中，从而触发安全限制导致无法直接下载。可修改脚本管理器的「下载模式」或「文件扩展名白名单」设置以放开限制。')
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
         * 下载图片
         * @param {HTMLElement} target 触发元素
         */
        addDownloadEvent(target) {
          if (!target._downloadEvent) {
            const _self = this
            // 此处必须用 mousedown，否则无法与动态获取封面的代码达成正确的联动
            target.addEventListener('mousedown', function(e) {
              if (target.loaded && gm.config.download && e.button == 0) {
                e.preventDefault()
                target.dispatchEvent(new Event('mouseleave'))
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
         * 提示错误信息
         * @param {HTMLElement} target 触发元素
         */
        addErrorEvent(target) {
          if (!target._errorEvent) {
            target.addEventListener('mousedown', function(e) {
              if (target.loaded) return
              if (e.button == 0 || e.button == 1) {
                e.preventDefault()
                api.message.create(gm.const.errorMsg)
              }
            })
            target._errorEvent = true
          }
        },

        /**
         * 设置封面
         * @param {HTMLElement} target 封面元素
         * @param {HTMLElement} preview 预览元素
         * @param {string} url 封面 URL
         */
        setCover(target, preview, url) {
          if (url) {
            target.title = gm.const.hintText
            target.href = url
            target.target = '_blank'
            target.loaded = true
            this.addDownloadEvent(target)
            if (target.img) {
              if (gm.runtime.realtimeQuality != 'best') {
                target.img.src = `${url}@${gm.runtime.realtimeQuality}.webp`
                target.img.lossless = url
              } else {
                target.img.src = url
              }
            }
            if (preview) {
              preview._needUpdate = true
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
              target.img.lossless = ''
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

          target.addEventListener('mouseenter', api.tool.debounce(async function() {
            this.mouseOver = true
            if (gm.config.preview) {
              if (preview._needUpdate) {
                await new Promise(resolve => {
                  preview.addEventListener('load', function() { resolve() }, { once: true })
                  preview.src = preview._src
                  preview._needUpdate = false
                })
                if (!this.mouseOver) return
              }
              preview.src && fade(true)
            }
          }, 200))
          target.addEventListener('mouseleave', api.tool.debounce(function() {
            this.mouseOver = false
            if (gm.config.preview) {
              !preview.mouseOver && fade(false)
            }
          }, 200))

          let startPos = null // 鼠标进入预览时的初始坐标
          preview.onmouseenter = function() {
            this.mouseOver = true
            startPos = null
          }
          preview.onmouseleave = function() {
            this.mouseOver = false
            setTimeout(() => {
              if (!target.mouseOver) {
                startPos = null
                fade(false)
              }
            }, 200)
          }
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
          return preview
        },

        /**
         * 创建实时封面元素
         * @async
         * @returns {HTMLElement}
         */
        async createRealtimeCover() {
          const ref = await api.wait.waitQuerySelector(gm.runtime.realtimeSelector)
          const cover = ref.insertAdjacentElement(gm.runtime.realtimePosition, document.createElement('a'))
          cover.id = `${gm.id}-realtime-cover`
          cover.img = cover.appendChild(document.createElement('img'))
          cover.img.addEventListener('error', function() {
            if (gm.runtime.realtimeQuality != 'best' && this.src != this.lossless) {
              if (gm.config.mode == gm.const.customMode) {
                api.message.create(`缩略图获取失败，使用原图进行替换！请检查「${gm.runtime.realtimeQuality}」是否为有效的图片质量参数。可能是正常现象，因为年代久远的视频封面有可能不支持缩略图。`, { ms: 4000 })
              } else {
                api.message.create('缩略图获取失败，使用原图进行替换！可能是正常现象，因为年代久远的视频封面有可能不支持缩略图。', { ms: 3000 })
              }
              api.logger.warn(['缩略图获取失败，使用原图进行替换！', this.src, this.lossless])
              this.src = this.lossless
            }
          })
          if (gm.runtime.realtimeStyle != 'disable') {
            api.dom.addStyle(gm.runtime.realtimeStyle)
          }
          return cover
        }
      }
    }

    async initVideo() {
      const _self = this
      const app = await api.wait.waitQuerySelector('#app')
      const atr = await api.wait.waitQuerySelector('#arc_toolbar_report') // 无论如何都卡一下时间
      await api.wait.waitForConditionPassed({
        condition: () => app.__vue__,
      })

      let cover = null
      if (gm.runtime.layer == 'legacy') {
        cover = document.createElement('a')
        cover.innerText = '获取封面'
        cover.className = 'appeal-text'
        // 确保与其他脚本配合时相关 UI 排列顺序不会乱
        const gm395456 = atr.querySelector('[id|=gm395456]')
        if (gm395456) {
          atr.insertBefore(cover, gm395456)
        } else {
          atr.appendChild(cover)
        }
      } else {
        cover = await _self.method.createRealtimeCover()
      }
      const preview = gm.config.preview && _self.method.createPreview(cover)

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
          const main = async function(event) {
            try {
              const vid = _self.method.getVid()
              if (cover._cover_id == vid.id) return
              // 在异步等待前拦截，避免逻辑倒置
              event.preventDefault()
              event.stopPropagation()
              const url = await getCover(vid)
              _self.method.setCover(cover, preview, url)
            } catch (e) {
              event.preventDefault()
              event.stopPropagation()
              _self.method.setCover(cover, preview, false)
              api.logger.error(e)
            }

            // 需全面接管一切用户交互引起的行为，默认链接点击行为除外
            removeEventListeners()
            if (event.type == 'mousedown') {
              if (event.button == 0) {
                if (gm.config.download || !cover.loaded) {
                  const evt = new Event('mousedown') // 新建一个事件而不是复用 event，以避免意外情况
                  evt.button = 0
                  cover.dispatchEvent(evt) // 无法触发链接点击跳转
                } else {
                  window.open(cover.href)
                }
              } else if (event.button == 1) {
                if (cover.loaded) {
                  window.open(cover.href)
                }
              }
            } else if (event.type == 'mouseenter') {
              cover.dispatchEvent(new Event('mouseenter'))
            }
            addEventListeners()
          }

          // lazy loading；捕获期执行，确保优先于其他处理器
          const addEventListeners = () => {
            cover.addEventListener('mousedown', main, true)
            if (gm.config.preview) {
              cover.addEventListener('mouseenter', main, true)
            }
          }
          const removeEventListeners = () => {
            cover.removeEventListener('mousedown', main, true)
            if (gm.config.preview) {
              cover.removeEventListener('mouseenter', main, true)
            }
          }
          addEventListeners()
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
              method: 'GET',
              url: gm.url.api_videoInfo(vid.id, vid.type),
            })
            cover._cover_url = JSON.parse(resp.responseText).data.pic ?? ''
            cover._cover_id = vid.id
          }
          return cover._cover_url
        }
      }
    }

    async initBangumi() {
      const _self = this
      const app = await api.wait.waitQuerySelector('#app')
      const tm = await api.wait.waitQuerySelector('#toolbar_module') // 无论如何都卡一下时间
      await api.wait.waitForConditionPassed({
        condition: () => app.__vue__,
      })

      let cover = null
      if (gm.runtime.layer == 'legacy') {
        cover = document.createElement('a')
        cover.innerText = '获取封面'
        cover.className = `${gm.id}-bangumi-cover-btn`
        tm.appendChild(cover)
      } else {
        cover = await _self.method.createRealtimeCover()
      }
      const preview = gm.config.preview && _self.method.createPreview(cover)

      if (gm.config.bangumiSeries) {
        const setCover = img => _self.method.setCover(cover, preview, img.src.replace(/@[^@]*$/, ''))
        api.wait.waitQuerySelector('.media-cover img').then(img => {
          setCover(img)
          const ob = new MutationObserver(() => setCover(img))
          ob.observe(img, { attributeFilter: ['src'] })
        }).catch(e => {
          _self.method.setCover(cover, preview, false)
          api.logger.error(e)
        })
      } else {
        if (gm.runtime.layer == 'legacy') {
          const main = async function(event) {
            try {
              const params = getParams()
              if (cover._cover_id == params.paster.aid) return
              const url = getCover(params)
              _self.method.setCover(cover, preview, url)
            } catch (e) {
              _self.method.setCover(cover, preview, false)
              api.logger.error(e)
            } finally {
              event.preventDefault()
              event.stopPropagation()
            }

            // 需全面接管一切用户交互引起的行为，默认链接点击行为除外
            removeEventListeners()
            if (event.type == 'mousedown') {
              if (event.button == 0) {
                if (gm.config.download || !cover.loaded) {
                  const evt = new Event('mousedown') // 新建一个事件而不是复用 event，以避免意外情况
                  evt.button = 0
                  cover.dispatchEvent(evt) // 无法触发链接点击跳转
                } else {
                  window.open(cover.href)
                }
              } else if (event.button == 1) {
                if (cover.loaded) {
                  window.open(cover.href)
                }
              }
            } else if (event.type == 'mouseenter') {
              cover.dispatchEvent(new Event('mouseenter'))
            }
            addEventListeners()
          }

          // lazy loading；use capture，确保优先于其他监听器执行
          const addEventListeners = () => {
            cover.addEventListener('mousedown', main, true)
            if (gm.config.preview) {
              cover.addEventListener('mouseenter', main, true)
            }
          }
          const removeEventListeners = () => {
            cover.removeEventListener('mousedown', main, true)
            if (gm.config.preview) {
              cover.removeEventListener('mouseenter', main, true)
            }
          }
          addEventListeners()
        } else {
          const main = async function() {
            try {
              const params = getParams()
              if (cover._cover_id == params.paster.aid) return
              const url = getCover(params)
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
        const getCover = (params = getParams()) => {
          if (cover._cover_id != params.paster?.aid) {
            cover._cover_url = params.epCover
            cover._cover_id = params.id
          }
          return cover._cover_url
        }
      }
    }

    async initLive() {
      const _self = this
      let win = unsafeWindow
      let hiVm = await api.wait.waitQuerySelector('#head-info-vm, #player-ctnr')
      if (hiVm.id == 'player-ctnr') {
        const frame = await api.wait.waitQuerySelector('iframe', hiVm)
        win = frame.contentWindow
        hiVm = await api.wait.waitQuerySelector('#head-info-vm', frame.contentDocument)
        _self.addStyle(frame.contentDocument)
      }
      const rc = await api.wait.waitQuerySelector('.right-ctnr, .upper-right-ctnr', hiVm) // 无论如何都卡一下时间
      await api.wait.waitForConditionPassed({
        condition: () => hiVm.__vue__,
      })

      const cover = document.createElement('a')
      cover.innerText = '获取封面'
      cover.className = `${gm.id}-live-cover-btn`
      rc.insertBefore(cover, rc.firstChild)
      const preview = gm.config.preview && _self.method.createPreview(cover)
      const url = getCover(win)
      _self.method.setCover(cover, preview, url)

      function getCover(win) {
        return win.__NEPTUNE_IS_MY_WAIFU__?.roomInfoRes?.data?.room_info?.cover ?? win.__STORE__?.baseInfoRoom?.coverUrl
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
          z-index: 142857;
          max-width: 60vw; /* 自适应宽度和高度 */
          max-height: 100vh;
          display: none;
          opacity: 0;
          transition: opacity ${gm.const.fadeTime}ms ease-in-out;
          cursor: pointer;
        }
      `, doc)
    }
  }

  window.addEventListener('load', async function() {
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
  })
})()
