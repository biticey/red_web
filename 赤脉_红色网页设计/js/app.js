/* =========================================================
   赤脉 · The Red Thread — interactions
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- header / progress ---------------- */
  var hdr = $("#hdr"), bar = $("#scrollbar");
  var navLinks = $$("[data-nav]");

  function onScroll() {
    var y = window.scrollY;
    hdr.classList.toggle("is-stuck", y > 30);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

    // 当前区块高亮
    var mid = y + window.innerHeight * 0.4;
    navLinks.forEach(function (a) {
      var sec = $(a.getAttribute("href"));
      if (!sec) return;
      var top = sec.offsetTop, bottom = top + sec.offsetHeight;
      a.classList.toggle("is-active", mid >= top && mid < bottom);
    });

    // 首屏山脊视差
    if (!reduce && heroArt) {
      heroArt.style.transform = "translate3d(0," + (y * 0.22) + "px,0)";
    }
  }

  /* ---------------- mobile menu ---------------- */
  var burger = $("#burger"), menu = $("#menu"), body = document.body;
  function closeMenu() {
    body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
  }
  burger.addEventListener("click", function () {
    var open = !body.classList.contains("menu-open");
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
  });
  $$(".menu__nav a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------------- reveal ---------------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------------- counters ---------------- */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target;
      var raw = el.getAttribute("data-count");
      var to = parseInt(raw, 10);
      var suffix = "";
      var em = el.querySelector("em");
      if (em) suffix = ""; // 单位保留在原节点里
      if (reduce) return;
      var from = to > 1000 ? to - 170 : 0;
      var t0 = performance.now(), dur = 1300;
      function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        var v = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (em) {
          el.childNodes[0].nodeValue = String(v);
        } else {
          el.textContent = String(v);
        }
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---------------- marquee 无缝滚动 ---------------- */
  var marq = $("#marquee");
  if (marq) { marq.innerHTML = marq.innerHTML + marq.innerHTML; }

  /* ---------------- hero embers ---------------- */
  var canvas = $("#embers"), heroArt = $("#heroArt");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d"), W, H, parts = [];
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      parts = [];
      var n = Math.min(60, Math.round(W / 26));
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H,
          r: .6 + Math.random() * 1.6,
          vy: .10 + Math.random() * .35,
          vx: (Math.random() - .5) * .12,
          a: .10 + Math.random() * .40,
          p: Math.random() * 6.28
        });
      }
    }
    var last = 0;
    function loop(t) {
      var dt = Math.min(50, t - last || 16); last = t;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy * dt * .06;
        p.x += p.vx * dt * .06;
        if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
        var flick = .55 + .45 * Math.sin(t * .0015 + p.p);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
        g.addColorStop(0, "rgba(255,178,120," + (p.a * flick) + ")");
        g.addColorStop(1, "rgba(163,18,26,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 7, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    size(); seed(); requestAnimationFrame(loop);
    window.addEventListener("resize", function () { size(); seed(); });
  }

  /* ---------------- 横向时间轴 ---------------- */
  var vp = $("#yearsViewport"), track = $("#yearsTrack"), ybar = $("#yearsBar");
  var prev = $("#prevYear"), next = $("#nextYear");

  function step() {
    var card = $(".ycard", track);
    return card ? card.offsetWidth + 18 : 380;
  }
  function syncBar() {
    if (!vp) return;
    var max = vp.scrollWidth - vp.clientWidth;
    var p = max > 0 ? vp.scrollLeft / max : 0;
    ybar.style.width = (22 + p * 78) + "%";
    if (prev) prev.disabled = vp.scrollLeft < 4;
    if (next) next.disabled = vp.scrollLeft > max - 4;
  }
  if (vp) {
    vp.addEventListener("scroll", syncBar, { passive: true });
    window.addEventListener("resize", syncBar);
    syncBar();

    if (prev) prev.addEventListener("click", function () {
      vp.scrollBy({ left: -step(), behavior: "smooth" });
    });
    if (next) next.addEventListener("click", function () {
      vp.scrollBy({ left: step(), behavior: "smooth" });
    });

    // 拖拽（按下时不抓指针，否则 click 会被容器吞掉，卡片就点不开了）
    var down = false, sx = 0, sl = 0;
    dragged = false;
    vp.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      down = true; sx = e.clientX; sl = vp.scrollLeft; dragged = false;
    });
    vp.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!dragged && Math.abs(dx) > 6) {
        dragged = true;
        vp.classList.add("is-drag");
        if (e.pointerType === "mouse") {
          try { vp.setPointerCapture(e.pointerId); } catch (err) {}
        }
      }
      if (dragged) vp.scrollLeft = sl - dx;
    });
    function up(e) {
      down = false; vp.classList.remove("is-drag");
      if (e && e.pointerId != null && vp.hasPointerCapture(e.pointerId)) vp.releasePointerCapture(e.pointerId);
    }
    vp.addEventListener("pointerup", up);
    vp.addEventListener("pointercancel", up);
    vp.addEventListener("pointerleave", function () { if (down) up(); });

    // 滚轮横向
    vp.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        vp.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  }

  /* ---------------- 年份详情弹层 ---------------- */
  var dragged = false;
  var YEAR_DATA = {
    "1921": {
      no: "01", title: "南湖的船", meta: "上海 · 嘉兴南湖 · 1921 年 7 月",
      txt: "开会的人从全国各地来，一共十三位，代表当时五十多名党员。会开到一半，法租界的巡捕闯进来搜查，大家赶紧散了，换个地方接着开。最后一天挪到嘉兴南湖的一条游船上，装作游客，才把会开完。船不大，定下来的事不小：党的名称、纲领、要干什么，都在这一天上定了。当时没人觉得这是多大的事。"
    },
    "1927": {
      no: "02", title: "上了井冈山", meta: "江西 · 井冈山 · 1927 年 10 月",
      txt: "秋收起义本来是要打长沙的，没打下来，队伍损失很重。毛泽东带着剩下的人往山里走，走到江西永新三湾，把队伍缩编，支部建在连上。上了井冈山，又和当地的武装合到一处，打土豪、分田地，根据地慢慢有了样子。城市里站不住，就先在农村站住脚——这条路后来被证明走对了。"
    },
    "1934": {
      no: "03", title: "长征开始", meta: "江西出发 · 1934 年 10 月",
      txt: "第五次反“围剿”没顶住，中央红军八万多人从江西于都出发，开始转移。一开始打算去湘西和另一支部队会合，结果一路被堵。湘江一战，人少了三分之二。后来改道往贵州走，才有了遵义会议。两万五千里不是一条直线，是绕着走出来的。"
    },
    "1935": {
      no: "04", title: "遵义会议", meta: "贵州 · 遵义 · 1935 年 1 月",
      txt: "红军进了遵义，在一栋军阀的公馆里开了三天会，主题就一个：为什么打成这样。会上换了领导，也换了打法。会后四渡赤水，在川黔滇边界来回穿插，把几十万追兵绕得团团转。这支队伍从这儿起，不再被人牵着走。"
    },
    "1949": {
      no: "05", title: "开国那天", meta: "北京 · 天安门 · 1949 年 10 月 1 日",
      txt: "下午三点，开国大典在天安门广场举行。毛泽东按下电钮，升起第一面五星红旗，宣读中央人民政府公告，广场上站了三十万人。那一年，国家刚打完仗，什么都缺，但总算有了自己的政府。"
    }
  };
  var YEAR_ORDER = ["1921", "1927", "1934", "1935", "1949"];

  var yearModal = $("#yearModal");
  var ymYear = $("#ymYear"), ymTitle = $("#ymTitle"), ymMeta = $("#ymMeta"),
      ymTxt = $("#ymTxt"), ymIdx = $("#ymIdx"), ymPrev = $("#ymPrev"), ymNext = $("#ymNext");
  var ymCurrent = "1921", lastFocus = null;

  function fillYear(key) {
    var d = YEAR_DATA[key];
    if (!d) return;
    ymCurrent = key;
    ymYear.textContent = key;
    ymTitle.textContent = d.title;
    ymMeta.textContent = d.meta;
    ymTxt.textContent = d.txt;
    var i = YEAR_ORDER.indexOf(key);
    ymIdx.textContent = d.no + " / 05";
    ymPrev.disabled = i <= 0;
    ymNext.disabled = i >= YEAR_ORDER.length - 1;
  }

  function openYear(key) {
    lastFocus = document.activeElement;
    fillYear(key);
    yearModal.classList.add("is-open");
    yearModal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
    setTimeout(function () { $(".modal__panel").focus(); }, 60);
  }

  function closeYear() {
    yearModal.classList.remove("is-open");
    yearModal.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$(".ycard").forEach(function (card) {
    card.addEventListener("click", function () {
      if (dragged) return;
      openYear(card.dataset.year);
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openYear(card.dataset.year);
      }
    });
  });

  if (yearModal) {
    $$("[data-close]").forEach(function (el) { el.addEventListener("click", closeYear); });
    ymPrev.addEventListener("click", function () {
      var i = YEAR_ORDER.indexOf(ymCurrent);
      if (i > 0) fillYear(YEAR_ORDER[i - 1]);
    });
    ymNext.addEventListener("click", function () {
      var i = YEAR_ORDER.indexOf(ymCurrent);
      if (i < YEAR_ORDER.length - 1) fillYear(YEAR_ORDER[i + 1]);
    });
    document.addEventListener("keydown", function (e) {
      if (!yearModal.classList.contains("is-open")) return;
      if (e.key === "Escape") closeYear();
      if (e.key === "ArrowLeft" && !ymPrev.disabled) ymPrev.click();
      if (e.key === "ArrowRight" && !ymNext.disabled) ymNext.click();
    });
  }

  /* ---------------- 地标地图 ---------------- */
  var PLACES = {
    jinggang: {
      idx: "01 / 05", name: "井冈山", meta: "Jinggangshan · 江西 · 1927",
      txt: "山高、林密、路不好走，可就是在这儿，他们扎下了第一个农村根据地。八角楼那盏灯，经常亮到后半夜。",
      tags: ["中国革命的摇篮", "农村包围城市"], h: [100, 62, 92, 48, 96, 70, 104]
    },
    ruijin: {
      idx: "02 / 05", name: "瑞金", meta: "Ruijin · 江西 · 1931",
      txt: "中华苏维埃共和国在这儿成立。那是头一回，一个政权把“人民”两个字写进了名字里，也是头一回学着怎么管一个国家。",
      tags: ["共和国的摇篮", "中华苏维埃"], h: [70, 96, 60, 88, 54, 92, 66]
    },
    zunyi: {
      idx: "03 / 05", name: "遵义", meta: "Zunyi · 贵州 · 1935",
      txt: "就一间旧教室，开了几天会。会开完，队伍的走法全变了。后来四渡赤水，被追着打的局面翻了盘。",
      tags: ["伟大转折", "四渡赤水"], h: [58, 84, 106, 66, 98, 60, 90]
    },
    yanan: {
      idx: "04 / 05", name: "延安", meta: "Yan'an · 陕西 · 1937",
      txt: "在陕北待了十三年。窑洞的灯常亮着，很多后来管用的办法，都是在这片黄土地上一点点想出来、试出来的。",
      tags: ["革命圣地", "延安十三年"], h: [110, 74, 96, 58, 86, 110, 64]
    },
    xibaipo: {
      idx: "05 / 05", name: "西柏坡", meta: "Xibaipo · 河北 · 1948",
      txt: "三大战役是在这几间土坯房里指挥的。快赢的时候，他们反倒提醒自己：别飘，别松劲。",
      tags: ["新中国从这里走来", "两个务必"], h: [64, 92, 58, 100, 74, 88, 60]
    }
  };
  var nodes = $$(".map__node");
  var ppIdx = $("#ppIdx"), ppName = $("#ppName"), ppMeta = $("#ppMeta"),
      ppTxt = $("#ppTxt"), ppTags = $("#ppTags"), ppArt = $("#ppArt");

  function showPlace(key) {
    var d = PLACES[key];
    if (!d) return;
    nodes.forEach(function (n) { n.classList.toggle("is-on", n.dataset.place === key); });
    ppIdx.textContent = d.idx;
    ppName.textContent = d.name;
    ppMeta.textContent = d.meta;
    ppTxt.textContent = d.txt;
    ppTags.innerHTML = d.tags.map(function (t) { return "<li>" + t + "</li>"; }).join("");
    var pts = d.h.map(function (v, i) { return (i * 400 / (d.h.length - 1)) + "," + v; }).join(" L");
    ppArt.innerHTML = '<svg viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M' + pts +
      ' L400,120 L0,120 Z"/></svg>';
    var panel = $("#placePanel");
    panel.classList.remove("is-swap");
    void panel.offsetWidth;
    panel.classList.add("is-swap");
  }
  nodes.forEach(function (n) {
    n.addEventListener("click", function () { showPlace(n.dataset.place); });
    n.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showPlace(n.dataset.place); }
    });
    n.addEventListener("mouseenter", function () { showPlace(n.dataset.place); });
  });
  if (nodes.length) showPlace("jinggang");

  /* ---------------- 精神谱系 ---------------- */
  var SPIRIT = {
    boat: {
      y: "1921", t: "红船精神", en: "THE RED BOAT SPIRIT",
      d: "敢想别人没想过的事，认定了就不回头，做事是为了大家，不是为了自己。说起来挺大，其实就是那条小船上十几个人当时的样子。",
      c: ["开天辟地", "敢为人先", "百折不挠", "忠诚为民"]
    },
    jinggang: {
      y: "1927", t: "井冈山精神", en: "THE JINGGANGSHAN SPIRIT",
      d: "信得过自己走的路，吃得了苦，办事讲实际，敢试新办法，遇事靠群众。城市那条路走不通，就上山。这是他们头一回不靠别人，自己把问题解决了。",
      c: ["坚定信念", "实事求是", "敢闯新路", "依靠群众"]
    },
    longmarch: {
      y: "1934", t: "长征精神", en: "THE LONG MARCH SPIRIT",
      d: "国家的利益摆最前面；为了这个，什么苦都能吃，命也豁得出去；办事从实际出发，不照搬别人；顾大局、守纪律、抱团；跟老百姓同生共死。",
      c: ["理想高于天", "不怕牺牲", "实事求是", "生死相依"]
    },
    yanan: {
      y: "1935", t: "延安精神", en: "THE YAN'AN SPIRIT",
      d: "方向要正，脑子要活，办事讲实际，心里装着老百姓，自己的事自己干。那时候窑洞里点的灯，照的是整个中国往哪儿走。",
      c: ["政治方向", "实事求是", "为人民服务", "自力更生"]
    },
    xibaipo: {
      y: "1948", t: "西柏坡精神", en: "THE XIBAIPO SPIRIT",
      d: "原话是“两个务必”：别骄傲，别急躁，别忘了艰苦奋斗。越是快赢的时候，越要提醒自己别昏头。",
      c: ["两个务必", "谦虚谨慎", "艰苦奋斗", "赶考"]
    }
  };
  var tabs = $$(".spirit__tabs button");
  var spTitle = $("#spTitle"), spEn = $("#spEn"), spTxt = $("#spTxt"),
      spChips = $("#spChips"), spGhost = $("#spGhost"), spPanel = $("#spiritPanel");

  function pickSpirit(key) {
    var d = SPIRIT[key];
    if (!d) return;
    tabs.forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.spirit === key)); });
    spGhost.textContent = d.y;
    spTitle.textContent = d.t;
    spEn.textContent = d.en;
    spTxt.textContent = d.d;
    spChips.innerHTML = d.c.map(function (x) { return "<li>" + x + "</li>"; }).join("");
    spPanel.classList.remove("is-swap");
    void spPanel.offsetWidth;
    spPanel.classList.add("is-swap");
  }
  tabs.forEach(function (b) { b.addEventListener("click", function () { pickSpirit(b.dataset.spirit); }); });

  /* ---------------- 点灯 ---------------- */
  var fly = $("#fireflies"), trib = $("#tribute"), lightBtn = $("#lightBtn"), countEl = $("#count");
  var lit = 0, tctx, TW, TH, tp = [], flyOn = false;

  if (fly && !reduce) {
    tctx = fly.getContext("2d");
    function tsize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      TW = fly.clientWidth; TH = fly.clientHeight;
      fly.width = TW * dpr; fly.height = TH * dpr;
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function tseed() {
      tp = [];
      for (var i = 0; i < 34; i++) {
        tp.push({
          x: Math.random() * TW, y: Math.random() * TH,
          r: .7 + Math.random() * 1.5,
          vx: (Math.random() - .5) * .18,
          vy: (Math.random() - .5) * .18,
          a: .12 + Math.random() * .45,
          p: Math.random() * 6.28
        });
      }
    }
    var t0 = 0;
    function tloop(t) {
      var dt = Math.min(50, t - t0 || 16); t0 = t;
      tctx.clearRect(0, 0, TW, TH);
      for (var i = 0; i < tp.length; i++) {
        var p = tp[i];
        p.x += p.vx * dt * .06; p.y += p.vy * dt * .06;
        if (p.x < -20) p.x = TW + 20; if (p.x > TW + 20) p.x = -20;
        if (p.y < -20) p.y = TH + 20; if (p.y > TH + 20) p.y = -20;
        var fl = .5 + .5 * Math.sin(t * .0012 + p.p);
        var g = tctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, "rgba(240,215,164," + (p.a * fl) + ")");
        g.addColorStop(1, "rgba(240,215,164,0)");
        tctx.fillStyle = g;
        tctx.beginPath(); tctx.arc(p.x, p.y, p.r * 6, 0, 6.2832); tctx.fill();
      }
      requestAnimationFrame(tloop);
    }
    tsize(); tseed(); requestAnimationFrame(tloop);
    window.addEventListener("resize", function () { tsize(); tseed(); });

    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { flyOn = e.isIntersecting; });
    }, { threshold: 0.05 });
    tio.observe(trib);
  }

  function burst(x, y) {
    if (!flyOn || reduce) return;
    for (var i = 0; i < 6; i++) {
      tp.push({
        x: x + (Math.random() - .5) * 60,
        y: y + (Math.random() - .5) * 30,
        r: 1 + Math.random() * 2.2,
        vx: (Math.random() - .5) * .5,
        vy: -.35 - Math.random() * .5,
        a: .7, p: Math.random() * 6.28
      });
      if (tp.length > 90) tp.shift();
    }
  }

  if (lightBtn) {
    lightBtn.addEventListener("click", function (e) {
      lit++;
      countEl.textContent = lit;
      var r = lightBtn.getBoundingClientRect();
      var tr = trib.getBoundingClientRect();
      burst(r.left - tr.left + r.width / 2, r.top - tr.top);
    });
  }

  /* ---------------- init ---------------- */
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();
