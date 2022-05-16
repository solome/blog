---
layout: layout/post
title: '函数式编程之纯函数'
date: 2016-09-07 15:18:22 +0800
comments: true
categories: 学习札記
---

数学上的函数指的是两个集合间的一种特殊的映射关系。这个特殊体现在什么地方呢？

我们将集合`A`的元素称呼为输入值，集合`B`的元素称呼为输出值，且集合`A`、`B`存在这样的映射关系：**每个输入值只会映射一个输出值，不同的输入值可以映射相同的输出值，不会出现同一个输入值映射不同的输出值**。

比如，下图集合`A`和集合`B`的映射关系即符合数学函数的定义。

<figure>
  <img style="width: auto;" src="/blog/pure-functions-in-fp/set_map.svg" alt="containing block" />
  <figcaption>fn：除以5的余数</figcaption>
</figure>

> 在函数式编程语言中，满足这种数学意义上的函数即为纯函数(Pure Function)：相同的输入（参数），永远得到的是相同的输出（返回值），并且没有任何可观察的"副作用"。  
> 自然，与纯函数的概念相反的函数（即相同参数的函数在不同环境或时机调用得到的返回值不一致）叫做非纯函数(Impure Function)。

### 关于**函数副作用**(side-effect)

**函数副作用**指当调用函数时，在计算返回值数值的过程中，对主调用函数产生附加的影响。

#### 更高作用域的变量"悄悄"发生变更

```js
let glob = 1
function foo(x) {
  return ++glob + x
}
console.log(foo(1)) // => 3
```

变量`glob`的值随着`foo()`的调用发生变化，表现得很不明显。

#### "隐晦"地修改了引用参数

```js
let glob = 1
const obj = { glob }
function foo(x) {
  return ++x.glob
}
foo(obj)
console.log(glob) // => 2
```

虽然对象`obj`定义为`const`，但是修改了间接引用的变量`glob`；这种场景引发的 bug 其实是很难捕获的（尤其是具备指针概念的 C/C++语言）。

函数副作用确实是滋生 Bug 的"温床"，造成的问题一般都很"隐晦"；有些开发场景中，我们其实也无法避免函数的副作用（典型的例子是读写数据库操作的函数）。最好的做法是，要将这些副作用限制在可控的范围内。

### 纯函数带来的好处

#### 函数调用结果可缓存

相同参数得到的返回值是相同的。如果通过参数获取返回值的过程计算量过大，我们可以缓存函数调用的结果，避免相同参数为了获取返回值进行重复计算。典型的实践是对递归函数做性能优化的`memoize`技术。
以`fibonacci(n)`递归函数为例，传统的实现：

```js
function fibonacci(n) {
  if (n === 0 || n === 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log(fibonacci(10))
```

计算的复杂度以参数`n`呈指数级增长：

```haskell
f(0) = 0
f(1) = 1
f(2) = f(1) + f(0) = 1
f(3) = f(2) + f(1) = 2
f(4) = f(3) + f(2)
     = f(2) + f(1) + f(2) = 3
f(5) = f(4) + f(3)
     = f(3) + f(2) + f(2) + f(1)
     = f(2) + f(1) + f(2) + f(2) + f(1) = 5
f(6) = f(5) + f(4)
     = f(4) + f(3) + f(3) + f(2)
     = f(3) + f(2) + f(2) + f(1) + f(2) + f(1) + f(2)
     = f(2) + f(1) + f(2) + f(2) + f(1) + f(2) + f(1) + f(2) = 8
... ...
```

为了获取`fibonacci(n)`的结果，我们不得不将`fibonacci(n-1)`和`fibonacci(n-2)`都得计算一遍；如果我们在调用一次`fibonacci(n)`之后，就将其缓存起来，下次再调用时就无需重新再计算。稍加改造，添加对计算结果的缓存：

```js
const fibonacci = (function () {
  const cache = {}

  return function fib(n) {
    if (n in cache) return cache[n]
    return (cache[n] = n === 0 || n === 1 ? n : fib(n - 1) + fib(n - 2))
  }
})()
console.log(fibonacci(10))
```

这是典型的以空间换效率的优化思路，避免了额外计算的浪费。
这样实现的前提就是，该递归函数是纯函数，相同参数得到的返回值一定是相同的；如果不能保证相同，我们无法做缓存。

当然，我们可以实现一个`memoize()`函数来统一做缓存这样的工作。
JavaScript 函数式编程支持库如均提供`memoize()`函数，这里提供一种不太健壮（内存溢出）的实现方案。

```js
function memoize(func) {
  const memo = {}
  const slice = Array.prototype.slice

  return function () {
    const args = slice.call(arguments)

    if (args in memo) return memo[args]
    return (memo[args] = func.apply(this, args))
  }
}
```

> 这样函数调用的次数愈多效率会慢慢变得愈高。

#### 便于移植和测试

纯函数是"自给自足"的，所有的函数依赖均由函数自身提供（或参数）；因此，我们将一个函数移植到另外一个系统时，是无需考虑成本的
——当然，如果一个函数依赖一个全局变量，在移植该函数时必须"慎重"，要将这个全局变量的逻辑一起迁移过去。

相同参数得到的函数返回值是固定的，这一特性也使纯函数更易测试——你无需模拟出一些特殊的测试环境，只要明确定义好函数参数的范围即可。

#### 引用透明（Referential Transparent）

> An expression is said to be referentially transparent if it can be replaced with its corresponding value without changing the program's behavior. As a result, evaluating a referentially transparent function gives the same value for same arguments. Such functions are called pure functions.  
> —— [https://en.wikipedia.org/wiki/Referential_transparency](https://en.wikipedia.org/wiki/Referential_transparency)

该如何理解呢？可以拿上文提到的`fibonacci()`函数举例，比如存在这样一个函数：

```js
function foo(n, fun) {
  return fun(n) + fun(n)
}

foo(10, fibonacci)
```

调用`foo(10, fibonacci)`会发现`fibonacci(10)`被执行了两遍。因为纯函数具备引用透明性，某些表达式被**替换**并不会改变函数的行为；因此，对`foo()`进行些许变动会使其性能得到质的提升。

```js
function foo(n, fun) {
  return fun(n) * 2
}
```

毕竟在此场景中，一次乘法运算成本远比一次`fibonacci(10)`递归运算的成本来得低。

这里的由`fibonacci(n) + fibonacci(n) => 2*fibonacci(n)`转变完全跟数学概念中的`f(x) = x + x = 2 *x`函数推导一致。

因为纯函数的引用透明的特性，我们完全可以将多个函数构成的复杂程序（函数）**推导**成更加简单的方式。

#### 并行代码

纯函数无副作用，同时调用两个函数或同个函数被同时调用两次都不会抢占外部公共资源的情况。

### 总结

- 程序设计中的大部分 Bug 都是有函数副作用引入的，实际开发中必须鼓励纯函数的编写。
- 在函数式编程范畴中，欲想以函数为基础生成新的函数，那纯函数是这些新函数的基石。
- 多尝试使用`memoize`技术对递归函数进行性能优化。
