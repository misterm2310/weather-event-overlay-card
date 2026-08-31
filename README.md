# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen (Regen, Schnee, Hagel, Blitz, Nebel, Sturm, Herbstlaub, Sternschnuppen, Luftballons & Lichterkette) über dein Dashboard legt. Inklusive vollständiger visueller GUI-Editor-Unterstützung, automatischer Theme-Anpassung und optionaler Wetter-Automatik!

---

## 🎨 Features

* **Zehn Effekte:** Regen, Schnee, Hagel, Blitz (Gewitter), Nebel, Sturm/Windböen, Herbstlaub, Sternschnuppen, Luftballons & Lichterkette.
* **🌦️ Optionale Wetter-Automatik:** Statt manuell einen Effekt auszuwählen, kann die Karte sich an einer echten `weather.*`-Entity orientieren und automatisch den passenden Effekt zeigen – regnet's laut Home Assistant, zeigt die Karte Regen; schneit's, zeigt sie Schnee, usw.
* **🌗 Auto-Theme-Modus:** Erkennt automatisch den Hell- oder Dunkel-Modus von Home Assistant (sowie System-Themes) und passt die Farben (z. B. für Regen, Schnee, Nebel, Hagel und Sturm) dynamisch an.
* **🍂 Sofortige Verteilung:** Partikel wie Schnee und Laub rieseln direkt von der ersten Sekunde an gleichmäßig herunter – ganz ohne störenden Start-Schwung.
* **✨ Echtes "Kräftig":** Bei maximaler Deckkraft wird jedes Partikel spürbar kräftiger dargestellt, statt nur zufällig blass zu bleiben.
* **GUI-Editor mit Kontext:** Der Editor blendet nur die Regler ein, die für den aktuell gewählten Effekt auch wirklich etwas tun, und erklärt bei jedem Regler kurz, was er macht.
* **🔒 Sicherheit:** Benutzerdefinierte Laub-SVG-Formen (per YAML) werden über eine Whitelist geprüft, bevor sie gerendert werden.
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

## 🖱️ Einrichtung über den GUI-Editor (empfohlen)

Karte zum Dashboard hinzufügen → **Weather & Event Overlay Card** auswählen → im Editor:

1. **Effekt** wählen – entweder einen festen Effekt (Regen, Schnee, ...) oder **"🌦️ Automatisch (nach Wetter)"**.
2. Bei "Automatisch": darunter erscheint **Wetter-Sensor** – dort deine `weather.*`-Entity aus der Liste auswählen (z. B. `weather.home`).
3. **Anzahl / Frequenz**, **Deckkraft / Helligkeit** und ggf. **Farbmodus** nach Geschmack einstellen.

Der Editor blendet dabei automatisch nur die Regler ein, die für den gewählten Effekt auch etwas bewirken – z. B. gibt's bei Blitz keinen Farbmodus, weil der immer weiß blitzt.

### 🌦️ Wie die Wetter-Automatik genau funktioniert

Ist "Automatisch" aktiv, schaut die Karte sich den aktuellen Zustand deiner gewählten Wetter-Entity an und übersetzt ihn automatisch in einen Effekt:

| HA-Wetterzustand | Effekt |
|---|---|
| `rainy`, `pouring` | 🌧️ Regen |
| `snowy`, `snowy-rainy` | ❄️ Schnee |
| `hail` | 🧊 Hagel |
| `lightning`, `lightning-rainy` | ⚡ Blitz |
| `fog` | 🌫️ Nebel |
| `windy`, `windy-variant` | 💨 Sturm |
| alles andere (sonnig, wolkig, klar, ...) | Aus |

**Wichtig:** Anzahl, Deckkraft und Farbmodus gelten bei aktiver Automatik als **ein gemeinsamer Wert für alle möglichen Wetter-Effekte** – es gibt keine getrennte Einstellung "Regen dezent, aber Schnee kräftig". Stellst du z. B. "Kräftig" ein, ist jeder automatisch ausgelöste Effekt kräftig, egal ob's gerade regnet, schneit oder hagelt.

---

## ⚙️ Verwendung (YAML)

Du kannst die Karte auch komplett per YAML konfigurieren:

### Wetter-Automatik
```yaml
type: custom:weather-event-overlay-card
event: weather_auto
weather_entity: weather.home
count_preset: medium
opacity_preset: medium
color_mode: auto
```

### Manueller Effekt mit Auto-Farbmodus
```yaml
type: custom:weather-event-overlay-card
event: rain
count_preset: medium
opacity_preset: medium
color_mode: auto
color: auto
```

### Manueller Effekt mit fester Farbe
```yaml
type: custom:weather-event-overlay-card
event: snow
count_preset: high
opacity_preset: high
color_mode: custom
color: "#a0c4ff"
```

### Herbstlaub mit eigenem Farbverlauf (nur per YAML einstellbar)
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

## 🧩 Verfügbare Effekte

| `event` | Beschreibung |
|---|---|
| `off` | Kein Effekt (Standard) |
| `weather_auto` | 🌦️ Automatisch nach echter Wetter-Entity (siehe oben) |
| `rain` | 🌧️ Regen |
| `snow` | ❄️ Schnee |
| `hail` | 🧊 Hagel (schnell, hart, wie Regen) |
| `lightning` | ⚡ Blitz / Gewitter |
| `fog` | 🌫️ Wabernde Nebelschwaden |
| `storm` | 💨 Sturm/Windböen (schräg & schnell) |
| `leaves` | 🍂 Herbstlaub mit 3-Farben-Verlauf |
| `shooting_stars` | 🌠 Sternschnuppen |
| `balloons` | 🎈 Aufsteigende Luftballons |
| `lights` | 💡 Blinkende Lichterkette am oberen Rand |

---

## 🔧 Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `event` | string | `off` | Welcher Effekt aktiv ist, oder `weather_auto` für die Wetter-Automatik (siehe Tabelle oben) |
| `weather_entity` | string | `""` | HA-Entity-ID einer `weather.*`-Entity, z. B. `weather.home` (nur relevant bei `event: weather_auto`) |
| `count_preset` | `low` \| `medium` \| `high` | `medium` | Anzahl bzw. Frequenz der Partikel – bei `weather_auto` gemeinsam für alle möglichen Effekte |
| `opacity_preset` | `low` \| `medium` \| `high` | `medium` | Deckkraft/Helligkeit des Effekts – bei `weather_auto` ebenfalls gemeinsam für alle |
| `color_mode` | `auto` \| `custom` | `auto` | Automatische Theme-Erkennung oder feste Farbe |
| `color` | string (hex) oder `auto` | `auto` | Manuelle Farbe für Regen/Schnee/Nebel/Hagel/Sturm/Sternschnuppen (nur bei `color_mode: custom`) – wirkungslos bei Blitz, Laub, Ballons und Lichterkette |
| `leaf_colors` | Array aus 3 Hex-Farben | `["#c9a227", "#a83232", "#d9812c"]` | Farbverlauf für den Laub-Effekt (nur per YAML editierbar, nicht im GUI-Editor) |
| `leaf_shape` | string (SVG-Pfad) | interne Standardform | Optionale eigene Blattform, nur per YAML (wird sicherheitsgeprüft) |

---

## 📄 Lizenz

MIT
