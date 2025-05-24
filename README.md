🎙 Speech Emotion Recognition Using Live Call Recording

In emergency response systems, understanding the emotional state of a caller—such as stress, panic, or anger—can drastically improve the accuracy and efficiency of the response. This project focuses on analyzing live call recordings to detect emotions in real time, enhancing communication, prioritizing urgent situations, and reducing false alerts.

🎯 Vision & Mission
Vision:
To create a real-time voice emotion detection system integrated with live call handling software.

Mission:
To recognize emotions such as Happy, Sad, Angry, and Neutral during a call using AI-powered speech processing, thereby enhancing human-computer interaction in telephony systems.

📞 Use Cases
This system can be deployed in the following scenarios:

🚨 Emergency response systems (e.g., 112 / 911)

📞 Call centers for real-time customer support analysis

🧠 Mental health helplines for emotional monitoring

🕵 Law enforcement communications for behavior analysis


🧰 Frameworks & Technologies Used
Frontend: React.js

Backend: Flask (Python)

ML Model: Facebook's Wav2Vec2 (fine-tuned for emotion classification)

Telephony Integration:

Asterisk PBX (call routing and handling)

Zoiper (softphone for simulating live calls and capturing audio)

Audio Processing: librosa, transformers, pydub
