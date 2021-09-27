# 论如何实现一个完善的 `urlchange` 事件

## 理想

### 基本原理

[How to detect if URL has changed after hash in JavaScript](https://stackoverflow.com/a/52809105)

### 在 `window` 上分发事件的特殊情况

[Event bubbles before captured on `window`](https://stackoverflow.com/questions/69342317)

### 事件处理器属性的执行时间

[What is the order of inline onclick vs addeventlistener and why?](https://stackoverflow.com/a/49806959)

### 用户脚本检测重复执行的最佳实践

[How to detect that a file has been `@require` in other scripts?](https://github.com/Tampermonkey/tampermonkey/issues/1339)

## 现实

由于 Tampermonkey 使用 `defineProperty` 定义了沙箱 `window` 上的 `onurlchange` 属性——尽管目前 Tampermonkey 定义的这个属性是可写的，但为了向前兼容性—— `Userscript#initUrlchangeEvent` 并没有实现出来一个真正完善的 `urlchange` 事件。不过，估计也没有人在意 `window.onurlchange` 应该排在第几执行就是了。

不过，在探寻这一事件实现的同时，解决了困惑了我一年多的 `unsafeWindow` 问题：[unsafeWindow 二三事](./unsafeWindow%20二三事.md)。总的来说，赚大了。
