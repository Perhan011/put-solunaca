import ui from "./content/ui.json";

const STORAGE_KEY = "put-solunaca:script";
const VALID = new Set(["lat", "cir", "en"]);

const HTML_LANG = {
  lat: "sr-Latn",
  cir: "sr-Cyrl",
  en:  "en",
};

// Jezici domaćih / ex-YU posetilaca → podrazumevana ćirilica.
// MORA da bude identično skupu u inline <head> skripti svake HTML strane (flash guard).
const CIR_LANGS = new Set(["sr", "bs", "hr", "me", "mk", "sl", "sh", "hbs"]);

function detectDefault() {
  // Domaći / ex-YU posetioci → ćirilica (primarno pismo ovog srpskog istorijskog sajta).
  // Strani posetioci (engleski i svi ostali) → engleski.
  // Izbor se uvek može promeniti preko LAT/ЋИР/EN — i tek tada se pamti.
  try {
    const langs =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ""];
    const domaci = langs.some((l) =>
      CIR_LANGS.has(String(l || "").toLowerCase().split("-")[0])
    );
    return domaci ? "cir" : "en";
  } catch {
    return "cir";
  }
}

export function getCurrentScript() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* localStorage nedostupan (privatni režim) — koristi detekciju */
  }
  return VALID.has(saved) ? saved : detectDefault();
}

export function applyScriptToElement(root) {
  const script = getCurrentScript();
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const entry = ui[key];
    if (!entry) return;
    const text = entry[script] ?? entry.lat ?? entry.en;
    // Dictionary is trusted/static; allow inline markup (<em>, <strong>) in values.
    if (text != null) {
      if (text.includes("<")) el.innerHTML = text;
      else el.textContent = text;
    }
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

export function applyScript(script, { persist = true } = {}) {
  if (!VALID.has(script)) return;
  // Pamtimo SAMO kada korisnik svesno izabere pismo (klik na dugme), ne i
  // automatski detektovan podrazumevani izbor — da detekcija ostane "živa".
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, script);
    } catch {
      /* localStorage nedostupan — preskoči, izbor važi za tekuću sesiju */
    }
  }
  document.documentElement.dataset.script = script;
  document.documentElement.lang = HTML_LANG[script];
  applyScriptToElement(document);
  updateActivePressed(script);
}

export function initScriptToggle() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const initial = VALID.has(saved) ? saved : detectDefault();
  // Inicijalna primena ne pamti (samo eksplicitan klik pamti).
  applyScript(initial, { persist: false });
  // Sadržaj je primenjen — ukloni flash guard (ako ga je inline skripta postavila).
  document.documentElement.classList.remove("i18n-pending");
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-script-set]");
    if (target) {
      e.preventDefault();
      applyScript(target.dataset.scriptSet, { persist: true });
    }
  });
}
