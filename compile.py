import os

project_dir = os.path.dirname(os.path.abspath(__file__))
app_jsx_path = os.path.join(project_dir, "public", "App.jsx")
index_html_path = os.path.join(project_dir, "public", "index.html")

print(f"Reading App.jsx from {app_jsx_path}...")
with open(app_jsx_path, "r", encoding="utf-8") as f:
    app_jsx = f.read().replace("\r\n", "\n")

print(f"Reading index.html from {index_html_path}...")
with open(index_html_path, "r", encoding="utf-8") as f:
    index_html = f.read().replace("\r\n", "\n")

# We want to replace the text between the start of Babel script block and the end.
start_marker = '  <!-- Load and Compile App.jsx with Babel Standalone -->\n  <script type="text/babel">'
end_marker = '  </script>\n\n  <!-- Fallback: automatically remove loading screen if Babel compilation takes too long -->'

if start_marker in index_html and end_marker in index_html:
    start_idx = index_html.find(start_marker) + len(start_marker)
    end_idx = index_html.find(end_marker)
    
    new_html = index_html[:start_idx] + "\n" + app_jsx + "\n" + index_html[end_idx:]
    with open(index_html_path, "w", encoding="utf-8") as f:
        f.write(new_html)
    print("Successfully updated index.html with new App.jsx!")
else:
    print("Markers not found! Trying fallback regex...")
    import re
    # Fallback to general regex search
    pattern = r'(<!-- Load and Compile App\.jsx with Babel Standalone -->\s*<script type="text/babel">).*?(</script>\s*<!-- Fallback: automatically remove loading screen)'
    # We use re.DOTALL so . matches newlines
    # Escape replacement backslashes and groups
    escaped_jsx = app_jsx.replace('\\', '\\\\').replace('$', '\\$')
    new_html, count = re.subn(pattern, r'\1\n' + escaped_jsx + r'\n\2', index_html, flags=re.DOTALL)
    if count > 0:
        with open(index_html_path, "w", encoding="utf-8") as f:
            f.write(new_html)
        print(f"Successfully regex-updated index.html (matches: {count})")
    else:
        print("Error: Could not find script markers in index.html!")
