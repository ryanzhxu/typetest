# Handoff prompts

One file per parked piece of work. Each is **self-contained**: paste it whole
into a fresh session that knows nothing about this project and it has enough to
start. That means every file repeats the same project context. The duplication
is deliberate. Do not factor it out into a shared file, because then none of
them is standalone any more.

| File | Piece | Size | Blocked on |
|---|---|---|---|
| [piece-a2-zodiac.md](piece-a2-zodiac.md) | A2, zodiac | Small | Nothing |
| [piece-b-chinese-locale.md](piece-b-chinese-locale.md) | B, `zh-Hant-HK` | Large, ~10,000 words of Chinese | Three staging decisions, listed in the file |
| [piece-d-traits.md](piece-d-traits.md) | D, traits | Medium | Nothing, but see the sequencing note |
| [piece-e-storage-consent.md](piece-e-storage-consent.md) | E, storage and consent | Medium, mostly legal | A product decision on collecting data at all |

## Order

`docs/superpowers/specs/2026-09-06-personality-design.md` §10 sets it, and the
rule that decides it is: **anything shipping after B pays for its own
transcreation pass.** Content written before the Chinese locale gets written
once in each language. Content written after needs a second pass.

So the cheap order is **A2, then B, then D, then E**. A2 is a handful of words
and rides along in B's writing for almost nothing. D is 24 items plus six scale
descriptions and would hold B up considerably, so it ships later and pays the
second pass knowingly. That is a decision already taken, not an oversight.

E is independent of all of it and can happen whenever, but it is listed in §11
as the one blocking open question, because the wording on the result page
cannot say "measured" until it exists.

## State as of 2026-09-07

Pieces A, A2's predecessor A, and A3 are shipped and live at
`personality.ryanxu.dev`. None of the four pieces below is started. The last
session finished the type-page content expansion and the social cards, so the
string keys these pieces build on are frozen and the English content they would
translate is finished.
