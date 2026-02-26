# NutriTwin Web MVP v1.2

## Start
```bash
cd /home/marco/.openclaw/workspace/apps/nutritwin/web
python3 -m http.server 8000
```
Dann im Browser: `http://<VPS-IP>:8000`

## Neu in v1.2
- Foto-Upload direkt im Meal-Form
- Bildvorschau
- Button **"Foto analysieren"** mit browserbasierter Erkennung (TensorFlow.js MobileNet via CDN)
- Auto-Vorschlag für Meal-Typ + Makro/Kalorien-Startwerte
- **Portionsfaktor** (0.75x / 1.0x / 1.25x / 1.5x) für schnellere Mengenabschätzung
- **Confidence-Anzeige (%)** pro Erkennung
- Manuelle Nachkorrektur weiterhin möglich (empfohlen)

## Test-Flow
1. User anlegen/auswählen
2. Bild hochladen
3. "Foto analysieren" klicken
4. Auto-Vorschlag prüfen und bei Bedarf anpassen
5. Meal speichern
6. Daily Report exportieren

## Hinweis zur Genauigkeit
- Die Erkennung ist in v1.1 **heuristisch** und dient als schneller Startwert.
- Für reale Produktion: nächste Stufe ist ein spezialisiertes Food-Vision-Modell + Portionsschätzung.
