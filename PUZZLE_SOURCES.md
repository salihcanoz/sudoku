# Puzzle sources and attribution

The Expert seeds in `tools/expert-seeds.json` derive from Gordon Royle's catalogue of 17-clue Sudoku puzzles. Copyright Gordon Royle and The University of Western Australia; released under [Creative Commons Attribution 2.5](https://creativecommons.org/licenses/by/2.5/).

- Original catalogue: http://staffhome.ecm.uwa.edu.au/~00013890/sudokumin.php
- Downloaded mirror: https://github.com/simonmar/parconc-examples/blob/master/sudoku17.49151.txt
- Catalogue license notice: https://github.com/grkuntzmd/sudoku#readme

Changes: three solution-consistent givens were added to each selected source, producing exactly 20 starting clues. The source and derived boards are recorded together in `tools/expert-seeds.json`. Each accepted board is independently checked for exactly one solution and the app's Expert technique requirements. Gameplay applies further digit, row, column, band, stack, and transpose transformations, rechecking the difficulty after transformation.

Easy, Medium, and Hard starting boards are generated locally by `tools/build-puzzles.cjs`.
