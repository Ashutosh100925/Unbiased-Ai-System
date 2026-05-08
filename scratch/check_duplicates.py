import ast

with open('main.py', 'r') as f:
    tree = ast.parse(f.read())

func_names = []
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        func_names.append(node.name)

duplicates = [name for name in set(func_names) if func_names.count(name) > 1]
print(f"Duplicate functions: {duplicates}")
