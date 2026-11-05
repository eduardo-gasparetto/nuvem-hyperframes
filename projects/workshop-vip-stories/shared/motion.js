/*
 * NuvemMotion: GSAP presets for HyperFrames compositions.
 * Load gsap first, then this file. Each preset adds tweens to a paused timeline `tl`
 * at absolute times and returns `tl`. Timeline tweens are fromTo with immediateRender: false
 * (except the plain tl.to calls marked below);
 * hidden initial states are set with gsap.set when the preset runs (load time).
 * "px@672" values scale with H (see setCanvas). Lists accept an array, NodeList or HTMLCollection;
 * pass elements (not a selector string) to staggered presets, or the stagger is lost.
 *
 * Tokens: EASE, DUR, STAGGER, DIST, SPEED, H (getter), setCanvas(height)
 *
 * wordsIn(tl, words, at, { stagger = 0.112, slow = false, rise = 26px@672 })
 *   at: a number (word i starts at at + stagger * i) or an array of start times, one per word.
 * textOut(tl, el, at, { duration = 0.33 })                          plain tl.to
 * blurIn(tl, els, at, { stagger = 0.065, blur = 48 })               blur in px, not scaled
 * rimOffset(iconCentre [x, y], iconR, satCentre [x, y])             pure: returns { x, y }, no tween
 * popIn(tl, icon, at, { duration = 0.62, satellite, from = { x: 0, y: 0 } })
 * popOut(tl, icon, at, { duration = 0.33, satellite })
 * riseIn(tl, el, at, { depth = "front" | "back", from = 640 | 820px@672, duration = 1.0 | 1.34, setInitial = false })
 * sceneFall(tl, els, at, { distance = 1440px@672, duration = 0.88 })
 * lineGrow(tl, line, at, { from: [x, y], to: [x, y], duration = length / 800, opacity = 0.2 })
 * lineRetract(tl, line, at, { from: [x, y], to: [x, y], duration = 0.22, ease = "power1.inOut", opacity = 0.2 })
 * lineFall(tl, line, at, { y1, y2, distance = 1440px@672, duration = 0.88 })   plain tl.to
 * lineRise(tl, line, at, { end = "y1" | "y2", value, depth = "front", from, duration })
 * drift(tl, el, at, { speed (px/s, negative = up, required), duration (required), from = 0 })
 * jump(tl, el, at, { by (required), from = 0, duration = 1.0 })
 * rings(tl, group, { cx, cy, r (required), at = 1.043, count = 24, interval = 0.992, life = 3.0667,
 *                    endR = r * 731 / 374, opacity = 0.88, stroke = "#0050C3", width = 1.5 })
 * cursorIn(tl, cursor, at)
 * cursorMove(tl, cursor, at, { x (required), from = 0, duration = 0.97, arc = -12 })
 * click(tl, el, at)
 * focus(tl, el, at, { scale = 1.44, x = 0, y = 0, duration = 0.77 })
 * tagBuild(tl, pill, at, { size = 75, width = 324 })                plain tl.to for the widening
 */
