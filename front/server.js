const express = require("express");
const app = express();
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const config = require("./config")
console.log(config.BACK_HOST)

const request = axios.create({
  baseURL: `http://${config.BACK_HOST}:80`,
  withCredentials: true,
});

app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use((req, res, next) => {
  // console.log(`req.cookies :`, req.cookies);
  try {
    const { token } = req.cookies;
    const [header, payload, signature] = token.split(".");

    const decodedPl = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    );
    // console.log(`decodedPl :`,decodedPl);

    req.user = decodedPl;
  } catch (e) {
  } finally {
    next();
  }
});

app.get("/", (req, res) => {
  // console.log(`req.user :`, req.user);
  if (req.user === undefined) return res.render("index.html");
  const { userid, username } = req.user;
  res.render("index.html", {
    userid,
    username,
  });
});

app.get("/signup", (req, res) => {
  res.render("user/signup.html");
});

app.post("/signup", async (req, res) => {
  const response = await request.post("/users", {
    ...req.body,
  });
  // console.log(`response :`, response);
  const { userid, username, userpw } = response.data;

  res.redirect(
    `/welcome?userid=${userid}&username=${username}&userpw=${userpw}`
  );
});

app.get("/welcome", (req, res) => {
  const { userid, username, userpw } = req.query;
  res.render("user/welcome.html", {
    userid,
    username,
    userpw,
  });
});

app.get("/signin", (req, res) => {
  res.render("user/signin.html");
});

app.get("/profile", (req, res) => {
  res.render("user/profile.html", {...req.user});
});

app.get("/modify", (req, res) => {
  res.render("user/modify.html", {...req.user});
});


app.post("/modify", async (req, res) => {
  // console.log("modify :", req.body)
  const response = await request.put("/users", {...req.body})
  console.log("response :", response.data.token)
  res.cookie("token", response.data.token);
  await res.redirect("/profile")
});




app.listen(config.PORT, () => {
  console.log(`front server listening on ${config.PORT}`);
});

