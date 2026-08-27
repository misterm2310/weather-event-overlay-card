# Weather & Event Overlay Card for Home Assistant

Eine benutzerdefinierte Lovelace-Karte für Home Assistant, die dynamische Animationen (Regen, Schnee, Herbstlaub, Luftballons, Lichterketten, Sternschnuppen & Blitze) über dein Dashboard legt. Inklusive visueller GUI-Editor-Unterstützung!

---

## 🎨 Features

* **Vielfältige Events:** Regen, Schnee, Laubfall, Luftballons, Lichterkette, Sternschnuppen & Blitze (Gewitter).
* **GUI-Editor:** Vollständig und komfortabel über die Home Assistant Benutzeroberfläche konfigurierbar.
* **Feinjustierung:** Anzahl/Frequenz, Deckkraft und Farben direkt anpassbar.
* **Performance-Schonend:** Basiert auf reinen CSS3-Animationen für minimale Systembelastung.

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

1. Lade die Datei `weather-event-overlay-card.js` aus dem letzten Release herunter.
2. Kopiere die Datei in deinen Home Assistant Ordner: `/config/www/weather-event-overlay-card.js`.
3. Gehe in Home Assistant zu **Einstellungen $\rightarrow$ Dashboards $\rightarrow$ Drei Punkte oben rechts $\rightarrow$ Ressourcen**.
4. Füge eine neue Ressource hinzu:
   * **URL:** `/local/weather-event-overlay-card.js`
   * **Typ:** JavaScript-Modul
5. Lade dein Dashboard neu.

---

## ⚙️ Verwendung (YAML)

Du kannst die Karte direkt über den GUI-Editor hinzufügen oder manuell folgenden YAML-Code nutzen:

```yaml
type: custom:weather-event-overlay-card
event: rain
count_preset: medium
opacity_preset: medium
color: '#a0c4ff'
