---
layout: layout/post
title: '前端内存分析之图片篇'
date: 2022-03-11 23:30:00 +0800
comments: true
categories: 技术总结
---

## 背景

二零年年末，我所在如视的前端团队针对核心 C 端项目 **VR 3D 看房** 做了次从 2.0 到 3.0 的系统重构——交互风格、前端架构等等都重新整了遍。灰度阶段前，通过[ PerfDog 性能狗](https://perfdog.qq.com/) 性能分析发现：我们一个 VR 3D 页面在 PC 端占用 120MB 左右内存，在 iPhone 12 上竟然高达 360MB。

在加上业务能力的升级——除了传统实景 VR 之外，我们还新增了虚拟 VR 用以展示房源装修前后的效果对比，这又新增了一个 VR 实例，内存占用已超 700MB。

<figure>
  <div style="display:flex;" class="fancyboxflex">
    <div style="flex: 1"><img style="width:100%;" src="//solome.js.org/static/memory-usage-pic/memo-vr.png" /></div>
  </div>
  <figcaption>图一：2.0和3.0 内存占用情况</figcaption>
</figure>

此外，随着用户的交互（开启地图、逐帧动画等），内存还在不断递增，高峰期已经超过 1G。而 iOS 系统 WebView 内存溢出的阈值最高也才 1.5G，VR 页面已经濒临崩溃。

很好奇为啥会占用了那么多的内存？让我们来简单探究一下吧。

## 图片内存占用

三维模型一般由面片数据（顶点、线）和贴图组成，内存占用的大头是图片。那一张图片渲染至浏览器占用的内存该怎么计算呢？

一般浏览器渲染图片**BitMap**选用的是 [ARGB_8888](https://en.wikipedia.org/wiki/RGBA_color_model#RGBA8888)：颜色信息由透明度 A（Alpha）与 R（Red），G（Green），B（Blue）四部分组成，每个部分都占 8 位，总共占 32 位。即一个像素：

> - **A** - alpha 透明 8bit(位)
> - **R** - Red 8bit(位)
> - **G** - Green 8bit(位)
> - **B** - Blue 8bit(位)

"1Byte(字节)=8bit(位)" 因此，**一个像素会占用四个字节**。
所以一张 `2048*2048` 的图片占用的内存有：`2048*2048*4 Byte`，换算成 MB 单位 `2048*2048*4/ (1024*1024) Byte = 16MB`。

> 图片占用的内存跟图片文件体积大小无关，仅跟其分辨率相关。压缩图片目的是为了 CDN 下载速度更快、节省存储空间，但无法节省浏览器占用内存。

**"一个像素会占用四个字节"** 这个结论适用于绝大部分 PC、macOS 等终端设备，但在移动端并不完全适用，详细内容请往下看。

## 终端设备

以 iPhone 为例，先统计下历代 iPhone 屏幕信息：

|            机型            | 逻辑像素 |  渲染像素  |  物理像素  | 设备像素比 DPR | 一个像素用几个字节  |
| :------------------------: | :------: | :--------: | :--------: | :------------: | :-----------------: |
|       iPhone 3G/3Gs        | 320\*480 |  320\*480  |  320\*480  |       1        |      4 个字节       |
|        iPhone 4/4s         | 320\*480 |  640\*960  |  640\*960  |       2        |    4 \* 2 个字节    |
|     iPhone 5/5C/5s/SE      | 320\*568 | 640\*1136  | 640\*1136  |       2        |    4 \* 2 个字节    |
|    iPhone 6/6s/7/8/SE2     | 375\*667 | 750\*1334  | 750\*1334  |       2        |    4 \* 2 个字节    |
|        iPhone XR/11        | 414\*896 | 828\*1792  | 828\*1792  |       2        |    4 \* 2 个字节    |
|     iPhone X/Xs/11 Pro     | 375\*812 | 1125\*2436 | 1125\*2436 |       3        |    4 \* 3 个字节    |
|       iPhone 12 mini       | 375\*812 | 1125\*2436 | 1080\*2340 |       3        | 约 4 \* 2.88 个字节 |
|      iPhone 12/12 Pro      | 390\*844 | 1170\*2532 | 1170\*2532 |       3        |    4 \* 3 个字节    |
|   iPhone 6/6s/7/8/ Plus    | 414\*736 | 1242\*2208 | 1080\*1920 |       3        | 约 4 \* 2.61 个字节 |
| iPhone Xs Max / 11 Pro Max | 414\*896 | 1242\*2688 | 1242\*2688 |       3        |    4 \* 3 个字节    |
|     iPhone 12 Pro Max      | 428\*926 | 1284\*2778 | 1284\*2778 |       3        |    4 \* 3 个字节    |

> - **物理像素**：硬件真实的像素，即屏幕分辨率。
> - **逻辑像素**：前端使用的像素，即 `px`。
> - **渲染像素**：操作系统抽象的像素。

从 iPhone 4 代开始，iPhone 屏幕的物理分辨率是很高的，除了 "iPhone 6/6s/7/8/ Plus" 和 "iPhone 12 mini" 设备之外，iOS 系统基本是把 2 个或 3 个物理像素当作 1 个逻辑像素来使用的（放大倍数了）。

Android 系统则比较凌乱，但本质还是**将多个物理像素当作一个逻辑像素来渲染使用**。因此，一张`2048*2048`图片内存占用换算公式是: `(物理分辨率/逻辑像素)*2048*2048*4/ (1024*1024) MB`。

这基本解释了移动端设备图片占用的内存要比 PC 上统计的要多出 2 倍、3 倍甚至 4 倍以上。这也解释了明明是旗舰机型崩溃率反而增加了，比如 iOS 系统 WebView 内存崩溃的阈值固定在 1.5G 以下，旗舰机型 iPhone 12 Pro Max 更加容易达到这个阈值。

> 介于设备屏幕 LCD、OLED 等材质差异，实际统计会有些许偏差，但是数量级不会有太多出入。

## Five 实例内存占用

[`@realsee/five`](https://realsee.js.org/docs/front/3d-space/get-started/rendering-engine) 是如视基于 Three.js 实现的在浏览器环境中运行的**三维空间渲染引擎**。创建 `Five` 实例并渲染一个三维空间需要耗费多少内存呢？

常态情况下，`Five` 渲染依赖的图片是三维模型的 UV 贴图和一个立方体全景贴图（立方体六个面六张图），如图二、三所示。

<figure>
  <div style="display:flex;" class="fancyboxflex">
    <div style="flex: 1"><img style="width:60%;" src="//solome.js.org/static/memory-usage-pic/pano.png" /></div>
  </div>
  <figcaption>图二：立方体全景贴图（2048*2048）</figcaption>
</figure>

<figure>
  <div style="display:flex;" class="fancyboxflex">
    <div style="flex: 1"><img style="width:80%;" src="//solome.js.org/static/memory-usage-pic/model.png" /></div>
  </div>
  <figcaption>图三：UV 贴图及网格数据组成模型（512*512）</figcaption>
</figure>

因此，我们以[贝壳·VR 看房 | 常楹公元 2 室 1 厅](https://open.realsee.com/ke/6gyq3v1verxD7JO1/qeNadDJvp5oSPhzhbTo7mVEC3LM4rOA2/?v3=1) 房源为例，其实景 VR 的 UV 贴图有 12 张。

所以，此看房 VR 图片所占用的内存有：

### ① 常态情况

- PC 端：`2048*2048*4/ (1024*1024) *6 + 512*512*4/ (1024*1024)*12= 108MB`
- iPhone 8：`(2048*2048*4/ (1024*1024) *6 + 512*512*4/ (1024*1024)*12) * 2= 216MB`
- iPhone 12：`(2048*2048*4/ (1024*1024) *6 + 512*512*4/ (1024*1024)*12) * 3= 324MB`

此处分析的这还仅仅是一个实景 VR 依赖图片占用的内存。

### ② 走点 moveToPano

由于走点为了过渡动画效果，一般会出现两个立方体全景，所以全景图片由 6 张图片变成 12 张。

- PC 端：`2048*2048*4/(1024*1024)*6*2 + 512*512*4/ (1024*1024)*12= 204MB`
- iPhone 8：`(2048*2048*4/(1024*1024)*6*2 + 512*512*4/ (1024*1024)*12)*2= 408MB`
- iPhone 12：`(2048*2048*4/(1024*1024)*6*2 + 512*512*4/ (1024*1024)*12)*3= 612MB`

看此数据，基本解释：

- 高端 iOS 设备比低端 iOS 设备更容易出现黑白屏内存溢出问题。（iOS 端 WebView 内存崩溃的阈值在 1.5G 以下）。
- 全景走点时**更加容易**内存溢出。
- 除了图片占用内存之外，`Five` 涉及的其他部分其实并没有占用过多内存。（也就意味着图片之外的优化空间不多）。

## 序列帧动画

如图五所示，这是一个如视 Logo 组成的循环关键帧动画：

<figure>
  <div style="display:flex;flex-direction: column;" class="fancyboxflex">
    <div style="flex: 1"><image style="width:100%;;" src="//solome.js.org/static/memory-usage-pic/animation.13cc0efb.png" /></div>
    <div style="flex: 1"><image style="width:100%;max-width: 140px;" src="//solome.js.org/static/memory-usage-pic/realseelogo.gif" /></div>
  </div>
  <figcaption>图四：关键帧Sprite图和逐帧动画</figcaption>
</figure>

这张帧动画雪碧图分辨率是`14065*265`，占用内存：

- PC 端：`14065*265*4/(1024*1024)=14.21823501586914MB`
- iPhone 8：`14065*265*4/(1024*1024)*2= 28.43647003173828MB`
- iPhone 12：`14065*265*4/(1024*1024)*3=42.65470504760742MB`

将这张雪碧图放在`<image>`标签中确实是这样的内存占用。但是，一旦套用 CSS 帧动画实现之后：

```css
@keyframes logo-sprites-animation {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 13800px 0;
  }
}

animation: logo-sprites-animation 2.208s 0s steps(53) infinite normal;
```

通过 PerfDog 统计的内存占用却是图片内存的三倍：

- PC 端：`14065*265*4/(1024*1024)*3=42.65470504760742MB`
- iPhone 8 端：`14065*265*4/(1024*1024)*2*3= 85.30941009521484MB`
- iPhone 12 端：`14065*265*4/(1024*1024)*3*3=127.96411514282227MB`

这个三倍是怎么来的，目前尚未找到相关资料，个人猜测的逻辑是：
此处的逐帧动画本质上是个补间动画，用在帧动画中，需要上一帧、当前帧、下一帧 来计算补间动画，同时需要三张图片，所以可能会同时存在三张图片实例。

这个目前尚属猜测逻辑。但需要关注的经验是：**逐帧动画慎用，帧数最好限制在 24 帧以内，且占用内存不要超过 20MB。**

## 最后

有兴趣的同学，可以安装 [**PerfDog 性能狗**](https://perfdog.qq.com/) 工具自己实践一下本文的数据是否存在偏差。
