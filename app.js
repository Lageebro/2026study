/* === FIREBASE CONFIGURATION === */
// OYAGE FIREBASE CONFIGURATION EKA
const firebaseConfig = {
    apiKey: "AIzaSyCEzV3toneqp6JqVyeE7IFdevNPF669_oU",
    authDomain: "studyapp-new.firebaseapp.com",
    projectId: "studyapp-new",
    storageBucket: "studyapp-new.firebasestorage.app",
    messagingSenderId: "94869037818",
    appId: "1:94869037818:web:fe6446e170c33ba6739f43"
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
let upcomingClassSchedules = [];
let classNotifInterval = null;

// Register Service Worker for Mobile Notifications
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log("Service Worker registered for notifications"))
            .catch(err => console.log("SW Reg Error:", err));
    });
}

window.sendPhoneNotification = function(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(function(registration) {
                registration.showNotification(title, {
                    body: body,
                    icon: "Logodark.png",
                    vibrate: [200, 100, 200, 100, 200, 100, 200],
                    badge: "Logodark.png",
                    requireInteraction: true
                });
            }).catch(err => {
                new Notification(title, { body: body, icon: "Logodark.png" });
            });
        } else {
            new Notification(title, { body: body, icon: "Logodark.png" });
        }
    }
}

window.showClassModal = function (title, contentHtml) {
    const notifModal = document.getElementById('classNotificationModal');
    const notifContent = document.getElementById('classNotificationContent');
    const notifTitle = document.getElementById('classNotificationTitle');

    if (notifModal && notifContent) {
        if (title && notifTitle) notifTitle.textContent = title;
        notifContent.innerHTML = contentHtml;
        notifModal.classList.remove('hidden');
        setTimeout(() => {
            notifModal.classList.remove('opacity-0', 'scale-95');
            notifModal.classList.add('opacity-100', 'scale-100');
        }, 100);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // Splash screen logic
    setTimeout(() => {
        document.getElementById('splashScreen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('splashScreen').style.display = 'none';
            document.getElementById('appContent').classList.remove('hidden');
            document.getElementById('lastUpdated').textContent = `Last Updated: ${new Date().toLocaleDateString()}`;

            // Show Motivation Modal
            const modal = document.getElementById('motivationModal');
            if (modal) {
                modal.classList.remove('hidden');
                setTimeout(() => {
                    modal.classList.remove('opacity-0', 'scale-95');
                    modal.classList.add('opacity-100', 'scale-100');
                }, 50);
            }
        }, 500);
    }, 2000);

    // Initialize offline/cache UI immediately without blocking
    setTimeout(() => {
        initCountdown();
        initPlan(); // Load study plan
        initSubjects(); // Attaches onSnapshot (loads cache instantly!)
        initPapers();
        initTimer();
        initClasses(); // Class schedule manager
        loadAnalysis(); // Preload analysis listeners

        // Run DB check/seeding in the background without blocking the UI
        initDB();
    }, 100);

    // Close Motivation Modal Logic
    const closeMotivationBtn = document.getElementById('closeMotivationBtn');
    const motivationOverlay = document.getElementById('motivationOverlay');
    const modal = document.getElementById('motivationModal');

    const closeModal = () => {
        if (modal) {
            modal.classList.remove('opacity-100', 'scale-100');
            modal.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 500);
        }
    };

    if (closeMotivationBtn) closeMotivationBtn.addEventListener('click', closeModal);
    if (motivationOverlay) motivationOverlay.addEventListener('click', closeModal);

    // Close Class Notification Modal Logic
    const closeClassNotifBtn = document.getElementById('closeClassNotificationBtn');
    const classNotifOverlay = document.getElementById('classNotificationOverlay');
    const classNotifModal = document.getElementById('classNotificationModal');

    const closeClassModal = () => {
        if (classNotifModal) {
            classNotifModal.classList.remove('opacity-100', 'scale-100');
            classNotifModal.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                classNotifModal.classList.add('hidden');
            }, 500);
        }
    };

    if (closeClassNotifBtn) closeClassNotifBtn.addEventListener('click', closeClassModal);
    if (classNotifOverlay) classNotifOverlay.addEventListener('click', closeClassModal);
});

