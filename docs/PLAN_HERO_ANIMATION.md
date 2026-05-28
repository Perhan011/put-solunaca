# Plan — Hero scroll animacija "Put Solunaca"

Verzija: 1.0
Datum: 2026-05-28
Status: Predlog za odobrenje

---

## 1. Cilj

Hero sekcija na naslovnoj stranici koja po dolasku korisnika pokrene kratku kinematsku animaciju (~5s), zamrzne se na finalnom frejmu, a zatim se skrolovanjem **scrub-uje napred/nazad** kroz priču o Solunskom frontu i Gvozdenom puku. Cilj utiska: "premium, ozbiljno, ovi znaju šta rade" — direktno orijentisano ka publici investitora i istorijskih entuzijasta srednjih godina.

---

## 2. Tehnička arhitektura

### 2.1 Tehnika
**Sekvenca slika renderovana na `<canvas>`, scroll-driven preko GSAP ScrollTrigger.**

- Industrijski standard (Apple, Stripe, Oryzo)
- Frame-perfect kontrola, glatko skrolovanje napred/nazad
- Pouzdanost na svim browserima (iOS Safari uključen — što kod scrub-a videa nije slučaj)

### 2.2 Stack dodaci
| Paket | Verzija | Svrha |
|---|---|---|
| `gsap` | ^3.12 | Animaciona biblioteka |
| `gsap/ScrollTrigger` | (uključeno) | Pin sekcije, scrub progress |

Instaliranje: `npm install gsap`

Sve ostalo radimo vanilla — bez novih frameworka, ostajemo u postojećoj vanilla + web-components arhitekturi.

### 2.3 Struktura fajlova (dodaci)

```
src/
  components/
    hero-scroll-canvas.js      ← NOVO: web komponenta sa canvas + scroll logikom
  styles/
    hero.css                   ← NOVO: stilovi za hero sekciju (pin sekcija, tekst layeri)
  scripts/
    frame-loader.js            ← NOVO: util za preload + DPR scaling

public/
  frames/
    hero/
      desktop/                 ← NOVO: 120 WebP frejmova, 2560×1440
        frame_0000.webp
        frame_0001.webp
        ...
        frame_0119.webp
      mobile/                  ← NOVO: 60 WebP frejmova, 1080×1920
        frame_0000.webp
        ...

docs/
  PLAN_HERO_ANIMATION.md       ← ovaj dokument
  PROMPTS_AI_GENERACIJA.md     ← NOVO: precizni promptovi za AI video alate
```

### 2.4 Komponenta `<hero-scroll-canvas>`

Custom element koji se ubacuje u `index.html` na vrhu `<main>`:

```html
<hero-scroll-canvas
  frames-desktop="/frames/hero/desktop"
  frames-mobile="/frames/hero/mobile"
  frame-count-desktop="120"
  frame-count-mobile="60"
  total-scroll-vh="500"
></hero-scroll-canvas>
```

Atribut `total-scroll-vh="500"` znači da hero sekcija "okupira" 5× visinu viewporta dok se skroluje — daje vremena da se svi frejmovi i tekst segmenti pojave.

### 2.5 Render petlja

```
1. Komponenta se mount-uje → detektuje DPR (devicePixelRatio) i ekran
2. Bira frame set: desktop ili mobile
3. Preload faza: paralelno učitava svih 120 (60) WebP slika
   ├─ Pokazuje loading bar dok se učitavaju
   └─ Kad je sve spremno → emit "frames-ready"
4. Inicijalno crta frame[0] na canvas
5. ScrollTrigger setup:
   ├─ trigger: ova sekcija
   ├─ start: top top
   ├─ end: +totalScrollVh
   ├─ pin: true
   └─ scrub: 0.5  (smoothing, pratiti scroll sa malim delay-om)
6. Na onUpdate(progress 0→1):
   ├─ frameIndex = Math.floor(progress * (frameCount - 1))
   └─ ctx.drawImage(frames[frameIndex], 0, 0, w, h)
```

### 2.6 Responzivni canvas (oštrina na svim ekranima)

