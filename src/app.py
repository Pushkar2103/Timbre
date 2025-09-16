import os
import torch
import tempfile
import subprocess
from TTS.api import TTS
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from torch.serialization import add_safe_globals
from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import XttsAudioConfig, XttsArgs
from TTS.config.shared_configs import BaseDatasetConfig

# --- 1. Flask App Setup ---
app = Flask(__name__, template_folder='templates')
CORS(app) # Enable Cross-Origin Resource Sharing

# Create a directory to store generated audio files
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'output')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- 2. Global Model Setup ---
SUPPORTED_LANGUAGES = {
    "English": "en", "Spanish": "es", "French": "fr", "German": "de", "Italian": "it", 
    "Portuguese": "pt", "Polish": "pl", "Turkish": "tr", "Russian": "ru", "Dutch": "nl", 
    "Czech": "cs", "Arabic": "ar", "Chinese (Simplified)": "zh-cn", "Japanese": "ja", 
    "Hungarian": "hu", "Korean": "ko", "Hindi": "hi"
}
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# PyTorch Security Fix
add_safe_globals([XttsConfig, XttsAudioConfig, BaseDatasetConfig, XttsArgs])

# Load XTTSv2 model
print("Loading XTTS v2 model...")
model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
tts = TTS(model_name).to(device)
print("Model loaded successfully.")

# --- 3. Core Logic ---
def convert_to_wav(input_path):
    # This function is the same as before, converting any audio to the required format
    if not input_path:
        return None, None, "No input audio provided."
    
    temp_wav_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    temp_wav_path = temp_wav_file.name
    temp_wav_file.close()
    
    command = [
        "ffmpeg", "-i", input_path, "-ar", "24000", "-ac", "1", 
        "-c:a", "pcm_s16le", temp_wav_path, "-y", "-hide_banner", "-loglevel", "error"
    ]
    
    try:
        subprocess.run(command, check=True)
        return temp_wav_path, lambda: os.remove(temp_wav_path), None
    except subprocess.CalledProcessError as e:
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
        return None, None, f"Audio conversion failed. Error: {e}"

# --- 4. API Endpoints ---
@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')

@app.route('/output/<filename>')
def get_output_file(filename):
    """Serves the generated audio file."""
    return send_from_directory(OUTPUT_DIR, filename)

@app.route('/clone', methods=['POST'])
def clone_voice():
    """The main API endpoint for voice cloning."""
    if 'reference_audio' not in request.files:
        return jsonify({"error": "No audio file provided."}), 400
    if 'text' not in request.form or 'language' not in request.form:
        return jsonify({"error": "Missing text or language."}), 400

    ref_file = request.files['reference_audio']
    text = request.form['text']
    language_name = request.form['language']
    
    # Save the uploaded file temporarily
    temp_ref_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(ref_file.filename)[1])
    ref_file.save(temp_ref_file.name)
    temp_ref_path = temp_ref_file.name
    temp_ref_file.close()

    # Convert to required WAV format
    wav_path, cleanup_func, error = convert_to_wav(temp_ref_path)
    os.remove(temp_ref_path) # Clean up the original temp file

    if error:
        return jsonify({"error": error}), 500

    # Generate the new audio
    try:
        output_filename = f"{tempfile.gettempprefix()}_{os.urandom(8).hex()}.wav"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        language_code = SUPPORTED_LANGUAGES.get(language_name)
        if not language_code:
            return jsonify({"error": "Invalid language selected."}), 400

        print(f"Generating audio for text: '{text}' in language: '{language_code}'")
        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=wav_path,
            language=language_code
        )
        print("Audio generation successful.")
        
        # Return the URL to the generated file
        return jsonify({"audio_url": f"/output/{output_filename}"})

    except Exception as e:
        print(f"An error occurred during TTS generation: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cleanup_func:
            cleanup_func() # Clean up the converted WAV file

# --- 5. Run the Application ---
if __name__ == '__main__':
    # Running on 0.0.0.0 makes it accessible within the Docker container
    app.run(host='0.0.0.0', port=8080)

