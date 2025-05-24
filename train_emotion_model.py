import torch
import torchaudio
from transformers import (
    Wav2Vec2ForSequenceClassification, 
    Wav2Vec2FeatureExtractor,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)
from datasets import load_from_disk, Dataset
import numpy as np
from sklearn.metrics import accuracy_score, f1_score
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_pretrained_models():
    """Test different pre-trained emotion models on your data"""
    
    pretrained_models = [
        "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition",
        "harshit345/xlsr-wav2vec-speech-emotion-recognition",
        "m3hrdadfi/wav2vec2-xlsr-persian-speech-emotion-recognition"  # Try cross-lingual
    ]
    
    # Load your dataset
    dataset = load_from_disk("ser_dataset")
    test_samples = list(dataset["test"])[:20]  # Test on 20 samples first
    
    for model_name in pretrained_models:
        try:
            logger.info(f"\nTesting {model_name}...")
            
            # Load model
            model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
            extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
            
            correct = 0
            total = 0
            
            for sample in test_samples:
                try:
                    # Load and preprocess audio
                    audio, sr = torchaudio.load(sample["path"])
                    if sr != 16000:
                        audio = torchaudio.transforms.Resample(sr, 16000)(audio)
                    
                    inputs = extractor(
                        audio.squeeze().numpy(), 
                        sampling_rate=16000, 
                        return_tensors="pt"
                    )
                    
                    # Predict
                    with torch.no_grad():
                        outputs = model(**inputs)
                        predicted_id = torch.argmax(outputs.logits, dim=-1).item()
                        predicted_emotion = model.config.id2label[predicted_id]
                    
                    # Check if prediction matches (approximate matching)
                    actual_emotion = sample["label"].lower()
                    predicted_emotion = predicted_emotion.lower()
                    
                    # Simple matching (you may need to adjust this)
                    if any(word in predicted_emotion for word in actual_emotion.split()) or \
                       any(word in actual_emotion for word in predicted_emotion.split()):
                        correct += 1
                    
                    total += 1
                    
                    logger.info(f"Actual: {actual_emotion}, Predicted: {predicted_emotion}")
                    
                except Exception as e:
                    logger.warning(f"Failed to process sample: {e}")
            
            accuracy = correct / total if total > 0 else 0
            logger.info(f"Approximate accuracy for {model_name}: {accuracy:.2f}")
            
        except Exception as e:
            logger.error(f"Failed to load {model_name}: {e}")

