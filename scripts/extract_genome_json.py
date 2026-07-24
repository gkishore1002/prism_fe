import re
import pathlib

html = pathlib.Path(r"c:\Users\kisho\Downloads\Swotify_Learning_Genome_Report_v2.html").read_text(
    encoding="utf-8"
)
match = re.search(
    r'<script id="data" type="application/json">\s*(.*?)\s*</script>',
    html,
    re.S,
)
if not match:
    raise SystemExit("JSON block not found")

out = pathlib.Path(__file__).resolve().parents[1] / "src/modules/tutor/lib/learningGenomeDemo.json"
out.write_text(match.group(1), encoding="utf-8")
print(f"Wrote {len(match.group(1))} bytes to {out}")
