import requests  
import torch
import torchaudio
import os
import time
import json
from datetime import datetime
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor

class AudioEmotionRecognizer:
    def __init__(self, model_name="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"):
        """Initialize the emotion recognition model"""
        print("🔄 Loading emotion recognition model...")
        self.model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
        self.model.eval()
        print("✅ Model loaded successfully!")
        
        # Supported audio formats
        self.supported_formats = {'.wav', '.mp3', '.flac', '.m4a', '.ogg', '.wma'}
    
    def preprocess_waveform(self, audio_path):
        """Preprocess audio waveform for emotion recognition"""
        try:
            waveform, sr = torchaudio.load(audio_path)
            
            # Resample to 16kHz
            if sr != 16000:
                waveform = torchaudio.transforms.Resample(orig_freq=sr, new_freq=16000)(waveform)
            
            # Convert to mono
            if waveform.shape[0] > 1:
                waveform = waveform.mean(dim=0).unsqueeze(0)
            
            # Normalize volume
            max_val = waveform.abs().max()
            if max_val > 0:
                waveform = waveform / max_val
            
            # Check for very short clips
            if waveform.shape[1] < 16000:
                print(f"⚠️ Audio too short (<1 sec): {audio_path}")
                return None
            
            return waveform
            
        except Exception as e:
            print(f"❌ Error processing {audio_path}: {str(e)}")
            return None
    
    def predict_emotion_top3(self, audio_path):
        """Predict top 3 emotions with probabilities"""
        waveform = self.preprocess_waveform(audio_path)
        if waveform is None:
            return None
        
        try:
            inputs = self.feature_extractor(
                waveform.squeeze().numpy(),
                sampling_rate=16000,
                return_tensors="pt",
                padding=True
            )
            
            with torch.no_grad():
                logits = self.model(**inputs).logits
                probs = torch.nn.functional.softmax(logits, dim=1)
                topk = torch.topk(probs, k=3)
            
            # Prepare results
            results = []
            for i in range(3):
                label = self.model.config.id2label[topk.indices[0][i].item()]
                confidence = topk.values[0][i].item()
                results.append({
                    'emotion': label,
                    'confidence': round(confidence, 4),
                    'percentage': round(confidence * 100, 2)
                })
            
            return {
                'file_path': str(audio_path),
                'timestamp': datetime.now().isoformat(),
                'predictions': results,
                'top_emotion': results[0]['emotion']
            }
            
        except Exception as e:
            print(f"❌ Error predicting emotion for {audio_path}: {str(e)}")
            return None

class AudioFileHandler(FileSystemEventHandler):
    def __init__(self, recognizer, results_callback=None, results_file=None):
        """Initialize file handler"""
        self.recognizer = recognizer
        self.results_callback = results_callback
        self.results_file = results_file
        self.processed_files = set()
    
    def on_created(self, event):
        """Handle new file creation"""
        if not os.path.isdir(event.src_path):
            self.process_audio_file(event.src_path)
    
    def on_moved(self, event):
        """Handle file moves (uploads often trigger this)"""
        if not os.path.isdir(event.dest_path):
            self.process_audio_file(event.dest_path)
    
    def process_audio_file(self, file_path):
        """Process a new audio file"""
        file_path = Path(file_path)
        
        # Check if it's an audio file and hasn't been processed
        if (file_path.suffix.lower() in self.recognizer.supported_formats and 
            str(file_path) not in self.processed_files):
            
            print(f"🎵 New audio file detected: {file_path.name}")
            
            # Wait a moment for file to be fully written
            time.sleep(0.5)
            
            # Process the audio
            result = self.recognizer.predict_emotion_top3(file_path)
            
            if result:
                self.processed_files.add(str(file_path))
                
                # Print results
                print(f"\n🎭 Emotion Analysis for: {file_path.name}")
                print("-" * 50)
                for i, pred in enumerate(result['predictions'], 1):
                    print(f"{i}. {pred['emotion']}: {pred['percentage']:.2f}%")
                print(f"📊 Top Emotion: {result['top_emotion']}")
                print("-" * 50)
                
                # Save results to file if specified
                if self.results_file:
                    self.save_results(result)
                
                # Call callback function if provided
                if self.results_callback:
                    self.results_callback(result)
    
    def save_results(self, result):
        """Save results to JSON file"""
        try:
            # Load existing results
            if os.path.exists(self.results_file):
                with open(self.results_file, 'r') as f:
                    all_results = json.load(f)
            else:
                all_results = []
            
            # Add new result
            all_results.append(result)
            
            # Save updated results
            with open(self.results_file, 'w') as f:
                json.dump(all_results, f, indent=2)
                
        except Exception as e:
            print(f"❌ Error saving results: {str(e)}")

