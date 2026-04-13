import {
  restoreSupabaseSessionFromBridge,
  supabase,
  isSupabaseConfigured,
  SUPABASE_SETUP_MESSAGE
} from "./supabase-client.js";
import { BACKEND_API_BASE } from "./api-config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id") || "";
  const movie = params.get("movie") || "";
  const show = params.get("show") || "";
  const loadingPanel = document.getElementById("confirmationLoading");
  const receiptPanel = document.getElementById("confirmationReceipt");
  const loadingTitle = document.getElementById("confirmationLoadingTitle");
  const loadingMessage = document.getElementById("confirmationLoadingMessage");
  const errorNode = document.getElementById("confirmationError");
  const PENDING_BOOKING_KEY = "movieDekhoPendingBookingDraft";
  const DASHBOARD_FLASH_KEY = "movieDekhoDashboardFlash";
  const checkoutDraftKey = (id) => `movieDekhoCheckoutDraft:${id}`;

  const parseJsonParam = (value, fallback = null) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const readStoredDraft = () => {
    try {
      if (sessionId) {
        const sessionDraft = sessionStorage.getItem(checkoutDraftKey(sessionId));
        if (sessionDraft) {
          return JSON.parse(sessionDraft);
        }
      }

      const latestDraft = sessionStorage.getItem(PENDING_BOOKING_KEY);
      return latestDraft ? JSON.parse(latestDraft) : null;
    } catch (error) {
      return null;
    }
  };

  const draft = parseJsonParam(params.get("draft"), null) || readStoredDraft() || {};
  const seats = Array.isArray(draft?.seats) ? draft.seats : [];
  const snacks = Array.isArray(draft?.snacks) ? draft.snacks : [];
  const bookingContext = draft?.show || null;
  const totalAmount = seats.reduce((sum, seat) => sum + (Number(seat?.price) || 0), 0);
  const snacksTotal = snacks.reduce((sum, item) => sum + ((Number(item?.price) || 0) * (Number(item?.quantity) || 0)), 0);
  const grandTotal = totalAmount + snacksTotal;

  const setLoadingCopy = (title, message) => {
    loadingTitle.textContent = title;
    loadingMessage.textContent = message;
  };

  const showError = (message) => {
    errorNode.textContent = message;
    loadingPanel.classList.remove("is-hidden");
    receiptPanel.classList.add("is-hidden");
  };

  const showReceipt = () => {
    document.getElementById("seatList").textContent = seats.length ? seats.map((seat) => seat.label || seat.id).join(", ") : "None";
    document.getElementById("ticketPrice").textContent = seats.length
      ? `Selected seats total: Rs. ${totalAmount}`
      : "No seats selected";
    document.getElementById("showSummary").textContent = bookingContext
      ? `${bookingContext.dateLabel} | ${bookingContext.timeLabel} | ${bookingContext.hallName} | ${bookingContext.format}`
      : "Show details unavailable";
    document.getElementById("foodList").textContent = snacks.length
      ? snacks.map((item) => `${item.name} x${item.quantity}`).join(", ")
      : "No snacks added";
    document.getElementById("foodAmount").textContent = `Rs. ${snacksTotal}`;
    document.getElementById("totalAmount").textContent = `Rs. ${grandTotal}`;

    loadingPanel.classList.add("is-hidden");
    receiptPanel.classList.remove("is-hidden");
  };

  const redirectToDashboard = (booking, fallbackMessage) => {
    const freeDiscount = Number(booking?.free_ticket_discount) || 0;
    const message = freeDiscount > 0
      ? `Booking confirmed. Your free ticket saved Rs. ${freeDiscount}.`
      : fallbackMessage;

    try {
      sessionStorage.setItem(DASHBOARD_FLASH_KEY, JSON.stringify({
        message,
        bookingId: booking?.id || "",
        createdAt: Date.now()
      }));
    } catch (error) {
      // Dashboard flash is optional.
    }

    setLoadingCopy("Booking successful", "Taking you to your dashboard now.");
    errorNode.textContent = "";
    loadingPanel.classList.remove("is-hidden");
    receiptPanel.classList.add("is-hidden");

    window.setTimeout(() => {
      window.location.href = "user-dashboard.html";
    }, 1400);
  };

  const getAccessToken = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error(SUPABASE_SETUP_MESSAGE);
    }

    await restoreSupabaseSessionFromBridge();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Please sign in again to complete your booking.");
    }

    return session.access_token;
  };

  const apiRequest = async (path, body) => {
    const response = await fetch(`${BACKEND_API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${await getAccessToken()}`
      },
      body: JSON.stringify(body)
    });

    let payload = null;

    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.error || `Request failed with status ${response.status}`);
    }

    return payload;
  };

  const getReturnBaseUrl = () => {
    if (!/^https?:$/i.test(window.location.protocol)) {
      return "";
    }

    return `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "")}`;
  };

  const startStripeCheckout = async () => {
    if (!seats.length || !(draft?.movieId || movie) || !(draft?.show?.showId || show)) {
      showError("Booking details are incomplete. Please select your seats again.");
      return;
    }

    setLoadingCopy(
      draft?.claimFreeTicket ? "Claiming your free ticket" : "Opening secure payment",
      draft?.claimFreeTicket
        ? "Checking today's free ticket and confirming your booking."
        : "You are being redirected to Stripe Checkout."
    );
    sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(draft));

    const checkout = await apiRequest("/payments/create-checkout-session", {
      draft,
      return_origin: getReturnBaseUrl()
    });

    if (checkout.free_booking) {
      try {
        sessionStorage.removeItem(PENDING_BOOKING_KEY);
      } catch (error) {
        // Storage cleanup is best-effort only.
      }

      redirectToDashboard(checkout.booking, "Free ticket claimed. Booking confirmed.");
      return;
    }

    sessionStorage.setItem(checkoutDraftKey(checkout.id), JSON.stringify(draft));
    window.location.href = checkout.url;
  };

  const confirmBooking = async () => {
    if (!sessionId) {
      await startStripeCheckout();
      return;
    }

    if (!seats.length) {
      showError("We could not find your booking details after payment. Please contact support with your Stripe session ID.");
      return;
    }

    setLoadingCopy("Confirming your booking", "Payment received. Saving your ticket now.");
    const booking = await apiRequest("/payments/confirm", {
      session_id: sessionId,
      draft
    });

    try {
      sessionStorage.removeItem(PENDING_BOOKING_KEY);
      sessionStorage.removeItem(checkoutDraftKey(sessionId));
    } catch (error) {
      // Storage cleanup is best-effort only.
    }

    redirectToDashboard(booking, "Payment successful. Booking confirmed.");
  };

  confirmBooking().catch((error) => {
    showError(error?.message || "Payment confirmation failed. Please try again.");
  });
});
