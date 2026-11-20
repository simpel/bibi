// Tests for the icon button rule: node --test tools/lib/icon-button-rules.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { checkIconButtons } from "./icon-button-rules.mjs";

const app = "apps/web/src/features/x/ui/x.tsx";
const problems = (content, relPath = app) => checkIconButtons({ relPath, content });

test("flags an icon button without a label", () => {
  assert.equal(
    problems('<Button size="icon" onClick={() => go({ a: 1 })}><X /></Button>').length,
    1,
  );
  assert.equal(problems("<ConversationScrollButton />").length, 1);
});

test("accepts a label, a tooltip, a spread of the caller's props and other sizes", () => {
  assert.deepEqual(problems('<Button size="icon" aria-label={t("x")}><X /></Button>'), []);
  assert.deepEqual(
    problems('<Button\n  onClick={() => f({ a })}\n  size="icon"\n  aria-label={l}\n/>'),
    [],
  );
  assert.deepEqual(problems('<Button size="icon" tooltip={false}>1</Button>'), []);
  assert.deepEqual(problems('<Button size="icon" {...props} />'), []);
  assert.deepEqual(problems('<Button size="sm">Save</Button>'), []);
  assert.deepEqual(problems('<Button size="icon" />', "x.stories.tsx"), []);
});
