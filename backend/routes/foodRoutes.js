const express = require("express");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  listFood,
  createFood,
  bulkUpsertFood,
  updateFood,
  deleteFood,
  clearFood
} = require("../controllers/foodController");

const router = express.Router();

router.get("/", listFood);
router.post("/", auth, adminOnly, createFood);
router.post("/bulk", auth, adminOnly, bulkUpsertFood);
router.delete("/bulk/clear", auth, adminOnly, clearFood);
router.patch("/:id", auth, adminOnly, updateFood);
router.delete("/:id", auth, adminOnly, deleteFood);

module.exports = router;
