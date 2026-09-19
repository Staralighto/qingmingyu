(function () {
  "use strict";

  /* ---------------------------------------------------------
     导航：Hero 白字 / 纸上墨字
     --------------------------------------------------------- */
  var nav = document.getElementById("siteNav");
  var hero = document.getElementById("top");
  var heroObserver = null;

  function watchHero() {
    if (!nav || !hero || !("IntersectionObserver" in window)) return;
    if (heroObserver) heroObserver.disconnect();
    var navH = nav.offsetHeight || 72;
    heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        nav.classList.toggle("on-hero", entry.isIntersecting);
      });
    }, { rootMargin: "-" + navH + "px 0px 0px 0px", threshold: 0 });
    heroObserver.observe(hero);
  }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[data-nav]"));
  var order = ["top", "gallery", "gameplay", "rules"];

  function setCurrent(id) {
    navLinks.forEach(function (link) {
      link.setAttribute("aria-current", link.getAttribute("data-nav") === id ? "true" : "false");
    });
  }

  function watchSections() {
    if (!("IntersectionObserver" in window)) return;
    var sections = [];
    order.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sections.push(el);
    });
    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });
      for (var i = 0; i < order.length; i++) {
        if (visible[order[i]]) { setCurrent(order[i]); return; }
      }
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ponytail: AABB vs 几个标题，撞了就藏品牌。漏检/晚一帧可接受 */
  var brand = document.querySelector(".brand");
  var brandTargets = document.querySelectorAll(".section-title, .play-title, .footer-brand-name");
  var brandQueued = false;

  function hits(a, b) {
    return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  }

  function checkBrand() {
    if (!brand) return;
    var a = brand.getBoundingClientRect();
    var hide = false;
    for (var i = 0; i < brandTargets.length; i++) {
      if (hits(a, brandTargets[i].getBoundingClientRect())) { hide = true; break; }
    }
    brand.classList.toggle("is-away", hide);
  }

  function watchBrand() {
    window.addEventListener("scroll", function () {
      if (brandQueued) return;
      brandQueued = true;
      requestAnimationFrame(function () {
        brandQueued = false;
        checkBrand();
      });
    }, { passive: true });
    checkBrand();
  }

  /* ponytail: 下滑进视口时文字上浮一次。不还原、不测反向滚动 */
  var riseOn = false;

  function watchRise() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    riseOn = true;
    document.documentElement.classList.add("js-ok");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("h1,h2,h3,p,.copy-btn,.nav-links a,.timeline-label,.card-label,.index,.footer-col a").forEach(function (el) {
      if (el.closest(".brand, .hero")) return;
      el.classList.add("rise");
      io.observe(el);
    });
  }

  function riseNow(el) {
    if (!riseOn) return;
    el.classList.add("rise");
    requestAnimationFrame(function () { el.classList.add("is-in"); });
  }

  watchHero();
  watchSections();
  watchBrand();
  watchRise();

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      watchHero();
      checkBrand();
    }, 200);
  });

  /* ---------------------------------------------------------
     画廊轮播
     --------------------------------------------------------- */
  var galleryImages = [
    { src: "assets/gallery/01-spawn-1.jpg", alt: "服务器实景" },
    { src: "assets/gallery/02-castle.jpg", alt: "玩家建筑 城堡" },
    { src: "assets/gallery/03-arena.jpg", alt: "玩家建筑 天空之城竞技场" },
    { src: "assets/gallery/04-spawn-2.jpg", alt: "服务器实景" },
    { src: "assets/gallery/05-shop-build.jpg", alt: "玩家建筑 商店" },
    { src: "assets/gallery/06-spawn-3.jpg", alt: "服务器实景" },
    { src: "assets/gallery/07-spawn-4.jpg", alt: "服务器实景" },
    { src: "assets/gallery/08-spawn-5.jpg", alt: "服务器实景" },
    { src: "assets/gallery/09-menu.jpg", alt: "主菜单界面" },
    { src: "assets/gallery/10-warp.jpg", alt: "公共传送点界面" },
    { src: "assets/gallery/11-enchant.jpg", alt: "协同附魔界面" },
    { src: "assets/gallery/12-build-shop.jpg", alt: "建材商店界面" },
    { src: "assets/gallery/13-sell.jpg", alt: "每日出售界面" },
    { src: "assets/gallery/14-farm.jpg", alt: "田园种植界面" },
    { src: "assets/gallery/15-fish.jpg", alt: "钓鱼界面" }
  ];

  var carousel = document.getElementById("carousel");
  var slidePrev = document.getElementById("slidePrev");
  var slideMain = document.getElementById("slideMain");
  var slideNext = document.getElementById("slideNext");
  var dotsWrap = document.getElementById("carouselDots");
  var prevBtn = document.getElementById("carouselPrev");
  var nextBtn = document.getElementById("carouselNext");
  var slidePrevWebp = document.getElementById("slidePrevWebp");
  var slideMainWebp = document.getElementById("slideMainWebp");
  var slideNextWebp = document.getElementById("slideNextWebp");
  var dots = [];
  var index = 0;
  var count = galleryImages.length;

  function mod(n, m) { return ((n % m) + m) % m; }

  function fullWebp(src) { return src.replace(/\.(jpe?g|png)$/i, ".webp"); }
  function gallerySmallWebp(src) { return src.replace(/\.(jpe?g|png)$/i, "-800.webp"); }
  function galleryMainSrcset(src) { return gallerySmallWebp(src) + " 800w, " + fullWebp(src) + " 1600w"; }
  function playImageSrcset(src) { return src.replace(/\.(jpe?g|png)$/i, "-640.webp") + " 640w, " + fullWebp(src) + " 1280w"; }

  function renderGallery() {
    var current = galleryImages[index];
    var prev = galleryImages[mod(index - 1, count)];
    var next = galleryImages[mod(index + 1, count)];
    if (slideMain) {
      slideMain.src = current.src;
      slideMain.alt = current.alt + "，第 " + (index + 1) + " 张，共 " + count + " 张";
    }
    if (slideMainWebp) slideMainWebp.srcset = galleryMainSrcset(current.src);
    if (slidePrev) slidePrev.src = prev.src;
    if (slidePrevWebp) slidePrevWebp.srcset = gallerySmallWebp(prev.src);
    if (slideNext) slideNext.src = next.src;
    if (slideNextWebp) slideNextWebp.srcset = gallerySmallWebp(next.src);
    dots.forEach(function (dot, i) {
      var active = i === index;
      dot.setAttribute("aria-current", active ? "true" : "false");
      dot.tabIndex = active ? 0 : -1;
    });
  }

  function goTo(i) {
    index = mod(i, count);
    renderGallery();
  }

  if (carousel && slideMain && dotsWrap) {
    galleryImages.forEach(function (item, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", "第 " + (i + 1) + " 张：" + item.alt);
      dot.setAttribute("aria-current", i === 0 ? "true" : "false");
      dot.tabIndex = i === 0 ? 0 : -1;
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); });

    carousel.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); goTo(index - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); goTo(index + 1); }
    });

    renderGallery();
  }

  /* ---------------------------------------------------------
     玩法节点切换
     --------------------------------------------------------- */
  var PLAYS = [
    {
      title: "进阶附魔",
      image: "assets/gameplay/01-enchant.png",
      lines: [
        "服务器原创插件，加入30+种附魔",
        "各种特殊效果随意搭配，带来丰富游玩体验",
        "原版风格的简单机制，上手门槛低，一看就会。"
      ]
    },
    {
      title: "田园种植",
      image: "assets/gameplay/02-farm.png",
      lines: [
        "带有四季变化的原创种植玩法",
        "靠轻松的收割成为服务器的大亨",
        "多种作物配有精美材质，拿来装饰也完全OK"
      ]
    },
    {
      title: "垂钓渔业",
      image: "assets/gameplay/03-fish.png",
      lines: [
        "休闲的钓鱼玩法",
        "通过精准的QTE钓上特殊鱼类",
        "享受休闲的钓鱼时光，顺便向大家炫耀钓上的大鱼吧！"
      ]
    },
    {
      title: "酿造工艺",
      image: "assets/gameplay/04-brew.png",
      lines: [
        "用田园种植产出的作物酿酒吧",
        "不同的作物组合会随机产生各种酒",
        "探索新的配方，获得更多有神奇功能的酒吧！"
      ]
    }
  ];

  var timelineButtons = Array.prototype.slice.call(document.querySelectorAll(".timeline-btn"));
  var playTitle = document.getElementById("playTitle");
  var playLines = document.getElementById("playLines");
  var playVisual = document.getElementById("playVisual");
  var playVisualWebp = document.getElementById("playVisualWebp");

  function selectPlay(i) {
    var play = PLAYS[i];
    if (!play) return;
    timelineButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", Number(btn.getAttribute("data-index")) === i ? "true" : "false");
    });
    if (playTitle) playTitle.textContent = play.title;
    if (playVisual) {
      playVisual.src = play.image;
      playVisual.alt = play.title;
      if (playVisualWebp) playVisualWebp.srcset = playImageSrcset(play.image);
    }
    if (playLines) {
      playLines.innerHTML = "";
      play.lines.forEach(function (line) {
        var p = document.createElement("p");
        p.textContent = line;
        playLines.appendChild(p);
        riseNow(p);
      });
    }
  }

  timelineButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectPlay(Number(btn.getAttribute("data-index")));
    });
  });

  /* ---------------------------------------------------------
     复制 IP
     --------------------------------------------------------- */
  var copyBtn = document.getElementById("copyIp");
  var copyTimer;

  function promptCopy(text) {
    window.prompt("复制服务器地址：", text);
  }

  if (copyBtn) {
    var originalLabel = copyBtn.textContent;
    copyBtn.addEventListener("click", function () {
      var ip = copyBtn.getAttribute("data-ip") || "";

      function flash() {
        copyBtn.textContent = "已复制";
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () { copyBtn.textContent = originalLabel; }, 1800);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ip).then(flash, function () {
          promptCopy(ip);
        });
      } else {
        promptCopy(ip);
      }
    });
  }
})();
