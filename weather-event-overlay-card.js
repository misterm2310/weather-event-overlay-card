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
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(num)) return { r: 200, g: 160, b: 60 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToCss({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function gradientColor(colors, t) {
  const [c0, c1, c2] = colors.map(hexToRgb);
  const seg = t < 0.5 ? [c0, c1, t * 2] : [c1, c2, (t - 0.5) * 2];
  const [from, to, localT] = seg;
  return rgbToCss({
    r: Math.round(lerp(from.r, to.r, localT)),
    g: Math.round(lerp(from.g, to.g, localT)),
    b: Math.round(lerp(from.b, to.b, localT)),
  });
}

function getParticleCount(preset, eventType) {
  let max = 50;
  if (eventType === "balloons") max = 30;
  if (eventType === "lights") max = 25;
  if (eventType === "shooting_stars") {
    switch (preset) {
      case "low": return 3;
      case "high": return 8;
      case "medium":
      default: return 5;
    }
  }
  if (eventType === "lightning") {
    switch (preset) {
      case "low": return 2;
      case "high": return 6;
      case "medium":
      default: return 4;
    }
  }
  switch (preset) {
    case "low": return Math.round(max * 0.33);
    case "high": return max;
    case "medium":
    default: return Math.round(max * 0.66);
  }
}

function getOpacityValue(preset) {
  switch (preset) {
    case "low": return 0.3;
    case "high": return 1.0;
    case "medium":
    default: return 0.6;
  }
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

const DROPS = Array.from({ length: 50 }, (_, i) => ({
  l: (i * 2) + 1,
  size: Math.floor(Math.random() * 14) + 16,
  dur: (Math.random() * 0.3 + 0.4).toFixed(2),
  d: (Math.random() * -2).toFixed(2),
  op: (Math.random() * 0.5 + 0.4).toFixed(2),
}));

const FLAKES_DATA = [
  { l: 2, s: 9, ex: -25, dur: 20, d: 0.02, op: 0.5, rs: 0, re: 360 },
  { l: 6, s: 15, ex: 30, dur: 28, d: 0.13, op: 0.8, rs: 360, re: -360 },
  { l: 10, s: 11, ex: -20, dur: 18, d: 0.21, op: 0.6, rs: 45, re: -405 },
  { l: 14, s: 17, ex: 35, dur: 26, d: 0.34, op: 0.9, rs: -30, re: 330 },
  { l: 18, s: 13, ex: -28, dur: 24, d: 0.40, op: 0.4, rs: -360, re: 360 },
  { l: 22, s: 19, ex: 24, dur: 22, d: 0.47, op: 0.7, rs: 90, re: -270 },
  { l: 26, s: 7, ex: -35, dur: 32, d: 0.51, op: 0.3, rs: -90, re: 270 },
  { l: 30, s: 14, ex: 24, dur: 20, d: 0.62, op: 0.6, rs: 180, re: -180 },
  { l: 34, s: 21, ex: -15, dur: 30, d: 0.68, op: 0.5, rs: -120, re: 240 },
  { l: 38, s: 12, ex: 18, dur: 24, d: 0.70, op: 0.8, rs: 60, re: -300 },
];

/* ============================ RENDER-FUNKTIONEN ============================ */

function renderRain(cfg) {
  const color = cfg.color || "#a0c4ff";
  const count = getParticleCount(cfg.count_preset || "medium", "rain");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const drops = spreadSample(DROPS, count);

  const dropHTML = drops.map((d) => {
    const op = (d.op * opacity).toFixed(2);
    return `<div class="drop" style="left:${d.l}%; height:${d.size}px; animation-duration:${d.dur}s; animation-delay:${d.d}s; opacity:${op};"></div>`;
  }).join("\n");

  const css = `
    .rain { position: fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:999; }
    .rain .drop { position:absolute; top:-20%; width:1.5px; background:linear-gradient(transparent, ${color}); border-radius:50%; animation: rainfall linear infinite; }
    @keyframes rainfall { 0% { transform: translateY(0vh) translateX(0px); } 100% { transform: translateY(120vh) translateX(-15px); } }
    @media (prefers-reduced-motion: reduce) { .rain { display:none; } }
  `;
  return { css, html: `<div class="rain">${dropHTML}</div>` };
}

function renderSnow(cfg) {
  const color = cfg.color || "#ffffff";
  const count = getParticleCount(cfg.count_preset || "medium", "snow");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const flakes = spreadSample(FLAKES_DATA, count);

  const flakeHTML = flakes.map((f) => {
    const op = (f.op * opacity).toFixed(2);
    return `<i class="snowflake" style="left:${f.l}%; font-size:${f.s}px; --start-x:0px; --end-x:${f.ex}px; animation-duration:${f.dur}s; animation-delay:calc(-20s * ${f.d}); opacity:${op}; color:${color};">❄</i>`;
  }).join("\n");

  const css = `
    .snowflakes { position: fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:999; }
    .snowflake { position:absolute; top:-10%; font-style:normal; animation:wander-fall linear infinite; }
    @keyframes wander-fall {
      0%   { transform: translate(var(--start-x), -10%); }
      50%  { transform: translate(var(--end-x), 60vh); }
      100% { transform: translate(var(--end-x), 120vh); }
    }
    @media (prefers-reduced-motion: reduce) { .snowflakes { display:none; } }
  `;
  return { css, html: `<div class="snowflakes">${flakeHTML}</div>` };
}

function renderLeaves(cfg) {
  const leafColors = Array.isArray(cfg.leaf_colors) && cfg.leaf_colors.length === 3 ? cfg.leaf_colors : ["#c9a227", "#a83232", "#d9812c"];
  const count = getParticleCount(cfg.count_preset || "medium", "leaves");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const leafShape = typeof cfg.leaf_shape === "string" && cfg.leaf_shape.trim() ? cfg.leaf_shape : DEFAULT_LEAF_SHAPE;
  const leaves = spreadSample(FLAKES_DATA, count);

  const leafHTML = leaves.map((f, i) => {
    const op = (f.op * opacity).toFixed(2);
    const color = gradientColor(leafColors, i / leaves.length);
    const px = `${f.s * 1.6}px`;
    return `<i class="leaf" style="left:${f.l}%; width:${px}; height:${px}; animation-duration:${f.dur}s; opacity:${op}; color:${color};"><svg viewBox="0 0 100 100" width="100%" height="100%">${leafShape}</svg></i>`;
  }).join("\n");

  const css = `
    .leaves { position: fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:999; }
    .leaf { position:absolute; top:-10%; animation:leaf-fall linear infinite; }
    @keyframes leaf-fall { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(120vh) rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .leaves { display:none; } }
  `;
  return { css, html: `<div class="leaves">${leafHTML}</div>` };
}

function renderBalloons(cfg) {
  const count = getParticleCount(cfg.count_preset || "medium", "balloons");
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const balloons = spreadSample(BALLOONS, count);

  const balloonHTML = balloons.map((b) => `
    <div class="balloon-wrapper" style="left:${b.l}%; animation-duration:${b.dur}s; animation-delay:${b.d}s; opacity:${opacity};">
      <div class="balloon" style="width:${b.size}px; height:${(b.size * 1.6)}px; color:${b.color};">
        ${BALLOON_SVG}
      </div>
    </div>
  `).join("\n");

  const css = `
    .balloons-container { position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:999; }
    .balloon-wrapper { position:absolute; bottom:-20%; animation:balloon-rise linear infinite; }
    .balloon { display:flex; align-items:center; justify-content:center; }
    .balloon svg { width:100%; height:100%; filter:drop-shadow(2px 4px 6px rgba(0,0,0,0.25)); }
    @keyframes balloon-rise { 0% { transform: translateY(10vh); } 100% { transform: translateY(-120vh); } }
    @media (prefers-reduced-motion: reduce) { .balloons-container { display:none; } }
  `;
  return { css, html: `<div class="balloons-container">${balloonHTML}</div>` };
}

function renderLights(cfg) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const bulbCount = getParticleCount(cfg.count_preset || "medium", "lights");
  const colors = ["#ff3333", "#33cc33", "#3399ff", "#ffff33", "#ff9933", "#cc33cc"];
  
  let bulbsHtml = "";
  for (let i = 0; i < bulbCount; i++) {
    const col = colors[i % colors.length];
    bulbsHtml += `<div class="bulb" style="background:${col}; animation-delay:${(i * 0.2).toFixed(1)}s;"></div>\n`;
  }

  const html = `<div class="lights-string" style="opacity:${opacity};">${bulbsHtml}</div>`;
  const css = `
    .lights-string {
      position: fixed; top: 0; left: 0; width: 100%; height: 25px;
      pointer-events: none; z-index: 999; display: flex; justify-content: space-around; padding: 0 10px;
    }
    .bulb {
      width: 10px; height: 14px; border-radius: 50%;
      box-shadow: 0 0 8px currentColor;
      animation: bulb-blink 1.2s ease-in-out infinite alternate;
    }
    @keyframes bulb-blink { 0% { opacity: 0.3; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1.1); } }
    @media (prefers-reduced-motion: reduce) { .lights-string { display:none; } }
  `;
  return { css, html };
}

function renderShootingStars(cfg) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const count = getParticleCount(cfg.count_preset || "medium", "shooting_stars");
  const color = cfg.color || "#ffffff";

  let starsHtml = "";
  for (let i = 0; i < count; i++) {
    const top = Math.random() * 50;
    const left = Math.random() * 100;
    const dur = (Math.random() * 3 + 2).toFixed(2);
    const delay = (Math.random() * 5).toFixed(2);
    starsHtml += `<div class="shooting-star" style="top:${top}vh; left:${left}%; animation-duration:${dur}s; animation-delay:${delay}s; color:${color};"></div>\n`;
  }

  const html = `<div class="shooting-stars-container" style="opacity:${opacity};">${starsHtml}</div>`;
  const css = `
    .shooting-stars-container {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 999; overflow: hidden;
    }
    .shooting-star {
      position: absolute; width: 100px; height: 2px;
      background: linear-gradient(90deg, currentColor, transparent);
      transform: rotate(-45deg); opacity: 0;
      animation: shooting-star-anim linear infinite;
    }
    @keyframes shooting-star-anim {
      0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
      100% { transform: translateX(-300px) translateY(300px) rotate(-45deg); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) { .shooting-stars-container { display:none; } }
  `;
  return { css, html };
}

function renderLightning(cfg) {
  const opacity = getOpacityValue(cfg.opacity_preset || "medium");
  const speedFactor = getParticleCount(cfg.count_preset || "medium", "lightning");
  const dur = (6 / speedFactor).toFixed(1);

  const html = `<div class="lightning-flash" style="opacity:${opacity}; animation-duration:${dur}s;"></div>`;
  const css = `
    .lightning-flash {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 999; background: rgba(255, 255, 255, 0.85);
      opacity: 0; animation: flash-anim ease-in-out infinite;
    }
    @keyframes flash-anim {
      0%, 90%, 100% { opacity: 0; }
      92% { opacity: 0.9; }
      93% { opacity: 0.1; }
      94% { opacity: 0.8; }
      96% { opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) { .lightning-flash { display:none; } }
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
};

/* ============================== HAUPT-KARTE ============================== */

class WeatherEventOverlayCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = {
      event: "off",
      count_preset: "medium",
      opacity_preset: "medium",
      color: "#a0c4ff",
      leaf_colors: ["#c9a227", "#a83232", "#d9812c"],
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _resolveEvent() {
    return this._config?.event || "off";
  }

  getCardSize() { return 0; }

  static getStubConfig() {
    return { event: "lightning", count_preset: "medium", opacity_preset: "medium", color: "#a0c4ff" };
  }

  static getConfigElement() {
    return document.createElement("weather-event-overlay-card-editor");
  }

  _render() {
    if (!this._config) return;
    const event = this._resolveEvent();
    const renderer = RENDERERS[event];
    const baseStyle = `:host { display: block; position: absolute; top: -20px; left: 0; width: 0; height: 0; overflow: visible; pointer-events: none; background: none !important; }`;

    if (!renderer) {
      this.shadowRoot.innerHTML = `<style>${baseStyle}</style>`;
      return;
    }

    const { css, html } = renderer(this._config);
    this.shadowRoot.innerHTML = `<style>${baseStyle}${css}</style>${html}`;
  }
}

/* ============================== VISUELLER EDITOR ============================== */

class WeatherEventOverlayCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = {
      event: "off",
      count_preset: "medium",
      opacity_preset: "medium",
      color: "#a0c4ff",
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

        ${this._row("Farbe (Regen/Schnee/Sterne)", `<input id="color" type="color" value="${c.color}" style="width:100%; height:36px;" />`)}
        ${this._row("Laubfarbe 1", `<input id="leaf_color_0" type="color" value="${leafColors[0]}" style="width:100%; height:36px;" />`)}
        ${this._row("Laubfarbe 2", `<input id="leaf_color_1" type="color" value="${leafColors[1]}" style="width:100%; height:36px;" />`)}
        ${this._row("Laubfarbe 3", `<input id="leaf_color_2" type="color" value="${leafColors[2]}" style="width:100%; height:36px;" />`)}
      </div>
    `;

    this.querySelector("#event").addEventListener("change", (e) => this._update("event", e.target.value, true));
    this.querySelector("#count_preset").addEventListener("change", (e) => this._update("count_preset", e.target.value, true));
    this.querySelector("#opacity_preset").addEventListener("change", (e) => this._update("opacity_preset", e.target.value, true));
    this.querySelector("#color").addEventListener("change", (e) => this._update("color", e.target.value));
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

  _updateLeafColor(index, value) {
    this._suppressNextRender = true;
    const leafColors = Array.isArray(this._config.leaf_colors) ? [...this._config.leaf_colors] : ["#c9a227", "#a83232", "#d9812c"];
    leafColors[index] = value;
    this._config = { ...this._config, leaf_colors: leafColors };
    fireEvent(this, "config-changed", { config: this._config });
  }
}

/* ============================== REGISTRIERUNG ============================== */

customElements.define("weather-event-overlay-card", WeatherEventOverlayCard);
customElements.define("weather-event-overlay-card-editor", WeatherEventOverlayCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weather-event-overlay-card",
  name: "Wetter & Event Overlay Card",
  description: "Erweiterte Wetter- und Event-Overlay-Karte (Regen, Schnee, Blitze, Sterne, Ballons etc.) mit GUI-Editor.",
  preview: false,
});
