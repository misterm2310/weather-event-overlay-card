# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen über dein Dashboard legt – von echtem Wetter (Regen, Schnee, Hagel, Blitz, Nebel, Sturm, Wolken-Drift) über Himmelsphänomene (Sternenhimmel, Sternschnuppen, Wunschstern, Komet) bis zu Tieren, Deko- und Anlass-Effekten (Herbstlaub, Luftballons, Lichterkette, Geburtstags-Modus, Weihnachtsmann, Wichteltür, Spinne mit Netz, goldener Labrador, Dampflok mit optionaler Festtags-Beladung, Fledermäuse, Eule, Bienenschwarm, Vogelhäuschen). Inklusive visuellem GUI-Editor mit **Live-Vorschau**, automatischer Theme-Anpassung und optionaler Wetter-Automatik mit echten Kombi-Effekten.

---

## 🎨 Features

* **23 Effekte** – siehe Tabelle weiter unten, sinnvoll gruppiert im Editor-Dropdown (Wetter → Himmel/Nacht → Deko/Anlass → Tiere).
* **🚂 Dampflok mit vier Waggons:** Fährt am unteren Bildschirmrand entlang - erkennbare Lok-Silhouette mit Kessel, Schornstein, Kabine mit Fähnchen, Kuhfänger und sich drehenden Rädern, dazu sichtbarer Dampf, der aus dem Schornstein aufsteigt. Die vier Waggons sind im Alltag mit Obst, Bauklötzen, Geschenken und Holzscheiten beladen.
* **🎅 Sensor-gesteuerte Festtags-Beladung:** Optional einen `input_boolean`/`binary_sensor` auswählen (z. B. für die Weihnachtszeit) - ist der Sensor "an", werden drei Waggons stattdessen festlich und reichlich beladen: mehrere Schneemänner, ein Weihnachtsmann umgeben von Geschenken, und ein großer Weihnachtsmann-Sack mit Zuckerstange und zweitem kleinen Sack.
* **🧝🚪 Wichteltür-Szene:** Freistehende Rundbogen-Holztür (mit Kranz, Herz-Scharnieren und leuchtendem Fenster) unten rechts, dazu ein Weihnachtsbaum mit blinkender Lichterkette, ein sechseckiges Laternenhaus, ein Briefkasten mit Namen und ein Weg, der zur Tür hinaufführt.
* **🌫️ Sanftes Ausblenden statt abruptem Verschwinden:** Ändert sich das Wetter bei aktiver Wetter-Automatik von selbst, verblasst der alte Effekt sanft, während ein manueller Wechsel im Editor weiterhin sofort umschaltet.
* **👁️ Live-Vorschau im Editor:** Direkt beim Einstellen der Regler siehst du oben im Editor eine kleine, verkleinerte Vorschau des Effekts – ganz ohne zu speichern.
* **🌦️ Optionale Wetter-Automatik:** Statt manuell einen Effekt auszuwählen, kann die Karte sich an einer echten `weather.*`-Entity orientieren und automatisch den passenden Effekt zeigen.
* **⛈️ Echte Kombi-Effekte:** Meldet die Wetter-Entity "Schneeregen", laufen Schnee **und** Regen gleichzeitig; bei "Gewitter mit Regen" laufen Blitz **und** Regen gleichzeitig.
* **☃️ Wachsende Schneedecke:** Läuft der Schnee-Effekt eine Weile, sammelt sich unten am Bildschirmrand langsam eine echte kleine Schneeschicht an.
* **🎂 Geburtstags-Modus:** Luftballons, Konfetti-Regen und ein Wimpelketten-Banner mit frei einstellbarem Text (Standard "Happy Birthday!").
* **🎅🐕☄️🚂🐦 Periodisch durchlaufende Figuren:** Weihnachtsmann, Labrador, Komet, Dampflok und der Vogelhäuschen-Besuch ziehen periodisch durchs Bild statt dauerhaft sichtbar zu sein – wie oft, stellst du über "Anzahl/Frequenz" ein.
* **🕷️ Spinne mit Netz:** Mathematisch berechnetes, symmetrisches Netz oben rechts, eine Spinne mit blinkenden roten Augen seilt sich daran auf und ab.
* **🐕 Goldener Labrador:** Läuft mit echter Beinbewegung (diagonale Beinpaare schwingen gegenläufig wie im echten Trab).
* **🦇 Fledermäuse:** Mehrere flatternde Silhouetten über den kompletten Bildschirm verteilt, theme-abhängig eingefärbt, damit sie auf **jedem** Theme sichtbar bleiben.
* **🦉 Eule:** Sitzt auf einem Ast in der oberen linken Ecke, vor einem kleinen Halbmond - mit Federstruktur, Ohrbüscheln, Glanzpunkten in den Augen sowie **abwechselndem Blinzeln**.
* **🐝 Bienenschwarm:** 5-8 Bienen gleichzeitig, jede mit eigenem Zickzack-Pfad über den kompletten Bildschirm.
* **🌤️ Wolken-Drift:** Mehrere weiche, zart verschwommene Wolken ziehen über den kompletten Bildschirm - theme-abhängig eingefärbt und mit gleichmäßig verteiltem Zeitversatz, damit möglichst durchgehend mindestens eine Wolke zu sehen ist.
* **⭐ Wunschstern-Funkeln:** Ein einzelner Stern mit weichem Strahlenkranz-Glanz leuchtet einmal auf, verschwindet komplett und blitzt an einer neuen zufälligen Position wieder auf.
* **✨ Sternenhimmel mit Teleport-Effekt:** Jeder einzelne Stern springt zwischen mehreren zufälligen Positionen hin und her - läuft komplett über CSS, ressourcenschonend auch auf schwächeren Geräten.
* **🌗 Auto-Theme-Modus mit View-Theme-Unterstützung:** Erkennt automatisch Hell-/Dunkelmodus – auch wenn das Theme nur auf einer einzelnen Dashboard-Seite gesetzt ist.
* **✨ Echtes "Kräftig":** Bei maximaler Deckkraft wird jeder Effekt spürbar kräftiger dargestellt.
* **GUI-Editor mit Kontext:** Der Editor blendet nur die Regler ein, die für den aktuell gewählten Effekt auch wirklich etwas tun.
* **🔒 Sicherheit:** Benutzerdefinierte Laub-SVG-Formen werden über eine Whitelist geprüft; der Geburtstags-Banner-Text wird automatisch gegen Schadcode abgesichert.
* **🔋 Akku- und ressourcenschonend:** Animationen pausieren automatisch, sobald das Dashboard-Tab im Hintergrund ist. Fast alle Effekte laufen rein über CSS (GPU-beschleunigt).
* **🎯 Robuste Sichtbarkeit:** Effekte werden in einen unabhängigen Container direkt in `<body>` gerendert, mit einem extrem hohen Stapel-Wert (z-index) - dadurch werden sie zuverlässig als Vollbild-Overlay angezeigt, selbst über anderen Custom Cards mit eigenen Übergangs-Animationen.

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

