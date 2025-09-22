const router = require("express").Router();
const jwt = require("jsonwebtoken");
const passport = require("../middleware/passport");

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/gauth/login/failed",
    session: false,
  }),
  (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      process.env.KEY,
      { expiresIn: "90d" }
    );

    const redirectUrl = `${
      process.env.CLIENT_URL
    }/oauth/success?token=${encodeURIComponent(token)}`;

    return res.redirect(redirectUrl);
  }
);

router.get("/login/failed", (_req, res) => {
  res.status(401).json({ error: true, message: "Log in failure" });
});
const requireAuth = require("../middleware/requireAuth");
router.get("/me", requireAuth, (req, res) => {
  const { _id, email, username, role } = req.user;
  res.json({ id: _id, email, username, role });
});

module.exports = router;
