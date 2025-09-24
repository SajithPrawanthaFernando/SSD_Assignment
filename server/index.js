const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const csurf = require("csurf");
const path = require("path");
const helmet = require("helmet");

const userrouter = require("./routes/customerRoutes");
const paymentrouter = require("./routes/paymentRoutes");
const appointmentRoutes = require("./routes/appointments");
const doctorRoutes = require("./routes/doctors");
const authrouter = require("./routes/auth");
const db = require("./databse");
const passport = require("./middleware/passport");

dotenv.config();
const app = express();

// Remove server leak globally
app.disable("x-powered-by");

// Use Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", "http://localhost:5000"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  helmet.hsts({
    maxAge: 31536000, 
    includeSubDomains: true,
    preload: true,
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);


// Global security headers for all requests
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' http://localhost:5000; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
  );
  next();
});

// CSRF protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

// Provide CSRF token endpoint
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Import routes
const StripeRoutes = require("./routes/stripe-route");

// Connect to MongoDB using the Singleton instance
const startServer = async () => {
  try {
    await db.connect(); // Use the Singleton instance to connect to the database
    console.log("MongoDB connection established successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the process if connection fails
  }

  // Set up routes
  app.use("/auth", userrouter);
  app.use("/api/stripe", StripeRoutes);
  app.use("/payment", paymentrouter);
  app.use("/api/appointments", appointmentRoutes);

  app.use(passport.initialize());
  app.use("/gauth", authrouter);

  app.use("/api/doctors", doctorRoutes);



  // Serve all static files with headers
  const staticPath = path.join(__dirname, "client/build");
  app.use(express.static(staticPath, {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' http://localhost:5000; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
      );
    },
  }));

  // Serve sitemap.xml if exists
  app.get("/sitemap.xml", (req, res) => {
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.sendFile(path.join(staticPath, "sitemap.xml"));
  });

  // Serve favicon.ico
  app.get("/favicon.ico", (req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.sendFile(path.join(staticPath, "favicon.ico"));
  });

  // Catch-all for React frontend
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running securely on port ${PORT}`);
  });
};

// Error handling middleware
app.use((err, req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' http://localhost:5000; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
  );
  res.status(err.code === "EBADCSRFTOKEN" ? 403 : 500).json({
    message: err.code === "EBADCSRFTOKEN" ? "Invalid CSRF token" : "Something broke!",
  });
});

startServer();
