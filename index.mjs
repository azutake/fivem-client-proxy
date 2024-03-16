import express from "express";
import httpProxy from "http-proxy";
import bodyParser from "body-parser";
import streamify from "stream-array";
import { isIPv4, isIPv6 } from "is-ip"
const proxy = new httpProxy();

const app = express()

const PORT = 3000
const HOST = "127.0.0.1"

let rawBodySaver = function(req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

app.use(bodyParser.urlencoded({verify: rawBodySaver, extended: true}));
app.use((req, res, next) => {
  let send = res.send;
  res.send = c => {
      console.log(`Code: ${res.statusCode}`);
      console.log("Body: ", c);
      res.send = send;
      return res.send(c);
  }
  next();
});
app.post("/client", (req, res, next) => {
  // console.log(req.body)
  // console.log(req.headers)
  const clientIp = req.headers["cf-connecting-ip"]
  const privateFivem = req.headers["fivem-priv"]
  const publicFivemIpv4 = req.headers["fivem-public-v4"]
  const publicFivemIpv6 = req.headers["fivem-public-v6"]

  if(clientIp && req.body.method === "getEndpoints") {
    if(isIPv4(clientIp)) res.status(200).send(JSON.stringify([publicFivemIpv4]))
    if(isIPv6(clientIp)) res.status(200).send(JSON.stringify([publicFivemIpv6]))
    return
  }

  proxy.web(req, res, {
    target: `http://${privateFivem}/client`,
    buffer: streamify([req.rawBody]),
  }, next)
})

proxy.on('proxyRes', function (proxyRes, req, res) {
  proxyRes.on("data", chunk => {
    // console.log(chunk.toString("UTF-8"))
  })
});

app.listen(PORT, HOST, () => {
  console.log("Starting FiveM Client Proxy")
})