import { applyScriptToElement } from "../i18n.js";

// === Donation destinations ===========================================
// Fill these in once the accounts exist. An empty string renders that
// method as "coming soon" (disabled). No keys/secrets live here — these
// are just public payment URLs (Stripe Payment Link, PayPal, crypto).
const PAYMENT = {
  card: "", // Stripe Payment Link (cards) → https://buy.stripe.com/...
  paypal: "https://www.paypal.com/ncp/payment/DV5HLVHXX5JWL", // PayPal hosted checkout (no-code payment link) — guest card checkout supported
  crypto: "", // Crypto checkout link (Coinbase Commerce / NOWPayments / wallet)
};

const METHODS = [
  { id: "card", labelKey: "donate.m.card.label", subKey: "donate.m.card.sub" },
  { id: "paypal", labelKey: "donate.m.paypal.label", subKey: "donate.m.paypal.sub" },
  { id: "crypto", labelKey: "donate.m.crypto.label", subKey: "donate.m.crypto.sub" },
];

let overlay, lastFocus;

function methodMarkup(m) {
  const href = PAYMENT[m.id];
  const active = Boolean(href);
  const tag = active ? "a" : "button";
  const attrs = active
    ? `href="${href}" target="_blank" rel="noopener noreferrer"`
    : `type="button" disabled aria-disabled="true"`;
  const action = active
    ? `<span class="donate-method__arrow" aria-hidden="true">→</span>`
    : `<span class="donate-method__soon" data-i18n="donate.soon">Ускоро</span>`;
  return `
    <${tag} class="donate-method${active ? "" : " donate-method--soon"}" ${attrs}>
      <span class="donate-method__main">
        <span class="donate-method__label" data-i18n="${m.labelKey}"></span>
        <span class="donate-method__sub" data-i18n="${m.subKey}"></span>
      </span>
      ${action}
    </${tag}>`;
}

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
      <p class="donate-modal__body" data-i18n="donate.body">„Пут Солунаца“ настаје независно. Свака подршка значи још један снимљени кадар.</p>
      <div class="donate-methods">
        ${METHODS.map(methodMarkup).join("")}
      </div>
      <p class="donate-modal__note">
        <span data-i18n="donate.note">Опције за уплату ускоро. До тада нас можете контактирати.</span>
        <a href="/kontakt.html" data-i18n="donate.contact">Контакт</a>
      </p>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target.closest("[data-donate-close]")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (overlay.classList.contains("is-open") && e.key === "Escape") close();
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