```js
const dpr = window.devicePixelRatio || 1;
canvas.width  = window.innerWidth  * dpr;
canvas.height = window.innerHeight * dpr;
canvas.style.width  = window.innerWidth  + 'px';
canvas.style.height = window.innerHeight + 'px';
ctx.scale(dpr, dpr);
```

To je razlog što servrimo 2560×1440 frejmove — da na 4K i Retina ekranima ostanu oštri.

---

## 3. Asset pipeline

### 3.1 Storyboard (zaključan)

| Šot | Opis | Frejmovi |
|---|---|---|
| A | WWI rov, srpski vojnici sa šajkačama, dim, polako napreduje kamera | 0–25 |
| B | Eksplozija — proboj Solunskog fronta na Kajmakčalanu | 25–50 |
| C | Tranzicija dim → ptičja perspektiva → topografska mapa Balkana | 50–75 |
| D | Crvena linija se crta: Solun → Skoplje → Niš → Beograd | 75–100 |
| E | Heroj kadar Gvozdenog puka, niski ugao, silueta, zastava | 100–120 |

### 3.2 AI generacija

**Alat:** generate_video MCP (Runway Gen-3 / Kling tier)

**Strategija:**
1. Generišemo svaki šot zasebno (5–6 sekundi po šotu)
2. Output: 1440p ili 1080p MP4
3. Iteriramo prompt-ove dok ne dobijemo prihvatljive šotove
4. Promptovi će biti u zasebnom `PROMPTS_AI_GENERACIJA.md`

**Vizuelni vodič za promptove (zajedničke karakteristike svih šotova):**
- "cinematic, 35mm film grain, desaturated palette with warm sepia highlights"
- "WWI era, 1916–1918, Serbian Royal Army, Solun Front, Macedonian terrain"
- "anamorphic lens, shallow depth of field, dramatic side lighting"
- Avoid: "modern objects, anachronisms, German/Allied insignia"

### 3.3 Postprodukcija

```bash
# 1. Spoji šotove
ffmpeg -i shot_A.mp4 -i shot_B.mp4 -i shot_C.mp4 -i shot_D.mp4 -i shot_E.mp4 \
  -filter_complex "[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1[v]" -map "[v]" hero_full.mp4

# 2. Ekstraktuj 120 frejmova ravnomerno raspoređenih
ffmpeg -i hero_full.mp4 -vf "scale=2560:1440,fps=24" -vframes 120 \
  frame_%04d.png

# 3. Konvertuj u WebP
for f in frame_*.png; do
  cwebp -q 75 "$f" -o "${f%.png}.webp"
done
```

### 3.4 Performans budget

| Metrika | Cilj | Maksimum |
|---|---|---|
| Veličina po frejmu (desktop) | 70 KB | 100 KB |
| Ukupna veličina (desktop, 120 frejmova) | 8 MB | 12 MB |
| Veličina po frejmu (mobile) | 35 KB | 50 KB |
| Ukupna veličina (mobile, 60 frejmova) | 2 MB | 3 MB |
| Vreme preload-a (desna mreža) | < 4s | < 8s |
| FPS scrub-a | 60fps | nikad ispod 30fps |

---

## 4. Tekst segmenti (scroll storytelling)

Dok korisnik skroluje kroz hero (5× visina viewporta), pojavljuju se tekst segmenti, sinhronizovani sa frejmovima:

| Progress | Frejm | Tekst (ćirilica) |
|---|---|---|
| 0.0 – 0.10 | A | "1915. Аустроугарска газa Србију." |
| 0.15 – 0.25 | A→B | "Војска одступа преко Албаније. Опстаје." |
| 0.35 – 0.50 | B | "1916. Кајмакчалан. Пробој Солунског фронта." |
| 0.55 – 0.70 | C→D | "Путања Гвозденог пука: Солун → Београд." |
| 0.75 – 0.90 | D→E | "За 45 дана прешли су 600 километара." |
| 0.95 – 1.0 | E | "Ово је њихов пут." |

