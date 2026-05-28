import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { applyScriptToElement } from "../i18n.js";

gsap.registerPlugin(ScrollTrigger);

const HERO_SEGMENTS = [
  { key: "hero.seg1", start: 0.00, end: 0.13 },
  { key: "hero.seg2", start: 0.17, end: 0.30 },
  { key: "hero.seg3", start: 0.34, end: 0.48 },
  { key: "hero.seg4", start: 0.52, end: 0.66 },
  { key: "hero.seg5", start: 0.70, end: 0.84 },
  { key: "hero.seg6", start: 0.88, end: 1.00 },
];

const SEG_FADE = 0.04;

// City pin markers shown over the map shots (Шот C → Шот D, progress ~0.40–0.78).
// Arranged diagonally south (Solun) → north (Beograd) following Iron Regiment path.
// All pins must fade out before Шот E (heroic ridge shot) begins at progress 0.80.
const HERO_PINS = [
  { key: "hero.pin.solun",   x: "14%", y: "78%", appearAt: 0.42, hideAt: 0.74 },
  { key: "hero.pin.skoplje", x: "32%", y: "62%", appearAt: 0.50, hideAt: 0.74 },
  { key: "hero.pin.nis",     x: "54%", y: "44%", appearAt: 0.58, hideAt: 0.74 },
  { key: "hero.pin.beograd", x: "76%", y: "26%", appearAt: 0.64, hideAt: 0.74 },
];

const PIN_FADE_IN = 0.04;
const PIN_FADE_OUT = 0.04;

class HeroScrollCanvas extends HTMLElement {
  constructor() {
    super();
    this.frames = [];
    this.currentFrameIndex = -1;
    this.loadedCount = 0;
    this.scrollTrigger = null;
    this._resizeRaf = null;
  }

  connectedCallback() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.frameCount = parseInt(
      this.getAttribute(isMobile ? "frame-count-mobile" : "frame-count-desktop") ||
        (isMobile ? "60" : "120"),
      10
    );
    this.framesPath = this.getAttribute(isMobile ? "frames-mobile" : "frames-desktop") ||
      (isMobile ? "/frames/hero/mobile" : "/frames/hero/desktop");
    this.pinDistanceVh = parseInt(this.getAttribute("pin-distance-vh") || "400", 10);
    this.placeholderMode = this.hasAttribute("placeholder");

    this.renderShell();
    this.sizeCanvas();

    this._onResize = () => {
      if (this._resizeRaf) cancelAnimationFrame(this._resizeRaf);
      this._resizeRaf = requestAnimationFrame(() => {
        this.sizeCanvas();
        const img = this.frames[this.currentFrameIndex];
        if (img) this.drawImage(img);
        ScrollTrigger.refresh();
      });
    };
    window.addEventListener("resize", this._onResize, { passive: true });

    // Re-apply locale to segments when script toggle changes
    this._onScriptChange = () => applyScriptToElement(this);
    window.addEventListener("storage", this._onScriptChange);
    document.addEventListener("click", this._delegatedScriptClick = (e) => {
      if (e.target.closest("[data-script-set]")) {
        // i18n.js already updated DOM globally; just ensure our segments refresh.
        requestAnimationFrame(this._onScriptChange);
      }
    });

    if (reducedMotion) {
      this.loadFrame(this.frameCount - 1).then((img) => {
        this.frames[this.frameCount - 1] = img;
        this.currentFrameIndex = this.frameCount - 1;
        this.drawImage(img);
      });
      return;
    }

