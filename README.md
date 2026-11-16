# Sudoku

Open `index.html` or serve this directory with a static HTTP server. No build step is required.

## Difficulty and puzzle initialization

New games use a bank of 32 puzzles, each checked for a unique solution and solved by `logic.js` without guessing. Levels use both the hardest technique and the amount of sustained deduction required:

| Level | Starting clues (exact) | Techniques allowed |
| --- | --- | --- |
| Easy | 35 | Naked singles |
| Medium | 30 | Easy + hidden singles (row, column, box / cross-hatching) |
| Hard | 25 | Medium + pointing pairs/triples, claiming pairs/triples, naked/hidden pairs and triples |
| Expert | 20 | Hard + X-Wing, Swordfish, XY-Wing, XYZ-Wing, forcing chains and AIC |

Hard puzzles require at least five elimination steps over two separate stretches of deduction, with the first elimination within the first 13 solver steps. Expert puzzles require at least ten elimination steps, including six advanced steps across at least three stretches, with the first elimination within nine solver steps and no more than two initial naked singles. A stretch ends when a number is placed, so repeated eliminations at one bottleneck do not alone qualify a puzzle.

Every accepted starting puzzle must meet these thresholds in the solver's simplest-first solve path. Easy, Medium, and Hard grids are generated with randomized backtracking rather than variations of one cyclic template. Expert boards derive from low-clue catalogue seeds; see [puzzle sources and attribution](PUZZLE_SOURCES.md). Exact starting clue counts keep the board sparse; technique and sustained-effort requirements still determine eligibility within each level. These are this app's technique tiers, not a universal Sudoku rating standard. Snyder notation is a manual note-taking aid, not a solving tier.

Initialization randomizes a seed's digits, rows within bands, columns within stacks, band/stack order, and transpose. It re-grades the transformed puzzle, including the exact starting clue counts and sustained-effort requirements, and uses the verified seed if the solver's rating changes. Existing saved games retain their boards.

Quick notes fills every empty square with legal candidates, respects applied hint eliminations, and supports Undo. It leaves entered numbers and the manual Notes toggle unchanged.

Hints use the same technique engine. Elimination hints show the pattern and affected squares; applying one populates candidate notes and retains the elimination for subsequent hints. Undo restores these deductions. Editing a value resets deductions so hints cannot rely on stale eliminations; manually removing a pencil candidate records an elimination for hints, and adding it back cancels that elimination. Squares with pencil notes use those notes as their candidate lists for hints; blank squares use legal candidates and tracked eliminations. Saved games preserve applied eliminations.

To rebuild the bank (may take a few minutes): `node tools/build-puzzles.cjs`. The checked-in Expert seed file preserves the sparse 20-clue layouts. To regenerate those seeds, download the catalogue listed in [PUZZLE_SOURCES.md](PUZZLE_SOURCES.md), then run `node tools/build-expert-seeds.cjs /path/to/sudoku17.49151.txt` first.

## Auto-complete

After a number is entered, the game offers to finish when at most nine squares remain, every remaining square has exactly one legal candidate, and all entered numbers are correct. The check uses the board, not manual notes. Restored eligible games are checked too.

“Yes” fills the remaining squares in order with a brief cell animation and a completion glow, then shows the victory dialog. Controls and the timer are locked during completion. Reduced-motion preferences skip the animation. “No” or Escape dismisses the offer for that game; the choice is saved. A new game resets it.

## Verification

```sh
node tests/logic.test.cjs
node tests/difficulty.test.cjs
node tests/puzzle-utils.test.cjs
node tests/advanced.test.cjs
node tests/hints.test.cjs
node tests/game.test.cjs
node tests/autocomplete.test.cjs
```

Tests cover all six intermediate elimination types, sound eliminations along every bank solution, unique solutions and technique ratings, initialization, randomized new games, and applying/undoing candidate hints.

## Advanced deductions

Fish support both row and column orientations: X-Wing uses two base and cover lines, Swordfish three. XY-Wing targets must see both wings; XYZ-Wing targets must also see the pivot.

Chains use candidate implications: weak links exclude a peer candidate when one is true, and strong links force the other candidate when one of exactly two possibilities is false. A bivalue forcing chain finds a shared elimination under both starting choices. AIC finds a contradiction between an assumed candidate and its negation. Hints display each implication and the resulting removal. Traversal is bounded to 12 links per branch; this supports these chain patterns without claiming exhaustive AIC or general recursive forcing-net solving. No solution-key lookup is used for these deductions.

Advanced tests cover both fish orientations, wing target visibility, every strong/weak link in generated chain proofs, and preservation of known solutions in randomized candidate states.
