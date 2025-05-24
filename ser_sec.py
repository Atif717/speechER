import torch
import torchaudio
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor

# New, more generalized model
model_name = "j-hartmann/emotion-english-wav2vec2"

model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)

model.eval()

def preprocess_waveform(audio_path):
    waveform, sr = torchaudio.load(audio_path)

    # Resample to 16kHz
    if sr != 16000:
        waveform = torchaudio.transforms.Resample(orig_freq=sr, new_freq=16000)(waveform)

    # Convert to mono
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0).unsqueeze(0)

    # Normalize
    waveform = waveform / waveform.abs().max()

    if waveform.shape[1] < 16000:
        print("⚠️ Audio too short (<1 sec)")
        return None

    return waveform

def predict_emotion_mix(audio_path):
    waveform = preprocess_waveform(audio_path)
    if waveform is None:
        return "unknown"

    inputs = feature_extractor(
        waveform.squeeze().numpy(),
        sampling_rate=16000,
        return_tensors="pt",
        padding=True
    )

    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.nn.functional.softmax(logits, dim=1)
        topk = torch.topk(probs, k=3)

    print("🧠 [Mix Model] Top Predictions:")
    for i in range(3):
        label = model.config.id2label[topk.indices[0][i].item()]
        score = topk.values[0][i].item()
        print(f"  {label}: {score:.4f}")

    predicted = torch.argmax(probs, dim=-1)
    return model.config.id2label[predicted.item()]
