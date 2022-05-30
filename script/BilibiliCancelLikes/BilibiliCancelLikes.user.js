// ==UserScript==
// @name            B站点赞批量取消
// @version         1.1.1.20220530
// @namespace       laster2800
// @author          Laster2800
// @description     取消对于某个UP主的所有点赞
// @icon            https://www.bilibili.com/favicon.ico
// @homepageURL     https://greasyfork.org/zh-CN/scripts/445754
// @supportURL      https://greasyfork.org/zh-CN/scripts/445754/feedback
// @license         LGPL-3.0
// @noframes
// @include         *://space.bilibili.com/*
// @require         https://greasyfork.org/scripts/409641-userscriptapi/code/UserscriptAPI.js?version=974252
// @require         https://greasyfork.org/scripts/431998-userscriptapidom/code/UserscriptAPIDom.js?version=1005139
// @require         https://greasyfork.org/scripts/432000-userscriptapimessage/code/UserscriptAPIMessage.js?version=973744
// @require         https://greasyfork.org/scripts/432002-userscriptapiwait/code/UserscriptAPIWait.js?version=1035042
// @require         https://greasyfork.org/scripts/432003-userscriptapiweb/code/UserscriptAPIWeb.js?version=977807
// @grant           GM_xmlhttpRequest
// @grant           GM_registerMenuCommand
// @connect         api.bilibili.com
// @compatible      edge 版本不小于 85
// @compatible      chrome 版本不小于 85
// @compatible      firefox 版本不小于 90
// ==/UserScript==

(function() {
  'use strict'

  const gm = {
    id: 'gm445754',
    fn: {
      async addButton() {
        const message = await api.wait.$('.h .h-action .h-message')
        const button = document.createElement('div')
        button.textContent = '取消点赞'
        button.className = 'h-f-btn'
        button.addEventListener('click', this.start)
        message.after(button)
      },
      addScriptMenu() {
        GM_registerMenuCommand('取消点赞', this.start)
      },
      async start() {
        const ps = 30
        const delay = 300
        const dTotal = 5
        const uid = await api.message.prompt('请输入待取消点赞UP主的 UID：', /\/(\d+)([#/?]|$)/.exec(location.pathname)?.[1])
        if (/^\d+$/.test(uid)) {
          let start = await api.message.prompt(`从最新投稿的第几页开始执行（每页 ${ps} 项）？一般不需要调整，除非需要继续之前被中断的任务。`, '1')
          if (!/^\d+$/.test(start)) {
            start = 1
          } else {
            start = Number.parseInt(start)
          }
          const total = await api.message.prompt(`共执行多少页（每页 ${ps} 项）？注意：过于旧远的点赞状态其实会被B站丢弃（详见 README），翻老视频其实没什么意义（除非你近期给老视频点了赞）。建议使用默认值，除非目标UP主是个投稿狂魔。`, dTotal)
          const end = start + ((/^\d+$/.test(total) && Number.parseInt(total) > 0) ? Number.parseInt(total) : dTotal) - 1
          const result = await api.message.confirm(`是否要取消对UP主 UID ${uid} 第 ${start} ~ ${end} 页的所有点赞，该操作不可撤销！`)
          if (result) {
            api.message.alert(`正在取消对UP主 UID ${uid} 的点赞。执行过程详见控制台，执行完毕前请勿关闭当前标签页或将当前标签页置于后台！`)
            gm.fn.cancelDislikes(uid, start, end, delay)
          }
        } else if (uid !== null) {
          api.message.alert('UID 格式错误。')
        }
      },
      async cancelDislikes(uid, start, end, delay = 300) {
        const csrf = this.getCSRF()
        let cancelCnt = 0
        const ps = 30
        let pn = start
        let count = -1
        let maxPn = 1
        api.logger.info(`START: UID = ${uid}, START = ${start}, END = ${end}`)
        do {
          api.logger.info(`PAGE: ${pn} / ${count < 0 ? '?' : maxPn}`)
          let resp = await api.web.request({
            method: 'GET',
            url: `http://api.bilibili.com/x/space/arc/search?mid=${uid}&pn=${pn}&ps=${ps}`,
          }, { check: r => r.code === 0 })
          if (count < 0) {
            count = resp.data.page.count
            maxPn = Math.ceil(count / ps)
            if (end > maxPn) {
              end = maxPn
            }
            if (pn > maxPn) {
              pn += 1
              break
            }
          }
          const { vlist } = resp.data.list
          for (const item of vlist) {
            resp = await api.web.request({
              method: 'GET',
              url: `http://api.bilibili.com/x/web-interface/archive/has/like?bvid=${item.bvid}`,
            }, { check: r => r.code === 0 })
            if (resp.data !== 0) { // 已点赞视频
              const sp = new URLSearchParams()
              sp.append('bvid', item.bvid)
              sp.append('like', '2') // 取消点赞
              sp.append('csrf', csrf)
              const r = await api.web.request({
                method: 'POST',
                url: 'http://api.bilibili.com/x/web-interface/archive/like',
                data: sp,
              })
              if (r.code === 0) {
                api.logger.info(`CANCEL: ${item.title} (${item.bvid})`)
                cancelCnt += 1
              } else {
                api.logger.error(`ERROR: ${item.title} (${item.bvid})`, r ?? '未知错误')
              }
            }
            await this.randomDelay(delay)
          }
        } while (++pn < end)
        api.logger.info(`COMPLETE: 共取消点赞 ${cancelCnt} 次，执行范围为第 ${start} ~ ${pn - 1} 页`)
        api.message.alert(`取消点赞执行完毕，共取消点赞 ${cancelCnt} 次，详细信息请查看控制台。`)
      },
      async randomDelay(exp) {
        await new Promise(resolve => setTimeout(resolve, exp * (Math.random() * 0.5 + 0.75)))
      },
      getCSRF() {
        return document.cookie.replace(/(?:(?:^|.*;\s*)bili_jct\s*=\s*([^;]*).*$)|^.*$/, '$1')
      },
    },
  }

  /* global UserscriptAPI */
  const api = new UserscriptAPI({
    id: gm.id,
    label: GM_info.script.name,
  })

  gm.fn.addButton()
  gm.fn.addScriptMenu()
})()
