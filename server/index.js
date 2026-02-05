const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());
app.use(cookieParser());

/* ===== データ ===== */
const INVITE_CODE = "KAZUHA";
const users = [];
const posts = [];

/* ===== 認証 ===== */
function auth(req, res, next) {
  if (!req.cookies.user) {
    return res.status(401).json({ error: "login required" });
  }
  req.user = req.cookies.user;
  next();
}

/* ===== UI ===== */
app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Misskey-like</title>
<style>
:root {
  --bg:#0f0f14;
  --panel:#18181f;
  --accent:#4f46e5;
  --text:#e5e7eb;
}
* { box-sizing:border-box; }
body {
  margin:0;
  background:var(--bg);
  color:var(--text);
  font-family:system-ui;
}
header {
  padding:12px;
  text-align:center;
  font-weight:bold;
}
main {
  max-width:600px;
  margin:auto;
}
.card {
  background:var(--panel);
  border-radius:14px;
  padding:12px;
  margin:12px;
}
textarea,input {
  width:100%;
  background:#0b0b10;
  border:none;
  border-radius:10px;
  padding:10px;
  color:var(--text);
  margin-bottom:8px;
}
button {
  background:var(--accent);
  color:white;
  border:none;
  border-radius:999px;
  padding:8px 14px;
  cursor:pointer;
}
.post {
  border-bottom:1px solid #222;
  padding:8px 0;
}
.like {
  color:#aaa;
  cursor:pointer;
}
.modal {
  position:fixed;
  inset:0;
  background:#0008;
  display:flex;
  align-items:center;
  justify-content:center;
}
.hidden { display:none; }
</style>
</head>

<body>
<header>Misskey-like</header>

<main>
<div class="card">
<textarea id="content" placeholder="今なにしてる？"></textarea>
<button onclick="post()">投稿</button>
</div>

<div id="timeline" class="card"></div>
</main>

<div id="loginModal" class="modal">
<div class="card">
<h3>ログイン</h3>
<input id="user" placeholder="@ユーザー名">
<input id="pass" type="password" placeholder="パスワード">
<button onclick="login()">続ける</button>
<hr>
<h4>新規登録</h4>
<input id="invite" placeholder="招待コード">
<button onclick="register()">始める</button>
</div>
</div>

<script>
async function login(){
  const r = await fetch("/api/login",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      username:user.value,
      password:pass.value
    })
  });
  if(r.ok){
    loginModal.classList.add("hidden");
    load();
  } else alert("ログイン失敗");
}

async function register(){
  const r = await fetch("/api/register",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      username:user.value,
      password:pass.value,
      invite:invite.value
    })
  });
  if(r.ok) alert("登録完了");
  else alert("招待コードが違います");
}

async function post(){
  const r = await fetch("/api/post",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ content:content.value })
  });
  if(!r.ok) loginModal.classList.remove("hidden");
  content.value="";
  load();
}

async function like(id){
  await fetch("/api/like/"+id,{ method:"POST" });
  load();
}

async function load(){
  const r = await fetch("/api/posts");
  const d = await r.json();
  timeline.innerHTML = d.map(p=>\`
    <div class="post">
      <b>@\${p.user}</b><br>
      \${p.content}<br>
      <span class="like" onclick="like(\${p.id})">❤️ \${p.likes}</span>
    </div>
  \`).join("");
}
load();
</script>

</body>
</html>`);
});

/* ===== API ===== */

// 新規登録（暗号化）
app.post("/api/register", async (req,res)=>{
  const { username, password, invite } = req.body;
  if (invite !== INVITE_CODE) return res.sendStatus(403);
  const hash = await bcrypt.hash(password, 10);
  users.push({ username, password: hash });
  res.sendStatus(200);
});

// ログイン（比較）
app.post("/api/login", async (req,res)=>{
  const { username, password } = req.body;
  const u = users.find(u=>u.username===username);
  if (!u) return res.sendStatus(401);
  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return res.sendStatus(401);
  res.cookie("user", username);
  res.sendStatus(200);
});

// 投稿
app.post("/api/post", auth, (req,res)=>{
  posts.unshift({
    id: Date.now(),
    user: req.user,
    content: req.body.content,
    likes: 0
  });
  res.sendStatus(200);
});

// いいね
app.post("/api/like/:id", auth, (req,res)=>{
  const p = posts.find(p=>p.id==req.params.id);
  if (p) p.likes++;
  res.sendStatus(200);
});

// タイムライン
app.get("/api/posts", (req,res)=>{
  res.json(posts);
});

/* ===== 起動 ===== */
app.listen(PORT, ()=>{
  console.log("Server running on", PORT);
});
