# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen (Regen, Schnee mit Schneeansammlung, Hagel, Blitz, Nebel, Sturm, Herbstlaub, Sternschnuppen, Luftballons & Lichterkette) als elegantes Overlay über dein Dashboard legt. 

Inklusive vollständiger visuelle GUI-Editor-Unterstützung mit Live-Status, automatischem Theme-Modus und einer universellen Wetter- & Intensitäts-Automatik!

---

## 🎨 Features

* **Zehn Animationseffekte:** Regen, Schnee, Hagel, Blitz (Gewitter), Nebel, Sturm/Windböen, Herbstlaub, Sternschnuppen, Luftballons & Lichterkette.
* **🌦️ Universelle Wetter-Automatik:** Liest deine `weather.*`-Entity aus und aktiviert automatisch den passenden Effekt zum aktuellen Wetterzustand.
* **🌧️ Automatische Intensitäts-Steuerung:** Wertet Niederschlagsdaten (`precipitation` in mm oder `data`-Arrays von Wetterdiensten wie z. B. DWD) aus und passt die Partikelmenge und Deckkraft vollautomatisch in Echtzeit an.
* **❄️ Dynamische Schneeansammlung:** Bei aktivem Schnee-Effekt baut sich am unteren Bildschirmrand langsam eine sanfte, leicht leuchtende Schneedecke auf und bleibt liegen.
* **🟢 Live-Status im GUI-Editor:** Der visuelle Editor zeigt über farbige Status-Boxen (Grün, Gelb, Rot) sofort an, ob deine Entität valide Daten liefert und welche Intensität aktuell berechnet wird.
* **🌗 Auto-Theme-Modus:** Erkennt automatisch den Hell- oder Dunkel-Modus deines Home Assistant Themes und passt Partikelfarben dynamisch an.
* **🔋 Performance-Optimiert:** Nutzt CSS3-Hardwarebeschleunigung für flüssige Animationen ohne hohe Systemlast[cite: 1].

---

## 📦 Installation

### Über HACS (Empfohlen)

1. Öffne **HACS** in deiner Home Assistant Seitenleiste.
2. Klicke oben rechts auf die drei Punkte (`⋮`) → **Benutzerdefinierte Repositories**.
3. Füge deine GitHub-Repository-URL ein:  
   `https://github.com/DEIN_BENUTZERNAME/weather-event-overlay-card`
4. Wähle als Kategorie **Lovelace**.
5. Klicke auf **Hinzufügen** und anschließend auf **Herunterladen**.
6. Lade dein Dashboard neu (`Strg` + `F5`).

---

## 🖱️ Einrichtung über den GUI-Editor

1. Füge eine neue Karte zu deinem Dashboard hinzu und wähle **Weather & Event Overlay Card**.
2. **Effekt:** Wähle einen festen Effekt oder **"🌦️ Automatisch (nach Wetter)"**[cite: 1].
3. **Wetter-Entity:** Wähle deine Haupt-Wetter-Entität (z. B. `weather.home` oder `weather.dwd`)[cite: 1].
4. **Niederschlags-Entity (Optional):** Falls dein Wetterdienst (wie der DWD) die stündliche Niederschlagsmenge in einem separaten Sensor liefert, wähle diesen hier aus (z. B. `sensor.dwd_precipitation_intensity`)[cite: 1].
5. **Intensität aus Wetterdaten:** Schalte die Option ein, um die Partikeldichte automatisch vom Niederschlag steuern zu lassen[cite: 1].

---

## ⚙️ Verwendung (YAML Beispiele)

### Automatisch nach Wetterlage (inkl. separatem Niederschlags-Sensor)
```yaml
type: custom:weather-event-overlay-card
event: weather_auto
weather_entity: weather.home
precipitation_entity: sensor.home_precipitation
weather_intensity_auto: true
color_mode: auto
