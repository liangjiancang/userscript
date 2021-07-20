// ==UserScript==
// @name            debug
// @version         debug-version
// @namespace       debug-namespace
// @author          debug-author
// @description     Debug local script
// @require         ...
// @require         file:///${scriptPath}
// @[otherAttrs]    [Same as the target script]
// ==/UserScript==

/**
 * 该本地调试方案在 Tampermonkey 中有效，在 Violentmonkey 中无效，在其他脚本管理器中是否有效未知。
 *
 * 首先，在浏览器扩展管理器中修改脚本管理器的属性，允许其访问文件 URL。然后复制以上内容建立一个新的脚本，将 ${scriptPath} 替换为要调试的脚本路径，然后将目标脚本的其他脚本属性值复制进来。
 *
 * 注意：引入目标调试脚本的 `@require file:///${scriptPath}` 必须放在所有 `@require` 属性行的最后，以保证加载顺序与原脚本一致！
 *
 * @file 用户脚本本地调试方案
 * @see https://stackoverflow.com/a/55568502/7152981
 */
