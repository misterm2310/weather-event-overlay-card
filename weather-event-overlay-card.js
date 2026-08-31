import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class WeatherEventOverlayCard extends LitElement {
  static get properties() {
    return {
      _config: { type: Object },
      _hass: { type: Object }
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  setConfig(config) {
    this._config = {
      event: 'off',
      weather_entity: '',
      precipitation_entity: '',
      weather_intensity_auto: false,
      count_preset: 'medium',
      opacity_preset: 'medium',
      color_mode: 'auto',
      color: 'auto',
      leaf_colors: ["#c9a227", "#a83232", "#d9812c"],
      ...config
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
      }
      .particle-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      /* Dynamic Particle Base Animations */
      .particle {
        position: absolute;
        pointer-events: none;
        will-change: transform, opacity;
      }

      /* Rain Effect */
      .rain-drop {
        width: 2px;
        height: 25px;
        background: linear-gradient(to bottom, transparent, var(--overlay-particle-color, #a0c4ff));
        animation: fall-straight linear infinite;
      }

      /* Snow Effect */
      .snow-flake {
        width: 8px;
        height: 8px;
        background: var(--overlay-particle-color, #ffffff);
        border-radius: 50%;
        filter: blur(1px);
        animation: fall-sway ease-in-out infinite;
      }

      /* Hail Effect */
      .hail-stone {
        width: 6px;
        height: 6px;
        background: var(--overlay-particle-color, #e0e0e0);
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(255,255,255,0.8);
        animation: fall-fast linear infinite;
      }

      /* Lightning Effect */
      .lightning-flash {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.85);
        opacity: 0;
        animation: flash-burst 6s ease-in-out infinite;
      }

      /* Fog Effect */
      .fog-cloud {
        position: absolute;
        width: 200vw;
        height: 100vh;
        background: radial-gradient(ellipse at center, rgba(200, 200, 200, 0.3) 0%, transparent 70%);
        animation: fog-drift 20s ease-in-out infinite alternate;
      }

      /* Storm / Wind Effect */
      .storm-line {
        width: 45px;
        height: 2px;
        background: linear-gradient(to right, transparent, var(--overlay-particle-color, #d0e0e0));
        transform: rotate(-25deg);
        animation: storm-blow linear infinite;
      }

      /* Leaves Effect */
      .leaf {
        width: 18px;
        height: 18px;
        animation: leaf-tumble ease-in-out infinite;
      }

      /* Shooting Stars Effect */
      .star {
        width: 3px;
        height: 80px;
        background: linear-gradient(to bottom, var(--overlay-particle-color, #ffffff), transparent);
        transform: rotate(-45deg);
        animation: star-shoot linear infinite;
      }

      /* Balloons Effect */
      .balloon {
        width: 24px;
        height: 30px;
        border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
        animation: balloon-rise ease-in-out infinite;
      }

      /* Lights Effect (Top String) */
      .lights-string {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: space-around;
        padding: 5px 0;
      }
      .light-bulb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        animation: light-twinkle 1.5s ease-in-out infinite alternate;
      }

      /* Schnee-Ansammlung am unteren Rand */
      .snow-accumulation {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 0px;
        background: linear-gradient(to top, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.75) 70%, transparent);
        border-radius: 12px 12px 0 0;
        box-shadow: 0 -4px 15px rgba(255, 255, 255, 0.6);
        transition: height 10s ease-in-out, opacity 4s ease-in-out;
        pointer-events: none;
        z-index: 10000;
      }

      /* KEYFRAME ANIMATIONS */
      @keyframes fall-straight {
        0% { transform: translateY(-10vh); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(105vh); opacity: 0; }
      }

      @keyframes fall-sway {
        0% { transform: translateY(-10vh) translateX(0px) rotate(0deg); opacity: 0; }
        20% { opacity: 1; }
        50% { transform: translateY(50vh) translateX(25px) rotate(180deg); }
        80% { opacity: 1; }
        100% { transform: translateY(105vh) translateX(-25px) rotate(360deg); opacity: 0; }
      }

      @keyframes fall-fast {
        0% { transform: translateY(-10vh); opacity: 0; }
        10% { opacity: 1; }
        100% { transform: translateY(105vh); opacity: 0; }
      }

      @keyframes flash-burst {
        0%, 92%, 94%, 97%, 100% { opacity: 0; }
        93% { opacity: 0.8; }
        96% { opacity: 0.95; }
      }

      @keyframes fog-drift {
        0% { transform: translateX(-20%); opacity: 0.2; }
        100% { transform: translateX(0%); opacity: 0.6; }
      }

      @keyframes storm-blow {
        0% { transform: translateY(-10vh) translateX(-10vw) rotate(-25deg); opacity: 0; }
        20% { opacity: 1; }
        100% { transform: translateY(105vh) translateX(50vw) rotate(-25deg); opacity: 0; }
      }

      @keyframes leaf-tumble {
        0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
        20% { opacity: 1; }
        50% { transform: translateY(50vh) translateX(40px) rotate(180deg); }
        100% { transform: translateY(105vh) translateX(-30px) rotate(360deg); opacity: 0; }
      }

      @keyframes star-shoot {
        0% { transform: translateY(-20vh) translateX(0) rotate(-45deg); opacity: 0; }
        10% { opacity: 1; }
        30% { transform: translateY(105vh) translateX(-100vw) rotate(-45deg); opacity: 0; }
        100% { opacity: 0; }
      }

      @keyframes balloon-rise {
        0% { transform: translateY(105vh) translateX(0); opacity: 0; }
        10% { opacity: 1; }
        50% { transform: translateY(50vh) translateX(20px); }
        100% { transform: translateY(-10vh) translateX(-15px); opacity: 0; }
      }

      @keyframes light-twinkle {
        0% { opacity: 0.3; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 10px currentColor; }
      }
    `;
  }

  // --- UNIVERSAL PRECIPITATION READER (DWD + Standard HA) ---
  _getPrecipitationValue() {
    if (!this._hass) return null;

    let entity = this._config.precipitation_entity ? this._hass.states[this._config.precipitation_entity] : null;
    if (!entity && this._config.weather_entity) {
      entity = this._hass.states[this._config.weather_entity];
    }

    if (!entity || !entity.attributes) return null;
    const attr = entity.attributes;

    if (attr.precipitation !== undefined && attr.precipitation !== null) {
      return parseFloat(attr.precipitation);
    }

    if (Array.isArray(attr.data) && attr.data.length > 0) {
      const firstEntry = attr.data[0];
      if (firstEntry && firstEntry.value !== undefined) {
        return parseFloat(firstEntry.value);
      }
    }

    if (attr.precipitation_intensity !== undefined) return parseFloat(attr.precipitation_intensity);
    if (attr.rain_intensity !== undefined) return parseFloat(attr.rain_intensity);

    return null;
  }

  _getCalculatedPreset() {
    if (!this._config.weather_intensity_auto) {
      return { preset: this._config.count_preset || 'medium', opacity: this._config.opacity_preset || 'medium', isFallback: false, val: 0 };
    }

    const precip = this._getPrecipitationValue();

    if (precip === null || isNaN(precip)) {
      return { preset: this._config.count_preset || 'medium', opacity: this._config.opacity_preset || 'medium', isFallback: true, val: 0 };
    }

    if (precip <= 0.5) {
      return { preset: 'low', opacity: 'low', isFallback: false, val: precip };
    } else if (precip <= 4.0) {
      return { preset: 'medium', opacity: 'medium', isFallback: false, val: precip };
    } else {
      return { preset: 'high', opacity: 'high', isFallback: false, val: precip };
    }
  }

  _updateSnowAccumulation(activeEffect, preset) {
    let snowBox = this.shadowRoot.querySelector('.snow-accumulation');
    
    if (activeEffect === 'snow') {
      if (!snowBox) {
        snowBox = document.createElement('div');
        snowBox.className = 'snow-accumulation';
        this.shadowRoot.appendChild(snowBox);
      }
      
      let targetHeight = '22px';
      if (preset === 'low') targetHeight = '12px';
      if (preset === 'high') targetHeight = '38px';

      setTimeout(() => {
        snowBox.style.height = targetHeight;
        snowBox.style.opacity = '1';
      }, 100);
    } else {
      if (snowBox) {
        snowBox.style.height = '0px';
        snowBox.style.opacity = '0';
        setTimeout(() => snowBox.remove(), 4000);
      }
    }
  }

  _getParticleCount(preset) {
    switch (preset) {
      case 'low': return 20;
      case 'high': return 80;
      case 'medium':
      default: return 45;
    }
  }

  _getOpacityValue(preset) {
    switch (preset) {
      case 'low': return 0.35;
      case 'high': return 0.95;
      case 'medium':
      default: return 0.65;
    }
  }

  render() {
    if (!this._hass || !this._config) return html``;

    let activeEffect = this._config.event;

    // Weather Auto Logic
    if (this._config.event === 'weather_auto' && this._config.weather_entity) {
      const wEntity = this._hass.states[this._config.weather_entity];
      if (wEntity) {
        const state = wEntity.state.toLowerCase();
        if (state.includes('rain') || state.includes('pouring')) activeEffect = 'rain';
        else if (state.includes('snow')) activeEffect = 'snow';
        else if (state.includes('hail')) activeEffect = 'hail';
        else if (state.includes('lightning')) activeEffect = 'lightning';
        else if (state.includes('fog')) activeEffect = 'fog';
        else if (state.includes('wind')) activeEffect = 'storm';
        else activeEffect = 'off';
      }
    }

    const { preset, opacity } = this._getCalculatedPreset();
    this._updateSnowAccumulation(activeEffect, preset);

    if (activeEffect === 'off') return html``;

    const count = this._getParticleCount(preset);
    const opacityVal = this._getOpacityValue(opacity);
    const particles = [];

    // Particle Generation
    if (activeEffect === 'lightning') {
      particles.push(html`<div class="lightning-flash"></div>`);
    } else if (activeEffect === 'fog') {
      particles.push(html`<div class="fog-cloud"></div>`);
    } else if (activeEffect === 'lights') {
      const colors = ['#ff4d4d', '#33cc33', '#3399ff', '#ffcc00', '#ff66cc'];
      const lightBulbs = Array.from({ length: 20 }).map((_, i) => html`
        <div class="light-bulb" style="background: ${colors[i % colors.length]}; color: ${colors[i % colors.length]}; animation-delay: ${(i * 0.2) % 1.5}s;"></div>
      `);
      particles.push(html`<div class="lights-string">${lightBulbs}</div>`);
    } else {
      for (let i = 0; i < count; i++) {
        const left = Math.random() * 100;
        const delay = Math.random() * -20; // Instant distribution (no start lag)
        const duration = 2 + Math.random() * 4;

        let particleClass = 'rain-drop';
        if (activeEffect === 'snow') particleClass = 'snow-flake';
        if (activeEffect === 'hail') particleClass = 'hail-stone';
        if (activeEffect === 'storm') particleClass = 'storm-line';
        if (activeEffect === 'leaves') particleClass = 'leaf';
        if (activeEffect === 'shooting_stars') particleClass = 'star';
        if (activeEffect === 'balloons') particleClass = 'balloon';

        let customStyle = `left: ${left}vw; animation-delay: ${delay}s; animation-duration: ${duration}s; opacity: ${opacityVal};`;

        if (activeEffect === 'leaves') {
          const leafColors = this._config.leaf_colors || ["#c9a227", "#a83232", "#d9812c"];
          const leafColor = leafColors[i % leafColors.length];
          particles.push(html`
            <svg class="particle leaf" style="${customStyle}" viewBox="0 0 24 24" fill="${leafColor}">
              <path d="M17,8C8,10 5,16 3,21C8,20 15,18 19,12C20.5,9.7 20,5 20,5C20,5 18.2,6.7 17,8Z"/>
            </svg>
          `);
        } else if (activeEffect === 'balloons') {
          const bColors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
          const bColor = bColors[i % bColors.length];
          particles.push(html`<div class="particle balloon" style="${customStyle} background: ${bColor};"></div>`);
        } else {
          particles.push(html`<div class="particle ${particleClass}" style="${customStyle}"></div>`);
        }
      }
    }

    return html`<div class="particle-container">${particles}</div>`;
  }

  static getConfigElement() {
    return document.createElement("weather-event-overlay-card-editor");
  }
}

customElements.define("weather-event-overlay-card", WeatherEventOverlayCard);

// ==========================================
// GUI EDITOR MIT LIVE STATUS BOXEN
// ==========================================
class WeatherEventOverlayCardEditor extends LitElement {
  static get properties() {
    return {
      _config: { type: Object },
      _hass: { type: Object }
    };
  }

  static get styles() {
    return css`
      .card-config { display: flex; flex-direction: column; gap: 12px; }
      .status-box {
        padding: 10px 14px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.9em;
        line-height: 1.4;
      }
      .status-green { background: rgba(76, 175, 80, 0.15); color: #2e7d32; border: 1px solid #4caf50; }
      .status-yellow { background: rgba(255, 193, 7, 0.15); color: #f57f17; border: 1px solid #ffc107; }
      .status-red { background: rgba(244, 67, 54, 0.15); color: #c62828; border: 1px solid #f44336; }
    `;
  }

  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const configValue = target.configValue;
    const value = target.type === 'ha-boolean' ? target.checked : target.value;

    if (this._config[configValue] === value) return;

    this._config = {
      ...this._config,
      [configValue]: value
    };

    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this._hass || !this._config) return html``;

    const isAuto = this._config.event === 'weather_auto';
    let statusBox = html``;

    if (isAuto) {
      const wEntity = this._config.weather_entity ? this._hass.states[this._config.weather_entity] : null;
      
      if (!wEntity) {
        statusBox = html`<div class="status-box status-red">❌ Bitte wähle eine gültige Wetter-Entity aus.</div>`;
      } else {
        const cardInstance = new WeatherEventOverlayCard();
        cardInstance._hass = this._hass;
        cardInstance._config = this._config;
        
        const calc = cardInstance._getCalculatedPreset();

        if (calc.isFallback) {
          statusBox = html`<div class="status-box status-yellow">⚠️ Kein Niederschlagswert in den Daten gefunden. Nutze manuelle Intensität als Rückfallebene.</div>`;
        } else {
          statusBox = html`<div class="status-box status-green">🟢 Live-Niederschlag: <b>${calc.val} mm/h</b> ➔ Berechnete Stärke: <b>${calc.preset.toUpperCase()}</b></div>`;
        }
      }
    }

    return html`
      <div class="card-config">
        ${statusBox}

        <ha-select
          label="Effekt"
          .configValue=${"event"}
          .value=${this._config.event || "off"}
          @selected=${this._valueChanged}
        >
          <mwc-list-item value="off">Aus</mwc-list-item>
          <mwc-list-item value="weather_auto">🌦️ Automatisch (nach Wetter)</mwc-list-item>
          <mwc-list-item value="rain">🌧️ Regen</mwc-list-item>
          <mwc-list-item value="snow">❄️ Schnee</mwc-list-item>
          <mwc-list-item value="hail">🧊 Hagel</mwc-list-item>
          <mwc-list-item value="lightning">⚡ Blitz</mwc-list-item>
          <mwc-list-item value="fog">🌫️ Nebel</mwc-list-item>
          <mwc-list-item value="storm">💨 Sturm</mwc-list-item>
          <mwc-list-item value="leaves">🍂 Herbstlaub</mwc-list-item>
          <mwc-list-item value="shooting_stars">🌠 Sternschnuppen</mwc-list-item>
          <mwc-list-item value="balloons">🎈 Luftballons</mwc-list-item>
          <mwc-list-item value="lights">💡 Lichterkette</mwc-list-item>
        </ha-select>

        ${isAuto ? html`
          <ha-entity-picker
            label="Wetter-Entity (z.B. weather.home)"
            .hass=${this._hass}
            .value=${this._config.weather_entity || ""}
            .configValue=${"weather_entity"}
            .includeDomains=${["weather"]}
            @value-changed=${this._valueChanged}
          ></ha-entity-picker>

          <ha-entity-picker
            label="Niederschlags-Entity (Optional, z.B. DWD Sensor)"
            .hass=${this._hass}
            .value=${this._config.precipitation_entity || ""}
            .configValue=${"precipitation_entity"}
            .includeDomains=${["sensor"]}
            @value-changed=${this._valueChanged}
          ></ha-entity-picker>

          <ha-formfield label="Intensität aus Wetterdaten (Automations-Modus)">
            <ha-switch
              .checked=${this._config.weather_intensity_auto !== false}
              .configValue=${"weather_intensity_auto"}
              @change=${this._valueChanged}
            ></ha-switch>
          </ha-formfield>
        ` : html`
          <ha-select
            label="Anzahl / Frequenz"
            .configValue=${"count_preset"}
            .value=${this._config.count_preset || "medium"}
            @selected=${this._valueChanged}
          >
            <mwc-list-item value="low">Wenig</mwc-list-item>
            <mwc-list-item value="medium">Mittel</mwc-list-item>
            <mwc-list-item value="high">Stark</mwc-list-item>
          </ha-select>

          <ha-select
            label="Deckkraft"
            .configValue=${"opacity_preset"}
            .value=${this._config.opacity_preset || "medium"}
            @selected=${this._valueChanged}
          >
            <mwc-list-item value="low">Dezent</mwc-list-item>
            <mwc-list-item value="medium">Mittel</mwc-list-item>
            <mwc-list-item value="high">Kräftig</mwc-list-item>
          </ha-select>
        `}
      </div>
    `;
  }
}

customElements.define("weather-event-overlay-card-editor", WeatherEventOverlayCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weather-event-overlay-card",
  name: "Weather & Event Overlay Card",
  description: "Dynamische Wetter- und Event-Animationen als Overlay über deinem Home Assistant Dashboard."
});
