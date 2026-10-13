const fs = require("node:fs");
const net = require("node:net");

const output = process.env.NET_TRACE_FILE;
const originalCreateConnection = net.createConnection;

function describe(options) {
  if (typeof options === "string") return options;
  if (Array.isArray(options)) return options[0];
  return options && {
    host: options.host,
    hostname: options.hostname,
    port: options.port,
    path: options.path,
  };
}

net.createConnection = function tracedCreateConnection(options, ...args) {
  const detail = describe(options);
  const isLocal = detail && typeof detail === "object" &&
    (detail.host === "localhost" || detail.hostname === "localhost" ||
      detail.host === "127.0.0.1" || detail.hostname === "127.0.0.1");
  if (isLocal && detail.port && String(detail.port) !== "3000") {
    const record = `${JSON.stringify({ detail, stack: new Error().stack })}\n`;
    if (output) fs.appendFileSync(output, record);
    process.stderr.write(`NET_TRACE ${record}`);
  }
  return originalCreateConnection.call(this, options, ...args);
};
