const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  uploadMoviePoster,
  uploadFoodImage,
  deleteFile
} = require("../controllers/uploadController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/movie-poster", auth, adminOnly, upload.single("file"), uploadMoviePoster);
router.post("/food-image", auth, adminOnly, upload.single("file"), uploadFoodImage);
router.delete("/file", auth, adminOnly, deleteFile);

module.exports = router;
