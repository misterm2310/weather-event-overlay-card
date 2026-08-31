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
  `;
  return { css, html: `<div class="snowflakes" aria-hidden="true">${flakeHTML}</div>` };
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

const RENDERERS = {
  rain: renderRain,
  snow: renderSnow,
  leaves: renderLeaves,
  balloons: renderBalloons,
  lights: renderLights,
  shooting_stars: renderShootingStars,
  lightning: renderLightning,
  fog: renderFog,
};

/* ============================== HAUPT-KARTE ============================== */

class WeatherEventOverlayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onThemeChange = this._onThemeChange.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
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
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    const oldTheme = this._hass?.themes?.darkMode;
    this._hass = hass;
    
    if (!this._hasRenderedOnce || (oldTheme !== undefined && oldTheme !== hass?.themes?.darkMode)) {
      this._render();
      this._hasRenderedOnce = true;
    }
  }

  _resolveEvent() {
    return this._config?.event || "off";
  }

  getCardSize() { return 0; }

  static getStubConfig() {
    return { event: "lightning", count_preset: "medium", opacity_preset: "medium", color: "auto" };
  }

  static getConfigElement() {
    return document.createElement("weather-event-overlay-card-editor");
  }

  _render() {
    if (!this._config) return;
    const event = this._resolveEvent();
    const renderer = RENDERERS[event];
    const baseStyle = `:host { display: block; position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: visible; pointer-events: none; background: none !important; }`;

    if (!renderer) {
      this.shadowRoot.innerHTML = `<style>${baseStyle}</style>`;
      return;
    }

    const { css, html } = renderer(this._config, this._hass);
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
      ...config,
    };
    if (this._suppressNextRender) {
      this._suppressNextRender = false;
      return;
    }
    this._render();
  }

  set hass(hass) { this._hass = hass; }
  connectedCallback() { this._render(); }

  _row(labelText, inputHTML) {
    return `<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; gap:12px;"><label style="flex:1; color:var(--primary-text-color, #222);">${labelText}</label><div style="flex:1;">${inputHTML}</div></div>`;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    const leafColors = Array.isArray(c.leaf_colors) && c.leaf_colors.length === 3 ? c.leaf_colors : ["#c9a227", "#a83232", "#d9812c"];
    const colorMode = c.color_mode || (c.color === "auto" ? "auto" : "custom");

    this.innerHTML = `
      <div style="padding:8px 16px;">
        ${this._row("Event-Typ", `
          <select id="event" style="width:100%; padding:6px;">
            <option value="off" ${c.event === "off" ? "selected" : ""}>Aus</option>
            <option value="rain" ${c.event === "rain" ? "selected" : ""}>🌧️ Regen</option>
            <option value="snow" ${c.event === "snow" ? "selected" : ""}>❄️ Schnee</option>
            <option value="leaves" ${c.event === "leaves" ? "selected" : ""}>🍂 Laub</option>
            <option value="balloons" ${c.event === "balloons" ? "selected" : ""}>🎈 Luftballons</option>
            <option value="lights" ${c.event === "lights" ? "selected" : ""}>💡 Lichterkette</option>
            <option value="shooting_stars" ${c.event === "shooting_stars" ? "selected" : ""}>🌠 Sternschnuppen</option>
            <option value="lightning" ${c.event === "lightning" ? "selected" : ""}>⚡ Blitze (Gewitter)</option>
            <option value="fog" ${c.event === "fog" ? "selected" : ""}>🌫️ Nebel</option>
          </select>
        `)}

        ${this._row("Anzahl / Frequenz", `
          <select id="count_preset" style="width:100%; padding:6px;">
            <option value="low" ${c.count_preset === "low" ? "selected" : ""}>🔹 Wenig / Selten</option>
            <option value="medium" ${c.count_preset === "medium" ? "selected" : ""}>🔷 Mittel</option>
            <option value="high" ${c.count_preset === "high" ? "selected" : ""}>🔷 Viel / Häufig</option>
          </select>
        `)}

        ${this._row("Deckkraft / Helligkeit", `
          <select id="opacity_preset" style="width:100%; padding:6px;">
            <option value="low" ${c.opacity_preset === "low" ? "selected" : ""}>👻 Zart (30%)</option>
            <option value="medium" ${c.opacity_preset === "medium" ? "selected" : ""}>👁️ Dezent (60%)</option>
            <option value="high" ${c.opacity_preset === "high" ? "selected" : ""}>✨ Kräftig (100%)</option>
          </select>
        `)}

        ${this._row("Farbmodus", `
          <select id="color_mode" style="width:100%; padding:6px;">
            <option value="auto" ${colorMode === "auto" ? "selected" : ""}>🌗 Auto (Hell/Dunkel Modus)</option>
            <option value="custom" ${colorMode === "custom" ? "selected" : ""}>🎨 Manuelle Farbe</option>
          </select>
        `)}

        <div id="custom_color_picker" style="display:${colorMode === "custom" ? "block" : "none"};">
          ${this._row("Farbe (Regen / Schnee / Sterne)", `<input id="color" type="color" value="${c.color === "auto" ? "#ffffff" : c.color}" style="width:100%; height:36px;" />`)}
        </div>

        ${this._row("Laubfarbe 1", `<input id="leaf_color_0" type="color" value="${leafColors[0]}" style="width:100%; height:36px;" />`)}
        ${this._row("Laubfarbe 2", `<input id="leaf_color_1" type="color" value="${leafColors[1]}" style="width:100%; height:36px;" />`)}
        ${this._row("Laubfarbe 3", `<input id="leaf_color_2" type="color" value="${leafColors[2]}" style="width:100%; height:36px;" />`)}
      </div>
    `;

    this.querySelector("#event").addEventListener("change", (e) => this._update("event", e.target.value, true));
    this.querySelector("#count_preset").addEventListener("change", (e) => this._update("count_preset", e.target.value, true));
    this.querySelector("#opacity_preset").addEventListener("change", (e) => this._update("opacity_preset", e.target.value, true));

    this.querySelector("#color_mode").addEventListener("change", (e) => {
      const mode = e.target.value;
      if (mode === "auto") {
        this._updateConfig({ color_mode: "auto", color: "auto" }, true);
      } else {
        this._updateConfig({ color_mode: "custom", color: "#ffffff" }, true);
      }
    });

    const colorPicker = this.querySelector("#color");
    if (colorPicker) {
      colorPicker.addEventListener("change", (e) => this._update("color", e.target.value, true));
    }

    this.querySelector("#leaf_color_0").addEventListener("change", (e) => this._updateLeafColor(0, e.target.value));
    this.querySelector("#leaf_color_1").addEventListener("change", (e) => this._updateLeafColor(1, e.target.value));
    this.querySelector("#leaf_color_2").addEventListener("change", (e) => this._updateLeafColor(2, e.target.value));
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

  _updateLeafColor(index, value) {
    this._suppressNextRender = true;
    const leafColors = Array.isArray(this._config.leaf_colors) ? [...this._config.leaf_colors] : ["#c9a227", "#a83232", "#d9812c"];
    leafColors[index] = value;
    this._config = { ...this._config, leaf_colors: leafColors };
    fireEvent(this, "config-changed", { config: this._config });
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
