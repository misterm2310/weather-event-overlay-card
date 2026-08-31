# 🌦️ Weather & Event Overlay Card for Home Assistant (Lovelace)

Eine hochgradig anpassbare, performante und visuell ansprechende Custom Card für das Home Assistant Lovelace Dashboard. Sie legt sich transparent über deine Dashboard-Oberfläche und spielt dynamische Wetter- sowie Event-Animationen ab.

![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Custom%20Card-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Features

- **🌦️ Automatische Wetter-Erkennung (`weather_auto`):** Kopple die Karte einfach mit deiner `weather.`-Entität. Wenn es draußen regnet, schneit oder gewittert, wird der passende Effekt automatisch auf dem Dashboard gestartet.
- **⚡ Kombinationseffekte:** Unterstützt parallele Effekte wie `lightning-rainy` (Blitze & Regen gleichzeitig).
- **🎨 Visueller GUI-Editor:** Vollständig im Dashboard-Editor konfigurierbar – kein manuelles YAML-Schreiben nötig!
- **🌗 Smart Dark-Mode Support:** Passt Farben (z. B. Schneeflocken oder Regentropfen) automatisch an das aktive Dark- oder Light-Theme an.
- **🚀 Performance-optimiert:** 
  - Nutzt GPU-beschleunigte CSS-Animationen (`will-change: transform`).
  - Pausiert Animationen automatisch, wenn der Tab gewechselt oder im Hintergrund betrieben wird (spart Ressourcen auf Tablets/Raspberry Pi).

---

## 🎭 Verfügbare Effekte

| Kategorie | Effekt | Beschreibung |
| :--- | :--- | :--- |
| **Wetter** | 🌧️ **Regen** (`rain`) | Fallende Tropfen mit sanftem Farbverlauf |
| | ❄️ **Schnee** (`snow`) | Sanft schwebende Schneeflocken |
| | 🧊 **Hagel** (`hail`) | Schneller fallende Hagelkörner |
| | ⚡ **Blitz** (`lightning`) | Dynamische Bildschirm-Flashes bei Gewitter |
| | 🌫️ **Nebel** (`fog`) | Vorbeiziehende, weiche Nebelbänke |
| | 💨 **Sturm** (`storm`) | Windböen-Streifen über dem Bildschirm |
| **Events** | 🍂 **Laub** (`leaves`) | Drehende Herbstblätter mit Farbverlauf |
| | 🌠 **Sternschnuppen** (`shooting_stars`) | Vorbeiziehende Sternschnuppen |
| | 🎈 **Luftballons** (`balloons`) | Aufsteigende bunte Ballons (z. B. für Geburtstage) |
| | 💡 **Lichterkette** (`lights`) | Blinkende Lichterkette am oberen Bildschirmrand |

---

## 📦 Installation

### Manuelle Installation

1. Lade die Datei `weather-event-overlay-card.js` herunter.
2. Kopiere die Datei in deinen Home Assistant Ordner: `/config/www/weather-event-overlay-card.js`.
3. Gehe in Home Assistant zu **Einstellungen** -> **Dashboards** -> Oben rechts auf die **drei Punkte** -> **Ressourcen**.
4. Klicke auf **Ressource hinzufügen**:
   - **URL:** `/local/weather-event-overlay-card.js?v=1.0.0`
   - **Ressourcentyp:** `JavaScript-Modul`
5. Lade deine Dashboard-Seite neu (Strg + F5).

---

## ⚙️ Konfiguration

Du kannst die Karte ganz einfach über den **visuellen Editor** deines Dashboards hinzufügen oder direkt per **YAML**.

### Beispiel: Automatischer Wetter-Modus (Empfohlen)

```yaml
type: custom:weather-event-overlay-card
event: weather_auto
weather_entity: weather.home
count_preset: medium
opacity_preset: medium
color_mode: auto
