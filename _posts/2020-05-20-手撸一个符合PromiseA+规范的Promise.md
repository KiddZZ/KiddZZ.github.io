---
title: 手撸一个符合PromiseA+规范的Promise
date: 2020-05-20
categories:
  - js
---

<a href='https://promisesaplus.com/'>Promises/A+规范原文</a>  
<a href='https://www.ituring.com.cn/article/66566'>Promises/A+规范译文</a>  
<a href='https://github.com/then/promise/blob/master/src/core.js'>Promise 源码</a>

## Promise/A+规范

### 术语

1. **解决 (fulfill) :** 指一个 `promise` 成功时进行的一系列操作，如状态的改变、回调的执行。虽然规范中用 `fulfill` 来表示解决，但在后世的 `promise` 实现多以 `resolve` 来指代之。
2. **拒绝（reject) :** 指一个 `promise` 失败时进行的一系列操作。
3. **终值（eventual value）**： 所谓终值，指的是 `promise` 被解决时传递给解决回调的值，由于 `promise` 有一次性的特征，因此当这个值被传递时，标志着 `promise` 等待态的结束，故称之终值，有时也直接简称为值（`value`）。
4. **Promise**： `promise` 是一个拥有 `then` 方法的对象或函数，其行为符合本规范；
5. **thenable**： 是一个定义了 `then` 方法的对象或函数；
6. **值（value）**： 指任何 JavaScript 的合法值（包括 `undefined` , `thenable` 和 `promise`）；
7. **异常（exception）**： 是使用 `throw` 语句抛出的一个值。
8. **据因（reason）**： 表示一个 `promise` 的拒绝原因。

### 要求

#### Promise 的状态

一个 Promise 的当前状态必须为以下三种状态中的一种：等待态（`Pending`）、执行态（`Fulfilled`）和拒绝态（`Rejected`）。

#### 等待态（Pending）

处于等待态时，`promise` 需满足以下条件：

- 可以迁移至执行态或拒绝态

#### 执行态（Fulfilled）

处于执行态时，`promise` 需满足以下条件：

- 不能迁移至其他任何状态
- 必须拥有一个不可变的终值

#### 拒绝态（Rejected）

处于拒绝态时，`promise` 需满足以下条件：

- 不能迁移至其他任何状态
- 必须拥有一个不可变的据因

#### Then 方法

一个 `promise` 必须提供一个 `then` 方法以访问其当前值、终值和据因。  
`promise` 的 `then` 方法接受两个参数：

```js
promise.then(onFulfilled, onRejected)
```

#### 参数可选

`onFulfilled` 和 `onRejected` 都是可选参数。

- 如果 `onFulfilled` 不是函数，其必须被忽略
- 如果 `onRejected` 不是函数，其必须被忽略

#### onFulfilled 特性

如果 `onFulfilled` 是函数：

- 当 `promise` 执行结束后其必须被调用，其第一个参数为 `promise` 的`终值`
- 在 `promise` 执行结束前其不可被调用
- 其调用次数不可超过一次

#### onRejected 特性

如果 `onRejected` 是函数：

- 当 `promise` 被拒绝执行后其必须被调用，其第一个参数为 `promise` 的`据因`
- 在 `promise` 被拒绝执行前其不可被调用
- 其调用次数不可超过一次

#### 调用时机

`onFulfilled` 和 `onRejected` 只有在执行环境堆栈仅包含平台代码时才可被调用

#### 调用要求

`onFulfilled` 和 `onRejected` 必须被作为函数调用（即没有 this 值）

#### 多次调用

`then` 方法可以被同一个 `promise` 调用多次

- 当 `promise` 成功执行时，所有 `onFulfilled` 需按照其注册顺序依次回调
- 当 `promise` 被拒绝执行时，所有的 `onRejected` 需按照其注册顺序依次回调

## 实现

首先，我们来实现一个最基础的 `Promise`：

