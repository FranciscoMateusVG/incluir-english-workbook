# Placement Exam (Nivelamento): Routing New Students into B1–B4

Spec for bead aperture-l3rk2. Status: pending approval. Content production is a follow-up task — this document defines the instrument; it contains no exam items.

## Purpose

The program has full content for four levels but no way to answer the intake question: a new student walks in — do they start in B1, B2, B3, or B4? Today that decision is a guess. A wrong guess costs a semester: a misplaced student is either bored or drowning, and the volunteer teacher pays the difference in class.

The placement exam is a short, printable, coordinator-administered instrument that turns intake into a scoring rule anyone can apply.

## Core principle

Place the student at the first level whose material they have NOT yet mastered. The exam tests mastery of what each level *owns*, in ladder order, and stops mattering the moment a rung breaks.

## What the recon established (design constraints)

- The current assessment system is Foundation Tests 1–2 + Speaking Mission Exam (see ASSESSMENT-MODEL.md). The old end-of-level tests are superseded. This spec follows the foundation-test conventions: score table, teacher-note administration blocks, feedback-profile routing, PT-heavy instructions.
- The portal is 100% static (nginx serving `portal/`) — no forms, no scoring, no backend. Digital auto-scoring is out of scope for this repo (see "Where this lives" below).
- No pass mark, threshold, or level gate exists anywhere in the repo today. The cutoffs below are new policy.
- **B0 exists** as a fifth, undocumented level (`content/b0/`, 8 absolute-beginner chapters: alphabet, numbers, colors, verb to be…) with no exams, no summary, no portal presence. A beginner adult program will receive students below B1 — the instrument must handle that floor.
- Volunteer capacity is an explicit constraint ("the assessment system must be realistic for volunteer teachers"). No mandatory oral component; no listening (listening is teacher-read in this program and adds administration burden intake doesn't need).
- Language gradient: the taker's level is unknown by definition, so instructions follow the B1 (heaviest-Portuguese) convention throughout — Portuguese first, English in italics — regardless of section difficulty.

## Where this lives (delivery decision)

**Recommendation: this repo, printable PDF, hand-scored.** Grounds:

1. The proven pipeline already produces exactly this artifact class: one HTML source → student PDF (the exam) + teacher PDF (the answer key) via the variant toggle. Zero new infrastructure.
2. The administrator is a coordinator with a printed page, same as every other assessment in the program. Intake happens in person.
3. A digital auto-scored form is real software — auth-adjacent, stateful, student-facing — and this is a content repo (AGENTS.md: "content/documentation project, not code"). If self-serve digital intake is ever wanted, it belongs on the monorepo-incluir frontend (app.programaincluir.org) as its own bead. This instrument is designed so items port 1:1: every item type is objective (1 point, right/wrong), so auto-scoring is trivial the day that bead exists. Do not build both at once; print first, measure usage.

## Instrument design

One printable exam, four graduated sections, strictly in ladder order. Objective items only — every item is 1 point, right or wrong, no partial credit. No open writing, no listening, no speaking in the scored instrument. Each section carries 20 grammar items (8 fill-blank + 6 multiple-choice + 6 matching) PLUS one level-graduated reading passage with 5 objective questions (two-option true/false + multiple-choice) — reading difficulty scales with the ladder, so the reading signal stays inside the graduated structure instead of needing its own rubric row. (Expanded from 10 items/section per operator request, aperture-nv0d6.)

```text
Section A — B1 material (25 points = 20 grammar + 5 reading)
  verb to be · subject/possessive pronouns · Simple Present (aff/neg/questions)
  frequency adverbs · basic WH questions · numbers, dates, times · plurals
  · basic prepositions of place — reading: short personal profile

Section B — B2 material (25 points = 20 grammar + 5 reading)
  Present Continuous vs Simple Present · countable/uncountable + quantifiers
  articles · there is/there are · demonstratives · basic connectors
  — reading: daily-life scene (street market)

Section C — B3 material (25 points = 20 grammar + 5 reading)
  Simple Past (reg/irreg, was/were) · will vs going to · first conditional
  modals (should/must/have to/can) · comparatives and superlatives
  · too/enough — reading: past-tense trip narrative

Section D — B4 material (25 points = 20 grammar + 5 reading)
  Present Perfect (experiences, recent problems) · Passive (service problems)
  relative clauses · phrasal verbs · for vs to
  — reading: airport lost-luggage service problem
  (NOT Past Perfect or Reported Speech — curriculum lists both under
   reduce/reframe, so they fail the keep-only item contract below)

Total: 100 points · Suggested time: 75 minutes — the stop rule means most
students use far less (a true beginner works only Section A, ~20 min)
```

Item types per section: mix of `fill-blank`, `multiple-choice`, `matching`, and `short-answer` with tolerant keys (existing `data-exercise-type` vocabulary; existing component classes; no new CSS). Each section's items come only from that level's "grammar to keep" list in CURRENT-VS-NEXT-CURRICULUM.md — the grammar-ownership table is the item-selection contract.

**Stop rule (student-facing, in Portuguese):** "Responda até onde conseguir. Quando as questões ficarem difíceis demais, pare — isso é esperado e não é um problema. *(Answer as far as you can. When the questions get too hard, stop — that is expected and it is not a problem.)*" The exam is not meant to be finished by most takers; the instruction removes the shame of stopping.

**Why graduated sections beat one flat cumulative exam:** a single global score conflates a strong B1 student with a spotty B3 student who guessed well. Per-section gates map mechanically onto the placement question, and the stop rule means a true beginner faces one page of approachable material instead of four pages of humiliation. **Why not a true adaptive instrument:** adaptivity requires software (out of scope here) or coordinator judgment mid-exam (fragile, unrepeatable). Graduated-with-stop-rule is the paper approximation of adaptive, and it is repeatable by any volunteer.

## Scoring rubric and level cutoffs

Section gate: **18/25 (72%)**. Floor gate: **10/25 (40%) on Section A**. The coordinator scores sections in order and applies the first matching row:

```text
Section A below 10               →  B0  (absolute beginner — see B0 caveat)
Section A below 18               →  B1
A ≥ 18, Section B below 18       →  B2
A ≥ 18, B ≥ 18, C below 18       →  B3
A ≥ 18, B ≥ 18, C ≥ 18, D below 18 →  B4
All four sections ≥ 18           →  beyond B4 — coordinator conversation
                                    (program capstone is B4; discuss goals)
```

| Result pattern | Placement |
|---|---|
| A &lt; 10 | **B0** |
| A &lt; 18 | **B1** |
| A ≥ 18, B &lt; 18 | **B2** |
| B ≥ 18, C &lt; 18 | **B3** |
| C ≥ 18, D &lt; 18 | **B4** |
| D ≥ 18 | **Beyond program** — coordinator decides |

**Borderline rule:** a section scored exactly 17 (one point below the gate) is a borderline. The coordinator may run the optional 5-minute conversation check (appendix in the exam's teacher edition: one easier-level and one harder-level prompt PER BOUNDARY — A=17, B=17, C=17, D=17 each get their own adjacent pair — plus a universal repair prompt) and place up or down on that basis. Default when in doubt: **place DOWN** — a student who finds the first weeks easy gains confidence; a student who drowns in week one is a dropout risk. This mirrors the program's existing feedback-profile philosophy: the score routes, the human confirms.

**Why 72%:** the gate asks "has this student already mastered what this level teaches?" — placement INTO a level should require comfortable command of the *prior* rungs, and 18/25 on objective items is comfortable command without demanding perfection. Of the two candidates nearest the original 70% philosophy (17/25 = 68% vs 18/25 = 72%), the stricter one wins because it aligns with the place-down-by-default rule. 40% as the B0 floor (10/25, exact) separates "shaky B1 candidate" from "cannot yet parse the page," which is what B0 exists for.

**B0 caveat (open decision for the coordinator/operator):** B0 has chapters but no assessments, no portal presence, and may not be offered as a class. If B0 is not a real destination this semester, the A&lt;4 row collapses into "B1 with support flag" and the teacher edition says so. The spec recommends keeping the B0 row: the level exists in the repo, and intake is precisely where it becomes useful.

## Document structure (build-phase contract)

One HTML source following the foundation-test conventions:

- Header: `chapter-number` "Nivelamento · Placement", title "Inglês Adulto — Teste de Nivelamento", intro in PT-first bilingual idiom.
- Student info box + score table (`vocab-table` pattern): one row per section `____ / 25`, total `____ / 100`, plus a **Placement** result line the coordinator fills from the rubric.
- Instruction callout: PT-first, includes the stop rule.
- Four sections as `unit` blocks (`page-break-before` between sections), 25 items each (20 grammar + a `reading-passage` block with 5 objective questions), mission-context illustration at the top (mandatory per AGENTS.md).
- Answers via the standard variant mechanism: `.answer` spans / `answer-blank[data-answer]` — the teacher PDF IS the answer key.
- Teacher edition additionally carries: `teacher-note` "Administration" block (when: before Class 1; time: up to 75 min, most students far less; what to say), the **scoring rubric table above rendered in full**, the borderline conversation guide, and a routing note per the feedback-profile precedent ("Score → Placement → what to tell the student").

**Location (new cross-level home — none exists today):**

```text
content/placement/exam.html                  ← the instrument
scripts/placement/publish-materials.js       ← same shape as scripts/b4/publish-materials.js
portal/downloads/placement/exam-student.pdf
portal/downloads/placement/exam-teacher.pdf
assets/images/placement/exam-intake.png
```

Portal: one new `details.material-group#materials-placement` accordion above the B1 group ("Nivelamento · Placement", 2 cards: student / teacher "with answers + rubric"), counters bumped (56 → 58, group count 2). This invents the cross-level bucket deliberately and minimally — one directory in each of the three trees (content, scripts, portal/downloads).

## Administration walkthrough (acceptance journey for the build phase)

1. Coordinator opens the portal → "Nivelamento" group → downloads teacher PDF → prints student PDF.
2. New student sits the exam before Class 1; coordinator reads the PT instruction aloud; up to 75 minutes (most students stop far earlier); student stops where the stop rule bites.
3. Coordinator scores with the teacher PDF: per-section totals into the score table.
4. Coordinator applies the rubric table (printed in the teacher edition) top-down; first matching row = placement.
5. Score of exactly 17 on the deciding section → runs the 5-minute conversation check → places, defaulting down.
6. Student's name, date, section scores, and placement land wherever the coordinator records enrollment today (out of scope for this repo; noted for the monorepo-incluir digital-intake future).

## Build-phase acceptance criteria (for the follow-up task)

1. `content/placement/exam.html` renders BOTH variants clean via `scripts/build.js` (A4, no overflow, sections page-break correctly); teacher PDF shows every answer + the full rubric table; student PDF shows neither.
2. All items drawn strictly from the owning level's "grammar to keep" scope — no item tests material its section's level doesn't own (spot-check against the grammar-ownership table).
3. Instructions PT-first bilingual throughout (B1 foundation-test idiom); stop rule present verbatim on the student paper.
4. All items objective, 1 point each, 25 per section (20 grammar: 8 fill-blank + 6 MC + 6 matching; 5 reading: T/F + MC against the section's passage); tolerant answer keys where multiple forms are correct (existing precedent: "accept any clear grouping…").
5. Mission-context illustration present; no forbidden patterns (no script/style/inline styles beyond the sanctioned student-info box pattern).
6. `scripts/placement/publish-materials.js` publishes both PDFs into `portal/downloads/placement/`; portal accordion + counters updated; portal renders correctly locally.
7. Committed and pushed to master with rendered PDFs (repo convention: `portal/downloads/*.pdf` are tracked).
8. A coordinator who has never seen this spec can go from "printed exam on the table" to "placement decision" using only the teacher edition. That is the whole point.

## Follow-up tasks this spec implies (GLaDOS files; not filed here)

1. **Build the instrument** — author `exam.html` per this spec (items, keys, illustration, publish script, portal wiring). One content task, this repo.
2. **B0 decision** — operator confirms whether B0 is an offered destination this semester (affects one rubric row + teacher-edition wording; do not block task 1 on it — ship with the B0 row and a caveat note, per recommendation above).
3. **(Future, optional) Digital intake form** — monorepo-incluir frontend bead, only if paper intake proves limiting. Items port unchanged.

## Final principle

The exam's job is not to measure everything — it is to make the intake decision repeatable. Forty objective points, one rubric table, place down when in doubt. Everything else is a refinement.
