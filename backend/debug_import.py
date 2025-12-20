import sys
import traceback

try:
    from app.main import app
    print("App imported successfully")
except Exception:
    traceback.print_exc()
