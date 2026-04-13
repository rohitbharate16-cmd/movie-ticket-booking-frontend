const { supabaseAdmin } = require("../lib/supabaseAdmin");

const adminOnly = async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = adminOnly;