window.requestNotificationPermission = function() {
    if (!('Notification' in window)) {
        alert("Sudu, oyage device eke web notifications support karanne nha.");
        return;
    }
    
    // Check if it's iOS and not standalone
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    if (isIos && !isStandalone) {
        alert("Sudu, iPhone eke lock screen notifications pennanna nam, yatama thiyena share (⬆️) button eka click karala 'Add to Home Screen' (➕) select karanna. Eeta passe Home screen eken app eka open karala me bell eka obanna Manikee!");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            window.sendPhoneNotification("Notificashan On Kara! 🎉", "Dan oyata Lock screen eketh classes gena mathak wewi manike!");
            alert("Notificashan on kala, Sudu! Lock screen eketh pennai! 🚀");
        } else if (permission === 'denied') {
            alert("Notificashan disable karala thiyenne Sudu. Settings walin ayeth enable karanna.");
        }
    });
}

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

    const defaultPlanText = "Manikage Plan eka, Click the edit icon to add your study plan Sudu!";

    // Listen to Firebase for real-time plan updates across all devices
    db.collection("sharedData").doc("studyPlan").onSnapshot((doc) => {
        if (doc.exists) {
            const planText = doc.data().text;
            planDisplay.textContent = planText || defaultPlanText;
        } else {
            // Initial load fallback to local storage if exists, then migrate
            const localPlan = localStorage.getItem('studyPlanText');
            if (localPlan) {
                db.collection("sharedData").doc("studyPlan").set({ text: localPlan }).catch(e => console.log(e));
                planDisplay.textContent = localPlan;
                localStorage.removeItem('studyPlanText'); // clear local after migrating
            } else {
                planDisplay.textContent = defaultPlanText;
            }
        }
    }, (error) => {
        console.error("Error fetching study plan", error);
        if (error.code === 'permission-denied') {
            alert("Firebase 'studyPlan' sync failed due to Security Rules. Please change Firestore Rules to allow read/write.");
        }
        // Offline fallback
        planDisplay.textContent = document.getElementById('planDisplay').textContent || defaultPlanText;
    });

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
            const currentPlan = planDisplay.textContent === defaultPlanText ? "" : planDisplay.textContent;
            planInput.value = currentPlan;
            editPlanBtn.innerHTML = '<i class="fas fa-times"></i>'; // Close icon
        }
    });

    // Save plan
    savePlanBtn.addEventListener('click', () => {
        const newPlan = planInput.value.trim();

        // Save to Firebase (this will trigger the onSnapshot above to update UI on all devices)
        db.collection("sharedData").doc("studyPlan").set({
            text: newPlan,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(err => {
            console.error("Error saving plan:", err);
            planDisplay.textContent = newPlan || defaultPlanText;
        });

        // Return to display mode
        planEditContainer.classList.add('hidden');
        planEditContainer.classList.remove('flex');
        planDisplay.classList.remove('hidden');
        editPlanBtn.innerHTML = '<i class="fas fa-edit"></i>';
    });

    // 6:30 AM & 6:30 PM Study Plan Reminder
    setInterval(() => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // 6:30 AM (6) or 6:30 PM (18)
        if ((hours === 6 || hours === 18) && minutes === 30) {
            const todayStr = now.toISOString().split('T')[0];
            const shift = hours === 6 ? 'Morning' : 'Evening';
            const storageKey = `notifiedPlan_${todayStr}_${shift}`;
            
            if (!localStorage.getItem(storageKey)) {
                const currentPlan = planDisplay.textContent;
                const isDefault = currentPlan === defaultPlanText || !currentPlan;
                
                const title = hours === 6 ? "Good Morning Sudu!🌅 Ude plan eka mehemai!" : "Good Evening Sudu!🌇 Hawasa plan eka mehemai!";
                const body = isDefault ? "Thama plan eka add karala na. App eken plan eka update karanna manike!" : currentPlan;

                window.sendPhoneNotification(title, body);

                localStorage.setItem(storageKey, 'true');
            }
        }
    }, 45000); // Check every 45 seconds to avoid heavy loop
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
        if (err.code === 'permission-denied') {
            alert("Firebase Security Rules error! Your database is locked. Other devices cannot see updates. Please change rules to 'allow read, write: if true;' in Firebase Console.");
        }
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
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

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
const btnPause = document.getElementById('btnPauseTimer');
const btnEnd = document.getElementById('btnEndTimer');
const display = document.getElementById('timerDisplay');

function updateTimerDisplay() {
    let diff = 0;
    if (localStorage.getItem('timerStart')) {
        diff = new Date().getTime() - parseInt(localStorage.getItem('timerStart'));
    } else if (localStorage.getItem('timerElapsed')) {
        diff = parseInt(localStorage.getItem('timerElapsed'));
    } else {
        return;
    }

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
        btnStart.textContent = "Start";
        if (btnPause) { btnPause.disabled = false; btnPause.classList.remove('opacity-50'); }
        btnEnd.disabled = false;
        updateTimerDisplay();
    } else if (localStorage.getItem('timerElapsed')) {
        btnStart.disabled = false; btnStart.classList.remove('opacity-50');
        btnStart.textContent = "Resume";
        if (btnPause) { btnPause.disabled = true; btnPause.classList.add('opacity-50'); }
        btnEnd.disabled = false;
        updateTimerDisplay();
    }

    btnStart.addEventListener('click', () => {
        let startTime = new Date().getTime();
        if (localStorage.getItem('timerElapsed')) {
            startTime -= parseInt(localStorage.getItem('timerElapsed'));
            localStorage.removeItem('timerElapsed');
        }
        localStorage.setItem('timerStart', startTime.toString());
        timerInterval = setInterval(updateTimerDisplay, 1000);

        btnStart.disabled = true; btnStart.classList.add('opacity-50');
        btnStart.textContent = "Start";
        if (btnPause) { btnPause.disabled = false; btnPause.classList.remove('opacity-50'); }
        btnEnd.disabled = false;
        updateTimerDisplay();
    });

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            clearInterval(timerInterval);
            const startT = localStorage.getItem('timerStart');
            if (startT) {
                const elapsed = new Date().getTime() - parseInt(startT);
                localStorage.setItem('timerElapsed', elapsed.toString());
                localStorage.removeItem('timerStart');
            }
            btnStart.disabled = false; btnStart.classList.remove('opacity-50');
            btnStart.textContent = "Resume";
            btnPause.disabled = true; btnPause.classList.add('opacity-50');
            updateTimerDisplay();
        });
    }

    btnEnd.addEventListener('click', async () => {
        clearInterval(timerInterval);

        let elapsed = 0;
        if (localStorage.getItem('timerStart')) {
            elapsed = new Date().getTime() - parseInt(localStorage.getItem('timerStart'));
        } else if (localStorage.getItem('timerElapsed')) {
            elapsed = parseInt(localStorage.getItem('timerElapsed'));
        }

        const duration = Math.max(1, Math.round(elapsed / 60000));

        localStorage.removeItem('timerStart');
        localStorage.removeItem('timerElapsed');

        btnStart.disabled = false; btnStart.classList.remove('opacity-50');
        btnStart.textContent = "Start";
        if (btnPause) { btnPause.disabled = true; btnPause.classList.add('opacity-50'); }
        btnEnd.disabled = true;
        display.textContent = "00:00:00";

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

function initClasses() {
    const addClassBtn = document.getElementById('addClassBtn');
    const addClassForm = document.getElementById('addClassForm');
    const saveClassBtn = document.getElementById('saveClassBtn');
    const classList = document.getElementById('classList');

    // Toggle Add Class Form
    if (addClassBtn) {
        addClassBtn.addEventListener('click', () => {
            if (addClassForm.classList.contains('hidden')) {
                addClassForm.classList.remove('hidden');
                addClassForm.classList.add('flex');
                addClassBtn.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                addClassForm.classList.add('hidden');
                addClassForm.classList.remove('flex');
                addClassBtn.innerHTML = '<i class="fas fa-plus"></i>';
            }
        });
    }

    // Save Class to Firestore
    if (saveClassBtn) {
        saveClassBtn.addEventListener('click', () => {
            const name = document.getElementById('classNameInput').value.trim();
            const date = document.getElementById('classDateInput').value;
            const time = document.getElementById('classTimeInput').value;

            if (!name || !date || !time) {
                alert("Sudu, plz fill all fields (Name, Date, Time)!");
                return;
            }

            db.collection("classSchedule").add({
                name: name,
                date: date,
                time: time,
                timestamp: new Date(`${date}T${time}`).getTime(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                document.getElementById('classNameInput').value = '';
                document.getElementById('classDateInput').value = '';
                document.getElementById('classTimeInput').value = '';
                addClassForm.classList.add('hidden');
                addClassForm.classList.remove('flex');
                addClassBtn.innerHTML = '<i class="fas fa-plus"></i>';
            }).catch(err => console.error("Error adding class:", err));
        });
    }

    // Real-time listener for Class Schedule
    db.collection("classSchedule").orderBy("timestamp", "asc").onSnapshot(snapshot => {
        let classesHtml = '';
        let todayClassesHtml = '';
        const todayStr = new Date().toISOString().split('T')[0];

        upcomingClassSchedules = []; // Reset global list

        // Use local storage / session to show modal only once per session
        const notifiedClasses = JSON.parse(sessionStorage.getItem('notifiedClasses') || '[]');
        let newNotifsCount = 0;

        if (snapshot.empty) {
            if (classList) classList.innerHTML = '<p id="noClassesMsg" class="text-purple-400 text-sm text-center italic py-4">No upcoming classes scheduled yet.</p>';
            return;
        }

        const now = new Date().getTime();

        snapshot.forEach(doc => {
            const data = doc.data();
            upcomingClassSchedules.push({ id: doc.id, ...data });

            // Automatically skip classes that are completely passed by 3 hours
            if (data.timestamp && data.timestamp < (now - 3 * 3600 * 1000)) {
                // Delete past class to keep db clean (optional)
                // db.collection("classSchedule").doc(doc.id).delete();
                // However, we'll just not render it for now
                return;
            }

            // Check if class is TODAY
            if (data.date === todayStr) {
                todayClassesHtml += `
                    <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 text-left shadow-sm">
                        <p class="font-extrabold text-amber-900 text-lg">${data.name}</p>
                        <p class="text-sm text-amber-700 mt-1 font-bold"><i class="far fa-clock"></i> ${data.time}</p>
                    </div>
                `;

                if (!notifiedClasses.includes(doc.id)) {
                    newNotifsCount++;
                    notifiedClasses.push(doc.id);
                }
            }

            // Format date for list view
            let dateStrFormatted = '';
            try {
                const dateObj = new Date(data.date);
                dateStrFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
            } catch (e) {
                dateStrFormatted = data.date;
            }

            classesHtml += `
                <div class="flex justify-between items-center bg-purple-50/80 p-3 md:p-4 rounded-2xl border border-purple-100 group hover:shadow-md transition">
                    <div class="flex flex-col">
                        <span class="font-extrabold text-purple-900">${data.name}</span>
                        <span class="text-xs md:text-sm text-purple-600 mt-1 font-semibold flex items-center gap-2">
                            <span><i class="far fa-calendar-alt"></i> ${dateStrFormatted}</span>
                            <span>| <i class="far fa-clock"></i> ${data.time}</span>
                        </span>
                    </div>
                    <button onclick="deleteClass('${doc.id}')" class="text-rose-400 hover:text-white hover:bg-rose-500 transition-all p-2 w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-sm active:scale-90">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        if (classList) {
            classList.innerHTML = classesHtml || '<p id="noClassesMsg" class="text-purple-400 text-sm text-center italic py-4">No upcoming classes scheduled yet.</p>';
        }

        // Trigger notifications if there are any classes today and we have new ones
        if (todayClassesHtml && newNotifsCount > 0) {
            sessionStorage.setItem('notifiedClasses', JSON.stringify(notifiedClasses));

            window.showClassModal("Class Reminder ! 📚", todayClassesHtml);

            // Trigger Phone/Browser Notification
            window.sendPhoneNotification("Sudu, you have classes today! 📚", "Check your study tracker for class details.");
        }

        // Setup 30-minute advance notification interval if not already running
        if (!classNotifInterval) {
            classNotifInterval = setInterval(() => {
                if (upcomingClassSchedules.length === 0) return;

                const currentTime = new Date().getTime();
                const notified30MinClasses = JSON.parse(localStorage.getItem('notified30MinClasses') || '[]');
                let shouldUpdateStorage = false;

                upcomingClassSchedules.forEach(cls => {
                    if (!cls.timestamp) return;

                    const diffMins = (cls.timestamp - currentTime) / 60000;

                    // If class is exactly within 30 minutes away and not already notified
                    if (diffMins > 0 && diffMins <= 30) {
                        if (!notified30MinClasses.includes(cls.id)) {
                            // Show In-app Modal
                            const html = `
                                <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 text-left shadow-sm">
                                    <p class="font-extrabold text-amber-900 text-lg">${cls.name}</p>
                                    <p class="text-sm text-amber-700 mt-1 font-bold">Starts in ${Math.ceil(diffMins)} mins! <i class="far fa-clock"></i> ${cls.time}</p>
                                </div>
                            `;
                            window.showClassModal("Manikee Thawa tiken Class Patan Gannooo! ⏳", html);

                            // Native Push Notification
                            window.sendPhoneNotification(`Up Next: ${cls.name} ⏳`, `Starts in ${Math.ceil(diffMins)} mins at ${cls.time}! Get ready!`);

                            notified30MinClasses.push(cls.id);
                            shouldUpdateStorage = true;
                        }
                    }
                });

                if (shouldUpdateStorage) {
                    localStorage.setItem('notified30MinClasses', JSON.stringify(notified30MinClasses));
                }
            }, 30000); // Check every 30 seconds
        }
    }, err => console.log('Error fetching classes:', err));
}

// Global function to delete a scheduled class
window.deleteClass = function (id) {
    if (confirm("Sudu, are you sure you want to remove this class from the schedule?")) {
        db.collection("classSchedule").doc(id).delete();
    }
}
