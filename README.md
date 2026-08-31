# 🌦️ Weather & Event Overlay Card für Home Assistant

Eine extrem flexible Lovelace Custom Card für Home Assistant zur Anzeige von dynamischen Wetter- und Event-Animations-Overlays (Regen, Schnee, Blitze, Sternschnuppen, Laub, Spinnweben, Weihnachtsmann u.v.m.) mit integriertem visuellem GUI-Editor.

Die Karte rendert sich **ohne sichtbaren Rahmen oder Platzbedarf** direkt als transparentes Overlay über deinem Dashboard (`getCardSize() { return 0; }`).

---

## 🚀 Features

* **Visueller GUI-Editor:** Vollständig über den Lovelace-Editor konfigurierbar – kein manuelles YAML notwendig (`getConfigElement()`).
* **Automatische Wetter-Anpassung:** Erkennt den Zustand deiner `weather.*` Entität (Regen, Schnee, Hagel, Blitz, Nebel, Sturm) und schaltet die passenden Effekte automatisch.
* **Manuelle Event-Steuerung:** Schalte spezifische Effekte für Partys, Feiertage oder Dekorationen dauerhaft ein.
* **Automatische Theme-Erkennung:** Unterstützt Hell- und Dunkelmodus mit dynamischer Farbanpassung (`isDarkModeActive`).
* **Performance-optimiert:** Effekte werden automatisch pausiert, wenn der Browser-Tab nicht aktiv ist (`visibilitychange`).

---

## 🎨 Verfügbare Effekte

| Kategorie | Effekt | Beschreibung |
| :--- | :--- | :--- |
| **Wetter** | 🌧️ Regen | Sanfter bis starker Regenschauer |
| | ❄️ Schnee | Treibende Schneeflocken |
| | 🧊 Hagel | Schnelle Hagelkörner |
| | ⚡ Blitz | Realistisches Blitzen/Flickern des Bildschirms |
| | 🌫️ Nebel | Vorbeiziehende Nebelschwaden |
| | 💨 Sturm | Vorbeiziehende Windböen |
| | 🌌 Sternenhimmel | Animierter, funkelnder Nachthimmel |
| **Events & Deko** | 🍂 Laub | Herabfallendes Herbstlaub (mit anpassbarem Farbverlauf) |
| | 🌠 Sternschnuppen | Sternschnuppen am Nachthimmel |
| | 🎈 Luftballons | Aufsteigende bunte Partyballons |
| | 💡 Lichterkette | Blinkende Party-/Weihnachtslichterkette oben |
| | 🕸️ Spinnweben & Spinne | Spinnweben oben rechts mit einer herabfallenden Spinne |
| | 🎅 Weihnachtsmann | Santa-Schlitten fliegt über den Bildschirm |

---

## 📦 Installation

### Manuell über WWW-Ordner

1. Lade die Datei `weather-event-overlay-card.js` herunter.
2. Kopiere die Datei in deinen Home Assistant Ordner: `/config/www/weather-event-overlay-card.js`.
3. Füge die Ressource in Home Assistant hinzu:
   * Gehe zu **Einstellungen** ➔ **Dashboards** ➔ **Drei Punkte oben rechts** ➔ **Ressourcen**.
   * Klicke auf **Ressource hinzufügen**.
   * **URL:** `/local/weather-event-overlay-card.js`
   * **Typ:** `JavaScript-Modul`
4. Lade das Dashboard neu.

---

## ⚙️ Konfigurationsoptionen (Properties)

| Name | Typ | Standard | Beschreibung |
| :--- | :--- | :--- | :--- |
| `event` | string | `"off"` | Der aktive Effekt. Mögliche Werte: `off`, `weather_auto`, `rain`, `snow`, `hail`, `lightning`, `fog`, `storm`, `leaves`, `shooting_stars`, `balloons`, `lights`, `spider_web`, `santa_sleigh`, `clear_night`. (Kombinationen per Komma möglich, z. B. `"snow, rain"`). |
| `weather_entity` | string | `""` | Entitäts-ID einer Wetter-Entität (wird nur verwendet, wenn `event: weather_auto` gesetzt ist). |
| `count_preset` | string | `"medium"` | Dichte bzw. Anzahl der Partikel. Werte: `low`, `medium`, `high`. |
| `opacity_preset` | string | `"medium"` | Transparenz der Effekte. Werte: `low`, `medium`, `high`. |
| `color` | string | `"auto"` | Hauptfarbe des Effekts (Hex-Code wie `#ff0000` oder `"auto"` für automatische Anpassung an den Dark/Light-Mode). |
| `leaf_colors` | array | `["#c9a227", "#a83232", "#d9812c"]` | Array aus drei Farben für den Laub-Effekt (Farbverlauf). |

---

## 💡 YAML-Beispiele

Füge die Karte einfach an einer beliebigen Stelle in deinem Dashboard ein. Sie benötigt keinen Platz im Raster.

### Beispiel 1: Automatischer Wettermodus

```yaml
type: custom:weather-event-overlay-card
event: weather_auto
weather_entity: weather.home
count_preset: medium
opacity_preset: medium
color: auto
