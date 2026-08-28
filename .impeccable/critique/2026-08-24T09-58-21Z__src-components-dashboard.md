---
target: src/components/dashboard
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-24T09-58-21Z
slug: src-components-dashboard
---
## Taskoria Dashboard — Design Critique

Method: dual-agent (A: design-review · B: detector-browser)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good sync badge, NumberTicker, ChunkLoader. Minor gap: no verified inline +XP feedback at click point |
| 2 | Match System / Real World | 3 | Strong RPG vocab in TaskList/Questbook/Garden. Breaks in CalendarView (wrong language) |
| 3 | User Control and Freedom | 2 | Every destructive action uses raw window.confirm — no undo, no themed UI |
| 4 | Consistency and Standards | 2 | TaskList (dark glass) and Questbook (parchment) render same data with incompatible visual systems |
| 5 | Error Prevention | 2 | Basic form validation. Dynamic Tailwind interpolation in CharacterSheet is production risk |
| 6 | Recognition Rather Than Recall | 3 | Task cards surface XP/Gold inline. Nav icons labeled. Stats lack contextual explanation |
| 7 | Flexibility and Efficiency | 1 | Zero keyboard shortcuts. No bulk actions. No quick-add — every task requires full modal |
| 8 | Aesthetic and Minimalist Design | 2 | Individual widgets tight, but 9+ glass-cards with identical glow orbs = visual noise |
| 9 | Error Recovery | 1 | Raw stack trace on crashes. Silent swallowed fetch errors. No degraded-state UI |
| 10 | Help and Documentation | 2 | FAQ and tutorial exist. In-context help thin — no tooltips on stats, jargon unexplained |
| **Total** | | **21/40** | **Acceptable** |

### Design Specificity Verdict

LLM: Authored peaks (Questbook, GardenView, FocusHero) surrounded by generic plains (CalendarView, ProductivityHeatmap, TaskForm, delete flows). Two apps in a trenchcoat.

Detector: 55 findings — gray-on-color (36), border-accent-on-rounded (7), side-tab (7), ai-color-palette (4), layout-transition (1). Gray-on-color flood confirms lack of intentional contrast pairing. Purple/side-tab findings are likely false positives (rarity colors, status stripes).

### What's Working
1. Questbook torn-parchment sidebar — fully realized, non-generic
2. Contextual greeting system branching on time/weekend/quests
3. FocusHero dual-mode portal (Battle vs Hatch)

### Priority Issues
- P0: CalendarView reads task.name but data uses task.title — likely renders blank
- P1: TaskList (dark glass) vs Questbook (parchment) — incompatible systems for same data
- P1: Dynamic Tailwind class interpolation in CharacterSheet — will break in prod build
- P2: Native window.confirm dialogs break immersion on every delete
- P2: No quick-add path — full modal required for every task
- P2: 36 gray-on-color contrast violations across the dashboard
- P3: ProductivityHeatmap is a stock GitHub contribution graph

### Persona Red Flags
- Alex: Zero keyboard shortcuts, no bulk actions, no quick-add
- Jordan: 9+ novel RPG concepts on first load with no glossing, stats unexplained
- Sam: Non-accessible checkboxes, unreachable calendar cells, no focus-visible, 36 contrast issues

### Minor Observations
- Unused NavItem component in App.jsx
- EpicBossCard "LVL ??" hardcoded placeholder
- Identical glow orbs on 6+ widgets = noise
- TaskForm edit resets assigneeId to 'self'
