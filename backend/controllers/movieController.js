const { supabaseAdmin } = require("../lib/supabaseAdmin");

const listMovies = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("movies")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getMovie = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("movies")
      .select("*")
      .eq("id", req.params.id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const upsertMovies = async (movies) => {
  const { data, error } = await supabaseAdmin
    .from("movies")
    .upsert(movies, { onConflict: "id" })
    .select("*");

  return { data, error };
};

const createMovie = async (req, res) => {
  try {
    const movie = req.body;

    if (!movie || !movie.id) {
      return res.status(400).json({ error: "Movie payload with id is required" });
    }

    const { data, error } = await upsertMovies([movie]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const bulkUpsertMovies = async (req, res) => {
  try {
    const { movies } = req.body;

    if (!Array.isArray(movies) || !movies.length) {
      return res.status(400).json({ error: "movies array is required" });
    }

    const { data, error } = await upsertMovies(movies);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ count: data.length, movies: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateMovie = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("movies")
      .update(req.body)
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteMovie = async (req, res) => {
  try {
    const movieId = req.params.id;

    const { error: showsError } = await supabaseAdmin
      .from("shows")
      .delete()
      .eq("movie_id", movieId);

    if (showsError) {
      return res.status(500).json({ error: showsError.message });
    }

    const { error: movieError } = await supabaseAdmin
      .from("movies")
      .delete()
      .eq("id", movieId);

    if (movieError) {
      return res.status(500).json({ error: movieError.message });
    }

    return res.json({ message: "Movie and its shows deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const purgeMovies = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: "ids array is required" });
    }

    const { error: showsError } = await supabaseAdmin
      .from("shows")
      .delete()
      .in("movie_id", ids);

    if (showsError) {
      return res.status(500).json({ error: showsError.message });
    }

    const { error: movieError } = await supabaseAdmin
      .from("movies")
      .delete()
      .in("id", ids);

    if (movieError) {
      return res.status(500).json({ error: movieError.message });
    }

    return res.json({ message: "Movies and related shows deleted", count: ids.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listMovies,
  getMovie,
  createMovie,
  bulkUpsertMovies,
  updateMovie,
  deleteMovie,
  purgeMovies
};
