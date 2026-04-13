const Stripe = require("stripe");
const { supabaseAdmin } = require("../lib/supabaseAdmin");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const normalizeMoney = (value) => {
  const amount = Math.round(Number(value) || 0);
  return amount > 0 ? amount : 0;
};

const priceListingByDay = {
  Monday: { "2D": 10, "3D": 12, "4DX": 15 },
  Tuesday: { "2D": 10, "3D": 12, "4DX": 14 },
  Wednesday: { "2D": 8, "3D": 10, "4DX": 12 },
  Thursday: { "2D": 10, "3D": 12, "4DX": 15 },
  Friday: { "2D": 12, "3D": 15, "4DX": 22 },
  Saturday: { "2D": 12, "3D": 15, "4DX": 20 },
  Sunday: { "2D": 10, "3D": 13, "4DX": 17 }
};

const getPriceMultiplier = (format) => {
  if (format === "3D") {
    return { regular: 20, silver: 30, gold: 40 };
  }

  if (format === "4DX") {
    return { regular: 50, silver: 70, gold: 90 };
  }

  return { regular: 0, silver: 0, gold: 0 };
};

const getWeekdayName = (isoDate) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" })
    .format(new Date(`${isoDate}T00:00:00.000Z`));

const getTodayIsoDate = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${partMap.year}-${partMap.month}-${partMap.day}`;
};

const getFreeTicketClaim = async (userId, movieId, seatPrices) => {
  const today = getTodayIsoDate();
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("user_id", userId)
    .eq("movie_id", movieId)
    .eq("free_ticket_date", today)
    .gt("free_ticket_discount", 0)
    .limit(1);

  if (error) {
    if (String(error.message || "").includes("free_ticket_")) {
      throw new Error("Run the free ticket Supabase migration before accepting bookings.");
    }

    throw error;
  }

  const alreadyClaimed = Array.isArray(data) && data.length > 0;
  const discount = alreadyClaimed || !seatPrices.length ? 0 : Math.min(...seatPrices);

  return {
    claimed: discount > 0,
    date: discount > 0 ? today : null,
    discount
  };
};

const getBookingDraftTotals = async (userId, draft = {}) => {
  const seats = Array.isArray(draft.seats) ? draft.seats : [];
  const snacks = Array.isArray(draft.snacks) ? draft.snacks : [];
  const movieId = String(draft?.movieId || "").trim();
  const showId = String(draft?.show?.showId || "").trim();

  if (!movieId || !showId || !seats.length) {
    return { seats, snacks, seatTotal: 0, snacksTotal: 0, freeTicketDiscount: 0, payableAmount: 0 };
  }

  const { data: movieRow, error: movieError } = await supabaseAdmin
    .from("movies")
    .select("id, regular_price, silver_price, gold_price")
    .eq("id", movieId)
    .maybeSingle();

  if (movieError || !movieRow) {
    throw new Error("Movie pricing could not be found.");
  }

  const { data: showRow, error: showError } = await supabaseAdmin
    .from("shows")
    .select("id, movie_id, show_date, format")
    .eq("id", showId)
    .maybeSingle();

  if (showError || !showRow || showRow.movie_id !== movieId) {
    throw new Error("Show pricing could not be found.");
  }

  const format = String(showRow.format || "2D").toUpperCase();
  const dayPricing = priceListingByDay[getWeekdayName(showRow.show_date)] || priceListingByDay.Monday;
  const weekdayBoost = normalizeMoney(dayPricing?.[format]);
  const formatBoost = getPriceMultiplier(format);
  const tierPrices = {
    regular: normalizeMoney(movieRow.regular_price) + weekdayBoost + formatBoost.regular,
    silver: normalizeMoney(movieRow.silver_price) + weekdayBoost + formatBoost.silver,
    gold: normalizeMoney(movieRow.gold_price) + weekdayBoost + formatBoost.gold
  };

  const verifiedSeats = [];
  const seatTotal = seats.reduce((sum, seat) => {
    const tier = String(seat?.tier || "").toLowerCase();

    if (!Object.prototype.hasOwnProperty.call(tierPrices, tier)) {
      throw new Error("Selected seats include an unknown price tier.");
    }

    verifiedSeats.push({
      ...seat,
      price: tierPrices[tier]
    });

    return sum + tierPrices[tier];
  }, 0);
  const freeTicket = await getFreeTicketClaim(userId, movieId, verifiedSeats.map((seat) => seat.price));

  let snacksTotal = 0;
  let verifiedSnacks = snacks;

  if (snacks.length) {
    const snackIds = [...new Set(snacks.map((item) => String(item?.id || "").trim()).filter(Boolean))];
    const { data: snackRows, error: snackError } = await supabaseAdmin
      .from("food_items")
      .select("id, price")
      .in("id", snackIds);

    if (snackError || !Array.isArray(snackRows)) {
      throw new Error("Snack pricing could not be verified.");
    }

    const snackPriceById = new Map(snackRows.map((row) => [row.id, normalizeMoney(row.price)]));
    snacksTotal = snacks.reduce((sum, item) => {
      const id = String(item?.id || "").trim();
      const quantity = normalizeMoney(item?.quantity);

      if (!id || !snackPriceById.has(id) || !quantity) {
        throw new Error("Selected snacks include an unknown item.");
      }

      return sum + snackPriceById.get(id) * quantity;
    }, 0);
    verifiedSnacks = snacks.map((item) => ({
      ...item,
      price: snackPriceById.get(String(item?.id || "").trim())
    }));
  }

  return {
    seats: verifiedSeats,
    snacks: verifiedSnacks,
    seatTotal,
    snacksTotal,
    freeTicketDiscount: freeTicket.discount,
    freeTicketClaimed: freeTicket.claimed,
    freeTicketDate: freeTicket.date,
    totalAmount: seatTotal + snacksTotal,
    payableAmount: Math.max(0, seatTotal + snacksTotal - freeTicket.discount)
  };
};

const getSafeReturnOrigin = (req, origin) => {
  const candidate = String(origin || req.get("origin") || "").trim();

  if (/^https?:\/\/.+/i.test(candidate)) {
    return candidate.replace(/\/$/, "");
  }

  return "http://127.0.0.1:5500";
};

const getProfile = async (user) => {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return data || {};
};

const buildBookingPayload = async (user, draft, totals, stripeSessionId) => {
  const profile = await getProfile(user);
  const show = draft?.show || {};

  return {
    user_id: user.id,
    user_email: String(profile.email || user.email || ""),
    user_name: String(profile.full_name || user.email?.split("@")[0] || "Movie Lover"),
    movie_id: String(draft?.movieId || ""),
    movie_name: String(draft?.movieName || draft?.movieId || "Movie Dekho"),
    show_id: String(show.showId || ""),
    show_date: show.showDate || null,
    show_time: String(show.timeLabel || show.showTimeValue || ""),
    hall_name: show.hallName || null,
    show_format: show.format || null,
    seats: totals.seats,
    snacks: totals.snacks,
    seat_total: totals.seatTotal,
    snacks_total: totals.snacksTotal,
    total_amount: totals.payableAmount,
    free_ticket_discount: totals.freeTicketDiscount,
    free_ticket_date: totals.freeTicketDate,
    booking_status: "confirmed",
    stripe_session_id: stripeSessionId
  };
};

const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured on the backend." });
    }

    const { draft, return_origin } = req.body;
    const movieId = String(draft?.movieId || "").trim();
    const showId = String(draft?.show?.showId || "").trim();
    const movieName = String(draft?.movieName || movieId || "Movie Dekho").trim();
    const totals = await getBookingDraftTotals(req.user.id, draft);

    if (!movieId || !showId || !totals.seats.length) {
      return res.status(400).json({ error: "Movie, show, and selected seats are required." });
    }

    if (!totals.payableAmount) {
      const bookingPayload = await buildBookingPayload(req.user, draft, totals, null);
      delete bookingPayload.stripe_session_id;

      const { data, error } = await supabaseAdmin
        .from("bookings")
        .insert(bookingPayload)
        .select("*")
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({
        free_booking: true,
        booking: data
      });
    }

    const returnOrigin = getSafeReturnOrigin(req, return_origin);
    const paidTicketAmount = Math.max(0, totals.seatTotal - totals.freeTicketDiscount);
    const lineItems = [];

    if (paidTicketAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "inr",
          product_data: {
            name: `${movieName} tickets`,
            description: `${totals.seats.length} seat${totals.seats.length === 1 ? "" : "s"}`
          },
          unit_amount: paidTicketAmount * 100
        },
        quantity: 1
      });
    }

    if (totals.snacksTotal > 0) {
      lineItems.push({
        price_data: {
          currency: "inr",
          product_data: {
            name: "Movie Dekho snacks",
            description: `${totals.snacks.length} snack item${totals.snacks.length === 1 ? "" : "s"}`
          },
          unit_amount: totals.snacksTotal * 100
        },
        quantity: 1
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: req.user.id,
      customer_email: req.user.email || undefined,
      line_items: lineItems,
      metadata: {
        movie_id: movieId,
        show_id: showId,
        total_amount: String(totals.payableAmount),
        free_ticket_discount: String(totals.freeTicketDiscount)
      },
      success_url: `${returnOrigin}/confirm.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnOrigin}/payment-failed.html?session_id={CHECKOUT_SESSION_ID}`
    });

    return res.json({
      id: session.id,
      url: session.url
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const confirmPaidBooking = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured on the backend." });
    }

    const sessionId = String(req.body.session_id || "").trim();
    const draft = req.body.draft || {};

    if (!sessionId || !draft?.movieId || !draft?.show?.showId) {
      return res.status(400).json({ error: "Payment session and booking draft are required." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.client_reference_id !== req.user.id) {
      return res.status(403).json({ error: "This payment session belongs to another user." });
    }

    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Payment was not completed." });
    }

    const { data: existingBooking, error: lookupError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    const hasStripeSessionColumn = !lookupError;

    if (hasStripeSessionColumn && existingBooking) {
      return res.json(existingBooking);
    }

    const totals = await getBookingDraftTotals(req.user.id, draft);

    if (!totals.seats.length) {
      return res.status(400).json({ error: "Payment session and booking draft are required." });
    }

    if (Number(session.amount_total || 0) !== totals.payableAmount * 100) {
      return res.status(400).json({ error: "Paid amount does not match this booking." });
    }

    const bookingPayload = await buildBookingPayload(req.user, draft, totals, sessionId);
    if (!hasStripeSessionColumn) {
      delete bookingPayload.stripe_session_id;
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert(bookingPayload)
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createCheckoutSession,
  confirmPaidBooking
};
