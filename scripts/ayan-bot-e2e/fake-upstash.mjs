import http from "node:http";
const db = new Map();
const exp = new Map();
let n = 0;
const alive = (k) => {
  if (exp.has(k) && exp.get(k) < Date.now()) {
    db.delete(k);
    exp.delete(k);
  }
  return db.has(k);
};
http
  .createServer((req, res) => {
    if (req.url === "/stats") {
      res.end(JSON.stringify({ n, keys: [...db.keys()] }));
      return;
    }
    if (req.headers.authorization !== "Bearer tok123") {
      res.writeHead(401);
      res.end();
      return;
    }
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      const cmds = JSON.parse(b);
      n += cmds.length;
      const out = cmds.map(([op, k, ...a]) => {
        switch (op) {
          case "INCRBY": {
            alive(k);
            const v = Number(db.get(k) ?? 0) + Number(a[0]);
            db.set(k, String(v));
            return { result: v };
          }
          case "EXPIRE": {
            if (!alive(k)) return { result: 0 };
            if (a[1] === "NX" && exp.has(k)) return { result: 0 };
            exp.set(k, Date.now() + a[0] * 1000);
            return { result: 1 };
          }
          case "GET":
            return { result: alive(k) ? db.get(k) : null };
          case "SET": {
            if (a.includes("NX") && alive(k)) return { result: null };
            db.set(k, a[0]);
            const i = a.indexOf("EX");
            if (i >= 0) exp.set(k, Date.now() + a[i + 1] * 1000);
            return { result: "OK" };
          }
          case "EXISTS":
            return { result: alive(k) ? 1 : 0 };
          default:
            return { error: "ERR unknown" };
        }
      });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(out));
    });
  })
  .listen(4556, "127.0.0.1");
