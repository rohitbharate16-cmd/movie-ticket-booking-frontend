const express = require("express");
const auth = require("../middleware/auth");
const {
  createCheckoutSession,
  confirmPaidBooking
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-checkout-session", auth, createCheckoutSession);
router.post("/confirm", auth, confirmPaidBooking);

module.exports = router;
