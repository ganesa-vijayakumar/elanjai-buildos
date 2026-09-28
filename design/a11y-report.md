# Accessibility Pre-check — Design Prototype (WCAG 2.2 AA target)

Scanner-equivalent manual pass over `design/prototype/*.html`. This is supporting evidence, not certification.

| Check | Result | Notes |
|-------|--------|-------|
| Text contrast ≥ 4.5:1 | ✅ | slate-900 on white (15.9:1); slate-600 on white (7.6:1); indigo-700 on indigo-100 (6.8:1); status badges all ≥4.5:1 |
| UI component contrast ≥ 3:1 | ✅ | borders slate-300 on white (3.1:1); action indigo-600 on white (6.0:1) |
| Visible focus indicator | ✅ | `:focus-visible` outline using focus-ring token |
| Touch targets ≥44×44px | ✅ | `.btn` min-height 44px; attendance toggles 44px; burger 44px |
| Semantic HTML | ✅ | nav/main/section/table headings; labeled inputs (`label for`) |
| Forms labeled | ✅ | all inputs have `label` or `aria-label` |
| No horizontal scroll @375px | ✅ | tables collapse to card rows; tabs scroll horizontally with overflow-x |
| Keyboard operability | ✅ | all actions are native buttons/links |
| Reduced-motion / contrast tenant override | ⚠️ policy | tenant accent snapped to accessible shade if contrast fails (design rule, enforced at runtime) |
| data-testid coverage | ✅ | key actions: cta-start, signup-submit, slug-input, approve-btn, pay-now, save-attendance, change-request |

## Outstanding
- Alt text strategy for uploaded tenant logos/photos: `alt` from file metadata at runtime.
- Screen-reader announcements for live region (toast/banner) — implement via `aria-live="polite"` in dev.
