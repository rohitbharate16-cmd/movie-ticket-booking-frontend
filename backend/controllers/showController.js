const { supabaseAdmin } = require("../lib/supabaseAdmin");

const listShows = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from("shows")
      .select("*")
      .order("show_date", { ascending: true })
      .order("show_time", { ascending: true });

    if (req.query.movie_id) {
      query = query.eq("movie_id", req.query.movie_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const upsertShows = async (shows) => supabaseAdmin
  .from("shows")
  .upsert(shows, { onConflict: "id" })
  .select("*");

const createShow = async (req, res) => {
  try {
    const show = req.body;

    if (!show || !show.id) {
      return res.status(400).json({ error: "Show payload with id is required" });
    }

    const { data, error } = await upsertShows([show]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const bulkUpsertShows = async (req, res) => {
  try {
    const { shows } = req.body;

    if (!Array.isArray(shows) || !shows.length) {
      return res.status(400).json({ error: "shows array is required" });
    }

    const { data, error } = await upsertShows(shows);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ count: data.length, shows: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteShow = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("shows")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Show deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteShowsByMovie = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("shows")
      .delete()
      .eq("movie_id", req.params.movie_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Shows deleted for movie" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const purgeShows = async (req, res) => {
  try {
    const { movie_ids } = req.body;

    if (!Array.isArray(movie_ids) || !movie_ids.length) {
      return res.status(400).json({ error: "movie_ids array is required" });
    }

    const { error } = await supabaseAdmin
      .from("shows")
      .delete()
      .in("movie_id", movie_ids);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Shows deleted for provided movies" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listShows,
  createShow,
  bulkUpsertShows,
  deleteShow,
  deleteShowsByMovie,
  purgeShows
};