```js
// Promise 的状态
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
  constructor(fn) {
    // 状态
    this.status = PENDING
    // 据因
    this.reason = null
    // 终值
    this.value = null

    const resolve = (value) => {
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED
      }
    }
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED
      }
    }
    // 如果执行fn报错，直接reject
    try {
      fn(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  //   一个 promise 必须提供一个 then 方法以访问其当前值、终值和据因。
  then(onFulfilled, onRejected) {
    // 参数可选 并且不是函数将被忽略
    typeof onFulfilled === 'function' && onFulfilled(this.value)
    typeof onRejected === 'function' && onRejected(this.reason)
    //then 方法可以被同一个 promise 调用多次
    return this
  }
}
```

```js
const a = () => {
  return new MyPromise((resolve, reject) => {
    resolve('1')
  })
}
a()
  .then((res) => console.log(res))
  .then((res) => console.log(res)) // 1 1

const b = () => {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('2')
    }, 1000)
  })
}
b().then((res) => console.log(res)) // null
```

我们可以看到，`Promise` 中同步调用 `resolve` 的时候是能够正常返回的，而加了 `setTimeout` 延迟调用之后，就失效了，因为 `then` 和里面的成功失败回调是立即执行的，当调用 `then` 的时候，`setTimeout` 还没有执行，所以 `this.value` 是 `null`。为了解决这个问题，我们需要对`执行态和拒绝态`做一个缓存，先存到数组中，在状态改变之后再执行，从而达到异步效果。

```js
// Promise 的状态
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
  constructor(fn) {
    // 状态
    this.status = PENDING
    // 据因
    this.reason = null
    // 终值
    this.value = null
    // 成功回调数组
    this.onFilFulledCallbacks = []
    // 失败回调数组
    this.onRejectedCallbacks = []

    const resolve = (value) => {
      if (this.status === PENDING) {
        this.status = FULFILLED
        this.value = value
        // 执行resolve的时候，如果有缓存的成功回调，全部按顺序执行
        this.onFilFulledCallbacks.forEach((fn) => {
          fn()
        })
      }
    }
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED
        this.reason = reason
        // 执行reject的时候，如果有换成的失败回调，全部按顺序执行
        this.onRejectedCallbacks.forEach((fn) => {
          fn()
        })
      }
    }
    try {
      fn(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  //   一个 promise 必须提供一个 then 方法以访问其当前值、终值和据因。
  then(onFulfilled, onRejected) {
    // 参数可选 并且不是函数将被忽略,这个忽略指的是原样返回value或者reason. 我们重写下两个方法
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (error) => {
            throw error
          }
    // 如果状态已经被改变，则直接调用
    if (this.status === FULFILLED) {
      onFulfilled(this.value)
    }
    if (this.status === REJECTED) {
      onRejected(this.reason)
    }
    // 如果状态还未改变，缓存到数组中
    if (this.status === PENDING) {
      this.onFilFulledCallbacks.push(() => {
        onFulfilled(this.value)
      })
      this.onRejectedCallbacks.push(() => {
        onRejected(this.reason)
      })
    }
    //then 方法可以被同一个 promise 调用多次
    return this
  }
}
```

```js
const c = () => {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('yeah!')
    }, 1000)
  })
}
c().then((res) => console.log(res)) // 'yeah!'
```

我们在测试方法中看到，`then` 之后 1 秒钟成功看到了`yeah!`，至此，我们的 `MyPromise` 实现了异步。

我们用`getter setter`改写下回调的执行。

```js
...
class MyPromise {
  constructor(fn) {
    ...
    const resolve = (value) => {
      if (this.status === PENDING) {
        // 这个赋值顺序不能写错，为了在触发setter的时候获取到最新的value/reason
        this.value = value
        this.status = FULFILLED
      }
    }
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED
      }
    }
    ...
  }

  get status() {
    return this._status
  }

  set status(newStatus) {
    this._status = newStatus
    switch (newStatus) {
      case FULFILLED:
        // 执行resolve的时候，如果有缓存的成功回调，全部按顺序执行
        this.onFilFulledCallbacks.forEach((fn) => {
          fn(this.value)
        })
        break
      case REJECTED:
        // 执行reject的时候，如果有换成的失败回调，全部按顺序执行
        this.onRejectedCallbacks.forEach((fn) => {
          fn(this.reason)
        })
        break
    }
  }
  ...
}

```

