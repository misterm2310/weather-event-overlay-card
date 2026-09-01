/**
 * weather-event-overlay-card
 * Lovelace Custom Card — kombiniertes Wetter/Event-Overlay
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
  if (eventType === "bats") {
    switch (preset) {
      case "low": return 4;
      case "high": return 14;
      case "medium": default: return 8;
    }
  }
  if (eventType === "bee") {
    switch (preset) {
      case "low": return 3;
      case "high": return 8;
      case "medium": default: return 5;
    }
  }
  if (eventType === "clouds") {
    switch (preset) {
      case "low": return 2;
      case "high": return 7;
      case "medium": default: return 4;
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

// Universelle Erkennung für alle Themes (Standard, Custom, Dark/Light Mode)
// Verbesserung (Bugfix): statt die CSS-Variable selbst als Rohstring zu
// parsen (unzuverlässig - Themes nutzen Hex, rgb(), oder Komma-getrennte
// "R, G, B"-Tripel für --rgb-Varianten, und die Variable kann auf jeder
// Kaskaden-Ebene gesetzt sein, nicht nur an <html>), wird ein unsichtbares
// Test-Element mit `background-color: var(--card-background-color, ...)`
// eingefügt. Der BROWSER selbst löst dann die Variable auf und liefert über
// getComputedStyle().backgroundColor IMMER ein normalisiertes rgb()/rgba() -
// egal welches Format/welche Ebene das jeweilige Theme nutzt.
function colorStringToBrightness(colorStr) {
  if (!colorStr || colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)") return null;
  const nums = colorStr.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  const r = parseFloat(nums[0]), g = parseFloat(nums[1]), b = parseFloat(nums[2]);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// Verbesserung (Bugfix): View-spezifische Themes (in HA über "theme:" auf
// Dashboard-/View-Ebene statt global gesetzt) hinterlegen ihre Farb-
// Variablen NUR auf dem Container dieser einen Seite - nicht auf <html>
// oder <body> ganz oben. Die Prüfung nimmt deshalb jetzt ein Referenz-
// Element entgegen (die Karte selbst, die korrekt innerhalb der jeweiligen
// View im DOM-Baum sitzt) und testet AN DIESER STELLE, statt immer ganz
// oben nachzuschauen - so werden auch View-Themes zuverlässig erkannt.
// Verbesserung (Bugfix): läuft von der Karte aus schrittweise die
// Ahnenkette nach oben ab - auch durch Shadow-DOM-Grenzen hindurch (über
// .host, sobald man am Wurzelknoten eines Shadow-Trees ankommt). An jedem
// Vorfahren wird die ECHTE berechnete background-color geprüft (eine
// normale CSS-Eigenschaft, die der Browser IMMER auflöst - kein Rätselraten
// über CSS-Variablennamen mehr nötig). Home Assistants eigene Elemente wie
// <ha-card> setzen intern eine echte background-color passend zum
// aktuellen Theme; die findet man so garantiert, egal auf welcher Ebene
// im DOM-Baum das Theme (global oder nur für diese eine View) sitzt.
function brightnessFromAnyColor(str) {
  if (!str) return null;
  const trimmed = str.trim();
  if (!trimmed || trimmed === "transparent" || trimmed === "rgba(0, 0, 0, 0)") return null;
  if (trimmed.startsWith("#")) {
    const rgb = hexToRgb(trimmed);
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  }
  const nums = trimmed.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  const r = parseFloat(nums[0]), g = parseFloat(nums[1]), b = parseFloat(nums[2]);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// Verbesserung (Bugfix): statt eines künstlichen Test-Elements mit
// var()-Fallback-Kette (anfällig für CSS-Eigenheiten bei "invalid at
// computed-value time") werden gängige HA-Theme-Variablen jetzt DIREKT
// über getPropertyValue() ausgelesen - das funktioniert für jede
// Custom Property, unabhängig davon, ob irgendein Element sie tatsächlich
// für eine sichtbare Hintergrundfarbe nutzt. Custom Properties vererben
// sich automatisch nach unten (auch über Shadow-DOM-Grenzen hinweg), daher
// reicht oft schon die Karte selbst als Startpunkt. Zusätzlich wird die
// Ahnenkette hochgewandert (auch durch Shadow-Grenzen über .host) und dort
// jeweils auch die ECHTE berechnete background-color geprüft, für den Fall,
// dass ein HA-Element (z. B. <ha-card>) sie tatsächlich sichtbar nutzt.
const THEME_BG_VAR_NAMES = [
  "--card-background-color",
  "--primary-background-color",
  "--ha-card-background",
  "--secondary-background-color",
  "--app-header-background-color",
];

function checkNodeForThemeColor(node) {
  const style = getComputedStyle(node);
  for (const varName of THEME_BG_VAR_NAMES) {
    const brightness = brightnessFromAnyColor(style.getPropertyValue(varName));
    if (brightness !== null) return brightness;
  }
  return brightnessFromAnyColor(style.backgroundColor);
}

function detectBackgroundBrightness(hostEl) {
  try {
    let node = hostEl;
    let depth = 0;
    while (node && depth < 25) {
      if (node.nodeType === 1) {
        const brightness = checkNodeForThemeColor(node);
        if (brightness !== null) return brightness;
      }
      if (node.parentElement) {
        node = node.parentElement;
      } else if (node.parentNode && node.parentNode.host) {
        node = node.parentNode.host;
      } else if (node.getRootNode) {
        const root = node.getRootNode();
        node = (root && root.host) ? root.host : null;
      } else {
        node = null;
      }
      depth++;
    }

    // Rückfallebene: <body>/<html> direkt (z. B. im Editor-Kontext ohne hostEl).
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      const brightness = checkNodeForThemeColor(el);
      if (brightness !== null) return brightness;
    }

    return null;
  } catch (e) {
    return null;
  }
}

function isDarkModeActive(hassInstance, hostEl) {
  try {
    const brightness = detectBackgroundBrightness(hostEl);
    if (brightness !== null) {
      return brightness < 128;
    }

    if (hassInstance && hassInstance.themes && typeof hassInstance.themes.darkMode === "boolean") {
      return hassInstance.themes.darkMode;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    return true;
  }
}

function resolveDynamicColor(cfgColor, hassInstance, defaultLight = "#000000", defaultDark = "#ffffff", hostEl) {
  if (cfgColor && cfgColor !== "auto") return cfgColor;
  const dark = isDarkModeActive(hassInstance, hostEl);
  return dark ? defaultDark : defaultLight;
}

function overlayBaseCss(className, extraProps = "") {
  return `
    .${className} {
      position: fixed; top:0; left:50%; transform:translateX(-50%);
      width:100vw; height:100vh; pointer-events:none; z-index:9999; overflow:hidden;
      ${extraProps}
    }
  `;
}

function sanitizeLeafShape(input) {
  if (typeof input !== "string" || !input.trim()) return null;
  const trimmed = input.trim();
  const forbidden = /<script|javascript:|on\w+\s*=|<iframe|<object|<embed|xlink:href|href\s*=/i;
  if (forbidden.test(trimmed)) return null;
  const allowedTagPattern = /<\/?(path|polygon|circle|line|g|rect)\b[^>]*>/gi;
  const strippedOfAllowed = trimmed.replace(allowedTagPattern, "");
  if (strippedOfAllowed.includes("<")) return null;
  return trimmed;
}

const _randomCache = new Map();
function getCachedRandomSet(key, count, factory) {
  const cacheKey = `${key}:${count}`;
  if (!_randomCache.has(cacheKey)) {
    _randomCache.set(cacheKey, Array.from({ length: count }, factory));
  }
  return _randomCache.get(cacheKey);
}

/* ============================ STATISCHE DATEN ============================ */

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
  "cloudy": ["clouds"],
  "partlycloudy": ["clouds"],
};

