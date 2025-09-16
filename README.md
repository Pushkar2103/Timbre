# TIMBRE - High-Fidelity Voice Cloning

**TIMBRE** is a web-based application that uses the powerful **XTTS-v2 model** from **Coqui AI** to perform high-fidelity voice cloning.  
Users can provide a short audio sample, and the application will synthesize any given text in that voice across multiple languages.  
The entire application is containerized with Docker for easy setup and consistent performance.

---

## ✨ Features
- **High-Quality Voice Cloning**: Leverages the state-of-the-art **XTTS-v2 model**.  
- **Multi-Language Support**: Synthesizes speech in **17 different languages**.  
- **Dual Audio Input**: Supports both **file uploads (WAV, MP3, etc.)** and **direct microphone recording with playback**.  
- **Custom Web Interface**: A clean, user-friendly frontend built with **HTML, CSS, and JavaScript**, featuring a **dark mode toggle**.  
- **Dockerized Environment**: Ensures all dependencies are handled and the application runs anywhere **Docker** is installed.  
- **GPU Acceleration**: Automatically utilizes an **NVIDIA GPU** if available for significantly faster processing.  

---

## 📂 Project Structure
```
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── src
├── app.py # Flask backend server
├── static/ # CSS, JS, and image assets
│ ├── style.css
│ ├── script.js
│ └── image.png
└── templates/
└── index.html # Main HTML frontend
```

---

## ⚙️ Setup and Installation

###  Prerequisites
- Docker and Docker Compose  
- NVIDIA Container Toolkit (for GPU support)  
- An NVIDIA GPU (recommended for performance)  

###  Running the Application
Clone the repository:
```bash
git clone https://github.com/Pushkar2103/Timbre
cd Timbre
```
Build and run the container:
```bash
docker-compose up --build
```
⚠️ The first build will take several minutes to download the models and dependencies.

##  Access the Interface
👉 Open your web browser and go to: [http://localhost:8080](http://localhost:8080)

---

## 🖥️ How to Use
1. **Provide Reference Audio**  
   Upload an audio file or record a few seconds of your voice directly in the browser.  
   You can play back your recording before proceeding.  

2. **Enter Text**  
   Type the text you want to synthesize and select the corresponding language from the dropdown menu.  

3. **Generate**  
   Click the **"Generate Voice"** button and wait for the process to complete.  

4. **Listen**  
   The final cloned audio will appear in the player.  
