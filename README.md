# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen (Regen, Schnee, Herbstlaub, Luftballons, Lichterketten, Sternschnuppen & Blitze) über dein Dashboard legt. Inklusive vollständiger visueller GUI-Editor-Unterstützung und automatischer Theme-Anpassung!

---

## 🎨 Features

* **Vielfältige Events:** Regen, Schnee, Laubfall, Luftballons, Lichterkette, Sternschnuppen & Blitze (Gewitter).
* **🌗 Auto-Theme-Modus:** Erkennt automatisch den Hell- oder Dunkel-Modus von Home Assistant (sowie System-Themes) und passt die Farben (z. B. für Regen und Schnee) dynamisch an.
* **🍂 Sofortige Verteilung:** Partikel wie Schnee und Laub rieseln direkt von der ersten Sekunde an gleichmäßig herunter – ganz ohne störenden Start-Schwung.
* **GUI-Editor:** Vollständig und komfortabel über die Home Assistant Benutzeroberfläche konfigurierbar.
* **Feinjustierung:** Frequenz/Anzahl, Deckkraft, Moduswahl (Auto/Manuell) und individuelle Farben (z. B. 3-Farben-Verlauf für Herbstlaub) direkt im Editor anpassbar.
* **Performance-Schonend:** Basiert auf leichten CSS3-Animationen für minimale System- und Akkubelastung auf Tablets und Smartphones.

---

## 📦 Installation

### Über HACS (Empfohlen)

1. Öffne **HACS** in deiner Home Assistant Seitenleiste.
2. Klicke oben rechts auf die drei Punkte (`⋮`) $\rightarrow$ **Benutzerdefinierte Repositories**.
3. Füge deine GitHub-Repository-URL ein:  
   `https://github.com/misterm2310/weather-event-overlay-card`
4. Wähle als Kategorie **Lovelace**.
5. Klicke auf **Hinzufügen** und anschließend auf **Herunterladen**.
6. Lade dein Dashboard neu (`Strg` + `F5`).

---

### Manuelle Installation

1. Lade die Datei `weather-event-overlay-card.js` aus dem aktuellen Release herunter.
2. Kopiere die Datei in deinen Home Assistant Ordner: `/config/www/weather-event-overlay-card.js`.
3. Gehe in Home Assistant zu **Einstellungen $\rightarrow$ Dashboards $\rightarrow$ Drei Punkte oben rechts $\rightarrow$ Ressourcen**.
4. Füge eine neue Ressource hinzu:
   * **URL:** `/local/weather-event-overlay-card.js`
   * **Typ:** JavaScript-Modul
5. Lade dein Dashboard neu.

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
