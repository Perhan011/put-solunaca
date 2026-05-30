import "./components/site-header.js";
import "./components/site-footer.js";
import "./components/hero-scroll-canvas.js";
import "./components/before-after.js";
import { initScriptToggle } from "./i18n.js";
import { initLightbox } from "./components/lightbox.js";
import { initDonate } from "./components/donate.js";

// Init i18n directly — module scripts are deferred, so the DOM is already
// parsed here. Avoid requestAnimationFrame: rAF callbacks are paused in
// background/hidden tabs, which would leave the toggle unwired.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScriptToggle);
} else {
  initScriptToggle();
}

// === Scroll reveal — fade elements into view as they enter viewport ===
// IntersectionObserver: fires off the scroll path with no per-scroll layout
// reads, so it stays smooth on weaker machines (the old version polled
// getBoundingClientRect every 80ms AND on every scroll event = layout thrash).
function initScrollReveal() {
  const els = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!els.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target); // reveal once, then stop watching
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
  );

  els.forEach((el) => io.observe(el));

  // Safety net: in a normal foreground browser the observer reveals on-screen
  // elements within a frame. If after 1.5s NOTHING was revealed, the observer
  // isn't computing intersections (e.g. a non-rendered/background tab) — reveal
  // everything so content is never stuck invisible. On every page at least one
  // element is on screen at load, so this never wrongly fires in a real browser.
  setTimeout(() => {
    if (!document.querySelector("[data-reveal].is-revealed")) {
      els.forEach((el) => el.classList.add("is-revealed"));
    }
  }, 1500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScrollReveal);
} else {
  initScrollReveal();
}

// Gallery lightbox + donate modal
function initInteractions() {
  initLightbox();
  initDonate();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initInteractions);
} else {
  initInteractions();
}
