const redactBody = (body) => {
  if (!body || typeof body !== "object") return undefined;

  const cloned = { ...body };
  if ("password" in cloned) {
    cloned.password = "[REDACTED]";
  }

  return cloned;
};

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();

  console.log(`[request] ${req.method} ${req.originalUrl}`, {
    query: req.query,
    body: redactBody(req.body),
  });

  res.on("finish", () => {
    console.log(
      `[response] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`
    );
  });

  next();
};

module.exports = { requestLogger };
