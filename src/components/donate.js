import { applyScriptToElement } from "../i18n.js";

// Donate button (header, all pages) → opens a modal. Payment method is a
// placeholder for now; wired via event delegation so it works with the
// component-rendered header button.
let overlay, lastFocus;

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement("div");
  overlay.className = "donate-modal";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="donate-modal__backdrop" data-donate-close></div>
    <div class="donate-modal__panel" role="dialog" aria-modal="true" aria-labelledby="donateTitle">
      <button type="button" class="donate-modal__close" aria-label="Zatvori" data-donate-close>&times;</button>
      <p class="eyebrow" data-i18n="donate.eyebrow">Подршка</p>
      <h2 class="donate-modal__title" id="donateTitle" data-i18n="donate.title">Подржите пројекат</h2>
      <p class="donate-modal__body" data-i18n="donate.body">„Пут Солунаца“ настаје независно, изван великих редакција. Свака подршка значи још један снимљени кадар и још једна исприповедана судбина.</p>
      <p class="donate-modal__note" data-i18n="donate.note">Подаци за директне уплате биће ускоро доступни на овом месту. До тада нас можете контактирати.</p>
      <a class="button button--accent" href="/kontakt.html">
        <span data-i18n="donate.contact">Контакт за подршку</span>
        <span class="button__arrow" aria-hidden="true">→</span>
      </a>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target.closest("[data-donate-close]")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!overlay.hidden && e.key === "Escape") close();
  });
  return overlay;
}

function open() {
  ensureOverlay();
  lastFocus = document.activeElement;
  applyScriptToElement(overlay);
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  overlay.querySelector(".donate-modal__close").focus({ preventScroll: true });
}

function close() {
  overlay.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(() => { overlay.hidden = true; }, 240);
  if (lastFocus) { try { lastFocus.focus({ preventScroll: true }); } catch {} }
}

export function initDonate() {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-donate]");
    if (trigger) { e.preventDefault(); open(); }
  });
}
