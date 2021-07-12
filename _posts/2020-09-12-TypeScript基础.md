---
title: TypeScript基础
date: 2020-09-12
categories:
  - TypeScript
tags:
  - JavaScript
  - TypeScript
---

## 为什么要用 ts，ts 的好处？

1. `TypeScript` 是 `JavaScript` 的加强版，它给 `JavaScript` 添加了可选的静态类型和基于类的面向对象编程，它拓展了 `JavaScript` 的语法。所以 `ts` 的功能比 `js` 只多不少.
2. `Typescript` 是纯面向对象的编程语言，包含类和接口的概念.
3. `TS` 在开发时就能给出编译错误， 而 `JS` 错误则需要在运行时才能暴露。
4. 作为强类型语言，你可以明确知道数据的类型。代码可读性极强，几乎每个人都能理解。
5. `ts` 中有很多很方便的特性, 比如可选链.

## 基础

- 类型： boolean、number、bigint、string、Array、Tuple、enum、unknown、any、void、null、undefined、never、object

基础类型的具体定义可以看这里-><a href='https://github.com/zhongsp/TypeScript/blob/dev/zh/handbook/basic-types.md'>基础类型</a>

### 类型断言

类型断言有两种语法，一种是`尖括号`，一种是`as`：

```ts
let someValue: any = 'this is a string'

let strLength: number = (<string>someValue).length

let strLength: number = (someValue as string).length
```

这两种方式是等价的，但是在`JSX`中只有`as`是被允许的。

## 泛型

泛型是指在定义函数、接⼝或类的时候，不预先指定具体的类型，使⽤时再去指定类型的⼀种特性。

可以把泛型理解为代表类型的参数，假如我们现在有这么一个函数，函数接收的参数是什么类型，就返回什么类型。单一的基础类型也满足不了要求啊，怎么办呢？要不用 any？

```ts
function identity(arg: any): any {
  return arg
}
```

看着好像没问题，但是用`any`要是函数中间经过了什么处理，改变了`arg`传入的类型怎么办？这个时候我们就可以用到`泛型`。

```ts
function identity<T>(arg: T): T {
  return arg
}

let output1 = identity<string>('myString') // type of output1 will be 'string'
let output2 = identity<number>(1) // type of output2 will be 'number'
```

## type 和 interface 的异同

一般情况下，我们用`interface`描述数据结构，用`type`描述数据类型

### 都可以描述一个对象或者函数

```ts
interface User {
  name: string
  age: number
}

interface SetUser {
  (name: string, age: number): void
}

type User = {
  name: string
  age: number
}

type SetUser = (name: string, age: number) => void
```

### 都允许扩展（extends）

`interface`和`type`都可以扩展，并且`interface`可以 extends`type`，`type`可以 extends`interface`，只不过语法略有区别。

```ts
// interface extends interface
interface Name {
  name: string
}

interface User extends Name {
  age: number
}

// type extends type
type Name = {
  name: string
}

type User = Name & { age: number }

// interface extends type
type Name = {
  name: string
}

interface User extends Name {
  age: number
}

// type extends interface
interface Name {
  name: string
}
type User = Name & {
  age: number
}
```

### 只有 type 可以做的

`type`可以声明基础类型、联合类型、元组类型

```ts
// 基础类型
type Name = string

// 联合类型
interface Dog {
  wong()
}
interface Cat {
  miao()
}

type Pet = Dog | Cat

// 元组类型
type PetList = [Dog, Cat]

// 当你想获取一个变量的类型时，使用 typeof
let div = document.createElement('div')
type B = typeof div
```

## 进阶

### 联合类型 |

联合类型表示一个值可以是几种类型之一，可以看上面的`Pet`例子

### 交叉类型 &

交叉类型是将多个类型合并为一个类型。

### typeof

`typeof` 操作符可以用来获取一个变量声明或对象的类型。

```ts
function toArray(x: number): Array<number> {
  return [x]
}

type Func = typeof toArray // -> (x: number) => number[]
```

### keyof

`keyof` 操作符可以用来一个对象中的所有 key 值。

```ts
interface Person {
  name: string
  age: number
}

type K1 = keyof Person // "name" | "age"
```

### in

in 用来遍历枚举类型：

```ts
type Keys = 'a' | 'b' | 'c'

type Obj = {
  [p in Keys]: any
} // -> { a: any, b: any, c: any }
```

### extends

有时候我们定义的泛型不想过于灵活或者说想继承某些类等，可以通过 `extends` 关键字添加泛型约束。

```ts
interface ILengthwise {
  length: number
}

function loggingIdentity<T extends ILengthwise>(arg: T): T {
  console.log(arg.length)
  return arg
}

loggingIdentity(3) // Argument of type 'number' is not assignable to parameter of type 'ILengthwise'.
loggingIdentity({ length: 10, value: 3 })
```

### Partial

`Partial<T>` 的作用就是将某个类型里的属性全部变为可选项 `?`。

### Required

`Required<T>` 的作用就是将某个类型里的属性全部变为必选项。

### Readonly

`Readonly<T>` 的作用是将某个类型所有属性变为只读属性，也就意味着这些属性不能被重新赋值。

### Record

`Record<K extends keyof any, T>` 的作用是将 `K` 中所有的属性的值转化为 `T` 类型。

```ts
interface PageInfo {
  title: string
}

type Page = 'home' | 'about' | 'contact'

const x: Record<Page, PageInfo> = {
  about: { title: 'about' },
  contact: { title: 'contact' },
  home: { title: 'home' },
}
```

### Exclude

`Exclude<T, U>` 的作用是将某个类型中属于另一个的类型移除掉。

