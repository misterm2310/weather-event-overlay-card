/**
 * weather-event-overlay-card
 * Lovelace Custom Card — kombiniertes Wetter/Event-Overlay
 * (Regen, Schnee, Laub, Luftballons, Lichterkette, Sternschnuppen, Blitze) mit visuellem GUI-Editor.
 */

/* ============================== HELFER ============================== */

function fireEvent(node, type, detail) {
  const event = new Event(type, { bubbles: true, composed: true });
  event.detail = detail;
  node.dispatchEvent(event);
}

function spreadSample(arr, count) {
  if (!arr || !arr.length) return [];
  const sorted = [...arr].sort((a, b) => a.l - b.l);
  if (count >= sorted.length) return sorted;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(sorted[Math.floor((i * sorted.length) / count)]);
  }
  return result;
}

function hexToRgb(hex) {
  let h = (hex || "").trim();
  if (h === "auto" || !h) h = "#ffffff";
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(num)) return { r: 255, g: 255, b: 255 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToCss({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function gradientColor(colors, t) {
  const safeColors = (colors && colors.length === 3) ? colors : ["#c9a227", "#a83232", "#d9812c"];
  const [c0, c1, c2] = safeColors.map(hexToRgb);
  const seg = t < 0.5 ? [c0, c1, t * 2] : [c1, c2, (t - 0.5) * 2];
  const [from, to, localT] = seg;
  return rgbToCss({
    r: Math.round(lerp(from.r, to.r, localT)),
    g: Math.round(lerp(from.g, to.g, localT)),
    b: Math.round(lerp(from.b, to.b, localT)),
  });
}

function getParticleCount(preset, eventType) {
  let max = 60;
  if (eventType === "balloons") max = 30;
  if (eventType === "lights") max = 25;
  if (eventType === "shooting_stars") {
    switch (preset) {
      case "low": return 3;
      case "high": return 8;
      case "medium": default: return 5;
    }
  }
  if (eventType === "lightning") {
    switch (preset) {
      case "low": return 2;
      case "high": return 6;
      case "medium": default: return 4;
    }
  }
  if (eventType === "fog") {
    switch (preset) {
      case "low": return 3;
      case "high": return 8;
      case "medium": default: return 5;
    }
  }
  if (eventType === "stars") {
    switch (preset) {
      case "low": return 15;
      case "high": return 55;
      case "medium": default: return 30;
    }
  }
  switch (preset) {
    case "low": return Math.round(max * 0.33);
    case "high": return max;
    case "medium": default: return Math.round(max * 0.66);
  }
}

function getOpacityValue(preset) {
  switch (preset) {
    case "low": return 0.3;
    case "high": return 1.0;
    case "medium": default: return 0.6;
  }
}

// Erkennung des Hell/Dunkel Modus
function isDarkModeActive(hassInstance) {
  try {
    if (hassInstance && hassInstance.themes) {
      if (hassInstance.themes.darkMode !== undefined) {
        return hassInstance.themes.darkMode;
      }
    }
    
    const rootStyles = getComputedStyle(document.documentElement);
    const bgColor = rootStyles.getPropertyValue('--primary-background-color').trim();
    if (bgColor) {
      const rgbMatch = bgColor.match(/\d+/g);
      if (rgbMatch && rgbMatch.length >= 3) {
        const brightness = (parseInt(rgbMatch[0]) * 299 + parseInt(rgbMatch[1]) * 587 + parseInt(rgbMatch[2]) * 114) / 1000;
        return brightness < 128;
      }
    }

    const haEl = document.querySelector('home-assistant');
    if (haEl) {
      if (haEl.hasAttribute('dark-mode') || haEl.classList.contains('dark')) return true;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    return true;
  }
}

function resolveDynamicColor(cfgColor, hassInstance, defaultLight = "#1e3a8a", defaultDark = "#a0c4ff") {
  if (cfgColor && cfgColor !== "auto") return cfgColor;
  const dark = isDarkModeActive(hassInstance);
  return dark ? defaultDark : defaultLight;
}

// Verbesserung (Aufräumen): zentrale Basis-CSS für alle Overlay-Container,
// statt in jeder render*-Funktion dieselben 6 Zeilen zu wiederholen.
function overlayBaseCss(className, extraProps = "") {
  return `
    .${className} {
      position: fixed; top:0; left:50%; transform:translateX(-50%);
      width:100vw; height:100vh; pointer-events:none; z-index:9999; overflow:hidden;
      ${extraProps}
    }
  `;
}

// Verbesserung (Sicherheit): sehr einfache Whitelist für benutzerdefinierte
// Laub-SVG-Pfade, damit über die Config kein beliebiges HTML/JS eingeschleust
// werden kann (z. B. <script> oder onerror-Attribute). Erlaubt nur die
// üblichen SVG-Zeichenelemente und ihre gängigen Attribute.
function sanitizeLeafShape(input) {
  if (typeof input !== "string" || !input.trim()) return null;
  const trimmed = input.trim();

  // Verbotene Muster sofort ablehnen (Scripts, Event-Handler, externe Referenzen)
  const forbidden = /<script|javascript:|on\w+\s*=|<iframe|<object|<embed|xlink:href|href\s*=/i;
  if (forbidden.test(trimmed)) return null;

  // Nur erlaubte Tags zulassen (path, polygon, circle, line, g, rect)
  const allowedTagPattern = /<\/?(path|polygon|circle|line|g|rect)\b[^>]*>/gi;
  const strippedOfAllowed = trimmed.replace(allowedTagPattern, "");
  // Wenn nach Entfernen aller erlaubten Tags noch ein < übrig ist, steckt
  // ein nicht erlaubtes Element drin -> ablehnen.
  if (strippedOfAllowed.includes("<")) return null;

  return trimmed;
}

// Verbesserung (Performance): einmalig zufällig erzeugte Positionsdaten für
// Sternschnuppen und Blitz-Timing zwischenspeichern, damit ein Resize oder
// Theme-Wechsel nicht bei jedem Re-Render neue Zufallswerte (= Flackern) erzeugt.
const _randomCache = new Map();
function getCachedRandomSet(key, count, factory) {
  const cacheKey = `${key}:${count}`;
  if (!_randomCache.has(cacheKey)) {
    _randomCache.set(cacheKey, Array.from({ length: count }, factory));
  }
  return _randomCache.get(cacheKey);
}

/* ============================ STATISCHE DATEN ============================ */

// Verbesserung (optionale Wetter-Automatik): übersetzt den Zustand einer
// HA weather-Entity (z. B. weather.home) automatisch in einen oder mehrere
// Karten-Effekte. Regnet's laut Home Assistant -> Regen an. Bei "Schneeregen"
// (snowy-rainy) laufen Schnee UND Regen gleichzeitig, bei Gewitter mit Regen
// (lightning-rainy) laufen Blitz UND Regen gleichzeitig. Kein passender
// Effekt -> ["off"].
const WEATHER_STATE_MAP = {
  "rainy": ["rain"],
  "pouring": ["rain"],
  "snowy": ["snow"],
  "snowy-rainy": ["snow", "rain"],
  "hail": ["hail"],
  "lightning": ["lightning"],
  "lightning-rainy": ["lightning", "rain"],
  "fog": ["fog"],
  "windy": ["storm"],
  "windy-variant": ["storm"],
  "clear-night": ["stars"],
};

// Gibt IMMER ein Array zurück (auch bei einem einzelnen Effekt), damit die
// Karte Zustände mit mehreren gleichzeitigen Effekten einheitlich behandeln
// kann, ohne an jeder Stelle zwischen String und Array unterscheiden zu müssen.
function mapWeatherStateToEvents(state) {
  return WEATHER_STATE_MAP[state] || ["off"];
}

// Verbesserung (GUI-Editor): Tabelle, welcher Effekt welche Regler
// tatsächlich benutzt. Der Editor blendet Anzahl/Deckkraft/Farbmodus nur
// ein, wenn der gewählte Effekt sie auch wirklich verwendet.
const EVENT_CAPABILITIES = {
  off: { count: false, opacity: false, color: false },
  // Automatik kann auf Regen/Schnee/Hagel/Nebel/Sturm (alle mit Farbe) oder
  // Blitz (ohne Farbe) münden. Anzahl/Deckkraft wirken bei allen sechs,
  // deshalb bleiben sie im Editor sichtbar - nur der Event-Typ wird ersetzt.
  weather_auto: { count: true, opacity: true, color: true },
  rain: { count: true, opacity: true, color: true },
  snow: { count: true, opacity: true, color: true },
  hail: { count: true, opacity: true, color: true },
  lightning: { count: true, opacity: true, color: false },
  fog: { count: true, opacity: true, color: true },
  storm: { count: true, opacity: true, color: true },
  leaves: { count: true, opacity: true, color: false },
  shooting_stars: { count: true, opacity: true, color: true },
  balloons: { count: true, opacity: true, color: false },
  lights: { count: true, opacity: true, color: false },
  // Anzahl steuert bei Weihnachtsmann den Abstand zwischen den Vorbeiflügen
  // statt einer Partikelmenge (es gibt ja nur einen Schlitten). Farbmodus
  // ist jetzt wieder aktiv, da die Silhouette einfarbig ist (wie Regen/Schnee).
  santa: { count: true, opacity: true, color: true },
  // Bei der Spinne gibt's nur EIN Tier - Anzahl macht hier keinen Sinn.
  // Farbmodus bleibt aktiv, da Netz/Faden sich Hell/Dunkel anpassen.
  spider: { count: false, opacity: true, color: true },
  stars: { count: true, opacity: true, color: true },
};

const BALLOON_COLORS = ["#FF4B4B", "#FF851B", "#FFDC00", "#2ECC40", "#0074D9", "#B10DC9", "#F012BE"];

const BALLOON_SVG = `
<svg viewBox="0 0 50 80" preserveAspectRatio="xMidYMid meet">
  <path d="M 25 5 Q 45 5 45 30 Q 45 52 25 55 Q 5 52 5 30 Q 5 5 25 5 Z" fill="currentColor" />
  <polygon points="22,55 28,55 25,58" fill="currentColor" />
  <path d="M 12 18 Q 15 10 22 8" stroke="rgba(255,255,255,0.6)" stroke-width="2.5" stroke-linecap="round" fill="none" />
  <path d="M 25 58 Q 20 65 28 72 T 25 80" stroke="rgba(200,200,200,0.7)" stroke-width="1" fill="none" />
</svg>
`;

const DEFAULT_LEAF_SHAPE = `
  <path d="M50 4 C22 18, 10 55, 50 96 C90 55, 78 18, 50 4 Z" fill="currentColor"/>
  <path d="M50 10 L50 90" stroke="rgba(0,0,0,0.25)" stroke-width="3" stroke-linecap="round"/>
  <path d="M50 30 L34 20 M50 30 L66 20 M50 55 L30 45 M50 55 L70 45 M50 75 L36 68 M50 75 L64 68"
        stroke="rgba(0,0,0,0.18)" stroke-width="2" stroke-linecap="round"/>
`;

const BALLOONS = Array.from({ length: 30 }, (_, i) => ({
  l: (i * 3.2) + 2,
  size: Math.floor(Math.random() * 20) + 38,
  dur: (Math.random() * 4 + 7).toFixed(2),
  d: (Math.random() * -10).toFixed(2),
  color: BALLOON_COLORS[i % BALLOON_COLORS.length],
  sway: Math.floor(Math.random() * 25 + 15),
}));

const DROPS = Array.from({ length: 60 }, (_, i) => ({
  l: (i * 1.6) + 1,
  size: Math.floor(Math.random() * 14) + 16,
  dur: (Math.random() * 0.3 + 0.4).toFixed(2),
  d: (Math.random() * -2).toFixed(2),
  op: (Math.random() * 0.5 + 0.4).toFixed(2),
}));

const FLAKES_DATA = Array.from({ length: 50 }, (_, i) => ({
  l: (i * 1.95) + 1,
  s: Math.floor(Math.random() * 12) + 8,
  ex: Math.floor(Math.random() * 60) - 30,
  dur: Math.floor(Math.random() * 12) + 18,
  d: (Math.random() * 1).toFixed(2),
  op: (Math.random() * 0.6 + 0.3).toFixed(2),
}));

/* ============================ RENDER-FUNKTIONEN ============================ */

function renderRain(cfg, hass) {
  const color = resolveDynamicColor(cfg.color, hass, "#1e3a8a", "#a0c4ff");
  const count = getParticleCount(cfg.count_preset || "medium", "rain");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const drops = spreadSample(DROPS, count);

  // Verbesserung: bei "Kräftig" jeden Tropfen auf einen hohen Mindestwert
  // anheben (gleiche Logik wie bei Schnee) - sonst bleiben zufällig blasse
  // Tropfen auch bei "Kräftig" blass.
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const dropHTML = drops.map((d) => {
    const op = isHigh
      ? Math.min(1, Math.max(d.op, 0.85)).toFixed(2)
      : (d.op * opacity).toFixed(2);
    return `<div class="drop" style="left:${d.l}vw; height:${d.size}px; animation-duration:${d.dur}s; animation-delay:${d.d}s; opacity:${op};"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("rain")}
    .rain .drop { 
      position: absolute; 
      top: -20%; 
      width: 2px; 
      background: linear-gradient(180deg, rgba(255,255,255,0) 0%, ${color} 100%) !important; 
      border-radius: 50%; 
      animation: rainfall linear infinite;
      will-change: transform;
    }
    @keyframes rainfall { 
      0% { transform: translateY(0vh) translateX(0px); } 
      100% { transform: translateY(120vh) translateX(-15px); } 
    }
  `;
  return { css, html: `<div class="rain" aria-hidden="true">${dropHTML}</div>` };
}

function renderSnow(cfg, hass) {
  const color = resolveDynamicColor(cfg.color, hass, "#222222", "#ffffff");
  const count = getParticleCount(cfg.count_preset || "medium", "snow");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const flakes = spreadSample(FLAKES_DATA, count);

  // Verbesserung: bei "Kräftig" jede Flocke auf einen hohen Mindestwert
  // anheben, statt nur den ohnehin schon zufälligen Wert (f.op) zu deckeln.
  // Vorher blieben blasse Flocken (f.op ~0.3) auch bei "Kräftig" blass.
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const flakeHTML = flakes.map((f) => {
    const op = isHigh
      ? Math.min(1, Math.max(f.op, 0.85)).toFixed(2)
      : (f.op * opacity).toFixed(2);
    return `<i class="snowflake" style="left:${f.l}vw; font-size:${f.s}px; --start-x:0px; --end-x:${f.ex}px; animation-duration:${f.dur}s; animation-delay:calc(-20s * ${f.d}); opacity:${op}; color:${color};">❄</i>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("snowflakes")}
    .snowflake { position:absolute; top:-10%; font-style:normal; animation:wander-fall linear infinite; will-change: transform; }
    @keyframes wander-fall {
      0%   { transform: translate(var(--start-x), -10%); }
      50%  { transform: translate(var(--end-x), 60vh); }
      100% { transform: translate(var(--end-x), 120vh); }
    }
    .snow-accumulation {
      position: absolute; bottom: 0; left: 0; width: 100%;
      border-top-left-radius: 40% 10px; border-top-right-radius: 40% 10px;
      transition: height 8s linear;
    }
  `;

  // Verbesserung (Idee 4: Schneehöhe simulieren): cfg._snowLevel (0-100) wird
  // von der Haupt-Karte per Timer langsam hochgezählt, solange Schnee aktiv
  // ist, und übersetzt sich hier in eine wachsende Schneedecke unten am
  // Bildschirmrand statt dass die Flocken einfach spurlos verschwinden.
  const snowLevel = typeof cfg._snowLevel === "number" ? cfg._snowLevel : 0;
  const accumHeight = Math.min(18, snowLevel * 0.18);
  const accumHtml = accumHeight > 0
    ? `<div class="snow-accumulation" aria-hidden="true" style="height:${accumHeight.toFixed(2)}vh; background:linear-gradient(180deg, rgba(255,255,255,0.92), rgba(230,238,245,0.8));"></div>`
    : "";

  return { css, html: `<div class="snowflakes" aria-hidden="true">${flakeHTML}${accumHtml}</div>` };
}

function renderLeaves(cfg, hass) {
  const leafColors = Array.isArray(cfg.leaf_colors) && cfg.leaf_colors.length === 3 ? cfg.leaf_colors : ["#c9a227", "#a83232", "#d9812c"];
  const count = getParticleCount(cfg.count_preset || "medium", "leaves");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  // Verbesserung (Sicherheit): benutzerdefinierte leaf_shape wird jetzt
  // durch die Whitelist geprüft. Fällt sie durch, greift automatisch die
  // sichere Standardform statt irgendwas Ungefiltertes zu rendern.
  const leafShape = sanitizeLeafShape(cfg.leaf_shape) || DEFAULT_LEAF_SHAPE;
  const leaves = spreadSample(FLAKES_DATA, count);

  // Verbesserung: bei "Kräftig" jedes Blatt auf einen hohen Mindestwert
  // anheben (gleiche Logik wie bei Schnee/Regen).
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const leafHTML = leaves.map((f, i) => {
    const op = isHigh
      ? Math.min(1, Math.max(f.op, 0.85)).toFixed(2)
      : (f.op * opacity).toFixed(2);
    const color = gradientColor(leafColors, i / leaves.length);
    const px = `${f.s * 1.6}px`;
    return `<i class="leaf" style="left:${f.l}vw; width:${px}; height:${px}; animation-duration:${f.dur}s; animation-delay:calc(-20s * ${f.d}); opacity:${op}; color:${color};"><svg viewBox="0 0 100 100" width="100%" height="100%">${leafShape}</svg></i>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("leaves")}
    .leaf { position:absolute; top:-10%; animation:leaf-fall linear infinite; will-change: transform; }
    @keyframes leaf-fall { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(120vh) rotate(360deg); } }
  `;
  return { css, html: `<div class="leaves" aria-hidden="true">${leafHTML}</div>` };
}

function renderBalloons(cfg, hass) {
  const count = getParticleCount(cfg.count_preset || "medium", "balloons");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const balloons = spreadSample(BALLOONS, count);

  const balloonHTML = balloons.map((b) => `
    <div class="balloon-wrapper" style="left:${b.l}vw; animation-duration:${b.dur}s; animation-delay:${b.d}s; opacity:${opacity};">
      <div class="balloon" style="width:${b.size}px; height:${(b.size * 1.6)}px; color:${b.color};">
        ${BALLOON_SVG}
      </div>
    </div>
  `).join("\n");

  const css = `
    ${overlayBaseCss("balloons-container")}
    .balloon-wrapper { position:absolute; bottom:-20%; animation:balloon-rise linear infinite; will-change: transform; }
    .balloon { display:flex; align-items:center; justify-content:center; }
    .balloon svg { width:100%; height:100%; filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.25)); }
    @keyframes balloon-rise { 0% { transform: translateY(10vh); } 100% { transform: translateY(-120vh); } }
  `;
  return { css, html: `<div class="balloons-container" aria-hidden="true">${balloonHTML}</div>` };
}

function renderLights(cfg, hass) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const bulbCount = getParticleCount(cfg.count_preset || "medium", "lights");
  const colors = ["#ff3333", "#33cc33", "#3399ff", "#ffff33", "#ff9933", "#cc33cc"];
  
  let bulbsHtml = "";
  for (let i = 0; i < bulbCount; i++) {
    const col = colors[i % colors.length];
    bulbsHtml += `<div class="bulb" style="background:${col}; animation-delay:${(i * 0.2).toFixed(1)}s;"></div>\n`;
  }

  const html = `<div class="lights-string" style="opacity:${opacity};" aria-hidden="true">${bulbsHtml}</div>`;
  const css = `
    .lights-string {
      position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100vw; height: 25px;
      pointer-events: none; z-index: 9999; display: flex; justify-content: space-around; padding: 0 10px; box-sizing: border-box;
    }
    .bulb {
      width: 10px; height: 14px; border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
      animation: bulb-blink 1.2s ease-in-out infinite alternate;
      will-change: opacity, transform;
    }
    @keyframes bulb-blink { 0% { opacity: 0.3; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1.1); } }
  `;
  return { css, html };
}

function renderShootingStars(cfg, hass) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const count = getParticleCount(cfg.count_preset || "medium", "shooting_stars");
  const color = resolveDynamicColor(cfg.color, hass, "#ffffff", "#ffffff");

  // Verbesserung (Performance): Positionen/Timing einmalig würfeln und
  // zwischenspeichern, damit ein Resize oder Theme-Wechsel nicht jedes Mal
  // ein neues Sternenmuster (= Flackern) erzeugt.
  const stars = getCachedRandomSet("shooting_stars", count, () => ({
    top: (Math.random() * 50).toFixed(2),
    left: (Math.random() * 100).toFixed(2),
    dur: (Math.random() * 3 + 2).toFixed(2),
    delay: (Math.random() * 5).toFixed(2),
  }));

  const starsHtml = stars.map((s) =>
    `<div class="shooting-star" style="top:${s.top}vh; left:${s.left}vw; animation-duration:${s.dur}s; animation-delay:${s.delay}s; color:${color};"></div>`
  ).join("\n");

  const html = `<div class="shooting-stars-container" style="opacity:${opacity};" aria-hidden="true">${starsHtml}</div>`;
  const css = `
    ${overlayBaseCss("shooting-stars-container")}
    .shooting-star {
      position: absolute; width: 100px; height: 2px;
      background: linear-gradient(90deg, currentColor, transparent);
      transform: rotate(-45deg); opacity: 0;
      animation: shooting-star-anim linear infinite;
      will-change: transform, opacity;
    }
    @keyframes shooting-star-anim {
      0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
      100% { transform: translateX(-300px) translateY(300px) rotate(-45deg); opacity: 0; }
    }
  `;
  return { css, html };
}

function renderLightning(cfg, hass) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const speedFactor = getParticleCount(cfg.count_preset || "medium", "lightning");
  const dur = (6 / speedFactor).toFixed(1);

  const html = `<div class="lightning-flash" style="opacity:${opacity}; animation-duration:${dur}s;" aria-hidden="true"></div>`;
  const css = `
    .lightning-flash {
      position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; background: rgba(255, 255, 255, 0.85);
      opacity: 0; animation: flash-anim ease-in-out infinite;
      will-change: opacity;
    }
    @keyframes flash-anim {
      0%, 90%, 100% { opacity: 0; }
      92% { opacity: 0.9; }
      93% { opacity: 0.1; }
      94% { opacity: 0.8; }
      96% { opacity: 0; }
    }
  `;
  return { css, html };
}

function renderFog(cfg, hass) {
  // Nebel bekommt genau wie die anderen Effekte eine Auto-Farbe: hell im
  // Lightmode (dezentes Grauweiß), heller/dichter im Darkmode.
  const color = resolveDynamicColor(cfg.color, hass, "#c7c7c7", "#e8e8e8");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const count = getParticleCount(cfg.count_preset || "medium", "fog");
  const isHigh = (cfg.opacity_preset || "medium") === "high";

  // Verbesserung (Performance): Positionen/Timing der Schwaden cachen,
  // damit ein Resize/Theme-Wechsel nicht bei jedem Re-Render neu würfelt.
  const banks = getCachedRandomSet("fog", count, () => ({
    top: (Math.random() * 80).toFixed(2),
    width: Math.floor(Math.random() * 40) + 60,
    height: Math.floor(Math.random() * 15) + 12,
    dur: (Math.random() * 20 + 25).toFixed(2),
    delay: (Math.random() * -20).toFixed(2),
    baseOp: (Math.random() * 0.3 + 0.3).toFixed(2),
    reverse: Math.random() > 0.5,
  }));

  const fogHTML = banks.map((b) => {
    // Bei "Kräftig" auch hier einen Mindestwert anheben, damit Nebel spürbar
    // dichter wirkt statt nur gedeckelt zu werden (gleiche Logik wie Regen/Schnee/Laub).
    const bankOp = isHigh ? Math.max(b.baseOp, 0.7) : (b.baseOp * opacity);
    const dir = b.reverse ? "fog-drift-reverse" : "fog-drift";
    return `<div class="fog-bank" style="top:${b.top}vh; width:${b.width}vw; height:${b.height}vh; animation-duration:${b.dur}s; animation-delay:${b.delay}s; animation-name:${dir}; opacity:${bankOp.toFixed(2)}; background:radial-gradient(ellipse at center, ${color} 0%, transparent 70%);"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("fog-container")}
    .fog-bank {
      position: absolute;
      left: -20vw;
      border-radius: 50%;
      filter: blur(18px);
      will-change: transform;
    }
    @keyframes fog-drift {
      0%   { transform: translateX(0); }
      100% { transform: translateX(140vw); }
    }
    @keyframes fog-drift-reverse {
      0%   { transform: translateX(140vw); }
      100% { transform: translateX(0); }
    }
  `;
  return { css, html: `<div class="fog-container" aria-hidden="true">${fogHTML}</div>` };
}

function renderHail(cfg, hass) {
  // Hagel: wie Regen, aber härtere, kleinere, schnellere Punkte statt Streifen.
  const color = resolveDynamicColor(cfg.color, hass, "#8fa3b3", "#e8eef2");
  const count = getParticleCount(cfg.count_preset || "medium", "hail");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const stones = spreadSample(DROPS, count);

  const hailHTML = stones.map((d) => {
    const op = isHigh
      ? Math.min(1, Math.max(d.op, 0.85)).toFixed(2)
      : (d.op * opacity).toFixed(2);
    const size = Math.max(3, Math.round(d.size / 3));
    // Hagel fällt schneller und härter als Regen (kürzere Animationsdauer).
    const dur = (parseFloat(d.dur) * 0.55).toFixed(2);
    return `<div class="hailstone" style="left:${d.l}vw; width:${size}px; height:${size}px; animation-duration:${dur}s; animation-delay:${d.d}s; opacity:${op}; background:${color};"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("hail")}
    .hail .hailstone {
      position: absolute; top: -10%; border-radius: 50%;
      box-shadow: 0 0 2px rgba(0,0,0,0.3);
      animation: hailfall linear infinite;
      will-change: transform;
    }
    @keyframes hailfall {
      0% { transform: translateY(0vh) translateX(0px); }
      100% { transform: translateY(120vh) translateX(-25px); }
    }
  `;
  return { css, html: `<div class="hail" aria-hidden="true">${hailHTML}</div>` };
}

function renderStorm(cfg, hass) {
  // Sturm/Windböen: Partikel schießen schräg und schnell durchs Bild,
  // statt gerade nach unten zu fallen wie bei Regen/Schnee.
  const color = resolveDynamicColor(cfg.color, hass, "#556270", "#c8d2da");
  const count = getParticleCount(cfg.count_preset || "medium", "storm");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const gusts = spreadSample(DROPS, count);

  const gustHTML = gusts.map((d) => {
    const op = isHigh
      ? Math.min(1, Math.max(d.op, 0.85)).toFixed(2)
      : (d.op * opacity).toFixed(2);
    const dur = (parseFloat(d.dur) * 0.6).toFixed(2);
    const len = Math.max(20, d.size * 2);
    return `<div class="storm-streak" style="top:${d.l}vh; width:${len}px; animation-duration:${dur}s; animation-delay:${d.d}s; opacity:${op}; background:linear-gradient(90deg, transparent, ${color});"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("storm-container")}
    .storm-streak {
      position: absolute; left: -20vw; height: 2px;
      animation: storm-gust linear infinite;
      will-change: transform;
    }
    @keyframes storm-gust {
      0%   { transform: translateX(0) translateY(0); }
      100% { transform: translateX(140vw) translateY(6vh); }
    }
  `;
  return { css, html: `<div class="storm-container" aria-hidden="true">${gustHTML}</div>` };
}


function renderSanta(cfg, hass) {
  // Optik: komplett neu als sauberes, einfarbiges Silhouetten-Design (wie
  // Regen/Schnee/Nebel) statt bunter Detail-Illustration - dadurch auch
  // wieder mit Farbmodus (Auto/Manuell) nutzbar. Das Rentier wird nur EINMAL
  // gezeichnet und per <use> zweimal eingesetzt - garantiert identisch/
  // symmetrisch, statt zwei von Hand leicht unterschiedliche Kopien.
  const color = resolveDynamicColor(cfg.color, hass, "#2a1e14", "#fbe9c8");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;

  const css = `
    .santa-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
      color: ${color};
    }
    .santa-sleigh-box {
      position: absolute; top: 8vh; right: -250px; width: 220px; height: 60px;
      animation: santa-fly ${interval}s linear infinite;
      will-change: transform;
    }
    @keyframes santa-fly {
      0% { transform: translateX(0) translateY(0); }
      3% { transform: translateX(calc(-100vw - 300px)) translateY(15px); }
      4% { transform: translateX(calc(-100vw - 300px)) translateY(-20px); }
      100% { transform: translateX(calc(-100vw - 300px)) translateY(-20px); }
    }
  `;

  const html = `
    <div class="santa-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <div class="santa-sleigh-box">
        <svg viewBox="0 0 320 70" preserveAspectRatio="xMidYMid meet" fill="currentColor" stroke="currentColor">
          <defs>
            <!-- Rentier blickt nach links (= Flugrichtung), Beine im Lauf-/Sprung-Schritt -->
            <g id="santa-reindeer">
              <ellipse cx="35" cy="28" rx="17" ry="9"/>
              <path d="M20,24 Q10,18 8,14" fill="none" stroke-width="7" stroke-linecap="round"/>
              <ellipse cx="8" cy="14" rx="7" ry="6"/>
              <circle cx="2" cy="16" r="2.5"/>
              <path d="M8,9 L4,-3 M4,-3 L0,-7 M4,-3 L2,1 M8,9 L13,-4 M13,-4 L17,-8 M13,-4 L15,0"
                    fill="none" stroke-width="2" stroke-linecap="round"/>
              <path d="M22,35 Q16,44 12,50 M28,36 Q24,44 20,50 M46,36 Q54,42 58,50 M40,36 Q46,44 50,50"
                    fill="none" stroke-width="3" stroke-linecap="round"/>
              <path d="M52,24 Q57,20 55,27" fill="none" stroke-width="2" stroke-linecap="round"/>
            </g>
          </defs>
          <use href="#santa-reindeer"/>
          <use href="#santa-reindeer" transform="translate(68,0)"/>
          <path d="M60,18 Q100,22 148,26 M128,18 Q140,22 148,26" fill="none" stroke-width="1" opacity="0.6"/>
          <!-- Schlitten: Kufe schwingt vorn (links, in Zugrichtung) nach oben -->
          <path d="M148,44 Q142,30 154,20 Q162,13 172,13 L212,13 Q224,13 224,25 L224,37 Q224,44 214,44 Z"/>
          <!-- Weihnachtsmann sitzt vorn am Zügel -->
          <circle cx="178" cy="24" r="10"/>
          <circle cx="178" cy="9" r="7"/>
          <path d="M171,4 Q178,-8 189,-1 Q191,1 187,3 Q180,1 171,4 Z"/>
          <circle cx="188" cy="-2" r="2.3"/>
</svg>
</div>
</div>
`;

  return { css, html };
}

// Verbesserung (Optik): das Netz wird mathematisch berechnet (Speichen +
// konzentrische Ringe von einer Ecke aus), statt mit freihändig geschätzten
// Bezier-Pfaden - das ergibt ein garantiert symmetrisches, sauberes Netz.
function buildCornerWebSvg(spokeCount, ringCount) {
  const cx = 100, cy = 0, radius = 100;
  const angles = [];
  for (let i = 0; i < spokeCount; i++) {
    angles.push(90 + (i * (90 / (spokeCount - 1))));
  }
  const toPoint = (angleDeg, r) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: (cx + r * Math.cos(rad)).toFixed(1), y: (cy + r * Math.sin(rad)).toFixed(1) };
  };

  let spokesD = "";
  angles.forEach((a) => {
    const p = toPoint(a, radius);
    spokesD += `M ${cx} ${cy} L ${p.x} ${p.y} `;
  });

  let ringsSvg = "";
  for (let ring = 1; ring <= ringCount; ring++) {
    const frac = ring / (ringCount + 1);
    const pts = angles.map((a) => toPoint(a, radius * frac));
    let d = `M ${pts[0].x} ${pts[0].y} `;
    for (let i = 1; i < pts.length; i++) d += `L ${pts[i].x} ${pts[i].y} `;
    ringsSvg += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="0.6" opacity="${(0.35 + ring * 0.1).toFixed(2)}"/>`;
  }

  return `<path d="${spokesD}" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.7"/>${ringsSvg}`;
}

function renderSpider(cfg, hass) {
  // Optik: Netz in der Ecke + Spinne, die an einem Faden auf und ab seilt.
  // Farbmodus bleibt aktiv (Netz/Faden passen sich Hell/Dunkel an), Kräftig
  // hebt die Deckkraft wie bei den anderen Effekten auf volle 100% an. Die
  // Augen bleiben bewusst immer leuchtend rot, unabhängig vom Theme.
  const webColor = resolveDynamicColor(cfg.color, hass, "#4a4a4a", "#e5e5e5");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const webSvg = buildCornerWebSvg(6, 4);

  const css = `
    .spider-web-container {
      position: fixed; top: 0; right: 0; width: 300px; height: 300px;
      pointer-events: none; z-index: 9999; overflow: visible;
      color: ${webColor};
    }
    .corner-web {
      position: absolute; top: 0; right: 0; width: 180px; height: 180px;
      filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));
    }
    .hanging-spider-box {
      position: absolute; top: 40px; right: 50px; width: 26px; height: 26px;
      animation: spider-drop 14s ease-in-out infinite;
      will-change: transform;
    }
    .spider-web-thread {
      position: absolute; top: -300px; left: 50%; width: 1px; height: 300px;
      background: ${webColor}; transform: translateX(-50%);
    }
    @keyframes spider-drop {
      0%, 100% { transform: translateY(0); }
      35%, 65% { transform: translateY(180px); }
      45%, 55% { transform: translateY(170px); }
    }
  `;

  // Verbesserung (Optik): 8 Beine statt 6, per <use> perfekt gespiegelt
  // (rechte Seite einmal gezeichnet, linke Seite ist eine exakte Kopie) -
  // das sieht deutlich symmetrischer/sauberer aus als von Hand geschätzte
  // Pfade auf beiden Seiten einzeln.
  const html = `
    <div class="spider-web-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg class="corner-web" viewBox="0 0 100 100">${webSvg}</svg>
      <div class="hanging-spider-box">
        <div class="spider-web-thread"></div>
        <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
          <defs>
            <g id="spider-legs-right">
              <path d="M58,42 Q75,32 88,18" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
              <path d="M58,50 Q80,47 94,42" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
              <path d="M58,58 Q80,62 92,74" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
              <path d="M56,65 Q70,78 76,92" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
            </g>
          </defs>
          <use href="#spider-legs-right"/>
          <use href="#spider-legs-right" transform="translate(100,0) scale(-1,1)"/>
          <circle cx="50" cy="40" r="10" fill="#111"/>
          <ellipse cx="50" cy="62" rx="15" ry="19" fill="#111"/>
          <circle cx="45" cy="35" r="2.5" fill="#ff0000" style="filter: drop-shadow(0 0 3px #ff2222);"/>
          <circle cx="55" cy="35" r="2.5" fill="#ff0000" style="filter: drop-shadow(0 0 3px #ff2222);"/>
        </svg>
      </div>
    </div>
  `;

  return { css, html };
}

function renderStars(cfg, hass) {
  // Sternenhimmel: funkelnde Punkte, Farbe passt sich Hell/Dunkel an (warmes
  // Gold im Lightmode, kühles Weiß im Darkmode) - genau wie bei den anderen
  // Auto-Farbe-Effekten. Läuft automatisch bei "klarer Nachthimmel".
  const color = resolveDynamicColor(cfg.color, hass, "#1a1a2e", "#ffffff");
  const count = getParticleCount(cfg.count_preset || "medium", "stars");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";

  const stars = getCachedRandomSet("stars", count, () => ({
    top: (Math.random() * 85).toFixed(2),
    left: (Math.random() * 100).toFixed(2),
    size: (Math.random() * 2 + 1).toFixed(2),
    dur: (Math.random() * 3 + 2).toFixed(2),
    delay: (Math.random() * -5).toFixed(2),
    baseOp: (Math.random() * 0.5 + 0.4).toFixed(2),
  }));

  const starHTML = stars.map((s) => {
    const peak = isHigh
      ? Math.max(parseFloat(s.baseOp), 0.9)
      : (parseFloat(s.baseOp) * opacity);
    // Verbesserung: Glow-Radius richtet sich nach der Sterngröße (schöneres
    // Funkeln), statt bei jedem Stern gleich stark zu leuchten.
    const glow = (parseFloat(s.size) * 2).toFixed(2);
    return `<div class="star" style="top:${s.top}vh; left:${s.left}vw; width:${s.size}px; height:${s.size}px; background:${color}; box-shadow: 0 0 ${glow}px ${color}; animation-duration:${s.dur}s; animation-delay:${s.delay}s; --peak:${peak.toFixed(2)};"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("stars-container")}
    .star {
      position: absolute; border-radius: 50%;
      animation: star-twinkle ease-in-out infinite alternate;
      will-change: opacity, transform;
    }
    @keyframes star-twinkle {
      0% { opacity: calc(var(--peak) * 0.25); transform: scale(0.8); }
      100% { opacity: var(--peak); transform: scale(1.2); }
    }
  `;
  return { css, html: `<div class="stars-container" aria-hidden="true">${starHTML}</div>` };
}

const RENDERERS = {
  rain: renderRain,
  snow: renderSnow,
  leaves: renderLeaves,
  balloons: renderBalloons,
  lights: renderLights,
  shooting_stars: renderShootingStars,
  lightning: renderLightning,
  fog: renderFog,
  hail: renderHail,
  storm: renderStorm,
  santa: renderSanta,
  spider: renderSpider,
  stars: renderStars,
};

/* ============================== HAUPT-KARTE ============================== */

class WeatherEventOverlayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onThemeChange = this._onThemeChange.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._snowLevel = 0;
    this._snowTimer = null;
  }

  connectedCallback() {
    window.addEventListener("set-theme", this._onThemeChange);
    window.addEventListener("resize", this._onThemeChange);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", this._onThemeChange);
    document.addEventListener("visibilitychange", this._onVisibilityChange);
  }

  disconnectedCallback() {
    window.removeEventListener("set-theme", this._onThemeChange);
    window.removeEventListener("resize", this._onThemeChange);
    window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", this._onThemeChange);
    document.removeEventListener("visibilitychange", this._onVisibilityChange);
    if (this._snowTimer) {
      clearInterval(this._snowTimer);
      this._snowTimer = null;
    }
  }

  _onThemeChange() {
    this._render();
  }

  // Verbesserung (Performance/Akku): pausiert alle CSS-Animationen, sobald
  // das Browser-Tab im Hintergrund ist (Tablet an der Wand, Handy gesperrt
  // etc.) - spart unnötig laufende Animationen, die eh keiner sieht.
  _onVisibilityChange() {
    if (!this.shadowRoot) return;
    const hidden = document.hidden;
    this.shadowRoot.host.style.setProperty(
      "--overlay-animation-play-state",
      hidden ? "paused" : "running"
    );
    let pauseStyle = this.shadowRoot.getElementById("pause-style");
    if (!pauseStyle) {
      pauseStyle = document.createElement("style");
      pauseStyle.id = "pause-style";
      this.shadowRoot.appendChild(pauseStyle);
    }
    pauseStyle.textContent = hidden ? "* { animation-play-state: paused !important; }" : "";
  }

  setConfig(config) {
    this._config = {
      event: "off",
      count_preset: "medium",
      opacity_preset: "medium",
      color: "auto",
      color_mode: "auto",
      leaf_colors: ["#c9a227", "#a83232", "#d9812c"],
      weather_entity: "",
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    const oldTheme = this._hass?.themes?.darkMode;
    const weatherEntity = this._config?.weather_entity;
    const oldWeatherState = weatherEntity ? this._hass?.states?.[weatherEntity]?.state : undefined;
    this._hass = hass;
    const newWeatherState = weatherEntity ? hass?.states?.[weatherEntity]?.state : undefined;

    if (
      !this._hasRenderedOnce ||
      (oldTheme !== undefined && oldTheme !== hass?.themes?.darkMode) ||
      oldWeatherState !== newWeatherState
    ) {
      this._render();
      this._hasRenderedOnce = true;
    }
  }

  // Verbesserung (optionale Wetter-Automatik): "weather_auto" ist ein
  // eigener Eintrag im Event-Dropdown statt eines separaten Schalters -
  // so gibt's nur eine Stelle, die entscheidet, kein Widerspruchspotenzial.
  // Gibt IMMER ein Array zurück, da manche Wetterzustände (Schneeregen,
  // Gewitter mit Regen) zwei Effekte gleichzeitig auslösen.
  _resolveEvents() {
    const cfg = this._config || {};
    if (cfg.event === "weather_auto") {
      if (cfg.weather_entity && this._hass) {
        const entityState = this._hass.states?.[cfg.weather_entity];
        if (entityState) {
          return mapWeatherStateToEvents(entityState.state);
        }
      }
      return ["off"];
    }
    return [cfg.event || "off"];
  }

  getCardSize() { return 0; }

  static getStubConfig() {
    return { event: "lightning", count_preset: "medium", opacity_preset: "medium", color: "auto" };
  }

  static getConfigElement() {
    return document.createElement("weather-event-overlay-card-editor");
  }

  // Verbesserung (Schneehöhe simulieren): solange Schnee (manuell,
  // automatisch, oder als Teil einer Kombination wie Schneeregen) läuft,
  // wächst die Schneedecke langsam an. Läuft kein Schnee mehr, wird die
  // Ansammlung wieder zurückgesetzt.
  _updateSnowAccumulation(events) {
    const snowActive = events.includes("snow");
    if (snowActive) {
      if (!this._snowTimer) {
        this._snowTimer = setInterval(() => {
          this._snowLevel = Math.min(100, this._snowLevel + 1);
          this._render();
        }, 15000);
      }
    } else {
      if (this._snowTimer) {
        clearInterval(this._snowTimer);
        this._snowTimer = null;
      }
      this._snowLevel = 0;
    }
  }

  _render() {
    if (!this._config) return;
    const events = this._resolveEvents();
    const baseStyle = `:host { display: block; position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: visible; pointer-events: none; background: none !important; }`;

    this._updateSnowAccumulation(events);

    // Verbesserung: mehrere gleichzeitige Effekte (z. B. Schnee+Regen bei
    // Schneeregen, Blitz+Regen bei Gewitter mit Regen) werden einfach
    // nacheinander gerendert und ihr CSS/HTML zusammengehängt - jeder
    // Effekt-Container hat eigene, eindeutige CSS-Klassen, es gibt also
    // keine Überschneidungen.
    let combinedCss = "";
    let combinedHtml = "";
    for (const event of events) {
      const renderer = RENDERERS[event];
      if (!renderer) continue;
      const cfgForRender = event === "snow" ? { ...this._config, _snowLevel: this._snowLevel } : this._config;
      const { css, html } = renderer(cfgForRender, this._hass);
      combinedCss += css;
      combinedHtml += html;
    }

    this.shadowRoot.innerHTML = `<style>${baseStyle}${combinedCss}</style>${combinedHtml}`;
    // Pause-Status neu anwenden, da innerHTML gerade komplett ersetzt wurde
    // (und damit auch ein zuvor gesetzter Pause-<style> verloren ging).
    this._onVisibilityChange();
  }
}

/* ============================== VISUELLER EDITOR ============================== */

class WeatherEventOverlayCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = {
      event: "off",
      count_preset: "medium",
      opacity_preset: "medium",
      color: "auto",
      color_mode: "auto",
      leaf_colors: ["#c9a227", "#a83232", "#d9812c"],
      weather_entity: "",
      ...config,
    };
    if (this._suppressNextRender) {
      this._suppressNextRender = false;
      return;
    }
    this._render();
  }

  set hass(hass) {
    // Verbesserung (Bugfix): vorher wurde bei JEDEM Home-Assistant-Update
    // (mehrmals pro Sekunde) komplett neu gerendert - dadurch klappte ein
    // gerade geöffnetes Dropdown sofort wieder zu, bevor man auswählen
    // konnte. Jetzt wird nur neu gerendert, wenn sich die Liste der
    // verfügbaren weather.*-Entities tatsächlich verändert hat (z. B. beim
    // allerersten Laden) - normale State-Updates lösen kein Re-Render aus.
    const oldKey = this._weatherEntityListKey || "";
    const newEntities = hass && hass.states
      ? Object.keys(hass.states).filter((eid) => eid.startsWith("weather."))
      : [];
    const newKey = newEntities.sort().join(",");
    this._hass = hass;

    if (newKey !== oldKey) {
      this._weatherEntityListKey = newKey;
      this._render();
    }
  }
  connectedCallback() { this._render(); }

  _row(labelText, inputHTML, hint) {
    const hintHtml = hint
      ? `<div style="font-size:11px; opacity:0.65; margin-top:3px; line-height:1.4;">${hint}</div>`
      : "";
    return `<div style="padding:8px 0;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <label style="flex:1; color:var(--primary-text-color, #222);">${labelText}</label>
        <div style="flex:1;">${inputHTML}</div>
      </div>
      ${hintHtml}
    </div>`;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    const colorMode = c.color_mode || (c.color === "auto" ? "auto" : "custom");
    const caps = EVENT_CAPABILITIES[c.event] || { count: false, opacity: false, color: false };
    const isWeatherAuto = c.event === "weather_auto";

    // Verbesserung: alle weather.*-Entities aus HA einlesen und als echtes
    // Dropdown anbieten, statt dass man die Entity-ID von Hand eintippen muss.
    const weatherEntities = this._hass && this._hass.states
      ? Object.keys(this._hass.states).filter((eid) => eid.startsWith("weather."))
      : [];

    this.innerHTML = `
      <div style="padding:8px 16px;">
        ${this._row("Effekt", `
          <select id="event" style="width:100%; padding:6px;">
            <option value="off" ${c.event === "off" ? "selected" : ""}>Aus</option>
            <option value="weather_auto" ${isWeatherAuto ? "selected" : ""}>🌦️ Automatisch (nach Wetter)</option>
            <option value="rain" ${c.event === "rain" ? "selected" : ""}>🌧️ Regen</option>
            <option value="snow" ${c.event === "snow" ? "selected" : ""}>❄️ Schnee</option>
            <option value="hail" ${c.event === "hail" ? "selected" : ""}>🧊 Hagel</option>
            <option value="lightning" ${c.event === "lightning" ? "selected" : ""}>⚡ Blitz</option>
            <option value="fog" ${c.event === "fog" ? "selected" : ""}>🌫️ Nebel</option>
            <option value="storm" ${c.event === "storm" ? "selected" : ""}>💨 Sturm</option>
            <option value="leaves" ${c.event === "leaves" ? "selected" : ""}>🍂 Laub</option>
            <option value="shooting_stars" ${c.event === "shooting_stars" ? "selected" : ""}>🌠 Sternschnuppen</option>
            <option value="stars" ${c.event === "stars" ? "selected" : ""}>✨ Sternenhimmel</option>
            <option value="balloons" ${c.event === "balloons" ? "selected" : ""}>🎈 Luftballons</option>
            <option value="lights" ${c.event === "lights" ? "selected" : ""}>💡 Lichterkette</option>
            <option value="santa" ${c.event === "santa" ? "selected" : ""}>🎅 Weihnachtsmann</option>
            <option value="spider" ${c.event === "spider" ? "selected" : ""}>🕷️ Spinne mit Netz</option>
          </select>
        `, isWeatherAuto
          ? "Bei 'Automatisch' entscheidet der Zustand deiner Wetter-Entity unten, welcher Effekt läuft: 🌧️ Regen, ❄️ Schnee, 🧊 Hagel, ⚡ Blitz, 🌫️ Nebel oder 💨 Sturm - bei Sonne/Wolken/klarem Himmel läuft kein Effekt."
          : "Welcher Effekt manuell dauerhaft angezeigt wird."
        )}

        ${isWeatherAuto ? (
          weatherEntities.length > 0
            ? this._row("Wetter-Sensor", `
                <select id="weather_entity" style="width:100%; padding:6px;">
                  <option value="" ${!c.weather_entity ? "selected" : ""}>-- bitte wählen --</option>
                  ${weatherEntities.map((eid) => {
                    const friendly = this._hass.states[eid]?.attributes?.friendly_name || eid;
                    return `<option value="${eid}" ${c.weather_entity === eid ? "selected" : ""}>${friendly}</option>`;
                  }).join("")}
                </select>
              `, "Diese Wetter-Entity liefert den aktuellen Zustand (regnet, schneit, ...), nach dem sich der Effekt oben richtet.")
            : this._row("Wetter-Sensor", `<input id="weather_entity" type="text" placeholder="weather.home" value="${c.weather_entity || ""}" style="width:100%; padding:6px; box-sizing:border-box;" />`, "Keine weather-Entity in HA gefunden - trag die Entity-ID hier manuell ein, z. B. weather.home.")
        ) : ""}


        ${caps.count ? this._row("Anzahl / Frequenz", `
          <select id="count_preset" style="width:100%; padding:6px;">
            <option value="low" ${c.count_preset === "low" ? "selected" : ""}>🔹 Wenig / Selten</option>
            <option value="medium" ${c.count_preset === "medium" ? "selected" : ""}>🔷 Mittel</option>
            <option value="high" ${c.count_preset === "high" ? "selected" : ""}>🔷 Viel / Häufig</option>
          </select>
        `, isWeatherAuto
          ? "⚠️ Ein Wert für ALLE automatisch erkannten Effekte gemeinsam (Regen, Schnee, Hagel, Blitz, Nebel, Sturm) - nicht einzeln pro Effekt einstellbar."
          : (c.event === "santa"
              ? "Wie oft der Weihnachtsmann vorbeifliegt: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min."
              : "Wie viele Partikel gleichzeitig zu sehen sind."
            )
        ) : ""}

        ${caps.opacity ? this._row("Deckkraft / Helligkeit", `
          <select id="opacity_preset" style="width:100%; padding:6px;">
            <option value="low" ${c.opacity_preset === "low" ? "selected" : ""}>👻 Zart (30%)</option>
            <option value="medium" ${c.opacity_preset === "medium" ? "selected" : ""}>👁️ Dezent (60%)</option>
            <option value="high" ${c.opacity_preset === "high" ? "selected" : ""}>✨ Kräftig (100%)</option>
          </select>
        `, isWeatherAuto
          ? "⚠️ Ebenfalls EIN Wert für ALLE automatisch erkannten Effekte gemeinsam."
          : "Wie stark/deutlich der Effekt sichtbar ist."
        ) : ""}

        ${caps.color ? this._row("Farbmodus", `
          <select id="color_mode" style="width:100%; padding:6px;">
            <option value="auto" ${colorMode === "auto" ? "selected" : ""}>🌗 Auto (Hell/Dunkel Modus)</option>
            <option value="custom" ${colorMode === "custom" ? "selected" : ""}>🎨 Manuelle Farbe</option>
          </select>
        `, isWeatherAuto
          ? "Gilt nur, wenn gerade Regen, Schnee, Hagel, Nebel oder Sturm aktiv ist (nicht bei Blitz - der hat immer weißes Licht)."
          : "Farbe automatisch nach Hell/Dunkel-Modus wählen oder selbst festlegen."
        ) : ""}

        ${caps.color && colorMode === "custom" ? `
        <div id="custom_color_picker">
          ${this._row("Farbe", `<input id="color" type="color" value="${c.color === "auto" ? "#ffffff" : c.color}" style="width:100%; height:36px;" />`)}
        </div>` : ""}
      </div>
    `;

    this.querySelector("#event").addEventListener("change", (e) => this._update("event", e.target.value, true));

    const weatherEntitySel = this.querySelector("#weather_entity");
    if (weatherEntitySel) {
      weatherEntitySel.addEventListener("change", (e) => this._update("weather_entity", e.target.value.trim(), false));
    }

    const countSel = this.querySelector("#count_preset");
    if (countSel) countSel.addEventListener("change", (e) => this._update("count_preset", e.target.value, true));

    const opacitySel = this.querySelector("#opacity_preset");
    if (opacitySel) opacitySel.addEventListener("change", (e) => this._update("opacity_preset", e.target.value, true));

    const colorModeSel = this.querySelector("#color_mode");
    if (colorModeSel) {
      colorModeSel.addEventListener("change", (e) => {
        const mode = e.target.value;
        if (mode === "auto") {
          this._updateConfig({ color_mode: "auto", color: "auto" }, true);
        } else {
          this._updateConfig({ color_mode: "custom", color: "#ffffff" }, true);
        }
      });
    }

    const colorPicker = this.querySelector("#color");
    if (colorPicker) {
      colorPicker.addEventListener("change", (e) => this._update("color", e.target.value, true));
    }
  }

  _update(key, value, rerender) {
    this._suppressNextRender = !rerender;
    this._config = { ...this._config, [key]: value };
    fireEvent(this, "config-changed", { config: this._config });
    if (rerender) this._render();
  }

  _updateConfig(newValues, rerender) {
    this._suppressNextRender = !rerender;
    this._config = { ...this._config, ...newValues };
    fireEvent(this, "config-changed", { config: this._config });
    if (rerender) this._render();
  }
}

/* ============================== REGISTRIERUNG ============================== */

// Verbesserung (Robustheit): Schutz gegen "already defined"-Fehler,
// falls HA/HACS die Ressource mal doppelt nachlädt (z. B. nach einem Update).
if (!customElements.get("weather-event-overlay-card")) {
  customElements.define("weather-event-overlay-card", WeatherEventOverlayCard);
}
if (!customElements.get("weather-event-overlay-card-editor")) {
  customElements.define("weather-event-overlay-card-editor", WeatherEventOverlayCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weather-event-overlay-card",
  name: "Wetter & Event Overlay Card",
  description: "Erweiterte Wetter- und Event-Overlay-Karte (Regen, Schnee, Blitze, Sterne, Ballons etc.) mit GUI-Editor.",
  preview: false,
});
