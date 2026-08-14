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
const UPI_ID     = "PUT-YOUR-UPI-ID-HERE@bank";   // <-- change this
const PAYEE_NAME = "Gourjhamar Cricket Association"; // <-- change if needed
const AMOUNT     = "500";                          // <-- change if fee changes

/* ============================================================
   2) GOOGLE APPS SCRIPT WEB APP URL
   ============================================================
   After deploying the Apps Script (see SETUP_INSTRUCTIONS.md),
   paste the deployment URL here. It looks like:
   https://script.google.com/macros/s/XXXXXXXXXXXX/exec
   ============================================================ */
const SCRIPT_URL = "PUT-YOUR-APPS-SCRIPT-WEB-APP-URL-HERE";


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

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (SCRIPT_URL.indexOf("PUT-YOUR") === 0) {
    statusEl.className = "form-status err";
    statusEl.textContent = "Setup incomplete: add your Apps Script URL in script.js";
    return;
  }

  submitBtn.disabled = true;
  statusEl.className = "form-status pending";
  statusEl.textContent = "Submitting... please wait";

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

    // text/plain avoids a CORS pre-flight request that Apps Script cannot answer
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result.status === "success") {
      statusEl.className = "form-status ok";
      statusEl.textContent = "✅ Registration submitted! You'll be contacted soon.";
      form.reset();
      document.getElementById("playerPhotoName").textContent = "";
      document.getElementById("screenshotName").textContent = "";
    } else {
      throw new Error(result.message || "Unknown error");
    }
  } catch (err) {
    statusEl.className = "form-status err";
    statusEl.textContent = "❌ Submission failed. Please try again.";
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});