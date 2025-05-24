# predict_on_new_audio.py
import os
import time
import torch
import torchaudio
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2Processor

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load model and processor
model = Wav2Vec2ForSequenceClassification.from_pretrained("ser-model").to(device)
processor = Wav2Vec2Processor.from_pretrained("ser-model")

# Emotion label mapping
id2label = {
    0: "neutral",
    1: "calm",
    2: "happy",
    3: "sad",
    4: "angry",
    5: "fearful",
    6: "disgust",
    7: "surprised"
}

# Function to predict emotion from file
def predict_emotion(audio_path):
    waveform, sample_rate = torchaudio.load(audio_path)

    if sample_rate != 16000:
        resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=16000)
        waveform = resampler(waveform)

    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0).unsqueeze(0)

    inputs = processor(waveform.squeeze().numpy(), sampling_rate=16000, return_tensors="pt", padding=True)
    input_values = inputs.input_values.to(device)

    with torch.no_grad():
        logits = model(input_values).logits
        predicted_id = torch.argmax(logits, dim=-1).item()

    return id2label[predicted_id]

# Watch received_audio directory
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
            if not is_file_ready(fpath):
                continue

            try:
                emotion = predict_emotion(fpath)
                print(f"🎧 File: {fname} → Emotion: {emotion}")
                PROCESSED.add(fname)
            except Exception as e:
                print(f"❌ Error processing {fname}: {e}")

    time.sleep(3)