(function () {
  // Canvas height. Values marked px@672 are multiplied by H / 672.
  let H = 672;

  const EASE = {
    arriveSoft: "power1.out",
    arrive: "power2.out",
    arriveStrong: "power3.out",
    leave: "power2.in",
    travel: "power2.inOut",
    travelShort: "power1.inOut",
    linear: "none",
  };

  const DUR = {
    word: 0.7,
    wordRise: 0.65,
    wordSlow: 1.25,
    textExit: 0.33,
    blur: 0.9,
    pop: 0.62,
    satellite: 0.725,
    satelliteDelay: 0.23,
    popOut: 0.33,
    satelliteOut: 0.27,
    satelliteOutLead: 0.1,
    riseFront: 1.0,
    riseBack: 1.34,
    fall: 0.88,
    cursorIn: 0.3,
    cursorTravel: 0.97,
    press: 0.15,
    release: 0.2,
    focus: 0.77,
    tagCircle: 0.7,
    tagWiden: 0.6,
    ringLife: 3.0667,
    ringInterval: 0.992,
    retract: 0.22,
  };

  const STAGGER = { headline2: 0.112, headline1: 0.166, icons: 0.2 };

  // Values in px@672.
  const DIST = { rise: 26, fall: 1440, riseFront: 640, riseBack: 820 };

  // px/s, not scaled.
  const SPEED = { line: 800 };

  function setCanvas(height) {
    H = height;
  }

  // Scale a px@672 value to the current canvas height.
  function px(v) {
    return (v * H) / 672;
  }

  function toList(x) {
    // Array-likes (array, NodeList, HTMLCollection) become arrays; a single element or selector string stays one target.
    return x && typeof x !== "string" && typeof x.length === "number" ? Array.from(x) : [x];
  }

  // Start time of item i: an array gives one time per item, a number starts a stagger from it.
  function startAt(at, stagger, i) {
    return Array.isArray(at) ? at[i] : at + stagger * i;
  }

  function riseParams(opts) {
    const front = (opts.depth ?? "front") === "front";
    return {
      from: opts.from ?? px(front ? DIST.riseFront : DIST.riseBack),
      duration: opts.duration ?? (front ? DUR.riseFront : DUR.riseBack),
      ease: front ? EASE.arrive : EASE.arriveStrong,
    };
  }

  function wordsIn(tl, words, at, opts = {}) {
    const list = toList(words);
    const stagger = opts.stagger ?? STAGGER.headline2;
    const slow = opts.slow ?? false;
    const rise = opts.rise ?? px(DIST.rise);

    gsap.set(list, { y: rise });

    list.forEach((word, i) => {
      const t = startAt(at, stagger, i);
      tl.fromTo(word, { opacity: 0 }, { opacity: 1, duration: slow ? DUR.wordSlow : DUR.word, ease: slow ? EASE.arriveSoft : EASE.arrive, immediateRender: false }, t);
      tl.fromTo(word, { y: rise }, { y: 0, duration: DUR.wordRise, ease: EASE.arriveSoft, immediateRender: false }, t);
    });
    return tl;
  }

  function textOut(tl, el, at, opts = {}) {
    tl.to(el, { opacity: 0, duration: opts.duration ?? DUR.textExit, ease: EASE.linear }, at);
    return tl;
  }

  function blurIn(tl, els, at, opts = {}) {
    const stagger = opts.stagger ?? 0.065;
    const blur = opts.blur ?? 48;

    toList(els).forEach((el, i) => {
      const t = startAt(at, stagger, i);
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: DUR.blur, ease: EASE.arriveSoft, immediateRender: false }, t);
      tl.fromTo(el, { filter: `blur(${blur}px)` }, { filter: "blur(0px)", duration: DUR.blur, ease: EASE.arriveStrong, immediateRender: false }, t);
    });
    return tl;
  }

  // Point on the icon rim that faces the satellite, relative to the satellite's final position.
  function rimOffset(iconCentre, iconR, satCentre) {
    const dx = satCentre[0] - iconCentre[0];
    const dy = satCentre[1] - iconCentre[1];
    const len = Math.hypot(dx, dy) || 1;
    const rimX = iconCentre[0] + (iconR * dx) / len;
    const rimY = iconCentre[1] + (iconR * dy) / len;
    return { x: rimX - satCentre[0], y: rimY - satCentre[1] };
  }

  function popIn(tl, icon, at, opts = {}) {
    const duration = opts.duration ?? DUR.pop;
    const satellite = opts.satellite;
    const from = opts.from ?? { x: 0, y: 0 };

    gsap.set(icon, { scale: 0 });
    tl.fromTo(icon, { scale: 0 }, { scale: 1, duration, ease: EASE.arrive, immediateRender: false }, at);

    if (satellite) {
      gsap.set(satellite, { scale: 0, x: from.x, y: from.y });
      tl.fromTo(satellite, { scale: 0, x: from.x, y: from.y }, { scale: 1, x: 0, y: 0, duration: DUR.satellite, ease: EASE.arriveStrong, immediateRender: false }, at + DUR.satelliteDelay);
    }
    return tl;
  }

  function popOut(tl, icon, at, opts = {}) {
    const duration = opts.duration ?? DUR.popOut;
    const satellite = opts.satellite;

    // The satellite leaves first.
    if (satellite) {
      tl.fromTo(satellite, { scale: 1, x: 0, y: 0 }, { scale: 0, duration: DUR.satelliteOut, ease: EASE.leave, immediateRender: false }, at - DUR.satelliteOutLead);
    }
    tl.fromTo(icon, { scale: 1, x: 0, y: 0 }, { scale: 0, duration, ease: EASE.leave, immediateRender: false }, at);
    return tl;
  }

  function riseIn(tl, el, at, opts = {}) {
    const { from, duration, ease } = riseParams(opts);

    if (opts.setInitial) gsap.set(el, { y: from });
    tl.fromTo(el, { y: from }, { y: 0, duration, ease, immediateRender: false }, at);
    return tl;
  }

  function sceneFall(tl, els, at, opts = {}) {
    const distance = opts.distance ?? px(DIST.fall);
    const duration = opts.duration ?? DUR.fall;

    toList(els).forEach((el) => {
      tl.fromTo(el, { y: 0 }, { y: distance, duration, ease: EASE.leave, immediateRender: false }, at);
    });
    return tl;
  }

  function lineGrow(tl, line, at, opts = {}) {
    const { from, to } = opts;
    const duration = opts.duration ?? Math.hypot(to[0] - from[0], to[1] - from[1]) / SPEED.line;
    const opacity = opts.opacity ?? 0.2;

    tl.fromTo(line, { attr: { x2: from[0], y2: from[1] } }, { attr: { x2: to[0], y2: to[1] }, duration, ease: EASE.linear, immediateRender: false }, at);
    tl.fromTo(line, { opacity: 0 }, { opacity, duration: 0.001, ease: EASE.linear, immediateRender: false }, at);
    return tl;
  }

  function lineRetract(tl, line, at, opts = {}) {
    const { from, to } = opts;
    const duration = opts.duration ?? DUR.retract;
    const ease = opts.ease ?? EASE.travelShort;
    const opacity = opts.opacity ?? 0.2;

    tl.fromTo(line, { attr: { x2: to[0], y2: to[1] } }, { attr: { x2: from[0], y2: from[1] }, duration, ease, immediateRender: false }, at);
    tl.fromTo(line, { opacity }, { opacity: 0, duration: 0.001, ease: EASE.linear, immediateRender: false }, at + duration);
    return tl;
  }

  function lineFall(tl, line, at, opts = {}) {
    const distance = opts.distance ?? px(DIST.fall);
    const duration = opts.duration ?? DUR.fall;

    tl.to(line, { attr: { y1: opts.y1 + distance, y2: opts.y2 + distance }, duration, ease: EASE.leave, immediateRender: false }, at);
    return tl;
  }

  function lineRise(tl, line, at, opts = {}) {
    const end = opts.end;
    const value = opts.value;
    const { from, duration, ease } = riseParams(opts);

    tl.fromTo(line, { attr: { [end]: value + from } }, { attr: { [end]: value }, duration, ease, immediateRender: false }, at);
    return tl;
  }

  function drift(tl, el, at, opts = {}) {
    const from = opts.from ?? 0;

    tl.fromTo(el, { y: from }, { y: from + opts.speed * opts.duration, duration: opts.duration, ease: EASE.linear, immediateRender: false }, at);
    return tl;
  }

  function jump(tl, el, at, opts = {}) {
    const from = opts.from ?? 0;
    const duration = opts.duration ?? 1.0;

    tl.fromTo(el, { y: from }, { y: from + opts.by, duration, ease: EASE.travel, immediateRender: false }, at);
    return tl;
  }

  function rings(tl, group, opts = {}) {
    const { cx, cy, r } = opts;
    const at = opts.at ?? 1.043;
    const count = opts.count ?? 24;
    const interval = opts.interval ?? DUR.ringInterval;
    const life = opts.life ?? DUR.ringLife;
    const endR = opts.endR ?? (r * 731) / 374;
    const opacity = opts.opacity ?? 0.88;
    const stroke = opts.stroke ?? "#0050C3";
    const width = opts.width ?? 1.5;

    const circles = [];
    for (let i = 0; i < count; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", String(cx));
      c.setAttribute("cy", String(cy));
      c.setAttribute("r", String(r));
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", stroke);
      c.setAttribute("stroke-width", String(width));
      c.setAttribute("opacity", "0");
      group.appendChild(c);
      circles.push(c);
    }

    circles.forEach((c, i) => {
      tl.fromTo(c, { attr: { r }, opacity }, { attr: { r: endR }, opacity: 0, duration: life, ease: EASE.linear, immediateRender: false }, at + interval * i);
    });
    return tl;
  }

  function cursorIn(tl, cursor, at) {
    tl.fromTo(cursor, { opacity: 0, scale: 0.8, x: 6, y: 10 }, { opacity: 1, scale: 1, x: 0, y: 0, duration: DUR.cursorIn, ease: EASE.arrive, immediateRender: false }, at);
    return tl;
  }

  function cursorMove(tl, cursor, at, opts = {}) {
    const from = opts.from ?? 0;
    const duration = opts.duration ?? DUR.cursorTravel;
    const arc = opts.arc ?? -12;

    tl.fromTo(cursor, { x: from }, { x: opts.x, duration, ease: EASE.travel, immediateRender: false }, at);

    if (arc !== 0) {
      tl.fromTo(cursor, { y: 0 }, { y: arc, duration: 0.33, ease: EASE.travelShort, immediateRender: false }, at + 0.12);
      tl.fromTo(cursor, { y: arc }, { y: 0, duration: 0.3, ease: EASE.arrive, immediateRender: false }, at + 0.55);
    }
    return tl;
  }

  function click(tl, el, at) {
    tl.fromTo(el, { scale: 1 }, { scale: 0.9, duration: DUR.press, ease: EASE.arriveSoft, immediateRender: false }, at);
    tl.fromTo(el, { scale: 0.9 }, { scale: 1, duration: DUR.release, ease: EASE.arriveSoft, immediateRender: false }, at + DUR.press);
    return tl;
  }

  function focus(tl, el, at, opts = {}) {
    const { scale = 1.44, x = 0, y = 0, duration = DUR.focus } = opts;

    tl.fromTo(el, { scale: 1, x: 0, y: 0 }, { scale, x, y, duration, ease: EASE.travel, immediateRender: false }, at);
    return tl;
  }

  function tagBuild(tl, pill, at, opts = {}) {
    const size = opts.size ?? 75;
    const width = opts.width ?? 324;

    // Phase 1: dot grows into a circle.
    tl.fromTo(pill, { width: 0, height: 0 }, { width: size, height: size, duration: DUR.tagCircle, ease: EASE.arriveSoft, immediateRender: false }, at);
    tl.fromTo(pill, { opacity: 0 }, { opacity: 1, duration: 0.01, ease: EASE.linear, immediateRender: false }, at + 0.02);

    // Phase 2: circle widens into the pill.
    tl.to(pill, { width, duration: DUR.tagWiden, ease: EASE.travel }, at + DUR.tagCircle);
    return tl;
  }

  const NuvemMotion = {
    EASE,
    DUR,
    STAGGER,
    DIST,
    SPEED,
    get H() {
      return H;
    },
    setCanvas,
    wordsIn,
    textOut,
    blurIn,
    rimOffset,
    popIn,
    popOut,
    riseIn,
    sceneFall,
    lineGrow,
    lineRetract,
    lineFall,
    lineRise,
    drift,
    jump,
    rings,
    cursorIn,
    cursorMove,
    click,
    focus,
    tagBuild,
  };

  window.NuvemMotion = NuvemMotion;
})();
