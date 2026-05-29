import "./components/site-header.js";
import "./components/site-footer.js";
import "./components/hero-scroll-canvas.js";
import { initScriptToggle } from "./i18n.js";

// Init i18n directly — module scripts are deferred, so the DOM is already
// parsed here. Avoid requestAnimationFrame: rAF callbacks are paused in
// background/hidden tabs, which would leave the toggle unwired.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScriptToggle);
} else {
  initScriptToggle();
}

// === Scroll reveal — fade elements into view as they enter viewport ===
// Uses requestAnimationFrame poll — robust across browsers and embedded preview environments
// where programmatic scrolling does not always fire 'scroll' events.
function initScrollReveal() {
  window.__revealRuns = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pending = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!pending.length) return;
  window.__revealPending = pending.length;

  if (reduced) {
    pending.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const check = () => {
    const triggerY = window.innerHeight * 0.9;
    const stillPending = [];
    for (const el of pending) {
      const rect = el.getBoundingClientRect();
      if (rect.top < triggerY) {
        el.classList.add("is-revealed");
      } else {
        stillPending.push(el);
      }
    }
    pending = stillPending;
  };

  // Poll every 80 ms — robust across browsers, embedded previews, and inactive tabs.
  // Self-cancels once all elements are revealed.
  const intervalId = setInterval(() => {
    check();
    if (!pending.length) clearInterval(intervalId);
  }, 80);

  // Also listen to scroll/resize for immediate response on real user input.
  const onChange = () => check();
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange, { passive: true });

  // Initial check (catches anything already in view on load).
  check();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScrollReveal);
} else {
  initScrollReveal();
}
