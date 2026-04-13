const jwt = require("jsonwebtoken");
const { supabaseAdmin } = require("../lib/supabaseAdmin");

const isConfiguredJwtSecret = () =>
  Boolean(process.env.JWT_SECRET)
  && process.env.JWT_SECRET !== "replace_with_your_supabase_jwt_secret";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (isConfiguredJwtSecret()) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        id: decoded.sub,
        email: decoded.email || ""
      };

      return next();
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user?.id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || "",
      role: data.user.role
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = auth;