1. Oben siehst du direkt eine **Live-Vorschau** – die aktualisiert sich automatisch, während du unten Einstellungen änderst.
2. **Effekt** wählen – entweder einen festen Effekt (Regen, Schnee, Eule, Dampflok, Wichteltür, ...) oder **"🌦️ Automatisch (nach Wetter)"**.
3. Bei "Automatisch": darunter erscheint **Wetter-Sensor** – dort deine `weather.*`-Entity aus der Liste auswählen.
4. Bei "🎂 Geburtstags-Modus": darunter erscheint ein Feld für den **Banner-Text**.
5. Bei "🚂 Dampflok": darunter erscheint optional **Weihnachtsmann-Sensor** – wählst du hier einen `input_boolean`/`binary_sensor` aus, schaltet der Zug automatisch auf die festliche Beladung um, sobald dieser Sensor "an" ist.
6. **Anzahl / Frequenz**, **Deckkraft / Helligkeit** und ggf. **Farbmodus** nach Geschmack einstellen.

Der Editor blendet dabei automatisch nur die Regler ein, die für den gewählten Effekt auch etwas bewirken:
* Bei **Blitz, Weihnachtsmann, Hund, Dampflok, Eule, Wichteltür, Vogelhäuschen und Geburtstags-Modus** gibt's keinen Farbmodus (feste Farben).
* Bei der **Spinne, Eule und Wunschstern** gibt's keine Anzahl (es gibt jeweils nur die eine).
* Bei **Weihnachtsmann, Hund, Komet, Dampflok und Vogelhäuschen** steuert "Anzahl/Frequenz" NICHT eine Partikelmenge, sondern wie oft etwas passiert (Vorbeiziehen, Vorbeifliegen).
* Bei **Wichteltür** steuert "Anzahl/Frequenz" stattdessen, wie oft das Fenster aufleuchtet.
* Bei **Fledermäuse, Bienen, Wolken-Drift, Sternenhimmel und Geburtstags-Modus** ist "Anzahl" eine ganz normale Partikelmenge.

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
| `cloudy`, `partlycloudy` | 🌤️ Wolken-Drift |
| `clear-night` | ✨ Sternenhimmel |
| alles andere (sonnig, klar, ...) | Aus |

