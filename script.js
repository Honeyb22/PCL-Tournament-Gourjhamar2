/* =========================================================
   PCL TOURNAMENT — GOURJHAMAR — script.js
   ========================================================= */

/* ============================================================
   1) UPI SETTINGS — EDIT ONLY THESE THREE LINES
   ============================================================
   UPI_ID      -> the owner's UPI ID (e.g. "9589337300@ybl")
   PAYEE_NAME  -> name that will show in the UPI app
   AMOUNT      -> registration fee amount (numbers only)
   ============================================================ */
const UPI_ID     = "prabhansupatkar@ybl";   // <-- change this
const PAYEE_NAME = "Prabhanshu Patkar"; // <-- change if needed
const AMOUNT     = "500";                          // <-- change if fee changes

/* ============================================================
   2) GOOGLE APPS SCRIPT WEB APP URL
   ============================================================
   After deploying the Apps Script (see SETUP_INSTRUCTIONS.md),
   paste the deployment URL here. It looks like:
   https://script.google.com/macros/s/XXXXXXXXXXXX/exec
   ============================================================ */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx6CyO2Q-MUn9jGWIFOWG4IlyWIEYPzLIINJbTog3w7pgzAFxFflsDJ0i3gzzEUhsmB/exec";


/* ---------------- Pay Now button -> UPI deep link ---------------- */
document.getElementById("payNowBtn").addEventListener("click", function (e) {
  e.preventDefault();
  const note = "PCL Tournament Registration";
  const upiLink =
    "upi://pay?pa=" + encodeURIComponent(UPI_ID) +
    "&pn=" + encodeURIComponent(PAYEE_NAME) +
    "&am=" + encodeURIComponent(AMOUNT) +
    "&cu=INR" +
    "&tn=" + encodeURIComponent(note);

  window.location.href = upiLink;
});


/* ---------------- Show chosen file name on upload ---------------- */
function wireFileLabel(inputId, labelId) {
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  input.addEventListener("change", function () {
    if (input.files && input.files[0]) {
      label.textContent = "Selected: " + input.files[0].name;
    }
  });
}
wireFileLabel("playerPhoto", "playerPhotoName");
wireFileLabel("paymentScreenshot", "screenshotName");


/* ---------------- Helper: file -> base64 ---------------- */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // strip data: prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


/* ---------------- Form submit -> Google Apps Script ---------------- */
const form = document.getElementById("regForm");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("formStatus");

/* ---------------- Overlay + trivia setup ---------------- */
const regOverlay = document.getElementById("regOverlay");
const waitPanel = document.getElementById("waitPanel");
const successPanel = document.getElementById("successPanel");
const overlayCloseBtn = document.getElementById("overlayCloseBtn");

overlayCloseBtn.addEventListener("click", () => {
  regOverlay.classList.remove("open");
});

const triviaList = [
  { q: "एक ओवर में कितनी गेंदें होती हैं?", a: "6 गेंदें" },
  { q: "पहला क्रिकेट वर्ल्ड कप किस साल खेला गया था?", a: "1975 में" },
  { q: "क्रिकेट पिच की लंबाई कितनी होती है?", a: "22 गज" },
  { q: "T20 क्रिकेट में कुल कितने ओवर होते हैं?", a: "20 ओवर (हर टीम के लिए)" },
  { q: "किस खिलाड़ी के नाम अंतरराष्ट्रीय क्रिकेट में सबसे ज़्यादा शतक हैं?", a: "सचिन तेंदुलकर" },
  { q: "LBW का पूरा नाम क्या है?", a: "Leg Before Wicket" }
];
let currentTrivia = null;

function pickRandomTrivia() {
  currentTrivia = triviaList[Math.floor(Math.random() * triviaList.length)];
  document.getElementById("triviaQuestion").textContent = currentTrivia.q;
}
function revealTriviaAnswer() {
  if (currentTrivia) {
    document.getElementById("triviaAnswer").textContent = currentTrivia.a;
  }
}

