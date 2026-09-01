# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen über dein Dashboard legt – von echtem Wetter (Regen, Schnee, Hagel, Blitz, Nebel, Sturm, Wolken-Drift) über Himmelsphänomene (Sternenhimmel, Sternschnuppen, Wunschstern, Komet) bis zu Tieren und Deko-Effekten (Herbstlaub, Luftballons, Lichterkette, Weihnachtsmann, Spinne mit Netz, goldener Labrador, Eichhörnchen, Fledermäuse, Eule, Biene, Enten-Familie). Inklusive vollständiger visueller GUI-Editor-Unterstützung, automatischer Theme-Anpassung und optionaler Wetter-Automatik mit echten Kombi-Effekten.

---

## 🎨 Features

* **22 Effekte** – siehe Tabelle weiter unten für die komplette Liste.
* **🌦️ Optionale Wetter-Automatik:** Statt manuell einen Effekt auszuwählen, kann die Karte sich an einer echten `weather.*`-Entity orientieren und automatisch den passenden Effekt zeigen.
* **⛈️ Echte Kombi-Effekte:** Meldet die Wetter-Entity "Schneeregen", laufen Schnee **und** Regen gleichzeitig; bei "Gewitter mit Regen" laufen Blitz **und** Regen gleichzeitig.
* **☃️ Wachsende Schneedecke:** Läuft der Schnee-Effekt eine Weile, sammelt sich unten am Bildschirmrand langsam eine echte kleine Schneeschicht an.
* **🎅🐕🐿️🐝🦆☄️ Periodisch durchlaufende Figuren:** Weihnachtsmann, Labrador, Eichhörnchen, Biene, Enten-Familie und Komet ziehen periodisch durchs Bild statt dauerhaft sichtbar zu sein – wie oft, stellst du über "Anzahl/Frequenz" ein (alle 1-6 Minuten). Läuft robust auch dann korrekt weiter, wenn die Karte durch häufige Dashboard-Updates (z. B. eine laufende Timer-Entity) zwischendurch neu rendert – Position, Höhe und Zeitpunkt bleiben dabei stabil, statt bei jedem Neu-Rendern zu springen.
* **🕷️ Spinne mit Netz:** Mathematisch berechnetes, symmetrisches Netz oben rechts, eine Spinne mit blinkenden roten Augen seilt sich daran auf und ab.
* **🐕 Goldener Labrador:** Läuft mit echter Beinbewegung (diagonale Beinpaare schwingen gegenläufig wie im echten Trab).
* **🦇 Fledermäuse:** Mehrere flatternde Silhouetten auf wellenförmigen, unregelmäßigen Flugbahnen.
* **🦉 Eule:** Sitzt ruhig in einer Ecke, blinzelt gelegentlich und dreht leicht den Kopf.
* **🐝 Biene:** Zickzackt in einem verschlungenen Pfad übers Bild statt geradeaus zu fliegen.
* **🦆 Enten-Familie:** Eine große Ente läuft voran, mehrere kleine Küken watscheln im Gänsemarsch hinterher.
* **🌤️ Wolken-Drift:** Mehrere weiche, verschwommene Wolken ziehen ganz ruhig und langsam übers Bild.
* **⭐ Wunschstern-Funkeln:** Ein einzelner, extra heller Stern blitzt an einer festen Position immer wieder kurz auf.
* **🌗 Auto-Theme-Modus mit View-Theme-Unterstützung:** Erkennt automatisch Hell-/Dunkelmodus – auch wenn das Theme nur auf einer einzelnen Dashboard-Seite (View-Theme) statt global gesetzt ist.
* **✨ Echtes "Kräftig":** Bei maximaler Deckkraft wird jeder Effekt spürbar kräftiger/deutlicher dargestellt.
* **GUI-Editor mit Kontext:** Der Editor blendet nur die Regler ein, die für den aktuell gewählten Effekt auch wirklich etwas tun, und erklärt passend zum gewählten Effekt, was jeder Regler macht.
* **🔒 Sicherheit:** Benutzerdefinierte Laub-SVG-Formen (per YAML) werden über eine Whitelist geprüft.
* **🔋 Akku-schonend:** Animationen pausieren automatisch, sobald das Dashboard-Tab im Hintergrund ist.
* **🎯 Robuste Sichtbarkeit:** Die Effekte werden in einen unabhängigen Container direkt in `<body>` gerendert - dadurch werden sie korrekt als Vollbild-Overlay angezeigt, selbst in komplexen, tief verschachtelten Dashboard-Layouts.
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

1. **Effekt** wählen – entweder einen festen Effekt (Regen, Schnee, Eichhörnchen, ...) oder **"🌦️ Automatisch (nach Wetter)"**.
2. Bei "Automatisch": darunter erscheint **Wetter-Sensor** – dort deine `weather.*`-Entity aus der Liste auswählen.
3. **Anzahl / Frequenz**, **Deckkraft / Helligkeit** und ggf. **Farbmodus** nach Geschmack einstellen.

Der Editor blendet dabei automatisch nur die Regler ein, die für den gewählten Effekt auch etwas bewirken:
* Bei **Blitz, Weihnachtsmann, Hund, Eichhörnchen, Fledermäuse, Eule, Biene, Wolken-Drift und Enten-Familie** gibt's keinen Farbmodus (feste Farben).
* Bei der **Spinne, Eule und Wunschstern** gibt's keine Anzahl (es gibt jeweils nur die eine).
* Bei **Weihnachtsmann, Hund, Eichhörnchen, Biene, Enten-Familie und Komet** steuert "Anzahl/Frequenz" NICHT eine Partikelmenge, sondern wie oft die Figur durchs Bild zieht: Wenig ≈ alle 5-6 Minuten, Mittel ≈ alle 3-4 Minuten, Viel ≈ alle 1-2 Minuten.

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

