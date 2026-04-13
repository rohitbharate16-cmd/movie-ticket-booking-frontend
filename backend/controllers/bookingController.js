const { supabaseAdmin } = require("../lib/supabaseAdmin");

const createBooking = async (req, res) => {
  try {
    const {
      movie_id,
      show_id,
      seats,
      snacks,
      seat_total,
      snacks_total,
      total_amount
    } = req.body;

    if (!movie_id || !show_id || !Array.isArray(seats)) {
      return res.status(400).json({ error: "movie_id, show_id, and seats are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        user_id: req.user.id,
        movie_id,
        show_id,
        seats,
        snacks: Array.isArray(snacks) ? snacks : [],
        seat_total: Number(seat_total) || 0,
        snacks_total: Number(snacks_total) || 0,
        total_amount: Number(total_amount) || 0
      })
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

const getMyBookings = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAllBookings = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getBookingsByShow = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("id, seats, user_id")
      .eq("show_id", req.params.show_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    if (booking.user_id !== req.user.id && profile?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { error } = await supabaseAdmin
      .from("bookings")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Booking deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingsByShow,
  deleteBooking
};
