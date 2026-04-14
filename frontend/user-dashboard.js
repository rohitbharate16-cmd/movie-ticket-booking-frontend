import {
  clearTabSessionBridge,
  restoreSupabaseSessionFromBridge,
  supabase,
  isSupabaseConfigured,
  SUPABASE_SETUP_MESSAGE
} from "./supabase-client.js";
import { BACKEND_API_BASE } from "./api-config.js";

const DASHBOARD_FLASH_KEY = "movieDekhoDashboardFlash";

const greeting = document.querySelector("[data-dashboard-greeting]");
const logoutBtn = document.getElementById("dashboardLogoutBtn");
const flashNode = document.getElementById("dashboardFlash");
const bookingList = document.getElementById("dashboardBookingList");
const bookingCount = document.getElementById("bookingCount");
const freeTicketCount = document.getElementById("freeTicketCount");
const paidTotal = document.getElementById("dashboardPaidTotal");
const movieCatalog = new Map();
const dashboardBookings = [];

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const formatDateTime = (value) => {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

const formatCurrency = (value) => `Rs. ${Number(value) || 0}`;

const buildBookingCode = (booking) => String(
  booking.stripe_session_id
  || booking.id
  || booking.created_at
  || booking.movie_id
  || "MOVIEDEKHO"
)
  .replace(/[^a-zA-Z0-9]/g, "")
  .slice(-8)
  .toUpperCase()
  || "MOVIEDEKHO";

const getSeatLabels = (booking) => Array.isArray(booking.seats)
  ? booking.seats.map((seat) => String(seat.label || seat.id || seat || "").trim()).filter(Boolean)
  : [];

const getSnackSummary = (booking) => Array.isArray(booking.snacks) && booking.snacks.length
  ? booking.snacks.map((item) => `${item.name} x${item.quantity}`).join(", ")
  : "No snacks";

const getMovieMeta = (booking) => movieCatalog.get(booking.movie_id) || null;

const getHallLabel = (booking) => String(booking.hall_name || "Screen").trim();

const getPrimaryLanguage = (booking, movieMeta) => {
  const source = String(movieMeta?.languages || booking.show_format || "Hindi");
  return source.split(",")[0].trim() || "Hindi";
};

const getScreenLabel = (booking) => {
  const hallLabel = getHallLabel(booking);
  const match = hallLabel.match(/(\d+)/);

  if (match) {
    return `SCREEN ${match[1]}`;
  }

  return hallLabel.toUpperCase();
};

const formatTicketAmount = (value) => Number(value || 0).toFixed(2);

const formatTicketShowLine = (booking) => {
  const rawDate = String(booking.show_date || "").trim();
  const rawTime = String(booking.show_time || "").trim();
  const parsedDate = rawDate ? new Date(`${rawDate}T00:00:00`) : null;
  const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short"
      }).format(parsedDate)
    : rawDate;

  return [dateLabel, rawTime].filter(Boolean).join(" | ") || "Show timing unavailable";
};

const getTicketFilename = (booking) => {
  const movieSlug = String(booking.movie_name || booking.movie_id || "movie-dekho")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${movieSlug || "movie-ticket"}-${buildBookingCode(booking)}.pdf`;
};

const showDashboardMessage = (message, isError = false) => {
  flashNode.textContent = message;
  flashNode.hidden = false;
  flashNode.classList.toggle("error", isError);
};

const showFlash = () => {
  try {
    const flash = JSON.parse(sessionStorage.getItem(DASHBOARD_FLASH_KEY) || "null");
    sessionStorage.removeItem(DASHBOARD_FLASH_KEY);

    if (!flash?.message || Date.now() - Number(flash.createdAt || 0) > 5 * 60 * 1000) {
      return;
    }

    flashNode.textContent = flash.message;
    flashNode.hidden = false;
  } catch (error) {
    // No flash to show.
  }
};

const createDashboardError = (message, code = "DASHBOARD_ERROR") => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const getDashboardAuthContext = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error(SUPABASE_SETUP_MESSAGE);
  }

  await restoreSupabaseSessionFromBridge();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session?.user?.id) {
    throw createDashboardError("Please sign in to view your dashboard.", "AUTH_REQUIRED");
  }

  let profile = null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    profile = data;
  } catch (error) {
    profile = null;
  }

  return {
    accessToken: session.access_token,
    user: session.user,
    profile: profile || {
      id: session.user.id,
      full_name: session.user.user_metadata?.full_name || "",
      email: session.user.email || "",
      role: "user",
      created_at: session.user.created_at || ""
    }
  };
};

const apiRequest = async (path, accessToken) => {
  const response = await fetch(`${BACKEND_API_BASE}${path}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
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

const loadDashboardProfile = async (authContext) => {
  try {
    return await apiRequest("/auth/me", authContext.accessToken);
  } catch (error) {
    return authContext.profile;
  }
};

const loadDashboardBookings = async (authContext) => {
  try {
    const backendBookings = await apiRequest("/bookings/mine", authContext.accessToken);
    return {
      bookings: Array.isArray(backendBookings) ? backendBookings : [],
      source: "backend"
    };
  } catch (backendError) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", authContext.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw backendError;
    }

    return {
      bookings: Array.isArray(data) ? data : [],
      source: "supabase"
    };
  }
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

