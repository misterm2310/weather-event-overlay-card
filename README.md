# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen über dein Dashboard legt – von echtem Wetter (Regen, Schnee, Hagel, Blitz, Nebel, Sturm, Wolken-Drift) über Himmelsphänomene (Sternenhimmel, Sternschnuppen, Wunschstern, Komet) bis zu Tieren, Deko- und Anlass-Effekten (Herbstlaub, Luftballons, Lichterkette, Geburtstags-Modus, Weihnachtsmann, Spinne mit Netz, goldener Labrador, Fledermäuse, Eule, Bienenschwarm). Inklusive visuellem GUI-Editor mit **Live-Vorschau**, automatischer Theme-Anpassung und optionaler Wetter-Automatik mit echten Kombi-Effekten.

---

## 🎨 Features

* **21 Effekte** – siehe Tabelle weiter unten, sinnvoll gruppiert im Editor-Dropdown (Wetter → Himmel/Nacht → Deko/Anlass → Tiere).
* **🌫️ Sanftes Ausblenden statt abruptem Verschwinden:** Wird ein Effekt beendet oder gewechselt (manuell oder weil sich das Wetter ändert), verblasst er über rund 2,5 Sekunden sanft, statt sofort zu verschwinden. Gilt für **alle** Effekte gleichermaßen. Bei Kombi-Effekten (z. B. Schneeregen → nur noch Schnee) blendet jeder Teil-Effekt unabhängig aus; wird ein Effekt während des Ausblendens reaktiviert, springt er sofort zurück auf voll sichtbar statt zu flackern.
* **👁️ Live-Vorschau im Editor:** Direkt beim Einstellen der Regler siehst du oben im Editor eine kleine, verkleinerte Vorschau des Effekts – ganz ohne zu speichern. Bei "Automatisch" (hängt vom Live-Wetter ab) und "Aus" erscheint stattdessen ein Hinweistext.
* **🌦️ Optionale Wetter-Automatik:** Statt manuell einen Effekt auszuwählen, kann die Karte sich an einer echten `weather.*`-Entity orientieren und automatisch den passenden Effekt zeigen.
* **⛈️ Echte Kombi-Effekte:** Meldet die Wetter-Entity "Schneeregen", laufen Schnee **und** Regen gleichzeitig; bei "Gewitter mit Regen" laufen Blitz **und** Regen gleichzeitig.
* **☃️ Wachsende Schneedecke:** Läuft der Schnee-Effekt eine Weile, sammelt sich unten am Bildschirmrand langsam eine echte kleine Schneeschicht an.
* **🎂 Geburtstags-Modus:** Luftballons, Konfetti-Regen und ein Wimpelketten-Banner mit frei einstellbarem Text (Standard "Happy Birthday!", z. B. auch "Happy Birthday, Max!" möglich).
* **🎅🐕☄️ Periodisch durchlaufende Figuren:** Weihnachtsmann, Labrador und Komet ziehen periodisch durchs Bild statt dauerhaft sichtbar zu sein – wie oft, stellst du über "Anzahl/Frequenz" ein (alle 1-6 Minuten).
* **🕷️ Spinne mit Netz:** Mathematisch berechnetes, symmetrisches Netz oben rechts, eine Spinne mit blinkenden roten Augen seilt sich daran auf und ab.
* **🐕 Goldener Labrador:** Läuft mit echter Beinbewegung (diagonale Beinpaare schwingen gegenläufig wie im echten Trab).
* **🦇 Fledermäuse:** Mehrere flatternde Silhouetten über den kompletten Bildschirm verteilt, theme-abhängig eingefärbt (dunkel auf hellem Hintergrund, hell auf dunklem), damit sie auf **jedem** Theme sichtbar bleiben.
* **🦉 Eule:** Sitzt auf einem Ast in der oberen linken Ecke, vor einem kleinen Halbmond - mit Federstruktur, Ohrbüscheln, Glanzpunkten in den Augen, sichtbaren Krallen sowie **abwechselndem Blinzeln** (mal nur das linke, mal nur das rechte Auge, zeitversetzt) und sanftem Kopfdrehen/Atem-Wippen.
* **🐝 Bienenschwarm:** 5-8 Bienen gleichzeitig, jede mit eigenem Zickzack-Pfad über den kompletten Bildschirm, mit sichtbaren flatternden Flügeln.
* **🌤️ Wolken-Drift:** Mehrere weiche, zart verschwommene Wolken ziehen über den kompletten Bildschirm - theme-abhängig eingefärbt, damit sie auf hellem **und** dunklem Hintergrund sichtbar bleiben. Der zeitliche Versatz zwischen den Wolken ist gleichmäßig verteilt statt rein zufällig, damit möglichst durchgehend mindestens eine Wolke zu sehen ist. Läuft auch automatisch bei bewölktem/teilweise bewölktem Wetter.
* **⭐ Wunschstern-Funkeln:** Ein einzelner Stern mit weichem Strahlenkranz-Glanz leuchtet einmal auf, verschwindet komplett und blitzt an einer neuen zufälligen Position wieder auf.
* **✨ Sternenhimmel mit Teleport-Effekt:** Jeder einzelne Stern springt zwischen mehreren zufälligen Positionen hin und her (immer während er gerade unsichtbar ist) - läuft komplett über CSS ganz ohne ständige Hintergrund-Berechnung, ressourcenschonend auch auf schwächeren Geräten. Alle paar Minuten werden die möglichen Positionen unauffällig neu gemischt, damit sich das Muster nicht endlos wiederholt.
* **🌗 Auto-Theme-Modus mit View-Theme-Unterstützung:** Erkennt automatisch Hell-/Dunkelmodus – auch wenn das Theme nur auf einer einzelnen Dashboard-Seite (View-Theme) statt global gesetzt ist.
* **✨ Echtes "Kräftig":** Bei maximaler Deckkraft wird jeder Effekt spürbar kräftiger/deutlicher dargestellt.
* **GUI-Editor mit Kontext:** Der Editor blendet nur die Regler ein, die für den aktuell gewählten Effekt auch wirklich etwas tun, und erklärt passend zum gewählten Effekt, was jeder Regler macht.
* **🔒 Sicherheit:** Benutzerdefinierte Laub-SVG-Formen (per YAML) werden über eine Whitelist geprüft; der Geburtstags-Banner-Text wird automatisch gegen Schadcode abgesichert.
* **🔋 Akku- und ressourcenschonend:** Animationen pausieren automatisch, sobald das Dashboard-Tab im Hintergrund ist. Fast alle Effekte laufen rein über CSS (GPU-beschleunigt); laufende Hintergrund-Timer gibt's nur, wo sie wirklich nötig sind, und immer so selten wie möglich.
* **🎯 Robuste Sichtbarkeit:** Die Effekte werden in einen unabhängigen Container direkt in `<body>` gerendert - dadurch werden sie korrekt als Vollbild-Overlay angezeigt, selbst in komplexen, tief verschachtelten Dashboard-Layouts.

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
2. **Effekt** wählen – entweder einen festen Effekt (Regen, Schnee, Eule, ...) oder **"🌦️ Automatisch (nach Wetter)"**.
3. Bei "Automatisch": darunter erscheint **Wetter-Sensor** – dort deine `weather.*`-Entity aus der Liste auswählen.
4. Bei "🎂 Geburtstags-Modus": darunter erscheint ein Feld für den **Banner-Text**.
5. **Anzahl / Frequenz**, **Deckkraft / Helligkeit** und ggf. **Farbmodus** nach Geschmack einstellen.

