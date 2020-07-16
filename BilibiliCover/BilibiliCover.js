// ==UserScript==
// @id             BilibiliCover@Laster2800
// @name           B站封面获取
// @version        3.0.2
// @namespace      laster2800
// @author         Laster2800
// @description    B站视频播放页、番剧播放页、直播间添加获取封面的按钮
// @include        *://www.bilibili.com/video/*
// @include        *://www.bilibili.com/bangumi/play/*
// @include        *://live.bilibili.com/*
// @exclude        *://live.bilibili.com/
// @exclude        *://live.bilibili.com/p/html/live-web-mng/*
// @grant          GM_addStyle
// ==/UserScript==

(function() {
    if (/\/video\//.test(location.href)) {
        executeAfterConditionPass({
            condition: () => {
                var app = document.querySelector('#app')
                var vueLoad = app && app.__vue__
                if (!vueLoad) {
                    return false
                }
                return document.querySelector('#arc_toolbar_report')
            },
            callback: addVideoBtn,
        })
    } else if (/\/bangumi\/play\//.test(location.href)) {
        executeAfterConditionPass({
            condition: () => {
                var app = document.querySelector('#app')
                var vueLoad = app && app.__vue__
                if (!vueLoad) {
                    return false
                }
                return document.querySelector('#toolbar_module')
            },
            callback: addBangumiBtn,
        })
    } else if (/live\.bilibili\.com\/\d/) {
        executeAfterConditionPass({
            condition: () => {
                var hiVm = document.querySelector('#head-info-vm')
                var vueLoad = hiVm && hiVm.__vue__
                if (!vueLoad) {
                    return false
                }
                return hiVm.querySelector('.room-info-down-row')
            },
            callback: addLiveBtn,
        })
    }
})()

function addVideoBtn(atr) {
    var coverMeta = document.querySelector('head meta[itemprop=image]')
    var coverUrl = coverMeta && coverMeta.content
    var cover = document.createElement('a')
    var errorMsg = '获取失败，若非网络问题请提供反馈'
    cover.innerText = '获取封面'
    cover.target = '_blank'
    if (coverUrl) {
        cover.href = coverUrl
    } else {
        cover.onclick = () => alert(errorMsg)
    }
    cover.title = coverUrl || errorMsg
    cover.className = 'appeal-text'
    atr.appendChild(cover)
}

function addBangumiBtn(tm) {
    GM_addStyle(`
    .cover_btn {
        float: right;
        cursor: pointer;
        font-size: 12px;
        margin-right: 16px;
        line-height: 36px;
        color: #505050;
    }
    .cover_btn:hover {
        color: #00a1d6;
    }`)
    var coverMeta = document.querySelector('head meta[property="og:image"]')
    var coverUrl = coverMeta && coverMeta.content
    var cover = document.createElement('a')
    var errorMsg = '获取失败，若非网络问题请提供反馈'
    cover.innerText = '获取封面'
    cover.target = '_blank'
    if (coverUrl) {
        cover.href = coverUrl
    } else {
        cover.onclick = () => alert(errorMsg)
    }
    cover.title = coverUrl || errorMsg
    cover.className = 'cover_btn'
    tm.appendChild(cover)
}

function addLiveBtn(ridr) {
    GM_addStyle(`
     .cover_btn {
        cursor: pointer;
        margin-left: 18px;
        color: rgb(153, 153, 153);
    }
    .cover_btn:hover {
        color: #23ade5;
    }`)
    var nw = __NEPTUNE_IS_MY_WAIFU__ // 此window非彼window，不能通过window获取
    var bir = nw && nw.baseInfoRes
    var data = bir && bir.data
    var coverUrl = data && data.user_cover
    var kfUrl = data && data.keyframe
    var cover = document.createElement('a')
    cover.innerText = '获取封面'
    cover.target = '_blank'
    if (coverUrl) {
        cover.href = coverUrl
        cover.title = coverUrl
    } else if (kfUrl) {
        cover.href = kfUrl
        cover.title = '直播间没有设置封面，或者因不明原因无法获取到封面，点击获取关键帧：\n' + kfUrl
    } else {
        var errorMsg = '获取失败，若非网络问题请提供反馈'
        cover.onclick = () => alert(errorMsg)
        cover.title = errorMsg
    }
    cover.className = 'cover_btn'
    ridr.appendChild(cover)
}

