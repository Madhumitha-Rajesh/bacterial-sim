import sys
import os
import subprocess

print("=" * 60)
print("1. Python executable being used:")
print(sys.executable)

print("\n2. Current working directory:")
print(os.getcwd())

print("\n3. Files in this folder:")
print(os.listdir('.'))

print("\n4. Does .env exist?")
env_path = os.path.join(os.getcwd(), '.env')
print(env_path, "->", os.path.exists(env_path))

print("\n5. Raw content of .env (password masked):")
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        for line in f:
            line = line.rstrip('\n')
            if 'MONGODB_URI' in line and '@' in line:
                # mask the password portion only
                before_at = line.split('@')[0]
                masked = before_at.split(':')
                masked[-1] = '****'
                print(':'.join(masked) + '@' + line.split('@', 1)[1])
            else:
                print(line)
else:
    print("(file does not exist)")

print("\n6. Installed packages (checking for dotenv, pymongo, flask):")
result = subprocess.run([sys.executable, '-m', 'pip', 'list'], capture_output=True, text=True)
for line in result.stdout.splitlines():
    if any(pkg in line.lower() for pkg in ['dotenv', 'pymongo', 'flask']):
        print(" ", line)

print("\n7. Manually loading .env with explicit path:")
try:
    from dotenv import load_dotenv
    loaded = load_dotenv(dotenv_path=env_path)
    print("load_dotenv() returned:", loaded)
except Exception as e:
    print("ERROR importing/running dotenv:", e)

print("\n8. Value of MONGODB_URI after loading:")
uri = os.environ.get("MONGODB_URI", "")
print("Empty?" , uri == "")
if uri:
    print("Starts with:", uri[:20], "...")

print("\n9. Importing db.py directly:")
try:
    import db
    print("db.MONGODB_URI is empty?", db.MONGODB_URI == "")
except Exception as e:
    print("ERROR importing db.py:", e)

print("=" * 60)