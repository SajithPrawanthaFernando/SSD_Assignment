const ALLOWED_PREFIXES = [
  "/",
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

function getSafeNext(raw = "/") {
  const s = String(raw || "/").trim();

  if (s.includes("://") || s.startsWith("//")) return "/";

  try {
    const u = new URL(s, "https://example.com");
    const ok = ALLOWED_PREFIXES.some(
      (p) => u.pathname === p || u.pathname.startsWith(p + "/")
    );
    return ok ? u.pathname + u.search : "/";
  } catch {
    return "/";
  }
}

function safeRedirect(req, res) {
  const safe = getSafeNext(req.query.next || req.body.next || "/");
  return res.redirect(safe);
}

module.exports = { getSafeNext, safeRedirect, ALLOWED_PREFIXES };
