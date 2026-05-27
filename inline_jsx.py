import os

project_dir = os.path.dirname(os.path.abspath(__file__))
app_jsx_path = os.path.join(project_dir, "public", "App.jsx")
index_html_path = os.path.join(project_dir, "public", "index.html")

print(f"Reading App.jsx from {app_jsx_path}...")
with open(app_jsx_path, "r", encoding="utf-8") as f:
    app_jsx = f.read()

print(f"Reading index.html from {index_html_path}...")
with open(index_html_path, "r", encoding="utf-8") as f:
    index_html = f.read()

# Try different target formats just in case
target1 = '  <!-- Load and Compile App.jsx with Babel Standalone -->\n  <script type="text/babel" src="App.jsx"></script>'
target2 = '  <!-- Load and Compile App.jsx with Babel Standalone -->\n  <script type=\"text/babel\" src=\"App.jsx\"></script>'
target3 = '  <script type="text/babel" src="App.jsx"></script>'

replacement = '  <!-- Inline compiled React application to prevent local XHR/MIME blocks -->\n  <script type="text/babel">\n' + app_jsx + '\n  </script>'

new_index = None
if target1 in index_html:
    new_index = index_html.replace(target1, replacement)
elif target2 in index_html:
    new_index = index_html.replace(target2, replacement)
elif target3 in index_html:
    new_index = index_html.replace(target3, replacement)
else:
    # If the exact tag is slightly different, let's find the script tag matching App.jsx and replace it
    import re
    # Match any script tag that has src="App.jsx" or src='./App.jsx' etc.
    pattern = r'<!--.*?-->\s*<script type="text/babel"\s+src=["\'].*?App\.jsx["\']>\s*</script>'
    if re.search(pattern, index_html):
        new_index = re.sub(pattern, replacement, index_html)
    else:
        # Fallback to matching just the script tag itself
        pattern_simple = r'<script type="text/babel"\s+src=["\'].*?App\.jsx["\']>\s*</script>'
        if re.search(pattern_simple, index_html):
            new_index = re.sub(pattern_simple, replacement, index_html)

if new_index:
    with open(index_html_path, "w", encoding="utf-8") as f:
        f.write(new_index)
    print("Successfully inlined App.jsx into index.html!")
else:
    if "Inline compiled React application" in index_html:
        print("App.jsx is already inlined in index.html!")
    else:
        print("Error: Could not find any match for App.jsx script tag in index.html!")
        print("HTML content around script tag:")
        for line in index_html.splitlines():
            if "script" in line or "App.jsx" in line:
                print("  ", line.strip())
