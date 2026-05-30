import { applyScriptToElement } from "../i18n.js";

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="container site-header__inner">
        <a href="/" class="brand" aria-label="Put Solunaca">
          <span class="brand__bar" aria-hidden="true"></span>
          <span class="brand__text" data-i18n="brand.name">PUT SOLUNACA</span>
        </a>

        <nav class="nav" aria-label="Glavna navigacija">
          <ul class="nav__list">
            <li><a href="/"               class="nav__link" data-i18n="nav.home">Naslovna</a></li>
            <li><a href="/galerija.html"   class="nav__link" data-i18n="nav.gallery">Galerija</a></li>
            <li><a href="/biografije.html" class="nav__link" data-i18n="nav.biographies">Biografije</a></li>
            <li><a href="/kontakt.html"    class="nav__link" data-i18n="nav.contact">Kontakt</a></li>
          </ul>
        </nav>

        <div class="header-actions">
          <a href="/kontakt.html" class="btn-donate" data-donate data-i18n="nav.donate">Донирај</a>

          <div class="lang-switch" role="group" aria-label="Pismo / Language">
            <button type="button" class="lang-switch__btn" data-script-set="lat" aria-label="Srpski (latinica)">LAT</button>
            <button type="button" class="lang-switch__btn" data-script-set="cir" aria-label="Српски (ћирилица)">ЋИР</button>
            <button type="button" class="lang-switch__btn" data-script-set="en"  aria-label="English">EN</button>
          </div>
        </div>
      </div>
    `;

    this.markActiveLink();
    applyScriptToElement(this);
  }

  markActiveLink() {
    const path = location.pathname;
    this.querySelectorAll(".nav__link").forEach((link) => {
      const href = link.getAttribute("href");
      const isHome  = href === "/" && (path === "/" || path === "/index.html" || path === "");
      const isOther = href !== "/" && path.endsWith(href);
      if (isHome || isOther) link.setAttribute("data-active", "");
    });
  }
}

customElements.define("site-header", SiteHeader);
