"""Build lazy-loaded Philippine address hierarchy files from the vetted PSGC dataset."""
from __future__ import annotations

import json
import sys
import zipfile
from pathlib import Path


def slug(value: str) -> str:
    return "".join(char.lower() if char.isalnum() else "-" for char in value).strip("-")


wheel = Path(sys.argv[1])
root = Path(__file__).resolve().parents[1]
output = root / "public" / "psgc"
output.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(wheel) as archive:
    hierarchy = json.load(archive.open("barangay/data/barangay.json"))

regions = list(hierarchy)
provinces = {region: sorted(hierarchy[region]) for region in regions}

(output / "index.json").write_text(
    json.dumps({"version": "2026.1.13", "regions": regions, "provincesByRegion": provinces}, ensure_ascii=False, separators=(",", ":")),
    encoding="utf-8",
)

for region, divisions in hierarchy.items():
    (output / f"{slug(region)}.json").write_text(json.dumps(divisions, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

ts_regions = ",\n  ".join(json.dumps(region, ensure_ascii=False) for region in regions)
ts_provinces = ",\n  ".join(f"{json.dumps(region, ensure_ascii=False)}: {json.dumps(provinces[region], ensure_ascii=False)}" for region in regions)
(root / "lib" / "data" / "philippines.ts").write_text(
    f"// Generated from PSGC data (version 2026.1.13). Run scripts/build_ph_address_data.py to refresh.\n"
    f"export const regions = [\n  {ts_regions},\n] as const;\n\n"
    f"export const provincesByRegion: Record<string, readonly string[]> = {{\n  {ts_provinces}\n}};\n\n"
    "export const provinces = Object.values(provincesByRegion).flat();\n",
    encoding="utf-8",
)
