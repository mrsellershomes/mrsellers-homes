"""Extract Bergen County school data from NJ DOE School Performance Reports xlsx.
Emits JSON to stdout for the JS pipeline to consume.

Usage: python3 _extract-nj-doe.py <xlsx_path>
"""
import json
import sys
import re
import pandas as pd

XLSX = sys.argv[1]

# School identifiers in NJ DOE files are NOT statewide unique - SchoolCode is
# only unique within a single DistrictCode. We use a compound key
# "{DistrictCode}-{SchoolCode}" everywhere a per-school lookup happens.
def school_key(district_code, school_code):
    return f"{int(district_code)}-{int(school_code)}"

# Header and Contact -> directory
hdr = pd.read_excel(XLSX, sheet_name='Header and Contact')
hdr_bergen = hdr[hdr['COUNTY_NAME'] == 'Bergen'].copy()
hdr_bergen['CITY'] = (
    hdr_bergen['CITY_STATE_ZIP']
    .astype(str)
    .str.replace(r'\s+NJ\s+\d.*$', '', regex=True)
    .str.strip()
)
hdr_bergen['SCHOOL_KEY'] = hdr_bergen.apply(
    lambda r: school_key(r['DISTRICT_CODE'], r['SCHOOL_CODE']), axis=1
)
directory = hdr_bergen[
    ['SCHOOL_KEY', 'SCHOOL_CODE', 'DISTRICT_CODE', 'SCHOOL_NAME', 'DISTRICT_NAME', 'GRADESPAN', 'CITY']
].to_dict('records')

# Enrollment totals - compound-keyed
enr = pd.read_excel(XLSX, sheet_name='EnrollmentTrendsbyGrade')
enr_bergen = enr[enr['CountyName'] == 'Bergen'][['DistrictCode', 'SchoolCode', 'Total']]
enr_map = {}
for _, r in enr_bergen.iterrows():
    key = school_key(r['DistrictCode'], r['SchoolCode'])
    total = r['Total']
    enr_map[key] = None if pd.isna(total) else int(total)


def perf(sheet):
    # Use the entire sheet to compute state avg from ALL Schoolwide rows in NJ,
    # not just Bergen - state baseline doesn't change by county.
    p = pd.read_excel(XLSX, sheet_name=sheet)
    sw = p[p['Student Groups'] == 'Schoolwide'].copy()
    school_col = next(c for c in sw.columns if c.startswith('School:') and 'met/exceeded' in c)
    state_col = next(c for c in sw.columns if c.startswith('State:') and 'met/exceeded' in c)

    # Bergen-specific school proficiency map - compound-keyed by district+school
    bergen = sw[sw['CountyName'] == 'Bergen']
    out = {}
    for _, r in bergen.iterrows():
        key = school_key(r['DistrictCode'], r['SchoolCode'])
        v = pd.to_numeric(r[school_col], errors='coerce')
        out[key] = None if pd.isna(v) else float(v)

    # State avg: take any single non-null state value (it's the same statewide constant)
    state_series = pd.to_numeric(sw[state_col], errors='coerce').dropna()
    state_avg = float(state_series.iloc[0]) if len(state_series) else None
    return out, state_avg


ela_map, ela_state = perf('ELAParticipationPerformance')
math_map, math_state = perf('MathParticipationPerformance')

result = {
    'directory': directory,
    'enrollment': enr_map,
    'ela': ela_map,
    'math': math_map,
    'state': {'ela': ela_state, 'math': math_state},
    'data_year': '2023-2024',
}
sys.stdout.write(json.dumps(result))
