/* exported PushQueue */
/**
 * PushQueue
 *
 * 推入队列，循环数组实现。
 * @template T 数据类型
 * @version 1.0.0.20210925
 * @author Laster2800
 * @see {@link https://gitee.com/liangjiancang/userscript/tree/master/lib/PushQueue PushQueue}
 */
class PushQueue {
  /** @type {number} 起始元素位置（指向起始元素后方） */
  index = 0
  /** @type {number} 队列长度 */
  size = 0
  /** @type {number} 最大长度 */
  maxSize = 0
  /** @type {number} 容量 */
  capacity = 0
  /** @type {T[]} 内部数据 */
  data = null

  /**
   * @param {number} maxSize 队列的最大长度，达到此长度后继续推入数据，将舍弃末尾处的数据
   * @param {number} [capacity=maxSize] 容量，即循环数组的长度，不能小于 maxSize
   */
  constructor(maxSize, capacity) {
    this.maxSize = maxSize
    if (!capacity || capacity < maxSize) {
      capacity = maxSize
    }
    this.capacity = capacity
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
    if (this.maxSize < this.capacity && this.size === this.maxSize) { // maxSize 等于 capacity 时资源刚好完美利用，不必回收资源
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

  /**
   * 标准迭代器：`item`
   * @returns {IterableIterator<T>}
   */
  [Symbol.iterator]() {
    const iterator = this.entries()
    return {
      next: () => {
        const n = iterator.next()
        if (!n.done) {
          n.value = n.value[1]
        }
        return n
      },
    }
  }

  /**
   * 迭代器：`[index, item]`
   * @returns {IterableIterator<[index: number, item: T]>}
   */
  entries() {
    let current = this.index - 1
    let end = this.index - this.size
    return {
      next: () => {
        if (current < 0 && end < 0) {
          current += this.capacity
          end += this.capacity
        }
        if (current >= end && current >= 0) {
          const n = { value: [current, this.data[current]], done: false }
          current -= 1
          return n
        } else {
          return { done: true }
        }
      },

      [Symbol.iterator]() { return this },
    }
  }
}