function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {}
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (SCRIPT_URL.indexOf("PUT-YOUR") === 0) {
    statusEl.className = "form-status err";
    statusEl.textContent = "Setup incomplete: add your Apps Script URL in script.js";
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = "";

  waitPanel.classList.add("active");
  successPanel.classList.remove("active");
  regOverlay.classList.add("open");
  pickRandomTrivia();

  try {
    const playerPhotoFile = document.getElementById("playerPhoto").files[0];
    const screenshotFile = document.getElementById("paymentScreenshot").files[0];

    const payload = {
      playerName: document.getElementById("playerName").value,
      mobile: document.getElementById("mobile").value,
      village: document.getElementById("village").value,
      age: document.getElementById("age").value,
      role: document.getElementById("role").value,
      playerPhotoBase64: await fileToBase64(playerPhotoFile),
      playerPhotoName: playerPhotoFile.name,
      playerPhotoType: playerPhotoFile.type,
      screenshotBase64: await fileToBase64(screenshotFile),
      screenshotName: screenshotFile.name,
      screenshotType: screenshotFile.type,
    };

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result.status === "success") {
      waitPanel.classList.remove("active");
      successPanel.classList.add("active");
      revealTriviaAnswer();
      playSuccessSound();
      form.reset();
      document.getElementById("playerPhotoName").textContent = "";
      document.getElementById("screenshotName").textContent = "";
    } else {
      throw new Error(result.message || "Unknown error");
    }
  } catch (err) {
    regOverlay.classList.remove("open");
    statusEl.className = "form-status err";
    statusEl.textContent = "❌ Submission failed. Please try again or contact 8817904346.";
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------------- Countdown Timer -> 31 August ---------------- */
const countdownTarget = new Date("2026-08-31T23:59:59").getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const distance = countdownTarget - now;

  const box = document.getElementById("countdownTimer");
  if (!box) return;

  if (distance <= 0) {
    document.getElementById("cdDays").textContent = "00";
    document.getElementById("cdHours").textContent = "00";
    document.getElementById("cdMins").textContent = "00";
    document.getElementById("cdSecs").textContent = "00";
    document.querySelector(".countdown-label").textContent = "❌ Registration Closed";
    document.querySelector(".countdown-box").classList.add("expired");
    clearInterval(countdownInterval);
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("cdDays").textContent = String(days).padStart(2, "0");
  document.getElementById("cdHours").textContent = String(hours).padStart(2, "0");
  document.getElementById("cdMins").textContent = String(mins).padStart(2, "0");
  document.getElementById("cdSecs").textContent = String(secs).padStart(2, "0");
}

updateCountdown();
const countdownInterval = setInterval(updateCountdown, 1000);


/* ---------------- Sponsor image carousel + lightbox ---------------- */
document.querySelectorAll(".sponsor-carousel").forEach((carousel) => {
  const img = carousel.querySelector(".sp-img");
  const images = img.dataset.images.split(",");

  function setIndex(i) {
    const idx = ((i % images.length) + images.length) % images.length;
    img.dataset.index = idx;
    img.src = images[idx];
  }

  carousel.querySelector(".sp-prev").addEventListener("click", (e) => {
    e.stopPropagation();
    setIndex(parseInt(img.dataset.index) - 1);
  });
  carousel.querySelector(".sp-next").addEventListener("click", (e) => {
    e.stopPropagation();
    setIndex(parseInt(img.dataset.index) + 1);
  });

  img.addEventListener("click", () => openLightbox(images, parseInt(img.dataset.index)));
});

const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
let lbImages = [];
let lbIndex = 0;

function openLightbox(images, startIndex) {
  lbImages = images;
  lbIndex = startIndex;
  lbImg.src = lbImages[lbIndex];
  document.getElementById("lbPrev").style.display = lbImages.length > 1 ? "flex" : "none";
  document.getElementById("lbNext").style.display = lbImages.length > 1 ? "flex" : "none";
  lightbox.classList.add("open");
}
function closeLightbox() {
  lightbox.classList.remove("open");
}
function lbShow(delta) {
  lbIndex = ((lbIndex + delta) % lbImages.length + lbImages.length) % lbImages.length;
  lbImg.src = lbImages[lbIndex];
}

document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbPrev").addEventListener("click", () => lbShow(-1));
document.getElementById("lbNext").addEventListener("click", () => lbShow(1));
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});


/* ---------------- Owner photo click -> expand in lightbox ---------------- */
document.querySelectorAll(".owner-img").forEach((img) => {
  img.style.cursor = "pointer";
  img.addEventListener("click", () => openLightbox([img.src], 0));
});



/* ---------------- UPI copy buttons ---------------- */
document.querySelectorAll(".upi-copy-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.copyTarget;
    const text = document.getElementById(targetId).textContent.trim();

    navigator.clipboard.writeText(text).then(() => {
      const toast = document.getElementById("upiCopyToast");
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1800);
    }).catch(() => {
      // fallback for older browsers
      const temp = document.createElement("textarea");
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      const toast = document.getElementById("upiCopyToast");
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1800);
    });
  });
});


/* ---------------- Intro audio: try autoplay, fallback to tap ---------------- */
const introAudio = document.getElementById("introAudio");
const soundBtn = document.getElementById("soundBtn");

function tryAutoplay() {
  introAudio.play().catch(() => {
    // Autoplay blocked — show the tap button
    soundBtn.classList.add("show");
  });
}

window.addEventListener("load", tryAutoplay);

soundBtn.addEventListener("click", () => {
  introAudio.play();
  soundBtn.classList.remove("show");
});

// If autoplay was blocked, play on the very first tap anywhere on the page
document.addEventListener("click", function firstTapPlay() {
  if (introAudio.paused) {
    introAudio.play().catch(() => {});
  }
  soundBtn.classList.remove("show");
  document.removeEventListener("click", firstTapPlay);
}, { once: true });
