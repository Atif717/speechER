import os
import pandas as pd
import torchaudio

# Base dataset folder and output metadata
base_dir = "data_finetune"
metadata_csv = "metadata.csv"
target_sr = 16000  # standard sampling rate
trim_seconds = 2   # seconds to trim from start

metadata = []

for label in os.listdir(base_dir):
    class_dir = os.path.join(base_dir, label)
    if not os.path.isdir(class_dir):
        continue

    for fname in os.listdir(class_dir):
        if not fname.endswith(".wav"):
            continue

        path = os.path.join(class_dir, fname)

        try:
            waveform, sr = torchaudio.load(path)

            # Skip too-short files
            if waveform.shape[1] < sr * trim_seconds:
                print(f"⚠️ Skipping short file (<2s): {path}")
                continue

            # Trim first N seconds
            start_frame = int(sr * trim_seconds)
            waveform = waveform[:, start_frame:]

            # Resample to 16kHz if needed
            if sr != target_sr:
                resample = torchaudio.transforms.Resample(orig_freq=sr, new_freq=target_sr)
                waveform = resample(waveform)
                sr = target_sr

            # Overwrite with trimmed + resampled version
            torchaudio.save(path, waveform, sr)

            # Save path and label
            metadata.append({
                "path": path,
                "label": label
            })

        except Exception as e:
            print(f"❌ Error processing {path}: {e}")

# Save metadata to CSV
df = pd.DataFrame(metadata)
df.to_csv(metadata_csv, index=False)
print(f"\n✅ Finished. Saved metadata for {len(df)} files to {metadata_csv}")

