#!/usr/bin/env python3
# Independent oracle for SundialMath. Re-derives every published formula from
# scratch (spherical trig via python math, EoT via the published approximation),
# then cross-checks against published reference values with labeled tolerances.
import json, math, sys

DEG = math.pi / 180

def hour_line(lat, hour, vertical=False):
    h = (hour - 12) * 15.0
    if abs(h) >= 90: return None
    s = math.cos(abs(lat) * DEG) if vertical else math.sin(abs(lat) * DEG)
    t = math.degrees(math.atan(s * math.tan(h * DEG)))
    return -t if lat < 0 else t

def eot(n):
    B = (360.0 / 365.0) * (n - 81) * DEG
    return 9.87 * math.sin(2 * B) - 7.53 * math.cos(B) - 1.5 * math.sin(B)

def solar_noon(lon, tz, doy):
    return 720 + 4 * (tz * 15 - lon) - eot(doy)

def shadow_to_clock(sh, lon, tz, doy):
    return sh * 60 - eot(doy) + 4 * (tz * 15 - lon)

cases = []
# 1. Hour-line table, horizontal + vertical, several latitudes, 5..19
for lat in (0.0, 32.08, 51.5074, -33.8688, 66.5, 90.0):
    for v in (False, True):
        for hour in range(5, 20):
            r = hour_line(lat, hour, v)
            cases.append({"kind": "vline" if v else "hline", "lat": lat, "hour": hour,
                          "skip": r is None, "angle": r})
# 2. Polar property: at the pole a horizontal dial is a 24-hour dial (theta == h)
for hour in range(0, 24):
    r = hour_line(90.0, hour)
    if r is not None:
        cases.append({"kind": "polar", "hour": hour, "angle": r, "hourAngle": (hour - 12) * 15.0})
# 3. Published spot check: London (lat 51.5074) 15:00 horizontal ~ 38.0 deg
cases.append({"kind": "published_london_15", "angle": hour_line(51.5074, 15), "published": 38.0, "tol": 0.2})
# 4. EoT for every day + published extrema sanity (approx within ~1.0 min of ephemeris refs)
for n in range(1, 366):
    cases.append({"kind": "eot", "doy": n, "minutes": eot(n)})
# published reference days (approximation, tolerance 1.0 min, labeled)
for doy, ref in ((42, -14.2), (307, 16.4), (105, 0.0), (226, -3.5)):
    cases.append({"kind": "published_eot", "doy": doy, "minutes": eot(doy), "published": ref, "tol": 1.0})
# 5. Solar noon grid
for lon, tz in ((0.0, 0), (34.78, 2), (-74.0, -5), (139.69, 9), (2.35, 1)):
    for doy in (1, 60, 120, 180, 240, 281, 330, 365):
        cases.append({"kind": "noon", "lon": lon, "tz": tz, "doy": doy, "minutes": solar_noon(lon, tz, doy)})
# published: Greenwich Feb 1 solar noon ~ 12:13-12:14
cases.append({"kind": "published_noon", "minutes": solar_noon(0.0, 0, 32), "lo": 733.0, "hi": 735.0})
# 6. Shadow -> clock grid
for lon, tz in ((34.78, 2), (-74.0, -5), (0.0, 0)):
    for doy in (15, 100, 200, 281, 350):
        for sh in (9.0, 12.5, 16.25):
            cases.append({"kind": "shadow", "sh": sh, "lon": lon, "tz": tz, "doy": doy,
                          "minutes": shadow_to_clock(sh, lon, tz, doy)})
# 7. Layout offsets
for ang in (10.0, 27.972898461890196, -40.0):
    for r in (100.0, 180.0):
        cases.append({"kind": "offset", "angle": ang, "radius": r, "mm": r * math.tan(ang * DEG)})

json.dump(cases, open("tests/expected.json", "w"))
print(f"oracle wrote {len(cases)} cases")
