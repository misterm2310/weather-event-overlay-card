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
// HA weather-Entity (z. B. weather.home) automatisch in einen Karten-Effekt.
// Regnet's laut Home Assistant -> Regen an. Kein passender Effekt -> "off".
const WEATHER_STATE_MAP = {
  "rainy": "rain",
  "pouring": "rain",
  "snowy": "snow",
  "snowy-rainy": "snow",
  "hail": "hail",
  "lightning": "lightning",
  "lightning-rainy": "lightning",
  "fog": "fog",
  "windy": "storm",
  "windy-variant": "storm",
};

function mapWeatherStateToEvent(state) {
  return WEATHER_STATE_MAP[state] || "off";
}

// Verbesserung (GUI-Editor): Tabelle, welcher Effekt welche Regler
// tatsächlich benutzt. Der Editor blendet Anzahl/Deckkraft/Farbmodus nur
// ein, wenn der gewählte Effekt sie auch wirklich verwendet.
const EVENT_CAPABILITIES = {
  off: { count: false, opacity: false, color: false, sound: false },
  // Automatik kann auf Regen/Schnee/Hagel/Nebel/Sturm (alle mit Farbe) oder
  // Blitz (ohne Farbe) münden. Anzahl/Deckkraft wirken bei allen sechs,
  // deshalb bleiben sie im Editor sichtbar - nur der Event-Typ wird ersetzt.
  // Sound ist nur bei Regen/Sturm/Blitz hörbar, Toggle bleibt aber sichtbar,
  // falls die Automatik gerade auf einen der drei landet.
  weather_auto: { count: true, opacity: true, color: true, sound: true },
  rain: { count: true, opacity: true, color: true, sound: true },
  snow: { count: true, opacity: true, color: true, sound: false },
  hail: { count: true, opacity: true, color: true, sound: false },
  lightning: { count: true, opacity: true, color: false, sound: true },
  fog: { count: true, opacity: true, color: true, sound: false },
  storm: { count: true, opacity: true, color: true, sound: true },
  leaves: { count: true, opacity: true, color: false, sound: false },
  shooting_stars: { count: true, opacity: true, color: true, sound: false },
  balloons: { count: true, opacity: true, color: false, sound: false },
  lights: { count: true, opacity: true, color: false, sound: false },
};

// Verbesserung (Idee 1: Intensität nach echten Wetterdaten): manche HA
// Wetter-Integrationen liefern eine Niederschlagsmenge in mm über das
// Attribut "precipitation". Wird das gefunden, übersetzen wir es in einen
// unserer drei Presets - grobe Anlehnung an gängige Meteorologie-Schwellen.
function getIntensityFromWeatherEntity(entityState) {
  if (!entityState || !entityState.attributes) return null;
  const precip = entityState.attributes.precipitation;
  if (typeof precip !== "number" || Number.isNaN(precip)) return null;
  if (precip <= 0.5) return "low";
  if (precip <= 4) return "medium";
  return "high";
}

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
};

/* ============================ SOUND-ENGINE ============================ */

// Verbesserung (Idee 3: optionaler Sound): erzeugt Regen-/Wind-/Donner-Klänge
// direkt per Web Audio API aus weißem Rauschen - keine externen mp3-Dateien
// nötig, die separat gehostet oder mitgeliefert werden müssten.
class OverlaySoundEngine {
  constructor() {
    this._ctx = null;
    this._current = null;
    this._unlockAttached = false;
  }

