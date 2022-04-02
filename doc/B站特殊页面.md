# B站特殊页面

## 排除规则

常用排除规则如下。注意，如果能脚本只需在顶层执行，添加 `@noframes` 即可避免大部分问题，未必需要以下规则。

| 排除规则                                 | 说明                                     |
| ---------------------------------------- | ---------------------------------------- |
| `*://www.bilibili.com/watchlater/`       | 稍后再看列表页面（及旧稍后再看播放页面） |
| `*://www.bilibili.com/page-proxy/*`      | 主站 frame                               |
| `*://t.bilibili.com/pages/nav/index_new` | 旧版动态入口弹出面板页面                 |
| `*://t.bilibili.com/h5/*`                | 动态 frame（除旧版动态入口弹出面板）     |
| `*://t.bilibili.com/*/*`                 | 动态 frame                               |
| `*://live.bilibili.com/`                 | 直播主页，没有必要在此执行直播间逻辑     |
| `*://live.bilibili.com/?*`               | 直播主页（带查询参数）                   |
| `*://live.bilibili.com/*/*`              | 直播间 frame                             |
| `*://message.bilibili.com/*/*`           | 消息 frame                               |

## 特殊页面

以下是可能需要排除匹配的特殊页面，部分非特殊页面也应根据情况自行排除。

### `www.bilibili.com`

* <https://www.bilibili.com/watchlater/#/list>
* <https://www.bilibili.com/page-proxy/game-nav.html>

### `t.bilibili.com`

* <https://t.bilibili.com/pages/nav/index_new>
* <https://t.bilibili.com/h5/dynamic/specification>

### `live.bilibili.com`

* <https://live.bilibili.com/blanc/*>
* <https://live.bilibili.com/blackboard/dropdown-menu.html>
* <https://live.bilibili.com/p/html/live-web-mng/index.html>

### `message.bilibili.com`

* <https://message.bilibili.com/pages/nav/index_new_pc_sync>

### `manga.bilibili.com`

* <https://manga.bilibili.com/eden/bilibili-nav-panel.html>
