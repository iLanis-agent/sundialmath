// SundialMath engine: sundial design from latitude, and clock time from a shadow.
// Hour-line formulas are the standard published spherical-trig results for
// horizontal and vertical (direct south/north-facing) dials; the equation of
// time uses the common published approximation (labeled in the UI, good to
// about a minute); longitude correction is the published 4 minutes per degree.
var DEG = Math.PI / 180;

function bad(v) { return !(typeof v === 'number' && isFinite(v)); }
function badLat(lat) { return bad(lat) || Math.abs(lat) > 90; }

// Gnomon style angle equals the latitude (published construction rule).
function styleAngle(latDeg) {
  if (badLat(latDeg)) return { error: 'Latitude must be a number between -90 and 90.' };
  return { angle: Math.abs(latDeg) };
}

// Hour-line angle from the noon line, horizontal dial (published: tan theta = sin(lat) * tan(h)).
// hour is local apparent solar time in hours (12 = noon). Returns signed degrees:
// morning lines negative, afternoon positive (northern hemisphere layout).
function hourLine(latDeg, hour) {
  if (badLat(latDeg) || bad(hour)) return { error: 'Latitude and hour must be numbers (lat within +/-90).' };
  var h = (hour - 12) * 15; // hour angle from noon, 15 deg per hour (published convention)
  if (Math.abs(h) >= 90) return { skip: true }; // line at/beyond infinity - sun at or below the horizon plane
  var s = Math.sin(Math.abs(latDeg) * DEG);
  var theta = Math.atan(s * Math.tan(h * DEG)) / DEG;
  if (latDeg < 0) theta = -theta; // southern hemisphere: reversed layout
  return { hour: hour, hourAngle: h, angle: theta };
}

// Vertical dial facing the equator (south in the north, north in the south):
// published tan theta = cos(lat) * tan(h).
function verticalHourLine(latDeg, hour) {
  if (badLat(latDeg) || bad(hour)) return { error: 'Latitude and hour must be numbers (lat within +/-90).' };
  var h = (hour - 12) * 15;
  if (Math.abs(h) >= 90) return { skip: true };
  var s = Math.cos(Math.abs(latDeg) * DEG);
  var theta = Math.atan(s * Math.tan(h * DEG)) / DEG;
  if (latDeg < 0) theta = -theta;
  return { hour: hour, hourAngle: h, angle: theta };
}

// Equation of time (apparent solar time minus mean solar time), minutes.
// Common published approximation (NOAA-style): B = 360/365 * (N - 81).
function equationOfTime(dayOfYear) {
  if (bad(dayOfYear) || dayOfYear < 1 || dayOfYear > 366) return { error: 'Day of year must be 1-366.' };
  var B = (360 / 365) * (dayOfYear - 81) * DEG;
  return { minutes: 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B) };
}

// Longitude correction: published 4 minutes of time per degree of longitude
// from the timezone meridian (east longitudes positive).
function longitudeCorrection(lonDeg, tzOffsetHours) {
  if (bad(lonDeg) || Math.abs(lonDeg) > 180 || bad(tzOffsetHours) || Math.abs(tzOffsetHours) > 14) {
    return { error: 'Longitude must be within +/-180 and timezone offset within +/-14.' };
  }
  var meridian = tzOffsetHours * 15;
  return { minutes: 4 * (meridian - lonDeg), meridian: meridian };
}

// Clock time of apparent solar noon: 12:00 + longitude correction - EoT.
function solarNoon(lonDeg, tzOffsetHours, dayOfYear) {
  var lc = longitudeCorrection(lonDeg, tzOffsetHours);
  if (lc.error) return lc;
  var e = equationOfTime(dayOfYear);
  if (e.error) return e;
  var mins = 720 + lc.minutes - e.minutes;
  return { minutes: mins, text: fmtClock(mins), eot: e.minutes, lonCorr: lc.minutes };
}

// Convert a shadow reading (apparent solar time the dial shows) to clock time:
// clock = shadow reading - EoT + longitude correction.
function shadowToClock(shadowHour, lonDeg, tzOffsetHours, dayOfYear) {
  if (bad(shadowHour) || shadowHour < 0 || shadowHour >= 24) return { error: 'Shadow reading must be an hour between 0 and 24.' };
  var lc = longitudeCorrection(lonDeg, tzOffsetHours);
  if (lc.error) return lc;
  var e = equationOfTime(dayOfYear);
  if (e.error) return e;
  var mins = shadowHour * 60 - e.minutes + lc.minutes;
  var dstNote = '';
  return { minutes: mins, text: fmtClock(mins), eot: e.minutes, lonCorr: lc.minutes };
}

// mm offset of an hour line at dial radius radiusMm, for laying out the face.
function lineOffsetMm(angleDeg, radiusMm) {
  if (bad(angleDeg) || bad(radiusMm) || radiusMm <= 0) return { error: 'Angle and radius must be numbers, radius positive.' };
  return { mm: radiusMm * Math.tan(angleDeg * DEG) };
}

function fmtClock(mins) {
  var m = ((mins % 1440) + 1440) % 1440;
  var hh = Math.floor(m / 60), mm = Math.floor(m % 60), ss = Math.round((m % 1) * 60);
  if (ss === 60) { ss = 0; mm += 1; if (mm === 60) { mm = 0; hh = (hh + 1) % 24; } }
  return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + (ss ? ':' + (ss < 10 ? '0' : '') + ss : '');
}

var engine = {
  styleAngle: styleAngle, hourLine: hourLine, verticalHourLine: verticalHourLine,
  equationOfTime: equationOfTime, longitudeCorrection: longitudeCorrection,
  solarNoon: solarNoon, shadowToClock: shadowToClock, lineOffsetMm: lineOffsetMm,
  fmtClock: fmtClock,
  CONST: { DEG_PER_HOUR: 15, MIN_PER_DEG_LON: 4, EOT_NOTE: 'Common published approximation (within about a minute of the exact ephemeris).' }
};
if (typeof module !== 'undefined') module.exports = engine;
