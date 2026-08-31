# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen (Regen, Schnee, Herbstlaub, Luftballons, Lichterketten, Sternschnuppen, Blitze, Nebel, Hagel & Sturm) über dein Dashboard legt. Inklusive vollständiger visueller GUI-Editor-Unterstützung und automatischer Theme-Anpassung!

---

## 🎨 Features

* **Zehn Events:** Regen, Schnee, Laubfall, Luftballons, Lichterkette, Sternschnuppen, Blitze (Gewitter), Nebel, Hagel & Sturm/Windböen.
* **🌗 Auto-Theme-Modus:** Erkennt automatisch den Hell- oder Dunkel-Modus von Home Assistant (sowie System-Themes) und passt die Farben (z. B. für Regen, Schnee, Nebel, Hagel und Sturm) dynamisch an.
* **🍂 Sofortige Verteilung:** Partikel wie Schnee und Laub rieseln direkt von der ersten Sekunde an gleichmäßig herunter – ganz ohne störenden Start-Schwung.
* **✨ Echtes "Kräftig":** Bei maximaler Deckkraft wird jedes Partikel spürbar kräftiger dargestellt, statt nur zufällig blass zu bleiben.
* **GUI-Editor:** Vollständig und komfortabel über die Home Assistant Benutzeroberfläche konfigurierbar.
* **Feinjustierung:** Frequenz/Anzahl, Deckkraft, Moduswahl (Auto/Manuell) und individuelle Farben (z. B. 3-Farben-Verlauf für Herbstlaub) direkt im Editor anpassbar.
* **🔒 Sicherheit:** Benutzerdefinierte Laub-SVG-Formen werden über eine Whitelist geprüft, bevor sie gerendert werden.
* **🔋 Akku-schonend:** Animationen pausieren automatisch, sobald das Dashboard-Tab im Hintergrund ist (z. B. gesperrtes Tablet an der Wand).
* **Performance-Schonend:** Basiert auf leichten CSS3-Animationen für minimale System- und Akkubelastung auf Tablets und Smartphones.

---

## 📦 Installation

### Über HACS (Empfohlen)

1. Öffne **HACS** in deiner Home Assistant Seitenleiste.
2. Klicke oben rechts auf die drei Punkte (`⋮`) → **Benutzerdefinierte Repositories**.
3. Füge deine GitHub-Repository-URL ein:
   `https://github.com/misterm2310/weather-event-overlay-card`
4. Wähle als Kategorie **Lovelace**.
5. Klicke auf **Hinzufügen** und anschließend auf **Herunterladen**.
6. Lade dein Dashboard neu (`Strg` + `F5`).

---

### Manuelle Installation

1. Lade die Datei `weather-event-overlay-card.js` aus dem aktuellen Release herunter.
2. Kopiere die Datei in deinen Home Assistant Ordner: `/config/www/weather-event-overlay-card.js`.
3. Gehe in Home Assistant zu **Einstellungen → Dashboards → Drei Punkte oben rechts → Ressourcen**.
4. Füge eine neue Ressource hinzu:
   * **URL:** `/local/weather-event-overlay-card.js`
   * **Typ:** JavaScript-Modul
5. Lade dein Dashboard neu.

> 💡 **Tipp bei Update-Problemen:** Falls nach einem Update alles beim Alten bleibt, liegt's fast immer am Browser-Cache. Harten Reload machen (`Strg` + `Shift` + `R`) oder die Ressourcen-URL kurz um `?v=2` (nächste Zahl hochzählen) ergänzen.

---

## ⚙️ Verwendung (YAML)

Du kannst die Karte ganz einfach über den **visuellen GUI-Editor** konfigurieren. Wenn du lieber YAML nutzt, findest du hier Beispiele:

### Automatischer Farbmodus (Empfohlen)
```yaml
type: custom:weather-event-overlay-card
event: rain
count_preset: medium
opacity_preset: medium
color_mode: auto
color: auto
```

### Manuelle Farbe
```yaml
type: custom:weather-event-overlay-card
event: snow
count_preset: high
opacity_preset: high
color_mode: custom
color: "#a0c4ff"
```

### Herbstlaub mit eigenem Farbverlauf
```yaml
type: custom:weather-event-overlay-card
event: leaves
count_preset: medium
opacity_preset: medium
leaf_colors:
  - "#c9a227"
  - "#a83232"
  - "#d9812c"
```

---

## 🧩 Verfügbare Events

| `event` | Beschreibung |
|---|---|
| `off` | Kein Effekt (Standard) |
| `rain` | 🌧️ Regen |
| `snow` | ❄️ Schnee |
| `leaves` | 🍂 Herbstlaub mit 3-Farben-Verlauf |
| `balloons` | 🎈 Aufsteigende Luftballons |
| `lights` | 💡 Blinkende Lichterkette am oberen Rand |
| `shooting_stars` | 🌠 Sternschnuppen |
| `lightning` | ⚡ Blitze / Gewitter |
| `fog` | 🌫️ Wabernde Nebelschwaden |
| `hail` | 🧊 Hagel (schnell, hart, wie Regen) |
| `storm` | 💨 Sturm/Windböen (schräg & schnell) |

---

## 🔧 Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `event` | string | `off` | Welcher Effekt aktiv ist (siehe Tabelle oben) |
| `count_preset` | `low` \| `medium` \| `high` | `medium` | Anzahl bzw. Frequenz der Partikel |
| `opacity_preset` | `low` \| `medium` \| `high` | `medium` | Deckkraft/Helligkeit des Effekts |
| `color_mode` | `auto` \| `custom` | `auto` | Automatische Theme-Erkennung oder feste Farbe |
| `color` | string (hex) oder `auto` | `auto` | Manuelle Farbe für Regen/Schnee/Nebel/Hagel/Sturm/Sternschnuppen (nur bei `color_mode: custom`) |
| `leaf_colors` | Array aus 3 Hex-Farben | `["#c9a227", "#a83232", "#d9812c"]` | Farbverlauf für den Laub-Effekt |
| `leaf_shape` | string (SVG-Pfad) | interne Standardform | Optionale eigene Blattform (wird sicherheitsgeprüft) |

---

## 📄 Lizenz

MIT
