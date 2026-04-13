const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { supabaseClient } = require("../lib/supabaseClient");

const signup = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "email, password, and full_name are required" });
    }

    const { data: createdUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(500).json({ error: authError.message });
    }

    const user = createdUser.user;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        full_name,
        email: user.email,
        role: "user"
      });

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        full_name
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    return res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name || "",
        role: profile?.role || "user"
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: "access_token is required" });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(access_token);

    if (userError || !userData?.user?.id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { error } = await supabaseAdmin.auth.admin.signOut(access_token);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  signup,
  login,
  logout,
  me
};
