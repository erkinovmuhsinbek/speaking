// --- Ma'lumotlarni boshqarish (LocalStorage) ---
const STORAGE_KEY = 'exam_submissions';

function getSubmissions() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveSubmission(submission) {
    const submissions = getSubmissions();
    submissions.push({
        id: Date.now(),
        ...submission,
        score: null,
        feedback: '',
        date: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

function updateSubmission(id, score, feedback) {
    const submissions = getSubmissions();
    const index = submissions.findIndex(s => s.id === id);
    if (index !== -1) {
        submissions[index].score = score;
        submissions[index].feedback = feedback;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    }
}

// --- Talaba sahifasi logikasi ---
if (document.getElementById('record-btn')) {
    const recordBtn = document.getElementById('record-btn');
    const micIcon = document.getElementById('mic-icon');
    const stopIcon = document.getElementById('stop-icon');
    const statusText = document.getElementById('status-text');
    const audioPreview = document.getElementById('audio-preview');
    const player = document.getElementById('player');
    const retryBtn = document.getElementById('retry-btn');
    const submitBtn = document.getElementById('submit-btn');
    const studentNameInput = document.getElementById('student-name');

    let mediaRecorder;
    let audioChunks = [];
    let audioBlob;
    let audioBase64;

    recordBtn.addEventListener('click', async () => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (e) => {
                    audioChunks.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        audioBase64 = reader.result;
                        player.src = audioBase64;
                        audioPreview.classList.remove('hidden');
                        recordBtn.classList.add('hidden');
                        statusText.innerText = "Yozuv tayyor";
                        checkSubmitStatus();
                    };
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                micIcon.classList.add('hidden');
                stopIcon.classList.remove('hidden');
                recordBtn.classList.add('bg-red-500', 'animate-pulse');
                statusText.innerText = "Yozib olinmoqda...";
            } catch (err) {
                alert("Mikrofonga ruxsat berilmadi!");
            }
        } else {
            mediaRecorder.stop();
            micIcon.classList.remove('hidden');
            stopIcon.classList.add('hidden');
            recordBtn.classList.remove('bg-red-500', 'animate-pulse');
        }
    });

    retryBtn.addEventListener('click', () => {
        audioPreview.classList.add('hidden');
        recordBtn.classList.remove('hidden');
        statusText.innerText = "Yozishni boshlash uchun bosing";
        audioBase64 = null;
        checkSubmitStatus();
    });

    studentNameInput.addEventListener('input', checkSubmitStatus);

    function checkSubmitStatus() {
        submitBtn.disabled = !audioBase64 || !studentNameInput.value.trim();
    }

    submitBtn.addEventListener('click', () => {
        const name = studentNameInput.value.trim();
        saveSubmission({
            studentName: name,
            audioData: audioBase64
        });
        document.getElementById('exam-container').classList.add('hidden');
        document.getElementById('success-msg').classList.remove('hidden');
    });
}

// --- O'qituvchi sahifasi logikasi ---
if (document.getElementById('submissions-list')) {
    const listContainer = document.getElementById('submissions-list');
    const gradingForm = document.getElementById('grading-form');
    const emptyState = document.getElementById('empty-state');
    const adminPlayer = document.getElementById('admin-player');
    const scoreRange = document.getElementById('score-range');
    const scoreDisplay = document.getElementById('score-display');
    const feedbackText = document.getElementById('feedback-text');
    const saveBtn = document.getElementById('save-btn');
    const studentNameTitle = document.getElementById('selected-student-name');
    const countBadge = document.getElementById('submission-count');

    let currentId = null;

    function renderList() {
        const subs = getSubmissions().reverse();
        countBadge.innerText = `${subs.length} ta topshiriq`;
        listContainer.innerHTML = '';

        subs.forEach(sub => {
            const div = document.createElement('div');
            div.className = `glass p-4 rounded-2xl cursor-pointer transition-all hover:translate-x-1 ${currentId === sub.id ? 'ring-2 ring-indigo-500' : ''}`;
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                        <h3 class="font-semibold text-slate-900">${sub.studentName}</h3>
                        <p class="text-xs text-slate-500">${new Date(sub.date).toLocaleDateString()}</p>
                    </div>
                </div>
                ${sub.score !== null ? `<div class="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Baholangan: ${sub.score}/10</div>` : ''}
            `;
            div.onclick = () => selectSubmission(sub);
            listContainer.appendChild(div);
        });
    }

    function selectSubmission(sub) {
        currentId = sub.id;
        emptyState.classList.add('hidden');
        gradingForm.classList.remove('hidden');
        studentNameTitle.innerText = sub.studentName + " javobi";
        adminPlayer.src = sub.audioData;
        scoreRange.value = sub.score || 0;
        scoreDisplay.innerText = sub.score || 0;
        feedbackText.value = sub.feedback || '';
        renderList();
    }

    scoreRange.oninput = () => {
        scoreDisplay.innerText = scoreRange.value;
    };

    saveBtn.onclick = () => {
        if (currentId) {
            updateSubmission(currentId, parseInt(scoreRange.value), feedbackText.value);
            renderList();
            alert("Natija saqlandi!");
        }
    };

    renderList();
}