**Wichtig:** Anzahl, Deckkraft und Farbmodus gelten bei aktiver Automatik als **ein gemeinsamer Wert für alle möglichen Wetter-Effekte**. Alle Tier-, Deko- und Anlass-Effekte (Weihnachtsmann, Hund, Dampflok, Fledermäuse, Eule, Bienen, Wunschstern, Spinne, Wichteltür, Vogelhäuschen, Geburtstags-Modus) laufen NICHT über die Wetter-Automatik. Wechselt die Wetter-Automatik den Effekt, blendet der alte Effekt sanft aus statt abrupt zu verschwinden - bei einem manuellen Wechsel im Editor passiert das dagegen sofort.

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

### Dampflok mit sensor-gesteuerter Festtags-Beladung
```yaml
type: custom:weather-event-overlay-card
event: train
count_preset: medium
opacity_preset: high
santa_sensor: input_boolean.weihnachtszeit
```

### Wichteltür
```yaml
type: custom:weather-event-overlay-card
event: gnome_door
count_preset: medium
opacity_preset: high
```

### Vogelhäuschen
```yaml
type: custom:weather-event-overlay-card
event: birdhouse
count_preset: medium
opacity_preset: high
```

### Spinne mit Netz (Auto-Farbmodus)
```yaml
type: custom:weather-event-overlay-card
event: spider
opacity_preset: medium
color_mode: auto
```

### Geburtstags-Modus mit eigenem Text
```yaml
type: custom:weather-event-overlay-card
event: birthday
birthday_text: "Happy Birthday, Max!"
count_preset: medium
opacity_preset: high
```

### Wolken-Drift (theme-abhängig)
```yaml
type: custom:weather-event-overlay-card
event: clouds
count_preset: low
opacity_preset: medium
color_mode: auto
```

### Sternenhimmel
```yaml
type: custom:weather-event-overlay-card
event: stars
count_preset: medium
opacity_preset: high
color_mode: auto
```

### Fledermäuse (theme-abhängig)
```yaml
type: custom:weather-event-overlay-card
event: bats
count_preset: medium
opacity_preset: high
color_mode: auto
```

### Eule (ruhig, keine Anzahl nötig)
```yaml
type: custom:weather-event-overlay-card
event: owl
opacity_preset: medium
```

