import assert from "node:assert/strict";
import { test } from "node:test";
import { looksZh } from "@aihot/backend/editorial/writing";
import { isChineseBody, exportTranslation } from "@aihot/backend/publication/items";
import { stripTags } from "@aihot/backend/lib/text";

// Regression coverage for HTML attributes that contain `>` in real source pages.
test("stripTags ignores > inside quoted HTML attributes", () => {
  assert.equal(
    stripTags('<a title="Platforms > Xbox [11,780 articles]" href="/xbox">Xbox</a>'),
    "Xbox",
  );
  assert.equal(stripTags("<a title='Platforms > Xbox' href='/xbox'>A > B</a>"), "A > B");
  assert.equal(stripTags(`<a title = "don't > do" href = '/xbox'>Xbox</a>`), "Xbox");
  assert.equal(stripTags(`<a\ttitle\n=\f"Platforms > Xbox" href='/xbox'>Xbox</a>`), "Xbox");
});

test("stripTags does not pair quotes inside unquoted attribute values", () => {
  assert.equal(stripTags("<a title=don't>Xbox</a><p>next paragraph</p>"), "Xbox next paragraph");
  assert.equal(stripTags("<a title=don't>Xbox</a><p title=it's>next paragraph</p>"), "Xbox next paragraph");
  assert.equal(stripTags(`<a data-note=a='b title="Platforms > Xbox">Xbox</a>`), "Xbox");
});

test("stripTags keeps existing comment handling without swallowing following text", () => {
  for (const comment of ["<!-- note -->", "<!-->", "<!--->", "<!-- note --!>", "<!-- don't -->"]) {
    assert.equal(stripTags(`${comment}<p>visible article</p>`), "visible article");
  }
});

test("stripTags preserves existing spacing, entities, and hidden-content handling", () => {
  assert.equal(stripTags("<p>one</p><p>two</p>"), "one two");
  assert.equal(stripTags("a<br>b"), "a b");
  assert.equal(stripTags("<script>hidden</script><style>hidden</style><noscript>hidden</noscript>visible"), "visible");
  assert.equal(stripTags("&nbsp;&amp; &lt;code&gt; &quot;text&quot; &#39;one&apos;"), '& <code> "text" \'one\'');
});

test("stripTags keeps existing handling of incomplete tags and unclosed attribute quotes", () => {
  assert.equal(stripTags('text <a title="unfinished'), 'text <a title="unfinished');
  assert.equal(stripTags('text <a title="unfinished>visible'), "text");
  assert.equal(stripTags('<a ="unfinished>y">tail'), 'y">tail');
});

// Feeds escape text twice, so a title arrives as "AI&#8217;s leaders" and code as "mtime:&amp;lt;7d":
// character references are text too, and the text meant is what a reader expects.
test("stripTags decodes character references, also when a feed escaped them twice", () => {
  assert.equal(stripTags("AI&#8217;s leaders, AT&#038;T &#x2014; done&#8230;"), "AI’s leaders, AT&T — done…");
  assert.equal(stripTags("AI&amp;#8217;s &amp;lt;7d&gt;"), "AI’s <7d>");
  assert.equal(stripTags("Gemini &mdash; &ldquo;fast&rdquo; &amp;hellip; caf&eacute; 5&times;"), "Gemini — “fast” … café 5×");
  // Only references that end in a semicolon: an address keeps "&copy=" and an unknown name stays as written.
  assert.equal(stripTags("?a=1&copy=2 &unknown; AT&T"), "?a=1&copy=2 &unknown; AT&T");
});

test("writing and public reading agree about Portuguese, and not Spanish or English", () => {
  for (const body_text of ["La nueva consola de Sony llega a México y es más barata que el modelo anterior.", "The new Sony console is coming to Brazil and is cheaper than the last model."]) {
    assert.equal(looksZh(body_text), false);
    for (const language of [null, "es", "en"]) {
      assert.equal(isChineseBody({ language, body_text }), false);
      assert.equal(exportTranslation({ language, body_text, tr_html: "<p>Novo console lançado.</p>", tr_complete: true }), "<p>Novo console lançado.</p>");
    }
  }
  assert.equal(looksZh("Samsung anuncia Galaxy A57 com câmera de 50 MP e preço de R$ 2.499 no Brasil"), true);
  assert.equal(isChineseBody({ language: null, body_text: "A Apple lançou o novo iPhone, que chega ao Brasil em outubro com preço mais alto." }), true);
  assert.equal(isChineseBody({ language: "pt-BR", body_text: "API" }), true);
  assert.equal(isChineseBody({ language: "en", body_text: "An English article quoting não é com você." }), false);
});
