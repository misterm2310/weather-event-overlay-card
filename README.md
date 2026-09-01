# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen (Regen, Schnee, Hagel, Blitz, Nebel, Sturm, Herbstlaub, Sternschnuppen, Sternenhimmel, Luftballons, Lichterkette, Weihnachtsmann & Spinne) über dein Dashboard legt. Inklusive vollständiger visueller GUI-Editor-Unterstützung, automatischer Theme-Anpassung und optionaler Wetter-Automatik mit echten Kombi-Effekten!

---

## 🎨 Features

* **13 Effekte:** Regen, Schnee, Hagel, Blitz (Gewitter), Nebel, Sturm/Windböen, Herbstlaub, Sternschnuppen, Sternenhimmel, Luftballons, Lichterkette, Weihnachtsmann & Spinne mit Netz.
* **🌦️ Optionale Wetter-Automatik:** Statt manuell einen Effekt auszuwählen, kann die Karte sich an einer echten `weather.*`-Entity orientieren und automatisch den passenden Effekt zeigen – regnet's laut Home Assistant, zeigt die Karte Regen; ist klarer Nachthimmel gemeldet, zeigt sie einen Sternenhimmel, usw.
* **⛈️ Echte Kombi-Effekte:** Meldet die Wetter-Entity "Schneeregen", laufen Schnee **und** Regen gleichzeitig; bei "Gewitter mit Regen" laufen Blitz **und** Regen gleichzeitig – statt nur einen der beiden Effekte willkürlich zu zeigen.
* **☃️ Wachsende Schneedecke:** Läuft der Schnee-Effekt eine Weile, sammelt sich unten am Bildschirmrand langsam eine echte kleine Schneeschicht an, statt dass die Flocken einfach spurlos verschwinden.
* **🎅 Weihnachtsmann:** Bunt illustrierter Schlitten mit 2 Rentieren fliegt periodisch quer über den Bildschirm (Standard: alle 3-4 Minuten) und verschwindet wieder, bis zum nächsten Mal.
* **🕷️ Spinne mit Netz:** Festes Spinnennetz oben rechts in der Ecke, eine Spinne seilt sich an einem Faden kontinuierlich rauf und runter – mit leuchtend roten Augen.
* **✨ Sternenhimmel:** Funkelnde Sterne, deren Farbe sich automatisch an Hell-/Dunkelmodus anpasst; läuft automatisch mit, wenn der Wetterbericht "klarer Nachthimmel" meldet.
* **🌗 Auto-Theme-Modus:** Erkennt automatisch den Hell- oder Dunkel-Modus von Home Assistant (sowie System-Themes) und passt die Farben (z. B. für Regen, Schnee, Nebel, Hagel, Sturm, Sternenhimmel und das Spinnennetz) dynamisch an. Der Weihnachtsmann hat bewusst ein festes buntes Farbschema (Gold/Rot/Weiß), da er eine mehrfarbige Illustration statt eines einfarbigen Elements ist.
* **🍂 Sofortige Verteilung:** Partikel wie Schnee und Laub rieseln direkt von der ersten Sekunde an gleichmäßig herunter – ganz ohne störenden Start-Schwung.
* **✨ Echtes "Kräftig":** Bei maximaler Deckkraft wird jeder Effekt spürbar kräftiger/deutlicher dargestellt, statt nur zufällig blass zu bleiben.
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

1. **Effekt** wählen – entweder einen festen Effekt (Regen, Schnee, Weihnachtsmann, ...) oder **"🌦️ Automatisch (nach Wetter)"**.
2. Bei "Automatisch": darunter erscheint **Wetter-Sensor** – dort deine `weather.*`-Entity aus der Liste auswählen (z. B. `weather.home`).
3. **Anzahl / Frequenz**, **Deckkraft / Helligkeit** und ggf. **Farbmodus** nach Geschmack einstellen.

Der Editor blendet dabei automatisch nur die Regler ein, die für den gewählten Effekt auch etwas bewirken:
* Bei **Blitz** und **Weihnachtsmann** gibt's keinen Farbmodus (Blitz blitzt immer weiß, der Weihnachtsmann ist eine feste bunte Illustration).
* Bei der **Spinne** gibt's keine Anzahl (es gibt ja nur die eine).

> 🎅 **Sonderfall Weihnachtsmann:** Hier steuert "Anzahl / Frequenz" NICHT die Partikelmenge, sondern wie oft er vorbeifliegt: Wenig ≈ alle 5-6 Minuten, Mittel ≈ alle 3-4 Minuten, Viel ≈ alle 1-2 Minuten.

### 🌦️ Wie die Wetter-Automatik genau funktioniert