实现异步之后，接下来，我们需要解决`返回`。

### 返回

`then` 方法必须返回一个 `promise` 对象

```js
promise2 = promise1.then(onFulfilled, onRejected)
```

- 如果 `onFulfilled` 或者 `onRejected` 返回一个值 `x` ，则运行下面的 Promise 解决过程：`[[Resolve]](promise2, x)`
- 如果 `onFulfilled` 或者 `onRejected` 抛出一个异常 `e` ，则 `promise2` 必须拒绝执行，并返回拒因 `e`
- 如果 `onFulfilled` 不是函数且 `promise1` 成功执行， `promise2` 必须成功执行并返回相同的值
- 如果 `onRejected` 不是函数且 `promise1` 拒绝执行， `promise2` 必须拒绝执行并返回相同的据因

```js
  //   一个 promise 必须提供一个 then 方法以访问其当前值、终值和据因。
  then(onFulfilled, onRejected) {
    // 参数可选 并且不是函数将被忽略, 我们重写下两个方法，如果不是function就给个默认的function
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (error) => {
            throw error
          }
    const promise2 = new MyPromise((resolve, reject) => {
      const fulfilledMicrotask = () => {
        // 我们使用queueMicrotask，使其异步，并进入微任务队列
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value)
            this.resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason)
            this.resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      // 如果状态已经被改变，则直接调用
      if (this.status === FULFILLED) {
        fulfilledMicrotask()
      }
      if (this.status === REJECTED) {
        rejectedMicrotask()
      }
      // 如果状态还未改变，缓存到数组中
      if (this.status === PENDING) {
        this.onFilFulledCallbacks.push(fulfilledMicrotask)
        this.onRejectedCallbacks.push(rejectedMicrotask)
      }
    })
    //then 方法可以被同一个 promise 调用多次
    return promise2
  }
```

- 关于`queueMicrotask`，因为 then 方法是异步，并且会进入微任务队列，所以我们用`queueMicrotask`改变运行顺序。对`eventloop`不熟悉的同学，可以先去了解下`eventloop`，事件循环机制。

随着 `then` 的完成，我们还有最后一步`Promise 解决过程`

### Promise 解决过程

Promise 解决过程是一个抽象的操作，其需输入一个 promise 和一个值，我们表示为 `[[Resolve]](promise, x)`，如果 `x` 有 `then` 方法且看上去像一个 Promise ，解决程序即尝试使 promise 接受 `x` 的状态；否则其用 `x` 的值来执行 promise 。  
这种 `thenable` 的特性使得 Promise 的实现更具有通用性：只要其暴露出一个遵循 Promise/A+ 协议的 then 方法即可；这同时也使遵循 Promise/A+ 规范的实现可以与那些不太规范但可用的实现能良好共存。

#### `x` 与 `promise` 相等

如果 `promise` 和 `x` 指向同一对象，以 `TypeError` 为据因拒绝执行 `promise`

#### `x` 为 `Promise`

如果 `x` 为 `Promise` ，则使 `promise` 接受 `x` 的状态

- 如果 `x` 处于等待态， `promise` 需保持为等待态直至 `x` 被执行或拒绝
- 如果 `x` 处于执行态，用相同的值执行 `promise`
- 如果 `x` 处于拒绝态，用相同的据因拒绝 `promise`

#### `x` 为`对象`或`函数`

如果 `x` 为对象或者函数：

