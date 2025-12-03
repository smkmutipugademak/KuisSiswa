/ --- TEMPEL URL APPS SCRIPT HASIL DEPLOY TERBARU DISINI ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxyBwuLgvxsPo7DxwGQnSgsMUL_gPBzBVmSVtQwPHBb7Kov6IidUxMfc8-iUjyrsjWBvA/exec";

let questions = [];
let curQ = 0;
let score = 0;
let group = "";

// Audio Effects
const sfxCorrect = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
const sfxWrong = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3');
const sfxWin = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');

// --- FUNGSI GABUNG GAME ---
async function joinGame() {
    const input = document.getElementById('group-name');
    if (!input.value) return alert("Isi nama kelompok dulu!");

    group = input.value;
    const btn = document.querySelector('.btn-main');
    btn.innerText = "Memuat Soal...";
    btn.disabled = true;

    try {
        // 1. Ambil Soal dulu dari Database
        // Tambahkan timestamp agar tidak cache
        const res = await fetch(SCRIPT_URL + "?action=getQuestions&t=" + new Date().getTime());
        questions = await res.json();

        if (!questions || questions.length === 0) {
            alert("Soal kosong atau error di Database!");
            btn.innerText = "GABUNG";
            btn.disabled = false;
            return;
        }

        // 2. Masuk ke layar game
        document.getElementById('screen-login').classList.add('hide');
        document.getElementById('screen-game').classList.remove('hide');

        // 3. Kirim data join
        sendData("join", "Siap Main");

        // 4. Reset & Tampilkan soal
        curQ = 0;
        score = 0;
        loadQ();

    } catch (e) {
        alert("Gagal koneksi! Pastikan sudah Deploy New Version.");
        console.error(e);
        btn.innerText = "GABUNG";
        btn.disabled = false;
    }
}

function loadQ() {
    if (curQ >= questions.length) return finishGame();

    const data = questions[curQ];
    document.getElementById('q-text').innerText = data.q;
    document.getElementById('q-counter').innerText = `Soal ${curQ + 1}/${questions.length}`;

    const box = document.getElementById('btn-container');
    box.innerHTML = ""; // Bersihkan tombol lama

    // Render 4 Pilihan
    data.opts.forEach((opt, i) => {
        // Cek agar opsi tidak kosong/undefined
        if (opt !== undefined && opt !== null) {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = `btn-opt c${i}`;
            
            // Event Listener saat diklik
            btn.onclick = function() {
                answer(i, btn); // Kirim index dan elemen tombolnya
            };
            
            box.appendChild(btn);
        }
    });
}

function answer(idx, btnElement) {
    // Pastikan a (kunci jawaban) dibaca sebagai angka
    const correct = parseInt(questions[curQ].a);
    let status = "";

    // Disable semua tombol agar tidak bisa klik 2x
    const allBtns = document.querySelectorAll('.btn-opt');
    allBtns.forEach(b => {
        b.disabled = true;
        b.style.cursor = "not-allowed";
        b.style.opacity = "0.6";
    });

    // Cek Jawaban
    if (idx === correct) {
        score += 100;
        status = `Benar (No.${curQ + 1})`;
        try { sfxCorrect.play(); } catch(e){}
        
        // Visual Benar (Hijau Terang / Border Putih)
        btnElement.style.opacity = "1";
        btnElement.style.border = "5px solid white";
        btnElement.style.transform = "scale(1.05)";
    } else {
        status = `Salah (No.${curQ + 1})`;
        try { sfxWrong.play(); } catch(e){}
        
        // Visual Salah (Merah Gelap / Transparan)
        btnElement.style.opacity = "0.5";
        btnElement.innerText += " ❌";
    }

    document.getElementById('score-display').innerText = score;
    
    // Kirim ke Guru
    sendData("answer", status);

    // Lanjut soal setelah 2 detik
    setTimeout(() => {
        curQ++;
        loadQ();
    }, 2000);
}

function finishGame() {
    document.getElementById('screen-game').classList.add('hide');
    document.getElementById('screen-end').classList.remove('hide');
    document.getElementById('final-score').innerText = score;

    try { sfxWin.play(); } catch(e){}
    try { confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); } catch(e){}
    
    sendData("answer", "Selesai Mengerjakan");
}

function sendData(act, stat) {
    // Gunakan mode no-cors agar tidak diblokir browser
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: group, skor: score, status: stat, action: act })
    }).catch(e => console.log("Gagal kirim data:", e));
}
