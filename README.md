# NutriTwin Web v1.7

## Start
```bash
cd /home/marco/.openclaw/workspace/apps/nutritwin/web
python3 -m http.server 8000
```
Then open: `http://<VPS-IP>:8000`

## v1.7 Highlights

### 1) Multi-component meal recognition (top-3 blend)
- Vision suggestion now blends the **top 3 matched food components** (instead of single-class winner).
- Better detection for mixed meals (e.g. fruit + yogurt + nuts bowl).
- Suggestion text now shows component split with confidence percentage.

### 2) Confidence-weighted macro estimate
- Calories + macros are computed with a **confidence-weighted blend** of matched components.
- Portion factor is still applied after model estimate for practical mobile usage.
- Correction-learning remains compatible: user edits continue to refine future auto-suggestions.

### 3) Modern premium mobile-first UI refresh
- Redesigned from sterile panel to polished dashboard with:
  - improved hierarchy and spacing
  - stronger typography
  - soft gradients, glass cards, subtle shadows
  - cleaner chips and action buttons
- Keeps lightweight performance (plain HTML/CSS/JS, no heavy UI framework).

### 4) Existing functionality retained
- direct camera capture
- upload fallback
- portion helper
- micro summary chips
- frequent meals quick tap
- markdown export

## Short changelog
- **v1.7**: Multi-component blended vision logic, confidence-weighted macro estimation, premium UI redesign, blend components shown in report and markdown export.
- **v1.6**: Portion helper + micro target chips + correction learning.

## Quick phone test flow
1. Create/select user.
2. Capture a mixed meal photo (e.g. yogurt + fruit + nuts) and run **Analyze photo**.
3. Check blend suggestion components + confidence values.
4. Adjust macros and save; re-test a similar meal to confirm correction-learning behavior.
5. Review daily summary chips and export markdown.

## Notes
- MVP remains heuristic and practical, not clinical nutrition software.
- Learning is local (`localStorage`) per browser profile.
