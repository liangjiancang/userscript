# `unsafeWindow` 二三事

`unsafeWindow` 是个神奇的东西。如果你看 Tampermonkey 文档，会看到有 `@grant unsafeWindow` 的说明——这意味着需要声明了 `unsafeWindow` 才能使用，才能在沙箱中访问到真实的 `window` 对象。而且，如果脚本声明了 `unsafeWindow`，Tampermonkey 还会在这个脚本旁边标注「该项有对网页的完整访问权限」。然而事实真的是这样吗？

实际上，无论是在 Tampermonkey 还是 Violentmonkey 中，`unsafeWindow` 都是不需要声明就可以使用的。那岂不是对那些老老实实声明的脚本很不公平？毕竟「该项有对网页的完整访问权限」并不是什么好的标记——也不排除有的开发者认为点亮一排标记很炫就是了。

之前我都是老老实实地写 `@grant unsafeWindow` 声明的，毕竟要对用户负责，直到——在考虑如何完善 `urlchange` 事件的实现时，不得不重新审视起了不同用户脚本间应该如何恰当地「交流」的问题。

接下来，问题就来到：通过 `unsafeWindow` 交流合理吗？因为，如果你考虑过这个问题的话，你会发现尽管在 `unsafeWindow` 上做标记有很多问题，但好像又没有比这更好的方式了。——1. 在其他全局对象上做标记？有什么全局对象能比 `unsafeWindow` 更合适的，凭什么舍 `unsafeWindow` 而择它呢？2. 在 DOM 上插入结点作为标记？不行，这也太丑陋了。如果真要这么搞，为什么我不舍弃 `@require` 改用 `@resource` 引入库文件呢，插入 `<script>` 本身就是标记——这样还能实现理论更优的库导入机制——然而 `@resource` 对沙箱化的毁坏是极为邪恶的存在——当然还能 `new Function(GM_getResourceText(...))()` 这样玩，不过好像这跟现在讨论的话题没什么关系。

如果在 `unsafeWindow` 上做标记是合理的，那么没有声明 `unsafeWindow` 的脚本又该何去何从呢？我们已经知道声明是不必要的，但在这种情况下访问 `unsafeWindow` 真不算破坏规则吗？

实际解决方案有很多，但都很丑陋。比如的 `UserscriptAPIBase#initUrlchangeEvent()` 之前是在 `history` 上做标记的，毕竟这个功能跟 `history` 相关嘛。但是又该如何保证，Tampermonkey / Violentmonkey 在未来的更新中，不会把 `history` 像 `window` 那样做成沙箱变量呢？

实在是解决不了，然后被迫去 Tampermonkey 的 repo 提了个 Issue [How to detect that a file has been `@require` in other scripts?](https://github.com/Tampermonkey/tampermonkey/issues/1339)。然后，得到的回答是——包括 Tampermonkey 开发者的回答—— `@grant unsafeWindow` 是过去式，「该项有对网页的完整访问权限」是一条不正确的提示……坑爹呢这是！

那所有问题都迎刃而解了。既然所有脚本都有权利去访问 `unsafeWindow`（并且声明是不必要的，而且现在在我看来不应该声明），那么标记就应该做在 `unsafeWindow` 上。而且，[@7nik](https://github.com/7nik) 提供了一个用 Symbol 作键的思路，那么标记做起来就更加没有负罪感了。

现在，让我们来看一下最终的方案：

```js
unsafeWindow[Symbol.for('ExampleScriptExecuted')] = true
```

---

`urlchange` 事件实现本身也很有意思，见 [论如何实现一个完善的 urlchange 事件](论如何实现一个完善的%20urlchange%20事件.md)。