const loadMovieCatalog = async () => {
  const movies = await publicApiRequest("/movies");
  movieCatalog.clear();

  (Array.isArray(movies) ? movies : []).forEach((movie) => {
    movieCatalog.set(movie.id, movie);
  });
};

const ensureMovieCatalogLoaded = (() => {
  let pendingCatalogRequest = null;

  return async () => {
    if (movieCatalog.size) {
      return movieCatalog;
    }

    if (!pendingCatalogRequest) {
      pendingCatalogRequest = loadMovieCatalog()
        .catch((error) => {
          pendingCatalogRequest = null;
          throw error;
        });
    }

    await pendingCatalogRequest;
    return movieCatalog;
  };
})();

const fetchImageAsDataUrl = async (url) => {
  if (!url) {
    return null;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Image request failed with status ${response.status}`);
  }

  const blob = await response.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image data."));
    reader.readAsDataURL(blob);
  });
};

const getImageFormat = (dataUrl) => String(dataUrl || "").startsWith("data:image/png")
  ? "PNG"
  : "JPEG";

const drawRoundedRect = (doc, x, y, width, height, radius, style = "S") => {
  doc.roundedRect(x, y, width, height, radius, radius, style);
};

const loadScriptOnce = (src, isReady = () => false) => new Promise((resolve, reject) => {
  if (isReady()) {
    resolve();
    return;
  }

  const existingScript = [...document.scripts].find((script) => script.src === src);

  if (existingScript) {
    if (existingScript.dataset.loaded === "true" || isReady()) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => reject(new Error(`Timeout loading ${src}`)), 12000);

    existingScript.addEventListener("load", () => {
      window.clearTimeout(timeout);
      existingScript.dataset.loaded = "true";
      resolve();
    }, { once: true });
    existingScript.addEventListener("error", () => {
      window.clearTimeout(timeout);
      reject(new Error(`Failed to load ${src}`));
    }, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  const timeout = window.setTimeout(() => reject(new Error(`Timeout loading ${src}`)), 12000);
  script.addEventListener("load", () => {
    window.clearTimeout(timeout);
    script.dataset.loaded = "true";
    resolve();
  }, { once: true });
  script.addEventListener("error", () => {
    window.clearTimeout(timeout);
    reject(new Error(`Failed to load ${src}`));
  }, { once: true });
  document.head.appendChild(script);
});

const getJsPdfConstructor = () => window.jspdf?.jsPDF || window.jsPDF || null;

const ensureTicketLibraries = async () => {
  if (!getJsPdfConstructor()) {
    const jsPdfSources = [
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",
      "https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js"
    ];

    let loaded = false;

    for (const src of jsPdfSources) {
      try {
        await loadScriptOnce(src, () => Boolean(getJsPdfConstructor()));
        loaded = Boolean(getJsPdfConstructor());
      } catch (error) {
        loaded = false;
      }

      if (loaded) {
        break;
      }
    }
  }

  if (!window.QRCode?.toDataURL) {
    const qrSources = [
      "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js",
      "https://unpkg.com/qrcode@1.5.4/build/qrcode.min.js"
    ];

    for (const src of qrSources) {
      try {
        await loadScriptOnce(src, () => Boolean(window.QRCode?.toDataURL));
      } catch (error) {
        // Try the next source.
      }

      if (window.QRCode?.toDataURL) {
        break;
      }
    }
  }

  const jsPDF = getJsPdfConstructor();

  if (!jsPDF) {
    throw new Error("Ticket PDF tools could not be loaded. Refresh the page and try again.");
  }

  return {
    jsPDF,
    QRCode: window.QRCode || null
  };
};

const getPosterDataUrl = async (booking) => {
  const movieMeta = getMovieMeta(booking);
  const posterUrl = movieMeta?.image || booking.movie_poster || booking.movie_image || booking.image || "";

  if (!posterUrl) {
    return null;
  }

  try {
    return await fetchImageAsDataUrl(posterUrl);
  } catch (error) {
    return null;
  }
};

const withTimeout = (promise, ms, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    })
  ]);

const downloadTicketPdf = async (booking) => {
  await ensureMovieCatalogLoaded().catch(() => null);
  const { jsPDF } = await ensureTicketLibraries();

  const movieMeta = getMovieMeta(booking);
  const posterDataUrl = await getPosterDataUrl(booking);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cardX = 44;
  const cardY = 42;
  const cardWidth = pageWidth - 88;
  const cardHeight = pageHeight - 84;
  const ticketCode = buildBookingCode(booking);
  const seatLabels = getSeatLabels(booking);
  const seatLine = seatLabels.join(", ").toUpperCase() || "SEAT UNAVAILABLE";
  const formatLabel = String(booking.show_format || "2D").toUpperCase();
  const languageLabel = getPrimaryLanguage(booking, movieMeta);
  const showLine = formatTicketShowLine(booking);
  const screenLine = getScreenLabel(booking);
  const amountLine = formatTicketAmount(booking.total_amount);
  const certificate = String(movieMeta?.certificate || "").trim();
  const titleLine = `${String(booking.movie_name || booking.movie_id || "Movie Dekho").trim()}${certificate ? ` (${certificate})` : ""}`;
  const rightRailX = cardX + cardWidth - 52;
  const topSectionY = cardY + 28;
  const bottomSectionY = cardY + 248;
  const posterX = cardX + 34;
  const posterY = bottomSectionY + 26;
  const posterWidth = 132;
  const posterHeight = 176;
  const detailsX = cardX + 220;
  const totalBarY = cardY + cardHeight - 82;

  doc.setFillColor(232, 232, 232);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(255, 255, 255);
  drawRoundedRect(doc, cardX, cardY, cardWidth, cardHeight, 28, "F");

  doc.setTextColor(7, 17, 31);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(29);
  doc.text(titleLine, cardX + 34, topSectionY + 34, {
    maxWidth: cardWidth - 120
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.setTextColor(80, 92, 108);
  doc.text(`${languageLabel}, ${formatLabel}`, cardX + 34, topSectionY + 78, {
    maxWidth: cardWidth - 120
  });
  doc.text(showLine, cardX + 34, topSectionY + 122, {
    maxWidth: cardWidth - 120
  });

  doc.setDrawColor(224, 228, 235);
  doc.setLineWidth(1);
  doc.line(cardX + 26, bottomSectionY - 10, cardX + cardWidth - 26, bottomSectionY - 10);
  doc.setFillColor(232, 232, 232);
  doc.circle(cardX, bottomSectionY - 10, 10, "F");
  doc.circle(cardX + cardWidth, bottomSectionY - 10, 10, "F");

  if (posterDataUrl) {
    doc.addImage(
      posterDataUrl,
      getImageFormat(posterDataUrl),
      posterX,
      posterY,
      posterWidth,
      posterHeight,
      undefined,
      "FAST"
    );
  } else {
    doc.setFillColor(245, 245, 245);
    drawRoundedRect(doc, posterX, posterY, posterWidth, posterHeight, 14, "F");
    doc.setTextColor(80, 92, 108);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Movie Poster", posterX + (posterWidth / 2), posterY + 78, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(ticketCode, posterX + (posterWidth / 2), posterY + 100, { align: "center" });
  }

  doc.setTextColor(7, 17, 31);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.text(`${seatLabels.length || 1} Ticket(s)`, detailsX, posterY + 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(screenLine, detailsX, posterY + 70, {
    maxWidth: cardWidth - 280
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(22);
  doc.text(seatLine, detailsX, posterY + 102, {
    maxWidth: cardWidth - 280
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(`BOOKING ID: ${ticketCode}`, detailsX, posterY + 142, {
    maxWidth: cardWidth - 280
  });

  doc.setDrawColor(230, 232, 236);
  doc.line(cardX + 26, totalBarY, cardX + cardWidth - 26, totalBarY);
  doc.setTextColor(80, 92, 108);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(22);
  doc.text("M-Ticket", rightRailX, cardY + (cardHeight / 2), {
    angle: 270,
    align: "center"
  });

  doc.setTextColor(7, 17, 31);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Total Amount", cardX + 34, totalBarY + 36);
  doc.setFontSize(22);
  doc.text(amountLine, cardX + cardWidth - 34, totalBarY + 36, { align: "right" });

  doc.save(getTicketFilename(booking));
};

const renderBookings = (bookings) => {
  dashboardBookings.length = 0;
  dashboardBookings.push(...bookings);
  bookingCount.textContent = String(bookings.length);
  freeTicketCount.textContent = String(bookings.filter((booking) => Number(booking.free_ticket_discount) > 0).length);
  paidTotal.textContent = formatCurrency(bookings.reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0));

  if (!bookings.length) {
    bookingList.innerHTML = '<p class="movie-grid-empty">No bookings yet. Pick a movie and your first dashboard card will land here.</p>';
    return;
  }

  bookingList.innerHTML = bookings.map((booking) => {
    const seats = Array.isArray(booking.seats)
      ? booking.seats.map((seat) => seat.label || seat.id || seat).join(", ")
      : "Seats unavailable";
    const snacks = Array.isArray(booking.snacks) && booking.snacks.length
      ? booking.snacks.map((item) => `${item.name} x${item.quantity}`).join(", ")
      : "No snacks";
    const freeDiscount = Number(booking.free_ticket_discount) || 0;
    const showParts = [
      booking.show_date,
      booking.show_time,
      booking.hall_name,
      booking.show_format
    ].filter(Boolean).join(" | ");
    const bookingCode = buildBookingCode(booking);

    return `
      <article class="dashboard-booking-card">
        <div class="dashboard-booking-head">
          <div>
            <span class="admin-movie-badge">${escapeHtml(booking.booking_status || "confirmed")}</span>
            <h3>${escapeHtml(booking.movie_name || booking.movie_id || "Movie Dekho")}</h3>
          </div>
          <strong>${escapeHtml(formatCurrency(booking.total_amount))}</strong>
        </div>
        <p class="dashboard-booking-code">Booking ID: ${escapeHtml(bookingCode)}</p>
        <p>${escapeHtml(showParts || "Show details unavailable")}</p>
        <p>Seats: ${escapeHtml(seats)}</p>
        <p>Snacks: ${escapeHtml(snacks)}</p>
        <p>Booked: ${escapeHtml(formatDateTime(booking.created_at))}</p>
        ${freeDiscount > 0 ? `<p class="dashboard-free-ticket">Free ticket claimed: Rs. ${freeDiscount} off</p>` : ""}
        <div class="dashboard-booking-actions">
          <button type="button" class="secondary-action dashboard-ticket-download" data-booking-id="${escapeHtml(booking.id || bookingCode)}">Download Ticket PDF</button>
        </div>
      </article>
    `;
  }).join("");
};

const initDashboard = async () => {
  try {
    const authContext = await getDashboardAuthContext();
    const fallbackProfile = authContext.profile || {
      full_name: "",
      email: authContext.user?.email || "",
      role: "user"
    };

    greeting.textContent = `Signed in as ${fallbackProfile.full_name || fallbackProfile.email || "Movie Lover"}.`;
    logoutBtn.hidden = false;
    showFlash();
    renderBookings([]);

    const profilePromise = loadDashboardProfile(authContext)
      .catch(() => fallbackProfile);
    const bookingsPromise = loadDashboardBookings(authContext);
    const movieCatalogPromise = ensureMovieCatalogLoaded()
      .catch(() => null);

    const profile = await profilePromise;

    if (profile?.role !== "user") {
      window.location.href = "user-login.html?redirect=user-dashboard.html";
      return;
    }

    greeting.textContent = `Signed in as ${profile.full_name || profile.email || "Movie Lover"}.`;

    try {
      const { bookings, source } = await bookingsPromise;
      renderBookings(bookings);

      if (source === "supabase") {
        showDashboardMessage("Your dashboard loaded with backup booking data.");
      }
    } catch (error) {
      bookingList.innerHTML = '<p class="movie-grid-empty">We could not load your bookings right now. Your account session is still active, so please try refreshing in a moment.</p>';
      showDashboardMessage(error.message || "Failed to fetch the bookings data.", true);
    }

    await movieCatalogPromise;
  } catch (error) {
    bookingList.innerHTML = `<p class="movie-grid-empty">${escapeHtml(error.message)}</p>`;

    if (error.code === "AUTH_REQUIRED") {
      window.setTimeout(() => {
        window.location.href = "user-login.html?redirect=user-dashboard.html";
      }, 1200);
      return;
    }

    showDashboardMessage(error.message || "Dashboard failed to load.", true);
  }
};

bookingList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-booking-id]");

  if (!button) {
    return;
  }

  const bookingId = button.dataset.bookingId;
  const booking = dashboardBookings.find((entry) => String(entry.id || buildBookingCode(entry)) === bookingId);

  if (!booking) {
    showDashboardMessage("We could not find that booking right now.", true);
    return;
  }

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Preparing PDF...";

  try {
    await withTimeout(
      downloadTicketPdf(booking),
      30000,
      "Download timed out. Check your connection and try again."
    );
    showDashboardMessage(`Ticket ready: ${buildBookingCode(booking)}.`);
  } catch (error) {
    showDashboardMessage(error.message || "Ticket download failed.", true);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabase?.auth.signOut();
  clearTabSessionBridge();
  window.location.href = "index.html";
});

initDashboard();
