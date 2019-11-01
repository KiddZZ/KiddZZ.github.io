---
title: 小程序中返回webview，使webview重新加载
date: 2019-10-31
categories:
  - JavaScript
tags:
  - 小程序
  - JavaScript
  - webview
---

## 技术栈

小程序：Tarojs，webview：react

## 问题总结

场景：webview 中跳转到小程序之后，点击小程序左上角返回按钮回退到 webview 之后，因为在小程序页面做了某些操作，需要重新调用 webview 接口，刷新数据。

emmmmm，比喻来说就是，你头上总共有 3 根头发，一开始你在 webview，然后你走到了小程序，并且在小程序拔下了自己的一根头发，只剩了 2 根，然后突然间，一股不可抗力来到你身上（比如说时光倒流，或者上帝一个指头把你弹了回去，并且把你的头发恢复了），你回到了 webview，你的头上还有 3 根头发，但是实际上，你以前拔过一根头发，只剩下了 2 根，那么怎么回到 2 根的你呢，你也不知道现在的你是刚到 webview 还是被上帝踢过来的。
所以我们的方法是，控制上帝，在上帝把你头发粘回去的时候，留下点痕迹，你一摸就知道，这头发！！！已经死了！ --------------------------------

好了，言归正传，怎么留下痕迹，我们的方法就是让小程序和 webview 进行通信，因为我们的 webview 是通过给 webview 组件传入 url 来渲染的，所以我们可以在小程序返回的时候，修改这个 url 来使 webview（中的 h5）知道，你的头发是假的！！
好了，贴上代码：

```js
// 小程序
componentWillUnmount () {
    this.props.dispatchSetIntegralDetailNull()
    this.goBack()
  }

  goBack () {
    var pages = Taro.getCurrentPages() // 当前页面
    var beforePage = pages[pages.length - 2] // 前一个页面
    var url = beforePage.data.url // 前一个页面当前加载的url
    if (~url.indexOf('/XXXXXXXX/')) {
      beforePage.setData({ url: url + '?1=' + Math.random() })
    }
  }
```

我们在小程序返回 webview 组件前那个页面（就是你拔了自己头发的那个页面），把 webview 中的 url 给改掉。

```js
  // h5
  async componentDidMount() {
    this.props.history.listen(async () => {
      await this.componentDidMount();
      window.history.back(-1);
    });
    await 重新获取你的头发
  }
```

然后我们在 h5 页面监听一下路由变化，有变化就重新调一下`componentDidMount`，然而因为 url 改变了，导致页面堆栈历史有了 2 个 h5（1 个是你刚来时候的青涩小伙子，1 个是被上帝蹂躏过后的却毛小伙），所以我们通过返回前一个页面的方式使你又回到了曾经（除了你头上的那根毛）。好了大功告成。
