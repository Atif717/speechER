import os
import time
from ser_predictor import predict_emotion

AUDIO_DIR = "received_audio"
PROCESSED = set()

def is_file_ready(filepath):
    size = os.path.getsize(filepath)
    time.sleep(2)
    return os.path.getsize(filepath) == size

while True:
    for fname in os.listdir(AUDIO_DIR):
        if fname.endswith(".wav") and fname not in PROCESSED:
            fpath = os.path.join(AUDIO_DIR, fname)
            if not os.path.isfile(fpath) or not is_file_ready(fpath):
                continue

            try:
                emotion = predict_emotion(fpath)
                print(f"🎧 {fname} → Emotion: {emotion}")
                PROCESSED.add(fname)
            except Exception as e:
                print(f"❌ Error in {fname}: {e}")

    time.sleep(3)
