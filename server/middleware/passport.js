const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../models/user");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/gauth/google/callback",
    },

    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error("No email from Google"));

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            username: profile.displayName || email.split("@")[0],
            email,
            password: "GOOGLE_OAUTH_ACCOUNT",
            firstname: profile.name?.givenName,
            lastname: profile.name?.familyName,
            role: "user",
          });
        }
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
  )
);

module.exports = passport;