    this.startProgressiveLoad();
  }

  disconnectedCallback() {
    this.scrollTrigger?.kill();
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("storage", this._onScriptChange);
    document.removeEventListener("click", this._delegatedScriptClick);
  }

  updateSegments(progress) {
    if (!this.segmentEls) return;
    HERO_SEGMENTS.forEach((seg, i) => {
      const el = this.segmentEls[i];
      if (!el) return;

      const inWindow = progress >= seg.start && progress <= seg.end;
      let opacity = 0;
      let translateY = 24;

      if (inWindow) {
        const fadeIn = (progress - seg.start) / SEG_FADE;
        const fadeOut = (seg.end - progress) / SEG_FADE;
        const eased = Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
        opacity = eased;
        translateY = (1 - eased) * 24 * (progress < (seg.start + seg.end) / 2 ? 1 : -1);
      }

      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate(-50%, ${translateY.toFixed(1)}px)`;
    });

    // Fade hint out after any scroll
    if (this.hintEl) {
      const hintOpacity = progress > 0.02 ? 0 : 1;
      this.hintEl.style.opacity = hintOpacity;
    }

    // City pins — sequential appearance during map shots, fade out before hero
    if (this.pinEls) {
      HERO_PINS.forEach((pin, i) => {
        const el = this.pinEls[i];
        if (!el) return;

        let opacity = 0;
        let scale = 0.6;

        if (progress >= pin.appearAt && progress <= pin.hideAt) {
          const fadeIn = (progress - pin.appearAt) / PIN_FADE_IN;
          const fadeOut = (pin.hideAt - progress) / PIN_FADE_OUT;
          const eased = Math.max(0, Math.min(1, Math.min(fadeIn, fadeOut)));
          opacity = eased;
          scale = 0.6 + 0.4 * eased;
        }

        el.style.opacity = opacity.toFixed(3);
        el.style.setProperty("--pin-scale", scale.toFixed(2));
      });
    }
  }

  renderShell() {
    // Hero text segments removed — section content scrolls over the canvas instead.
    const segmentMarkup = "";

    const pinMarkup = HERO_PINS.map(
      (p, i) => `
        <div class="hero-scroll__pin" data-pin-index="${i}" style="--pin-x: ${p.x}; --pin-y: ${p.y};">
          <span class="hero-scroll__pin-dot" aria-hidden="true"></span>
          <span class="hero-scroll__pin-label" data-i18n="${p.key}"></span>
        </div>
      `
    ).join("");

    this.innerHTML = `
      <div class="hero-scroll" data-placeholder="${this.placeholderMode}">
        <canvas class="hero-scroll__canvas" aria-hidden="true"></canvas>
        <div class="hero-scroll__vignette" aria-hidden="true"></div>
        <div class="hero-scroll__pins" aria-hidden="true">
          ${pinMarkup}
        </div>
        <div class="hero-scroll__overlay">
          <div class="hero-scroll__progress" aria-hidden="true">
            <div class="hero-scroll__progress-bar"></div>
          </div>
          <div class="hero-scroll__text-layer">
            ${segmentMarkup}
          </div>
        </div>
        <div class="hero-scroll__hint" aria-hidden="true">
          <span data-i18n="hero.hint">Скролуј</span>
          <span class="hero-scroll__hint-arrow">↓</span>
        </div>
      </div>
    `;

    this.shellEl = this.querySelector(".hero-scroll");
    this.canvas = this.querySelector(".hero-scroll__canvas");
    this.ctx = this.canvas.getContext("2d");
    this.progressBar = this.querySelector(".hero-scroll__progress-bar");
    this.progressWrap = this.querySelector(".hero-scroll__progress");
    this.segmentEls = Array.from(this.querySelectorAll(".hero-scroll__segment"));
    this.pinEls = Array.from(this.querySelectorAll(".hero-scroll__pin"));
    this.hintEl = this.querySelector(".hero-scroll__hint");

    // Apply current locale to segment text (and to hint)
    applyScriptToElement(this);
  }

  sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._w = w;
    this._h = h;
  }

  framePath(index) {
    const padded = String(index).padStart(4, "0");
    return `${this.framesPath}/frame_${padded}.webp`;
  }

  placeholderDataUrl(index) {
    const total = this.frameCount;
    const t = total > 1 ? index / (total - 1) : 0;
    const w = 1280;
    const h = 720;

    let label = "ROV";
    if (t > 0.2 && t <= 0.42) label = "EKSPLOZIJA";
    else if (t > 0.42 && t <= 0.63) label = "MAPA";
    else if (t > 0.63 && t <= 0.83) label = "PUTANJA";
    else if (t > 0.83) label = "GVOZDENI PUK";

    const hue = 215 - t * 70;
    const sat = 25 + t * 25;
    const lightCore = 8 + t * 18;
    const lightEdge = 3 + t * 6;
    const accentAlpha = (0.25 + t * 0.5).toFixed(2);
    const cx = 640 + Math.sin(t * Math.PI * 2) * 220;
    const cy = 360 + Math.cos(t * Math.PI * 1.4) * 120;
    const r = 90 + t * 140;

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<defs>` +
      `<radialGradient id="g" cx="50%" cy="${(30 + t * 40).toFixed(0)}%" r="85%">` +
      `<stop offset="0%" stop-color="hsl(${hue}, ${sat}%, ${lightCore}%)"/>` +
      `<stop offset="100%" stop-color="hsl(${hue + 20}, ${sat}%, ${lightEdge}%)"/>` +
      `</radialGradient>` +
      `</defs>` +
      `<rect width="${w}" height="${h}" fill="url(#g)"/>` +
      `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="rgba(158,27,50,${accentAlpha})"/>` +
      `<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#E8E2D5" stroke-opacity="0.08" stroke-width="2"/>` +
      `<text x="50%" y="46%" text-anchor="middle" font-family="'Fira Sans', sans-serif" font-weight="700" font-size="56" fill="#E8E2D5" opacity="0.85">${label}</text>` +
      `<text x="50%" y="54%" text-anchor="middle" font-family="'Roboto Mono', monospace" font-size="22" fill="#E8E2D5" opacity="0.55">FRAME ${index} / ${total - 1}</text>` +
      `<text x="50%" y="62%" text-anchor="middle" font-family="'Roboto Mono', monospace" font-size="14" fill="#E8E2D5" opacity="0.35">PLACEHOLDER · zameni AI generisanim WebP-om</text>` +
      `</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  loadFrame(index) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = this.placeholderMode ? this.placeholderDataUrl(index) : this.framePath(index);
    });
  }

  drawImage(img) {
    const w = this._w;
    const h = this._h;
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;

    let drawW, drawH, drawX, drawY;
    if (imgRatio > canvasRatio) {
      drawH = h;
      drawW = h * imgRatio;
      drawX = (w - drawW) / 2;
      drawY = 0;
    } else {
      drawW = w;
      drawH = w / imgRatio;
      drawX = 0;
      drawY = (h - drawH) / 2;
    }

    this.ctx.clearRect(0, 0, w, h);
    this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  async startProgressiveLoad() {
    try {
      const firstFrame = await this.loadFrame(0);
      this.frames[0] = firstFrame;
      this.currentFrameIndex = 0;
      this.drawImage(firstFrame);
      this.loadedCount = 1;
      this.updateProgressBar();
      this.setupScrollTrigger();
    } catch (e) {
      console.error("[hero-scroll-canvas] First frame failed to load.", e);
      return;
    }

    const concurrency = 6;
    const queue = [];
    for (let i = 1; i < this.frameCount; i++) queue.push(i);

    const worker = async () => {
      while (queue.length) {
        const i = queue.shift();
        try {
          const img = await this.loadFrame(i);
          this.frames[i] = img;
          this.loadedCount++;
          this.updateProgressBar();
        } catch {
          /* skip failed frame */
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, worker));
    this.dispatchEvent(new CustomEvent("frames-ready"));
  }

  updateProgressBar() {
    if (!this.progressBar) return;
    const pct = (this.loadedCount / this.frameCount) * 100;
    this.progressBar.style.width = `${pct}%`;
    if (this.loadedCount >= this.frameCount) {
      this.progressWrap?.classList.add("hero-scroll__progress--done");
    }
  }

  setupScrollTrigger() {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.shellEl,
      start: "top top",
      end: () => "+=" + window.innerHeight * (this.pinDistanceVh / 100),
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      anticipatePin: 1,
      onUpdate: (self) => {
        const targetIndex = Math.min(
          this.frameCount - 1,
          Math.max(0, Math.floor(self.progress * this.frameCount))
        );

        // Use nearest loaded frame if exact target not yet loaded
        let useIndex = targetIndex;
        while (useIndex > 0 && !this.frames[useIndex]) useIndex--;

        if (this.frames[useIndex] && useIndex !== this.currentFrameIndex) {
          this.currentFrameIndex = useIndex;
          this.drawImage(this.frames[useIndex]);
        }

        this.updateSegments(self.progress);
      },
    });
  }
}

customElements.define("hero-scroll-canvas", HeroScrollCanvas);
