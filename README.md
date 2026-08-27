# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen (Regen, Schnee, Herbstlaub, Luftballons, Lichterketten, Sternschnuppen & Blitze) über dein Dashboard legt. Inklusive visueller GUI-Editor-Unterstützung!

## Features

- **Events:** Regen, Schnee, Laubfall, Luftballons, Lichterkette, Sternschnuppen, Blitze (Gewitter).
- **GUI-Editor:** Vollständig über die Home Assistant Oberfläche konfigurierbar.
- **Anpassbar:** Anzahl/Frequenz, Deckkraft und Farben direkt einstellbar.
- **Performance-Schonend:** Basiert auf reinen CSS3-Animationen.

## Installation

### Manuell

1. Lade die Datei `weather-event-overlay-card.js` herunter.
2. Kopiere sie in deinen Home Assistant Ordner: `/config/www/weather-event-overlay-card.js`.
3. Gehe in Home Assistant zu **Einstellungen -> Dashboards -> Drei Punkte oben rechts -> Ressourcen**.
4. Füge eine neue Ressource hinzu:
   - **URL:** `/local/weather-event-overlay-card.js`
   - **Typ:** JavaScript-Modul
5. Lade dein Dashboard neu.

## Verwendung (YAML)

```yaml
type: custom:weather-event-overlay-card
event: rain
count_preset: medium
opacity_preset: medium
color: '#a0c4ff'
