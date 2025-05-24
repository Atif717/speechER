from ser_predictor import predict_emotion
from ser_sec import predict_emotion_mix

audio_path = "received_audio/your_test_file.wav"  # change this as needed

print("\n📢 Comparing Models for:", audio_path)

print("\n🔷 Old Model Prediction:")
old_pred = predict_emotion(audio_path)
print(f"➡️ {old_pred}")

print("\n🔶 New Mix Model Prediction:")
new_pred = predict_emotion_mix(audio_path)
print(f"➡️ {new_pred}")
