// ==UserScript==
// @name            Greasy Fork URL 脚本名称清理
// @version         1.0.1.20210918
// @namespace       laster2800
// @author          Laster2800
// @description     清理 Greasy Fork URL 中的脚本名称
// @icon            data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3ggEBCQHM3fXsAAAAVdJREFUOMudkz2qwkAUhc/goBaGJBgUtBCZyj0ILkpwAW7Bws4yO3AHLiCtEFD8KVREkoiFxZzX5A2KGfN4F04zMN+ce+5c4LMUgDmANYBnrnV+plBSi+FwyHq9TgA2LQpvCiEiABwMBtzv95RSfoNEHy8DYBzHrNVqVEr9BWKcqNFoxF6vx3a7zc1mYyC73a4MogBg7vs+z+czO50OW60Wt9stK5UKp9Mpj8cjq9WqDTBHnjAdxzGQZrPJw+HA31oulzbAWgLoA0CWZVBKIY5jzGYzdLtdE9DlcrFNrY98zobqOA6TJKHW2jg4nU5sNBpFDp6mhVe5rsvVasUwDHm9Xqm15u12o+/7Hy0gD8KatOd5vN/v1FozTVN6nkchxFuI6hsAAIMg4OPxMJCXdtTbR7JJCMEgCJhlGUlyPB4XfumozInrupxMJpRSRtZlKoNYl+m/6/wDuWAjtPfsQuwAAAAASUVORK5CYII=
// @homepageURL     https://greasyfork.org/zh-CN/scripts/431940
// @supportURL      https://greasyfork.org/zh-CN/scripts/431940/feedback
// @license         LGPL-3.0
// @noframes
// @include         /^https?:\/\/(greasy|sleazy)fork\.org\/[^/]+\/scripts\/\d+-[^/]+([/?#]|$)/
// @grant           none
// @run-at          document-start
// ==/UserScript==

const m = /(\/[^/]+\/scripts\/\d+)-[^/]+(\/.*)?/.exec(location.pathname)
history.replaceState({}, null, `${location.origin}${m[1]}${m[2] ?? ''}${location.search}${location.hash}`)