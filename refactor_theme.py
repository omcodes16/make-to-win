
import os
import re

directory = "src"

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements
    # text-white -> text-theme-primary
    content = re.sub(r"\btext-white\b", "text-theme-primary", content)
    # text-slate-200, text-slate-300, text-slate-400 -> text-theme-muted
    content = re.sub(r"\btext-slate-[234]00\b", "text-theme-muted", content)
    # text-gray-200, text-gray-300, text-gray-400 -> text-theme-muted
    content = re.sub(r"\btext-gray-[234]00\b", "text-theme-muted", content)
    
    # border-white/5, border-white/10, border-white/20 -> border-theme-border
    content = re.sub(r"\bborder-white/(?:5|10|20)\b", "border-theme-border", content)
    
    # bg-surface-* classes will adapt via tailwind.config.js CSS variables, 
    # but let us handle bg-white/5 -> bg-theme-border 
    content = re.sub(r"\bbg-white/(?:5|10)\b", "bg-theme-border", content)

    # Some hardcoded text colors in AlertsScreen etc.
    content = re.sub(r"\btext-text-muted\b", "text-theme-muted", content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith((".jsx", ".js", ".tsx", ".ts")):
            process_file(os.path.join(root, file))

print("Refactoring complete.")
