---
title:  "Web頁面上的那些圖標"
date:   2015-02-10 15:26:12 +0800
categories: 技术总结
---


一個網頁不會是由純字符組成的，需要些些訏訏的**圖標**去點綴；最早的前端的工作主要是多數人不屑的**切圖**，這與**編程**耦合太弱。
不過話說要是絕大多數的網頁沒有那些圖標的點綴會變得多麼地慘白。

在一個HTML結構的頁面中，使用圖標最常接觸的是標籤`<img>`和css屬性`background-image`。`<img>`純粹是為了顯示圖片而添加的標籤，適用於尺寸大的圖片，強調圖片的信息，不屬於頁面圖標的範疇（在web設計中，圖標和圖片是兩種概念：圖標在某種程度可有可惡，起到修飾點綴的效果，本身沒有什麼信息量；而圖片不同，圖片也是頁面欲展示給用戶的信息）；因此，依賴`<img>`標籤實現的點綴圖標的作用的，都是不那麼合理的，因為`<img>`不是幹這種事情的，對搜索引擎亦是不友好的。

下面討論下，如何給一個web頁面添加修飾點綴用途的圖標的方式。

### 方式一：css屬性`background-image`

` background-image`主要用來設定塊級標籤的背景圖片，一般的使用形式如下：

```css
.selector {
    background-image:url( '/* 要顯示的圖片網址 */' );
    background-repeat:no-repeat;
    background-color: /* 背景顏色 */;
}
```

這種方式不會將圖片的信息放在HTML結構中，而是通過css來維護管理的；實現方式最大的缺陷是如果一個頁面中存在好多些類似的圖標，那麼用戶客戶端的每次訪問就必須為了那些點綴增加許許多多的HTTP請求。

當然，最好的方式是將多個小圖標軿湊成一張大圖片來避免不必要的HTTP請求。

### 方式二：依賴`background-position`實現的Sprite圖

將多張小圖標合併成一張大圖片，頁面元素使用時只選擇其中的一部分顯示，這樣一堆小圖標合成的大圖片一般稱作Sprite圖（精靈圖，雪碧圖等）。
除了使用css屬性`background-image`之外，還要利用`background-position`來定位大圖中小圖標的坐標位置；通常情況下，還要指定小圖標的長寬信息，即`width`和`height`屬性。一般的使用形式如下：

```css
.selector {
    background-image: url(/* 要顯示的圖片網址 */);
    background-repeat: no-repeat;
    background-position: 0 -63px;
    height: 10px;
    width: 20px;
}
```

Sprite圖避免了多次HTTP請求問題，但是難點在於Sprite圖的手動生成是一件極其繁瑣的事情，每次更新圖標都需要重新繪製Sprite圖；
小圖標在Sprite圖中的坐標位置在寫入css`background-position`屬性中時也要注意。