function mapWeatherStateToEvents(state) {
  return WEATHER_STATE_MAP[state] || ["off"];
}

// Verbesserung (GUI-Editor): bei diesen Effekten steuert "Anzahl/Frequenz"
// den Abstand zwischen den Durchgängen (es gibt ja nur EINE Figur), nicht
// eine Partikelmenge - der Hinweistext im Editor erklärt das passend dazu.
const COUNT_IS_INTERVAL_TEXT = {
  santa: "Wie oft der Weihnachtsmann vorbeifliegt: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min. (keine Partikelmenge, da es nur einen Schlitten gibt).",
  dog: "Wie oft der Labrador durchläuft: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min. (keine Partikelmenge, da es nur einen Hund gibt).",
  comet: "Wie oft der Komet vorbeizieht: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min. (deutlich seltener als Sternschnuppen).",
  squirrel: "Wie oft das Eichhörnchen durchhuscht: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min. (keine Partikelmenge, da es nur eins gibt).",
  ducks: "Wie oft die Enten-Familie durchwatschelt: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min. (keine Partikelmenge, da es nur eine Familie gibt).",
};

const EVENT_CAPABILITIES = {
  off: { count: false, opacity: false, color: false },
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
  santa: { count: true, opacity: true, color: false },
  spider: { count: false, opacity: true, color: true },
  stars: { count: true, opacity: true, color: true },
  dog: { count: true, opacity: true, color: false },
  comet: { count: true, opacity: true, color: true },
  // Anzahl steuert bei Eichhörnchen, Biene und Enten-Familie den Abstand
  // zwischen den Durchgängen (wie bei Weihnachtsmann/Hund), nicht eine
  // Partikelmenge.
  squirrel: { count: true, opacity: true, color: false },
  bats: { count: true, opacity: true, color: false },
  owl: { count: false, opacity: true, color: false },
  bee: { count: true, opacity: true, color: false },
  clouds: { count: true, opacity: true, color: false },
  ducks: { count: true, opacity: true, color: false },
  wishstar: { count: false, opacity: true, color: true },
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

function renderRain(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "rain");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const drops = spreadSample(DROPS, count);

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

function renderSnow(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "snow");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const flakes = spreadSample(FLAKES_DATA, count);

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

  const snowLevel = typeof cfg._snowLevel === "number" ? cfg._snowLevel : 0;
  const accumHeight = Math.min(18, snowLevel * 0.18);
  const accumHtml = accumHeight > 0
    ? `<div class="snow-accumulation" aria-hidden="true" style="height:${accumHeight.toFixed(2)}vh; background:linear-gradient(180deg, rgba(255,255,255,0.92), rgba(230,238,245,0.8));"></div>`
    : "";

  return { css, html: `<div class="snowflakes" aria-hidden="true">${flakeHTML}${accumHtml}</div>` };
}

