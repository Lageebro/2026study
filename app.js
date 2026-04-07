/* === FIREBASE CONFIGURATION === */
// OYAGE FIREBASE CONFIGURATION EKA
const firebaseConfig = {
    apiKey: "AIzaSyBo7RCTF0Sz89dDmu9u6pfZjb62j3G__TM",
    authDomain: "study-64199.firebaseapp.com",
    projectId: "study-64199",
    storageBucket: "study-64199.firebasestorage.app",
    messagingSenderId: "529180176160",
    appId: "1:529180176160:web:f7867510cc160254fbb145"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Enable true offline persistence (Reads from cache when network is down)
db.enablePersistence().catch(function (err) {
    if (err.code == 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code == 'unimplemented') {
        console.warn('The current browser does not support offline capabilities.');
    }
});

let timerInterval;
const TARGET_DATE = new Date("2026-08-10T00:00:00").getTime();
let studyChartInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
    // Splash screen logic
    setTimeout(() => {
        document.getElementById('splashScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('splashScreen').style.display = 'none';
            document.getElementById('appContent').classList.remove('hidden');
            document.getElementById('lastUpdated').textContent = `Last Updated: ${new Date().toLocaleDateString()}`;
        }, 500);
    }, 2000);

    // Give Firebase a tiny bit of time to initialize cache before full load
    setTimeout(async () => {
        await initDB();
        initCountdown();
        initPlan(); // Load study plan
        initSubjects();
        initPapers();
        initTimer();
        loadAnalysis(); // Preload analysis listeners
    }, 100);
});