Der Editor blendet dabei automatisch nur die Regler ein, die für den gewählten Effekt auch etwas bewirken:
* Bei **Blitz, Weihnachtsmann, Hund, Eule und Geburtstags-Modus** gibt's keinen Farbmodus (feste Farben).
* Bei der **Spinne, Eule und Wunschstern** gibt's keine Anzahl (es gibt jeweils nur die eine).
* Bei **Weihnachtsmann, Hund und Komet** steuert "Anzahl/Frequenz" NICHT eine Partikelmenge, sondern wie oft die Figur durchs Bild zieht: Wenig ≈ alle 5-6 Minuten, Mittel ≈ alle 3-4 Minuten, Viel ≈ alle 1-2 Minuten.
* Bei **Fledermäuse, Bienen, Wolken-Drift, Sternenhimmel und Geburtstags-Modus** ist "Anzahl" dagegen eine ganz normale Partikelmenge (wie viele gleichzeitig zu sehen sind).

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

**Wichtig:** Anzahl, Deckkraft und Farbmodus gelten bei aktiver Automatik als **ein gemeinsamer Wert für alle möglichen Wetter-Effekte**. Alle Tier-, Deko- und Anlass-Effekte (Weihnachtsmann, Hund, Fledermäuse, Eule, Bienen, Wunschstern, Spinne, Geburtstags-Modus) laufen NICHT über die Wetter-Automatik, die wählst du bei Bedarf manuell aus. Wechselt die Wetter-Automatik den Effekt (z. B. von Regen auf Sonnenschein), blendet der alte Effekt sanft aus statt abrupt zu verschwinden - genau wie bei jedem manuellen Wechsel auch.

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
| `spider` | 🕷️ Spinnennetz mit auf- und abseilender Spinne (blinkende rote Augen) |
| `dog` | 🐕 Goldener Labrador mit echter Lauf-Beinbewegung |
| `bats` | 🦇 Fledermausschwarm, theme-abhängig eingefärbt |
| `owl` | 🦉 Eule auf einem Ast, vor dem Mond, mit abwechselndem Blinzeln |
| `bee` | 🐝 Bienenschwarm (5-8 Stück) im Zickzack-Flug |

