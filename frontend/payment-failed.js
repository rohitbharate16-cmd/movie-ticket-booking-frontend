const PENDING_BOOKING_KEY = "movieDekhoPendingBookingDraft";
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id") || "";
const detail = document.getElementById("paymentFailureDetail");
const retryLink = document.getElementById("retryPaymentLink");

if (detail && sessionId) {
  detail.textContent = "Stripe did not return a completed payment for this checkout session.";
}

try {
  const draft = JSON.parse(sessionStorage.getItem(PENDING_BOOKING_KEY) || "null");

  if (draft?.movieId && draft?.show?.showId && retryLink) {
    retryLink.href = "confirm.html";
  } else if (retryLink) {
    retryLink.href = "index.html";
    retryLink.textContent = "Choose Seats Again";
  }
} catch (error) {
  if (retryLink) {
    retryLink.href = "index.html";
    retryLink.textContent = "Choose Seats Again";
  }
}
