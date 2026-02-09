const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 10000;

// 簡易メモリDB（再起動で消える）
const users = {};
const invites = new Set(["INVITE-2026"]);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// トップページ
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 新規登録
app.post("/register", async (req, res) => {
  const { invite, username, password } = req.body;

  if (!invites.has(invite)) {
    return res.status(400).send("招待コードが無効です");
  }

  if (!username || !password) {
    return res.status(400).send("未入力の項目があります");
  }

  if (users[username]) {
    return res.status(400).send("このユーザー名は使用できません");
  }

  const hash = await bcrypt.hash(password, 10);
  users[username] = { password: hash };

  res.send("登録完了！");
});

// ログイン
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user) {
    return res.status(401).send("ログイン失敗");
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).send("ログイン失敗");
  }

  res.send("ログイン成功！");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
