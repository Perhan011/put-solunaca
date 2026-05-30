// Click a gallery tile to open the full image in an overlay.
let overlay, imgEl, capTitle, capTag, lastFocus;

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="lightbox__backdrop" data-lb-close></div>
    <figure class="lightbox__figure">
      <button type="button" class="lightbox__close" aria-label="Zatvori" data-lb-close>&times;</button>
      <img class="lightbox__img" alt="" />
      <figcaption class="lightbox__cap">
        <span class="lightbox__cap-title"></span>
        <span class="lightbox__cap-tag"></span>
      </figcaption>
    </figure>`;
  document.body.appendChild(overlay);
  imgEl = overlay.querySelector(".lightbox__img");
  capTitle = overlay.querySelector(".lightbox__cap-title");
  capTag = overlay.querySelector(".lightbox__cap-tag");
  overlay.addEventListener("click", (e) => {
    if (e.target.closest("[data-lb-close]")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay.hidden && e.key === "Escape") close();
  });
  return overlay;
}

function open(src, title, tag) {
  ensureOverlay();
  lastFocus = document.activeElement;
  imgEl.src = src;
  capTitle.textContent = title || "";
  capTag.textContent = tag || "";
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  overlay.querySelector(".lightbox__close").focus({ preventScroll: true });
}

function close() {
  overlay.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(() => { overlay.hidden = true; }, 240);
  if (lastFocus) { try { lastFocus.focus({ preventScroll: true }); } catch {} }
}

export function initLightbox() {
  const tiles = Array.from(document.querySelectorAll(".gallery-tile"));
  if (!tiles.length) return;
  tiles.forEach((tile) => {
    const img = tile.querySelector(".gallery-tile__img");
    if (!img) return;
    tile.classList.add("gallery-tile--zoomable");
    tile.setAttribute("role", "button");
    tile.setAttribute("tabindex", "0");
    const fire = () => {
      const title = tile.querySelector(".gallery-tile__label")?.textContent?.trim();
      const tag = tile.querySelector(".gallery-tile__tag")?.textContent?.trim();
      open(img.currentSrc || img.src, title, tag);
    };
    tile.addEventListener("click", fire);
    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); }
    });
  });
}
