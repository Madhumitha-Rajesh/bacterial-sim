import os

print('1. Current folder:', os.getcwd())
print('2. .env exists here:', os.path.exists('.env'))
print('3. Files in this folder:', os.listdir('.'))

try:
    import dotenv
    print('4. python-dotenv installed: YES, version', dotenv.__version__)
except ImportError:
    print('4. python-dotenv installed: NO -- run: pip install python-dotenv')