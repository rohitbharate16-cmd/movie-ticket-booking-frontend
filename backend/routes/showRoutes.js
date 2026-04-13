const express = require("express");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  listShows,
  createShow,
  bulkUpsertShows,
  deleteShow,
  deleteShowsByMovie,
  purgeShows
} = require("../controllers/showController");

const router = express.Router();

router.get("/", listShows);
router.post("/", auth, adminOnly, createShow);
router.post("/bulk", auth, adminOnly, bulkUpsertShows);
router.delete("/bulk/purge", auth, adminOnly, purgeShows);
router.delete("/by-movie/:movie_id", auth, adminOnly, deleteShowsByMovie);
router.delete("/:id", auth, adminOnly, deleteShow);

module.exports = router;
