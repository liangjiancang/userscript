# URL 匹配

Tampermonkey `@include`、`@exclude` 使用到的实际「URL」为 `location.origin + location.pathname + location.search`。也就是说，包含查询参数，但不含锚点。

注意，URL 规则中查询参数在前，锚点在后。若互若位置，则认为查询参数不存在，整个 `search` 会被认为是锚点的一部分。

而 Violentmonkey 匹配用到的实际「URL」 为 `location.href`，会检测包括查询参数及锚点在内的一切内容。总之，Tampermonkey 和 Violentmonkey 在 URL 匹配方面有偏差。本项目以 Tampermonkey 为准，不作兼容性处理。

## 例

### `https://www.bilibili.com/watchlater/`

#### 匹配

* `https://www.bilibili.com/watchlater/#/list`

  -> `https://www.bilibili.com/watchlater/`

  锚点为 `/list`

* `https://www.bilibili.com/watchlater/#/list?a=1`

  -> `https://www.bilibili.com/watchlater/`

  锚点为 `/list?a=1`

#### 不匹配

* `https://www.bilibili.com/watchlater/?a=1#/list`

  -> `https://www.bilibili.com/watchlater/?a=1`

  锚点为 `/list`
