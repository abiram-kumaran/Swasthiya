import os
import re

directory = '/Users/abiram.kumaran/Downloads/Google/Swasthiya'

# Ordered by length to avoid partial replacements
replacements = [
    ('CareGrid AI', 'Swasthiya Setu'),
    ('CareGridAI', 'SwasthiyaSetu'),
    ('CareGrid', 'Swasthiya Setu'),
    ('caregrid-ai', 'swasthiya-setu'),
    ('caregridai', 'swasthiyasetu'),
    ('caregrid-mobile', 'swasthiya-setu-mobile'),
    ('caregrid', 'swasthiyasetu')
]

for root, dirs, files in os.walk(directory):
    # Exclude directories
    dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '.expo', 'dist', 'build', '.vscode')]

    for file in files:
        if file.endswith(('.ts', '.tsx', '.json', '.md', '.html', '.yaml', '.yml', '.js', '.jsx')):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in replacements:
                    new_content = new_content.replace(old, new)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
