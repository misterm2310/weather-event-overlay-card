# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen (Regen, Schnee mit Schneeansammlung, Hagel, Blitz, Nebel, Sturm, Herbstlaub, Sternschnuppen, Luftballons & Lichterkette) über dein Dashboard legt. Inklusive vollständiger visueller GUI-Editor-Unterstützung mit Live-Status, automatischer Theme-Anpassung und optionaler Wetter- & Intensitäts-Automatik!

---

## 🎨 Features

* **Zehn Effekte:** Regen, Schnee, Hagel, Blitz (Gewitter), Nebel, Sturm/Windböen, Herbstlaub, Sternschnuppen, Luftballons & Lichterkette.
* **🌦️ Optionale Wetter-Automatik:** Statt manuell einen Effekt auszuwählen, orientiert sich die Karte an einer `weather.*`-Entity und zeigt automatisch den passenden Effekt (Regen, Schnee, Hagel, Blitz, Nebel, Sturm).
* **🌧️ Automatische Intensitäts-Steuerung:** Kann die Niederschlagsmenge (`precipitation` in mm) deines Wetter-Sensors auslesen und berechnet die Partikelanzahl & Deckkraft (Wenig, Mittel, Stark) vollautomatisch in Echtzeit!
* **❄️ Dynamische Schneeansammlung:** Wenn es schneit, baut sich am unteren Bildschirmrand langsam und realistisch eine sanfte Schneedecke auf!
* **🟢 Live-Status im Editor:** Der GUI-Editor zeigt mit übersichtlichen Ampel-Boxen (Grün, Gelb, Rot) sofort an, ob deine Wetter-Entity valide Daten liefert und welche Intensität gerade berechnet wird.
* **🌗 Auto-Theme-Modus:** Erkennt automatisch den Hell- oder Dunkel-Modus von Home Assistant (sowie System-Themes) und passt die Farben (z. B. für Regen, Schnee, Nebel, Hagel und Sturm) dynamisch an.
* **🍂 Sofortige Verteilung:** Partikel rieseln direkt von der ersten Sekunde an gleichmäßig verteilt herunter – ganz ohne störenden Start-Schwung.
* **✨ Echtes "Kräftig":** Bei maximaler Deckkraft werden die Partikel spürbar deutlicher dargestellt.
* **GUI-Editor mit Kontext:** Der Editor blendet nur die Regler ein, die für den aktuell gewählten Effekt auch wirklich etwas tun.
* **🔒 Sicherheit:** Benutzerdefinierte Laub-SVG-Formen (per YAML) werden über eine Whitelist geprüft, bevor sie gerendert werden.
* **🔋 Akku- & Performance-schonend:** Basiert auf CSS3-Hardwarebeschleunigung. Animationen pausieren automatisch, sobald das Dashboard-Tab im Hintergrund ist (z. B. gesperrtes Wand-Tablet).

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

> 💡 **Tipp bei Update-Problemen:** Falls nach einem Update alles beim Alten bleibt, liegt's meist am Browser-Cache. Harten Reload machen (`Strg` + `Shift` + `R`) oder die Ressourcen-URL kurz um `?v=2` ergänzen.

---

## 🖱️ Einrichtung über den GUI-Editor (empfohlen)

Karte zum Dashboard hinzufügen → **Weather & Event Overlay Card** auswählen → im Editor:

1. **Effekt** wählen – entweder einen festen Effekt (Regen, Schnee, ...) oder **"🌦️ Automatisch (nach Wetter)"**.
2. Bei "Automatisch": darunter deine `weather.*`-Entity auswählen (z. B. `weather.home`).
3. Optional: **Intensität aus Wetterdaten** auf "An" stellen, damit sich die Stärke automatisch an der Regen/Schneemenge orientiert.
4. **Anzahl**, **Deckkraft** und **Farbmodus** nach Geschmack einstellen.

---

### 🌦️ Wie die Wetter-Automatik genau funktioniert

Ist "Automatisch" aktiv, liest die Karte den Status deiner Wetter-Entity aus:

| HA-Wetterzustand | Effekt |
|---|---|
| `rainy`, `pouring` | 🌧️ Regen |
| `snowy` | ❄️ Schnee (mit Schneeansammlung unten) |
| `snowy-rainy` | ❄️ Schnee & 🌧️ Regen gleichzeitig |
| `hail` | 🧊 Hagel |
| `lightning` | ⚡ Blitz |
| `lightning-rainy` | ⚡ Blitz & 🌧️ Regen gleichzeitig |
| `fog` | 🌫️ Nebel |
| `windy`, `windy-variant` | 💨 Sturm |
| alles andere (sonnig, wolkig, klar, ...) | Aus |

#### 📊 Niederschlags-Intensität (Automatisch):
Wenn deine Wetter-Integration das Attribut `precipitation` (Niederschlagsmenge in mm) liefert und du die automatische Intensität aktivierst, berechnet die Karte folgendes:
* **≤ 0.5 mm:** Wenig (low)[cite: 1]
* **> 0.5 mm bis 4.0 mm:** Mittel (medium)[cite: 1]
* **> 4.0 mm:** Stark (high)[cite: 1]

*(Falls deine Wetter-Entity diesen Wert nicht liefert, nutzt die Karte automatisch deine manuell eingestellten Werte als Rückfallebene)[cite: 1].*

---

## ⚙️ Verwendung (YAML)

### Wetter-Automatik mit automatischer Intensität
```yaml
type: custom:weather-event-overlay-card
event: weather_auto
weather_entity: weather.home
weather_intensity_auto: true
color_mode: auto