Stilski:
- Font: **Fira Sans 700**, varijabilna veličina po segmentu (fluid clamp)
- Boje: bela na tamnoj pozadini, akcent crvena `var(--accent-2)` za ključne brojeve
- Animacija: `opacity 0 → 1 → 0` + lagan `translateY(20px → 0 → -20px)`
- Fixed position dok je sekcija pinned, fade out kad sekcija prelazi

---

## 5. Faze izvođenja (redosled)

### Faza A — Skela (1 sesija)
- [x] Plan dokument (ovaj)
- [ ] `npm install gsap`
- [ ] `hero-scroll-canvas` komponenta sa placeholder frejmovima
- [ ] 60 generisanih placeholder frejmova (numerisani gradijenti) da testiramo
- [ ] Integracija u `index.html`
- [ ] Lokalni dev test — scroll mehanika radi glatko

### Faza B — Sadržaj (paralelno, 2–3 sesije)
- [ ] AI promptovi finalizovani u `PROMPTS_AI_GENERACIJA.md`
- [ ] Šot A generisan i odobren
- [ ] Šot B generisan i odobren
- [ ] Šot C generisan i odobren
- [ ] Šot D generisan i odobren
- [ ] Šot E generisan i odobren

### Faza C — Postprodukcija (1 sesija)
- [ ] Spajanje šotova ffmpeg-om
- [ ] Ekstrakcija frejmova
- [ ] WebP konverzija + optimizacija
- [ ] Mobile varijanta (60 frejmova, manja rezolucija)
- [ ] Replace placeholder-a

### Faza D — Tekst i polish (1 sesija)
- [ ] Tekst segmenti
- [ ] `prefers-reduced-motion` fallback (statična slika + tekst)
- [ ] Mobile fallback (kraći set frejmova ili statika)
- [ ] Loading bar styling
- [ ] Performans audit (Lighthouse)

### Faza E — Ostale stranice (sledeća faza, posle hero-a)
- [ ] Stranica "Епизоде" — grid bitaka sa hover scenama
- [ ] Stranica "Личности" — portret + biografija layout
- [ ] Stranica "Пре/После" — B&W ↔ restored slider
- [ ] Galerija — masonry grid

---

## 6. Pristupačnost i degradacija

- **`prefers-reduced-motion: reduce`** → ne pokreće scrub, prikazuje statičan finalni frejm + tekst odjednom
- **JavaScript isključen** → `<noscript>` fallback sa statičnom slikom i tekstom
- **Spora veza** → kraći mobile set ili poster image dok se ne učita ceo set
- **Stari browser bez canvas** → fallback poster `<img>`

---

## 7. Rizici i alternative

| Rizik | Verovatnoća | Mitigacija |
|---|---|---|
| AI ne uspe da napravi koherentan WWI šot | Srednja | Iteracija promptova; backup: mix sa stock arhivskim materijalom |
| Ukupna veličina > 15 MB | Niska | Smanji broj frejmova na 90, pojačaj WebP kompresiju |
| iOS Safari ne renderuje glatko | Niska (canvas radi svuda) | Test rano, fallback na manji frame set |
| Scroll scrub deluje sporo na slabim laptopovima | Srednja | `scrub: 0.5` smoothing, requestAnimationFrame debounce |
| Investitori gledaju na 4K i frejmovi su mutni | Srednja | Servirаmo 2560×1440 desktop verziju |

---

## 8. Odluke (potvrđeno 2026-05-28)

1. **Loading:** Progresivni start — animacija kreće čim je prvi frejm spreman, ostali se učitavaju u pozadini. Bez blocking loading bar-a.
2. **Mapa:** Idemo sa nazivima mesta na crvenoj liniji (Солун, Скопље, Ниш, Београд). Ako AI generacija ne uspe da ih lepo renderuje, fallback je čista linija + ćiriličan tekst dodajemo kao SVG overlay iznad canvas-a.
3. **Audio:** Nice-to-have, ne must. Dodajemo stock ambient (vetar + daleki topovi) sa toggle dugmetom, muted po default-u.
4. **Heroj kadar E:** Ultra fotorealistično prvo. Ako ne ispadne dobro, prelazimo na umetnički ton.