Ist "Automatisch" aktiv, schaut die Karte sich den aktuellen Zustand deiner gewählten Wetter-Entity an und übersetzt ihn automatisch in einen (oder bei zwei Zuständen sogar zwei gleichzeitige) Effekt(e):

| HA-Wetterzustand | Effekt(e) |
|---|---|
| `rainy`, `pouring` | 🌧️ Regen |
| `snowy` | ❄️ Schnee |
| `snowy-rainy` | ❄️ Schnee **+** 🌧️ Regen gleichzeitig |
| `hail` | 🧊 Hagel |
| `lightning` | ⚡ Blitz |
| `lightning-rainy` | ⚡ Blitz **+** 🌧️ Regen gleichzeitig |
| `fog` | 🌫️ Nebel |
| `windy`, `windy-variant` | 💨 Sturm |
| `clear-night` | ✨ Sternenhimmel |
| alles andere (sonnig, wolkig, ...) | Aus |

**Wichtig:** Anzahl, Deckkraft und Farbmodus gelten bei aktiver Automatik als **ein gemeinsamer Wert für alle möglichen Wetter-Effekte** – es gibt keine getrennte Einstellung "Regen dezent, aber Schnee kräftig". Stellst du z. B. "Kräftig" ein, ist jeder automatisch ausgelöste Effekt kräftig, egal ob's gerade regnet, schneit oder hagelt – auch bei den Kombi-Zuständen laufen dann beide Effekte kräftig. Weihnachtsmann und Spinne laufen NICHT über die Wetter-Automatik, die wählst du bei Bedarf manuell aus.

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

### Weihnachtsmann alle 3-4 Minuten
```yaml
type: custom:weather-event-overlay-card
event: santa
count_preset: medium
opacity_preset: medium
```

### Spinne mit Netz (Auto-Farbmodus)
```yaml
type: custom:weather-event-overlay-card
event: spider
opacity_preset: medium
color_mode: auto
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
| `weather_auto` | 🌦️ Automatisch nach echter Wetter-Entity, inkl. Kombi-Effekten (siehe oben) |
| `rain` | 🌧️ Regen |
| `snow` | ❄️ Schnee (mit wachsender Schneedecke am unteren Rand) |
| `hail` | 🧊 Hagel (schnell, hart, wie Regen) |
| `lightning` | ⚡ Blitz / Gewitter |
| `fog` | 🌫️ Wabernde Nebelschwaden |
| `storm` | 💨 Sturm/Windböen (schräg & schnell) |
| `leaves` | 🍂 Herbstlaub mit 3-Farben-Verlauf |
| `shooting_stars` | 🌠 Sternschnuppen |
| `stars` | ✨ Funkelnder Sternenhimmel |
| `balloons` | 🎈 Aufsteigende Luftballons |
| `lights` | 💡 Blinkende Lichterkette am oberen Rand |
| `santa` | 🎅 Weihnachtsmann mit Schlitten & 2 Rentieren (periodischer Vorbeiflug, feste Farben) |
| `spider` | 🕷️ Spinnennetz oben rechts mit auf- und abseilender Spinne (rote leuchtende Augen, Netz mit Farbmodus) |

---

## 🔧 Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `event` | string | `off` | Welcher Effekt aktiv ist, oder `weather_auto` für die Wetter-Automatik (siehe Tabelle oben) |
| `weather_entity` | string | `""` | HA-Entity-ID einer `weather.*`-Entity, z. B. `weather.home` (nur relevant bei `event: weather_auto`) |
| `count_preset` | `low` \| `medium` \| `high` | `medium` | Anzahl bzw. Frequenz der Partikel – bei `weather_auto` gemeinsam für alle möglichen Effekte, bei `santa` stattdessen der Abstand zwischen den Vorbeiflügen |
| `opacity_preset` | `low` \| `medium` \| `high` | `medium` | Deckkraft/Helligkeit des Effekts – bei `weather_auto` ebenfalls gemeinsam für alle |
| `color_mode` | `auto` \| `custom` | `auto` | Automatische Theme-Erkennung oder feste Farbe |
| `color` | string (hex) oder `auto` | `auto` | Manuelle Farbe für Regen/Schnee/Nebel/Hagel/Sturm/Sternschnuppen/Sternenhimmel/Spinnennetz (nur bei `color_mode: custom`) – wirkungslos bei Blitz, Laub, Ballons, Lichterkette und Weihnachtsmann |
| `leaf_colors` | Array aus 3 Hex-Farben | `["#c9a227", "#a83232", "#d9812c"]` | Farbverlauf für den Laub-Effekt (nur per YAML editierbar, nicht im GUI-Editor) |
| `leaf_shape` | string (SVG-Pfad) | interne Standardform | Optionale eigene Blattform, nur per YAML (wird sicherheitsgeprüft) |

---

## 📄 Lizenz

MIT
