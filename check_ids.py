import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('renderer.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Get all IDs from HTML
html_ids = set(re.findall(r'id="([^"]+)"', html))

# Get all getElementById calls from JS
js_ids = set(re.findall(r"getElementById\('([^']+)'\)", js))
js_ids |= set(re.findall(r'getElementById\("([^"]+)"\)', js))

print("=== IDs used in renderer.js but missing from index.html ===")
missing = js_ids - html_ids
for m in sorted(missing):
    print(f"  MISSING: {m}")

print("\n=== IDs in index.html that renderer.js queries ===")
for i in sorted(html_ids & js_ids):
    print(f"  OK: {i}")
