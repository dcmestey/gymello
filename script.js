// script.js - Gymello interakcje + EmailJS zamówienie + Stripe Checkout (minimalne dodatki)

// --- DODANE: inicjalizacja Stripe (publishable key) ---
const stripe = Stripe("pk_live_51SClLeRpk9r2NriQtS4iG3ns3FdozY1N9ot2Y1RzRFgnWtm1CJhilm5jQ6eA4DmuvFODxqraTIcdqftJx1iE4kbm00OMHUcrXY");
// ------------------------------------------------------------------

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
modal.addEventListener('click', (e)=>{
  if (e.target === modal) closePurchaseModal();
});

// --- EmailJS integration (modyfikacja: zapisz zamówienie i przekieruj do Stripe Checkout) ---
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
  purchaseFeedback.innerText = 'Przygotowuję płatność...';

  // --- ZAMIANA: zamiast natychmiastowego emailjs.send -> zapisz dane i przekieruj do Stripe Checkout ---
  // 1) zapisz dane (będziemy je wysyłać po potwierdzeniu płatności)
  try {
    localStorage.setItem('gymello_pending_order', JSON.stringify(templateParams));
  } catch (err) {
    console.error('LocalStorage error:', err);
  }

  // 2) wybierz price_id na podstawie wybranego planu (podstawione Twoje price IDs)
  let selectedPriceId = '';
  if (plan.toLowerCase().includes('trening')) {
    selectedPriceId = 'price_1SIof3Rpk9r2NriQnsDD20aK';
  } else if (plan.toLowerCase().includes('dieta') || plan.toLowerCase().includes('diet')) {
    selectedPriceId = 'price_1SIogaRpk9r2NriQVMgcb5rC';
  } else if (plan.toLowerCase().includes('ocena') || plan.toLowerCase().includes('sylwet')) {
    selectedPriceId = 'price_1SIoiZRpk9r2NriQIuTAf1TA';
  } else {
    selectedPriceId = 'price_1SIof3Rpk9r2NriQnsDD20aK'; // domyślny
  }

  // ✅ --- POPRAWIONY FRAGMENT: połączenie z backendem Render.com ---
  fetch("https://gymello-backend.onrender.com/create-checkout-session", { // 🟢 POPRAWIONY ADRES
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      priceId: selectedPriceId
    })
  })
  .then(res => res.json())
  .then(session => {
    if (session.id) {
      stripe.redirectToCheckout({ sessionId: session.id });
    } else {
      purchaseFeedback.innerText = 'Błąd: nie udało się utworzyć sesji płatności.';
      console.error(session);
    }
  })
  .catch(err => {
    purchaseFeedback.innerText = 'Błąd połączenia z serwerem płatności.';
    console.error(err);
  });
  // ✅ --- KONIEC POPRAWIONEGO FRAGMENTU ---
});

// --- BMI funkcja (dla sekcji BMI) ---
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

// --- DODANE: po powrocie z Stripe (success) wyślij email przez EmailJS korzystając z zapisanych danych ---
(function sendEmailAfterStripe() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('checkout'); // oczekujemy ?checkout=success lub ?checkout=cancel
  if (!status) return;

  if (status === 'success') {
    const raw = localStorage.getItem('gymello_pending_order');
    if (!raw) {
      purchaseFeedback.style.display = 'block';
      purchaseFeedback.innerText = 'Płatność zakończona — brak lokalnych danych zamówienia.';
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return;
    }

    const saved = JSON.parse(raw);

    try {
      emailjs.init('X068PC7dyoI2k-XlB');
    } catch (err) {}

    purchaseFeedback.style.display = 'block';
    purchaseFeedback.innerText = 'Płatność potwierdzona — wysyłam zamówienie...';

    emailjs.send('serviceid_gymello', 'template_lhauftr', saved)
      .then(() => {
        purchaseFeedback.innerText = '✅ Zamówienie wysłane! Sprawdź maila.';
        localStorage.removeItem('gymello_pending_order');
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })
      .catch((err) => {
        purchaseFeedback.innerText = '❌ Błąd przy wysyłce po płatności. Sprawdź logi.';
        console.error('EmailJS error after Stripe:', err);
      });
  } else if (status === 'cancel') {
    purchaseFeedback.style.display = 'block';
    purchaseFeedback.innerText = 'Płatność anulowana. Możesz spróbować ponownie.';
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
})();

