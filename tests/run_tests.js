// Runs engine.js against the independent python oracle (tests/expected.json).
const E = require('../engine.js');
const cases = require('./expected.json');
let pass = 0, fail = 0;
const TOL = 1e-9;
function chk(ok, label, got, want) {
  if (ok) { pass++; }
  else { fail++; console.error('FAIL', label, 'got', got, 'want', want); }
}
for (const c of cases) {
  if (c.kind === 'hline' || c.kind === 'vline') {
    const fn = c.kind === 'hline' ? E.hourLine : E.verticalHourLine;
    const r = fn(c.lat, c.hour);
    if (c.skip) chk(r.skip === true, `${c.kind} ${c.lat} ${c.hour} skip`, r, 'skip');
    else chk(Math.abs(r.angle - c.angle) < TOL, `${c.kind} ${c.lat} ${c.hour}`, r.angle, c.angle);
  } else if (c.kind === 'polar') {
    const r = E.hourLine(90, c.hour);
    chk(Math.abs(r.angle - c.angle) < TOL && Math.abs(Math.abs(r.angle) - Math.abs(c.hourAngle)) < TOL, `polar ${c.hour}`, r.angle, c.angle);
  } else if (c.kind === 'published_london_15') {
    const r = E.hourLine(51.5074, 15);
    chk(Math.abs(r.angle - c.published) < c.tol, 'published london', r.angle, c.published);
  } else if (c.kind === 'eot') {
    const r = E.equationOfTime(c.doy);
    chk(Math.abs(r.minutes - c.minutes) < TOL, `eot ${c.doy}`, r.minutes, c.minutes);
  } else if (c.kind === 'published_eot') {
    const r = E.equationOfTime(c.doy);
    chk(Math.abs(r.minutes - c.published) < c.tol, `published eot ${c.doy}`, r.minutes, c.published);
  } else if (c.kind === 'noon') {
    const r = E.solarNoon(c.lon, c.tz, c.doy);
    chk(Math.abs(r.minutes - c.minutes) < TOL, `noon ${c.lon} ${c.tz} ${c.doy}`, r.minutes, c.minutes);
  } else if (c.kind === 'published_noon') {
    const r = E.solarNoon(0, 0, 32);
    chk(r.minutes > c.lo && r.minutes < c.hi, 'published noon greenwich', r.minutes, [c.lo, c.hi]);
  } else if (c.kind === 'shadow') {
    const r = E.shadowToClock(c.sh, c.lon, c.tz, c.doy);
    chk(Math.abs(r.minutes - c.minutes) < TOL, `shadow ${c.sh} ${c.lon} ${c.doy}`, r.minutes, c.minutes);
  } else if (c.kind === 'offset') {
    const r = E.lineOffsetMm(c.angle, c.radius);
    chk(Math.abs(r.mm - c.mm) < TOL, `offset ${c.angle} ${c.radius}`, r.mm, c.mm);
  }
}
// error paths
const errs = [
  E.styleAngle(91).error, E.styleAngle('x').error,
  E.hourLine(95, 10).error, E.hourLine(30, 'a').error,
  E.equationOfTime(0).error, E.equationOfTime(400).error,
  E.longitudeCorrection(200, 0).error, E.longitudeCorrection(0, 20).error,
  E.shadowToClock(-1, 0, 0, 100).error, E.shadowToClock(25, 0, 0, 100).error,
  E.lineOffsetMm(10, -5).error,
  E.solarNoon(999, 0, 100).error
];
errs.forEach((e, i) => chk(typeof e === 'string' && e.length > 5, 'error path ' + i, e, 'error string'));
// property: symmetry of morning/afternoon angles; style = |lat|
for (const lat of [20, 32.08, 51.5, -33.87]) {
  const a = E.hourLine(lat, 9).angle, b = E.hourLine(lat, 15).angle;
  chk(Math.abs(a + b) < TOL, `symmetry ${lat}`, [a, b], 'opposites');
  chk(Math.abs(E.styleAngle(lat).angle - Math.abs(lat)) < TOL, `style ${lat}`, E.styleAngle(lat).angle, Math.abs(lat));
}
console.log(`${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
