(function($){
  // Theme switcher
  var themeStorageKey = 'blog-color-theme';
  var themeFallback = 'lake-mist';
  var themeMap = {
    'lake-mist': {
      label: '湖岚青',
      swatch: 'theme-swatch-lake'
    },
    'sakura-gray-pink': {
      label: '樱灰粉',
      swatch: 'theme-swatch-sakura'
    }
  };

  var $themeSwitcher = $('#theme-switcher'),
    $themeToggle = $themeSwitcher.find('.theme-switcher-toggle'),
    $themeOptions = $themeSwitcher.find('.theme-option');

  var normalizeTheme = function(value){
    return themeMap[value] ? value : themeFallback;
  };

  var setTheme = function(value, shouldSave){
    var theme = normalizeTheme(value);

    document.documentElement.setAttribute('data-color-theme', theme);
    $themeOptions
      .removeClass('is-active')
      .attr('aria-selected', 'false')
      .filter('[data-theme-value="' + theme + '"]')
      .addClass('is-active')
      .attr('aria-selected', 'true');

    if (shouldSave) {
      try {
        localStorage.setItem(themeStorageKey, theme);
      } catch (e) {}
    }
  };

  if ($themeSwitcher.length) {
    setTheme(document.documentElement.getAttribute('data-color-theme'), false);

    $themeToggle.on('click', function(e){
      e.stopPropagation();
      var isOpen = $themeSwitcher.toggleClass('is-open').hasClass('is-open');
      $themeToggle.attr('aria-expanded', isOpen ? 'true' : 'false');
    });

    $themeOptions.on('click', function(e){
      e.stopPropagation();
      setTheme($(this).attr('data-theme-value'), true);
      $themeSwitcher.removeClass('is-open');
      $themeToggle.attr('aria-expanded', 'false');
    });

    $(document).on('click keydown', function(e){
      if (e.type === 'keydown' && e.key !== 'Escape') return;
      $themeSwitcher.removeClass('is-open');
      $themeToggle.attr('aria-expanded', 'false');
    });
  }

  // Search
  var $searchWrap = $('#search-form-wrap'),
    isSearchAnim = false,
    searchAnimDuration = 200;

  var startSearchAnim = function(){
    isSearchAnim = true;
  };

  var stopSearchAnim = function(callback){
    setTimeout(function(){
      isSearchAnim = false;
      callback && callback();
    }, searchAnimDuration);
  };

  $('#nav-search-btn').on('click', function(){
    if (isSearchAnim) return;

    startSearchAnim();
    $searchWrap.addClass('on');
    stopSearchAnim(function(){
      $('.search-form-input').focus();
    });
  });

  $('.search-form-input').on('blur', function(){
    startSearchAnim();
    $searchWrap.removeClass('on');
    stopSearchAnim();
  });

  // Share
  $('body').on('click', function(){
    $('.article-share-box.on').removeClass('on');
  }).on('click', '.article-share-link', function(e){
    e.stopPropagation();

    var $this = $(this),
      url = $this.attr('data-url'),
      encodedUrl = encodeURIComponent(url),
      id = 'article-share-box-' + $this.attr('data-id'),
      offset = $this.offset();

    if ($('#' + id).length){
      var box = $('#' + id);

      if (box.hasClass('on')){
        box.removeClass('on');
        return;
      }
    } else {
      var html = [
        '<div id="' + id + '" class="article-share-box">',
          '<input class="article-share-input" value="' + url + '">',
          '<div class="article-share-links">',
            '<a href="https://twitter.com/intent/tweet?url=' + encodedUrl + '" class="article-share-twitter" target="_blank" title="Twitter"></a>',
            '<a href="https://www.facebook.com/sharer.php?u=' + encodedUrl + '" class="article-share-facebook" target="_blank" title="Facebook"></a>',
            '<a href="http://pinterest.com/pin/create/button/?url=' + encodedUrl + '" class="article-share-pinterest" target="_blank" title="Pinterest"></a>',
          '</div>',
        '</div>'
      ].join('');

      var box = $(html);

      $('body').append(box);
    }

    $('.article-share-box.on').hide();

    box.css({
      top: offset.top + 25,
      left: offset.left
    }).addClass('on');
  }).on('click', '.article-share-box', function(e){
    e.stopPropagation();
  }).on('click', '.article-share-box-input', function(){
    $(this).select();
  }).on('click', '.article-share-box-link', function(e){
    e.preventDefault();
    e.stopPropagation();

    window.open(this.href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
  });

  // Caption
  $('.article-entry').each(function(i){
    $(this).find('img').each(function(){
      if ($(this).parent().hasClass('fancybox')) return;

      var alt = this.alt;

      if (alt) $(this).after('<span class="caption">' + alt + '</span>');

      $(this).wrap('<a href="' + this.src + '" title="' + alt + '" class="fancybox"></a>');
    });

    $(this).find('.fancybox').each(function(){
      $(this).attr('rel', 'article' + i);
    });
  });

  if ($.fancybox){
    $('.fancybox').fancybox();
  }

  // Mobile nav
  var $container = $('#container'),
    isMobileNavAnim = false,
    mobileNavAnimDuration = 200;

  var startMobileNavAnim = function(){
    isMobileNavAnim = true;
  };

  var stopMobileNavAnim = function(){
    setTimeout(function(){
      isMobileNavAnim = false;
    }, mobileNavAnimDuration);
  }

  $('#main-nav-toggle').on('click', function(){
    if (isMobileNavAnim) return;

    startMobileNavAnim();
    $container.toggleClass('mobile-nav-on');
    stopMobileNavAnim();
  });

  $('#wrap').on('click', function(){
    if (isMobileNavAnim || !$container.hasClass('mobile-nav-on')) return;

    $container.removeClass('mobile-nav-on');
  });
})(jQuery);
