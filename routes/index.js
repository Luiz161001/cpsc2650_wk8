import express from "express";

const router = express.Router();


function loggedIn(req, res, next) {
  req.isAuthenticated() ? next() : res.send("Not Authorized, please log in!");
}

/* GET home page. */
router.get("/", function (req, res) {
  res.render("index", { title: "Yay node!" });
});

router.get("/home", loggedIn, function (req, res) {
  res.render("home", { title: "Yay node!", user: req.user.displayName });
});

export default router;
