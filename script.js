// script.js - Gymello interakcje + EmailJS zamówienie

// ustaw rok w stopce
document.getElementById('year').innerText = new Date().getFullYear();

// Płynny scroll dla linków nawigacji
document.querySelectorAll('.nav-link').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
  });
});

// PRZYCISK "Kup plan" na header
document.getElementById('buyBtn').addEventListener('click', () => {
  openPurchaseModal('Plan treningowy');
});

// przyciski "Kup" na kartach
document.querySelectorAll('.buy-now').forEach(btn => {
  btn.addEventListener('click', () => {
    const plan = btn.dataset.plan || 'Plan';
    openPurchaseModal(plan);
  });
});

// Modal logic
const modal = document.getElementById('buyModal');
const modalClose = document.getElementById('modalClose');
const purchaseForm = document.getElementById('purchaseForm');
const purchaseFeedback = document.getElementById('purchaseFeedback');

function openPurchaseModal(planName){
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('plan').value = planName;
  setTimeout(()=> document.getElementById('from_name').focus(), 200);
}
function closePurchaseModal(){
  modal.setAttribute('aria-hidden', 'true');
  purchaseFeedback.style.display = 'none';
  purchaseFeedback.innerText = '';
  purchaseForm.reset();
}

modalClose.addEventListener('click', closePurchaseModal);
modal.addEventListener('click', (e)=>{ if (e.target === modal) closePurchaseModal(); });

// --- EmailJS integration ---
purchaseForm.addEventListener('submit', function(e){
  e.preventDefault();

  const name = document.getElementById('from_name').value.trim();
  const email = document.getElementById('from_email').value.trim();
  const age = document.getElementById('age').value;
  const height_info = document.getElementById('height_info').value;
  const weight_info = document.getElementById('weight_info').value;
  const goal = document.getElementById('goal').value;
  const allergies = document.getElementById('allergies').value.trim();
  const days = document.getElementById('days_per_week').value;
  const additional = document.getElementById('additional').value.trim();
  const plan = document.getElementById('plan').value;
  const consent = document.getElementById('consent').checked;

  if (!name || !email || !age || !height_info || !weight_info || !goal || !days || !consent) {
    alert('Uzupełnij wszystkie wymagane pola i zaakceptuj zgodę.');
    return;
  }

  const templateParams = {
    from_name: name,
    from_email: email,
    age: age,
    height_info: height_info,
    weight_info: weight_info,
    goal: goal,
    allergies: allergies || 'Brak',
    days_per_week: days,
    additional: additional || 'Brak',
    plan: plan,
    price: '19.99 PLN',
    message: `Nowe zamówienie z formularza Gymello`
  };

  purchaseFeedback.style.display = 'block';
  purchaseFeedback.innerText = 'Wysyłam zamówienie...';

  // === POPRAWIONA WERSJA WYWOŁANIA EMAILJS ===
  emailjs.init('X068PC7dyoI2k-XlB'); // ← Twój public key (inicjalizacja EmailJS)

  emailjs.send('serviceid_gymello', 'template_lhauftr', templateParams)
    .then(() => {
      purchaseFeedback.innerText = '✅ Zamówienie wysłane!';
      setTimeout(() => closePurchaseModal(), 2500);
    })
    .catch((error) => {
      purchaseFeedback.innerText = '❌ Błąd przy wysyłaniu, spróbuj ponownie później';
      console.error('EmailJS error:', error);
    });
});

// --- BMI ---
function calculateBMI() {
  const w = parseFloat(document.getElementById('weight').value);
  const h = parseFloat(document.getElementById('height').value) / 100;
  const resultEl = document.getElementById('result');
  const commentEl = document.getElementById('comment');
  const indicator = document.getElementById('bmiIndicator');

  if (!w || !h || h <= 0) {
    alert('Podaj poprawne liczby (waga i wzrost).');
    return;
  }

  const bmi = w / (h * h);
  let cat = '';
  let comment = '';
  let pct = 0;

  if (bmi < 18.5) {
    cat = 'Niedowaga';
    comment = 'Czas na więcej pysznych kalorii! 🍩';
    pct = (bmi / 25) * 25;
  } else if (bmi < 25) {
    cat = 'Prawidłowa waga';
    comment = 'Super! Twój humor jest w normie 😎';
    pct = 30 + ((bmi - 18.5) / (25 - 18.5)) * 20;
  } else if (bmi < 30) {
    cat = 'Nadwaga';
    comment = 'Może mała aktywność na świeżym powietrzu? 🏃‍♂️';
    pct = 55 + ((bmi - 25) / (30 - 25)) * 20;
  } else {
    cat = 'Otyłość';
    comment = 'Nie zapomnij o zdrowiu! 💪';
    pct = 80 + Math.min((bmi - 30), 20);
  }

  resultEl.innerText = `Twoje BMI: ${bmi.toFixed(1)} (${cat})`;
  commentEl.innerText = comment;
  indicator.style.width = pct + '%';
}
