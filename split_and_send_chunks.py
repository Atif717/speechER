import os
import time
import requests
import subprocess

WATCH_DIR = "/tmp/livecalls"
CHUNK_DIR = "/tmp/chunks"
SENT_DIR = "/tmp/sentchunks"
FLASK_URL = "http://localhost:5000/receive_audio"

os.makedirs(CHUNK_DIR, exist_ok=True)
os.makedirs(SENT_DIR, exist_ok=True)

def split_audio(file_path, filename):
    base_name = filename.replace(".wav", "")
    out_pattern = os.path.join(CHUNK_DIR, f"{base_name}_%03d.wav")
    command = [
        "ffmpeg", "-y", "-i", file_path,
        "-f", "segment", "-segment_time", "15", "-c", "copy", out_pattern
    ]
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to split {filename}")
        return False

def post_chunks():
    for chunk in os.listdir(CHUNK_DIR):
        if not chunk.endswith(".wav") or chunk.startswith("sent_"):
            continue
        chunk_path = os.path.join(CHUNK_DIR, chunk)
        
        # Extract caller and timestamp from chunk name
        base_name = chunk.replace(".wav", "")
        parts = base_name.split("_")
        if len(parts) < 3:
            print(f"⚠️ Skipping badly named file: {chunk}")
            continue
        timestamp = parts[0]
        uniqueid = parts[1]
        chunk_id = parts[2]
        caller = "1000"  # Default/fallback value, or parse from filename if needed

        print(f"📤 Sending {chunk}...")
        try:
            with open(chunk_path, "rb") as f:
                r = requests.post(
                    FLASK_URL,
                    files={"audio": f},
                    data={"caller": caller, "timestamp": timestamp}
                )
            if r.status_code == 200:
                print(f"✅ Sent {chunk}")
                os.rename(chunk_path, os.path.join(SENT_DIR, "sent_" + chunk))
            else:
                print(f"❌ Failed with status: {r.status_code}")
        except Exception as e:
            print(f"🔥 Error sending {chunk}: {e}")


def watch_and_process():
    processed = set()
    while True:
        for file in os.listdir(WATCH_DIR):
            if not file.endswith(".wav") or file in processed:
                continue
            file_path = os.path.join(WATCH_DIR, file)
            if split_audio(file_path, file):
                processed.add(file)
        post_chunks()
        time.sleep(5)

if __name__ == "__main__":
    watch_and_process()
