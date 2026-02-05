const express = require("express");
const app = express();

// フォームのデータを受け取るため
app.use(express.urlencoded({ extended: true }));

// 投稿を保存する場所（DBの代わり）
const posts = [];

// トップページ（タイムライン）
app.get("/", (req, res) => {
  const timeline = posts
    .slice()
    .reverse()
    .map(p => `<div class="post">📝 ${p}</div>`)
    .join("");

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Misskey-like</title>
  <style>
    body {
      background: #0f172a;
      color: #e5e7eb;
      font-family: sans-serif;
      max-width: 600px;
      margin: auto;
      padding: 20px;
    }
    h1 { text-align: center; }
    textarea {
      width: 100%;
      height: 80px;
      background: #020617;
      color: white;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px;
    }
    button {
      margin-top: 10px;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      background: #3b82f6;
      color: white;
      cursor: pointer;
    }
    .post {
      background: #020617;
      border-radius: 8px;
      padding: 10px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>✨ Misskey-like ✨</h1>

  <form action="/post" method="POST">
    <textarea name="content" placeholder="いまなにしてる？"></textarea>
    <button type="submit">投稿</button>
  </form>

  <hr>
  ${timeline}
</body>
</html>
  `);
});

// 投稿処理
app.post("/post", (req, res) => {
  const content = req.body.content;
  if (content && content.trim() !== "") {
    posts.push(content);
  }
  res.redirect("/");
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log("Server running on " + port);
});
