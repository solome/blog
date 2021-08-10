---
title:  "前端工程化开发方案app-proto"
date:   2017-01-05 20:00:00 +0800
categories: 技术分享
---

> 本文是针对去年（2016年10月）美团点评技术沙龙第13期分享的[《前端工程化开发方案app-proto介绍》](https://www.slideshare.net/meituan/13appproto)整理而来的技术博客。
年初的时候又针对Koa2.0做了些许语法适配和完整的SSR支持（[app-proto-2.0](https://solome.js.org/slides/app-proto-2.0/)）。

什么是前端工程化？根据具体的业务特点，将前端的开发流程、技术、工具、经验等规范化、标准化就是前端工程化。
它的目的是让前端开发能够"自成体系"，最大程度地提高前端工程师的开发效率，降低技术选型、前后端联调等带来的协调沟通成本。

美团点评厦门智能住宿前端研发团队通过多个前端项目开发的探索和实践，基于"约定优于配置"（[Convention Over Configuration](https://en.wikipedia.org/wiki/Convention_over_configuration)）的原则制定了一套前端工程化开发方案app-proto。本文将简要介绍其中的一些设计细节和约定。

#### 面临的业务特点

智能住宿前端团队承担的前端业务主要面向B端项目，用户主要是商家、销售、运营、产品经理以及研发人员。

诸如工单管理、信息管理、门锁运营、PMS（[Property management system](https://en.wikipedia.org/wiki/Property_management_system)）、CRM（[Customer relationship management](https://en.wikipedia.org/wiki/Customer_relationship_management)）及AMS（[Asset management system](https://en.wikipedia.org/wiki/Asset_management)）等项目都是单页面工具类应用，特点是功能交互繁多、复杂表单，非展示类、无SEO（[Search engine optimization](https://en.wikipedia.org/wiki/Search_engine_optimization)）需求。

如果这些项目脱离浏览器这个"外壳"，与传统的原生桌面GUI软件无异。换言之，这些项目就是一种运行于浏览器的工具软件。

> 实际上，部分项目我们也确实利用CEF（[Chromium Embedded Framework](https://bitbucket.org/chromiumembedded/cef)）等技术给其套个"外壳"，当作传统的桌面GUI应用提供给用户使用。

同时，部分服务需要从智能门锁、控制盒Wifi等硬件设备收录状态数据，限于硬件环境测试的不稳定性，后端的开发测试周期远比前端开发周期长。大部分场景下，前后端需并行开发，后端工程师并不能在第一时间兼顾到前端所需的API接口等服务，给前端开发造成没有必要的"等待期"，影响开发进度。

此外，项目多、敏捷需求多、开发周期短以及面向多后端服务（多个后端团队）等也是我们前端研发团队面临的挑战。

#### 一些前端经验总结

针对多个项目的开发实践和探索，我们在对前端工程化设计中得到如下一些经验总结：

- 前端开发应该"自成体系"（包括构建、部署及前端运维），不应该和后端项目耦合在一起。
- 避免"大而全"的重量级框架，一个框架真的满足不了所有的业务场景。项目多了，我们又不想为每个新项目重新造一遍技术"轮子"。
- 新的前端技术（[React](https://facebook.github.io/react/)、[Vue](https://vuejs.org/)、[Angular2](https://angular.io/)等）和工具（[Grunt](http://gruntjs.com)/[gulp](http://gulpjs.com)、[webpack](https://webpack.github.io)、[Babel](https://babeljs.io)等）不断涌现、迭代，新技术选型应避免"改头换面"式重构。
- 工程化设计要合理分层且相互独立，随时应对新需求和技术的变化，任何一层能够低成本被替换、淘汰。


#### 设计概览

目前，app-proto将前端工程化项目拆分成三大模块：Node服务（负责数据代理、url路由和服务端渲染）、Web应用开发（专注Web交互体验）以及前端运维（构建、测试、部署及监控等）。整体的结构设计如图1所示。

<figure>
  <img src="/blog/tech-salon-13-app-proto/structural-design.svg" onerror="if (!this.failed) {this.failed=1;this.src=this.src.replace(/\.svg$/, '.png');}" alt="Structural Design" />
  <figcaption>app-proto 结构设计图</figcaption>
</figure>

- Node服务：用于实现前后端分离，核心功能是实现数据代理中转，附带url路由分发和服务端渲染功能。
- Web应用开发：纯粹的前端模块，给予前端工程师极大的自由度进行技术选型，专注于Web交互体验的开发。
- 前端运维：主要指前端项目构建和部署、工程质量（源码质量检查和测试等）及监控服务（日志、性能等）等工作。

#### 前后端分离

正如前文所强调的，前端模块开发应该"自成体系"，而不是后端项目的一部分（Controller或View层）。比如说，前端工程师要在本地跑通完整的项目，就必须配置好后端所需开发环境和各种服务，如果后端涉及的服务多、变化频繁，配置开发联调环境工作往往是耗时耗力的。为了实现彻底的前后端分离，我们在前端开发体系中引入了Node服务层。

在最初的开发中，为了降低Node端的开发和运营成本，我们极力避免在Node服务中"掺合"过多的业务逻辑。经过几个项目的实践，最后"约定"在Node服务中我们仅仅做三件事：数据代理、路由分发和服务端渲染。

##### 数据代理

首先，前端数据从何而来？通过Ajax的形式直接从后端服务中获取数据是传统的方式，但是在应对多后端服务时，还是面临着诸如请求认证、CORS([Cross-origin resource sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing))等困扰。常见的解决方案是通过[http-proxy](https://github.com/nodejitsu/node-http-proxy)，即在Node端通过HTTP请求得到数据后，Web端再通过Ajax的方式从Node端间接获取后端数据，Node服务起到"桥梁"的作用。

方案`http-proxy`对已经成熟的后端服务是具备实用价值的，但是在后端服务并没有完成开发（或前后端并行开发）的场景下时，开发阶段前端的数据来源依旧是个问题。同时，前端还面临诸多请求合并、缓存等需求，解决这些困扰，前端工程师需要和后端技术人员做大量的沟通、约定。

在这里，我们基于原有的`http-proxy`基础上在Node服务中添加`datasources`模块，尝试在数据的处理上给予前端工程师很大的自由度，并实现"按照约定写代码"。

举例说明，开发某一前端业务时涉及到`pms`和`upm`两个后端服务，且提供的API内容如下：

```bash
# pms API
pms/api/v2.01/login
pms/api/v2.01/inn/create
pms/api/v2.01/inn/get

# upm API
upm/api/v3.15/menu
```

面对这些接口，理想情况下前端直接通过`ajax.post('pms/api/v2.01/login', params)`方式获取即可。但是，`pms`接口服务尚处在开发阶段，面临跨域或不可用问题。`upm`接口服务虽稳定，但是该服务由第三方团队维护，请求需要权限认证。传统的Ajax方式在这类场景下并不适用。而`datasources`模块是通过怎样的设计来优化这些问题的呢？首先，我们将前端需要的API映射到前端源码仓库，映射的目录结构如下：

```bash
# server/datasources/{后端系统}/{接口目录}
── datasources
    ├── pms
    │   ├── login.js
    │   ├── login.json
    │   └── inn
    │       ├── create.js
    │       └── get.js
    └── upm
        ├── menu.js
        └── menu.json
```

其中，每个`**.js`后缀的文件的内容是将原本Web端Ajax操作转移到Node端的HTTP请求，以`pms/login.js`为例：

```js
/* async 函数 */
export default async function (params) {
  const http = this.http
  const pms = this.config.api.pms
  try {
    const apiUri = `${pms.prefix}/login`
    // http 请求：http.post() 方法封装了权限认证
    const result = await http.post(apiUri, params)

    // 简单的数据格式校验
    if (Number(result.status) === 0 &&
      ('data' in result) &&
      ('bid' in result.data)) {
      // 将bid值记录至session
      this.session.bid = result.data.bid
    }
    return result
  } catch (e) {
    // 后端API出现异常 (实时通知 or 记录日志)
  }
  return null
}
```

当然，对于那些已经成熟稳定的API服务直接通过`http-proxy`方式实现数据中转即可。但由于需求变更频繁，后端API服务始终处在不断迭代中，前端在进行数据处理过程中总会面临如下的几种情况：

- 接口校验或数据二次加工：面临多后端服务，API的格式可能不一致；或者对数据列表排序加工等。
- 合并请求：可以发多个http请求，避免Web端同时发送多个Ajax请求。
- 前端运维的数据：比如城市字典、阴阳历转换表等固定数据。
- 缓存数据：如请求的用户信息，短期内不会有大变动，可以采用[Half-life cache](https://github.com/th507/node-hl-cache)等算法实现简单缓存。
- 需权限认证的接口：[HTTP Authentication](https://tools.ietf.org/html/rfc2617)。

这些场景下都建议使用`datasources`模块进行数据中转，将原本需由前后端沟通协调才能实现的功能全部交给前端自行处理，给予前端工程师处理数据提供自由度的同时也降低了后端API的开发维度。

那该如何快捷地调用`datasources`目录下的`async`函数呢？这里我们做了简单封装，将该目录下的所有`**.js`文件解析到Koa的上下文环境中以`this.ds`对象进行存储，并按照目录结构进行驼峰式（[Camel-Case](https://en.wikipedia.org/wiki/Camel_case)）命名，转换过程见图2。

<figure>
  <img src="/blog/tech-salon-13-app-proto/datasources-recipes.svg" onerror="if (!this.failed) {this.failed=1;this.src=this.src.replace(/\.svg$/, '.png');}" alt="datasources-recipes" />
  <figcaption>datasources 目录解析转换过程</figcaption>
</figure>

在Koa中间件中通过`this.ds`对象调用，比如`src/datasources/pms/login.js`函数映射至`this.ds.PmsLogin()`：

```js
// Koa Middlewares
app.use(async (ctx, next) => {
  // ..`.
  // 最后一个参数为是否使用mock
  const loginData = await this.ds.PmsLogin(params, false)
  // ...
})
```

在Web端可以统一封装`ds()`方法，无需关注Ajax请求`Headers`、是否跨域等问题：

```js
// Web (Browser)
ds('PmsLogin', { username, password }, true)
  .then(success)
  .catch(error)
```

##### Mock支持

正如前文所提到的，后端研发进度一般滞后于前端，在后端API服务可用之前，前端仅有一份API文档供参考。在规范中，`**.json`后缀的文件就起到Mock作用，同样以`pms/login.json`举例：

```json
{
  "status": 0,
  "message": "成功",
  "data": { "bid": "@string(32)", "innCount": 1 }
}
```
>具体的`json`格式写法请参考[mockjs](http://mockjs.com/)、[Syntax Specification](https://github.com/nuysoft/Mock/wiki/Syntax-Specification)。

简言之，当API服务可用时则执行`**.js`后缀文件中的`async`函数来获取数据，不可用时则解析`**.json`后缀Mock文件，并不需要单独开启一个Mock服务。

#### 路由分发

对url路由的处理和数据代理的做法类似，按照目录结构来管理。url路由配置在`server/pages`目录下，目录下的文件会自动映射成为路由。

比如url为`http://example.com/pms`页面，映射到`server/pages/pms.js`文件的写法如下：

```js
export default {
  urls: ['/pms', '/pms/error'],       // 多种正则如：['/pms', ['/pms/v1'], ['/pms/v**']]
  methods: ['GET'],                   // 多种method：['GET', 'POST']
  js: ['http://code.jquery.com/jquery-1.12.0.min.js'],
  css: ['http://yui.yahooapis.com/pure/0.6.0/pure-min.css'],
  template: 'default',                // 服务端渲染模板
  middlewares: [],                    // 针对本页面的中间件
  controller: async function(next) {  // Koa中间件最后一环
    // 可以从this.ds对象中拿数据
    const loginData = await this.ds.PmsLogin(params)
    return {foo: '来自服务端数据', loginData}
  }
}
```

由于`urls`支持多种正则，原则上每个根url映射`server/pages/`目录下一个`**.js`文件，映射关系如图3所示。

<figure>
  <img src="/blog/tech-salon-13-app-proto/pages-recipes.svg" onerror="if (!this.failed) {this.failed=1;this.src=this.src.replace(/\.svg$/, '.png');}" alt="pages-recipes" />
  <figcaption>pages目录文件与url映射关系</figcaption>
</figure>


如果对`js`、`css`、`template`没有特殊设置（采用默认设置）的情况下，可精简如下：

```js
export default {
  urls: ['/pms', '/pms/error'],
  controller: async function (next) {
    const loginData = await this.ds.PmsLogin(params)
    return {foo: '来自服务端数据', loginData}
  }
}
```

需要注意的是，`controller`项是Koa中间件的最后一环，要求其返回值是可序列化的对象用于模板渲染的服务端参数，在此处也可以进行权限校验、从`this.ds`对象中拿数据等操作。

##### 服务端渲染

Node服务端最后一个核心功能是渲染：输出 HTML Shell和 JSON。输出JSON字符串的用途是为了浏览器端能以Ajax形式动态获取数据，而输出的HTML内容则是我们Web应用的所需的HTML"壳子"。

正如前文提到我们的业务特点是"一种运行于浏览器的工具软件"，重操作交互、无SEO需求。因此，同构（[Isomorphic JavaScript](http://isomorphic.net/)）不是强需求，不是每次都要依赖服务器来重复处理逻辑和数据。服务端只需要渲染简单完善的HTML结构即可，具体的页面内容则由客户端JavaScript实现。简言之，不鼓励将前端JavaScript脚本再在Node服务端重复执行一遍。

> 如果了解过Google推崇的 [Progressive Web App](https://developers.google.com/web/progressive-web-apps/)，你可以参考《[The App Shell Model](https://developers.google.com/web/fundamentals/architecture/app-shell)》一文来理解HTML"壳子"更多的用途。

渲染最简单的HTML"壳子"如下:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <title>app-proto</title>
    <script>window.serveData={foo: '来自服务端数据'}</script>
  </head>
  <body>
    <div id="app"></div>
    <script src="//cdn/file-5917b08e4c7569d461b1.js"></script>
  </body>
</html>
```

提供简单的服务端数据`window.serveData`供客户端使用，更多渲染则由`//cdn/file-5917b08e4c7569d461b1.js`进行增量控制。


###### 静态资源与Node端衔接

那Web端构建的静态资源是如何Node服务端做衔接的呢？前端静态资源构建工作与Node服务相互分离，Node服务在开启的过程中会读取前端构建生成的静态资源映射表。前端的构建过程如图4所示，在构建工作完成之后会生成`assets.json`静态资源映射表。

<figure>
  <img src="/blog/tech-salon-13-app-proto/static-file-map.svg" onerror="if (!this.failed) {this.failed=1;this.src=this.src.replace(/\.svg$/, '.png');}" alt="pages-recipes" />
  <figcaption>静态资源映射文件assets.json构建</figcaption>
</figure>

> 前端构建工具基本都提供静态资源映射表生成插件，比如构建工具Webpack就存在插件[assets-webpack-plugin](https://github.com/kossnocorp/assets-webpack-plugin)来实现该功能。

生成的`assets.json`映射表内容参考如下：

```js
{
  "index":        // 对应的页面（url: example.com/index）
    { "js":"//s0.example.net/pms/index-2abb99.js" },  // 涉及到的静态资源列表（带版本号）
  "login":
    { "js":"//s0.example.net/pms/login-5917b0.js" }
}
```

比如在渲染页面`example.com/index`时，Node服务会以`index`作为键值，读取`assets.json`中带版本号的静态资源CDN地址列表，用于在"壳子"中与前端资源的衔接工作。

### Web端的一些"约定"

Web端的技术选项是没有强制性限制的，无论你采用何种构建工具、前端库，只要生成符合约定供Node端使用的`assets.json`文件即可。

前端工程师可以根据具体的业务特点、团队技术喜好来选取合理的开发方案，无论是React、Vue还是Angular2并不做强限制。尽管给予Web前端开发很大的自由度，但是鼓励遵循下面几条"约定"：

- Ajax请求从Node端代理，而非具体后端服务。
- 鼓励将JavaScript、CSS、HTML视为前端领域的"汇编"。
- 重视前端页面状态管理，推荐的方案有[Redux](https://github.com/reactjs/redux)、[vuex](https://github.com/vuejs/vuex)及[MobX](https://github.com/mobxjs/mobx)等。
- 强调组件化，面向组件集开发。

这里重点强调下面向组件集的前端开发。在项目初期我们一般不会马上投入到业务开发，而是针对设计师和产品经理提供的设计稿、产品原型图实现一套组件集或选择合适的开源组件集，积累好基础组件集后再投入到具体业务开发。

在进行前端技术调研时，该技术是否有配套的开源组件集往往是我们考虑的重点。比如基于React实现的开源组件集[ant.design](http://ant.design/)、[Material-UI](http://www.material-ui.com/)等，我们部分前端项目都直接或间接的使用到了，极大地减少了研发成本。

当然，美团点评内部也提供一个组件中心平台（可参考[美团点评前端组件中心介绍Slide](https://slides.com/solome/mt-components-hub/live#/)），鼓励大家将各自项目中的有价值组件分享出来，实现组件跨项目复用。

#### 工程化支持

##### 项目脚手架

项目脚手架的作用是在启动一个新项目时，通过几个简单命令就能快速搭建好项目的开发环境。我们基于[Yeoman](http://yeoman.io/)构建了一个完整的项目脚手架。

```bash
# 安装脚手架
$ npm install -g yo
$ npm install -g @ia/generator-app-proto@latest
# 初始化新项目（进行简单选择）
$ yo @ia/app-proto
```

##### 工程质量保障

我们重视项目的每次`commit`，同个项目要求遵循同一套编码规范，并采用[ESLint](http://eslint.org/)等工具进行约束，对于一些复用性高的核心组件也强制要求写测试。
为保障项目质量，每个项目都要求接入美团点评基于[Stash](https://en.wikipedia.org/wiki/Stash_(software)实现的Castle CI系统，每次的源码提交都会自动执行一遍ESLint、测试和构建，并生成构建日志通过公司内部沟通工具大象进行实时消息推送。

##### 标准化测试环境管理

美团点评内部提供了基于Docker实现的测试环境管理服务Cargo，用于提升测试和联调测试效率，促进DevOps开发模式。将项目接入到Cargo服务后，只需在仓库中提供简单的配置文件`cargo.yml`（配置参考如下），就会自动生成一套测试环境。

```bash
# 依赖的镜像
image: registry.cargo.example.com/node:v4.2.1
# 容器占用的端口
ports:
  - '8998'
# 环境变量
env:
  -  COMMON_VARIABLE = 'true'
  -  NODE_ENV = 'cargo'
  -  DEBUG = 'app-proto,datasource.*'
# 收集的日志文件
logs:
  -  error = /var/path/logs/app-proto/error.log
  -  out = /var/path/logs/app-proto/out.log
# 构建脚本
build_script: bin/pre-deploy-staging
# 运行脚本
run_script: bin/cargo-start
```

#### 总结

前端工程化体系的引入，让前端开发能和原生App应用项目开发一样"自成体系"，脱离了对后端项目的依赖。基于"约定优于配置"、"按照约定写代码"的原则对Node层功能的设定能够降低沟通协调成本，构建、部署等工作的规范化，使前端技术人员的开发重点回归到Web应用的交互体验本身，回归到"纯粹"的前端研发。
