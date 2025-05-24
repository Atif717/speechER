import os
import time
import requests
import sqlite3

WATCH_DIR = "/tmp/chunks"
FLASK_URL = "http://localhost:5000/receive_audio"
DB_PATH = "sent_chunks.db"

# Ensure the database and table exists
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sent_files (
                filename TEXT PRIMARY KEY
            );
        """)

# Check if the file has already been sent
def is_already_sent(filename):
    with sqlite3.connect(DB_PATH) as conn:
        result = conn.execute("SELECT 1 FROM sent_files WHERE filename = ?", (filename,)).fetchone()
        return result is not None

# Mark file as sent
def mark_as_sent(filename):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("INSERT OR IGNORE INTO sent_files (filename) VALUES (?)", (filename,))
        conn.commit()

def post_chunk(filepath):
    filename = os.path.basename(filepath)
    if not filename.endswith(".wav") or is_already_sent(filename):
        return

    parts = filename.replace(".wav", "").split("_")
    caller = parts[0] if len(parts) > 0 else "unknown"
    timestamp = parts[1] if len(parts) > 1 else "unknown"

    try:
        print(f"📤 Sending {filename}...")
        with open(filepath, 'rb') as f:
            r = requests.post(FLASK_URL, files={"audio": f}, data={"caller": caller, "timestamp": timestamp})
            if r.status_code == 200:
                print(f"✅ Sent {filename}")
                mark_as_sent(filename)
            else:
                print(f"❌ Failed {filename} → {r.status_code}")
    except Exception as e:
        print(f"🔥 Error sending {filename}: {e}")

def watch_and_send():
    init_db()
    print("🚀 Watching for new audio chunks...")
    while True:
        for file in os.listdir(WATCH_DIR):
            fullpath = os.path.join(WATCH_DIR, file)
            if os.path.isfile(fullpath):
                post_chunk(fullpath)
        time.sleep(2)  # near real-time

if __name__ == "__main__":
    watch_and_send()
