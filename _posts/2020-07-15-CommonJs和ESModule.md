---
title: CommonJs和ESModule
date: 2020-07-15
categories:
  - js
tags:
  - js
  - 模块化
---

## CommonJS 模块的特点

1. 所有代码都运行在模块作用域，不会污染全局作用域。
2. 模块可以多次加载，但是只会在第一次加载时运行一次，然后运行结果就被缓存了，以后再加载，就直接读取缓存结果。要想让模块再次运行，必须清除缓存。
3. 模块加载的顺序，按照其在代码中出现的顺序。

### module 对象

1. `module.id` 模块的识别符，通常是带有绝对路径的模块文件名。
2. `module.filename` 模块的文件名，带有绝对路径。
3. `module.loaded` 返回一个布尔值，表示模块是否已经完成加载。
4. `module.parent` 返回一个对象，表示调用该模块的模块。
5. `module.children` 返回一个数组，表示该模块要用到的其他模块。
6. `module.exports` 表示模块对外输出的值。

```js
/*** commonjs-module.js ***/
exports.a = 'a1'
exports.b = module
console.log(module)

/*** main.js ***/
var a = require('./commonjs-module')

console.log('main.js', a.b)
console.log('main.js2', module)

// 执行之后
// Module {
//   id: '/Users/demo/commonjs-module.js',
//   path: '/Users/demo',
//   exports: { a: 'a1', b: [Circular] },
//   parent: Module {
//     id: '.',
//     path: '/Users/demo',
//     exports: {},
//     parent: null,
//     filename: '/Users/demo/main.js',
//     loaded: false,
//     children: [ [Circular] ],
//     paths: [
//       '/Users/demo/node_modules',
//       '/Users/node_modules'
//     ]
//   },
//   filename: '/Users/demo/commonjs-module.js',
//   loaded: false,
//   children: [],
//   paths: [
//     '/Users/demo/node_modules',
//     '/Users/node_modules'
//   ]
// }
// main.js Module {
//   id: '/Users/demo/commonjs-module.js',
//   path: '/Users/demo',
//   exports: { a: 'a1', b: [Circular] },
//   parent: Module {
//     id: '.',
//     path: '/Users/demo',
//     exports: {},
//     parent: null,
//     filename: '/Users/demo/main.js',
//     loaded: false,
//     children: [ [Circular] ],
//     paths: [
//       '/Users/demo/node_modules',
//       '/Users/node_modules',
//     ]
//   },
//   filename: '/Users/demo/commonjs-module.js',
//   loaded: true,
//   children: [],
//   paths: [
//     '/Users/demo/node_modules',
//     '/Users/node_modules',
//   ]
// }
// main.js2 Module {
//   id: '.',
//   path: '/Users/demo',
//   exports: {},
//   parent: null,
//   filename: '/Users/demo/main.js',
//   loaded: false,
//   children: [
//     Module {
//       id: '/Users/demo/commonjs-module.js',
//       path: '/Users/demo',
//       exports: [Object],
//       parent: [Circular],
//       filename: '/Users/demo/commonjs-module.js',
//       loaded: true,
//       children: [],
//       paths: [Array]
//     }
//   ],
//   paths: [
//     '/Users/demo/node_modules',
//     '/Users/node_modules',
//   ]
// }
```

### module.exports

- module.exports 属性表示当前模块对外输出的接口，其他文件加载该模块，实际上就是读取 module.exports 变量。

### exports 变量

1. 为了方便，Node 为每个模块提供一个 exports 变量，指向 module.exports。这等同在每个模块头部，有一行这样的命令。`var exports = module.exports;`
2. 注意，不能直接将 exports 变量指向一个值，因为这样等于切断了 exports 与 module.exports 的联系。

```js
// 关于第二点，我们举个例子
/*** commonjs-exports.js ***/
exports.b = 'exports'
exports = function (x) {
  console.log(x)
}

/*** main.js ***/
var b = require('./commonjs-exports')

console.log('main.js', b)

// main.js { b: 'exports' }
```

通过例子我们可以看到，如果改变了`exports`指向的值，那么，就不会生效

### require

- require 命令的基本功能是，读入并执行一个 JavaScript 文件，然后返回该模块的 exports 对象。如果没有发现指定模块，会报错。
- require 命令用于加载文件，后缀名默认为.js

### 模块的缓存

- 第一次加载某个模块时，Node 会缓存该模块。以后再加载该模块，就直接从缓存取出该模块的 module.exports 属性。

```js
/*** commonjs-require.js ***/
exports.name = 'require'

/*** main.js ***/
var c = require('./commonjs-require')
console.log(c)
require('./commonjs-require').message = 'hello'
console.log(c)
var d = require('./commonjs-require')
console.log(d)

// { name: 'require' }
// { name: 'require', message: 'hello' }
// { name: 'require', message: 'hello' }
```

我们可以看到，第三次加载的时候，`message`依然存在，证明 require 只是输出了缓存。

- 所有缓存的模块保存在 require.cache 之中，如果想删除模块的缓存，可以像下面这样写。

