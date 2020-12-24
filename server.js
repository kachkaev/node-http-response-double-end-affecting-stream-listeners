// @ts-check

const http = require("http");

const generatePayload = (size) =>
  Array.from(Array(size))
    .map(() => `${Math.random()}`[2])
    .join("");

const assertWriteResult = (result, expectedValue) => {
  if (!expectedValue && result) {
    throw new Error(
      "res.write unexpectedly returned true – try decreasing payload size to avoid this"
    );
  } else if (expectedValue && !result) {
    throw new Error(
      "res.write unexpectedly returned false – try increasing payload size to avoid this"
    );
  }
};

http
  .createServer(function (req, res) {
    const url = new URL(req.url, "http://localhost:8080");

    switch (url.pathname) {
      case "/redirect": {
        const writeEmptyBody =
          url.searchParams.get("writeEmptyBody") === "true";
        const endTwice = url.searchParams.get("endTwice") === "true";
        const contentType = url.searchParams.get("contentType");

        res.writeHead(302, {
          Location: `/content?type=${contentType}`,
        });

        if (writeEmptyBody) {
          res.write("");
        }

        res.end();
        if (endTwice) {
          res.end();
        }

        return;
      }

      case "/content": {
        const type = url.searchParams.get("type");

        if (type === "withDrain") {
          res.writeHead(200, {
            "Content-Type": "text/plain",
            "Transfer-Encoding": "chunked",
          });

          assertWriteResult(res.write(generatePayload(1024 * 100)), false);

          res.on("drain", () => {
            assertWriteResult(res.write(generatePayload(1024)), true);
            res.end();
          });
        } else {
          assertWriteResult(res.write(generatePayload(1024)), true);
          res.end();
        }

        return;
      }
    }

    res.write("Navigate to /redirect or /content");
    res.end();
  })
  .listen(8080);
