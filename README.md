# NutriTwin Web MVP v1.6

## Start
```bash
cd /home/marco/.openclaw/workspace/apps/nutritwin/web
python3 -m http.server 8000
```
Then open: `http://<VPS-IP>:8000`

## What changed in v1.6

### 1) Portion-estimation helper (mobile friendly)
- New **Hand/Plate selector** (`portionRef`) with practical references:
  - 1 palm, 1 fist, 2 palms
  - half plate, full plate + extras
- Selector auto-adjusts **portion factor** and gives clear guidance text.
- Works fast on phone without extra steps.

### 2) Better micronutrient estimation + target indicator
- Introduced clearer **per-meal micro profile mapping** (`green_plate`, `fish_plate`, `red_meat`, etc.).
- Meal cards now show profile note + micro estimate values.
- Daily micro dashboard now includes **LOW / OK / HIGH** status chips for:
  - Fiber
  - Magnesium
  - Iron
  - Vitamin C
  - Omega-3
- Markdown export now includes micro target status.

### 3) Correction-learning mechanism (high impact)
- App now remembers user corrections to auto-suggestions:
  - If user edits auto-estimated kcal/macros/meal name, correction factors are saved.
- On next suggestion for same meal name, app reuses latest correction to improve auto-fill.
- Frequent meal tap also benefits from learned portion defaults.

## Quick test flow (phone)
1. Create/select user.
2. Choose a portion helper (e.g. **1 palm** or **full plate**).
3. Upload/take photo → click **Foto analysieren**.
4. Adjust values if needed and save.
5. Re-analyze similar meal: check if learned correction is applied.
6. Review **Daily Summary** micro status chips and export markdown.

## Notes
- This remains a heuristic MVP. It is optimized for practical speed + better consistency, not clinical nutrition.
- Learning is local (browser localStorage) per user profile.
