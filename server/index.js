const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

// メモリDB（簡易）
const users = {};
const invites = new Set(["INVITE-2026"]);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

function hash(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// トップ
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// 新規登録
app.post("/register", (req, res) => {
  const { invite, username, password } = req.body;

  if (!invites.has(invite)) {
    return res.status(400).send("招待コードが無効です");
  }
  if (users[username]) {
    return res.status(400).send("このユーザー名は使えません");
  }

  users[username] = {
    password: hash(password),
  };

  res.send("登録完了！");
});

// ログイン
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user || user.password !== hash(password)) {
    return res.status(401).send("ログイン失敗");
  }

  res.send("ログイン成功！");
});

app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
