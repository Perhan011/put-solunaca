import ui from "./content/ui.json";

const STORAGE_KEY = "put-solunaca:script";
const VALID = new Set(["lat", "cir", "en"]);

const HTML_LANG = {
  lat: "sr-Latn",
  cir: "sr-Cyrl",
  en:  "en",
};

function detectDefault() {
  // Default: srpska ćirilica za sve nove posetioce.
  // Ovo je istorijski srpski sajt — ćirilica je primarno pismo.
  // Korisnik može da prebaci preko LAT/ЋИР/EN dugmadi u headeru.
  return "cir";
}

export function getCurrentScript() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return VALID.has(saved) ? saved : detectDefault();
}

export function applyScriptToElement(root) {
  const script = getCurrentScript();
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const entry = ui[key];
    if (!entry) return;
    const text = entry[script] ?? entry.lat ?? entry.en;
    if (text != null) el.textContent = text;
  });
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    const entry = ui[key];
    if (!entry) return;
    const text = entry[script] ?? entry.lat ?? entry.en;
    if (text != null) el.setAttribute("aria-label", text);
  });
}

function updateActivePressed(script) {
  document.querySelectorAll("[data-script-set]").forEach((btn) => {
    const isActive = btn.dataset.scriptSet === script;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

export function applyScript(script) {
  if (!VALID.has(script)) return;
  localStorage.setItem(STORAGE_KEY, script);
  document.documentElement.dataset.script = script;
  document.documentElement.lang = HTML_LANG[script];
  applyScriptToElement(document);
  updateActivePressed(script);
}

export function initScriptToggle() {
  applyScript(getCurrentScript());
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-script-set]");
    if (target) {
      e.preventDefault();
      applyScript(target.dataset.scriptSet);
    }
  });
}
