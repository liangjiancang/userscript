/* exported ObjectInspector */
/**
 * 对象观察器
 * 
 * 根据 `regex` 在 `depth` 层深度内找到匹配 `regex` 的属性
 * @version 1.2.0.20210720
 */
class ObjectInspector {
  /**
   * @param {Object} obj 默认观察对象
   * @param {RegExp} regex 默认匹配正则表达式
   * @param {Object} [config] 配置
   * @param {number} [config.depth=5] 默认观察深度
   * @param {boolean} [config.inspectKey=true] 观察时是否匹配键名
   * @param {boolean} [config.inspectValue=true] 观察时是否匹配键值
   * @param {RegExp} [config.exRegex=null] 用于排除匹配键名的正则表达式
   * @param {number} [config.exLongStrLen=128] 超过此长度的字符串移除

   */
  constructor(obj, regex, config) {
    this.config = {
      obj: obj,
      regex: regex,
      depth: 5,
      inspectKey: true,
      inspectValue: true,
      exRegex: null,
      ...config,
    }
  }

  /**
   * 观察对象，根据 `regex` 在 `depth` 层深度内找到所有键或者值匹配 `regex` 的属性
   * @param {Object} [config] 配置，没有提供的项使用默认值
   * @param {Object} [config.obj] 观察对象
   * @param {RegExp} [config.regex] 匹配正则表达式
   * @param {number} [config.depth] 观察深度
   * @param {boolean} [config.inspectKey] 观察时是否匹配键名
   * @param {boolean} [config.inspectValue] 观察时是否匹配键值
   * @param {RegExp} [config.exRegex] 用于排除匹配键名的正则表达式
   * @param {number} [config.exLongStrLen] 超过此长度的字符串移除，设为假值表示无限制
   * @returns {Object} 封装匹配 `regex` 属性的对象
   */
  inspect(config) {
    config = { ...this.config, ...config }
    const depth = config.depth
    const result = {}
    if (depth > 0) {
      const objSet = new Set()
      const prevKey = ''
      this._inspectInner(config, depth, result, prevKey, objSet)
    }
    return result
  }

  /**
   * `inspect` 的内部递归处理过程
   * @private
   * @param {Object} config 配置，没有提供的项使用默认值
   * @param {Object} config.obj 观察对象
   * @param {RegExp} config.regex 匹配正则表达式
   * @param {boolean} config.inspectKey 观察时是否匹配键名
   * @param {boolean} config.inspectValue 观察时是否匹配键值
   * @param {RegExp} [config.exRegex] 用于排除匹配键名的正则表达式
   * @param {number} [config.exLongStrLen] 超过此长度的字符串移除
   * @param {number} depth 当前深度
   * @param {Object} result 处理结果的存储对象
   * @param {string} prevKey 描述当前观察对象 `obj` 与根观察对象 `root` 的关系：`obj = _.at(root, [prevKey])`
   * @param {Set} objSet 集合，包含之前已经观察过的对象，避免重复遍历
   */
  _inspectInner({ obj, regex, inspectKey, inspectValue, exRegex, exLongStrLen }, depth, result, prevKey, objSet) {
    if (!obj || depth == 0) return
    for (const key in obj) {
      if (exRegex?.test(key)) continue
      if (inspectKey && regex.test(key)) {
        result[prevKey + key] = obj[key]
      } else {
        try {
          const value = obj[key]
          if (value && (typeof value == 'object') || typeof value == 'function') {
            if (inspectValue && regex.test(value.toString())) {
              result[prevKey + key] = value
            } else if (depth > 1) {
              if (!objSet.has(value)) {
                objSet.add(value)
                this._inspectInner({ obj: value, regex, inspectKey, inspectValue, exRegex, exLongStrLen }, depth - 1, result, `${prevKey + key}.`, objSet)
              }
            }
          } else {
            let sVal = value
            if (typeof value == 'string') {
              if (depth > 1) {
                try {
                  const json = JSON.parse(value)
                  if (json) { // exclude 'null' and 'undefined'
                    this._inspectInner({ obj: json, regex, inspectKey, inspectValue, exRegex, exLongStrLen }, depth - 1, result, `${prevKey + key}{JSON-PARSE}:`, objSet)
                    continue
                  }
                } catch (e) { /* nothing to do */ }
              }
              if (value.length > exLongStrLen) continue
            } else if (typeof value == 'symbol') {
              sVal = String(value)
            }
            if (inspectValue && regex.test(sVal)) {
              result[prevKey + key] = value
            }
          }
        } catch (e) {
          // value that cannot be accessed
        }
      }
    }
  }
}
