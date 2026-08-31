# 🌦️ Weather & Event Overlay Card für Home Assistant

Eine extrem flexible Lovelace Custom Card für Home Assistant zur Anzeige von dynamischen Wetter- und Event-Animations-Overlays (Regen, Schnee, Blitze, Sternschnuppen, Laub, Spinnweben, Weihnachtsmann u.v.m.).

Die Karte rendert sich **ohne sichtbaren Rahmen oder Platzbedarf** direkt als transparentes Overlay über deinem Dashboard.

---

## 🚀 Features

* **Visueller GUI-Editor:** Vollständig über den Lovelace-Editor konfigurierbar – kein manuelles YAML notwendig.
* **Automatische Wetter-Anpassung:** Erkennt den Zustand deiner `weather.*` Entität (Regen, Schnee, Hagel, Blitz, Nebel, Sturm) und schaltet die passenden Effekte automatisch.
* **Manuelle Event-Steuerung:** Schalte spezifische Effekte für Partys, Feiertage oder Dekorationen dauerhaft ein.
* **Automatische Theme-Erkennung:** Unterstützt Hell- und Dunkelmodus mit dynamischer Farbanpassung.
* **Performance-optimiert:** Effekte werden automatisch pausiert, wenn der Browser-Tab nicht aktiv ist.

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
| **Events & Deko** | 🍂 Laub | Herabfallendes Herbstlaub |
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
   * Gehe zu **Einstellungen** ➔ **Dashboard** ➔ **Drei Punkte oben rechts** ➔ **Ressourcen**.
   * Klicke auf **Ressource hinzufügen**.
   * **URL:** `/local/weather-event-overlay-card.js`
   * **Typ:** `JavaScript-Modul`
4. Lade das Dashboard neu.

---

## ⚙️ Anwendung & YAML-Beispiele

Füge die Karte einfach an einer beliebigen Stelle in deinem Dashboard ein. Sie benötigt keinen Platz im Raster.

### Beispiel 1: Automatischer Wettermodus

```yaml
type: custom:weather-event-overlay-card
event: weather_auto
weather_entity: weather.home
count_preset: medium
opacity_preset: medium
color_mode: auto
