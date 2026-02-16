const rentalForm = document.getElementById("rental-form");
const queryInput = document.getElementById("query");
const formFeedback = document.getElementById("form-feedback");
const resultCard = document.getElementById("result-card");

const clientName = document.getElementById("client-name");
const bikeNumber = document.getElementById("bike-number");
const startDate = document.getElementById("start-date");
const paidUntilDate = document.getElementById("paid-until-date");
const weeksToPay = document.getElementById("weeks-to-pay");
const paymentAmount = document.getElementById("payment-amount");

function showError(message) {
  formFeedback.textContent = message;
  formFeedback.classList.add("error");
  resultCard.classList.remove("visible");
  resultCard.setAttribute("aria-hidden", "true");
}

function clearError() {
  formFeedback.textContent = "";
  formFeedback.classList.remove("error");
}

function formatDebt(debt, weeks) {
  if (weeks <= 0 || debt <= 0) {
    return "0 ₽ (задолженности нет)";
  }

  const formattedDebt = new Intl.NumberFormat("ru-RU").format(debt);
  const weekWord = weeks === 1 ? "неделя" : weeks >= 2 && weeks <= 4 ? "недели" : "недель";
  return `${formattedDebt} ₽ (${weeks} ${weekWord})`;
}

function renderResult(data) {
  clientName.textContent = data.fullName;
  bikeNumber.textContent = data.bikeNumber;
  startDate.textContent = data.startDate;
  paidUntilDate.textContent = data.paidUntilDate;
  weeksToPay.textContent = String(data.weeksToPay);
  paymentAmount.textContent = formatDebt(data.debt, data.weeksToPay);

  resultCard.classList.add("visible");
  resultCard.setAttribute("aria-hidden", "false");
}

async function checkRent(query) {
  const response = await fetch("/check-rent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Не удалось выполнить проверку. Попробуйте позже.");
  }

  return payload;
}

rentalForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const rawValue = queryInput.value.trim();

  if (!rawValue) {
    showError("Введите ФИО или кодовое слово, чтобы выполнить проверку.");
    return;
  }

  clearError();

  try {
    const result = await checkRent(rawValue);
    renderResult(result);
  } catch (error) {
    showError(error.message);
  }
});
