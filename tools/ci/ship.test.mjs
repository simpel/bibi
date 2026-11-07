// Tests for ship.mjs: node --test tools/ci/ship.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { branchName, prBody } from "./ship.mjs";

test("a branch is the slugged subject and the short sha", () => {
  const sha = "5f9bd791aaaabbbbccccdddd";
  assert.equal(
    branchName({ subject: "fix: example orders isolation test", sha }),
    "ship/fix-example-orders-isolation-test-5f9bd79",
  );
});

test("a long subject is cut without a trailing dash", () => {
  const subject = "feat: admin pages are sections with sidebar anchors, no tabs at all anymore";
  const branch = branchName({ subject, sha: "0e5dcbae11" });
  assert.match(branch, /^ship\/[a-z0-9-]+[a-z0-9]-0e5dcba$/);
  assert.ok(branch.length <= "ship/".length + 48 + 8);
});

test("the body lists every commit, then the footer", () => {
  const commits = [
    { sha: "bbbbbbb111", subject: "fix: two" },
    { sha: "aaaaaaa222", subject: "feat: one" },
  ];
  assert.equal(
    prBody({ commits, footer: "Signed" }),
    "Commits:\n\n- bbbbbbb fix: two\n- aaaaaaa feat: one\n\nSigned",
  );
  assert.equal(
    prBody({ commits: commits.slice(1), footer: "" }),
    "Commits:\n\n- aaaaaaa feat: one",
  );
});