```ts
type T0 = Exclude<'a' | 'b' | 'c', 'a'> // "b" | "c"
type T1 = Exclude<'a' | 'b' | 'c', 'a' | 'b'> // "c"
```

### Extract

`Extract<T, U>` 的作用是从 `T` 中提取出 `U`（交集）。

```ts
type T0 = Extract<'a' | 'b' | 'c', 'a' | 'f'> // "a"
type T1 = Extract<string | number | (() => void), Function> // () => void
```

### 如何基于一个已有类型, 扩展出一个大部分内容相似, 但是有部分区别的类型?

```ts
interface Test {
  name: string
  sex: number
  height: string
}

type Sex = Pick<Test, 'sex'>

const a: Sex = { sex: 1 }

type WithoutSex = Omit<Test, 'sex'>

const b: WithoutSex = { name: '1111', height: 'sss' }
```

## 原理

<img src="/assets/images/20200912/ts编译流程图.png" />

1. Scanner 扫描器 (scanner.ts)

   扫描器的作用就是将源代码生成 token 流
   <img src="/assets/images/20200912/扫描器.png" />

2. Parser 解析器 (parser.ts)

   <img src="/assets/images/20200912/解析器.png">

3. Binder 绑定器 (binder.ts)

符号将 AST 中的声明节点与其它声明连接到相同的实体上。符号是语义系统的基本构造块。

```js
function Symbol(flags: SymbolFlags, name: string) {
  this.flags = flags
  this.name = name
  this.declarations = undefined
}
```

SymbolFlags 符号标志是个标志枚举，用于识别额外的符号类别（例如：变量作用域标志 FunctionScopedVariable 或 BlockScopedVariable 等）。

<img src='/assets/images/20200912/绑定器.png' />

4. Checker 检查器 (checker.ts)

根据我们生成 AST 节点的声明起始节点位置，对传进来的字符串做位置类型语法等的校验与异常的抛出。

<img src='/assets/images/20200912/检查器.png'>

5. Emitter 发射器 (emitter.ts)

TypeScript 编译器提供了两个发射器:

emitter.ts: 它是 TS -> JavaScript 的发射器
declarationEmitter.ts: 用于为 TypeScript 源文件（.ts） 创建声明文件

<img src="/assets/images/20200912/发射器.png" />

## 附 tsconfig

```js
{
  "compilerOptions": {
    /* 基本选项 */
    "target": "es5",                       // 指定 ECMAScript 目标版本: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017', or 'ESNEXT'
    "module": "commonjs",                  // 指定使用模块: 'commonjs', 'amd', 'system', 'umd' or 'es2015'
    "lib": [],                             // 指定要包含在编译中的库文件
    "allowJs": true,                       // 允许编译 javascript 文件
    "checkJs": true,                       // 报告 javascript 文件中的错误
    "jsx": "preserve",                     // 指定 jsx 代码的生成: 'preserve', 'react-native', or 'react'
    "declaration": true,                   // 生成相应的 '.d.ts' 文件
    "sourceMap": true,                     // 生成相应的 '.map' 文件
    "outFile": "./",                       // 将输出文件合并为一个文件
    "outDir": "./",                        // 指定输出目录
    "rootDir": "./",                       // 用来控制输出目录结构 --outDir.
    "removeComments": true,                // 删除编译后的所有的注释
    "noEmit": true,                        // 不生成输出文件
    "importHelpers": true,                 // 从 tslib 导入辅助工具函数
    "isolatedModules": true,               // 将每个文件做为单独的模块 （与 'ts.transpileModule' 类似）.

    /* 严格的类型检查选项 */
    "strict": true,                        // 启用所有严格类型检查选项
    "noImplicitAny": true,                 // 在表达式和声明上有隐含的 any类型时报错
    "strictNullChecks": true,              // 启用严格的 null 检查
    "noImplicitThis": true,                // 当 this 表达式值为 any 类型的时候，生成一个错误
    "alwaysStrict": true,                  // 以严格模式检查每个模块，并在每个文件里加入 'use strict'

    /* 额外的检查 */
    "noUnusedLocals": true,                // 有未使用的变量时，抛出错误
    "noUnusedParameters": true,            // 有未使用的参数时，抛出错误
    "noImplicitReturns": true,             // 并不是所有函数里的代码都有返回值时，抛出错误
    "noFallthroughCasesInSwitch": true,    // 报告 switch 语句的 fallthrough 错误。（即，不允许 switch 的 case 语句贯穿）

    /* 模块解析选项 */
    "moduleResolution": "node",            // 选择模块解析策略： 'node' (Node.js) or 'classic' (TypeScript pre-1.6)
    "baseUrl": "./",                       // 用于解析非相对模块名称的基目录
    "paths": {},                           // 模块名到基于 baseUrl 的路径映射的列表
    "rootDirs": [],                        // 根文件夹列表，其组合内容表示项目运行时的结构内容
    "typeRoots": [],                       // 包含类型声明的文件列表
    "types": [],                           // 需要包含的类型声明文件名列表
    "allowSyntheticDefaultImports": true,  // 允许从没有设置默认导出的模块中默认导入。

    /* Source Map Options */
    "sourceRoot": "./",                    // 指定调试器应该找到 TypeScript 文件而不是源文件的位置
    "mapRoot": "./",                       // 指定调试器应该找到映射文件而不是生成文件的位置
    "inlineSourceMap": true,               // 生成单个 soucemaps 文件，而不是将 sourcemaps 生成不同的文件
    "inlineSources": true,                 // 将代码与 sourcemaps 生成到一个文件中，要求同时设置了 --inlineSourceMap 或 --sourceMap 属性

    /* 其他选项 */
    "experimentalDecorators": true,        // 启用装饰器
    "emitDecoratorMetadata": true          // 为装饰器提供元数据的支持
  }
}
```
