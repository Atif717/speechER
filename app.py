from flask import Flask, request
import os
from flask_cors import CORS


app = Flask(__name__)
from flask_cors import CORS
CORS(app)

UPLOAD_DIR = 'received_audio'
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.route('/receive_audio', methods=['POST'])
def receive_audio():
    if 'file' not in request.files:
        return "No file part", 400
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400

    filepath = os.path.join(UPLOAD_DIR, file.filename)
    file.save(filepath)
    print(f"✅ Received: {file.filename}")
    return "File received", 200
# In your Flask app
import threading
from ser_predictor import AudioEmotionMonitor

def start_emotion_monitoring():
    monitor = AudioEmotionMonitor(
        watch_directory="received_audio",
        results_callback=handle_emotion_result
    )
    monitor.start_monitoring()

def handle_emotion_result(result):
    # Process the emotion result in your Flask app
    # Update database, emit Socket.IO events, etc.
    pass

# Start monitoring in a separate thread
emotion_thread = threading.Thread(target=start_emotion_monitoring)
emotion_thread.daemon = True
emotion_thread.start()

if __name__ == '__main__':
    app.run(debug=True)
