import re

with open('frontend/js/pages/projects.js', 'r', encoding='utf-8') as f:
    text = f.read()

# remove strings and comments
clean = re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`|//.*|/\*[\s\S]*?\*/', '', text)
stack = []
for idx, ch in enumerate(clean):
    if ch in '({[':
        line = text[:idx].count('\n') + 1
        stack.append((ch, line))
    elif ch in ')}]':
        if not stack:
            line = text[:idx].count('\n') + 1
            print(f"Extra closing {ch} at line {line}")
        else:
            top, line = stack.pop()

if stack:
    print("Unclosed brackets:")
    for ch, line in stack:
        print(f"  {ch} at line {line}")
else:
    print("All brackets match!")

