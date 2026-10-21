const http = require("http"), fs = require("fs"), path = require("path");
const root = "/tmp/bundle", pub = "/home/claude/work/frontend/public";
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  for (const base of [root, pub]) { const f = path.join(base, p); if (p !== "/" && fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); return fs.createReadStream(f).pipe(res); } }
  res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(path.join(root, "index.html")));
}).listen(5173, () => console.log("static on 5173"));