**Wichtig:** Anzahl, Deckkraft und Farbmodus gelten bei aktiver Automatik als **ein gemeinsamer Wert für alle möglichen Wetter-Effekte**. Alle Tier- und Deko-Effekte (Weihnachtsmann, Hund, Eichhörnchen, Fledermäuse, Eule, Biene, Wolken-Drift, Enten-Familie, Wunschstern, Spinne) laufen NICHT über die Wetter-Automatik, die wählst du bei Bedarf manuell aus.

---

## ⚙️ Verwendung (YAML)

### Wetter-Automatik
```yaml
type: custom:weather-event-overlay-card
event: weather_auto
weather_entity: weather.home
count_preset: medium
opacity_preset: medium
color_mode: auto
```

### Eichhörnchen (schnell, alle 3-4 Min.)
```yaml
type: custom:weather-event-overlay-card
event: squirrel
count_preset: medium
opacity_preset: medium
```

### Fledermäuse
```yaml
type: custom:weather-event-overlay-card
event: bats
count_preset: medium
opacity_preset: high
```

### Eule (ruhig, keine Anzahl nötig)
```yaml
type: custom:weather-event-overlay-card
event: owl
opacity_preset: medium
```

### Biene
```yaml
type: custom:weather-event-overlay-card
event: bee
count_preset: medium
opacity_preset: medium
```

### Wolken-Drift
```yaml
type: custom:weather-event-overlay-card
event: clouds
count_preset: low
opacity_preset: medium
```

### Enten-Familie
```yaml
type: custom:weather-event-overlay-card
event: ducks
count_preset: medium
opacity_preset: medium
```

### Wunschstern-Funkeln (Auto-Farbmodus)
```yaml
type: custom:weather-event-overlay-card
event: wishstar
opacity_preset: high
color_mode: auto
```

### Komet (selten, dramatisch)
```yaml
type: custom:weather-event-overlay-card
event: comet
count_preset: low
opacity_preset: high
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
| `hail` | 🧊 Hagel |
| `lightning` | ⚡ Blitz / Gewitter |
| `fog` | 🌫️ Wabernde Nebelschwaden |
| `storm` | 💨 Sturm/Windböen |
| `clouds` | 🌤️ Ruhig ziehende Wolken |
| `leaves` | 🍂 Herbstlaub mit 3-Farben-Verlauf |
| `shooting_stars` | 🌠 Sternschnuppen |
| `stars` | ✨ Funkelnder Sternenhimmel |
| `wishstar` | ⭐ Ein einzelner Wunschstern, der immer wieder kurz aufblitzt |
| `comet` | ☄️ Seltener, dramatischer Komet mit langem Schweif |
| `balloons` | 🎈 Aufsteigende Luftballons |
| `lights` | 💡 Blinkende Lichterkette am oberen Rand |
| `santa` | 🎅 Weihnachtsmann mit Schlitten & 2 Rentieren (periodischer Vorbeiflug) |
| `spider` | 🕷️ Spinnennetz mit auf- und abseilender Spinne (blinkende rote Augen) |
| `dog` | 🐕 Goldener Labrador mit echter Lauf-Beinbewegung |
| `squirrel` | 🐿️ Eichhörnchen, huscht schnell und hoppelnd durchs Bild |
| `bats` | 🦇 Mehrere flatternde Fledermäuse |
| `owl` | 🦉 Eule, sitzt ruhig in der Ecke und blinzelt |
| `bee` | 🐝 Biene im Zickzack-Flug |
| `ducks` | 🦆 Enten-Familie im Gänsemarsch |

---

## 🔧 Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `event` | string | `off` | Welcher Effekt aktiv ist, oder `weather_auto` für die Wetter-Automatik (siehe Tabelle oben) |
| `weather_entity` | string | `""` | HA-Entity-ID einer `weather.*`-Entity, z. B. `weather.home` (nur relevant bei `event: weather_auto`) |
| `count_preset` | `low` \| `medium` \| `high` | `medium` | Anzahl bzw. Frequenz der Partikel – bei `weather_auto` gemeinsam für alle möglichen Effekte, bei `santa`/`dog`/`squirrel`/`bee`/`ducks`/`comet` stattdessen der Abstand zwischen den Durchgängen |
| `opacity_preset` | `low` \| `medium` \| `high` | `medium` | Deckkraft/Helligkeit des Effekts |
| `color_mode` | `auto` \| `custom` | `auto` | Automatische Theme-Erkennung oder feste Farbe (nur bei Effekten mit Farbmodus) |
| `color` | string (hex) oder `auto` | `auto` | Manuelle Farbe für Effekte mit Farbmodus (Regen, Schnee, Nebel, Hagel, Sturm, Sternschnuppen, Sternenhimmel, Wunschstern, Spinnennetz, Komet) |
| `leaf_colors` | Array aus 3 Hex-Farben | `["#c9a227", "#a83232", "#d9812c"]` | Farbverlauf für den Laub-Effekt (nur per YAML editierbar, nicht im GUI-Editor) |
| `leaf_shape` | string (SVG-Pfad) | interne Standardform | Optionale eigene Blattform, nur per YAML (wird sicherheitsgeprüft) |

---

## 📄 Lizenz

MIT