---

## 🔧 Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|---|---|---|---|
| `event` | string | `off` | Welcher Effekt aktiv ist, oder `weather_auto` für die Wetter-Automatik (siehe Tabelle oben) |
| `weather_entity` | string | `""` | HA-Entity-ID einer `weather.*`-Entity, z. B. `weather.home` (nur relevant bei `event: weather_auto`) |
| `birthday_text` | string | `"Happy Birthday!"` | Text im Banner (nur relevant bei `event: birthday`) - wird automatisch gegen Schadcode abgesichert |
| `count_preset` | `low` \| `medium` \| `high` | `medium` | Anzahl bzw. Frequenz der Partikel – bei `weather_auto` gemeinsam für alle möglichen Effekte, bei `santa`/`dog`/`comet` stattdessen der Abstand zwischen den Durchgängen, bei den meisten anderen die Menge gleichzeitiger Partikel |
| `opacity_preset` | `low` \| `medium` \| `high` | `medium` | Deckkraft/Helligkeit des Effekts |
| `color_mode` | `auto` \| `custom` | `auto` | Automatische Theme-Erkennung oder feste Farbe (nur bei Effekten mit Farbmodus) |
| `color` | string (hex) oder `auto` | `auto` | Manuelle Farbe für Effekte mit Farbmodus (Regen, Schnee, Nebel, Hagel, Sturm, Wolken-Drift, Fledermäuse, Sternschnuppen, Sternenhimmel, Wunschstern, Spinnennetz, Komet) |
| `leaf_colors` | Array aus 3 Hex-Farben | `["#c9a227", "#a83232", "#d9812c"]` | Farbverlauf für den Laub-Effekt (nur per YAML editierbar, nicht im GUI-Editor) |
| `leaf_shape` | string (SVG-Pfad) | interne Standardform | Optionale eigene Blattform, nur per YAML (wird sicherheitsgeprüft) |

---

## 📄 Lizenz

MIT
