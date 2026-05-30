import { applyScriptToElement } from "../i18n.js";

// Interactive before/after image comparison slider.
// <before-after before="/a.webp" after="/b.webp"
//   before-key="i18n.key" after-key="i18n.key"
//   before-label="Arhiva" after-label="Rekreacija"></before-after>
class BeforeAfter extends HTMLElement {
  connectedCallback() {
    const before = this.getAttribute("before") || "";
    const after = this.getAttribute("after") || "";
    const bLabel = this.getAttribute("before-label") || "";
    const aLabel = this.getAttribute("after-label") || "";
    const bKey = this.getAttribute("before-key");
    const aKey = this.getAttribute("after-key");

    this.innerHTML = `
      <div class="ba" style="--ba-pos:50%">
        <img class="ba__img ba__img--after" src="${after}" alt="" draggable="false" loading="lazy" decoding="async" />
        <img class="ba__img ba__img--before" src="${before}" alt="" draggable="false" loading="lazy" decoding="async" />
        <span class="ba__tag ba__tag--before" ${bKey ? `data-i18n="${bKey}"` : ""}>${bLabel}</span>
        <span class="ba__tag ba__tag--after" ${aKey ? `data-i18n="${aKey}"` : ""}>${aLabel}</span>
        <button type="button" class="ba__handle" role="slider" aria-label="Pre / posle"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
          <span class="ba__handle-line" aria-hidden="true"></span>
          <span class="ba__handle-knob" aria-hidden="true">⟺</span>
        </button>
      </div>`;

    this.root = this.querySelector(".ba");
    this.handle = this.querySelector(".ba__handle");
    this._dragging = false;
    this._pos = 50;

    const setPos = (p) => {
      p = Math.max(0, Math.min(100, p));
      this._pos = p;
      this.root.style.setProperty("--ba-pos", p.toFixed(2) + "%");
      this.handle.setAttribute("aria-valuenow", Math.round(p));
    };
    const setFromX = (clientX) => {
      const rect = this.root.getBoundingClientRect();
      if (rect.width) setPos(((clientX - rect.left) / rect.width) * 100);
    };

    this._onDown = (e) => {
      this._dragging = true;
      this.root.classList.add("ba--dragging");
      setFromX(e.clientX);
      try { this.handle.focus({ preventScroll: true }); } catch {}
      e.preventDefault();
    };
    this._onMove = (e) => { if (this._dragging) setFromX(e.clientX); };
    this._onUp = () => {
      this._dragging = false;
      this.root.classList.remove("ba--dragging");
    };

    this.root.addEventListener("pointerdown", this._onDown);
    window.addEventListener("pointermove", this._onMove, { passive: true });
    window.addEventListener("pointerup", this._onUp, { passive: true });

    this.handle.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { setPos(this._pos - 4); e.preventDefault(); }
      else if (e.key === "ArrowRight") { setPos(this._pos + 4); e.preventDefault(); }
    });

    applyScriptToElement(this);
  }

  disconnectedCallback() {
    window.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("pointerup", this._onUp);
  }
}

customElements.define("before-after", BeforeAfter);