- 把 `x.then` 赋值给 `then`
- 如果取 `x.then` 的值时抛出错误 `e` ，则以 `e` 为据因拒绝 promise
- 如果 `then` 是函数，将 `x` 作为函数的作用域 this 调用之。传递两个回调函数作为参数，第一个参数叫做 `resolvePromise` ，第二个参数叫做 `rejectPromise`:
  - 如果 `resolvePromise` 以值 `y` 为参数被调用，则运行 `[[Resolve]](promise, y)`
  - 如果 `rejectPromise` 以据因 `r` 为参数被调用，则以据因 `r` 拒绝 `promise`
  - 如果 `resolvePromise` 和 `rejectPromise` 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
  - 如果调用 `then` 方法抛出了异常 e：
    - 如果 `resolvePromise` 或 `rejectPromise` 已经被调用，则忽略之
    - 否则以 `e` 为据因拒绝 `promise`
  - 如果 `then` 不是函数，以 `x` 为参数执行 `promise`
- 如果 `x` 不为对象或者函数，以 `x` 为参数执行 `promise`

如果一个 `promise` 被一个循环的 `thenable` 链中的对象解决，而 `[[Resolve]](promise, thenable)` 的递归性质又使得其被再次调用，根据上述的算法将会陷入无限递归之中。算法虽不强制要求，但也鼓励施者检测这样的递归是否存在，若检测到存在则以一个可识别的 `TypeError` 为据因来拒绝 `promise`

```js
resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    // 如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise
    return reject(new TypeError('循环引用'))
  } else if (x instanceof MyPromise) {
    queueMicrotask(() => {
      // 如果 x 为 Promise ，则使 promise 接受 x 的状态
      // 如果 x 处于等待态， promise 需保持为等待态直至 x 被执行或拒绝
      if (x.status === PENDING) {
        x.then((y) => {
          this.resolvePromise(promise2, y, resolve, reject)
        }, reject)
      } else {
        // 如果 x 处于执行态，用相同的值执行 promise
        // 如果 x 处于拒绝态，用相同的据因拒绝 promise
        x.then(resolve, reject)
      }
    })
  } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    // 确保x为引用类型， 如果 x 为对象或者函数，
    // 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
    // 我们声明一个called防止多次调用
    let called = false
    try {
      // 把 x.then 赋值给 then
      let then = x.then
      if (typeof then === 'function') {
        // 如果 then 是函数，将 x 作为函数的作用域 this 调用之。传递两个回调函数作为参数，
        // 第一个参数叫做 resolvePromise ，第二个参数叫做 rejectPromise:
        // then.call(x, resolvePromise, rejectPromise)
        // 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
        // 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
        then.call(
          x,
          (y) => {
            if (called) return
            called = true
            this.resolvePromise(promise2, y, resolve, reject)
          },
          (r) => {
            if (called) return
            called = true
            reject(r)
          }
        )
      } else {
        // 如果 then 不是函数，以 x 为参数执行 promise
        resolve(x)
      }
    } catch (e) {
      // 如果取 x.then 的值时抛出错误 e ，则以 e 为据因拒绝 promise
      // 如果调用 then 方法抛出了异常 e : 如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
      if (called) return
      called = true
      reject(e)
    }
  } else {
    // 如果 x 不为对象或者函数，以 x 为参数执行 promise
    resolve(x)
  }
}
```

至此，我们的 `MyPromise` 已经完成，接下来，我们进入测试环节。

## 测试

测试当前代码是否符合 Promise/A+规范
全局安装 `npm i -g promises-aplus-tests`
文件所在目录运行以下命令 (例如你的文件名为:MyPromise.js)
`promise-aplus-tests MyPromise.js`

运行后显示：
`TypeError: adapter.deferred is not a function`

```js
// 实现一个promise的延迟对象 deferred
MyPromise.deferred = function () {
  let dfd = {}
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}
module.exports = MyPromise
```

我们给`MyPromise`加上`deferred`方法之后，然后`module.exports = MyPromise`导出就可以了

经过测试，全部绿码通过。

## 完整代码

