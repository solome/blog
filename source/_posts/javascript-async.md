---
title: 'JavaScript 異步編程小結'
date: 2016-12-16 15:18:22 +0800
comments: true
categories: 学习札記
---

JavaScript 是單線程的，除了你的 JS 代码，其它操作都是并行执行的(everything runs in parallel except your code)。

在 JS 執行線程中進行的行為被稱作同步(Synchronous)操作，非 JS 執行線程執行的行為則被稱呼為異步(Asynchronous)操作。
諸如 Ajax/HTTP 請求、I/O 操作等行為均與 JS 執行線程無關（由自己獨立的線程進行運作），這些行為在執行完成之後會將結果通知到 JS 執行線程；
因此，JS 執行線程中會有個類似`while(true)`的循環，以觀察者的姿態`監聽`（轮询）是否有其它線程傳遞消息過來，一旦捕獲到則執行本 JS 執行線程中相應的函數塊（回調）。

JavaScript 事件循環不是本文的重點（[JavaScript Event Loop](https://docs.google.com/presentation/d/1-UC3cwd0KZtdSRAd6edLD-CvrOeM-IOpJYcb8rhElBY/edit?usp=sharing)），本文僅對前端異步編程進行些許總結。個人的理解是 JavaScript 異步編程方式只有兩種方式：回調和觀察者模式。需要注意的是：

- Promises/A+ 是如何優雅地使用回調而設計的一種編程規範，本質依舊是回調
- 事件監聽和觀察者模式（發佈/訂閱模式）完全可以理解成是“一個孩子的不同暱稱”
- Generators 是一種特性，實現函數在執行過程中暫停、並在將來的某個時刻恢復執行的功能
- Generators+Promises 可以搭配漂亮的語法糖，將異步源碼寫得像同步源碼

### Callback Functions

函數式編程中有個概念叫做高階函數(Higher-order Functions)，其有個特性是一個函數可以作為另外一個函數的參數。通常我們將那個作為另外一個函數參數的函數稱呼為回調函數。

為方便描述和解釋，此處模擬一個具體的業務場景：通過 Ajax 方式請求`**/api/v1.0/user/{id}`接口獲取某個用戶的信息(Asynchronous behavior)，然後針對拿到的用戶信息進行後續的處理。
典型的做法是將`Ajax`異步請求之後進行的操作封裝成`callback()`函數，在接口訪問成功得到用戶信息之後再執行該函數：

```js
function getUserInfoCallback(id, callback) {
  $.ajax({
    url: `**/api/v1.0/user/${id}`,
    success: data => callback(null, data),
    error: (xhr, textStatus, errorThrown)
      => callback(new Error(textStatus), errorThrown),
  })
}
getUserInfoCallback('10086', handleUserInfo)
```

### Promises/A+

> An open standard for sound, interoperable JavaScript promises—by implementers, for implementers.

濫用回調帶來的問題是代碼邏輯耦合度很高，面臨回調災難。Promises/A+是種合理使用回調的**規範**，避免回調的濫用。

#### 特點一：提供好看的 API，由嵌套回調([callback hell](http://callbackhell.com/))轉向鏈式語法

首先將請求用戶信息的 Ajax 異步操作包裝成一個 Promise 實例，後續的同步行為通過該實例對象的`then()`方法調用。

```js
function getUserInfoPromise(id) {
  return new Promise((fulfill, reject) => {
    $.ajax({
      url: `**/api/v1.0/user/${id}`,
      success: fulfill,
      error: reject,
    }) // end $.ajax
  }) // end return
} // end getUserInfoPromise

getUserInfoPromise('10086')
  .then((userInfo) => handleUserInfo)
  .catch(console.log)
```

#### 特點二：Promises 不會與回調綁定耦合，可緩存異步操作結果

假設存在這樣的一個業務場景：獲取用戶 id 為`10086`的用戶信息，然後在不同的兩個階段對其異步操作獲取的用戶信息進行兩種不同的操作（分別為`handleUserInfo()`和`console.log()`）。
在兩個階段中，都需要異步操作獲取得到的`userInfo`數據，如果採用傳統回調方式，一般採用閉包的方式緩存`userInfo`或者暴力點重複進行一次 Ajax 異步請求。

但是採用 Promise 方式，則無需這些很**複雜**的實現方式，因為可以重複使用 Promise 對象。

```js
// 閉包緩存
let globUserInfo = null
getUserInfoCallback('10086', (userInfo) => (globUserInfo = userInfo))
// 難以保證 globUserInfo 已經更新
handleUserInfo(globUserInfo)
console.log(globUserInfo)

// 進行了兩次異步操作
getUserInfoCallback('10086', handleUserInfo)
getUserInfoCallback('10086', console.log)

// 保存Promise對象
const userInfoPromise = getUserInfoPromise('10086')
userInfoPromise.then(handleUserInfo)
// 可以再次使用`userInfoPromise`對象
userInfoPromise.then(console.log)
```

- 這種策略和函數式編程中[lazy evaluation](https://en.wikipedia.org/wiki/Lazy_evaluation)概念是類似的，強調`call-by-need`。
- 也可以對異步操作進行柯裡化([Curring](https://en.wikipedia.org/wiki/Currying))暫存異步操作的結果（類似的概念還有 thunk，參考[node-thunkify](https://github.com/tj/node-thunkify)）。

#### 特點三：可組合，復用

類似於函數式編程中推廣的從已有的函數中創建新函數，也可以通過已有的 Promise 對象生成新的 Promise 對象。
比如獲取多個用戶信息，可使用`Promise.all()`方法實現異步操作的組合：

```js
const promises = ['10010', '10086', '10000'].map(
  (id) =>
    new Promise((fulfill, reject) =>
      $.ajax({
        url: `**/api/v1.0/user/${id}`,
        success: fulfill,
        error: reject,
      })
    )
)
const userInfosPromise = Promise.all(promises).then(console.log).catch(console.log)
```

> 感覺上 Promise/A+規範是函數式編程概念在前端領域的一次最佳實踐（回調的語法糖）。更多詳細的內容待補充。

### Event Emitters

事件監聽式異步編程本質上還是依賴於回調函數實現的，區別在於回調函數並不執行異步行為完成後需要的操作，而是發佈一個通知去觸發執行相應的函數。

```js
import EventEmitter from 'events'
const emitter = new EventEmitter()
// 註冊
emitter.on('event', handleUserInfo)
$.ajax({
  url: `**/api/v1.0/user/10086`,
  success: (data) => emitter.emit('event', data), // 觸發：異步操作這個行為帶來的影響
  error: console.log,
})
```

事件監聽其實是觀察者模式的一種實現：當一個對象發生變化時，所有依賴他的相關操作都會得到通知，只不過事件監聽弱化了對象的變化而強調行為（對象數據變更也是一種行為）。
比如上面的代碼段強調的是 Ajax 操作這個行為，一旦完成就**通知**到`handleUserInfo()`函數的調用，並攜帶參數變更對象數據。

如果採用觀察者模式的話，一般這樣直接處理數據（強調數據變化帶來的影響，造成數據變化的場景可能存在多處），然後觸發數據變動後的行為：

```js
let userInfo = null
emitter.on('event', () => handleUserInfo(userInfo))
const updateUserInfo = data => {
  userInfo = data       // userInfo對象方式變更
  emitter.emit('event') // 通知相關依賴的操作：數據變更帶來的影響
}
$.ajax(
  url: `**/api/v1.0/user/10086`,
  success: updateUserInfo, // 觸發
  error: console.log,
})
```

很明顯，觀察者模式要比事件監聽方式擴充性更強（雖然本質一致，但是強調側重點不同）。

<figure style="padding-top: 0;margin-top: .5em;">
  <img src="/blog/javascript-async/pingpong.gif" />
  <figcaption>陷入`emit`死循環</figcaption>
</figure>

事件監聽式異步編程無異於`goto`語句，稍有不慎形如`on()`、`emit()`、`subscribe()`、`publish()`等方法摻雜在各處，“剪不清，理還亂”；如果不是“約定”化編程不建議採用。比如下面這段源碼，稍不慎就陷入如圖 1 所示場景。

```js
const emitter = new EventEmitter()
const foo = () => emitter.emit('bar')
const bar = () => emitter.emit('foo')
emitter.on('foo', foo)
emitter.on('bar', bar)
foo() // 陷入死循環
```

和回調式異步編程（包括 Promises/A+規範）相比，事件監聽式異步編程的軟肋在於需要手動註冊(Manual)。
原本可以通過數據綁定(Data binding)[Object.observe()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe)方法來實現觀察者模式，很可惜該方法已被`deprecated`掉；目前推薦的是`get`和`set`+[Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)方式實現（相關討論：[36258502](http://stackoverflow.com/questions/36258502/why-object-observe-has-been-deprecated)）。

但是手動維護這些`on()`、`emit()`、`get()`、`set()`等方法在項目是很折騰的，通過一些第三方工具包可以實現由`Manual`到`Automatic`轉變。
比如採用[MobX](http://mobxjs.github.io/mobx/index.html)可以實現得更加優雅：

```js
import { observable, autorun } from 'mobx'
const store = observable({userInfo: null})
// 只要變動`store`對象，就會自動觸發`handleUserInfo()`函數
autorun(() => handleUserInfo(store.userInfo))
$.ajax(
  url: `**/api/v1.0/user/10086`,
  success: data => store.userInfo = data,
  error: console.log,
})
```

### Generator

#### [Coroutine](https://en.wikipedia.org/wiki/Coroutine) 協程 (a.k.a. co-operative routines)

一般程序中，函數調用一定是從頭到尾執行直到遇到`return`或執行完；
而 coroutine 則容許函數執行到一半時就中斷(yield)，中斷時函數內部上下文環境(context)會被緩存下來。
程序主體可以隨時恢復(resume)這個被緩存的 coroutine，繼續從剛才被中斷處執行後續內容。

```js
function* foo() {
  console.log('hello')
  yield 10086 // 在此處中斷 coroutine
  console.log('world')
}

const bar = foo() // 保存 coroutine 內部狀態的變量
bar.next() // 調用`foo()`函數，遇到 yield 中斷程序調用
console.log('main, not in `foo()`') // 已經從`foo()`函數中跳出來了，可以幹些其它事情
bar.next() // 恢復`foo()`的調用，從 yield 中斷處繼續執行
```

#### Thread VS Coroutine

> With threads, the operating system switches running threads preemptively according to its scheduler,
> which is an algorithm in the operating system kernel.
> With coroutines, the programmer and programming language determine when to switch coroutines;
> in other words, tasks are cooperatively multitasked by pausing and resuming functions at set points,
> typically (but not necessarily) within a single thread.<br />
> —— [stackoverflow: difference-between-a-coroutine-and-a-thread](http://stackoverflow.com/questions/1934715/difference-between-a-coroutine-and-a-thread)

#### [Generator](<https://en.wikipedia.org/wiki/Generator_(computer_programming)>) (a.k.a. semicoroutines) VS Coroutine

Generator 與 Coroutine 的區別是 Generator 只能從上次中斷處繼續執行，而 Coroutine 則沒有這樣的限制（可以指定從哪裡繼續執行）。
因此，Generator 可以視作是 Coroutine 的一種特殊情況，上文涉及的源碼例子其實就是 Generator 的應用舉例。
其中，Generator 涉及`bar.next()`自動流程管理的解決方案可以參考[co](https://github.com/tj/co)、[thunks](https://github.com/thunks/thunks)等。

#### async/await “語法糖”

聲明的`async`函數就是將 Generator 函數和自動執行器包裝在一個函數裡面（參考[async2generator()](https://gist.github.com/solome/064e48f5205943dff7d4918b3bf18e0d)），
以達到異步編碼編程模式與同步編碼一致。

```js
const run = async () => {
  const userInfo = await new Promise((fulfill, reject) => {
    $.ajax({
      url: `**/api/v1.0/user/${id}`,
      success: fulfill,
      error: reject,
    }) // end $.ajax
  }) // end return
  handleUserInfo(userInfo)
}
```

### 不是總結的總結

- 函數式編程領域的知識還是要多多接觸的。
- 有些前端領域的新鮮事物在其他領域可能就是些習以為常的東西，擴充知識面很重要。

### References

- [Callback Hell](http://callbackhell.com/): A guide to writing asynchronous JavaScript programs.
- [Promises/A+](https://promisesaplus.com/): An open standard for sound, interoperable JavaScript promises—by implementers, for implementers.
- [promisejs.org](https://www.promisejs.org/): A website dedicated to promises in JavaScript.
- [regenerator](https://facebook.github.io/regenerator/): Source transformer enabling ECMAScript 6 generator functions in JavaScript-of-today.
- [ecmascript-asyncawait](https://github.com/tc39/ecmascript-asyncawait): Async/await for ECMAScript.
- [whats-the-big-deal-with-generators](http://devsmash.com/blog/whats-the-big-deal-with-generators)
- [Threads, Fibers & Coroutines](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n4287.pdf)