function renderLeaves(cfg, hass, hostEl) {
  const leafColors = Array.isArray(cfg.leaf_colors) && cfg.leaf_colors.length === 3 ? cfg.leaf_colors : ["#c9a227", "#a83232", "#d9812c"];
  const count = getParticleCount(cfg.count_preset || "medium", "leaves");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const leafShape = sanitizeLeafShape(cfg.leaf_shape) || DEFAULT_LEAF_SHAPE;
  const leaves = spreadSample(FLAKES_DATA, count);

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

function renderBalloons(cfg, hass, hostEl) {
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

function renderLights(cfg, hass, hostEl) {
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

function renderShootingStars(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const count = getParticleCount(cfg.count_preset || "medium", "shooting_stars");
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);

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

function renderLightning(cfg, hass, hostEl) {
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

function renderFog(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const count = getParticleCount(cfg.count_preset || "medium", "fog");
  const isHigh = (cfg.opacity_preset || "medium") === "high";

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
    const bankOp = isHigh ? Math.max(b.baseOp, 0.7) : (b.baseOp * opacity);
    const dir = b.reverse ? "fog-drift-reverse" : "fog-drift";
    return `<div class="fog-bank" style="top:${b.top}vh; width:${b.width}vw; height:${b.height}vh; animation-duration:${b.dur}s; animation-delay:${b.delay}s; animation-name:${dir}; opacity:${bankOp.toFixed(2)}; background:radial-gradient(ellipse at center, ${color} 0%, transparent 70%);"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("fog-container")}
    .fog-bank {
      position: absolute; left: -20vw; border-radius: 50%; filter: blur(18px); will-change: transform;
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

function renderHail(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "hail");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const stones = spreadSample(DROPS, count);

  const hailHTML = stones.map((d) => {
    const op = isHigh
      ? Math.min(1, Math.max(d.op, 0.85)).toFixed(2)
      : (d.op * opacity).toFixed(2);
    const size = Math.max(3, Math.round(d.size / 3));
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

function renderStorm(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
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

function renderSanta(cfg, hass, hostEl) {
  // Optik: komplett bunte Weihnachts-Illustration statt einfarbiger
  // Silhouette - Farbmodus gibt's hier bewusst nicht (siehe
  // EVENT_CAPABILITIES.santa unten), da mehrere feste Farben gleichzeitig
  // gebraucht werden (rote Mütze, weißer Bommel/Bart, Hautfarbe, ...).
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const flightPct = Math.min(30, (18 / interval) * 100).toFixed(2);
  // Verbesserung (Bugfix): negativer animation-delay, berechnet aus der
  // gemerkten Startzeit - lässt die Animation an der richtigen Stelle
  // weiterlaufen, statt bei jedem Neu-Rendern wieder bei 0% zu beginnen.
  const elapsedSec = cfg._startTime ? (Date.now() - cfg._startTime) / 1000 : 0;
  const delaySec = (-(elapsedSec % interval)).toFixed(2);

  const css = `
    .santa-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .santa-sleigh-box {
      position: absolute; top: 8vh; right: -250px; width: 220px; height: 62px;
      animation: santa-fly ${interval}s linear infinite; animation-delay: ${delaySec}s; will-change: transform;
    }
    @keyframes santa-fly {
      0% { transform: translateX(0) translateY(0); }
      ${flightPct}% { transform: translateX(calc(-100vw - 300px)) translateY(-15px); }
      100% { transform: translateX(calc(-100vw - 300px)) translateY(-15px); }
    }
  `;

  const html = `
    <div class="santa-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <div class="santa-sleigh-box">
        <svg viewBox="0 -20 320 90" preserveAspectRatio="xMidYMid meet">
          <defs>
            <!-- Rentier: brauner Körper, dunkleres Geweih, blickt nach links (Flugrichtung) -->
            <g id="santa-reindeer">
              <ellipse cx="35" cy="28" rx="17" ry="9" fill="#8b5a2b"/>
              <path d="M20,24 Q10,18 8,14" fill="none" stroke="#8b5a2b" stroke-width="7" stroke-linecap="round"/>
              <ellipse cx="8" cy="14" rx="7" ry="6" fill="#8b5a2b"/>
              <circle cx="2" cy="16" r="2.3" fill="#4a2f18"/>
              <path d="M8,9 L4,-3 M4,-3 L0,-7 M4,-3 L2,1 M8,9 L13,-4 M13,-4 L17,-8 M13,-4 L15,0"
                    fill="none" stroke="#4a2f18" stroke-width="2" stroke-linecap="round"/>
              <path d="M22,35 Q16,44 12,50 M28,36 Q24,44 20,50 M46,36 Q54,42 58,50 M40,36 Q46,44 50,50"
                    fill="none" stroke="#5a3a1a" stroke-width="3" stroke-linecap="round"/>
              <path d="M52,24 Q57,20 55,27" fill="none" stroke="#8b5a2b" stroke-width="2" stroke-linecap="round"/>
            </g>
          </defs>
          <use href="#santa-reindeer"/>
          <use href="#santa-reindeer" transform="translate(68,0)"/>
          <!-- Zügel -->
          <path d="M60,18 Q100,22 148,26 M128,18 Q140,22 148,26" fill="none" stroke="#3a2a1a" stroke-width="1.2" opacity="0.8"/>
          <!-- Schlitten: Rot mit Gold-Kufen -->
          <path d="M148,44 Q142,30 154,20 Q162,13 172,13 L212,13 Q224,13 224,25 L224,37 Q224,44 214,44 Z"
                fill="#b91c1c" stroke="#d4af37" stroke-width="2"/>
          <!-- Weihnachtsmann: Mantel, Gürtel, Bart, Mütze mit Bommel -->
          <ellipse cx="182" cy="27" rx="12" ry="14" fill="#c41e3a"/>
          <ellipse cx="182" cy="40" rx="12" ry="3" fill="#ffffff"/>
          <rect x="172" y="29" width="20" height="3" fill="#1a1a1a"/>
          <rect x="180" y="28.5" width="4" height="4" fill="#d4af37"/>
          <circle cx="182" cy="10" r="7" fill="#f4c2a1"/>
          <path d="M175,12 Q182,24 189,12 Q188,18 182,20 Q176,18 175,12 Z" fill="#ffffff"/>
          <path d="M175,5 Q165,-8 179,-13 Q184,-12 180,-6 Q177,-1 175,5 Z" fill="#c41e3a"/>
          <ellipse cx="180" cy="4" rx="7" ry="2.5" fill="#ffffff"/>
          <circle cx="179" cy="-13" r="2.5" fill="#ffffff"/>
        </svg>
      </div>
    </div>
  `;
  return { css, html };
}

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

function renderSpider(cfg, hass, hostEl) {
  const webColor = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const webSvg = buildCornerWebSvg(6, 4);

  const css = `
    .spider-web-container {
      position: fixed; top: 0; right: 0; width: 300px; height: 300px;
      pointer-events: none; z-index: 9999; overflow: visible; color: ${webColor};
    }
    .corner-web {
      position: absolute; top: 0; right: 0; width: 180px; height: 180px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.2));
    }
    .hanging-spider-box {
      position: absolute; top: 40px; right: 50px; width: 26px; height: 26px;
      animation: spider-drop 14s ease-in-out infinite; will-change: transform;
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
    .spider-eye {
      animation: spider-eye-blink 1.4s ease-in-out infinite;
    }
    @keyframes spider-eye-blink {
      0%, 40% { opacity: 1; filter: drop-shadow(0 0 3px #ff2222); }
      50% { opacity: 0.25; filter: drop-shadow(0 0 1px #ff2222); }
      60%, 100% { opacity: 1; filter: drop-shadow(0 0 3px #ff2222); }
    }
  `;

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
          <circle class="spider-eye" cx="45" cy="35" r="2.5" fill="#ff0000"/>
          <circle class="spider-eye" cx="55" cy="35" r="2.5" fill="#ff0000"/>
        </svg>
      </div>
    </div>
  `;
  return { css, html };
}

function renderDog(cfg, hass, hostEl) {
  // Goldener Labrador: läuft periodisch quer durchs Bild - nicht mehr starr
  // am unteren Rand, sondern bei jedem Rendern an einer neuen zufälligen
  // Höhe (10-80% der Bildschirmhöhe) und mit leichter diagonaler Drift
  // während des Laufs selbst, für eine natürlichere "läuft irgendwo durchs
  // Bild"-Wirkung statt einer immer gleichen Spur. "Anzahl/Frequenz"
  // steuert weiterhin, wie oft er durchläuft, statt einer Partikelmenge -
  // deshalb auch kein Farbmodus (feste Fellfarbe).
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const walkPct = Math.min(30, (20 / interval) * 100).toFixed(2);
  // Verbesserung (Bugfix): Höhe/Drift kommen jetzt von der Haupt-Karte
  // (einmalig gewürfelt und gespeichert, siehe _render()), statt bei jedem
  // Aufruf neu zufällig zu sein - sonst würde ein Neu-Rendern mitten in der
  // Animation zu einem sichtbaren Sprung führen. Fallback auf Zufallswerte,
  // falls die Funktion (z. B. in Tests) ohne diese Werte aufgerufen wird.
  const startHeight = (typeof cfg._startHeight === "number" ? cfg._startHeight : Math.random() * 70 + 10).toFixed(2);
  const drift = typeof cfg._drift === "number" ? cfg._drift : (Math.random() * 16 - 8);
  const driftHeight = (parseFloat(startHeight) + drift).toFixed(2);
  // Negativer animation-delay aus der gemerkten Startzeit - lässt die
  // Animation an der richtigen Stelle weiterlaufen, statt bei jedem
  // Neu-Rendern wieder bei 0% zu beginnen.
  const elapsedSec = cfg._startTime ? (Date.now() - cfg._startTime) / 1000 : 0;
  const delaySec = (-(elapsedSec % interval)).toFixed(2);

  const css = `
    .dog-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .dog-walk-box {
      position: absolute; top: ${startHeight}vh; left: -160px; width: 140px; height: 55px;
      animation: dog-walk ${interval}s linear infinite; animation-delay: ${delaySec}s; will-change: transform;
    }
    .dog-bob {
      animation: dog-bob 0.55s ease-in-out infinite alternate;
    }
    @keyframes dog-walk {
      0% { transform: translate(0, 0); }
      ${walkPct}% { transform: translate(calc(100vw + 300px), ${(parseFloat(driftHeight) - parseFloat(startHeight)).toFixed(2)}vh); }
      100% { transform: translate(calc(100vw + 300px), ${(parseFloat(driftHeight) - parseFloat(startHeight)).toFixed(2)}vh); }
    }
    @keyframes dog-bob {
      0% { transform: translateY(0); }
      100% { transform: translateY(-3px); }
    }
    .dog-leg-a { animation: dog-leg-swing-a 0.55s ease-in-out infinite alternate; }
    .dog-leg-b { animation: dog-leg-swing-b 0.55s ease-in-out infinite alternate; }
    @keyframes dog-leg-swing-a {
      0% { transform: rotate(-14deg); }
      100% { transform: rotate(14deg); }
    }
    @keyframes dog-leg-swing-b {
      0% { transform: rotate(14deg); }
      100% { transform: rotate(-14deg); }
    }
  `;

  const html = `
    <div class="dog-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <div class="dog-walk-box">
        <div class="dog-bob">
          <svg viewBox="0 0 120 55" preserveAspectRatio="xMidYMid meet">
            <g class="dog-leg-a" style="transform-origin: 88px 36px;">
              <path d="M88,36 Q92,42 95,48" stroke="#c68a3d" stroke-width="5" stroke-linecap="round" fill="none"/>
            </g>
            <g class="dog-leg-b" style="transform-origin: 78px 36px;">
              <path d="M78,36 Q76,42 74,48" stroke="#c68a3d" stroke-width="5" stroke-linecap="round" fill="none"/>
            </g>
            <g class="dog-leg-b" style="transform-origin: 35px 36px;">
              <path d="M35,36 Q39,42 42,48" stroke="#c68a3d" stroke-width="5" stroke-linecap="round" fill="none"/>
            </g>
            <g class="dog-leg-a" style="transform-origin: 25px 36px;">
              <path d="M25,36 Q21,42 18,48" stroke="#c68a3d" stroke-width="5" stroke-linecap="round" fill="none"/>
            </g>
            <path d="M22,20 Q10,14 14,26 Q18,30 25,26 Z" fill="#d4a25c"/>
            <ellipse cx="55" cy="25" rx="35" ry="14" fill="#d4a25c"/>
            <ellipse cx="95" cy="18" rx="13" ry="11" fill="#d4a25c"/>
            <path d="M90,12 Q80,10 82,22 Q86,26 92,20 Z" fill="#a67c3d"/>
            <ellipse cx="106" cy="23" rx="7" ry="5.5" fill="#e8c78a"/>
            <circle cx="112" cy="23" r="2" fill="#2a1a10"/>
            <circle cx="97" cy="15" r="1.6" fill="#2a1a10"/>
          </svg>
        </div>
      </div>
    </div>
  `;
  return { css, html };
}

function renderComet(cfg, hass, hostEl) {
  // Komet: ein einzelner, dramatischer Streifen mit langem Schweif, der
  // deutlich seltener als Sternschnuppen vorbeizieht. "Anzahl/Frequenz"
  // steuert wie beim Weihnachtsmann/Hund den Abstand zwischen den
  // Durchgängen, nicht eine Partikelmenge. Nutzt dieselbe Startzeit-Technik
  // wie Weihnachtsmann/Hund, damit ein Neu-Rendern die Animation nicht
  // wieder auf 0 zurücksetzt.
  const color = resolveDynamicColor(cfg.color, hass, "#1a3a5c", "#bfe9ff", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const flightSeconds = 3.5;
  const flightPct = Math.min(30, (flightSeconds / interval) * 100).toFixed(2);
  const fadePct = (parseFloat(flightPct) + 0.5).toFixed(2);
  const elapsedSec = cfg._startTime ? (Date.now() - cfg._startTime) / 1000 : 0;
  const delaySec = (-(elapsedSec % interval)).toFixed(2);

  const css = `
    .comet-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .comet-box {
      position: absolute; top: -10vh; left: -20vw; width: 220px; height: 5px;
      animation-name: comet-fly; animation-timing-function: linear; animation-iteration-count: infinite;
      animation-duration: ${interval}s; animation-delay: ${delaySec}s;
      will-change: transform, opacity;
    }
    .comet-trail {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, ${color});
      border-radius: 50%; filter: blur(1px);
    }
    .comet-head {
      position: absolute; right: -3px; top: 50%; transform: translateY(-50%);
      width: 8px; height: 8px; border-radius: 50%; background: ${color};
      box-shadow: 0 0 14px 4px ${color};
    }
    @keyframes comet-fly {
      0% { transform: translate(0, 0) rotate(35deg); opacity: 0; }
      1% { opacity: ${finalOpacity}; }
      ${flightPct}% { transform: translate(130vw, 100vh) rotate(35deg); opacity: ${finalOpacity}; }
      ${fadePct}% { opacity: 0; }
      100% { opacity: 0; transform: translate(130vw, 100vh) rotate(35deg); }
    }
  `;
  const html = `
    <div class="comet-container" aria-hidden="true">
      <div class="comet-box">
        <div class="comet-trail"></div>
        <div class="comet-head"></div>
      </div>
    </div>
  `;
  return { css, html };
}

function renderSquirrel(cfg, hass, hostEl) {
  // Eichhörnchen: huscht schnell und hoppelnd über den Bildschirm - viel
  // flotter als der Hund (kurze Durchquerungszeit), mit buschigem Schwanz.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const dashPct = Math.min(30, (7 / interval) * 100).toFixed(2);
  const elapsedSec = cfg._startTime ? (Date.now() - cfg._startTime) / 1000 : 0;
  const delaySec = (-(elapsedSec % interval)).toFixed(2);
  const startHeight = typeof cfg._startHeight === "number" ? cfg._startHeight.toFixed(2) : "78.00";

  const css = `
    .squirrel-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .squirrel-box {
      position: absolute; top: ${startHeight}vh; left: -100px; width: 80px; height: 45px;
      animation-name: squirrel-dash; animation-timing-function: linear; animation-iteration-count: infinite;
      animation-duration: ${interval}s; animation-delay: ${delaySec}s; will-change: transform;
    }
    .squirrel-hop {
      animation: squirrel-hop 0.28s ease-in-out infinite alternate;
    }
    @keyframes squirrel-dash {
      0% { transform: translateX(0); opacity: 0; }
      1% { opacity: ${finalOpacity}; }
      ${dashPct}% { transform: translateX(calc(100vw + 200px)); opacity: ${finalOpacity}; }
      100% { transform: translateX(calc(100vw + 200px)); opacity: 0; }
    }
    @keyframes squirrel-hop {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(-6px) rotate(-3deg); }
    }
  `;
  const html = `
    <div class="squirrel-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <div class="squirrel-box">
        <div class="squirrel-hop">
          <svg viewBox="0 0 80 45" preserveAspectRatio="xMidYMid meet">
            <path d="M20,12 Q0,2 4,22 Q8,38 26,30 Z" fill="#a5672f"/>
            <ellipse cx="42" cy="28" rx="16" ry="9" fill="#c17d3a"/>
            <circle cx="62" cy="20" r="8" fill="#c17d3a"/>
            <path d="M58,13 L56,6 L63,11 Z" fill="#a5672f"/>
            <circle cx="65" cy="19" r="1.5" fill="#2a1a10"/>
            <path d="M32,35 Q28,42 27,45" stroke="#8a5a28" stroke-width="4" stroke-linecap="round" fill="none"/>
            <path d="M42,36 Q40,43 39,46" stroke="#8a5a28" stroke-width="4" stroke-linecap="round" fill="none"/>
            <ellipse cx="27" cy="46" rx="3" ry="2" fill="#7a4a1f"/>
            <ellipse cx="39" cy="47" rx="3" ry="2" fill="#7a4a1f"/>
          </svg>
        </div>
      </div>
    </div>
  `;
  return { css, html };
}

function renderBats(cfg, hass, hostEl) {
  // Fledermäuse: mehrere kleine, flatternde Silhouetten auf wellenförmigen
  // Flugbahnen - feste dunkle Farbe, unabhängig vom Theme.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const count = getParticleCount(cfg.count_preset || "medium", "bats");

  const bats = getCachedRandomSet("bats", count, () => ({
    top: (Math.random() * 85).toFixed(2),
    dur: (Math.random() * 6 + 9).toFixed(2),
    delay: (Math.random() * -12).toFixed(2),
    flapDur: (Math.random() * 0.2 + 0.25).toFixed(2),
    baseOp: (Math.random() * 0.3 + 0.5).toFixed(2),
    wobble: Math.floor(Math.random() * 10) + 6,
  }));

  const batHtml = bats.map((b) => {
    const op = isHigh ? Math.max(parseFloat(b.baseOp), 0.85) : (parseFloat(b.baseOp) * opacity);
    return `
    <div class="bat" style="top:${b.top}vh; animation-duration:${b.dur}s; animation-delay:${b.delay}s; opacity:${op.toFixed(2)}; --wobble:${b.wobble}vh;">
      <svg viewBox="0 0 40 20" class="bat-wings" style="animation-duration:${b.flapDur}s;">
        <path d="M20,10 L2,0 L9,7 L0,10 L9,13 L2,20 Z" fill="#1a1a1a"/>
        <path d="M20,10 L38,0 L31,7 L40,10 L31,13 L38,20 Z" fill="#1a1a1a"/>
        <ellipse cx="20" cy="10" rx="3" ry="4" fill="#1a1a1a"/>
        <path d="M17,7 L14,3 M23,7 L26,3" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("bats-container")}
    .bat {
      position: absolute; left: -10vw; width: 40px;
      animation-name: bat-fly; animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: transform;
    }
    .bat-wings {
      width: 100%; height: auto; display: block;
      animation-name: bat-flap; animation-timing-function: ease-in-out; animation-iteration-count: infinite; animation-direction: alternate;
      transform-origin: center;
    }
    @keyframes bat-fly {
      0%   { transform: translateX(0) translateY(0); }
      25%  { transform: translateX(30vw) translateY(calc(-1 * var(--wobble))); }
      50%  { transform: translateX(60vw) translateY(var(--wobble)); }
      75%  { transform: translateX(90vw) translateY(calc(-1 * var(--wobble))); }
      100% { transform: translateX(120vw) translateY(0); }
    }
    @keyframes bat-flap {
      0% { transform: scaleY(1); }
      100% { transform: scaleY(0.4); }
    }
  `;
  return { css, html: `<div class="bats-container" aria-hidden="true">${batHtml}</div>` };
}

function renderOwl(cfg, hass, hostEl) {
  // Eule: sitzt still in einer Ecke, blinzelt gelegentlich und dreht
  // leicht den Kopf - ruhiger Begleiter, kein Durchlaufen wie beim Hund.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;

  const css = `
    .owl-container {
      position: fixed; top: 2vh; left: 1vw; width: 85px; height: 85px;
      pointer-events: none; z-index: 999999;
    }
    .owl-head {
      animation: owl-turn 9s ease-in-out infinite;
      transform-origin: 50% 60%;
    }
    .owl-eye-lid {
      animation: owl-blink 6s ease-in-out infinite;
      transform-origin: center;
    }
    @keyframes owl-turn {
      0%, 40% { transform: rotate(0deg); }
      50% { transform: rotate(-8deg); }
      60%, 90% { transform: rotate(0deg); }
      95% { transform: rotate(6deg); }
      100% { transform: rotate(0deg); }
    }
    @keyframes owl-blink {
      0%, 92%, 100% { transform: scaleY(0); }
      95%, 97% { transform: scaleY(1); }
    }
  `;
  const html = `
    <div class="owl-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
        <ellipse cx="50" cy="70" rx="30" ry="26" fill="#6b4a2f"/>
        <path d="M20,68 Q10,50 25,45 M80,68 Q90,50 75,45" fill="none" stroke="#6b4a2f" stroke-width="6" stroke-linecap="round"/>
        <g class="owl-head">
          <circle cx="50" cy="42" r="26" fill="#8a6238"/>
          <path d="M35,20 L30,6 L42,18 Z" fill="#6b4a2f"/>
          <path d="M65,20 L70,6 L58,18 Z" fill="#6b4a2f"/>
          <circle cx="38" cy="40" r="12" fill="#f4ead9"/>
          <circle cx="62" cy="40" r="12" fill="#f4ead9"/>
          <circle cx="38" cy="40" r="7" fill="#e8b13a"/>
          <circle cx="62" cy="40" r="7" fill="#e8b13a"/>
          <circle cx="38" cy="40" r="3" fill="#1a1a1a"/>
          <circle cx="62" cy="40" r="3" fill="#1a1a1a"/>
          <rect class="owl-eye-lid" x="26" y="34" width="24" height="12" fill="#8a6238"/>
          <rect class="owl-eye-lid" x="50" y="34" width="24" height="12" fill="#8a6238"/>
          <path d="M46,48 L54,48 L50,56 Z" fill="#e8952a"/>
        </g>
      </svg>
    </div>
  `;
  return { css, html };
}

function renderBee(cfg, hass, hostEl) {
  // Bienen: mehrere gleichzeitig (Standard 5-6), jede mit eigenem
  // Zickzack-Pfad über den kompletten Bildschirm verteilt - wie die
  // Fledermäuse, nicht mehr nur eine einzelne periodisch durchfliegende.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const count = getParticleCount(cfg.count_preset || "medium", "bee");

  const bees = getCachedRandomSet("bee", count, () => ({
    top: (Math.random() * 80).toFixed(2),
    dur: (Math.random() * 8 + 14).toFixed(2),
    delay: (Math.random() * -20).toFixed(2),
    wobble: Math.floor(Math.random() * 14) + 6,
    baseOp: (Math.random() * 0.2 + 0.75).toFixed(2),
  }));

  const beeHtml = bees.map((b) => {
    const op = isHigh ? Math.max(parseFloat(b.baseOp), 0.9) : (parseFloat(b.baseOp) * opacity);
    return `
    <div class="bee" style="top:${b.top}vh; animation-duration:${b.dur}s; animation-delay:${b.delay}s; opacity:${op.toFixed(2)}; --wobble:${b.wobble}vh;">
      <svg viewBox="0 0 34 26" preserveAspectRatio="xMidYMid meet">
        <ellipse class="bee-wing" cx="13" cy="6" rx="8" ry="5" fill="#eef6ff" opacity="0.85" stroke="#c3d6ea" stroke-width="0.6"/>
        <ellipse class="bee-wing" cx="27" cy="6" rx="8" ry="5" fill="#eef6ff" opacity="0.85" stroke="#c3d6ea" stroke-width="0.6"/>
        <ellipse cx="20" cy="14" rx="11" ry="8" fill="#2a1a05"/>
        <rect x="12" y="10" width="4" height="8" fill="#f5c518"/>
        <rect x="20" y="10" width="4" height="8" fill="#f5c518"/>
        <rect x="28" y="10" width="3" height="8" fill="#f5c518"/>
        <circle cx="9" cy="14" r="4" fill="#1a1a1a"/>
      </svg>
    </div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("bee-container")}
    .bee {
      position: absolute; left: -8vw; width: 34px;
      animation-name: bee-zigzag; animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: transform;
    }
    .bee-wing {
      animation: bee-wing-flap 0.12s ease-in-out infinite alternate;
      transform-origin: 20px 9px;
    }
    @keyframes bee-zigzag {
      0%   { transform: translateX(0) translateY(0); }
      20%  { transform: translateX(24vw) translateY(calc(-1 * var(--wobble))); }
      40%  { transform: translateX(48vw) translateY(var(--wobble)); }
      60%  { transform: translateX(72vw) translateY(calc(-0.6 * var(--wobble))); }
      80%  { transform: translateX(96vw) translateY(var(--wobble)); }
      100% { transform: translateX(120vw) translateY(0); }
    }
    @keyframes bee-wing-flap {
      0% { transform: scaleY(1); }
      100% { transform: scaleY(0.55); }
    }
  `;
  return { css, html: `<div class="bee-container" aria-hidden="true">${beeHtml}</div>` };
}

function renderClouds(cfg, hass, hostEl) {
  // Wolken-Drift: mehrere weiche, verschwommene Wolkenformen ziehen ganz
  // ruhig und langsam quer übers Bild (oberer Bereich).
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const count = getParticleCount(cfg.count_preset || "medium", "clouds");

  const clouds = getCachedRandomSet("clouds", count, () => ({
    top: (Math.random() * 82).toFixed(2),
    scale: (Math.random() * 0.7 + 0.7).toFixed(2),
    dur: (Math.random() * 40 + 60).toFixed(2),
    delay: (Math.random() * -80).toFixed(2),
    baseOp: (Math.random() * 0.08 + 0.08).toFixed(2),
  }));

  const cloudHtml = clouds.map((c) => {
    const op = isHigh ? Math.max(parseFloat(c.baseOp), 0.25) : (parseFloat(c.baseOp) * opacity);
    return `<div class="cloud" style="top:${c.top}vh; transform:scale(${c.scale}); animation-duration:${c.dur}s; animation-delay:${c.delay}s; opacity:${op.toFixed(2)};"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("clouds-container")}
    .cloud {
      position: absolute; left: -30vw; width: 22vw; height: 8vh;
      background: #e8edf2; border-radius: 50%;
      box-shadow: 6vw 1vh 0 -1vh #e8edf2, -5vw 1.5vh 0 -1.5vh #e8edf2, 3vw -1vh 0 -0.5vh #e8edf2;
      filter: blur(6px);
      animation-name: cloud-drift; animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: transform;
    }
    @keyframes cloud-drift {
      0% { transform: translateX(0) scale(var(--s, 1)); }
      100% { transform: translateX(160vw) scale(var(--s, 1)); }
    }
  `;
  return { css, html: `<div class="clouds-container" aria-hidden="true">${cloudHtml}</div>` };
}

function renderDucks(cfg, hass, hostEl) {
  // Enten-Familie: eine große Ente läuft voran, mehrere kleine Küken
  // watscheln hinterher - läuft periodisch wie der Hund.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const walkPct = Math.min(30, (22 / interval) * 100).toFixed(2);
  const elapsedSec = cfg._startTime ? (Date.now() - cfg._startTime) / 1000 : 0;
  const delaySec = (-(elapsedSec % interval)).toFixed(2);
  const startHeight = typeof cfg._startHeight === "number" ? cfg._startHeight.toFixed(2) : "75.00";

  const css = `
    .ducks-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .ducks-box {
      position: absolute; top: ${startHeight}vh; left: -220px; width: 200px; height: 45px;
      animation-name: ducks-walk; animation-timing-function: linear; animation-iteration-count: infinite;
      animation-duration: ${interval}s; animation-delay: ${delaySec}s; will-change: transform;
    }
    .duck-waddle { animation: duck-waddle 0.5s ease-in-out infinite alternate; }
    .duck-waddle.d2 { animation-delay: 0.08s; }
    .duck-waddle.d3 { animation-delay: 0.16s; }
    .duck-waddle.d4 { animation-delay: 0.24s; }
    @keyframes ducks-walk {
      0% { transform: translateX(0); opacity: 0; }
      1% { opacity: ${finalOpacity}; }
      ${walkPct}% { transform: translateX(calc(100vw + 300px)); opacity: ${finalOpacity}; }
      100% { transform: translateX(calc(100vw + 300px)); opacity: 0; }
    }
    @keyframes duck-waddle {
      0% { transform: rotate(-4deg) translateY(0); }
      100% { transform: rotate(4deg) translateY(-2px); }
    }
  `;
  const duckSvg = (scale, cls) => `
    <g class="duck-waddle ${cls}" transform="scale(${scale})">
      <path d="M2,18 Q-4,10 4,6 Q10,8 8,18 Z" fill="#d4722e"/>
      <ellipse cx="20" cy="20" rx="16" ry="11" fill="#e8a83a"/>
      <path d="M14,14 Q22,12 24,22 Q18,24 14,14 Z" fill="#d4722e" opacity="0.6"/>
      <circle cx="34" cy="12" r="8" fill="#e8a83a"/>
      <path d="M40,12 L48,10 L40,16 Z" fill="#d4722e"/>
      <circle cx="36" cy="10" r="1.3" fill="#1a1a1a"/>
      <path d="M16,30 L14,36 M24,30 L24,36" stroke="#d4722e" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  `;
  const html = `
    <div class="ducks-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <div class="ducks-box">
        <svg viewBox="0 0 200 45" preserveAspectRatio="xMidYMin meet">
          <g transform="translate(0,4)">${duckSvg(1, "d1")}</g>
          <g transform="translate(58,14)">${duckSvg(0.55, "d2")}</g>
          <g transform="translate(88,18)">${duckSvg(0.5, "d3")}</g>
          <g transform="translate(116,15)">${duckSvg(0.55, "d4")}</g>
        </svg>
      </div>
    </div>
  `;
  return { css, html };
}

function renderWishStar(cfg, hass, hostEl) {
  // Wunschstern-Funkeln: sieht aus wie ein Stern vom normalen Sternenhimmel
  // (runder Punkt mit Glow) - leuchtet aber einmal auf, verschwindet dann
  // wieder komplett und blitzt beim nächsten Zyklus an einer NEUEN Position
  // auf. Die Position kommt von der Haupt-Karte (_wishstarPos), die sie bei
  // jedem Zyklus per Timer neu würfelt - ein reiner CSS-Loop könnte nicht
  // "teleportieren", nur an derselben Stelle bleiben.
  const color = resolveDynamicColor(cfg.color, hass, "#1a1a2e", "#ffffff", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const peak = isHigh ? 1 : Math.max(opacity, 0.5);
  const pos = cfg._wishstarPos || { top: 30, left: 50 };

  const css = `
    .wishstar {
      position: fixed; top: ${pos.top.toFixed(2)}vh; left: ${pos.left.toFixed(2)}vw; width: 46px; height: 46px;
      pointer-events: none; z-index: 9999;
      animation: wishstar-flash 3s ease-in-out 1 forwards;
      filter: drop-shadow(0 0 14px ${color});
      will-change: opacity, transform;
    }
    @keyframes wishstar-flash {
      0% { opacity: 0; transform: scale(0.3) rotate(0deg); }
      30% { opacity: ${peak}; transform: scale(1.25) rotate(8deg); }
      55% { opacity: ${peak}; transform: scale(1) rotate(0deg); }
      100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
    }
  `;
  const html = `
    <div class="wishstar" aria-hidden="true">
      <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
        <path d="M50,0 L57,43 L100,50 L57,57 L50,100 L43,57 L0,50 L43,43 Z" fill="${color}"/>
        <circle cx="50" cy="50" r="12" fill="${color}"/>
        <circle cx="50" cy="50" r="5" fill="#ffffff" opacity="0.9"/>
      </svg>
    </div>
  `;
  return { css, html };
}

function renderStars(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "stars");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";

  const stars = getCachedRandomSet("stars", count, () => ({
    top: (Math.random() * 85).toFixed(2),
    left: (Math.random() * 100).toFixed(2),
    size: (Math.random() * 2.5 + 2).toFixed(2),
    dur: (Math.random() * 3 + 2).toFixed(2),
    delay: (Math.random() * -5).toFixed(2),
    baseOp: (Math.random() * 0.4 + 0.55).toFixed(2),
  }));

  const starHTML = stars.map((s) => {
    const peak = isHigh
      ? Math.max(parseFloat(s.baseOp), 0.95)
      : Math.max(parseFloat(s.baseOp) * opacity, 0.35);
    const glow = (parseFloat(s.size) * 2.5).toFixed(2);
    return `<div class="star" style="top:${s.top}vh; left:${s.left}vw; width:${s.size}px; height:${s.size}px; background:${color}; box-shadow: 0 0 ${glow}px ${color}, 0 0 1.5px rgba(160,160,160,0.9); animation-duration:${s.dur}s; animation-delay:${s.delay}s; --peak:${peak.toFixed(2)};"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("stars-container")}
    .star {
      position: absolute; border-radius: 50%;
      animation: star-twinkle ease-in-out infinite alternate; will-change: opacity, transform;
    }
    @keyframes star-twinkle {
      0% { opacity: calc(var(--peak) * 0.5); transform: scale(0.8); }
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
  dog: renderDog,
  comet: renderComet,
  squirrel: renderSquirrel,
  bats: renderBats,
  owl: renderOwl,
  bee: renderBee,
  clouds: renderClouds,
  ducks: renderDucks,
  wishstar: renderWishStar,
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
    this._portalHost = null;
    this._portalShadow = null;
    this._visibilityPollTimer = null;
    // Verbesserung (Bugfix): merkt sich, WANN ein periodischer Effekt
    // (Hund, Weihnachtsmann) gestartet wurde. Wird die Karte zwischendurch
    // neu gerendert (z. B. durch häufige State-Updates einer Timer-Entity
    // im Dashboard), kann die Animation so weiterrechnen, statt jedes Mal
    // wieder bei 0% anzufangen und nie eine komplette Runde zu schaffen.
    this._periodicStartTimes = {};
    this._wishstarTimer = null;
    this._wishstarPos = null;
  }

  // Verbesserung (Bugfix): "position: fixed" wird nicht mehr relativ zum
  // echten Bildschirm berechnet, sobald IRGENDEIN Eltern-Element einen CSS
  // transform/filter/contain gesetzt hat - das kommt bei verschachtelten
  // Dashboard-Layouts vor (z. B. "sections"-Views mit "visibility:"-
  // Bedingungen). Lösung: die Effekte werden in einen eigenen Container
  // direkt in <body> gerendert, komplett unabhängig von der Dashboard-
  // Struktur, in der die Karte eigentlich eingebettet ist.
  _ensurePortal() {
    if (this._portalHost) return;
    this._portalHost = document.createElement("div");
    this._portalHost.style.cssText = "position:fixed; top:0; left:0; width:0; height:0; pointer-events:none;";
    this._portalShadow = this._portalHost.attachShadow({ mode: "open" });
    document.body.appendChild(this._portalHost);
  }

  // Die Karte selbst kann trotzdem versteckt sein (z. B. weil eine
  // "visibility:"-Bedingung gerade nicht zutrifft, ohne die Karte komplett
  // aus dem DOM zu entfernen). Der Portal-Container lebt unabhängig davon
  // in <body> - dieser Abgleich sorgt dafür, dass er nur sichtbar ist,
  // wenn die Karte es selbst auch wäre.
  _syncPortalVisibility() {
    if (!this._portalHost) return;
    const isVisible = this.isConnected && this.offsetParent !== null;
    this._portalHost.style.display = isVisible ? "" : "none";
  }

  connectedCallback() {
    window.addEventListener("set-theme", this._onThemeChange);
    window.addEventListener("resize", this._onThemeChange);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", this._onThemeChange);
    document.addEventListener("visibilitychange", this._onVisibilityChange);

    this._ensurePortal();
    this._syncPortalVisibility();
    this._visibilityPollTimer = setInterval(() => this._syncPortalVisibility(), 700);
    this._render();
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
    if (this._wishstarTimer) {
      clearInterval(this._wishstarTimer);
      this._wishstarTimer = null;
    }
    if (this._visibilityPollTimer) {
      clearInterval(this._visibilityPollTimer);
      this._visibilityPollTimer = null;
    }
    if (this._portalHost && this._portalHost.parentNode) {
      this._portalHost.parentNode.removeChild(this._portalHost);
    }
    this._portalHost = null;
    this._portalShadow = null;
  }

  _onThemeChange() {
    this._render();
  }

  _onVisibilityChange() {
    const root = this._portalShadow;
    if (!root) return;
    const hidden = document.hidden;
    let pauseStyle = root.getElementById("pause-style");
    if (!pauseStyle) {
      pauseStyle = document.createElement("style");
      pauseStyle.id = "pause-style";
      root.appendChild(pauseStyle);
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
    const weatherEntity = this._config?.weather_entity;
    const oldWeatherState = weatherEntity ? this._hass?.states?.[weatherEntity]?.state : undefined;
    this._hass = hass;
    const newWeatherState = weatherEntity ? hass?.states?.[weatherEntity]?.state : undefined;

    if (!this._hasRenderedOnce || oldWeatherState !== newWeatherState) {
      this._render();
      this._hasRenderedOnce = true;
    }
  }

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

  // Verbesserung: der Wunschstern soll einmal aufleuchten, verschwinden und
  // dann an einer NEUEN Position wieder aufleuchten - nicht dauerhaft an
  // derselben Stelle. Dafür braucht's einen JS-Timer, der bei jedem Zyklus
  // eine frische Zufallsposition würfelt und neu rendert (ein reiner
  // CSS-Loop würde immer an der gleichen Stelle bleiben).
  _updateWishstar(events) {
    if (events.includes("wishstar")) {
      if (!this._wishstarTimer) {
        const cycle = { low: 12000, medium: 8000, high: 5000 }[this._config?.opacity_preset || "medium"] || 8000;
        const regen = () => {
          this._wishstarPos = {
            top: Math.random() * 60 + 8,
            left: Math.random() * 80 + 10,
          };
          this._render();
        };
        // WICHTIG: Timer wird ZUERST gesetzt, bevor regen() das erste Mal
        // läuft. regen() ruft _render() auf, was _updateWishstar() erneut
        // aufruft - ohne den Timer vorher zu setzen, würde das eine
        // Endlosschleife auslösen (regen() würde sich quasi selbst erneut
        // anstoßen, bevor der erste Aufruf fertig ist).
        this._wishstarTimer = setInterval(regen, cycle);
        regen();
      }
    } else {
      if (this._wishstarTimer) {
        clearInterval(this._wishstarTimer);
        this._wishstarTimer = null;
      }
      this._wishstarPos = null;
    }
  }

  _render() {
    if (!this._config) return;
    // Der Portal-Container existiert erst, sobald die Karte im DOM hängt
    // (connectedCallback). Wird _render() vorher aufgerufen, einfach
    // abbrechen - connectedCallback rendert danach ohnehin automatisch nach.
    if (!this._portalShadow) return;

    const events = this._resolveEvents();
    this._updateSnowAccumulation(events);
    this._updateWishstar(events);

    // Verbesserung (Bugfix): Startzeiten von Effekten aufräumen, die gerade
    // nicht mehr laufen - so fängt ein Effekt beim nächsten Auswählen
    // wieder frisch bei 0 an, statt eine alte, längst vergangene Startzeit
    // weiterzuverwenden.
    for (const key of Object.keys(this._periodicStartTimes)) {
      if (!events.includes(key)) delete this._periodicStartTimes[key];
    }

    let combinedCss = "";
    let combinedHtml = "";
    for (const event of events) {
      const renderer = RENDERERS[event];
      if (!renderer) continue;
      let cfgForRender = this._config;
      if (event === "snow") {
        cfgForRender = { ...this._config, _snowLevel: this._snowLevel };
      } else if (event === "wishstar") {
        cfgForRender = { ...this._config, _wishstarPos: this._wishstarPos };
      } else if (event === "santa" || event === "comet") {
        if (!this._periodicStartTimes[event]) this._periodicStartTimes[event] = Date.now();
        cfgForRender = { ...this._config, _startTime: this._periodicStartTimes[event] };
      } else if (event === "dog" || event === "squirrel" || event === "ducks") {
        // Höhe/Drift nur EINMAL pro Lauf-Zyklus würfeln und mitspeichern -
        // sonst würde ein Neu-Rendern mitten in der Animation zu einem
        // sichtbaren Sprung auf eine neue Höhe führen. Jeder dieser
        // Effekte hat einen eigenen sinnvollen Standard-Höhenbereich.
        if (!this._periodicStartTimes[event]) {
          const ranges = {
            dog: [10, 80],
            squirrel: [65, 88],
            ducks: [60, 88],
          };
          const [min, max] = ranges[event] || [10, 80];
          this._periodicStartTimes[event] = {
            start: Date.now(),
            startHeight: Math.random() * (max - min) + min,
            drift: Math.random() * 16 - 8,
          };
        }
        const state = this._periodicStartTimes[event];
        cfgForRender = {
          ...this._config,
          _startTime: state.start,
          _startHeight: state.startHeight,
          _drift: state.drift,
        };
      }
      const { css, html } = renderer(cfgForRender, this._hass, this);
      combinedCss += css;
      combinedHtml += html;
    }

    this._portalShadow.innerHTML = `<style>${combinedCss}</style>${combinedHtml}`;
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
            <option value="clouds" ${c.event === "clouds" ? "selected" : ""}>🌤️ Wolken-Drift</option>
            <option value="shooting_stars" ${c.event === "shooting_stars" ? "selected" : ""}>🌠 Sternschnuppen</option>
            <option value="stars" ${c.event === "stars" ? "selected" : ""}>✨ Sternenhimmel</option>
            <option value="wishstar" ${c.event === "wishstar" ? "selected" : ""}>⭐ Wunschstern-Funkeln</option>
            <option value="comet" ${c.event === "comet" ? "selected" : ""}>☄️ Komet</option>
            <option value="leaves" ${c.event === "leaves" ? "selected" : ""}>🍂 Laub</option>
            <option value="balloons" ${c.event === "balloons" ? "selected" : ""}>🎈 Luftballons</option>
            <option value="lights" ${c.event === "lights" ? "selected" : ""}>💡 Lichterkette</option>
            <option value="santa" ${c.event === "santa" ? "selected" : ""}>🎅 Weihnachtsmann</option>
            <option value="spider" ${c.event === "spider" ? "selected" : ""}>🕷️ Spinne mit Netz</option>
            <option value="dog" ${c.event === "dog" ? "selected" : ""}>🐕 Goldener Labrador</option>
            <option value="squirrel" ${c.event === "squirrel" ? "selected" : ""}>🐿️ Eichhörnchen</option>
            <option value="bats" ${c.event === "bats" ? "selected" : ""}>🦇 Fledermäuse</option>
            <option value="owl" ${c.event === "owl" ? "selected" : ""}>🦉 Eule</option>
            <option value="bee" ${c.event === "bee" ? "selected" : ""}>🐝 Bienen</option>
            <option value="ducks" ${c.event === "ducks" ? "selected" : ""}>🦆 Enten-Familie</option>
          </select>
        `, isWeatherAuto
          ? "Bei 'Automatisch' entscheidet der Zustand deiner Wetter-Entity unten, welcher Effekt läuft."
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
          : (COUNT_IS_INTERVAL_TEXT[c.event] || "Wie viele Partikel gleichzeitig zu sehen sind.")
        ) : ""}

        ${caps.opacity ? this._row("Deckkraft / Helligkeit", `
          <select id="opacity_preset" style="width:100%; padding:6px;">
            <option value="low" ${c.opacity_preset === "low" ? "selected" : ""}>👻 Zart (30%)</option>
            <option value="medium" ${c.opacity_preset === "medium" ? "selected" : ""}>👁️ Dezent (60%)</option>
            <option value="high" ${c.opacity_preset === "high" ? "selected" : ""}>✨ Kräftig (100%)</option>
          </select>
        `, isWeatherAuto
          ? "Ebenfalls EIN Wert für ALLE automatisch erkannten Effekte gemeinsam."
          : "Wie stark/deutlich der Effekt sichtbar ist."
        ) : ""}

        ${caps.color ? this._row("Farbmodus", `
          <select id="color_mode" style="width:100%; padding:6px;">
            <option value="auto" ${colorMode === "auto" ? "selected" : ""}>🌗 Auto (Theme-Abgleich)</option>
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
  description: "Erweiterte Wetter- und Event-Overlay-Karte mit universellem Theme-Support.",
  preview: false,
});
