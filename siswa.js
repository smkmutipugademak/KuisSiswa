// Pastikan URL ini hasil deploy terbaru (New Version)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxyBwuLgvxsPo7DxwGQnSgsMUL_gPBzBVmSVtQwPHBb7Kov6IidUxMfc8-iUjyrsjWBvA/exec";

let questions = [];
let curQ = 0;
let score = 0;
let group = "";

// --- JOIN GAME ---
async function joinGame() {
    const input = document.getElementById('group-name');
    if (!input.value) return alert("Isi nama kelompok dulu!");

    group = input.value;
    const btn = document.querySelector('.btn-main');
    btn.innerText = "Memuat Soal...";
    btn.disabled = true;

    try {
        // Ambil soal dari Database
        const res = await fetch(SCRIPT_URL + "?action=getQuestions");
        questions = await res.json();

        // Cek jika soal gagal dimuat
        if (!questions || questions.length === 0) {
            alert("Soal kosong atau format salah di Database!");
            btn.innerText = "GABUNG";
            btn.disabled = false;
            return;
        }

        document.getElementById('screen-login').classList.add('hide');
        document.getElementById('screen-game').classList.remove('hide');

        // Kirim sinyal join
        sendData("join", "Siap Main");

        // Reset game
        curQ = 0;
        score = 0;
        loadQ();

    } catch (e) {
        alert("Gagal koneksi! Cek internet atau Deploy Script.");
        console.error(e);
        btn.innerText = "GABUNG";
        btn.disabled = false;
    }
}

// --- TAMPILKAN SOAL ---
function loadQ() {
    if (curQ >= questions.length) return finishGame();

    const data = questions[curQ];
    document.getElementById('q-text').innerText = data.q;
    document.getElementById('q-counter').innerText = `Soal ${curQ + 1}/${questions.length}`;

    const box = document.getElementById('btn-container');
    box.innerHTML = ""; // Bersihkan tombol lama

    // Render tombol baru
    data.opts.forEach((opt, i) => {
        // Cek jika opsi kosong (untuk jaga-jaga)
        if (opt) {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = `btn-opt c${i}`;
            // Event Listener Klik
            btn.onclick = function () { answer(i); };
            box.appendChild(btn);
        }
    });
}

// --- CEK JAWABAN ---
function answer(idx) {
    // Ambil kunci jawaban
    const correct = parseInt(questions[curQ].a);
    let status = "";

    // Disable semua tombol biar tidak dipencet 2x
    const btns = document.querySelectorAll('.btn-opt');
    btns.forEach(b => b.disabled = true);

    // Cek Benar/Salah
    if (idx === correct) {
        score += 100;
        status = `Benar (No.${curQ + 1})`;
        try { sfxCorrect.play(); } catch (e) { }
        // Visual efek tombol yang diklik jadi hijau (opsional)
        btns[idx].style.border = "4px solid white";
    } else {
        status = `Salah (No.${curQ + 1})`;
        try { sfxWrong.play(); } catch (e) { }
        btns[idx].style.opacity = "0.5";
    }

    document.getElementById('score-display').innerText = score;

    // Kirim status ke Guru
    sendData("answer", status);

    // Lanjut soal setelah 1.5 detik
    setTimeout(() => {
        curQ++;
        loadQ();
    }, 1500);
}

function finishGame() {
    document.getElementById('screen-game').classList.add('hide');
    document.getElementById('screen-end').classList.remove('hide');
    document.getElementById('final-score').innerText = score;

    try { sfxWin.play(); } catch (e) { }
    try { confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); } catch (e) { }

    sendData("answer", "Selesai Mengerjakan");
}

function sendData(act, stat) {
    // Mode no-cors wajib untuk Google Apps Script
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: group, skor: score, status: stat, action: act })
    }).catch(e => console.log("Gagal kirim data:", e));
}