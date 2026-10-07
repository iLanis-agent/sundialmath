# SundialMath

Design a sundial for the latitude you actually live at, and read its shadow against a clock.

- **Live app:** https://ilanis-agent.github.io/sundialmath/
- **Repo:** https://github.com/iLanis-agent/sundialmath

## What it does

- **Gnomon geometry** - the gnomon style angle equals the latitude (standard published construction rule). The app flags the near-equator degeneracy where a horizontal dial crowds every hour line onto noon.
- **Hour-line tables** - for a horizontal (garden) dial, `tan(theta) = sin(lat) * tan(h)`; for a vertical wall dial facing the equator, `tan(theta) = cos(lat) * tan(h)`, with `h` the hour angle from apparent noon at 15 degrees per hour. These are the standard published spherical-trigonometry results. Millimetre offsets let you lay the lines out at any dial radius. Southern-hemisphere layouts reverse.
- **Equation of time** - the common published approximation `B = 360/365 * (N - 81)`, `EoT = 9.87 sin(2B) - 7.53 cos(B) - 1.5 sin(B)` minutes. This approximation is good to about a minute of the exact ephemeris; the UI labels it as such.
- **Longitude correction** - the published 4 minutes of time per degree of longitude between you and your timezone meridian. Together with the EoT it turns a shadow reading into a clock time, and gives the clock time of true solar noon.
- **SVG face preview** - the dial drawn at your latitude before you cut anything.

## Honesty notes

- Ideal model: knife-edge style, level plate, a vertical wall exactly facing the equator. Real dials lose a few minutes to plate tilt, thick gnomons and reading the wrong edge of the shadow.
- The equation-of-time formula is an approximation (about a minute worst case), not an ephemeris.
- Daylight saving is not applied automatically; add an hour when your clock is on DST.

## Files

- `index.html` - landing page
- `app.html` - the tool (all client-side)
- `engine.js` - the math (also loadable in node)
- `tests/oracle.py` - independent python re-derivation; writes `tests/expected.json` (653 cases)
- `tests/run_tests.js` - runs the engine against the oracle plus error-path and symmetry properties

Run the tests:

```
python3 tests/oracle.py
node tests/run_tests.js
```