window.nav = function (sectionId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById('sec-' + sectionId).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-purple-600', 'bg-purple-50', 'text-purple-600');
        btn.classList.add('text-purple-400');
        // Reset desktop styles
        const icon = btn.querySelector('i');
        const text = btn.querySelector('span');
        if (icon) icon.classList.remove('text-purple-600');
        if (text) text.classList.remove('text-purple-600');
    });

    const activeBtn = document.querySelector(`.nav-btn[data-target="${sectionId}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-purple-400');
        activeBtn.classList.add('text-purple-600', 'bg-purple-50');
        // Set desktop styles
        const icon = activeBtn.querySelector('i');
        const text = activeBtn.querySelector('span');
        if (icon) icon.classList.add('text-purple-600');
        if (text) text.classList.add('text-purple-600');
    }
}

async function initDB() {
    try {
        // Query just one lesson to see if Firebase is populated
        const snapshot = await db.collection("lessons").limit(1).get({ source: 'server' }).catch(() => null);

        // If snapshot is null, we are offline, so we just return and use cached data
        if (!snapshot || snapshot.empty) {
            // But wait, if cache is ALSO empty, we should write local data so it syncs up later!
            const cacheSnap = await db.collection("lessons").limit(1).get({ source: 'cache' }).catch(() => null);
            if (!cacheSnap || cacheSnap.empty) {
                console.log("Populating initial data to Firebase...");
                const batch = db.batch();
                for (let subj in subjectsData) {
                    subjectsData[subj].forEach(lesson => {
                        const docRef = db.collection("lessons").doc();
                        batch.set(docRef, {
                            subject: subj,
                            lessonName: lesson,
                            isCompleted: 0,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                }
                await batch.commit();
            }
        }
    } catch (e) {
        console.error("InitDB check failed:", e);
    }
}

function initPlan() {
    const planDisplay = document.getElementById('planDisplay');
    const planEditContainer = document.getElementById('planEditContainer');
    const planInput = document.getElementById('planInput');
    const editPlanBtn = document.getElementById('editPlanBtn');
    const savePlanBtn = document.getElementById('savePlanBtn');

    // Load existing plan
    const savedPlan = localStorage.getItem('studyPlanText') || "No plan yet. Click the edit icon to add your study plan!";
    planDisplay.textContent = savedPlan;

    // Toggle edit mode
    editPlanBtn.addEventListener('click', () => {
        const isEditing = !planEditContainer.classList.contains('hidden');
        if (isEditing) {
            // Cancel edit
            planEditContainer.classList.add('hidden');
            planEditContainer.classList.remove('flex');
            planDisplay.classList.remove('hidden');
            editPlanBtn.innerHTML = '<i class="fas fa-edit"></i>';
        } else {
            // Start edit
            planDisplay.classList.add('hidden');
            planEditContainer.classList.remove('hidden');
            planEditContainer.classList.add('flex');
            planInput.value = localStorage.getItem('studyPlanText') || "";
            editPlanBtn.innerHTML = '<i class="fas fa-times"></i>'; // Close icon
        }
    });

    // Save plan
    savePlanBtn.addEventListener('click', () => {
        const newPlan = planInput.value.trim();
        localStorage.setItem('studyPlanText', newPlan);
        planDisplay.textContent = newPlan || "No plan yet. Click the edit icon to add your study plan!";
        
        // Return to display mode
        planEditContainer.classList.add('hidden');
        planEditContainer.classList.remove('flex');
        planDisplay.classList.remove('hidden');
        editPlanBtn.innerHTML = '<i class="fas fa-edit"></i>';
    });
}

function initCountdown() {
    setInterval(() => {
        const now = new Date().getTime();
        const distance = TARGET_DATE - now;

        if (distance < 0) {
            document.getElementById("countdown").innerHTML = "<div class='col-span-4'>A/L Exam Reached!</div>";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("countdown").innerHTML = `
            <div class="bg-purple-100/50 p-2 md:p-6 rounded-2xl border border-purple-100 flex flex-col justify-center"><span class="text-3xl md:text-6xl font-extrabold text-purple-700">${days}</span><span class="text-[10px] md:text-sm uppercase font-bold text-purple-500 mt-1 md:mt-2">Days</span></div>
            <div class="bg-purple-100/50 p-2 md:p-6 rounded-2xl border border-purple-100 flex flex-col justify-center"><span class="text-3xl md:text-6xl font-extrabold text-purple-700">${hours}</span><span class="text-[10px] md:text-sm uppercase font-bold text-purple-500 mt-1 md:mt-2">Hours</span></div>
            <div class="bg-purple-100/50 p-2 md:p-6 rounded-2xl border border-purple-100 flex flex-col justify-center"><span class="text-3xl md:text-6xl font-extrabold text-purple-700">${minutes}</span><span class="text-[10px] md:text-sm uppercase font-bold text-purple-500 mt-1 md:mt-2">Mins</span></div>
            <div class="bg-purple-100/50 p-2 md:p-6 rounded-2xl border border-purple-100 flex flex-col justify-center"><span class="text-3xl md:text-6xl font-extrabold text-purple-700">${seconds}</span><span class="text-[10px] md:text-sm uppercase font-bold text-purple-500 mt-1 md:mt-2">Secs</span></div>
        `;
    }, 1000);
}

function initSubjects() {
    const container = document.getElementById('subjectsContainer');

    // Create card containers first
    for (let subj in subjectsData) {
        if (!document.getElementById(`card-${subj}`)) {
            const card = document.createElement('div');
            card.id = `card-${subj}`;
            card.className = "bg-white rounded-3xl p-5 shadow-lg border border-purple-100 mb-4 transition-all";
            container.appendChild(card);
        }
    }

    // Realtime Listener for true cross-device sync!
    db.collection("lessons").onSnapshot((snapshot) => {
        const lessonsArray = [];
        snapshot.forEach(doc => {
            lessonsArray.push({ id: doc.id, ...doc.data() });
        });

        for (let subj in subjectsData) {
            const subjLessons = lessonsArray.filter(l => l.subject === subj);
            renderSubjectCard(subj, subjLessons);
        }
    }, err => {
        console.error("Offline or Error listening to lessons: ", err);
    });
}

function renderSubjectCard(subj, lessonsArray) {
    if (!lessonsArray || lessonsArray.length === 0) return;

    let checkedCount = lessonsArray.filter(l => l.isCompleted === 1).length;
    let progress = Math.round((checkedCount / lessonsArray.length) * 100) || 0;
    const title = fullNames[subj];

    const card = document.getElementById(`card-${subj}`);
    let isHidden = true; // By default hidden
    const existingLessonsDiv = document.getElementById(`lessons-${subj}`);
    if (existingLessonsDiv) {
        isHidden = existingLessonsDiv.classList.contains('hidden'); // remember toggle state
    }

    card.innerHTML = `
        <div class="flex justify-between items-center cursor-pointer mb-2" onclick="toggleSubject('${subj}')">
            <h3 class="font-extrabold text-purple-900">${title}</h3>
            <i class="fas fa-chevron-down text-purple-400 transition-transform duration-300 ${isHidden ? '' : 'rotate-180'}" id="icon-${subj}"></i>
        </div>
        <div class="w-full bg-purple-100 rounded-full h-1.5 mb-2 overflow-hidden">
             <div class="bg-purple-500 h-1.5 rounded-full transition-all duration-300" style="width: ${progress}%" id="prog-${subj}"></div>
        </div>
        <p class="text-[10px] text-right font-bold text-purple-400 mb-1" id="progText-${subj}">${progress}% Completed</p>
        <div id="lessons-${subj}" class="${isHidden ? 'hidden' : 'flex'} flex-col gap-2 mt-4 text-sm max-h-[60vh] overflow-y-auto pr-2"></div>
    `;

    // Internal render for list items
    const listContainer = document.getElementById(`lessons-${subj}`);

    // Sort array identically to original syllabus setup
    const syllabusOrder = subjectsData[subj];
    lessonsArray.sort((a, b) => syllabusOrder.indexOf(a.lessonName) - syllabusOrder.indexOf(b.lessonName));

    const renderList = (list) => {
        list.forEach(lesson => {
            const div = document.createElement('label');
            div.className = "lesson-item flex items-start gap-3 p-3 bg-purple-50/50 rounded-2xl cursor-pointer border-b border-purple-50 hover:bg-purple-100/50";
            div.innerHTML = `
                <input type="checkbox" class="lesson-checkbox mt-1 accent-purple-600 scale-125 transition-transform" ${lesson.isCompleted ? 'checked' : ''} onchange="toggleLesson('${lesson.id}', this.checked)">
                <span class="text-purple-800 leading-snug font-medium select-none text-[13px] md:text-sm">${lesson.lessonName}</span>
            `;
            listContainer.appendChild(div);
        });
    };

    renderList(lessonsArray.filter(l => l.isCompleted === 0));
    renderList(lessonsArray.filter(l => l.isCompleted === 1));
}

window.toggleSubject = function (subj) {
    const el = document.getElementById(`lessons-${subj}`);
    const icon = document.getElementById(`icon-${subj}`);
    if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        el.classList.add('flex');
        icon.classList.add('rotate-180');
    } else {
        el.classList.add('hidden');
        el.classList.remove('flex');
        icon.classList.remove('rotate-180');
    }
}

window.toggleLesson = function (id, isChecked) {
    // This instantly updates local cache (and UI), and pushes to Firebase when network returns!
    db.collection("lessons").doc(id).update({
        isCompleted: isChecked ? 1 : 0
    }).catch(err => {
        console.error("Error updating lesson", err);
    });
}

function initPapers() {
    const container = document.getElementById('papersContainer');
    const years = [2020, 2021, 2022, 2023, 2024, 2025];

    for (let subj in fullNames) {
        const card = document.createElement('div');
        card.className = "bg-white rounded-3xl p-5 shadow-lg border border-purple-100 mb-4";

        let yearsHtml = years.map(y => {
            const link = (typeof paperLinks !== 'undefined' && paperLinks[subj] && paperLinks[subj][y]) ? paperLinks[subj][y] : "https://drive.google.com/";
            return `
            <a href="${link}" target="_blank" class="block w-full text-center bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3 rounded-2xl transition">
                ${y}
            </a>
            `;
        }).join('');

        card.innerHTML = `
            <div class="flex justify-between items-center cursor-pointer" onclick="document.getElementById('paper-${subj}').classList.toggle('hidden')">
                <h3 class="font-extrabold text-purple-900">${fullNames[subj]}</h3>
                <i class="fas fa-chevron-down text-purple-400"></i>
            </div>
            <div id="paper-${subj}" class="hidden grid grid-cols-2 gap-3 mt-4">
                ${yearsHtml}
            </div>
        `;
        container.appendChild(card);
    }
}

// Timer Logic
const btnStart = document.getElementById('btnStartTimer');
const btnEnd = document.getElementById('btnEndTimer');
const display = document.getElementById('timerDisplay');

function updateTimerDisplay() {
    const startTime = localStorage.getItem('timerStart');
    if (!startTime) return;
    const diff = new Date().getTime() - parseInt(startTime);
    if (diff < 0) return;
    const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
    display.textContent = `${h}:${m}:${s}`;
}

function initTimer() {
    if (localStorage.getItem('timerStart')) {
        timerInterval = setInterval(updateTimerDisplay, 1000);
        btnStart.disabled = true; btnStart.classList.add('opacity-50');
        btnEnd.disabled = false;
        updateTimerDisplay();
    }
    btnStart.addEventListener('click', () => {
        localStorage.setItem('timerStart', new Date().getTime().toString());
        timerInterval = setInterval(updateTimerDisplay, 1000);
        btnStart.disabled = true; btnStart.classList.add('opacity-50');
        btnEnd.disabled = false;
    });
    btnEnd.addEventListener('click', async () => {
        clearInterval(timerInterval);
        const st = parseInt(localStorage.getItem('timerStart'));
        const duration = Math.max(1, Math.round((new Date().getTime() - st) / 60000));
        localStorage.removeItem('timerStart');
        btnStart.disabled = false; btnStart.classList.remove('opacity-50');
        btnEnd.disabled = true; display.textContent = "00:00:00";

        const topic = prompt("Monawada me welawe padam kare? (What did you study?)");
        if (topic) await saveStudySession(duration, topic);
    });
}


async function saveStudySession(duration, topic) {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
        await db.collection("studySessions").add({
            date: todayStr,
            durationInMinutes: duration,
            topic: topic,
            timestamp: new Date().getTime() // Better for offline sorting
        });
    } catch (e) {
        console.error("Saved locally because offline", e);
    }
}

// Analytics Loading
function loadAnalysis() {
    // Lesson completion listener
    db.collection("lessons").onSnapshot(snapshot => {
        let completed = 0;
        snapshot.forEach(doc => {
            if (doc.data().isCompleted === 1) completed++;
        });
        document.getElementById('statLessons').textContent = `${completed} / ${snapshot.size}`;
    });

    // Session log listener
    db.collection("studySessions").orderBy("timestamp", "desc").onSnapshot(snapshot => {
        const sessions = [];
        let totalMins = 0;
        const dateMap = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            sessions.push(data);
            totalMins += data.durationInMinutes;
            dateMap[data.date] = (dateMap[data.date] || 0) + data.durationInMinutes;
        });

        document.getElementById('statTotalHours').textContent = (totalMins / 60).toFixed(1) + 'h';

        const recentList = document.getElementById('recentTopicsList');
        recentList.innerHTML = '';
        const recentSessions = sessions.slice(0, 5); // display 5 most recent

        if (recentSessions.length === 0) {
            recentList.innerHTML = '<p class="text-purple-300 text-center text-xs py-2 italic font-medium">No recent sessions yet.</p>';
        } else {
            recentSessions.forEach(s => {
                const li = document.createElement('li');
                li.className = "flex justify-between items-center bg-purple-50 p-3 rounded-2xl border border-purple-100";
                li.innerHTML = `<span class="font-semibold text-purple-900">${s.topic}</span> <span class="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-bold">${s.durationInMinutes} min</span>`;
                recentList.appendChild(li);
            });
        }

        const ctx = document.getElementById('studyChart').getContext('2d');
        const labels = Object.keys(dateMap).sort().slice(-7); // sort naturally by date string
        const dataArr = labels.map(day => dateMap[day]);

        if (studyChartInstance) studyChartInstance.destroy();
        studyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.map(day => { let d = new Date(day); return `${d.getDate()}/${d.getMonth() + 1}`; }),
                datasets: [{ data: dataArr, backgroundColor: '#a78bfa', borderRadius: 8 }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    });
}
