import "dotenv/config.js";

import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";

import passport from "passport";
import session from "express-session";
import RedisStore from "connect-redis"
import { createClient } from "redis";

let redisClient = createClient();
redisClient.connect().catch(console.error);

let redisStore = new RedisStore({
  client: redisClient,
  prefix: "userID:",
})

// Constants
const port = process.env.PORT || 3000;

// Create http server
const app = express();

// view engine setup
app.set("views", path.join("views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join("public")));

app.use(session({
  store: redisStore,
  secret: 'keyboard cat',
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  // store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'));

app.use("/", indexRouter);
app.use("/", authRouter);

app.get("/print-sessions", (req, res) => {
  const sessionStore = req.sessionStore;
  sessionStore.all((err, sessions) => {
    if (err) {
      console.error("Error fetching sessions:", err);
      res.status(500).send("Failed to fetch sessions");
      return;
    }
    res.send(sessions);
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
