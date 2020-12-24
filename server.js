const http = require("http");
const compression = require("compression");

const applyCompression = compression();

const defaultContentSize = 1024;
http
  .createServer(function (req, res) {
    const url = new URL(req.url, "http://localhost:8080");

    if (process.env.COMPRESSION === "true") {
      applyCompression(req, res, () => {});
    }

    switch (url.pathname) {
      case "/redirect": {
        const toSize = parseInt(url.searchParams.get("toSize"));
        res.writeHead(302, {
          Location: `/content?size=${toSize > 0 ? toSize : defaultContentSize}`,
        });
        res.end();

        if (process.env.DOUBLE_END === "true") {
          res.end();
        }
        return;
      }
      case "/content": {
        const size = parseInt(url.searchParams.get("size"));
        const payload = Array.from(Array(size > 0 ? size : defaultContentSize))
          .map(() => `${Math.random()}`[2])
          .join("");

        res.writeHead(200, {
          "Content-Type": "text/plain",
        });

        res.write(payload);
        res.end();
        return;
      }
    }

    res.write("Navigate to /redirect or /content");
    res.end();
  })
  .listen(8080);
