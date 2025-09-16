document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const generateBtn = document.getElementById('generate_btn');
    const audioUploadInput = document.getElementById('audio_upload');
    const textInput = document.getElementById('text_input');
    const languageSelect = document.getElementById('language_select');
    const statusArea = document.getElementById('status_area');
    const recorderUI = document.getElementById('recorder_ui');
    const uploadArea = document.getElementById('upload_area');
    const themeToggleBtn = document.getElementById('theme_toggle');
    const sunIcon = document.getElementById('sun_icon');
    const moonIcon = document.getElementById('moon_icon');
    
    // --- State Variables ---
    let mediaRecorder, streamReference, recordedAudioBlob, recordingTimer, recordingSeconds = 0;

    // --- Dark Theme Logic ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);


    // --- Language Options ---
    const languages = ["English","Spanish","French","German","Italian","Portuguese","Polish","Turkish","Russian","Dutch","Czech","Arabic","Chinese (Simplified)","Japanese","Hungarian","Korean","Hindi"];
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        languageSelect.appendChild(option);
    });
    languageSelect.value = "English";

    // --- UI Rendering Functions ---
    function renderRecorderUI(state) {
        if (state === 'recording') {
            recorderUI.innerHTML = `
                <button id="record_btn" class="red">
                    <span class="pulse" style="width: 12px; height: 12px; background-color: white; border-radius: 50%;"></span>
                    Stop Recording
                </button>
                <p id="timer">00:00</p>`;
            document.getElementById('record_btn').onclick = stopRecording;
        } else if (state === 'finished') {
            if (!recordedAudioBlob || recordedAudioBlob.size === 0) {
                recorderUI.innerHTML = `<p style="color: var(--accent-red); text-align: center; font-size: 0.9rem;">Recording failed. No audio captured.</p>`;
                return;
            }
            const audioUrl = URL.createObjectURL(recordedAudioBlob);
            recorderUI.innerHTML = `
                <p style="font-weight: 500; margin-bottom: 0.5rem;">Your Recording:</p>
                <audio controls src="${audioUrl}"></audio>
                <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 0.75rem;">
                    <button id="clear_btn" style="background: none; color: var(--accent-red); padding: 0;">Record Again</button>
                    <button id="download_btn" style="background: none; color: var(--primary-color); padding: 0;">Download</button>
                </div>`;
            document.getElementById('clear_btn').onclick = resetRecorder;
            document.getElementById('download_btn').onclick = downloadRecording;
        } else { // Initial state
            recorderUI.innerHTML = `
                <button id="record_btn" class="green">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style="width: 20px; height: 20px;">
                        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                        <path fill-rule="evenodd" d="M5.5 8.5A2.5 2.5 0 018 6v4a2.5 2.5 0 01-5 0V8.5zM8 16a6 6 0 006-6v-1.5a.5.5 0 00-1 0V10a5 5 0 01-10 0V8.5a.5.5 0 00-1 0V10a6 6 0 006 6z" clip-rule="evenodd" />
                    </svg>
                    Record from Microphone
                </button>`;
            document.getElementById('record_btn').onclick = startRecording;
        }
    }

    // --- Media Recorder Logic ---
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamReference = stream;
            let chunks = [];
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
            mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                recordedAudioBlob = chunks.length > 0 ? new Blob(chunks, { type: mimeType }) : null;
                chunks = [];
                renderRecorderUI('finished');
            };

            mediaRecorder.start();
            renderRecorderUI('recording');
            uploadArea.style.opacity = '0.5';
            uploadArea.style.pointerEvents = 'none';

            recordingSeconds = 0;
            const timerEl = document.getElementById('timer');
            timerEl.textContent = '00:00';
            recordingTimer = setInterval(() => {
                recordingSeconds++;
                const m = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
                const s = String(recordingSeconds % 60).padStart(2, '0');
                timerEl.textContent = `${m}:${s}`;
            }, 1000);
        } catch (err) {
            recorderUI.innerHTML += `<p style="color: var(--accent-red); text-align: center; font-size: 0.9rem;">Microphone access denied.</p>`;
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            streamReference?.getTracks().forEach(track => track.stop());
            clearInterval(recordingTimer);
            streamReference = null;
        }
    }

    function resetRecorder() {
        streamReference?.getTracks().forEach(track => track.stop());
        streamReference = null;
        recordedAudioBlob = null;
        uploadArea.style.opacity = '1';
        uploadArea.style.pointerEvents = 'auto';
        renderRecorderUI('initial');
    }

    function downloadRecording() {
        if (recordedAudioBlob) {
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style.display = 'none';
            const url = URL.createObjectURL(recordedAudioBlob);
            a.href = url;
            a.download = 'timbre_recording.webm';
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    }

    // --- UI Interaction Logic ---
    audioUploadInput.addEventListener('change', () => {
        if (audioUploadInput.files.length > 0) {
            recorderUI.style.opacity = '0.5';
            recorderUI.style.pointerEvents = 'none';
        } else {
            recorderUI.style.opacity = '1';
            recorderUI.style.pointerEvents = 'auto';
        }
    });

    generateBtn.addEventListener('click', async () => {
        let audioBlob = audioUploadInput.files[0] || recordedAudioBlob;
        if (!audioBlob) return showError('Please upload or record an audio file first.');

        const text = textInput.value;
        if (!text.trim()) return showError('Please enter some text to synthesize.');

        const formData = new FormData();
        formData.append('reference_audio', audioBlob, 'reference.audio');
        formData.append('text', text);
        formData.append('language', languageSelect.value);

        showLoading();
        try {
            // Replace '/clone' with your actual API endpoint
            const response = await fetch('/clone', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'An unknown error occurred.');
            showSuccess(result.audio_url);
        } catch (e) {
            showError(e.message);
        }
    });

    // --- Status Display Functions ---
    function showLoading() {
        statusArea.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
                <div class="spinner"></div>
                <p>Generating voice... This may take a moment.</p>
            </div>`;
    }

    function showError(msg) {
        statusArea.innerHTML = `
            <div class="alert alert-error">
                <p class="alert-title">Error</p>
                <p>${msg}</p>
            </div>`;
    }

    function showSuccess(url) {
        statusArea.innerHTML = `
            <div class="alert alert-success">
                <p class="alert-title">Success!</p>
                <p>Your cloned voice is ready.</p>
            </div>
            <audio controls preload="auto" src="${url}"></audio>`;
    }
    
    // --- Initial Render ---
    renderRecorderUI('initial');
});