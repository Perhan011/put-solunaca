import { applyScriptToElement } from "../i18n.js";

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <div class="container site-footer__inner">
        <span class="brand">
          <span class="brand__bar" aria-hidden="true"></span>
          <span class="brand__text" data-i18n="brand.name">PUT SOLUNACA</span>
        </span>
        <span class="site-footer__meta">&copy; ${year}</span>
      </div>
    `;
    applyScriptToElement(this);
  }
}

customElements.define("site-footer", SiteFooter);