```js
// Promise 的状态
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
  constructor(fn) {
    // 状态
    this._status = PENDING
    // 据因
    this.reason = null
    // 终值
    this.value = null
    // 成功回调数组
    this.onFilFulledCallbacks = []
    // 失败回调数组
    this.onRejectedCallbacks = []

    const resolve = (value) => {
      if (this.status === PENDING) {
        this.value = value
        this.status = FULFILLED
      }
    }
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason
        this.status = REJECTED
      }
    }
    try {
      fn(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  get status() {
    return this._status
  }

  set status(newStatus) {
    this._status = newStatus
    switch (newStatus) {
      case FULFILLED:
        // 执行resolve的时候，如果有缓存的成功回调，全部按顺序执行
        this.onFilFulledCallbacks.forEach((fn) => {
          fn(this.value)
        })
        break
      case REJECTED:
        // 执行reject的时候，如果有换成的失败回调，全部按顺序执行
        this.onRejectedCallbacks.forEach((fn) => {
          fn(this.reason)
        })
        break
    }
  }

  //   一个 promise 必须提供一个 then 方法以访问其当前值、终值和据因。
  then(onFulfilled, onRejected) {
    // 参数可选 并且不是函数将被忽略, 我们重写下两个方法，如果不是function就给个默认的function
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (error) => {
            throw error
          }

    const promise2 = new MyPromise((resolve, reject) => {
      const fulfilledMicrotask = () => {
        // 我们使用queueMicrotask，使其异步，并进入微任务队列
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value)
            this.resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason)
            this.resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      // 如果状态已经被改变，则直接调用
      if (this.status === FULFILLED) {
        fulfilledMicrotask()
      }
      if (this.status === REJECTED) {
        rejectedMicrotask()
      }
      // 如果状态还未改变，缓存到数组中
      if (this.status === PENDING) {
        this.onFilFulledCallbacks.push(fulfilledMicrotask)
        this.onRejectedCallbacks.push(rejectedMicrotask)
      }
    })
    //then 方法可以被同一个 promise 调用多次
    return promise2
  }

  resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
      // 如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise
      return reject(new TypeError('循环引用'))
    }
    if (x instanceof MyPromise) {
      // 如果 x 为 Promise ，则使 promise 接受 x 的状态
      // 如果 x 处于等待态， promise 需保持为等待态直至 x 被执行或拒绝
      queueMicrotask(() => {
        if (x.status === PENDING) {
          x.then((y) => {
            this.resolvePromise(promise2, y, resolve, reject)
          }, reject)
        } else {
          // 如果 x 处于执行态，用相同的值执行 promise
          // 如果 x 处于拒绝态，用相同的据因拒绝 promise
          x.then(resolve, reject)
        }
      })
    } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
      // 确保x为引用类型， 如果 x 为对象或者函数，
      // 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
      // 我们声明一个called防止多次调用
      let called = false
      try {
        // 把 x.then 赋值给 then
        let then = x.then
        if (typeof then === 'function') {
          // 如果 then 是函数，将 x 作为函数的作用域 this 调用之。传递两个回调函数作为参数，
          // 第一个参数叫做 resolvePromise ，第二个参数叫做 rejectPromise:
          // then.call(x, resolvePromise, rejectPromise)
          // 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
          // 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
          then.call(
            x,
            (y) => {
              if (called) return
              called = true
              this.resolvePromise(promise2, y, resolve, reject)
            },
            (r) => {
              if (called) return
              called = true
              reject(r)
            }
          )
        } else {
          // 如果 then 不是函数，以 x 为参数执行 promise
          resolve(x)
        }
      } catch (e) {
        // 如果取 x.then 的值时抛出错误 e ，则以 e 为据因拒绝 promise
        // 如果调用 then 方法抛出了异常 e : 如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
        if (called) return
        called = true
        reject(e)
      }
    } else {
      // 如果 x 不为对象或者函数，以 x 为参数执行 promise
      resolve(x)
    }
  }
}

// 实现一个promise的延迟对象 defer
MyPromise.deferred = function () {
  let dfd = {}
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

module.exports = MyPromise
```


