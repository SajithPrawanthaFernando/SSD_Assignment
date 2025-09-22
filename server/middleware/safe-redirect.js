const ALLOWED_PREFIXES = [
  "/", // home
  "/about",
  "/blog",
  "/contact",
  "/oauth/success",
  "/login",
  "/register",
  "/forgotpassword",
  "/resetpassword",
  "/tell-us-more",
  "/checkout",
  "/admin",
  "/user",
];

function safeRedirect(req, res) {
  const raw = (req.query.next || "/").trim();

  if (raw.includes("://") || raw.startsWith("//")) return res.redirect("/");

  let u;
  try {
    u = new URL(raw, "https://example.com");
  } catch {
    return res.redirect("/");
  }

  const ok = ALLOWED_PREFIXES.some(
    (p) => u.pathname === p || u.pathname.startsWith(p + "/")
  );

  const dest = ok ? u.pathname + u.search : "/";
  return res.redirect(dest);
}

module.exports = { ALLOWED_PREFIXES, safeRedirect };