/**
 * 在条件满足后执行操作
 *
 * 当条件满足后，如果不存在终止条件，那么直接执行 callback(result)。
 *
 * 当条件满足后，如果存在终止条件，且 stopTimeout 大于 0，则还会在接下来的 stopTimeout 时间内判断是否满足终止条件，称为终止条件的二次判断。
 * 如果在此期间，终止条件通过，则表示依然不满足条件，故执行 stopCallback() 而非 callback(result)。
 * 如果在此期间，终止条件一直失败，则顺利通过检测，执行 callback(result)。
 *
 * @param {Object} [options={}] 选项
 * @param {Function} [options.condition] 条件，当 condition() 返回的 result 为真值时满足条件
 * @param {Function} [options.callback] 当满足条件时执行 callback(result)
 * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
 * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
 * @param {Function} [options.onTimeout] 检测超时时执行 onTimeout()
 * @param {Function} [options.stopCondition] 终止条件，当 stopCondition() 返回的 stopResult 为真值时终止检测
 * @param {Function} [options.stopCallback] 终止条件达成时执行 stopCallback()（包括终止条件的二次判断达成）
 * @param {number} [options.stopInterval=50] 终止条件二次判断期间的检测时间间隔（单位：ms）
 * @param {number} [options.stopTimeout=0] 终止条件二次判断期间的检测超时时间（单位：ms）
 */
function executeAfterConditionPass(options) {
    var defaultOptions = {
        condition: () => true,
        callback: result => console.log(result),
        interval: 100,
        timeout: 5000,
        onTimeout: null,
        stopCondition: null,
        stopCallback: null,
        stopInterval: 50,
        stopTimeout: 0,
    }
    var o = {
        ...defaultOptions,
        ...options
    }
    if (!o.callback instanceof Function) {
        return
    }

    var cnt = 0
    var maxCnt = o.timeout / o.interval
    var tid = setInterval(() => {
        var result = o.condition()
        var stopResult = o.stopCondition && o.stopCondition()
        if (stopResult) {
            clearInterval(tid)
            o.stopCallback instanceof Function && o.stopCallback()
        } else if (++cnt > maxCnt) {
            clearInterval(tid)
            o.onTimeout instanceof Function && o.onTimeout()
        } else if (result) {
            clearInterval(tid)
            if (o.stopCondition && o.stopTimeout > 0) {
                executeAfterConditionPass({
                    condition: o.stopCondition,
                    callback: o.stopCallback,
                    interval: o.stopInterval,
                    timeout: o.stopTimeout,
                    onTimeout: () => o.callback(result)
                })
            } else {
                o.callback(result)
            }
        }
    }, o.interval)
}

/**
 * 在元素加载完成后执行操作
 *
 * 当元素加载成功后，如果没有设置终止元素选择器，那么直接执行 callback(element)。
 *
 * 当元素加载成功后，如果没有设置终止元素选择器，且 stopTimeout 大于 0，则还会在接下来的 stopTimeout 时间内判断终止元素是否加载成功，称为终止元素的二次加载。
 * 如果在此期间，终止元素加载成功，则表示依然不满足条件，故执行 stopCallback() 而非 callback(element)。
 * 如果在此期间，终止元素加载失败，则顺利通过检测，执行 callback(element)。
 *
 * @param {Object} [options={}] 选项
 * @param {Function} [options.selector] 该选择器指定要等待加载的元素 element
 * @param {Function} [options.callback] 当 element 加载成功时执行 callback(element)
 * @param {number} [options.interval=100] 检测时间间隔（单位：ms）
 * @param {number} [options.timeout=5000] 检测超时时间，检测时间超过该值时终止检测（单位：ms）
 * @param {Function} [options.onTimeout] 检测超时时执行 onTimeout()
 * @param {Function} [options.stopCondition] 该选择器指定终止元素 stopElement，若该元素加载成功则终止检测
 * @param {Function} [options.stopCallback] 终止元素加载成功后执行 stopCallback()（包括终止元素的二次加载）
 * @param {number} [options.stopInterval=50] 终止元素二次加载期间的检测时间间隔（单位：ms）
 * @param {number} [options.stopTimeout=0] 终止元素二次加载期间的检测超时时间（单位：ms）
 */
function executeAfterElementLoad(options) {
    var defaultOptions = {
        selector: '',
        callback: el => console.log(el),
        interval: 100,
        timeout: 5000,
        onTimeout: null,
        stopSelector: null,
        stopCallback: null,
        stopInterval: 50,
        stopTimeout: 0,
    }
    var o = {
        ...defaultOptions,
        ...options
    }
    executeAfterConditionPass({
        ...o,
        condition: () => document.querySelector(o.selector),
        stopCondition: o.stopSelector && (() => document.querySelector(o.stopSelector)),
    })
}