class AudioEmotionMonitor:
    def __init__(self, watch_directory="received_audio", results_file="emotion_results.json", 
                 results_callback=None):
        """Initialize the audio emotion monitoring system"""
        self.watch_directory = Path(watch_directory)
        self.results_file = results_file
        self.results_callback = results_callback
        
        # Create directory if it doesn't exist
        self.watch_directory.mkdir(exist_ok=True)
        
        # Initialize recognizer
        self.recognizer = AudioEmotionRecognizer()
        
        # Setup file handler
        self.file_handler = AudioFileHandler(
            self.recognizer, 
            results_callback=self.results_callback,
            results_file=self.results_file
        )
        
        # Setup observer
        self.observer = Observer()
        self.observer.schedule(
            self.file_handler, 
            str(self.watch_directory), 
            recursive=True
        )
    
    def start_monitoring(self):
        """Start monitoring the directory"""
        print(f"🔍 Starting to monitor: {self.watch_directory.absolute()}")
        print(f"💾 Results will be saved to: {self.results_file}")
        print("Press Ctrl+C to stop monitoring...\n")
        
        self.observer.start()
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Stopping monitor...")
            self.observer.stop()
        
        self.observer.join()
        print("✅ Monitor stopped")
    
    def process_existing_files(self):
        """Process any existing files in the directory"""
        print("🔍 Checking for existing audio files...")
        
        for file_path in self.watch_directory.rglob("*"):
            if (file_path.is_file() and 
                file_path.suffix.lower() in self.recognizer.supported_formats):
                self.file_handler.process_audio_file(file_path)

# Example usage and Flask integration functions
import requests  # Add this at the top of the file

import requests
import json
from pathlib import Path

def flask_callback(result):
    """Send result to Express.js backend"""
    print(f"🔄 Flask callback triggered for: {result['top_emotion']}")

    file_path = Path(result['file_path'])
    file_name = file_path.name

    # Expected filename: callerNumber_timestamp.wav
    parts = file_name.split('_')
    customer_name = parts[0] if len(parts) > 0 else "unknown"
    user_id = "system"  # or "unknown" since agent ID is not available anymore

    payload = {
        "file_name": file_name,
        "top_emotion": result['top_emotion'],
        "timestamp": result['timestamp'],
        "predictions": result['predictions'],
        "customer_name": customer_name,
        "user_id": user_id
    }

    try:
        response = requests.post(
            "http://localhost:3000/api/receive-prediction",
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout=10
        )

        if response.status_code == 200:
            print(f"✅ Successfully sent emotion data to Express backend")
            print(f"📋 Response: {response.json()}")
        else:
            print(f"⚠️ Express backend responded with status: {response.status_code}")
            print(f"📋 Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Failed to connect to Express backend. Is it running on port 3000?")
    except requests.exceptions.Timeout:
        print("❌ Request to Express backend timed out")
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")


def run_emotion_monitor():
    """Main function to run the emotion monitor"""
    # Initialize monitor with Flask callback
    monitor = AudioEmotionMonitor(
        watch_directory="received_audio",
        results_file="emotion_results.json",
        results_callback=flask_callback
    )
    
    # Process any existing files first
    monitor.process_existing_files()
    
    # Start monitoring for new files
    monitor.start_monitoring()

if __name__ == "__main__":
    # Install required packages first:
    # pip install torch torchaudio transformers watchdog
    
    run_emotion_monitor()