# AI Promptovi — Hero animacija Put Solunaca

Verzija: 1.0
Datum: 2026-05-28
Stil: Ultra-fotorealistično, kinematski (1916–1918, Solunski front)

---

## Strategija

**Modeli** (od ultra-foto ka brzom):
1. **`veo3_1`** sa `quality: "ultra"` — top-tier fotorealizam (Google Veo 3.1 preview)
2. **`cinematic_studio_3_0`** — Higgsfield-ova najnaprednija kinematska
3. **`seedance_2_0`** sa `genre: "epic"`, `resolution: 1080p` — pouzdana motion, dobar za batch

**Format svih šotova:**
- Aspect: **16:9**
- Resolution: **1080p** (više kad model dozvoljava)
- Duration: **5 sekundi**
- Audio: ne treba (uzimamo samo frejmove)

**Pravila pisanja prompta:**
- Engleski jezik (AI modeli rade bolje na engleskom)
- Lock-uj period: "1916–1918", "WWI era", "Royal Serbian Army"
- Lock-uj film grade: "35mm anamorphic, desaturated palette, warm sepia highlights, shallow depth of field"
- Eksplicitno izbegavaj: modern objects, Western Front imagery, German Stahlhelm helmets (Srbi su nosili šajkače i francuske Adrian kacige)

---

## Šot A — Rov / Trench

**Frame range u finalnoj animaciji:** 0–23 (24 frejma)
**Trajanje izvora:** 5s

### Prompt

```
Cinematic ultra-realistic 35mm anamorphic shot, 1917, Macedonian Front,
muddy Serbian Royal Army trench at dawn, exhausted Serbian soldiers in
wool grey-green uniforms wearing šajkača caps and a few French Adrian
helmets, crouched against sandbag walls, breath visible in cold air,
trench periscope and bayonet-fixed Mauser rifles, soft volumetric morning
fog drifting through, slow dolly-in camera move from soldier silhouettes
toward the front line, desaturated earth-tone palette with warm amber
lantern highlight, shallow depth of field, 35mm film grain, no modern
objects, no German helmets, no Western Front trench geometry.
```

**Negative emphasis:** modern uniforms, anachronisms, Stahlhelm helmets, generic war movie cliché.

---

## Šot B — Eksplozija / Breakthrough

**Frame range:** 24–47
**Trajanje izvora:** 5s

### Prompt

```
Cinematic ultra-realistic 35mm shot, 1916 Battle of Kaymakchalan,
violent artillery breakthrough on a barren rocky Macedonian mountain
ridge, massive explosion erupting in mid-frame, debris and dirt
suspended in the air, Royal Serbian Army infantry charging out of
trenches in wool grey-green uniforms with šajkača caps and Adrian
helmets, regimental flag visible silhouetted against fire, dust cloud
backlit by sunrise, anamorphic lens flare, slow-motion intercut at the
moment of detonation, desaturated palette with deep red and orange
embers, heavy atmospheric haze, 35mm film grain, dramatic side
lighting, no modern military equipment.
```

---

## Šot C — Tranzicija u mapu / Smoke to Map

**Frame range:** 48–71
**Trajanje izvora:** 5s

### Prompt

```
Cinematic transition shot, dense battlefield smoke and dust slowly
clearing while camera rises vertically into the sky, smoke wisps morph
into topographic relief lines of the Balkan Peninsula, transitioning
from photoreal battlefield haze into a beautifully drawn 1918
hand-tinted military campaign map of Macedonia and Serbia, parchment
texture, faded brown ink contours of mountains, rivers, and old
city names, slow upward camera move, warm amber and faded sepia
palette, paper grain texture, 35mm film grain, painterly hand-drawn
cartography aesthetic, no modern map elements, no digital UI.
```

---

## Šot D — Putanja / Red Line

**Frame range:** 72–95
**Trajanje izvora:** 5s

### Prompt

```
Cinematic ultra-realistic close-up of a 1918 hand-drawn military
campaign map of the Balkans on aged parchment, a blood-red ink line
slowly drawing itself from southern Macedonia (Salonika / Thessaloniki)
northward through Skopje, Nish, ending at Belgrade, animated ink
bleeding into the paper with capillary feathering at each city marker,
small hand-written Serbian Cyrillic place labels appearing as the line
reaches each city, parchment grain, candle-light side glow, slow
push-in camera move, warm sepia palette with single bright crimson
accent of the ink, 35mm film grain, painterly cartographic detail,
no digital effects, no modern fonts.
```

**Backup ako tekst ne prolazi:** isti prompt bez "small hand-written
Serbian Cyrillic place labels" — onda dodajemo nazive kao SVG overlay
preko canvas-a.

---

## Šot E — Gvozdeni Puk / Heroic Shot

**Frame range:** 96–119
**Trajanje izvora:** 5s

### Prompt

```
Cinematic ultra-realistic heroic low-angle shot, 1918, Royal Serbian
Army Iron Regiment (Gvozdeni Puk) soldiers standing on a mountain
ridge silhouetted against a massive sunrise, wool grey-green uniforms
with šajkača caps and Adrian helmets, bayonet-fixed Mauser rifles
held upright, the regimental flag of the Kingdom of Serbia rippling
in slow wind, dust particles glittering in the golden backlit air,
slow heroic dolly-in camera move tilting slightly up, deep depth and
volumetric god rays piercing through morning mist, desaturated
palette with warm amber and gold highlights against muted greys, 35mm
anamorphic film grain, single tear of light on the lead soldier's
profile, no modern military gear, no Hollywood war film cliché.
```

---

## Plan iteracije

1. **Test šot B** (eksplozija) — najlakši za AI, vidimo baseline kvalitet
2. Ako prolazi → generišemo ostala 4 redom
3. Ako pada → switch na 2-step pipeline:
   - `nano_banana_pro` ili `soul_2` generiše ključnu fotografiju
   - Slika postaje `start_image` za `veo3_1` ili `kling3_0`
   - Veća kontrola nad kompozicijom

**Budget plan:** ~200–400 credita po šotu sa 2–3 iteracije = ~1500 credita ukupno (od 2994).

---

## Tehničke beleške za postprodukciju

Svaki šot je 5 sekundi @ 24fps = 120 frejmova izvora. Uzimamo svaki 5. frejm (`-vf "fps=4.8"` ili eksplicitno svaki 5.) → 24 frejma po šotu. Ukupno 24 × 5 = 120 frejmova hero animacije.
