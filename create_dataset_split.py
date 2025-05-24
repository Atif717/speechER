import os
import pandas as pd
from datasets import Dataset, DatasetDict
from sklearn.model_selection import train_test_split

# Step 1: Load the metadata CSV
df = pd.read_csv("metadata.csv")

# Step 2: Split into 80% train / 20% test
train_df, test_df = train_test_split(df, test_size=0.2, stratify=df["label"], random_state=42)

# Step 3: Convert to Hugging Face DatasetDict format
train_dataset = Dataset.from_pandas(train_df.reset_index(drop=True))
test_dataset = Dataset.from_pandas(test_df.reset_index(drop=True))
dataset = DatasetDict({
    "train": train_dataset,
    "test": test_dataset
})

# Step 4: Save to disk for later use
dataset.save_to_disk("ser_dataset")
print("✅ Dataset split complete and saved to ./ser_dataset")
