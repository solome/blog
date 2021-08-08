---
layout: layout/post
title:  "VR 及 3D 技术在 Web 端架构设计与实践"
date:   2021-07-18 23:30:00 +0800
categories: 技术分享
---



> 本文基于2021年GMTC全球大前端技术大会"移动技术新趋势"专题下主题分享[《VR 及 3D 技术在 Web 端架构设计与实践》](//gmtc.infoq.cn/2021/beijing/presentation/3531)整理而来。内容与当日分享基本无异，仅以文字的形式重新整理一遍。

<style type="text/css">
body, .article-inner {background-color: white;}
article .ref {display: flex;line-height: 1;border: none;border-radius: 4px;padding: 12px;margin: 12px 0 0;background-color: rgb(239 236 236);border-bottom:none;font-family: Roboto, -apple-system, BlinkMacSystemFont, sans-serif;}article .ref:hover {background-color: rgb(228 223 223);}.ref-img {width: 56px;height: 56px;}.ref-content {padding: 0 0 0 12px;flex: 1;flex-direction: column;display: flex;min-width: 10px;}.ref-title, .ref-subTitle, .ref-link {overflow: hidden;white-space: nowrap;text-overflow: ellipsis;}.ref-title {font-size: 16px;font-weight: 500;line-height: 20px;color: rgb(31, 34, 37);}.ref-subTitle {line-height: 19px;}.ref-link {line-height: 17px;color: rgb(161, 162, 163);}
.fancyboxflex .fancybox {flex: 1;}
</style>
<a class="ref" href="//gmtc.infoq.cn/2021/beijing/presentation/3531" target="_blank">
  <img class="ref-img" src="/blog/gmtc-vr3d/5c7caa3b1c540.jpeg">
  <div class="ref-content">
    <div class="ref-title">GMTC_全球大前端技术大会-InfoQ</div>
    <div class="ref-subTitle">"GMTC是由极客邦科技和InfoQ中国主办的顶级技术盛会，关注移动、前端、AI应用等多个技术领域，促进全球技术交流，推动国内技术升级。GMTC为期4天，包括两天的会议和两天的培训课，主要面向各行业对移动开发、前端、AI技术感兴趣的中高端技术人员，大会聚焦前沿技术及实践经验，旨在帮助参会者了解移动开发&前端领域最新的技术趋势与最佳实践。"</div>
    <div class="ref-link">https://gmtc.infoq.cn/2021/beijing/presentation/3531</div>
  </div>
</a>

VR 看房是 VR 及 3D 技术落地的场景之一，其特点是通过手机终端就能让人真正的置身其中，用自己直觉的空间感去感受整个房屋特征。本次分享将介绍贝壳如视前端团队是如何基于 VR 3D 模型进行前端架构设计的。除此之外，还将分享我们团队是如何基于 VR 看房能力探索新的业务形式以及面临的技术挑战。

## 基于 VR 3D 模型前端架构设计

在讲前端架构设计之前，先详细介绍下看房场景下的 VR 3D 模型的组成及形态。

### 看房 VR 3D 模型的组成及形态

房源的 VR 3D 模型的形态有多种，但在用户层面直观感受到的主要有三个形态：3D 模型形态、点位全景形态及 VR 眼镜视角形态。下面对这三个形态做详细介绍。

#### 3D 模型

首先，我们简单思考一下三维模型是如何在二维平面抽象建模的？目前主流的三维模型抽象建模是基于多边形网格（Polygon Mesh），如图一所示。整体感知就是多边形面片愈多（面片密度）还原的三维立体效果愈真实。最精简的多边形自然是三角形（大部分场景下说的面片即三角面片），三维物体的每个细节可以通过三角面片的顶点、边及面等几何数学概念来描述。微观上来看，基于面片建模的三维模型本质上都是密度及其复杂的几何体。

<figure>
  <img src="/blog/gmtc-vr3d/pic1.png"  alt="多边形网格模拟立体效果" />
  <figcaption>图一：多边形网格模拟立体效果</figcaption>
</figure>

因此，依赖一些专业 3D 扫描仪（比如如视自研的黎曼、伽罗华等扫描仪）或全景相机等设备采集数据后，再通过算法加工可以获取这些描述三维立体结构的三角面片数据。前端再利用 WebGL/Three.js 等技术将其渲染至浏览器上，此时我们能得到房源的三维立体轮廓，效果如图二（左）所示的网格模型。当然，图二（右）才是我们期望的效果，仅仅有三维"骨架"轮廓是不够的，我们需要在此基础上贴一层"皮肤"，而这层"皮肤"则是通过UV纹理贴图添加上的。

<figure>
  <div style="display:flex;" class="fancyboxflex">
    <img style="width:100%;" src="/blog/gmtc-vr3d/pic2left.gif" />
    <img style="width:100%;" src="/blog/gmtc-vr3d/pic2right.gif" />
  </div>
  <figcaption>图二：三角面片描述的三维效果</figcaption>
</figure>

对于三维模型有两个比较重要的坐标系统，一个是顶点的位置`(x,y,z)`坐标，另一个则是UV坐标。什么是UV呢？简言之，就是二维平面贴图映射到三维模型表面的依据。比如典型的UV贴图效果如图三所示，刚刚前文提到三维结构是通过顶点、边及面组成的三角面片组成的，这个三角面是二维的，通过一些数据依赖映射关系从UV贴图中抠出一个相同边、面的三角形贴到三角面片上。所以，此处的UV即指定义了二维平面图片每个点的位置与三维结构三角面片位置的映射关系信息。作为前端工程师，这个跟前端雪碧图（Sprite）概念将多个图标合并成一张图的原理是一致的。

<figure>
  <img style="width: 35%" src="/blog/gmtc-vr3d/pic3.png"  alt="房源UV贴图" />
  <figcaption>图三：房源UV贴图</figcaption>
</figure>

至此，基于三角面片和UV贴图数据我们成功渲染出了房源的 3D 模型。当然，出于性能考虑我们的三角面片密度不是特别高的，纯粹依靠 3D 模型在终端设备（iOS\Android等）还原房源的真实细节现阶段并不现实。三角面片少，数据量低，内存占用低，我们可以通过 3D 模型还原房源的整体结构。至于细节，则通过点位立方体全景的方式去实现。

#### 点位全景

前文提到房源的整体结构通过 3D 模型体现，至于细节则通过全景的形式来表现。我们会在房源选择多个合适的点位拍摄全景图片，然后以立方体全景的方式渲染以实现720 º环顾的效果，如图四（左）所示。

<figure>
  <div style="display:flex;">
    <div style="flex: 5;display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic4left.gif"  alt="全景效果" /></div>
    <div style="flex: 14;padding: 0 0 0 40px; display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic4right.png"  alt="全景贴图展开" /></div>
  </div>
  <figcaption>图四：立方体全景效果及其展开</figcaption>
</figure>

全景的实现是比较成熟的技术，主流的实现方式有立方体全景和球型全景。两种方式各有优缺点，由于立方体全景二次加工成本低如视目前以立方体全景技术实现为主。立方体全景的原理是渲染一个立方体盒子，给其上、下、前、后、左和右六个面各贴上一张图。需要注意的是，这六张图从中选择连续的四张图拼接在一起是一张连贯的全景图，如图四（右）所示T字形立方体贴图展开。此时，当人眼放置在立方体中心点观望四周是连贯的全景效果。

全景的效果完全依赖贴图的清晰度，所以我们可以拍摄高清2048分辨率的全景图片去体现房源某个位置的细节信息。这也是看房 VR 3D 模型的第二个核心形态点位全景形态。


#### VR 眼镜全景

前文提到的 3D 模型和点位全景形态都是基于二维显示屏展现的（裸眼体验），如果想让用户具备身临其境的感觉往往需要依赖 VR 眼镜设备。针对这类设备我们需要适配[WebXR Device API](//www.w3.org/TR/webxr/)，我们现阶段的适配策略是渲染两个相同的点位立方体全景，分别供左右眼感知。最终适配的效果如图五所示。

<figure>
  <div style="flex: 1;"><img src="/blog/gmtc-vr3d/pic5left.gif"  alt="眼镜全景" /></div>
  <figcaption>图五：VR 眼镜全景</figcaption>
</figure>

限于大部分用户的设备还是iOS\Android，目前的裸眼 VR 3D 体验是主流。随着硬件设备的推广，等到 VR 眼镜走向普通用户时，这种更具身临其境的体验会慢慢更多用户接触到。

当然，除了本文提到 3D 模型形态、点位全景和 VR 眼镜全景三种形态之外，我们内部还有多种其他形态，如模型垂直视角、深度图渲染的全景视角等形态，但是偏技术领域且与普通用户感知不深，此处不详细介绍了。

最后，基于这三种形态外加一个房源的二维户型图就组成了我们看房 VR 3D 模型的核心结构，在此基础不断完善各种交互（比如形态间切换补间Tween动画）、产品功能逐步演变成大家所熟悉的贝壳如视 VR 看房。

> 演讲问答环节及后续的反馈情况来看，大家对分享提到的形态间切换的Tween动画实现比较感兴趣，且部分同行表示自己实现的效果达不到如视的移动真实感。此处细节较多，准备后续单独出文章分享，本文暂不花费篇幅详细介绍。

### 前端架构分层设计

<figure>
  <img src="/blog/gmtc-vr3d/pic6.png"  alt="前端架构分层设计" />
  <figcaption>图六：前端架构分层设计</figcaption>
</figure>

前文提到房源的 VR 3D 模型的组成及三个核心形态，我们实现了通过 3D 技术真实还原房源信息。经过多轮的产品需求迭代，我们在 VR 3D 模型的基础上不断地完善整个前端的架构分层设计。现阶段，整个VR用户端前端设计中我们抽象了三层：Web 服务层、前端数据层和 View 层。

我们将 View 层划分成四个方向进行抽象，第一个方向是纯DOM层的，比如首屏内容、控制面板、信息面板等，这层我们通常以React/Vue 组件进行抽象服用。第二个方向是基于 Canvas/WebGL 渲染的三维视图，其功能即前文提到的房源 VR 3D 模型交互。第三个方向是我们维护的 3D 插件生态，以 VR 3D 模型为基础且以插件的形式派生出新的交互、能力（比如，模型中的指南针、电视视频等均以插件的形式集成）。最后一个方向是协议层抽象，我们 VR 是通过Web前端技术渲染实现的，以WebView作为容器集成在终端App里面，通过jsBridge的方式实现双向通信。为了保障业务代码的统一性，我们将第三方依赖（jsBridge/RTC/WebSocket等）进行一层协议抽象，以达到面向协议开发以抹平不同终端差异性的目的。

<figure>
  <img src="/blog/gmtc-vr3d/pic7.png"  alt="数据序列帧抽象" />
  <figcaption>图七：数据序列帧抽象</figcaption>
</figure>

第二层是数据层的抽象。此处的数据并不是面向后端服务的数据层，而是前端UI交互的数据层抽象。我们将UI交互的状态以全局帧数据的形式抽象出来，当UI发生变化则同步至帧数据；当然，如果帧数据被发生改动（修改帧数据对象）则也会驱动UI发生相同变化。这个过程通过JavaSciprt中Proxy拦截数据对象实现的，如图七。换言之，UI交互能产生新的帧数据，通过帧数据也能还原对应的UI状态。至于，为什么要花费大量精力做这个工作后文讲解业务部分时会有详细介绍。

第三层 Web 层有两个方向的核心服务，其中基于Node.js/Go实现的 HTTP 服务主要提供 VR 页面的HTML"壳子"和首屏数据，而基于WebSocket服务的全双工数据通道则保障了 VR 体验过程与后台服务的实时通讯。WebSocket 长链接技术有传统HTTP方式无可比拟的优势（协议私有、实时性高、性能优异等），对我们业务的智能化、性能体验提升等无可替代，下文描述业务探索和性能体验部分大家会有更深切的感知。

贝壳如视用户端的前端设计大致如此，我们大部分核心业务如VR 语言导览、VR 实时带看和AR 讲房等都是基于此设计研发的。

### 基于 3D 模型与传统 DOM 开发的差异性对比

作为一名工作频繁接触3D相关技术的研发工程师，经常被咨询基于 3D 模型研发与传统DOM开发的区别。与传统前端开发差异性是存在的，但是适应如下三点基本就迈入前端3D开发的门槛。

#### 三维坐标系 vs DOM树

前端DOM树布局是基于CSS盒子模型和Flex布局，页面大部分布局都是基于此实现的，此外还有圣杯、双飞翼等经典布局体系。在二维层面依托强大的CSS，前端布局是随心所欲的。但是放在三维空间，我们大部分时间都在跟坐标系及坐标系间切换打交道。

<figure>
  <img style="width: 50%;" src="/blog/gmtc-vr3d/pic8.png"  alt="三维建模坐标体系" />
  <figcaption>图八：三维建模坐标体系</figcaption>
</figure>

三维研发的首个门槛就是跟各种坐标系打交道，比如三维物体本身的坐标系（一般称呼为本地坐标系），一个三维空间会存在多个三维物体，如何放置这些三维物体则需要一个三维世界坐标系来定位。此外，三维空间的三维物体通常都是静止的，其移动、旋转等操作都是控制相机的移动来实现的（当然，相机也是一种特殊的三维物体），如图八所示。然而，我们终端设备的屏幕是二维的，相机作为一个"眼睛"将三维物体投影到二维屏幕上又涉及到平面坐标系、齐次坐标系等等。所以，如何理清这些坐标系的概念和坐标系间的相互转换是3D研发的首个门槛，搞清这些在日后的研发中就能做到"游刃有余"。

#### 面向异步 Hooks 事件

在处理三维模型行为交互体验时与传统前端还有个很明显的差异就是面临的异步细节要多得多。在DOM层面前端开发时，我们接触的异步事件主要集中在点击、触摸、滚动和Ajax异步请求等。但是在三维交互中，除此之外我们还频繁接触放大缩小、拖拽位移、模式切换等各类异步行为。

<figure>
  <div style="display:flex;">
    <div style="flex: 5;display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic9left.gif"  alt="全景走点效果" /></div>
    <div style="flex: 3;padding: 0 0 0 10px; display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic9right.png"  alt="涉及异步hooks事件" /></div>
  </div>
  <figcaption>图九：点位全景切换走点</figcaption>
</figure>

在如视内部的底层渲染引擎中，我们维护了比较完善的异步Hooks事件集来应对各种场景的交互行为。比如，如图九（左）效果是我们常见的VR 房源点位全景交互走点移动，整个过程触发了九个异步事件回调，如图九（右）所列。这些回调将整个过程的细节全部暴露出来，方便研发人员更精准地把控体验。一般的终端工程师很难体验这种交互层面细维度精准把控的开发体验，初次接触需要适应。

#### 碰撞检测

最后一个比较明显的差异性是三维空间里面的碰撞监测。

<figure>
  <img style="width: 50%;min-width: 200px;" src="/blog/gmtc-vr3d/pic10.gif"  alt="物体间遮挡与重叠" />
  <figcaption>图十：物体间遮挡与重叠</figcaption>
</figure>

如图十所示，在三维空间中摆置新物体难免会涉及遮盖、重叠的情况。在实际开发中，我们尽量规避这种现象的发生。碰撞监测常规的做法是针对物体创建一个规则的立体几何外形将其包围然后分析是否有重叠的部分；还有种思路是建立一条射线，获取此射线与两个物体间的焦点然后分析是否重合。
碰撞监测在不同的场景一般会采用合适的方式，对于移动的物体，有时候我们还需要在建模体系中添加物理引擎的支持。碰撞检测在不同的业务场景下，检测的策略是不同的，这个比较考验研发对整个三维空间的理解能力，本文就不展开更细节的内容了。

## 新型业务场景探索与实践

前文涉及的都是偏技术领域的，下面向大家分享下在已有的技术储备下，如视是如何在业务上做的一些探索与实践的。

### 三维空间分析计算与二次加工

<figure>
  <img src="/blog/gmtc-vr3d/pic11.gif"  alt="物体（家具）识别" />
  <figcaption>图十一：物体（家具）识别</figcaption>
</figure>

三维模型是来源于现实真实的房源（通过专业设备拍摄及算法分析获取），我们可以对三维模型进行分析并将里面的家具物体识别出来（如图十一所示）。识别出这些物体后我们就能做些有趣的事情了，比如识别出显示器或电视，可以在此处添加一个视频播放广告或节目来营造更加真实的3D场景，效果如图十二（左）。识别平滑地面，我们可以放置一个扫地机器人或3D宝箱来做些营销活动等等，效果如图十二（中）、（右）。

<figure>
  <div style="display:flex;">
    <div style="flex: 1;display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic12left.gif" alt="电视视频" /></div>
    <div style="flex: 1; display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic12center.gif"  alt="扫地机器人" /></div>
    <div style="flex: 1; display:flex;justify-content: center;align-items: center;transform: scale(0.9153225806451613);transform-origin: left;"><img src="/blog/gmtc-vr3d/pic12right.gif"  alt="宝箱营销" /></div>
  </div>
  <figcaption>图十二：根据物体识别添加动态内容</figcaption>
</figure>

除了空间内的物体识别之外，户型图也是我们二次加工的重点方向。比如，我们将二手房源里面家具及装修物体全部清理掉，然后就得到一个及其"纯净"的白模模型；在基于原有的户型结构重新规划将一个两室一厅的房源改造成一个三室一厅的房源，然后再重新加工装修风格和摆置家居物体等。

整个过程，如图十三（左）所示，经历了从真实复杂的普通房源到简洁的白模再到复杂的新装修家居风格过程，给潜在的购房用户提前示例这套房源的改造空间。

<figure>
  <div style="display:flex;">
    <div style="flex: 7;display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic13left.png" alt="加工过程" /></div>
    <div style="flex: 2; display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic13right.gif"  alt="一键切换" /></div>
  </div>
  <figcaption>图十三：真实房源的二次加工</figcaption>
</figure>

此外，我们在技术体验上也做了些突破，在终端层面实现真实房源与设计房源一键切换和同屏对比的交互体验，最终效果如图十三（右）所示。

### VR 实时带看：同屏连线，高效看房

另外一个业务场景探索则是线上 VR 实时带看能力的落地。首先，解释下为什么要往这个方向探索？大家有过买房或租房体验的都知道，大部分场景都是经纪人开车载着你去实地看房，一天下来也就看几套房源可能还要爬楼梯、等红绿灯或被太阳曝晒等意外情况。

<figure>
  <div style="display:flex;">
    <div style="flex: 4;display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic14left.png" alt="3D 交互与二维交互对比" /></div>
    <div style="flex: 1; display:flex;justify-content: center;align-items: center;padding-left: 10px;"><img src="/blog/gmtc-vr3d/pic14right1.gif"  alt="VR 同屏1" /></div>
    <div style="flex: 1; display:flex;justify-content: center;align-items: center;padding-left: 10px;"><img src="/blog/gmtc-vr3d/pic14right2.gif"  alt="VR 同屏2" /></div>
  </div>
  <figcaption>图十四：3D 交互与二维交互对比及 VR 同屏</figcaption>
</figure>

尽管 VR 房源虽然还原了房源的真实场景，但是三维空间交互还是比较复杂的，需要用户去探索细节。如图十四（左）是经典的信息流布局：搜索 ➙ 导航 ➙ 推荐 ➙ 筛选 ➙ 列表，这是二维最高效的信息展示布局，国内绝大部分提供数据服务的App（电商京东、餐饮美团、房产贝壳等）均是这类布局。

但是三维空间交互就没有这么明确了，全景只能查看当前点位且全景游走大部分用户并不知晓。此外，诸如房源的小区信息和附近学校、医院等信息也无法在 VR 3D 模型中明确体现。因此，我们实现了由用户无目的的在 VR 3D 模型中漫游、探索信息转向专业由经纪人带领画面同步、实时语言讲解。

前文提到我们将前端所有的交互以序列帧数据的形式进行了抽象，用户交互会产生帧数据然后通过WebSocket将生成的帧数据同步给另外一个用户来驱动另外一个用户画面的更新。语音的话目前RTC技术比较成熟，我们落地即可，效果如图十四（右）所示。

<figure>
  <img src="/blog/gmtc-vr3d/pic15.png"  alt="终端App与微信小程序VR 实时带看通道链路" />
  <figcaption>图十五：终端App与微信小程序VR 实时带看通道链路</figcaption>
</figure>

除了端与端VR 带看之外，我们还实现终端App(iOS/Android)与微信小程序的VR 实时语音带看的业务能力，整个链路通道如图十五所示。

线上VR实时带看能力在2018年底我们就已经初步实现落地，由于2020年新冠疫情影响造成大批潜在购房用户和经纪人居家隔离，线上VR 实时带看目前已经成为了看房业务的核心场景。

### VR 智能讲房：智能解说，身临其境

前面提到 VR 带看是通过专业的经纪人陪同去了解房源解决 VR 3D 看房获取信息的方式不高效问题。但这个业务场景也存在些许缺陷：

- 人力成本：经纪人不一定能及时响应，比如深夜休息时段。  
- 专业水平：不能保障经纪人对所有的房源都了解，又诸如方言等沟通效率。  

<figure>
  <img style="width: 50%;" src="/blog/gmtc-vr3d/pic16.gif"  alt="社交恐惧症" />
  <figcaption>图十六：“社交恐惧症”：客户不愿跟陌生人沟通</figcaption>
</figure>

- 顾客“社交恐惧症”：不是人人都愿意跟陌生人沟通等。  

鉴于此，我们尝试把 VR 3D 交互做得更智能些。怎么做才更智能呢？首先，我们得不完全依赖真实的经纪人。我们将真实的经纪人形象和音色采集出来然后通过视频拼接和语言TTS服务来抽象出一个虚拟经纪人，并将此虚拟经纪人形象搬到用户的终端屏幕上，如图十七所示。

<figure>
  <img style="width: 50%;" src="/blog/gmtc-vr3d/pic17.gif"  alt="虚拟数字经纪人" />
  <figcaption>图十七：虚拟数字经纪人</figcaption>
</figure>

有了虚拟的经纪人，那么该讲解什么样的内容呢？VR 带看语音来自于经纪人，画面行为帧数据也来源于经纪人行为。此时，就需要通过算法层面去合成讲稿并生产对应的音频和序列帧数据。整体的架构如图十八所示，前端所需要支持的就是定义画面行为的序列帧数据格式规范，由AI团队的剧本服务和NLG服务去计算LRC文本讲稿和行为序列。然后，通过主控服务生成带讲稿音频虚拟经纪人视频并附带行为序列帧数据给前端"翻译"。

<figure>
  <img src="/blog/gmtc-vr3d/pic18.png"  alt="AR 讲房架构" />
  <figcaption>图十八：AR 讲房架构</figcaption>
</figure>

因为涉及的点过多，更多的细节本文就不再详细讲解了。大家可以扫描图十九的二维码或访问 [珠江罗马嘉园东区 2室1厅](//open.realsee.com/ke/15XKMYpVwOw3R7j8/BoZqQK8KmaAtncxhvTYre9ztvW9D50zg/?v3=1) 这套房源进行体验。总之，由于WebSocket双工实时性和前端序列帧数据抽象，VR 的整体体验变得更加智能化。

<figure>
  <div style="display:flex;">
    <div style="flex: 1;display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic19left.png" alt="体验二维码" /></div>
    <div style="flex: 2; display:flex;justify-content: center;align-items: center;padding-left: 60px;padding-right: 40px;"><img src="/blog/gmtc-vr3d/pic19right.png"  alt="入口位置" /></div>
  </div>
  <figcaption>图十九：AR 讲房体验二维码</figcaption>
</figure>

## 面临的性能挑战及应对方案

在过去三年的 VR 看房及衍生业务研发中我们主要面临的性能瓶颈有两个：加载耗时和内存溢出。

### 加载耗时

在2019年8月份前，贝壳如视 VR 首屏加载平均耗时7.6s，截至2021年7月份已经降至1.92s，正常网络情况下用户基本无需等待过多时间去体验VR房源。如此巨大的提升我们究竟做了些什么呢？首先我们先分析之前慢的原因，然后"对症下药"。而且首屏的性能提升也不是一蹴而就的事情，我们内部成立了个性能体验专项虚拟团队持续了近一年才达到最终1.92s的效果。

问题出在哪儿呢？主要在三个方面：

#### 密集的HTTP请求

前文提到 VR 3D 模型依赖大量的模型UV贴图和全景图片；除此之外，还有大量的地图、讲房音视频等资源。在浏览器的限制下同个域下的CDN请求限制在3~6个（不同浏览器会有差异）。大量的网络请求只能排队等待。

#### 实时计算

前端存在大量的实时计算，比如3D模型文件的解压缩、户型图数据解析、三维空间分析及碰撞监测等。由于JavaScript的单进程，这些计算依赖也阻塞一些核心逻辑。

#### 模块渲染加载策略不合理

由于VR 开发初期考虑不周全，我们的异步渲染加载策略设计并不合理，优先级策略划分错乱。

分析原因后，优化策略就很明确了。针对密集的HTTP请求我们先添加更多CDN域名支持，保障同时刻的请求限制在五个以内并增加HTTP2协议支持。实时计算带来的耗时采取的策略是充分利用缓存（离线计算缓存、浏览器缓存以及服务端计算缓存等）；同时，我们对模块渲染加载策略进行了重新设计，每个模块都规划好权重，按照权重来加载。此外，部分非核心交互则由用户触发后再加载渲染。由于历史包袱过重，真个过程持续了近一年，最终有了7.6s到2.55s的首屏加载的性能提升，过程如图二十（左）所示。

<figure>
  <div style="display:flex;">
    <div style="flex: 3;display:flex;justify-content: center;align-items: center;"><img src="/blog/gmtc-vr3d/pic20left.png" alt="耗时变化" /></div>
    <div style="flex: 1; display:flex;justify-content: center;align-items: center;padding-left: 60px;padding-right: 40px;"><img src="/blog/gmtc-vr3d/pic20right.gif"  alt="加载效果" /></div>
  </div>
  <figcaption>图二十：VR 首屏性能提升过程</figcaption>
</figure>

除上文提到的优化之外，我们还充分挖掘了部分客户端的能力。第一个能力是**客户端HTTP请求拦截代理和缓存**，通常情况下WebView缓存池"阈值"很低，而客户端缓存池则大得多；此外，分析对比来看客户端的HTTP请求效率要比WebView的HTTP请求高很多。支持HTTP请求代理和缓存之后，整个加载耗时降低了近500ms。

另外一个核心能力则是增加了**客户端首屏渲染**：即进入 VR 页面前客户端提前预载好首屏内容，在加载阶段展示客户端内容，等前端完成首屏渲染之后再换成前端的渲染效果。整个过程是无缝的，用户甚至感知不到加载过程，最终的效果如图二十（右）所示。

### 内存溢出

加载耗时现阶段已经取得比较好的效果，我们目前遭遇的最大的瓶颈是内存溢出。

<figure>
  <img src="/blog/gmtc-vr3d/pic21.png"  alt="VR 内存占用" />
  <figcaption>图二十一：VR 内存占用</figcaption>
</figure>

在前文首屏优化中提到我们耗费大量的时间完善了模块加载渲染策略，因此在 VR 交互过程中，随着各个模块不断完成渲染，内存占用是逐步递增的，如图二十一（左）所示。在图二十一（右）扇形图中也列举了不同模块的内存占用情况。目前，iOS设备的WebView内存崩溃的阈值大约在1.5G左右，Android设备则不同机型阈值不完全一致，高端Android设备普遍比iOS设备高很多，但低端机阈值远低于1.5G内存。

规避内存溢出问题我们从两个方向入手：

#### 增加内存池

目前我们测试过iOS/Android 设备各类WebView控件，除了实现WebView独立进程之外并没有找到突破WebView内存限制的方式。这个属于WebView容器瓶颈。

#### 降低内存占用

我们做了些突破，比如按需渲染，非可视区域销毁模块等等，但仅仅降低了崩溃率，成效并不明显。

而且，随着业务的不断迭代，VR 能力愈来愈丰富，内存占用还在不断提升。依赖WebView+WebGL+jsBridge技术栈落地的VR体验现阶段有很明显的局限性，虽然纯原生技术栈已经提上日程但短期来看还是很难落地的。为了弱化内存溢出带来的影响，我们目前采取的策略是根据用户的使用场景以动态降级的方式给予用户最合适的交互体验。

<figure>
  <img src="/blog/gmtc-vr3d/pic22.png"  alt="VR 性能瓶颈影响因素鱼骨图" />
  <figcaption>图二十二：VR 性能瓶颈影响因素鱼骨图</figcaption>
</figure>

性能优化的本质是渐进增强和优雅降级，把握每个细节把自己该做的部分做好一般都会有比较好的性能表现。我们系统分析了造成性能瓶颈各个因素，如图二十二所示。事实上，我们很难做些突破然后彻底解决内存问题，只能降级保障体验。

如何做到更"智能"地渐进增强和优雅降级？首先需要的是前端支持模块的"热插拔"能力，即能动态的销毁某个模块以将内存空间给其他模块使用。此外，我们维护一个关于内存瓶颈的数据仓库，依托WebSocket的双工能力，VR 交互时会收集用户的终端设备信息及部分VR用户行为，并在实时分析该用户的终端的最大承受能力，推送给前端再动态地加载或卸载前端模块，从而达到加强体验或降级的效果。

## 总结

前面给大家讲述了贝壳如视前端团队如何基于 VR 及 3D 技术在Web领域架构设计，并分享了在这个领域上的一些业务探索、实践及应对性能瓶颈的具体措施。本次的演讲的专题是"移动技术新趋势"，最后站在技术的角度上做如下四个方面的经验（或趋势）总结来结束本次的演讲内容吧。

### 可玩性

三维领域研发比传统基于DOM前端研发有趣得多，比如团队就有产品说过三维空间二次加工装修设计是更高阶的"乐高"式游戏，欢迎大家加入这个领域。

### 序列帧抽象及数据驱动

过往的前端交互都是用户主动触发的，但是在 3D 方向的交互模型更需要自动播放，提高信息获取的方式。前端数据层序列帧抽象，支持数据驱动、序列化和反序列化将是不可或缺的一环。

### "热插拔"

3D 领域开发内存占用是远大于传统前端页面的，尤其在终端设备WebView容器下内存限制更明显。模块、组件及插件等封装都需要支持"热插拔"，从而做到动态加强体验或降级的效果。
### WebSocket

我们已经逐步在抛弃主动式Ajax，数据的实时性和智能化都依赖WebSocket的双工能力。目前，WebSocket服务已经是核心基础建设。
