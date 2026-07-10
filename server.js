// Tiny static file server (dev only). Run: node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const root = __dirname;
const types = {".html":"text/html",".js":"text/javascript",".css":"text/css",
  ".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml"};
http.createServer((req,res)=>{
  let p;
  try { p = decodeURIComponent(req.url.split("?")[0]); }
  catch { res.writeHead(400); return res.end("bad request"); }
  if (p==="/") p="/index.html";
  // Reject null bytes outright, then confirm the resolved path is inside root.
  // path.relative avoids the "/root" vs "/root-evil" prefix pitfall of a bare
  // startsWith(root), and catches any ".." that path.join did not flatten away.
  if (p.indexOf("\0") !== -1){ res.writeHead(400); return res.end("bad request"); }
  const file = path.normalize(path.join(root, p));
  const rel = path.relative(root, file);
  if (rel.startsWith("..") || path.isAbsolute(rel)){ res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file,(err,data)=>{
    if (err){ res.writeHead(404); return res.end("not found"); }
    res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream"});
    res.end(data);
  });
}).listen(5173,()=>console.log("ReceiptVault dev server on http://localhost:5173"));
