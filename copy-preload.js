const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "electron/preload.js");
const target = path.join(__dirname, "preload.js");

fs.copyFileSync(source, target);

console.log("✅ preload.js copied to root for packaging");