### Bienenschwarm
```yaml
type: custom:weather-event-overlay-card
event: bee
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
| `clouds` | 🌤️ Theme-abhängig eingefärbte, gleichmäßig verteilte Wolken |
| `shooting_stars` | 🌠 Sternschnuppen |
| `stars` | ✨ Funkelnder Sternenhimmel mit ressourcenschonendem Teleport-Effekt |
| `wishstar` | ⭐ Ein Stern mit weichem Strahlenkranz, blitzt an wechselnden Positionen auf |
| `comet` | ☄️ Seltener, dramatischer Komet mit langem Schweif |
| `leaves` | 🍂 Herbstlaub mit 3-Farben-Verlauf |
| `balloons` | 🎈 Aufsteigende Luftballons |
| `lights` | 💡 Blinkende Lichterkette am oberen Rand |
| `birthday` | 🎂 Geburtstags-Modus: Ballons + Konfetti + Banner mit eigenem Text |
| `santa` | 🎅 Weihnachtsmann mit Schlitten & 2 Rentieren (periodischer Vorbeiflug) |
| `gnome_door` | 🧝🚪 Wichteltür-Szene: Tür mit Kranz, Weihnachtsbaum mit Lichterkette, Laterne, Briefkasten, Weg |
| `spider` | 🕷️ Spinnennetz mit auf- und abseilender Spinne (blinkende rote Augen) |
| `dog` | 🐕 Goldener Labrador mit echter Lauf-Beinbewegung |
| `train` | 🚂 Dampflok mit vier Waggons (Obst/Bauklötze/Geschenke/Holz, optional festliche Sensor-Beladung), drehenden Rädern und Dampf aus dem Schornstein |
| `bats` | 🦇 Fledermausschwarm, theme-abhängig eingefärbt |
| `owl` | 🦉 Eule auf einem Ast, vor dem Mond, mit abwechselndem Blinzeln |
| `bee` | 🐝 Bienenschwarm (5-8 Stück) im Zickzack-Flug |
| `birdhouse` | 🐦🏠 Vogelhäuschen auf einem Ast oben links, Vogel fliegt periodisch vorbei |

---

## 🔧 Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `event` | string | `off` | Welcher Effekt aktiv ist, oder `weather_auto` für die Wetter-Automatik (siehe Tabelle oben) |
| `weather_entity` | string | `""` | HA-Entity-ID einer `weather.*`-Entity, z. B. `weather.home` (nur relevant bei `event: weather_auto`) |
| `birthday_text` | string | `"Happy Birthday!"` | Text im Banner (nur relevant bei `event: birthday`) - wird automatisch gegen Schadcode abgesichert |
| `santa_sensor` | string | `""` | HA-Entity-ID eines `input_boolean`/`binary_sensor` (nur relevant bei `event: train`) - ist er "an", tragen drei Waggons festliche Fracht statt der normalen Alltags-Ladung |
| `count_preset` | `low` \| `medium` \| `high` | `medium` | Anzahl bzw. Frequenz – Bedeutung hängt vom Effekt ab (siehe Editor-Hinweistexte oben) |
| `opacity_preset` | `low` \| `medium` \| `high` | `medium` | Deckkraft/Helligkeit des Effekts |
| `color_mode` | `auto` \| `custom` | `auto` | Automatische Theme-Erkennung oder feste Farbe (nur bei Effekten mit Farbmodus) |
| `color` | string (hex) oder `auto` | `auto` | Manuelle Farbe für Effekte mit Farbmodus (Regen, Schnee, Nebel, Hagel, Sturm, Wolken-Drift, Fledermäuse, Sternschnuppen, Sternenhimmel, Wunschstern, Spinnennetz, Komet) |
| `leaf_colors` | Array aus 3 Hex-Farben | `["#c9a227", "#a83232", "#d9812c"]` | Farbverlauf für den Laub-Effekt (nur per YAML editierbar, nicht im GUI-Editor) |
| `leaf_shape` | string (SVG-Pfad) | interne Standardform | Optionale eigene Blattform, nur per YAML (wird sicherheitsgeprüft) |

---

## 📄 Lizenz

MIT