def fine_tune_pretrained_model():
    """Fine-tune a pre-trained emotion model on your data"""
    
    # Choose best model from testing phase
    model_name = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
    
    # Load your dataset
    dataset = load_from_disk("ser_dataset")
    
    # Combine train and test for small dataset
    all_data = list(dataset["train"]) + list(dataset["test"])
    
    # Your label mapping
    unique_labels = sorted(set(item["label"] for item in all_data))
    label2id = {label: i for i, label in enumerate(unique_labels)}
    id2label = {i: label for label, i in label2id.items()}
    
    logger.info(f"Your labels: {unique_labels}")
    
    # Load pre-trained model
    try:
        pretrained_model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
        extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
        
        # Get pretrained model's labels for reference
        pretrained_labels = list(pretrained_model.config.label2id.keys())
        logger.info(f"Pre-trained model labels: {pretrained_labels}")
        
    except Exception as e:
        logger.error(f"Could not load pre-trained model: {e}")
        return
    
    # Create new model with your labels
    model = Wav2Vec2ForSequenceClassification.from_pretrained(
        "facebook/wav2vec2-large-xlsr-53",  # Use base model
        num_labels=len(unique_labels),
        label2id=label2id,
        id2label=id2label,
        ignore_mismatched_sizes=True
    )
    
    # Transfer weights from pretrained model (if possible)
    try:
        # Copy wav2vec2 backbone weights
        model.wav2vec2.load_state_dict(
            pretrained_model.wav2vec2.state_dict(), 
            strict=False
        )
        logger.info("Transferred pre-trained weights successfully")
    except Exception as e:
        logger.warning(f"Could not transfer weights: {e}")
    
    # Preprocessing function
    def preprocess(batch):
        try:
            audio, sr = torchaudio.load(batch["path"])
            if sr != 16000:
                audio = torchaudio.transforms.Resample(sr, 16000)(audio)
        
            if audio.shape[0] > 1:
                audio = audio[0:1, :]
        
            inputs = extractor(
                audio.squeeze().numpy(),
                sampling_rate=16000,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=64000 
            )
        
            batch["input_values"] = inputs.input_values.squeeze().numpy()
            batch["label"] = label2id[batch["label"]]
            return batch
        except Exception as e:
            logger.warning(f"Skipping file {batch.get('path')} due to error: {e}")
            return {"skip": True}
 

    
    # Create dataset
    full_dataset = Dataset.from_list(all_data)
    full_dataset = full_dataset.map(preprocess)
    full_dataset = full_dataset.filter(lambda x: "skip" not in x)

    
    # Split dataset
    split_dataset = full_dataset.train_test_split(test_size=0.2, seed=42)
    
    logger.info(f"Total dataset size: {len(full_dataset)}")
    logger.info(f"Train size: {len(split_dataset['train'])}")
    logger.info(f"Test size: {len(split_dataset['test'])}")

    # Freeze most layers - only fine-tune classifier and last few layers
    for param in model.wav2vec2.feature_extractor.parameters():
        param.requires_grad = False
    
    for layer in model.wav2vec2.encoder.layers[:-3]:  # Freeze all but last 3 layers
        for param in layer.parameters():
            param.requires_grad = False
    
    # Training arguments - very conservative for small dataset
    training_args = TrainingArguments(
        output_dir="./fine_tuned_emotion_model",
        eval_strategy="steps",
        eval_steps=25,
        save_strategy="steps",
        save_steps=25,
        per_device_train_batch_size=2,  # Very small batch
        per_device_eval_batch_size=2,
        learning_rate=5e-6,  # Very low learning rate
        num_train_epochs=20,
        weight_decay=0.1,
        warmup_steps=50,
        logging_steps=10,
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        dataloader_drop_last=False,
        fp16=torch.cuda.is_available(),
        seed=42,
        report_to=None
    )
    
    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        acc = accuracy_score(labels, preds)
        f1 = f1_score(labels, preds, average="weighted", zero_division=0)
        return {"accuracy": acc, "f1": f1}
    
    def data_collator(features):
        features = [f for f in features if "input_values" in f] 
        batch = {}
        max_len = max(len(f["input_values"]) for f in features)
        input_values = []
        labels = []
        
        for f in features:
            input_val = f["input_values"]
            padded = np.pad(input_val, (0, max_len - len(input_val)), mode='constant')
            input_values.append(padded)
            labels.append(f["label"])
        
        batch["input_values"] = torch.tensor(input_values, dtype=torch.float32)
        batch["labels"] = torch.tensor(labels, dtype=torch.long)
        return batch
    
    # Early stopping
    early_stopping = EarlyStoppingCallback(
        early_stopping_patience=5,
        early_stopping_threshold=0.001
    )
    
    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=split_dataset["train"],
        eval_dataset=split_dataset["test"],
        data_collator=data_collator,
        compute_metrics=compute_metrics,
        callbacks=[early_stopping]
    )
    
    # Train
    logger.info("Starting fine-tuning...")
    trainer.train()
    
    # Evaluate
    eval_results = trainer.evaluate()
    logger.info(f"Final results: {eval_results}")
    
    # Save model
    model.save_pretrained("./fine_tuned_emotion_model")
    extractor.save_pretrained("./fine_tuned_emotion_model")

    import json
    with open("./fine_tuned_emotion_model/label_mappings.json", "w") as f:
        json.dump({"label2id": label2id, "id2label": id2label}, f)
    
    logger.info("Fine-tuning completed!")

if __name__ == "__main__":
    logger.info("=== STEP 1: Testing Pre-trained Models ===")
    test_pretrained_models()
    
    logger.info("\n=== STEP 2: Fine-tuning Best Pre-trained Model ===")
    fine_tune_pretrained_model()