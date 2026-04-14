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
  const confirmationPoster = document.getElementById("confirmationPoster");
  const dashboardTicketLink = document.getElementById("dashboardTicketLink");

  const formatCurrency = (value) => `Rs. ${Number(value) || 0}`;

  const buildBookingCode = (booking) => String(
    booking?.stripe_session_id
    || booking?.id
    || booking?.created_at
    || booking?.movie_id
    || sessionId
    || "MOVIEDEKHO"
  )
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-8)
    .toUpperCase()
    || "MOVIEDEKHO";

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

  const publicApiRequest = async (path) => {
    const response = await fetch(`${BACKEND_API_BASE}${path}`);
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

  const getMoviePoster = async (booking) => {
    if (draft?.moviePoster) {
      return draft.moviePoster;
    }

    const directPoster = booking?.movie_poster || booking?.movie_image || booking?.image;

    if (directPoster) {
      return directPoster;
    }

    const movieId = booking?.movie_id || draft?.movieId || movie;

    if (!movieId) {
      return "";
    }

    try {
      const movies = await publicApiRequest("/movies");
      const movieMatch = (Array.isArray(movies) ? movies : []).find((entry) => entry.id === movieId);
      return movieMatch?.image || "";
    } catch (error) {
      return "";
    }
  };

  const getShowSummaryLine = (booking) => {
    const showDate = booking?.show_date || bookingContext?.dateLabel || "";
    const showTime = booking?.show_time || bookingContext?.timeLabel || "";
    const hall = booking?.hall_name || bookingContext?.hallName || "";
    const format = booking?.show_format || bookingContext?.format || "";

    return [showDate, showTime, hall, format].filter(Boolean).join(" | ") || "Show details unavailable";
  };

  const showError = (message) => {
    errorNode.textContent = message;
    loadingPanel.classList.remove("is-hidden");
    receiptPanel.classList.add("is-hidden");
  };

  const showReceipt = async (booking = null) => {
    const posterUrl = await getMoviePoster(booking);
    const bookingCode = buildBookingCode(booking);
    const movieTitle = [
      booking?.movie_name || draft?.movieName || movie || "Movie Dekho",
      booking?.movie_certificate || draft?.movieCertificate || ""
    ].filter(Boolean).join(" ");
    const showSummary = getShowSummaryLine(booking);
    const paidAmount = Number(booking?.total_amount);

    document.getElementById("confirmationMovieTitle").textContent = movieTitle;
    document.getElementById("confirmationShowSummary").textContent = showSummary;
    document.getElementById("confirmationBookingCode").textContent = bookingCode;
    document.getElementById("seatList").textContent = seats.length ? seats.map((seat) => seat.label || seat.id).join(", ") : "None";
    document.getElementById("ticketPrice").textContent = seats.length
      ? formatCurrency(totalAmount)
      : "No seats selected";
    document.getElementById("showSummary").textContent = showSummary;
    document.getElementById("foodList").textContent = snacks.length
      ? snacks.map((item) => `${item.name} x${item.quantity}`).join(", ")
      : "No snacks added";
    document.getElementById("foodAmount").textContent = formatCurrency(snacksTotal);
    document.getElementById("totalAmount").textContent = formatCurrency(
      Number.isFinite(paidAmount) ? paidAmount : grandTotal
    );

    if (confirmationPoster) {
      if (posterUrl) {
        confirmationPoster.src = posterUrl;
        confirmationPoster.alt = `${movieTitle} poster`;
      } else {
        confirmationPoster.removeAttribute("src");
        confirmationPoster.alt = "Movie poster unavailable";
      }
    }

    if (dashboardTicketLink) {
      dashboardTicketLink.href = `user-dashboard.html?booking=${encodeURIComponent(booking?.id || bookingCode)}`;
    }

    loadingPanel.classList.add("is-hidden");
    receiptPanel.classList.remove("is-hidden");
  };

  const storeDashboardFlash = (booking, fallbackMessage) => {
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

      storeDashboardFlash(checkout.booking, "Free ticket claimed. Booking confirmed.");
      await showReceipt(checkout.booking);
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

    storeDashboardFlash(booking, "Payment successful. Booking confirmed.");
    await showReceipt(booking);
  };

  confirmBooking().catch((error) => {
    showError(error?.message || "Payment confirmation failed. Please try again.");
  });
});
