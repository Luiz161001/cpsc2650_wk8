import express from "express";
import passport from "passport";
import GoogleStrategy from "passport-google-oidc";
import mongoose, { Schema } from "mongoose";

const router = express.Router();

async function connectToDatabase() {
    const uri = process.env.MONGOURI;
    try {
        await mongoose.connect(uri);
    }
    catch (err) { (err) => console.error("Not possible to connect to the database!", err) }
}

(async () => {
    await connectToDatabase();
})();

const userSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    displayName: { type: String, required: true },
    name: { type: Object, required: true }
});

const google_credentialsSchema = new mongoose.Schema({
    id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    issuer: { type: String, required: true },
    user_id: { type: Number, required: true },
});

const User = mongoose.model("User", userSchema);
const Google_credentials = mongoose.model("Google_Credentials", google_credentialsSchema);




// await week8.save();

// Configure the Google strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/oauth2/redirect/google',
    scope: ['profile']
}, async function verify(issuer, profile, cb) {
    try {
        let user = await User.findOne({ id: profile.id }).exec();
        if (!user) {
            user = new User({
                id: profile.id,
                displayName: profile.displayName,
                name: profile.name
            })
            await user.save();

            const newCredential = new Google_credentials({
                id: newUser._id,
                issuer: "Google",
                user_id: profile.id,
            });
            await newCredential.save();
        }

        cb(null, user);
    }
    catch (err) {
        return cb(err);
    }
}));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(async function (userId, cb) {
    try {
        let user = await User.findOne({ id: userId }).exec();
        // console.log(user);
        cb(null, user);
    }
    catch (err) {
        cb(err)
    }
});




/* GET /login
 *
 * This route prompts the user to log in.
 *
 * The 'login' view renders an HTML page, which contain a button prompting the
 * user to sign in with Google.  When the user clicks this button, a request
 * will be sent to the `GET /login/federated/accounts.google.com` route.
 */
// router.get('/login', function(req, res, next) {
//   res.render('login');
// });

/* GET /login/federated/accounts.google.com
 *
 * This route redirects the user to Google, where they will authenticate.
 *
 * Signing in with Google is implemented using OAuth 2.0.  This route initiates
 * an OAuth 2.0 flow by redirecting the user to Google's identity server at
 * 'https://accounts.google.com'.  Once there, Google will authenticate the user
 * and obtain their consent to release identity information to this app.
 *
 * Once Google has completed their interaction with the user, the user will be
 * redirected back to the app at `GET /oauth2/redirect/accounts.google.com`.
 */
router.get('/login/federated/google', passport.authenticate('google'));

/*
    This route completes the authentication sequence when Google redirects the
    user back to the application.  When a new user signs in, a user account is
    automatically created and their Google account is linked.  When an existing
    user returns, they are signed in to their linked account.
*/
router.get('/oauth2/redirect/google', passport.authenticate('google', {
    successReturnToOrRedirect: '/home',
    failureRedirect: '/login'
}));

/* POST /logout
 *
 * This route logs the user out.
 */
router.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) { return next(err); }
            res.redirect('/');
        })
    });
});

export default router;
