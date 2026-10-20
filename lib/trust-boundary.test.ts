import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { decodeBase64 } from "./http";
import { parseMeta } from "./meta";
import { createSession, readSession } from "./session";
import { parseThemeId } from "./themes";

// env is read lazily, so setting it after the imports is enough
process.env.SESSION_SECRET = "0123456789abcdef0123456789abcdef";

test("parseMeta reads only the leading header", () => {
    const meta = parseMeta("/**\n * @name A\n * @description B\n * @type Snippet\n * @tags Dark, dark, x\n */\nbody{}");
    assert.equal(meta.name, "A");
    assert.equal(meta.type, "snippet");
    assert.deepEqual(meta.tags, ["dark", "x"]);
    assert.equal(parseMeta("body{} /** @name late */").name, undefined);
});

test("decodeBase64 accepts data URLs and rejects junk", () => {
    assert.equal(decodeBase64("data:text/css;base64,Ym9keXt9")?.toString(), "body{}");
    assert.equal(decodeBase64("not base64!"), null);
    assert.equal(decodeBase64(""), null);
});

test("readSession rejects tampered, extended and expired cookies", () => {
    const valid = createSession("111");
    assert.equal(readSession(valid)?.uid, "111");
    assert.equal(readSession(`${valid}.extra`), null);
    assert.equal(readSession(valid.replace(/.$/, c => (c === "A" ? "B" : "A"))), null);

    const payload = Buffer.from(JSON.stringify({ uid: "111", exp: 1 })).toString("base64url");
    const sig = createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest("base64url");
    assert.equal(readSession(`${payload}.${sig}`), null);
});

test("parseThemeId only allows positive INT ids", () => {
    assert.equal(parseThemeId("5"), 5);
    assert.equal(parseThemeId(5), 5);
    for (const bad of ["0", "-1", "1.5", "abc", "2147483648", null, true]) assert.equal(parseThemeId(bad), null);
});