```js
// 删除指定模块的缓存
delete require.cache[moduleName]

// 删除所有模块的缓存
Object.keys(require.cache).forEach(function (key) {
  delete require.cache[key]
})
```

我们将删除语句加入上面的代码，可以看到`message`的缓存被去除了

```js
/*** commonjs-require.js ***/
exports.name = 'require'

/*** main.js ***/
var c = require('./commonjs-require')
console.log(c)
require('./commonjs-require').message = 'hello'
console.log(c)
// 删除所有模块的缓存
Object.keys(require.cache).forEach(function (key) {
  delete require.cache[key]
})
var d = require('./commonjs-require')
console.log(d)

// { name: 'require' }
// { name: 'require', message: 'hello' }
// { name: 'require' }
```

## es module

### 导出和导入

我们使用`export`来导出模块，通过`import`来导入模块。

```js
/*** export.js ***/
export const a = 'a'

export function b() {
  return 'b'
}

/*** main.js ***/
import { a, b } from './export'

console.log(a)
console.log(b())

// a
// b
```

- 默认导出`export default`

我们在`export.js`中加一条

```js
export default function c() {
  console.log('c')
}
```

```js
import c, { a, b } from './export'

console.log(a)
console.log(b())
console.log(c())

// 输出
// a
// b
// c
```

### 重命名导出与导入

在你的 `import` 和 `export` 语句的大括号中，可以使用 `as` 关键字跟一个新的名字，来改变你在顶级模块中将要使用的功能的标识名字。因此，例如，以下两者都会做同样的工作，尽管方式略有不同：

```js
// export.js
export { b as functionName, c as anotherFunctionName }

// main.js
import { functionName, anotherFunctionName } from './export'
```

```js
// export.js
export { b, c }

// main.js
import { b as functionName, c as anotherFunctionName } from './export'
```

### 创建模块对象

当导出项过多时，`import { a, b, c, d, e, f } from './xxx'`，看着会有一点点混乱和冗长。我们可以用一下语法形式更好的解决：

```js
import * as Module from './export'
```

## CommonJs 和 esModule 的区别

- `commonJs`是被加载的时候运行，`esModule`是编译的时候运行
- `commonJs`输出的是值的浅拷贝，`esModule`输出值的引用
- `commonJs`具有缓存。在第一次被加载时，会完整运行整个文件并输出一个对象，拷贝（浅拷贝）在内存中。下次加载文件时，直接从内存中取值（前文已证明）

### CommonJs

```js
/*************** a.js**********************/
let count = 0
exports.count = count
exports.obj = {
  a: 0,
}
exports.add = () => {
  count++
}
setTimeout(() => {
  obj.a++
}, 1000)

/*************** b.js**********************/
const { count, add, obj } = require('./a.js')

console.log(count) //0
console.log(obj) // { a: 0 }
add()
console.log(count) //0 执行add之后，count并没有被改变，说明commonJs是值的拷贝
setTimeout(() => {
  console.log(obj) // { a: 1 }
}, 2000)
```

从`count`我们可以得出，`CommonJs`是值的拷贝，从`obj`我们可以得出`CommonJs`是浅拷贝。

### esModule

```js
/*************** a.js**********************/
export let count = 0 //输出的是值的引用，指向同一块内存
export const add = () => {
  count++ //此时引用指向的内存值发生改变
}

/*************** b.js**********************/
import { count, add } from './a.js'

console.log(count) //0
add()
console.log(count) //1
```

### 循环引用

#### CommonJs

我们先来看`CommonJs`中的循环引用

```js
// a.js
var name = 'a'
exports.name = name
var b = require('./b.js')
name = 'a-changed'
exports.name = name

// b.js
var name = 'b'
exports.name = name
var a = require('./a.js')
console.log('b模块中的a', a.name)
name = 'b-changed'
exports.name = name

// main.js
var a = require('./a.js')
console.log('main中的a', a.name)

// 输出
// b模块中的a a
// main中的a a-changed
```

为什么会输出这样的结果呢，因为`CommonJs`是加载时运行，或者说是`同步执行`的，当`a.js`中引入`b.js`的时候，`a`中`name`的第二次赋值还没有执行，所以`b.js`中拿到的`a.name`是第一次赋值的结果，而`a.js`中引入了`b.js`，因为`b.js`已经执行完毕，所以拿到的`name`是第二次赋值后的结果。

#### esModule

```js
// a.js
import { bar } from "./b.js";
export function foo() {
  bar();
  console.log("执行完毕");
}
foo();
// b.js
import { foo } from "./a.js";
export function bar() {
  if (Math.random() > 0.5) {
    foo();
  }
}
```

在`esModule`中，因为模块都是`值的引用`，所以`esModule`根本不会去关心是否是循环引用，只要保证代码不会陷入死循环就可以。

关于循环引用可以参考阮大大的<a href="http://www.ruanyifeng.com/blog/2015/11/circular-dependency.html">JavaScript 模块的循环加载</a>

<完>