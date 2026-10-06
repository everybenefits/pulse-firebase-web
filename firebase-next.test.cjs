const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { FIREBASE_SERVER_EXTERNAL_PACKAGES, firebaseResolveAliases, applyFirebaseWebpackAliases } = require("./firebase-next.cjs");

test("keeps the browser Firebase SDK in the bundler and Admin external", () => {
  assert.deepEqual(FIREBASE_SERVER_EXTERNAL_PACKAGES, ["firebase-admin"]);
});
test("uses one explicit Firestore web entry for import and require paths", () => {
  const aliases = firebaseResolveAliases(__dirname, "webpack");
  assert.equal(aliases["@firebase/firestore"], fs.realpathSync(path.join(path.dirname(fs.realpathSync(path.join(__dirname, "node_modules/firebase"))), "@firebase/firestore/dist/index.esm.js")));
  assert.ok(aliases["@firebase/app"]);
  assert.ok(aliases["@firebase/database"]);
});
test("uses relative Turbopack aliases", () => {
  const aliases = firebaseResolveAliases(__dirname, "turbopack");
  assert.ok(aliases["@firebase/firestore"].startsWith("./"));
  assert.equal(path.resolve(__dirname, aliases["@firebase/firestore"]), firebaseResolveAliases(__dirname, "webpack")["@firebase/firestore"]);
});
test("preserves existing webpack aliases", () => {
  const config = { resolve: { alias: { "existing": "target" } } };
  applyFirebaseWebpackAliases(config, __dirname);
  assert.equal(config.resolve.alias.existing, "target");
  assert.ok(config.resolve.alias["@firebase/firestore"]);
});
