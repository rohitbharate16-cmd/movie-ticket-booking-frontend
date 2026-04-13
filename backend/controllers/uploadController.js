const path = require("path");
const { supabaseAdmin } = require("../lib/supabaseAdmin");

const BUCKET = "movie-posters";

const buildFilePath = (folder, explicitId, originalName = "") => {
  const ext = path.extname(originalName || "") || "";
  const baseName = explicitId || `${Date.now()}`;
  return `${folder}/${baseName}${ext}`;
};

const uploadFile = async (file, filePath) => {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) {
    throw error;
  }

  const { data } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return {
    public_url: data.publicUrl,
    path: filePath
  };
};

const uploadMoviePoster = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const filePath = buildFilePath("images", req.body.movie_id, req.file.originalname);
    const result = await uploadFile(req.file, filePath);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const uploadFoodImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    const filePath = buildFilePath("Food", req.body.item_id, req.file.originalname);
    const result = await uploadFile(req.file, filePath);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { path: storagePath } = req.body;

    if (!storagePath) {
      return res.status(400).json({ error: "path is required" });
    }

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "File deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadMoviePoster,
  uploadFoodImage,
  deleteFile
};
