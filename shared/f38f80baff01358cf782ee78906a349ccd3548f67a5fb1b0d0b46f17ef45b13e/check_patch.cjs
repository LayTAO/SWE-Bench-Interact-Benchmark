const fs = require("fs");
const path = process.argv[2];
if (!path || !fs.existsSync(path)) process.exit(2);
const text = fs.readFileSync(path, "utf8");
if (!text.trim()) process.exit(2);
for (const line of text.split(/\r?\n/)) {
  const match = line.match(/^(?:---|\+\+\+)\s+(?:a\/|b\/)?(.+)$/);
  if (!match) continue;
  const name = match[1].split(/\s+/)[0];
  // /dev/null is the standard old/new side of a file addition/deletion.
  if (name === "/dev/null") continue;
  if (name.includes("..") || name.startsWith("/")) {
    console.error("Unsafe patch path: " + name);
    process.exit(3);
  }
  if (name.startsWith("tests/") || name.startsWith("solution/") || name.startsWith("benchmark/")) process.exit(4);
}