Sprite手動生成的確繁瑣，但是Sprite圖的自動化生成方面的技術也趨於成熟，典型的有[Spriting with Compass](http://compass-style.org/help/tutorials/spriting/)和[glue](https://github.com/jorgebastida/glue)。

如果你的css框架是基於Compass(sass)的話，Sprite圖的合併並不是什麼要耗費經歷的事情；倘若不是，善用[glue](https://github.com/jorgebastida/glue)也會讓你從在折騰圖像處理軟件的非編程工作中解脫出來。

Compass 在使用Sprite圖時直接通過`@include icon-sprite('/* 小圖標路徑 */')`即可，最後編譯成css文件時也會自動編譯生成對應的Sprite圖，你不必考慮坐標關係；即使要換個圖標，也只是更換圖標後重新編譯即可。

使用[glue](https://github.com/jorgebastida/glue)則更加強大了，不僅可以生成CSS也可以生成SCSS，甚至更底層地你可以生成一系列的hash映射數據自己動手來處理Sprite圖的使用邏輯；Sprite圖中的圖標的坐標位置全部在一個hash表中，完全可以自由定製。

最後，Sprite圖的軿湊還有個比較費神的問題就是：那麼多的小圖標，有些頁面在用而有些頁面不用那怎麼進行軿湊Sprite圖呢？

全部圖標都軿湊成一張大圖片？沒有必要吧，因為有些圖標在這個頁面中沒有使用到憑什麼要拼在一起呢？一般情況下Sprite圖的軿湊邏輯如下：
- 頁面區分：軿湊的Sprite圖涉及的小圖只在某種類型的頁面（模塊使用）。
- 類型區分：同種類型的圖標軿湊在一塊組成Sprite圖。

### 方式三：圖片數字化BASE64
Sprite圖是使用圖標點綴頁面最好的解決方案之一，接近完美，但還是有一個問題需要解決：
對圖標的重複性不友好，即不太兼容`background-repeat`屬性（通常情況下都設定為`no-repeat`）；
典型的如評分五角星，如果有五顆五角星來表示100%，但要表示80%時，就必須依賴`repeat`和`width:80%`。

還有就是電商網站熱衷使用的`new`、`hot`等促銷提示小圖標。這些圖標是微型的，而且需出現的時機無規律；拼在Sprite圖中總是讓人覺得**彆扭**。

此外，Sprite圖的使用CSS要依賴外部的圖片，要是圖片信息直接在CSS文件中就好了。而BASE64格式的圖片可以以字符串的形式嵌入到CSS文件中。
因此，復用一個CSS文件直接拷貝CSS文件即可，無需再考慮外部依賴的圖標數據。

BASE64的解碼和編碼算法也是很容易的，如 https://docs.python.org/2/library/base64.html 。通過Compass實現BASE編碼直接使用`@include inline-image(/* 圖標路徑 */)`，和前面提到的生成Sprite圖一樣簡單。

總之，前面提到的重複的評分五角星和電商網站熱衷使用的`new`、`hot`小圖標均可以採用BASE64的格式。可惜的，在低端瀏覽器（IE6）是不支持這種寫法的。

### 方式四：圖標也是字體webfont

前面提到的圖標都是位圖，在手機屏幕動不動就是1080像素的瀏覽器來說位圖在高分辨率情況下容易出現**鋸齒**。如果使用`svg`矢量圖的話，就無法進行Sprite化處理。

`webfont`就是一種將圖標當作字體來使用（在某種程度上也可以理解成矢量圖標的Sprite化）；將一系列的矢量圖標轉換成矢量字體集文件（如`woff`格式）和正常字體一樣使用。

不過目前讓人頭疼的地方是不是所有瀏覽器都支持`webfont`，即使支持了還只能使用純色扁平的圖標，而且瀏覽器對字體的過渡優化偶爾也會造成圖標的顯示效果失真。

如果一個網站的設計風格是純色調，扁平化，那麼大氛圍的使用`webfont`是個很好的選擇。

### 方式五：css3自己畫圖標

CSS3上有許多讓人欣喜的特性，比如`transorm`和`tranition`這連個變換和過渡的屬性值，在設計頁面元素背景圖時特別有效；再撮合些CSS動畫效果會得到通過圖片無法得到的交互效果。

不過這樣的功能目前也只僅僅侷限與頁面元素的背景圖而已。

另外一種情況是使用`border`屬性值的處理以很`hack`的方式繪製一些集合圖形。
如三角形<i class="fa fa-caret-up fa-fw"></i>的繪製，一般情況下兼容性最強大的CSS源碼如下：

```css
.triangle {
    position: absolute;
    top: 11px;
    right: 7px; /* 絕對定位 */
    width: 0;
    height: 0;
    font-size: 0;
    border: 4px dashed transparent;
    border-top: 4px solid #2bb8aa;
    *display: none;
}
```

當然，總是有人喜歡使用CSS來繪製那些原本使用圖片展示的圖標；個人覺得這是耗費精力沒有必要的工作。為什麼要把那麼簡單的工作複雜化呢？CSS畢竟是用來點綴元素的，而非用來繪圖的。

最後，大部分網站圖標的使用都是上面提到的五種方式相結合進行使用的。

電商網站上面的奇怪`三角形`：

- 实心三角形 "▲"
- 脱字号［即"^"］

這兩種圖標一般跟導航相關（如頂部導航）；用戶點擊後圖標的方向會反轉（會摻雜一些反轉動畫的效果）。
