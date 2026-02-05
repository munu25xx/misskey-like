const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use(cookieParser());

/* ===== データ（簡易） ===== */
const INVITE_CODE = "KAZUHA";
const users = [];
const posts = [];

/* ===== 認証 ===== */
function auth(req, res, next) {
  const user = req.cookies.user;
  if (!user) return res.status(401).json({ error: "login required" });
  req.user = user;
  next();
}

/* ===== ページ ===== */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Misskey-like</title>
<style>
body { background:#111; color:#fff; font-family:sans-serif; }
input, button { padding:8px; margin:4px; }
.post { border-bottom:1px solid #333; padding:6px; }
.like { cursor:pointer; color:#aaa; }
</style>
</head>
<body>

<h2>Misskey-like</h2>

<div id="auth">
<input id="user" placeholder="ユーザー名">
<input id="pass" type="password" placeholder="パスワード">
<button onclick="login()">ログイン</button>
<br>
<input id="invite" placeholder="招待コード">
<button onclick="register()">新規登録</button>
</div>

<hr>

<textarea id="content" placeholder="なに書く？"></textarea><br>
<button onclick="post()">投稿</button>

<div id="timeline"></div>

<script>
async function login() {
  await fetch("/api/login", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      username:user.value,
      password:pass.value
    })
  });
  load();
}

async function register() {
  await fetch("/api/register", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      username:user.value,
      password:pass.value,
      invite:invite.value
    })
  });
  alert("登録完了");
}

async function post() {
  await fetch("/api/post", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ content:content.value })
  });
  content.value="";
  load();
}

async function like(id) {
  await fetch("/api/like/"+id, { method:"POST" });
  load();
}

async function load() {
  const res = await fetch("/api/posts");
  const data = await res.json();
  timeline.innerHTML = data.map(p =>
    \`<div class="post">
      <b>@\${p.user}</b><br>
      \${p.content}<br>
      <span class="like" onclick="like(\${p.id})">❤️ \${p.likes}</span>
    </div>\`
  ).join("");
}
load();
</script>

</body>
</html>
`);
});

/* ===== API ===== */
app.post("/api/register", (req,res)=>{
  const { username, password, invite } = req.body;
  if (invite !== INVITE_CODE) return res.sendStatus(403);
  users.push({ username, password });
  res.sendStatus(200);
});

app.post("/api/login", (req,res)=>{
  const { username, password } = req.body;
  const u = users.find(u=>u.username===username && u.password===password);
  if (!u) return res.sendStatus(401);
  res.cookie("user", username);
  res.sendStatus(200);
});

app.post("/api/post", auth, (req,res)=>{
  posts.unshift({
    id: Date.now(),
    user: req.user,
    content: req.body.content,
    likes: 0
  });
  res.sendStatus(200);
});

app.post("/api/like/:id", auth, (req,res)=>{
  const p = posts.find(p=>p.id==req.params.id);
  if (p) p.likes++;
  res.sendStatus(200);
});

app.get("/api/posts", (req,res)=>{
  res.json(posts);
});

/* ===== 起動 ===== */
app.listen(PORT, ()=>{
  console.log("Server running on", PORT);
});
