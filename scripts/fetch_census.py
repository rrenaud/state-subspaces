"""Fetch the 50 states' figures from Census Bureau bulk files and rewrite the rows in js/states.js.

The Census API now wants a key, so this reads the keyless downloads on www2.census.gov instead:
  2022 ACS 1-year table-based summary file (programs-surveys/acs/summary_file/2022/table-based-SF):
    B01003 population, B19013 median household income, B01002 median age,
    B15003 bachelor's degree or higher (25 and over), B01001 share 65 and over, B17001 share below poverty
  2020 Census state urban and rural population (geo/docs/reference/ua/State_Urban_Rural_Pop_2020_2010.xlsx)
  2022 Gazetteer counties file: land area (ALAND_SQMI) summed by state, for density = population / land area

Also writes data/census.csv with the unrounded values. Standard library only.
Usage: python3 scripts/fetch_census.py
"""
import csv
import io
import re
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SF = "https://www2.census.gov/programs-surveys/acs/summary_file/2022/table-based-SF/data/1YRData/acsdt1y2022-{}.dat"
UR = "https://www2.census.gov/geo/docs/reference/ua/State_Urban_Rural_Pop_2020_2010.xlsx"
GAZ = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2022_Gazetteer/2022_Gaz_counties_national.zip"


def get(url):
    with urllib.request.urlopen(url, timeout=120) as r:
        return r.read()


def acs(table):
    """State rows of one ACS detailed table, keyed by state FIPS: {"01": {"B19013_E001": 59609.0, ...}}."""
    rows = csv.DictReader(io.StringIO(get(SF.format(table.lower())).decode()), delimiter="|")
    return {r["GEO_ID"][-2:]: {k: float(v) for k, v in r.items() if "_E" in k}
            for r in rows if r["GEO_ID"].startswith("0400000US")}


def urban():
    """2020 urban share by state FIPS. Columns: A state FIPS (a shared string), D 2020 total population,
    E 2020 urban population."""
    z = zipfile.ZipFile(io.BytesIO(get(UR)))
    strings = [re.sub(r"<[^>]+>", "", x) for x in re.findall(r"<si>(.*?)</si>", z.read("xl/sharedStrings.xml").decode(), re.S)]
    out = {}
    for row in re.findall(r"<row[^>]*>(.*?)</row>", z.read("xl/worksheets/sheet1.xml").decode())[1:]:
        cells = {}
        for col, attrs, body in re.findall(r'<c r="([A-Z]+)\d+"([^>]*?)(?:/>|>(.*?)</c>)', row):
            v = re.search(r"<v>(.*?)</v>", body or "")
            if v:
                cells[col] = strings[int(v.group(1))] if 't="s"' in attrs else v.group(1)
        if re.fullmatch(r"\d{2}", cells.get("A", "")) and cells.get("D") and cells.get("E"):
            out[cells["A"]] = 100 * float(cells["E"]) / float(cells["D"])
    return out


def main():
    js = (ROOT / "js/states.js").read_text()
    postal = dict(re.findall(r'"([A-Za-z ]+)": "([A-Z]{2})"', js))
    regions = {k: v for k, v in re.findall(r'\["([A-Za-z ]+)", "([NMSW])"', js) if k in postal}
    assert len(regions) == 50 and len(postal) == 50

    land, fips = defaultdict(float), {}
    with zipfile.ZipFile(io.BytesIO(get(GAZ))) as z:
        name = next(n for n in z.namelist() if n.endswith(".txt"))
        for r in csv.DictReader(io.TextIOWrapper(z.open(name), encoding="latin-1"), delimiter="\t"):
            r = {k.strip(): v.strip() for k, v in r.items()}
            land[r["USPS"]] += float(r["ALAND_SQMI"])
            fips[r["USPS"]] = r["GEOID"][:2]

    pop, inc, age, edu, sex_age, pov = (acs(t) for t in ["B01003", "B19013", "B01002", "B15003", "B01001", "B17001"])
    urb = urban()
    out = []
    for st in sorted(regions):
        f = fips[postal[st]]
        p = pop[f]["B01003_E001"]
        e, a = edu[f], sex_age[f]
        older = sum(a[f"B01001_E{i:03d}"] for i in list(range(20, 26)) + list(range(44, 50)))
        out.append({
            "name": st, "region": regions[st], "pop": p, "land_sqmi": land[postal[st]], "density": p / land[postal[st]],
            "income": inc[f]["B19013_E001"], "median_age": age[f]["B01002_E001"],
            "bachelors": 100 * sum(e[f"B15003_E{i:03d}"] for i in range(22, 26)) / e["B15003_E001"],
            "urban": urb[f], "age65": 100 * older / a["B01001_E001"],
            "poverty": 100 * pov[f]["B17001_E002"] / pov[f]["B17001_E001"],
        })

    (ROOT / "data").mkdir(exist_ok=True)
    with open(ROOT / "data/census.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out[0]))
        w.writeheader()
        w.writerows(out)

    cells = [f'["{r["name"]}", "{r["region"]}", {r["pop"] / 1e6:.3f}, {r["density"]:.1f}, {r["income"] / 1e3:.1f}, '
             f'{r["median_age"]:.1f}, {r["bachelors"]:.1f}, {r["urban"]:.1f}, {r["age65"]:.1f}, {r["poverty"]:.1f}]'
             for r in out]
    body = ",\n".join("        " + ", ".join(cells[i:i + 2]) for i in range(0, len(cells), 2))
    js = re.sub(r"rows: \[\n.*?\n      \]", lambda m: "rows: [\n" + body + "\n      ]", js, flags=re.S)
    (ROOT / "js/states.js").write_text(js)
    print(f"wrote {len(out)} states")


if __name__ == "__main__":
    main()
