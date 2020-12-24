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
        const addEmptyBody = url.searchParams.get("addEmptyBody");
        const endTwice = url.searchParams.get("endTwice") === "true";
        const contentMode = url.searchParams.get("contentMode");

        res.writeHead(302, {
          Location: `/content?mode=${contentMode}`,
        });

        if (addEmptyBody === "viaWriteCall") {
          res.write("");
        }

        res.end(
          ["viaEndCall", "viaBothEndCalls"].includes(addEmptyBody)
            ? ""
            : undefined
        );

        if (endTwice) {
          res.end(
            ["viaSecondEndCall", "viaBothEndCalls"].includes(addEmptyBody)
              ? ""
              : undefined
          );
        }

        return;
      }

      case "/content": {
        const mode = url.searchParams.get("mode");

        if (mode === "withDrain") {
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
