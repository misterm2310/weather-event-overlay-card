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
  if (eventType === "confetti") {
    switch (preset) {
      case "low": return 20;
      case "high": return 70;
      case "medium": default: return 40;
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function colorStringToBrightness(colorStr) {
  if (!colorStr || colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)") return null;
  const nums = colorStr.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  const r = parseFloat(nums[0]), g = parseFloat(nums[1]), b = parseFloat(nums[2]);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

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

// Wie lange ein Effekt braucht, um beim Beenden sanft auszublenden statt
// abrupt zu verschwinden.
const FADE_DURATION_MS = 2500;

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

const COUNT_IS_INTERVAL_TEXT = {
  santa: "Wie oft der Weihnachtsmann vorbeifliegt: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min. (keine Partikelmenge, da es nur einen Schlitten gibt).",
  dog: "Wie oft der Labrador durchläuft: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min. (keine Partikelmenge, da es nur einen Hund gibt).",
  train: "Wie oft die Dampflok vorbeituckert: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min. (keine Partikelmenge, da es nur eine gibt).",

  comet: "Wie oft der Komet vorbeizieht: Wenig ≈ alle 5-6 Min., Mittel ≈ alle 3-4 Min., Viel ≈ alle 1-2 Min. (deutlich seltener als Sternschnuppen).",

  gnome_door: "Wie oft das Fenster der Wichteltür aufleuchtet: Wenig ≈ alle 40 Sek., Mittel ≈ alle 25 Sek., Viel ≈ alle 14 Sek.",
  birdhouse: "Wie oft ein Vogel am Häuschen vorbeifliegt: Wenig ≈ alle 100 Sek., Mittel ≈ alle 60 Sek., Viel ≈ alle 30 Sek.",
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
  train: { count: true, opacity: true, color: false },

  comet: { count: true, opacity: true, color: true },
  bats: { count: true, opacity: true, color: true },
  owl: { count: false, opacity: true, color: false },
  bee: { count: true, opacity: true, color: false },
  clouds: { count: true, opacity: true, color: true },

  gnome_door: { count: true, opacity: true, color: false },
  birdhouse: { count: true, opacity: true, color: false },
  wishstar: { count: false, opacity: true, color: true },
  birthday: { count: true, opacity: true, color: false },
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
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const flightPct = Math.min(30, (18 / interval) * 100).toFixed(2);
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
          <path d="M60,18 Q100,22 148,26 M128,18 Q140,22 148,26" fill="none" stroke="#3a2a1a" stroke-width="1.2" opacity="0.8"/>
          <path d="M148,44 Q142,30 154,20 Q162,13 172,13 L212,13 Q224,13 224,25 L224,37 Q224,44 214,44 Z"
                fill="#b91c1c" stroke="#d4af37" stroke-width="2"/>
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





function renderTrain(cfg, hass, hostEl) {
  // Dampflok mit VIER Waggons statt zwei, jeder mit einer eigenen Ladung
  // (Obst, Bauklötze, Geschenke, Holzscheite) statt überall der gleichen
  // Kohle. Die Lok selbst sitzt in einer eigenen <g transform="translate">-
  // Gruppe mit lokalen Koordinaten, lässt sich also einfach über LOCO_X
  // weiter nach hinten schieben, wenn noch mehr Waggons dazukommen sollen.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const walkPct = Math.min(30, (30 / interval) * 100).toFixed(2);
  const elapsedSec = cfg._startTime ? (Date.now() - cfg._startTime) / 1000 : 0;
  const delaySec = (-(elapsedSec % interval)).toFixed(2);

  // Vier Waggon-Startpositionen (93 Einheiten Abstand) + Lok-Versatz danach.
  const WAGON_X = [4, 97, 190, 283];
  const LOCO_X = 384;

  const smokeHtml = [0, 1, 2].map((i) => `
    <circle class="train-smoke" cx="${76 - i * 11}" cy="${-1 - i * 3}" r="${5.5 + i * 1.4}" fill="#d9d9d9" stroke="#1a1a1a" stroke-width="1.5"
      style="animation-duration:${(2.6 + i * 0.25).toFixed(2)}s; animation-delay:${(i * 0.55).toFixed(2)}s;"/>
  `).join("");

  const css = `
    .train-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .train-box {
      position: absolute; bottom: 1vh; left: -240px; width: 216px; height: 37px;
      animation: train-drive ${interval}s linear infinite; animation-delay: ${delaySec}s; will-change: transform;
    }
    @keyframes train-drive {
      0% { transform: translateX(0); }
      ${walkPct}% { transform: translateX(calc(100vw + 256px)); }
      100% { transform: translateX(calc(100vw + 256px)); }
    }
    .train-wheel {
      animation: train-wheel-spin 0.6s linear infinite;
      transform-box: fill-box; transform-origin: center;
    }
    @keyframes train-wheel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .train-smoke {
      animation-name: train-smoke-rise; animation-timing-function: ease-out; animation-iteration-count: infinite;
      transform-box: fill-box; transform-origin: center;
    }
    @keyframes train-smoke-rise {
      0%   { transform: translate(0,0) scale(0.5); opacity: 0.9; }
      100% { transform: translate(-95px,-8px) scale(1.7); opacity: 0; }
    }
  `;

  const wheel = (cx, cy, r) => `
    <g class="train-wheel">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ee1c1c" stroke="#1a1a1a" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${(r * 0.32).toFixed(1)}" fill="#1a1a1a"/>
    </g>
  `;

  // Vier verschiedene Ladungen, die statt der einheitlichen Kohle oben auf
  // den Waggon kommen - jede innerhalb desselben Bereichs (x=2-81, y=8-32),
  // damit sie zum Waggon-Umriss passt.
  const CARGO = {
    food: `
      <circle cx="14" cy="25" r="7.5" fill="#d81f26"/>
      <circle cx="29" cy="21" r="8" fill="#f5a623"/>
      <circle cx="45" cy="24" r="7.5" fill="#7cb342"/>
      <circle cx="60" cy="20" r="8" fill="#d81f26"/>
      <circle cx="74" cy="24" r="7" fill="#f5a623"/>
      <path d="M14,17.5 L15,14 M29,13 L30,10 M60,12 L61,9" stroke="#4a7a2a" stroke-width="1.5" stroke-linecap="round"/>
    `,
    toys: `
      <rect x="4" y="14" width="14" height="18" fill="#4a90d9" stroke="#1a1a1a" stroke-width="1.5"/>
      <rect x="20" y="8" width="14" height="24" fill="#ffd93d" stroke="#1a1a1a" stroke-width="1.5"/>
      <rect x="36" y="17" width="14" height="15" fill="#e63946" stroke="#1a1a1a" stroke-width="1.5"/>
      <rect x="52" y="10" width="14" height="22" fill="#7cb342" stroke="#1a1a1a" stroke-width="1.5"/>
      <rect x="68" y="15" width="13" height="17" fill="#9b59b6" stroke="#1a1a1a" stroke-width="1.5"/>
    `,
    presents: `
      <rect x="4" y="16" width="20" height="16" fill="#4a90d9" stroke="#1a1a1a" stroke-width="1.5"/>
      <circle cx="14" cy="16" r="2.8" fill="#ffd93d" stroke="#1a1a1a" stroke-width="1"/>
      <rect x="30" y="10" width="22" height="22" fill="#e63946" stroke="#1a1a1a" stroke-width="1.5"/>
      <circle cx="41" cy="10" r="2.8" fill="#7cb342" stroke="#1a1a1a" stroke-width="1"/>
      <rect x="58" y="15" width="20" height="17" fill="#9b59b6" stroke="#1a1a1a" stroke-width="1.5"/>
      <circle cx="68" cy="15" r="2.8" fill="#ffd93d" stroke="#1a1a1a" stroke-width="1"/>
    `,
    wood: `
      <circle cx="12" cy="25" r="7" fill="#8a5a2f" stroke="#4a2f18" stroke-width="1.5"/>
      <circle cx="12" cy="25" r="3" fill="#c9a05a"/>
      <circle cx="27" cy="21" r="7.5" fill="#6b4423" stroke="#4a2f18" stroke-width="1.5"/>
      <circle cx="27" cy="21" r="3.2" fill="#a67c3d"/>
      <circle cx="43" cy="25" r="7" fill="#8a5a2f" stroke="#4a2f18" stroke-width="1.5"/>
      <circle cx="43" cy="25" r="3" fill="#c9a05a"/>
      <circle cx="58" cy="21" r="7.5" fill="#6b4423" stroke="#4a2f18" stroke-width="1.5"/>
      <circle cx="58" cy="21" r="3.2" fill="#a67c3d"/>
      <circle cx="73" cy="25" r="7" fill="#8a5a2f" stroke="#4a2f18" stroke-width="1.5"/>
      <circle cx="73" cy="25" r="3" fill="#c9a05a"/>
    `,
  };

  const wagon = (x, cargoKey) => `
    <g transform="translate(${x},0)">
      ${CARGO[cargoKey]}
      <path d="M0,32 L83,32 Q87,32 87,38 L87,48 Q87,52 83,52 L4,52 Q0,52 0,48 Z" fill="#ee1c1c" stroke="#1a1a1a" stroke-width="2.5"/>
      <rect x="8" y="39" width="71" height="9" fill="#ffffff"/>
      ${wheel(15, 58, 6.5)}
      ${wheel(43, 58, 6.5)}
      ${wheel(71, 58, 6.5)}
    </g>
  `;

  const couplingsHtml = [
    `M${WAGON_X[0] + 87},50 L${WAGON_X[1]},50`,
    `M${WAGON_X[1] + 87},50 L${WAGON_X[2]},50`,
    `M${WAGON_X[2] + 87},50 L${WAGON_X[3]},50`,
    `M${WAGON_X[3] + 87},50 L${LOCO_X},50`,
  ].map((d) => `<path d="${d}" stroke="#1a1a1a" stroke-width="2"/>`).join("");

  // Die komplette Lok in lokalen Koordinaten (0 = eigener Anfang), wird
  // per translate(LOCO_X,0) an die richtige Stelle geschoben.
  const locoHtml = `
    <g transform="translate(${LOCO_X},0)">
      <!-- Fahrgestell-Rahmen -->
      <rect x="0" y="42" width="96" height="8" fill="#3a3a3a"/>
      <!-- Roter Kessel -->
      <rect x="2" y="18" width="60" height="26" rx="10" fill="#ee1c1c" stroke="#1a1a1a" stroke-width="2.5"/>
      <path d="M18,18 L18,8 M25,18 L23,10" stroke="#ee1c1c" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Kabinen-Aufbau mit Fähnchen -->
      <path d="M56,8 L56,2 L62,8 Z" fill="#ee1c1c"/>
      <rect x="34" y="6" width="24" height="22" rx="2" fill="#f5f0e6" stroke="#1a1a1a" stroke-width="2.5"/>
      <path d="M38,22 L42,12" stroke="#1a1a1a" stroke-width="2"/>
      <!-- Schwarze runde Nase -->
      <path d="M60,18 Q86,13 100,24 Q100,37 90,42 Q72,44 60,40 Z" fill="#1a1a1a"/>
      <circle cx="91" cy="26" r="2.3" fill="#ee1c1c"/>
      <!-- Schornstein -->
      <path d="M73,17 L69,5 Q69,1 75,1 L86,1 Q92,1 92,5 L88,17 Z" fill="#f5f0e6" stroke="#1a1a1a" stroke-width="2.5"/>
      <!-- Dampf -->
      <g>${smokeHtml}</g>
      <!-- Kuhfänger -->
      <path d="M99,42 Q110,46 116,54 L94,54 Z" fill="#ee1c1c" stroke="#1a1a1a" stroke-width="2"/>
      <!-- Räder Lok -->
      <path d="M22,50 L56,50" stroke="#1a1a1a" stroke-width="3"/>
      ${wheel(20, 54, 10)}
      ${wheel(56, 54, 10)}
      ${wheel(88, 56, 7)}
    </g>
  `;

  const html = `
    <div class="train-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <div class="train-box">
        <svg viewBox="0 -24 520 90" preserveAspectRatio="xMidYMid meet">
          <!-- Boden-/Gleislinie -->
          <path d="M2,58 L516,58" stroke="#1a1a1a" stroke-width="2"/>

          <!-- Vier Waggons, unterschiedlich beladen -->
          ${wagon(WAGON_X[0], "food")}
          ${wagon(WAGON_X[1], "toys")}
          ${wagon(WAGON_X[2], "presents")}
          ${wagon(WAGON_X[3], "wood")}

          <!-- Kupplungen zwischen allen Waggons und zur Lok -->
          ${couplingsHtml}

          ${locoHtml}
        </svg>
      </div>
    </div>
  `;
  return { css, html };
}

function renderDog(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 340, medium: 210, high: 100 }[cfg.count_preset || "medium"] || 210;
  const walkPct = Math.min(30, (20 / interval) * 100).toFixed(2);
  const startHeight = (typeof cfg._startHeight === "number" ? cfg._startHeight : Math.random() * 70 + 10).toFixed(2);
  const drift = typeof cfg._drift === "number" ? cfg._drift : (Math.random() * 16 - 8);
  const driftHeight = (parseFloat(startHeight) + drift).toFixed(2);
  const elapsedSec = cfg._startTime ? (Date.now() - cfg._startTime) / 1000 : 0;
  const delaySec = (-(elapsedSec % interval)).toFixed(2);

  const css = `
    .dog-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .dog-walk-box {
      position: absolute; top: ${startHeight}vh; left: -185px; width: 165px; height: 55px;
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
          <svg viewBox="-25 0 145 55" preserveAspectRatio="xMidYMid meet">
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
            <path d="M24,22 Q4,8 -14,14 Q-8,24 2,26 Q10,28 24,24 Z" fill="#d4a25c"/>
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

function renderBats(cfg, hass, hostEl) {
  // Verbesserung (Bugfix): Fledermäuse waren fest schwarz - auf einem
  // dunklen Theme-Hintergrund praktisch unsichtbar (gleiches Problem wie
  // vorher bei den Wolken). Jetzt theme-abhängig: dunkles Grau-Violett auf
  // hellem Hintergrund, helleres Grau-Violett auf dunklem Hintergrund -
  // bleibt dabei bewusst "nächtlich" statt bunt.
  const color = resolveDynamicColor(cfg.color, hass, "#2a2530", "#cbc4d9", hostEl);
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
        <path d="M20,10 L2,0 L9,7 L0,10 L9,13 L2,20 Z" fill="${color}"/>
        <path d="M20,10 L38,0 L31,7 L40,10 L31,13 L38,20 Z" fill="${color}"/>
        <ellipse cx="20" cy="10" rx="3" ry="4" fill="${color}"/>
        <path d="M17,7 L14,3 M23,7 L26,3" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
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

function renderBirdhouse(cfg, hass, hostEl) {
  // Vogelhäuschen: sitzt fest oben links (kleiner als die Eule), immer
  // sichtbar. Periodisch fliegt ein kleiner Vogel von links ins Bild,
  // "landet" kurz am Einflugloch (kurze Pause + Flügelschlag), fliegt dann
  // weiter nach rechts aus dem Bild. Nutzt dieselbe Startzeit-Technik wie
  // Weihnachtsmann/Komet/Dampflok, damit ein Neu-Rendern den Anflug nicht
  // unterbricht.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const interval = { low: 100, medium: 60, high: 30 }[cfg.count_preset || "medium"] || 60;
  const elapsedSec = cfg._startTime ? (Date.now() - cfg._startTime) / 1000 : 0;
  const delaySec = (-(elapsedSec % interval)).toFixed(2);
  // Anteil des Zyklus für den kompletten Anflug+Vorbeiflug (Rest ist Pause,
  // in der der Vogel unsichtbar wartet).
  const flightPct = Math.min(35, (9 / interval) * 100).toFixed(2);
  const landPct = (flightPct * 0.4).toFixed(2);
  const leavePct = (flightPct * 0.6).toFixed(2);

  const css = `
    .birdhouse-box {
      position: fixed; top: 2vh; left: 1vw; width: 58px; height: 78px;
      pointer-events: none; z-index: 999997;
    }
    .bird-fly-container {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 999999; overflow: hidden;
    }
    .bird-fly-box {
      position: absolute; top: 6vh; left: -6vw; width: 30px; height: 24px;
      animation-name: bird-visit; animation-timing-function: ease-in-out; animation-iteration-count: infinite;
      animation-duration: ${interval}s; animation-delay: ${delaySec}s; will-change: transform;
    }
    @keyframes bird-visit {
      0%   { transform: translate(0, 4vh); opacity: 0; }
      3%   { opacity: ${finalOpacity}; }
      ${landPct}% { transform: translate(9vw, 0); opacity: ${finalOpacity}; }
      ${leavePct}% { transform: translate(9vw, 0); opacity: ${finalOpacity}; }
      ${flightPct}% { transform: translate(112vw, -3vh); opacity: ${finalOpacity}; }
      100% { transform: translate(112vw, -3vh); opacity: 0; }
    }
    .bird-wing {
      animation: bird-wing-flap 0.15s ease-in-out infinite alternate;
      transform-origin: 15px 10px;
    }
    @keyframes bird-wing-flap {
      0% { transform: scaleY(1) rotate(0deg); }
      100% { transform: scaleY(0.5) rotate(-15deg); }
    }
  `;
  const html = `
    <div class="birdhouse-box" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 58 78" style="width:100%; height:100%;">
        <path d="M-6,68 Q26,58 62,68 L62,74 Q26,66 -6,74 Z" fill="#5a3d24"/>
        <path d="M4,10 L29,-6 L54,10 Z" fill="#a83a2a" stroke="#6b2015" stroke-width="2"/>
        <path d="M6,12 L52,12 L48,54 Q48,58 44,58 L14,58 Q10,58 10,54 Z" fill="#c68a3d" stroke="#6b4a2f" stroke-width="2"/>
        <circle cx="29" cy="32" r="8" fill="#3a2712"/>
        <path d="M20,44 L38,44" stroke="#6b4a2f" stroke-width="3" stroke-linecap="round"/>
        <path d="M29,58 L29,64" stroke="#6b4a2f" stroke-width="3"/>
      </svg>
    </div>
    <div class="bird-fly-container" aria-hidden="true">
      <div class="bird-fly-box">
        <svg viewBox="0 0 33 24" style="width:100%; height:100%;">
          <ellipse cx="15" cy="12" rx="9" ry="6.5" fill="#4a90d9"/>
          <circle cx="24" cy="9" r="4.5" fill="#4a90d9"/>
          <path d="M28,8 L32,9 L28,11 Z" fill="#e8952a"/>
          <circle cx="25" cy="8" r="1" fill="#1a1a1a"/>
          <path class="bird-wing" d="M15,10 Q6,4 3,12 Q9,14 15,10 Z" fill="#3a7ab8"/>
        </svg>
      </div>
    </div>
  `;
  return { css, html };
}

function renderOwl(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;

  const css = `
    .owl-container {
      position: fixed; top: 2vh; left: 1vw; width: 95px; height: 100px;
      pointer-events: none; z-index: 999999;
    }
    .owl-head {
      animation: owl-turn 9s ease-in-out infinite;
      transform-origin: 50% 62%;
    }
    .owl-body {
      animation: owl-breathe 4s ease-in-out infinite;
      transform-origin: 50% 72%;
    }
    .owl-eye-lid.left {
      animation: owl-blink-left 9s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }
    .owl-eye-lid.right {
      animation: owl-blink-right 9s ease-in-out infinite;
      transform-origin: center;
      transform-box: fill-box;
    }
    @keyframes owl-turn {
      0%, 40% { transform: rotate(0deg); }
      50% { transform: rotate(-8deg); }
      60%, 90% { transform: rotate(0deg); }
      95% { transform: rotate(6deg); }
      100% { transform: rotate(0deg); }
    }
    @keyframes owl-breathe {
      0%, 100% { transform: scale(1, 1); }
      50% { transform: scale(1.02, 0.98); }
    }
    @keyframes owl-blink-left {
      0%, 18%, 26%, 100% { transform: scaleY(0); }
      22% { transform: scaleY(1); }
    }
    @keyframes owl-blink-right {
      0%, 58%, 66%, 100% { transform: scaleY(0); }
      62% { transform: scaleY(1); }
    }
  `;
  const html = `
    <div class="owl-container" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 120 130" style="width:100%; height:100%;">
        <path d="M92,10 A14,14 0 1,0 92,38 A11,11 0 1,1 92,10 Z" fill="#f4ecd8" opacity="0.8"/>
        <path d="M0,112 Q60,102 120,112 L120,120 Q60,110 0,120 Z" fill="#5a3d24"/>
        <path d="M14,108 L4,100 M100,108 L112,100" stroke="#5a3d24" stroke-width="3" stroke-linecap="round"/>
        <g class="owl-body">
          <path d="M28,58 Q16,78 24,103 Q30,105 36,98 Q32,78 38,60 Z" fill="#5a3d24"/>
          <path d="M92,58 Q104,78 96,103 Q90,105 84,98 Q88,78 82,60 Z" fill="#5a3d24"/>
          <ellipse cx="60" cy="82" rx="32" ry="30" fill="#6b4a2f"/>
          <ellipse cx="60" cy="88" rx="20" ry="22" fill="#8a6238"/>
          <path d="M48,74 L60,82 L72,74 M46,84 L60,92 L74,84 M48,96 L60,104 L72,96"
                fill="none" stroke="#6b4a2f" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M50,110 L46,118 M50,110 L50,120 M50,110 L54,118
                    M70,110 L66,118 M70,110 L70,120 M70,110 L74,118"
                stroke="#e8952a" stroke-width="2.5" stroke-linecap="round"/>
        </g>
        <g class="owl-head">
          <path d="M40,24 L32,4 L48,20 Z" fill="#5a3d24"/>
          <path d="M80,24 L88,4 L72,20 Z" fill="#5a3d24"/>
          <circle cx="60" cy="47" r="28" fill="#8a6238"/>
          <circle cx="48" cy="46" r="13" fill="#f4ead9"/>
          <circle cx="72" cy="46" r="13" fill="#f4ead9"/>
          <circle cx="48" cy="46" r="8" fill="#e8952a"/>
          <circle cx="72" cy="46" r="8" fill="#e8952a"/>
          <circle cx="48" cy="46" r="4" fill="#1a1a1a"/>
          <circle cx="72" cy="46" r="4" fill="#1a1a1a"/>
          <circle cx="46" cy="43" r="1.6" fill="#ffffff"/>
          <circle cx="70" cy="43" r="1.6" fill="#ffffff"/>
          <circle class="owl-eye-lid left" cx="48" cy="46" r="13" fill="#8a6238"/>
          <circle class="owl-eye-lid right" cx="72" cy="46" r="13" fill="#8a6238"/>
          <path d="M54,56 L66,56 L60,66 Z" fill="#e8952a"/>
        </g>
      </svg>
    </div>
  `;
  return { css, html };
}

function renderBee(cfg, hass, hostEl) {
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

// Verbesserung: erzeugt ein verzweigtes Eisblumen-/Raureif-Muster
// mathematisch (wie schon beim Spinnennetz), das von einer Ecke (0,0)
// diagonal ins Bild hineinwächst - Hauptäste mit kleinen Seitenzweigen.
function renderGnomeDoor(cfg, hass, hostEl) {
  // Wichteltür: sitzt fest unten rechts, das runde Fenster leuchtet immer
  // wieder für eine Weile warm auf. Weihnachtlich gestaltet nach Vorlage:
  // dunkelgrüne Tür, ein Kranz aus kleinen Blättern/Beeren mit roter
  // Schleife rund ums Fenster, kleine Herz-Scharniere am linken Rand.
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const finalOpacity = isHigh ? 1 : opacity;
  const cycle = { low: 40, medium: 25, high: 14 }[cfg.count_preset || "medium"] || 25;

  // Kranz: Ring aus kleinen Blatt-/Beeren-Punkten um Fenster-Mittelpunkt
  // (30,33), mathematisch verteilt statt von Hand gesetzt.
  const wreathDots = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
    const rx = 30 + 9.5 * Math.cos(angle);
    const ry = 33 + 9.5 * Math.sin(angle);
    const isBerry = i % 4 === 1;
    return `<circle cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" r="${isBerry ? 1.5 : 2.1}" fill="${isBerry ? "#c0392b" : "#2e7d4f"}"/>`;
  }).join("");

  const css = `
    .gnome-door-box {
      position: fixed; bottom: 6vh; right: 42px; width: 54px; height: 62px;
      pointer-events: none; z-index: 9999;
    }
    .gnome-path-box {
      position: fixed; bottom: 0; right: 42px; width: 54px; height: 6vh;
      pointer-events: none; z-index: 9998;
    }
    .gnome-tree-box {
      position: fixed; bottom: 6vh; right: 4px; width: 32px; height: 66px;
      pointer-events: none; z-index: 9998;
    }
    .tree-light {
      animation: tree-light-twinkle 1.8s ease-in-out infinite;
    }
    @keyframes tree-light-twinkle {
      0%, 100% { opacity: 0.35; }
      50% { opacity: 1; }
    }
    .gnome-lantern-box {
      position: fixed; bottom: 6vh; right: 137px; width: 26px; height: 58px;
      pointer-events: none; z-index: 9998;
    }
    .gnome-mailbox-box {
      position: fixed; bottom: 0; right: 99px; width: 32px; height: 52px;
      pointer-events: none; z-index: 9998;
    }
    .gnome-light {
      animation: gnome-light-flicker ${cycle}s ease-in-out infinite;
    }
    .lantern-flame {
      animation: lantern-flicker 2.4s ease-in-out infinite;
      transform-box: fill-box; transform-origin: center;
    }
    @keyframes lantern-flicker {
      0%, 100% { opacity: 0.88; transform: scale(1); }
      20% { opacity: 1; transform: scale(1.08); }
      35% { opacity: 0.72; transform: scale(0.92); }
      50% { opacity: 0.96; transform: scale(1.04); }
      65% { opacity: 0.8; transform: scale(0.96); }
      82% { opacity: 1; transform: scale(1.06); }
    }
    @keyframes gnome-light-flicker {
      0%, 55% { opacity: 0.18; }
      65%, 88% { opacity: 1; filter: drop-shadow(0 0 5px #ffd97a); }
      98%, 100% { opacity: 0.18; }
    }
  `;
  const html = `
    <div class="gnome-tree-box" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 40 66" style="width:100%; height:100%;">
        <path d="M4,58 L36,58 L20,38 Z" fill="#1f5c3f" stroke="#0f3d28" stroke-width="1.5"/>
        <path d="M8,42 L32,42 L20,24 Z" fill="#256b48" stroke="#0f3d28" stroke-width="1.5"/>
        <path d="M12,26 L28,26 L20,10 Z" fill="#2a7a52" stroke="#0f3d28" stroke-width="1.5"/>
        <rect x="17" y="58" width="6" height="8" fill="#5a3d24"/>
        <path d="M20,10 L20,6" stroke="#ffd93d" stroke-width="1.5"/>
        <circle cx="20" cy="5" r="2" fill="#ffd93d"/>
        <path d="M11,50 Q16,55 20,53 Q25,56 29,50 Q23,43 14,36 Q20,41 26,36 Q20,29 17,21 Q21,25 24,21"
          fill="none" stroke="#2a2a2a" stroke-width="0.7" opacity="0.6"/>
        <circle class="tree-light" cx="11" cy="50" r="1.7" fill="#e63946" style="animation-delay:0s;"/>
        <circle class="tree-light" cx="20" cy="53" r="1.7" fill="#ffd93d" style="animation-delay:0.3s;"/>
        <circle class="tree-light" cx="29" cy="50" r="1.7" fill="#4a90d9" style="animation-delay:0.6s;"/>
        <circle class="tree-light" cx="14" cy="36" r="1.6" fill="#7cb342" style="animation-delay:0.9s;"/>
        <circle class="tree-light" cx="26" cy="36" r="1.6" fill="#e63946" style="animation-delay:1.2s;"/>
        <circle class="tree-light" cx="17" cy="21" r="1.4" fill="#ffd93d" style="animation-delay:1.5s;"/>
        <circle class="tree-light" cx="24" cy="21" r="1.4" fill="#4a90d9" style="animation-delay:0.45s;"/>
      </svg>
    </div>
    <div class="gnome-mailbox-box" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 26 46" style="width:100%; height:100%;">
        <rect x="11" y="20" width="4" height="24" fill="#1a1a1a"/>
        <path d="M11,42 Q13,44 15,42" stroke="#1a1a1a" stroke-width="1.4" fill="none"/>
        <path d="M2,15 Q2,7 9,7 L15,7 Q22,7 22,15 L22,19 L2,19 Z" fill="#3a4a3a" stroke="#1a1a1a" stroke-width="1"/>
        <rect x="2" y="16" width="20" height="3" fill="#1a1a1a"/>
        <path d="M20,9 L25,7 L25,12 Z" fill="#c0392b" stroke="#6b1810" stroke-width="0.6"/>
        <text x="12" y="14" font-size="6" font-family="Georgia, serif" fill="#f0ebe0" text-anchor="middle" font-weight="bold">Olaf</text>
      </svg>
    </div>
    <div class="gnome-lantern-box" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 26 58" style="width:100%; height:100%;">
        <path d="M8,55 Q13,52 18,55 L19.5,57.5 L6.5,57.5 Z" fill="#1a1a1a"/>
        <rect x="11.5" y="19" width="3" height="31" fill="#1a1a1a"/>
        <path d="M7,19 L19,19 L20.5,10 L17,7 L9,7 L5.5,10 Z" fill="#fff3d0" opacity="0.14"/>
        <path d="M7,19 L19,19 L20.5,10 L17,7 L9,7 L5.5,10 Z" fill="none" stroke="#1a1a1a" stroke-width="1.4"/>
        <path d="M9.5,19 L9.5,9 M16.5,19 L16.5,9" stroke="#1a1a1a" stroke-width="0.9"/>
        <circle class="lantern-flame" cx="13" cy="14" r="3.6" fill="#ffd97a" style="filter: drop-shadow(0 0 3px #ffb347);"/>
        <path d="M7.5,7 L18.5,7 L13,1.5 Z" fill="#1a1a1a"/>
        <circle cx="13" cy="0.8" r="1.1" fill="#1a1a1a"/>
      </svg>
    </div>
    <div class="gnome-path-box" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 54 60" preserveAspectRatio="none" style="width:100%; height:100%;">
        <path d="M20,0 L34,0 L48,60 L6,60 Z" fill="#9a9186" stroke="#5a5548" stroke-width="1.5"/>
        <path d="M15,20 L39,20 M10,40 L44,40" stroke="#5a5548" stroke-width="1.2" opacity="0.5"/>
      </svg>
    </div>
    <div class="gnome-door-box" style="opacity:${finalOpacity};" aria-hidden="true">
      <svg viewBox="0 0 60 76" style="width:100%; height:100%;">
        <path d="M15,74 L15,34 Q15,16 30,16 Q45,16 45,34 L45,74 Z" fill="#1f5c3f" stroke="#0f3d28" stroke-width="2.2"/>
        <path d="M21,72 L21,21 M27,72 L27,17.5 M33,72 L33,17.5 M39,72 L39,21" stroke="#0f3d28" stroke-width="1" opacity="0.55"/>
        <circle cx="40" cy="56" r="2.2" fill="#d4af37" stroke="#8a6f1f" stroke-width="0.8"/>
        <path d="M15,45 C15,43 12,43 12,45 C12,47 15,49 15,51 C15,49 18,47 18,45 C18,43 15,43 15,45 Z" fill="#c0392b" stroke="#6b1810" stroke-width="0.8"/>
        <path d="M15,60 C15,58 12,58 12,60 C12,62 15,64 15,66 C15,64 18,62 18,60 C18,58 15,58 15,60 Z" fill="#c0392b" stroke="#6b1810" stroke-width="0.8"/>
        <circle class="gnome-light" cx="30" cy="33" r="6.5" fill="#ffd97a"/>
        <circle cx="30" cy="33" r="6.5" fill="none" stroke="#0f3d28" stroke-width="1.6"/>
        <path d="M30,26.5 L30,39.5 M23.5,33 L36.5,33" stroke="#0f3d28" stroke-width="1"/>
        ${wreathDots}
        <path d="M30,23.5 L25,18 Q23,16 25.5,15 Q28,14.5 29.5,17.5 L30,23.5 L30.5,17.5 Q32,14.5 34.5,15 Q37,16 35,18 Z" fill="#c0392b" stroke="#6b1810" stroke-width="0.8"/>
        <circle cx="30" cy="18.5" r="1.6" fill="#8e2419"/>
      </svg>
    </div>
  `;
  return { css, html };
}

function renderClouds(cfg, hass, hostEl) {
  // Verbesserung (Bugfix): Wolken waren fest hellgrau/weiß - auf einem
  // hellen Theme-Hintergrund praktisch unsichtbar. Jetzt wie die anderen
  // Wetter-Effekte theme-abhängig: dunkles Grau auf hellem Hintergrund,
  // helles Grau auf dunklem Hintergrund.
  const color = resolveDynamicColor(cfg.color, hass, "#57626f", "#e8edf2", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const count = getParticleCount(cfg.count_preset || "medium", "clouds");

  const clouds = getCachedRandomSet("clouds", count, (_, i) => {
    // Verbesserung: Zeit-Versatz gleichmäßig über den Zyklus verteilt
    // (Basis-Position nach Index) statt komplett zufällig - sonst können
    // sich alle Wolken zufällig häufen und es entstehen Lücken ganz ohne
    // sichtbare Wolke. Etwas Zufalls-Jitter obendrauf, damit es trotzdem
    // nicht "maschinell" gleichmäßig aussieht.
    const jitter = Math.random() * 12 - 6;
    return {
      top: (Math.random() * 82).toFixed(2),
      scale: (Math.random() * 0.7 + 0.7).toFixed(2),
      dur: (Math.random() * 40 + 60).toFixed(2),
      delay: (-(i / count) * 85 + jitter).toFixed(2),
      baseOp: (Math.random() * 0.18 + 0.28).toFixed(2),
    };
  });

  const cloudHtml = clouds.map((c) => {
    const op = isHigh ? Math.max(parseFloat(c.baseOp), 0.65) : (parseFloat(c.baseOp) * opacity);
    return `<div class="cloud" style="top:${c.top}vh; transform:scale(${c.scale}); animation-duration:${c.dur}s; animation-delay:${c.delay}s; opacity:${op.toFixed(2)}; background:${color}; box-shadow: 6vw 1vh 0 -1vh ${color}, -5vw 1.5vh 0 -1.5vh ${color}, 3vw -1vh 0 -0.5vh ${color};"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("clouds-container")}
    .cloud {
      position: absolute; left: -30vw; width: 22vw; height: 8vh;
      border-radius: 50%;
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

function renderWishStar(cfg, hass, hostEl) {
  const color = resolveDynamicColor(cfg.color, hass, "#1a1a2e", "#ffffff", hostEl);
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";
  const peak = isHigh ? 1 : Math.max(opacity, 0.5);
  const pos = cfg._wishstarPos || { top: 30, left: 50 };

  const css = `
    .wishstar {
      position: fixed; top: ${pos.top.toFixed(2)}vh; left: ${pos.left.toFixed(2)}vw; width: 70px; height: 70px;
      pointer-events: none; z-index: 9999;
      animation: wishstar-flash 3s ease-in-out 1 forwards;
      will-change: opacity, transform;
    }
    .wishstar-halo {
      position: absolute; inset: 0; border-radius: 50%;
      background: radial-gradient(circle, ${color} 0%, ${color}99 30%, transparent 72%);
      filter: blur(5px);
    }
    .wishstar-ray {
      position: absolute; top: 50%; left: 50%; filter: blur(2.5px); opacity: 0.55;
    }
    .wishstar-ray.v { width: 2.5px; height: 100%; background: linear-gradient(${color}, transparent 38%, transparent 62%, ${color}); transform: translate(-50%, -50%); }
    .wishstar-ray.h { width: 100%; height: 2.5px; background: linear-gradient(90deg, ${color}, transparent 38%, transparent 62%, ${color}); transform: translate(-50%, -50%); }
    .wishstar-core {
      position: absolute; top: 50%; left: 50%; width: 16px; height: 16px; margin: -8px;
      border-radius: 50%; background: #ffffff;
      box-shadow: 0 0 14px 5px ${color};
    }
    @keyframes wishstar-flash {
      0% { opacity: 0; transform: scale(0.3); }
      30% { opacity: ${peak}; transform: scale(1.2); }
      55% { opacity: ${peak}; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.3); }
    }
  `;
  const html = `
    <div class="wishstar" aria-hidden="true">
      <div class="wishstar-halo"></div>
      <div class="wishstar-ray v"></div>
      <div class="wishstar-ray h"></div>
      <div class="wishstar-core"></div>
    </div>
  `;
  return { css, html };
}

function renderStars(cfg, hass, hostEl) {
  // Verbesserung (Ressourcen): Sterne "teleportieren" jetzt rein über CSS,
  // ohne laufenden JS-Timer. Jeder Stern bekommt 4 zufällige Positionen
  // fest in seine EIGENE Keyframe-Animation eingebacken (einmalig beim
  // Rendern berechnet). Der Sprung zwischen den Positionen passiert exakt
  // dann, wenn die Deckkraft gerade bei 0 ist (also während der Stern
  // unsichtbar ist) - dadurch wirkt es wie ein Teleport, obwohl komplett
  // vom Browser selbst animiert, ganz ohne wiederkehrende JS-Prüfungen.
  const color = resolveDynamicColor(cfg.color, hass, "#000000", "#ffffff", hostEl);
  const count = getParticleCount(cfg.count_preset || "medium", "stars");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";

  const stars = getCachedRandomSet("stars", count, () => ({
    waypoints: Array.from({ length: 4 }, () => ({
      top: (Math.random() * 85).toFixed(2),
      left: (Math.random() * 100).toFixed(2),
    })),
    size: (Math.random() * 2.5 + 2).toFixed(2),
    dur: (Math.random() * 6 + 14).toFixed(2),
    delay: (Math.random() * -20).toFixed(2),
    baseOp: (Math.random() * 0.4 + 0.55).toFixed(2),
    animId: Math.random().toString(36).slice(2, 9),
  }));

  let keyframesCss = "";
  const starHTML = stars.map((s) => {
    const peak = isHigh
      ? Math.max(parseFloat(s.baseOp), 0.95)
      : Math.max(parseFloat(s.baseOp) * opacity, 0.35);
    const glow = (parseFloat(s.size) * 2.5).toFixed(2);
    const [p1, p2, p3, p4] = s.waypoints;
    const name = `star-tp-${s.animId}`;
    // Vier Wegpunkte, je ein Viertel des Zyklus: aufblitzen -> halten ->
    // verblassen -> (unsichtbar) Position wechseln -> nächster Wegpunkt.
    keyframesCss += `
      @keyframes ${name} {
        0%   { opacity: 0; top:${p1.top}vh; left:${p1.left}vw; transform: scale(0.3); }
        2%   { opacity: ${peak}; transform: scale(1.15); }
        20%  { opacity: ${peak}; transform: scale(1); }
        24%  { opacity: 0; transform: scale(0.3); }
        25%  { opacity: 0; top:${p2.top}vh; left:${p2.left}vw; }
        27%  { opacity: ${peak}; transform: scale(1.15); }
        45%  { opacity: ${peak}; transform: scale(1); }
        49%  { opacity: 0; transform: scale(0.3); }
        50%  { opacity: 0; top:${p3.top}vh; left:${p3.left}vw; }
        52%  { opacity: ${peak}; transform: scale(1.15); }
        70%  { opacity: ${peak}; transform: scale(1); }
        74%  { opacity: 0; transform: scale(0.3); }
        75%  { opacity: 0; top:${p4.top}vh; left:${p4.left}vw; }
        77%  { opacity: ${peak}; transform: scale(1.15); }
        95%  { opacity: ${peak}; transform: scale(1); }
        99%  { opacity: 0; transform: scale(0.3); }
        100% { opacity: 0; top:${p1.top}vh; left:${p1.left}vw; }
      }
    `;
    return `<div class="star" style="width:${s.size}px; height:${s.size}px; background:${color}; box-shadow: 0 0 ${glow}px ${color}, 0 0 1.5px rgba(160,160,160,0.9); animation-name:${name}; animation-duration:${s.dur}s; animation-delay:${s.delay}s;"></div>`;
  }).join("\n");

  const css = `
    ${overlayBaseCss("stars-container")}
    .star {
      position: absolute; border-radius: 50%;
      animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: opacity, transform, top, left;
    }
    ${keyframesCss}
  `;
  return { css, html: `<div class="stars-container" aria-hidden="true">${starHTML}</div>` };
}

function renderBirthday(cfg, hass, hostEl) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const isHigh = (cfg.opacity_preset || "medium") === "high";

  const balloonCount = getParticleCount(cfg.count_preset || "medium", "balloons");
  const balloons = spreadSample(BALLOONS, balloonCount);
  const balloonHTML = balloons.map((b) => `
    <div class="bday-balloon-wrapper" style="left:${b.l}vw; animation-duration:${b.dur}s; animation-delay:${b.d}s; opacity:${opacity};">
      <div class="bday-balloon" style="width:${b.size}px; height:${(b.size * 1.6)}px; color:${b.color};">
        ${BALLOON_SVG}
      </div>
    </div>
  `).join("\n");

  const confettiColors = ["#ff4b4b", "#ffb703", "#8ecae6", "#06d6a0", "#f72585", "#ffd60a"];
  const confettiCount = getParticleCount(cfg.count_preset || "medium", "confetti");
  const confetti = getCachedRandomSet("birthday-confetti", confettiCount, () => ({
    l: (Math.random() * 100).toFixed(2),
    size: (Math.random() * 6 + 5).toFixed(1),
    dur: (Math.random() * 3 + 3).toFixed(2),
    delay: (Math.random() * -6).toFixed(2),
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    baseOp: (Math.random() * 0.3 + 0.6).toFixed(2),
  }));
  const confettiHtml = confetti.map((c) => {
    const op = isHigh ? Math.max(parseFloat(c.baseOp), 0.9) : (parseFloat(c.baseOp) * opacity);
    return `<div class="confetti-piece" style="left:${c.l}vw; width:${c.size}px; height:${(c.size * 0.6).toFixed(1)}px; background:${c.color}; animation-duration:${c.dur}s; animation-delay:${c.delay}s; opacity:${op.toFixed(2)};"></div>`;
  }).join("\n");

  const text = (cfg.birthday_text && cfg.birthday_text.trim()) || "Happy Birthday!";
  const safeText = escapeHtml(text);
  const flagColors = ["#ff4b4b", "#ffb703", "#8ecae6", "#06d6a0", "#f72585"];
  let flagsHtml = "";
  const flagCount = 16;
  for (let i = 0; i < flagCount; i++) {
    const left = (i / (flagCount - 1)) * 100;
    const color = flagColors[i % flagColors.length];
    flagsHtml += `<div class="banner-flag" style="left:${left}%; background:${color};"></div>`;
  }

  const css = `
    .bday-balloons-container, .confetti-container {
      position: fixed; top: 0; left: 50%; transform: translateX(-50%);
      width: 100vw; height: 100vh; pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .bday-balloon-wrapper { position:absolute; bottom:-20%; animation:balloon-rise linear infinite; will-change: transform; }
    .bday-balloon { display:flex; align-items:center; justify-content:center; }
    .bday-balloon svg { width:100%; height:100%; filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.25)); }
    @keyframes balloon-rise { 0% { transform: translateY(10vh); } 100% { transform: translateY(-120vh); } }

    .confetti-piece {
      position: absolute; top: -5%;
      animation-name: confetti-fall; animation-timing-function: linear; animation-iteration-count: infinite;
      will-change: transform;
    }
    @keyframes confetti-fall {
      0%   { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(115vh) rotate(540deg); }
    }

    .birthday-banner {
      position: fixed; top: 0; left: 0; width: 100vw; height: 60px;
      pointer-events: none; z-index: 9999;
    }
    .banner-string {
      position: absolute; top: 8px; left: 0; width: 100%; height: 1px;
      background: rgba(255,255,255,0.4);
    }
    .banner-flag {
      position: absolute; top: 8px; width: 16px; height: 20px;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
      animation: banner-flag-sway 2.4s ease-in-out infinite;
      transform-origin: top center;
    }
    @keyframes banner-flag-sway {
      0%, 100% { transform: rotate(-4deg); }
      50% { transform: rotate(4deg); }
    }
    .banner-text {
      position: absolute; top: 26px; left: 50%; transform: translateX(-50%);
      font-size: 28px; font-weight: 800; color: #ffffff;
      text-shadow: 0 0 8px rgba(0,0,0,0.5), 2px 2px 0 #ff4b4b, -2px -2px 0 #06d6a0;
      font-family: system-ui, -apple-system, sans-serif;
      white-space: nowrap;
      animation: banner-bounce 2s ease-in-out infinite;
    }
    @keyframes banner-bounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(-4px); }
    }
  `;
  const html = `
    <div class="bday-balloons-container" aria-hidden="true">${balloonHTML}</div>
    <div class="confetti-container" aria-hidden="true">${confettiHtml}</div>
    <div class="birthday-banner" aria-hidden="true">
      <div class="banner-string"></div>
      ${flagsHtml}
      <div class="banner-text">${safeText}</div>
    </div>
  `;
  return { css, html };
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
  train: renderTrain,

  comet: renderComet,
  bats: renderBats,
  owl: renderOwl,
  bee: renderBee,
  clouds: renderClouds,

  gnome_door: renderGnomeDoor,
  birdhouse: renderBirdhouse,
  wishstar: renderWishStar,
  birthday: renderBirthday,
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
    this._periodicStartTimes = {};
    this._wishstarTimer = null;
    this._wishstarPos = null;
    this._starsReshuffleTimer = null;
    // Verbesserung: statt einen Effekt beim Beenden sofort komplett aus
    // dem DOM zu entfernen, merkt sich diese Map, welche Effekte gerade
    // "aktiv" sind und welche gerade "ausblenden" (mit Startzeitpunkt des
    // Ausblendens). So kann jeder Effekt sanft verblassen statt abrupt zu
    // verschwinden - siehe _updateEffectLayers() weiter unten.
    this._effectLayers = new Map();
    this._fadeRemovalTimers = new Map();
  }

  _ensurePortal() {
    if (this._portalHost) return;
    this._portalHost = document.createElement("div");
    // Verbesserung (Bugfix): "position: fixed" allein reicht nicht immer -
    // manche Custom Cards (z. B. Swipe-/Karussell-Karten mit Fade-Übergang)
    // nutzen selbst einen hohen z-index für ihre eigenen Übergangs-
    // Animationen und können dadurch über unseren Effekten liegen. Ein
    // extrem hoher, praktisch nie überbotener z-index-Wert stellt sicher,
    // dass unser Effekt-Container IMMER ganz oben liegt, egal was sonst
    // noch auf der Seite ist.
    // Verbesserung: läuft die Dampflok als EIGENE Karte gleichzeitig mit
    // einem anderen Effekt (z. B. der Wichteltür, die ja auch unten am
    // Rand sitzt), sollen sich beide nicht zufällig überdecken je nachdem
    // welche Karte zuerst geladen wurde - die Lok bekommt deshalb einen
    // minimal höheren Wert und fährt dadurch IMMER sichtbar davor her.
    const z = this._config?.event === "train" ? 2147483647 : 2147483646;
    this._portalHost.style.cssText = `position:fixed; top:0; left:0; width:0; height:0; pointer-events:none; z-index:${z};`;
    this._portalShadow = this._portalHost.attachShadow({ mode: "open" });
    document.body.appendChild(this._portalHost);
  }

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
    if (this._starsReshuffleTimer) {
      clearInterval(this._starsReshuffleTimer);
      this._starsReshuffleTimer = null;
    }
    for (const timer of this._fadeRemovalTimers.values()) {
      clearTimeout(timer);
    }
    this._fadeRemovalTimers.clear();
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
      birthday_text: "Happy Birthday!",
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    const weatherEntity = this._config?.weather_entity;
    const oldWeatherState = weatherEntity ? this._hass?.states?.[weatherEntity]?.state : undefined;
    this._hass = hass;
    const newWeatherState = weatherEntity ? hass?.states?.[weatherEntity]?.state : undefined;
    // Sanftes Ausblenden nur bei einer ECHTEN automatischen Wetteränderung
    // (nicht beim allerersten Rendern - da gibt's ja noch nichts, von dem
    // aus geblendet werden könnte).
    const isRealWeatherChange = this._hasRenderedOnce && oldWeatherState !== newWeatherState;

    if (!this._hasRenderedOnce || oldWeatherState !== newWeatherState) {
      this._render(isRealWeatherChange);
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

  // Verbesserung (Ressourcen): statt jede Sekunde zu prüfen, welcher Stern
  // "fällig" ist, mischt dieser Timer alle 4 Minuten AUF EINMAL die
  // Positionen aller Sterne komplett neu (per Cache-Löschung + Neu-Rendern).
  // Zwischen den Reshuffles läuft alles rein über CSS, ganz ohne
  // JavaScript-Beteiligung - das spart 239 von 240 Sekunden komplett den
  // Timer-Aufwand, verglichen mit einer Sekunden-Prüfung.
  _updateStarsReshuffle(events) {
    if (events.includes("stars")) {
      if (!this._starsReshuffleTimer) {
        this._starsReshuffleTimer = setInterval(() => {
          const count = getParticleCount(this._config?.count_preset || "medium", "stars");
          _randomCache.delete(`stars:${count}`);
          this._render();
        }, 240000);
      }
    } else {
      if (this._starsReshuffleTimer) {
        clearInterval(this._starsReshuffleTimer);
        this._starsReshuffleTimer = null;
      }
    }
  }

  // Verbesserung: sorgt dafür, dass ein Effekt beim Beenden nicht sofort
  // verschwindet, sondern erst als "ausblendend" markiert und nach der
  // Fade-Dauer (FADE_DURATION_MS) endgültig entfernt wird. Wird ein Effekt
  // während des Ausblendens wieder aktiviert (z. B. schnell wechselndes
  // Wetter), springt er sofort zurück auf voll sichtbar.
  _updateEffectLayers(events, allowFade) {
    for (const ev of events) {
      const existing = this._effectLayers.get(ev);
      if (!existing || existing.fadeStartedAt !== null) {
        this._effectLayers.set(ev, { fadeStartedAt: null });
      }
    }
    for (const [key, state] of this._effectLayers.entries()) {
      if (!events.includes(key) && state.fadeStartedAt === null) {
        if (!allowFade) {
          // Manueller Wechsel (Editor-Dropdown) oder interner Timer -
          // sofort entfernen, kein Ausblenden. Sanftes Ausblenden gibt's
          // nur, wenn sich das Wetter selbstständig ändert (siehe set
          // hass() weiter oben) - dort schaut man ja nicht zwangsläufig
          // gerade auf den Bildschirm.
          this._effectLayers.delete(key);
          if (this._fadeRemovalTimers.has(key)) {
            clearTimeout(this._fadeRemovalTimers.get(key));
            this._fadeRemovalTimers.delete(key);
          }
          continue;
        }
        state.fadeStartedAt = Date.now();
        if (this._fadeRemovalTimers.has(key)) {
          clearTimeout(this._fadeRemovalTimers.get(key));
        }
        const timer = setTimeout(() => {
          const cur = this._effectLayers.get(key);
          if (cur && cur.fadeStartedAt !== null) {
            this._effectLayers.delete(key);
            this._fadeRemovalTimers.delete(key);
            this._render();
          }
        }, FADE_DURATION_MS + 150);
        this._fadeRemovalTimers.set(key, timer);
      }
    }
  }

  _render(allowFade = false) {
    if (!this._config) return;
    if (!this._portalShadow) return;

    const events = this._resolveEvents();
    this._updateSnowAccumulation(events);

    this._updateWishstar(events);

    this._updateStarsReshuffle(events);
    this._updateEffectLayers(events, allowFade);

    // Verbesserung: Startzeiten periodischer Effekte (Hund, Weihnachtsmann,
    // Komet) erst aufräumen, wenn der Effekt WIRKLICH komplett weg ist
    // (auch aus den Fade-Layern) - sonst würde die Position/Startzeit
    // während des sanften Ausblendens plötzlich zurückgesetzt und der
    // Effekt würde beim Verblassen sichtbar "springen".
    for (const key of Object.keys(this._periodicStartTimes)) {
      if (!this._effectLayers.has(key)) delete this._periodicStartTimes[key];
    }

    let combinedCss = `
      @keyframes fx-fade-out { from { opacity: 1; } to { opacity: 0; } }
    `;
    let combinedHtml = "";
    for (const [event, state] of this._effectLayers.entries()) {
      const renderer = RENDERERS[event];
      if (!renderer) continue;
      let cfgForRender = this._config;
      if (event === "snow") {
        cfgForRender = { ...this._config, _snowLevel: this._snowLevel };
      } else if (event === "wishstar") {
        cfgForRender = { ...this._config, _wishstarPos: this._wishstarPos };
      } else if (event === "santa" || event === "comet" || event === "train" || event === "birdhouse") {
        if (!this._periodicStartTimes[event]) this._periodicStartTimes[event] = Date.now();
        cfgForRender = { ...this._config, _startTime: this._periodicStartTimes[event] };
      } else if (event === "dog") {
        if (!this._periodicStartTimes[event]) {
          const ranges = {
            dog: [10, 80],
          };
          const [min, max] = ranges[event] || [10, 80];
          this._periodicStartTimes[event] = {
            start: Date.now(),
            startHeight: Math.random() * (max - min) + min,
            drift: Math.random() * 16 - 8,
          };
        }
        const pState = this._periodicStartTimes[event];
        cfgForRender = {
          ...this._config,
          _startTime: pState.start,
          _startHeight: pState.startHeight,
          _drift: pState.drift,
        };
      }
      const { css, html } = renderer(cfgForRender, this._hass, this);
      combinedCss += css;
      // Fading-Layer bekommen eine "resume mid-animation"-Verzögerung wie
      // bei santa/dog/comet: negativer animation-delay aus der bereits
      // verstrichenen Ausblend-Zeit, damit ein Neu-Rendern während des
      // Verblassens (z. B. durch andere laufende Timer) den Fade nicht
      // wieder von vorne beginnen lässt.
      const layerStyle = state.fadeStartedAt !== null
        ? `animation: fx-fade-out ${(FADE_DURATION_MS / 1000).toFixed(2)}s linear forwards; animation-delay: -${((Date.now() - state.fadeStartedAt) / 1000).toFixed(2)}s;`
        : "opacity: 1;";
      combinedHtml += `<div style="${layerStyle}">${html}</div>`;
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
      birthday_text: "Happy Birthday!",
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
    const isBirthday = c.event === "birthday";

    const weatherEntities = this._hass && this._hass.states
      ? Object.keys(this._hass.states).filter((eid) => eid.startsWith("weather."))
      : [];

    this.innerHTML = `
      <div style="padding:8px 16px;">
        <div id="live-preview" style="position:relative; width:100%; height:150px; overflow:hidden; border-radius:10px; margin-bottom:10px; background:linear-gradient(180deg, #16202e, #2c3e50); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);">
          <div id="live-preview-stage" style="position:absolute; top:0; left:0; width:100vw; height:100vh; transform: scale(0.16); transform-origin: top left;"></div>
          <div id="live-preview-msg" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.55); font-size:12px; text-align:center; padding:0 16px;"></div>
        </div>
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

            <option value="gnome_door" ${c.event === "gnome_door" ? "selected" : ""}>🧝🚪 Wichteltür</option>
            <option value="birdhouse" ${c.event === "birdhouse" ? "selected" : ""}>🐦🏠 Vogelhäuschen</option>
            <option value="shooting_stars" ${c.event === "shooting_stars" ? "selected" : ""}>🌠 Sternschnuppen</option>
            <option value="stars" ${c.event === "stars" ? "selected" : ""}>✨ Sternenhimmel</option>
            <option value="wishstar" ${c.event === "wishstar" ? "selected" : ""}>⭐ Wunschstern-Funkeln</option>
            <option value="comet" ${c.event === "comet" ? "selected" : ""}>☄️ Komet</option>
            <option value="leaves" ${c.event === "leaves" ? "selected" : ""}>🍂 Laub</option>
            <option value="balloons" ${c.event === "balloons" ? "selected" : ""}>🎈 Luftballons</option>
            <option value="lights" ${c.event === "lights" ? "selected" : ""}>💡 Lichterkette</option>
            <option value="birthday" ${isBirthday ? "selected" : ""}>🎂 Geburtstags-Modus</option>
            <option value="santa" ${c.event === "santa" ? "selected" : ""}>🎅 Weihnachtsmann</option>
            <option value="spider" ${c.event === "spider" ? "selected" : ""}>🕷️ Spinne mit Netz</option>
            <option value="dog" ${c.event === "dog" ? "selected" : ""}>🐕 Goldener Labrador</option>
            <option value="train" ${c.event === "train" ? "selected" : ""}>🚂 Dampflok</option>


            <option value="bats" ${c.event === "bats" ? "selected" : ""}>🦇 Fledermäuse</option>
            <option value="owl" ${c.event === "owl" ? "selected" : ""}>🦉 Eule</option>
            <option value="bee" ${c.event === "bee" ? "selected" : ""}>🐝 Bienen</option>
          </select>
        `, isWeatherAuto
          ? "Bei 'Automatisch' entscheidet der Zustand deiner Wetter-Entity unten, welcher Effekt läuft."
          : "Welcher Effekt manuell dauerhaft angezeigt wird."
        )}

        ${isBirthday ? this._row("Banner-Text", `
          <input id="birthday_text" type="text" value="${c.birthday_text ? c.birthday_text.replace(/"/g, "&quot;") : ""}" placeholder="Happy Birthday!" style="width:100%; padding:6px; box-sizing:border-box;" />
        `, "Text im Banner oben - z. B. 'Happy Birthday, Max!' für eine persönliche Note.") : ""}

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

    const birthdayTextInput = this.querySelector("#birthday_text");
    if (birthdayTextInput) {
      birthdayTextInput.addEventListener("input", (e) => this._update("birthday_text", e.target.value, false));
      birthdayTextInput.addEventListener("change", (e) => this._update("birthday_text", e.target.value, false));
    }

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
      colorPicker.addEventListener("input", (e) => this._update("color", e.target.value, false));
    }

    this._updatePreview();
  }

  _updatePreview() {
    const stage = this.querySelector("#live-preview-stage");
    const msg = this.querySelector("#live-preview-msg");
    if (!stage || !msg) return;
    const c = this._config;
    if (!c || c.event === "off") {
      stage.innerHTML = "";
      msg.textContent = "Kein Effekt ausgewählt.";
      return;
    }
    if (c.event === "weather_auto") {
      stage.innerHTML = "";
      msg.textContent = "Vorschau nicht verfügbar bei 'Automatisch' - hängt vom aktuellen Live-Wetter ab.";
      return;
    }
    const renderer = RENDERERS[c.event];
    if (!renderer) {
      stage.innerHTML = "";
      msg.textContent = "";
      return;
    }
    msg.textContent = "";
    // Verbesserung (Bugfix): bei "Auto"-Farbmodus würde der Effekt sonst
    // die Farbe des ECHTEN Home-Assistant-Editor-Fensters übernehmen (das
    // kann hell sein) - unsere Vorschau-Box hat aber immer einen dunklen
    // Hintergrund. Ohne diese Korrektur wären z. B. schwarze Regentropfen
    // auf dunklem Grund unsichtbar. Die Vorschau erzwingt deshalb eine
    // helle Farbe, unabhängig vom echten Dashboard-Theme.
    const caps = EVENT_CAPABILITIES[c.event] || {};
    const previewCfg = (caps.color && (c.color_mode || "auto") === "auto")
      ? { ...c, color: "#ffffff" }
      : c;
    const { css, html } = renderer(previewCfg, this._hass, this);
    stage.innerHTML = `<style>${css}</style>${html}`;
  }

  _update(key, value, rerender) {
    this._suppressNextRender = !rerender;
    this._config = { ...this._config, [key]: value };
    fireEvent(this, "config-changed", { config: this._config });
    if (rerender) {
      this._render();
    } else {
      this._updatePreview();
    }
  }

  _updateConfig(newValues, rerender) {
    this._suppressNextRender = !rerender;
    this._config = { ...this._config, ...newValues };
    fireEvent(this, "config-changed", { config: this._config });
    if (rerender) {
      this._render();
    } else {
      this._updatePreview();
    }
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
