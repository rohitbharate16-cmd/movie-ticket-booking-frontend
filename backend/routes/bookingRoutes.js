const express = require("express");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingsByShow,
  deleteBooking
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", auth, createBooking);
router.get("/mine", auth, getMyBookings);
router.get("/", auth, adminOnly, getAllBookings);
router.get("/by-show/:show_id", auth, getBookingsByShow);
router.delete("/:id", auth, adminOnly, deleteBooking);

module.exports = router;