  _ensureContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!this._ctx) {
      this._ctx = new AC();
    }
    if (this._ctx.state === "suspended") {
      this._ctx.resume().catch(() => {});
      // Viele Browser starten Audio erst nach der ersten Nutzer-Interaktion.
      // Einmaliger Klick/Touch irgendwo auf der Seite "entsperrt" den Ton.
      if (!this._unlockAttached) {
        this._unlockAttached = true;
        const unlock = () => { this._ctx && this._ctx.resume().catch(() => {}); };
        document.addEventListener("click", unlock, { once: true });
        document.addEventListener("touchstart", unlock, { once: true });
      }
    }
    return this._ctx;
  }

  _makeNoiseBuffer(ctx, seconds) {
    const bufferSize = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  play(type, volume) {
    const ctx = this._ensureContext();
    if (!ctx) return;

    if (this._current && this._current.type === type) {
      // Läuft schon - nur sanft auf die neue Lautstärke einregeln.
      if (this._current.gain) this._current.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.5);
      return;
    }
    this.stop();

    if (type === "rain") {
      const source = ctx.createBufferSource();
      source.buffer = this._makeNoiseBuffer(ctx, 2);
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 900;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      this._current = { type, gain, stopFn: () => { try { source.stop(); } catch (e) {} } };
    } else if (type === "storm") {
      const source = ctx.createBufferSource();
      source.buffer = this._makeNoiseBuffer(ctx, 3);
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 400;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      // Sanftes Auf-und-Ab der Lautstärke simuliert Windböen.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = volume * 0.5;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      this._current = { type, gain, stopFn: () => { try { source.stop(); lfo.stop(); } catch (e) {} } };
    } else if (type === "lightning") {
      // Kein Dauer-Loop, sondern zufällige Donner-Bursts im Abstand von 4-14s.
      this._current = { type, gain: null, thunderTimer: null, stopFn: () => {} };
      const scheduleThunder = () => {
        const delay = 4000 + Math.random() * 10000;
        this._current.thunderTimer = setTimeout(() => {
          if (!this._current || this._current.type !== "lightning") return;
          this._playThunderBurst(ctx, volume);
          scheduleThunder();
        }, delay);
      };
      scheduleThunder();
      this._current.stopFn = () => { if (this._current.thunderTimer) clearTimeout(this._current.thunderTimer); };
    }
  }

  _playThunderBurst(ctx, volume) {
    const source = ctx.createBufferSource();
    source.buffer = this._makeNoiseBuffer(ctx, 1.5);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 150;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 1.8, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    source.stop(now + 1.6);
  }

  stop() {
    if (this._current) {
      try { this._current.stopFn && this._current.stopFn(); } catch (e) {}
      this._current = null;
    }
  }
}

function getSoundVolume(preset) {
  switch (preset) {
    case "low": return 0.08;
    case "high": return 0.22;
    case "medium": default: return 0.14;
  }
}

/* ============================== HAUPT-KARTE ============================== */

class WeatherEventOverlayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onThemeChange = this._onThemeChange.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._soundEngine = new OverlaySoundEngine();
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
    this._soundEngine.stop();
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
      weather_intensity_auto: false,
      sound_enabled: false,
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
  _resolveEvent() {
    const cfg = this._config || {};
    if (cfg.event === "weather_auto") {
      if (cfg.weather_entity && this._hass) {
        const entityState = this._hass.states?.[cfg.weather_entity];
        if (entityState) {
          return mapWeatherStateToEvent(entityState.state);
        }
      }
      return "off";
    }
    return cfg.event || "off";
  }

  // Verbesserung (Idee 1: Intensität nach echten Wetterdaten): ist die
  // Automatik aktiv UND der Schalter "Intensität aus Wetterdaten" an UND
  // liefert die Entity ein "precipitation"-Attribut, ersetzt das den
  // manuell gewählten Anzahl/Deckkraft-Wert. Sonst bleibt alles wie gehabt.
  _resolveEffectiveConfig() {
    const cfg = this._config || {};
    if (cfg.event === "weather_auto" && cfg.weather_intensity_auto && cfg.weather_entity && this._hass) {
      const entityState = this._hass.states?.[cfg.weather_entity];
      const level = getIntensityFromWeatherEntity(entityState);
      if (level) {
        return { ...cfg, count_preset: level, opacity_preset: level };
      }
    }
    return cfg;
  }

  getCardSize() { return 0; }

  static getStubConfig() {
    return { event: "lightning", count_preset: "medium", opacity_preset: "medium", color: "auto" };
  }

  static getConfigElement() {
    return document.createElement("weather-event-overlay-card-editor");
  }

  // Verbesserung (Idee 3: Sound): startet/stoppt den passenden Klang je
  // nach aktuell sichtbarem Effekt. Läuft bereits der richtige Sound,
  // passiert nichts (kein Neustart/Knacksen bei jedem Re-Render).
  _updateSound(event, cfg) {
    const caps = EVENT_CAPABILITIES[event] || { sound: false };
    if (!cfg.sound_enabled || !caps.sound || !["rain", "storm", "lightning"].includes(event)) {
      this._soundEngine.stop();
      return;
    }
    this._soundEngine.play(event, getSoundVolume(cfg.opacity_preset || "medium"));
  }

  // Verbesserung (Idee 4: Schneehöhe simulieren): solange Schnee (manuell
  // oder automatisch) läuft, wächst die Schneedecke langsam an. Wechselt der
  // Effekt weg von Schnee, wird die Ansammlung wieder zurückgesetzt.
  _updateSnowAccumulation(event) {
    if (event === "snow") {
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
    const event = this._resolveEvent();
    const renderer = RENDERERS[event];
    const baseStyle = `:host { display: block; position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: visible; pointer-events: none; background: none !important; }`;

    this._updateSound(event, this._config);
    this._updateSnowAccumulation(event);

    if (!renderer) {
      this.shadowRoot.innerHTML = `<style>${baseStyle}</style>`;
      return;
    }

    const effectiveCfg = this._resolveEffectiveConfig();
    if (event === "snow") effectiveCfg._snowLevel = this._snowLevel;

    const { css, html } = renderer(effectiveCfg, this._hass);
    this.shadowRoot.innerHTML = `<style>${baseStyle}${css}</style>${html}`;
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
      weather_intensity_auto: false,
      sound_enabled: false,
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
    const caps = EVENT_CAPABILITIES[c.event] || { count: false, opacity: false, color: false, sound: false };
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
            <option value="balloons" ${c.event === "balloons" ? "selected" : ""}>🎈 Luftballons</option>
            <option value="lights" ${c.event === "lights" ? "selected" : ""}>💡 Lichterkette</option>
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

        ${isWeatherAuto ? this._row("🌧️ Intensität aus Wetterdaten", `
          <select id="weather_intensity_auto" style="width:100%; padding:6px;">
            <option value="off" ${!c.weather_intensity_auto ? "selected" : ""}>Aus (Anzahl/Deckkraft manuell unten)</option>
            <option value="on" ${c.weather_intensity_auto ? "selected" : ""}>An (aus Niederschlagsmenge, falls verfügbar)</option>
          </select>
        `, "Manche Wetter-Integrationen liefern eine Regen-/Schneemenge. Ist die da, übersteuert sie Anzahl/Deckkraft automatisch. Fehlt sie, greift die manuelle Einstellung unten als Rückfallebene.") : ""}

        ${caps.count && !(isWeatherAuto && c.weather_intensity_auto) ? this._row("Anzahl / Frequenz", `
          <select id="count_preset" style="width:100%; padding:6px;">
            <option value="low" ${c.count_preset === "low" ? "selected" : ""}>🔹 Wenig / Selten</option>
            <option value="medium" ${c.count_preset === "medium" ? "selected" : ""}>🔷 Mittel</option>
            <option value="high" ${c.count_preset === "high" ? "selected" : ""}>🔷 Viel / Häufig</option>
          </select>
        `, isWeatherAuto
          ? "⚠️ Ein Wert für ALLE automatisch erkannten Effekte gemeinsam (Regen, Schnee, Hagel, Blitz, Nebel, Sturm) - nicht einzeln pro Effekt einstellbar."
          : "Wie viele Partikel gleichzeitig zu sehen sind."
        ) : ""}

        ${caps.opacity && !(isWeatherAuto && c.weather_intensity_auto) ? this._row("Deckkraft / Helligkeit", `
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

        ${caps.sound ? this._row("🔊 Sound", `
          <select id="sound_enabled" style="width:100%; padding:6px;">
            <option value="off" ${!c.sound_enabled ? "selected" : ""}>Aus (Standard)</option>
            <option value="on" ${c.sound_enabled ? "selected" : ""}>An (leiser Regen-/Wind-/Donner-Klang)</option>
          </select>
        `, "Nur bei Regen, Sturm und Blitz hörbar - andere Effekte bleiben stumm. Manche Browser starten Ton erst, nachdem du das Dashboard einmal berührt/angeklickt hast.") : ""}
      </div>
    `;

    this.querySelector("#event").addEventListener("change", (e) => this._update("event", e.target.value, true));

    const weatherEntitySel = this.querySelector("#weather_entity");
    if (weatherEntitySel) {
      weatherEntitySel.addEventListener("change", (e) => this._update("weather_entity", e.target.value.trim(), false));
    }

    const weatherIntensitySel = this.querySelector("#weather_intensity_auto");
    if (weatherIntensitySel) {
      weatherIntensitySel.addEventListener("change", (e) => this._update("weather_intensity_auto", e.target.value === "on", true));
    }

    const soundSel = this.querySelector("#sound_enabled");
    if (soundSel) {
      soundSel.addEventListener("change", (e) => this._update("sound_enabled", e.target.value === "on", true));
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
