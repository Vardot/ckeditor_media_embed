'use strict';

// The functions passed to page.evaluate() run in the browser, next to CKEditor 4.
/* global CKEDITOR */

// CKEditor Media Embed steps: what webship-js and the Drupal core steps
// cannot say. The Drupal core steps drive CKEditor 5; this branch runs
// CKEditor 4, whose editing area is an iframe, so the editor steps below are
// this suite's own. The others need the site's drush:
// CKEDITOR_MEDIA_EMBED_DRUSH is the drush command for the site under test
// (`drush` by default, e.g. `ddev drush` locally); CI sets it.

const assert = require('assert');
const { After, Before, Given, Then, When } = require('@cucumber/cucumber');
const { spawnSync } = require('child_process');
const { friendly } = require('webship-js/tests/step-definitions/webship');

// The provider the module installs with (config/install).
const DEFAULT_PROVIDER = 'http://ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}';

// The route of tests/modules/ckeditor_media_embed_test, which answers oEmbed
// requests from tests/fixtures/oembed.
const FIXTURE_PROVIDER_PATH = '/ckeditor-media-embed-test/oembed';

// Where the test module records every url it was asked for: by the site
// (the filter and the link formatter), and by the editor, over JSONP.
const REQUESTED_URLS = 'ckeditor_media_embed_test.requested_urls';
const REQUESTED_URLS_JSONP = 'ckeditor_media_embed_test.requested_urls_jsonp';

// The CKEditor 4 plugins, relative to the Drupal root.
const PLUGIN_DIRECTORY = 'libraries/ckeditor/plugins';

// The configuration a @restores-config scenario may change.
const RESTORED_CONFIG = [
  'ckeditor_media_embed.settings',
  'editor.editor.full_html',
  'editor.editor.basic_html',
  'filter.format.full_html',
  'filter.format.basic_html',
];

// How long the editor may take to load, and an embed to arrive.
const EDITOR_TIMEOUT = 30000;
const EMBED_TIMEOUT = 15000;

// The CKEditor 4 widget of each button.
const WIDGETS = {
  'Media Embed': 'embed',
  'Semantic Media Embed': 'embedSemantic',
};

/**
 * Run drush against the site under test.
 *
 * @param {string[]} args - the drush arguments, one per element.
 * @return {{status: number, stdout: string, stderr: string}} what drush did.
 */
function runDrush(args) {
  const [command, ...prefix] = (process.env.CKEDITOR_MEDIA_EMBED_DRUSH || 'drush').split(/\s+/).filter(Boolean);
  const result = spawnSync(command, [...prefix, ...args], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  if (result.error) {
    throw friendly({
      message: `drush could not be started: ${result.error.message}`,
      hint: 'Set CKEDITOR_MEDIA_EMBED_DRUSH to the drush command of the site under test, e.g. "ddev drush".',
    });
  }
  return { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '' };
}

/**
 * Run drush and return its output, failing the step when drush fails.
 *
 * @param {string[]} args - the drush arguments, one per element.
 * @return {string} what drush printed on STDOUT.
 */
function drush(args) {
  const result = runDrush(args);
  if (result.status !== 0) {
    throw friendly({
      message: `drush ${args.join(' ')} failed with exit code ${result.status}.`,
      cause: `${result.stderr}\n${result.stdout}`.trim().slice(0, 800),
      hint: 'Set CKEDITOR_MEDIA_EMBED_DRUSH to the drush command of the site under test, e.g. "ddev drush".',
    });
  }
  return result.stdout;
}

/**
 * Run PHP code with drush php:eval, passing the values through base64 so no
 * quoting is needed.
 *
 * @param {string} php - PHP code that reads its input from $input.
 * @param {object} input - the values the code needs.
 * @return {string} what the code printed.
 */
function drushPhp(php, input = {}) {
  const encoded = Buffer.from(JSON.stringify(input)).toString('base64');
  return drush(['php:eval', `$input = json_decode(base64_decode('${encoded}'), TRUE); ${php}`]);
}

/**
 * Find the CKEditor 4 instance of a field and wait until it is ready.
 *
 * @param {import('playwright').Page} page - the page.
 * @param {string} field - the label of the field, or the id or name of its
 *   textarea.
 * @return {Promise<string>} the instance name, which is the textarea id.
 */
async function readyEditor(page, field) {
  const id = await page.evaluate((name) => {
    const byId = (value) => (value ? document.getElementById(value) : null);
    const norm = (text) => text.replace(/\s+/g, ' ').trim();
    // The label's own text: Drupal adds links to some labels, such as the
    // "(Edit summary)" of a text field with a summary.
    const ownText = (label) => norm(Array.from(label.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(' '));
    let element = byId(name) || document.getElementsByName(name)[0];
    if (!element) {
      const labels = Array.from(document.querySelectorAll('label'));
      const label = labels.find((candidate) => norm(candidate.textContent) === name)
        || labels.find((candidate) => ownText(candidate) === name);
      if (label) {
        element = label.control || byId(label.getAttribute('for'));
      }
    }
    return element ? element.id : null;
  }, field);
  if (!id) {
    throw friendly({
      message: `No field "${field}" was found on the page.`,
      hint: 'Use the label of the field, or the id or the name of its textarea.',
    });
  }
  try {
    await page.waitForFunction(
      (name) => window.CKEDITOR && CKEDITOR.instances[name] && CKEDITOR.instances[name].status === 'ready',
      id,
      { timeout: EDITOR_TIMEOUT },
    );
  }
  catch (error) {
    throw friendly({
      message: `The CKEditor 4 editor of the "${field}" field did not load.`,
      cause: error.message,
      hint: 'The field\'s text format must use CKEditor 4, and the user must be allowed to use it.',
    });
  }
  return id;
}

/**
 * Wait until a condition in the page holds, or fail with a message.
 *
 * @param {import('playwright').Page} page - the page.
 * @param {Function} condition - evaluated in the page with `arg`.
 * @param {*} arg - the value passed to the condition.
 * @param {string} message - the failure message.
 */
async function eventually(page, condition, arg, message) {
  try {
    await page.waitForFunction(condition, arg, { timeout: EMBED_TIMEOUT });
  }
  catch (error) {
    throw friendly({ message, cause: error.message });
  }
}

/**
 * Assert the field has a CKEditor 4 editor, or has none.
 *
 * Example #1: Then the "Body" field should have a CKEditor 4 editor
 * Example #2: Then the "Body" field should not have a CKEditor 4 editor
 * Example #3: And the "edit-body-0-value" field should have a CKEditor 4 editor
 * Example #4: And the "body[0][value]" field should not have a CKEditor 4 editor
 * Example #5: Then the "Body" field should have a CKEditor 4 editor
 */
Then(/^the "([^"]*)" field should( not)* have a CKEditor 4 editor$/, async function (field, notCase) {
  if (!notCase) {
    await readyEditor(this.page, field);
    return;
  }
  await this.page.waitForLoadState('load');
  // Drupal attaches the editors in its behaviors, right after the page load.
  await this.page.waitForTimeout(2000);
  const editors = await this.page.evaluate(() => (window.CKEDITOR ? Object.keys(CKEDITOR.instances) : []));
  assert.deepStrictEqual(editors, [], `Expected no CKEditor 4 editor for "${field}"; found: ${editors.join(', ')}`);
});

/**
 * Assert the CKEditor 4 toolbar of a field has a button, by the name the
 * button has in the text format's toolbar configuration.
 *
 * Example #1: Then the CKEditor 4 toolbar of the "Body" field should have the "Embed" button
 * Example #2: Then the CKEditor 4 toolbar of the "Body" field should have the "EmbedSemantic" button
 * Example #3: And the CKEditor 4 toolbar of the "Body" field should not have the "Embed" button
 * Example #4: And the CKEditor 4 toolbar of the "Body" field should have the "Bold" button
 * Example #5: Then the CKEditor 4 toolbar of the "edit-body-0-value" field should have the "Source" button
 */
Then(/^the CKEditor 4 toolbar of the "([^"]*)" field should( not)* have the "([^"]*)" button$/, async function (field, notCase, button) {
  const id = await readyEditor(this.page, field);
  const count = await this.page.locator(`#cke_${id} a.cke_button__${button.toLowerCase()}`).count();
  assert.strictEqual(count > 0, !notCase,
    `Expected the CKEditor 4 toolbar of "${field}" ${notCase ? 'not ' : ''}to have the "${button}" button.`);
});

/**
 * Press a button of the CKEditor 4 toolbar of a field, by the name the button
 * has in the text format's toolbar configuration.
 *
 * Example #1: When I click the "Embed" button in the CKEditor 4 toolbar of the "Body" field
 * Example #2: When I click the "EmbedSemantic" button in the CKEditor 4 toolbar of the "Body" field
 * Example #3: And I click the "Source" button in the CKEditor 4 toolbar of the "Body" field
 * Example #4: And we click the "Bold" button in the CKEditor 4 toolbar of the "Body" field
 * Example #5: When I click the "EmbedSemantic" button in the CKEditor 4 toolbar of the "edit-body-0-value" field
 */
When(/^(?:I |we )?click the "([^"]*)" button in the CKEditor 4 toolbar of the "([^"]*)" field$/, async function (button, field) {
  const id = await readyEditor(this.page, field);
  await this.page.locator(`#cke_${id} a.cke_button__${button.toLowerCase()}`).click();
});

/**
 * The visible CKEditor 4 dialog: the dialogs stay in the page once opened.
 *
 * @param {import('playwright').Page} page - the page.
 * @return {import('playwright').Locator} the dialog.
 */
function visibleDialog(page) {
  return page.locator('.cke_dialog').filter({ visible: true }).first();
}

/**
 * Assert a CKEditor 4 dialog, by its title, is open or closes.
 *
 * Example #1: Then the CKEditor 4 dialog "Media Embed" should be open
 * Example #2: Then the CKEditor 4 dialog "Media Embed" should not be open
 * Example #3: And the CKEditor 4 dialog "Link" should be open
 * Example #4: And the CKEditor 4 dialog "Media Embed" should not be open
 * Example #5: Then the CKEditor 4 dialog "Source" should not be open
 */
Then(/^the CKEditor 4 dialog "([^"]*)" should( not)* be open$/, async function (title, notCase) {
  const dialog = this.page.locator('.cke_dialog')
    .filter({ visible: true })
    .filter({ has: this.page.locator('.cke_dialog_title', { hasText: title }) });
  try {
    await dialog.first().waitFor({ state: notCase ? 'hidden' : 'visible', timeout: EMBED_TIMEOUT });
  }
  catch (error) {
    throw friendly({
      message: `Expected the CKEditor 4 dialog "${title}" ${notCase ? 'to close' : 'to be open'}.`,
      cause: error.message,
    });
  }
});

/**
 * Fill in a field of the open CKEditor 4 dialog, by its label.
 *
 * Example #1: When I fill in "URL" in the CKEditor 4 dialog with "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
 * Example #2: When I fill in "URL" in the CKEditor 4 dialog with "https://vimeo.com/76979871"
 * Example #3: And I fill in "URL" in the CKEditor 4 dialog with "https://youtu.be/aqz-KE-bpKQ"
 * Example #4: And we fill in "URL" in the CKEditor 4 dialog with "https://www.example.com/"
 * Example #5: When I fill in "URL" in the CKEditor 4 dialog with "https://x.com/drupal/status/1234567890123456789"
 */
When(/^(?:I |we )?fill in "([^"]*)" in the CKEditor 4 dialog with "([^"]*)"$/, async function (label, value) {
  const dialog = visibleDialog(this.page);
  await dialog.waitFor({ state: 'visible', timeout: EMBED_TIMEOUT });
  // A required field's label ends with an asterisk ("URL*").
  const field = dialog.locator('.cke_dialog_ui_labeled_label')
    .filter({ hasText: new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*?\\s*$`) })
    .locator('xpath=..')
    .locator('input, textarea')
    .first();
  if (await field.count() === 0) {
    throw friendly({ message: `The CKEditor 4 dialog has no "${label}" field.` });
  }
  await field.fill(value);
});

/**
 * Press a button of the open CKEditor 4 dialog, by its label.
 *
 * Example #1: When I press "OK" in the CKEditor 4 dialog
 * Example #2: When I press "Cancel" in the CKEditor 4 dialog
 * Example #3: And I press "OK" in the CKEditor 4 dialog
 * Example #4: And we press "OK" in the CKEditor 4 dialog
 * Example #5: When I press "Cancel" in the CKEditor 4 dialog
 */
When(/^(?:I |we )?press "([^"]*)" in the CKEditor 4 dialog$/, async function (label) {
  const dialog = visibleDialog(this.page);
  await dialog.waitFor({ state: 'visible', timeout: EMBED_TIMEOUT });
  await dialog.locator(`a.cke_dialog_ui_button[title="${label}"]`).click();
});

/**
 * Assert what the CKEditor 4 editor of a field holds, as the HTML it saves.
 * A positive check waits for an embed that is still loading. Escape a double
 * quote as \".
 *
 * Example #1: Then the CKEditor 4 field "Body" should contain "<oembed>https://www.youtube.com/watch?v=aqz-KE-bpKQ</oembed>"
 * Example #2: Then the CKEditor 4 field "Body" should contain "<div data-oembed-url=\"https://vimeo.com/76979871\">"
 * Example #3: And the CKEditor 4 field "Body" should not contain "<oembed>"
 * Example #4: And the CKEditor 4 field "Body" should contain "Our latest video."
 * Example #5: Then the CKEditor 4 field "Body" should not contain "data-oembed-url"
 */
Then(/^the CKEditor 4 field "([^"]*)" should( not)* contain "(.*)"$/, async function (field, notCase, expected) {
  const id = await readyEditor(this.page, field);
  const text = expected.replace(/\\"/g, '"');
  if (notCase) {
    const data = await this.page.evaluate((name) => CKEDITOR.instances[name].getData(), id);
    assert.ok(!data.includes(text), `Expected the CKEditor 4 field "${field}" not to contain ${text}. It holds:\n${data}`);
    return;
  }
  await eventually(this.page, ({ name, value }) => CKEDITOR.instances[name].getData().includes(value), { name: id, value: text },
    `Expected the CKEditor 4 field "${field}" to contain ${text}. It holds:\n${await this.page.evaluate((name) => CKEDITOR.instances[name].getData(), id)}`);
});

/**
 * Assert the editor shows the preview of an embed: the widget of the button
 * that inserted it, with the provider's markup inside.
 *
 * Example #1: Then the CKEditor 4 field "Body" should show a Semantic Media Embed preview of "iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']"
 * Example #2: Then the CKEditor 4 field "Body" should show a Media Embed preview of "iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']"
 * Example #3: And the CKEditor 4 field "Body" should show a Semantic Media Embed preview of "iframe[src^='https://player.vimeo.com/video/76979871']"
 * Example #4: And the CKEditor 4 field "Body" should show a Semantic Media Embed preview of "blockquote.twitter-tweet"
 * Example #5: Then the CKEditor 4 field "Body" should show a Media Embed preview of "iframe"
 */
Then(/^the CKEditor 4 field "([^"]*)" should show a (Media Embed|Semantic Media Embed) preview of "([^"]*)"$/, async function (field, button, selector) {
  const id = await readyEditor(this.page, field);
  const widget = WIDGETS[button];
  await eventually(this.page, ({ name, css }) => !!CKEDITOR.instances[name].document.$.querySelector(css),
    { name: id, css: `.cke_widget_wrapper.cke_widget_${widget} ${selector}` },
    `Expected a ${button} preview of "${selector}" in the CKEditor 4 field "${field}".`);
});

/**
 * Replace what the CKEditor 4 editor of a field holds.
 *
 * Example #1: When I fill in the CKEditor 4 field "Body" with "<p>Our latest video.</p>"
 * Example #2: When I fill in the CKEditor 4 field "Body" with "<p>Text above the video.</p>"
 * Example #3: And I fill in the CKEditor 4 field "Body" with "<p>Hello</p>"
 * Example #4: And we fill in the CKEditor 4 field "Body" with "<p>Text around the media.</p>"
 * Example #5: When I fill in the CKEditor 4 field "edit-body-0-value" with "<p>By id</p>"
 */
When(/^(?:I |we )?fill in the CKEditor 4 field "([^"]*)" with "(.*)"$/, async function (field, html) {
  const id = await readyEditor(this.page, field);
  await this.page.evaluate(({ name, value }) => new Promise((resolve) => {
    const editor = CKEDITOR.instances[name];
    editor.setData(value, {
      callback: () => {
        // Put the caret at the end, where a writer would insert the media.
        editor.focus();
        const range = editor.createRange();
        range.moveToElementEditEnd(editor.editable());
        range.select();
        resolve();
      },
    });
  }), { name: id, value: html.replace(/\\"/g, '"') });
});

/**
 * Paste text into the CKEditor 4 editor of a field, as a writer pastes a
 * link copied from the address bar: a real paste event, with the text in its
 * clipboard data, goes through the editor's whole paste pipeline.
 *
 * Example #1: When I paste "https://www.youtube.com/watch?v=aqz-KE-bpKQ" into the CKEditor 4 field "Body"
 * Example #2: When I paste "https://youtu.be/aqz-KE-bpKQ" into the CKEditor 4 field "Body"
 * Example #3: And I paste "https://vimeo.com/76979871" into the CKEditor 4 field "Body"
 * Example #4: And we paste "https://www.example.com/a-page-with-no-embed" into the CKEditor 4 field "Body"
 * Example #5: When I paste "Plain text" into the CKEditor 4 field "edit-body-0-value"
 */
When(/^(?:I |we )?paste "([^"]*)" into the CKEditor 4 field "([^"]*)"$/, async function (text, field) {
  const id = await readyEditor(this.page, field);
  await this.page.evaluate(({ name, value }) => {
    const editor = CKEDITOR.instances[name];
    editor.focus();
    const data = new DataTransfer();
    data.setData('text/plain', value);
    editor.editable().$.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  }, { name: id, value: text });
});

/**
 * Assert a CKEditor 4 notification is shown.
 *
 * Example #1: Then I should see the CKEditor 4 notification "This URL could not be automatically embedded."
 * Example #2: Then I should see the CKEditor 4 notification "could not be automatically embedded"
 * Example #3: And I should see the CKEditor 4 notification "Failed to fetch content"
 * Example #4: And we should see the CKEditor 4 notification "This URL could not be automatically embedded."
 * Example #5: Then I should see the CKEditor 4 notification "embedded"
 */
Then(/^(?:I |we )?should see the CKEditor 4 notification "([^"]*)"$/, async function (text) {
  await eventually(this.page, (value) => Array.from(document.querySelectorAll('.cke_notification'))
    .some((notification) => notification.textContent.includes(value)), text,
    `Expected the CKEditor 4 notification "${text}".`);
});

/**
 * Point the module's provider at the test module, which answers like an
 * oEmbed provider from tests/fixtures/oembed (YouTube, YouTube Shorts,
 * Vimeo, X/Twitter, Instagram) and refuses an empty url with a 400, so no
 * third-party oEmbed service is called. It answers the editor over JSONP and
 * the site over JSON. Extra query parameters are provider options, kept by
 * the module as part of the provider URL. Scenarios that use it are tagged
 * @oembed-fixture, which puts the default provider back after. The provider
 * is set with drush; the settings form has scenarios of its own.
 *
 * Example #1: Given the media embed provider is the local oEmbed fixture provider
 * Example #2: Given the media embed provider is the local oEmbed fixture provider with "enablejsapi=1"
 * Example #3: And the media embed provider is the local oEmbed fixture provider
 * Example #4: And the media embed provider is the local oEmbed fixture provider with "maxwidth=640"
 * Example #5: Given the media embed provider is the local oEmbed fixture provider with "enablejsapi=1&maxwidth=640"
 */
Given(/^the media embed provider is the local oEmbed fixture provider(?: with "([^"]*)")?$/, function (options) {
  const base = String(this.parameters.launchUrl || '').replace(/\/+$/, '');
  const extra = options ? `&${options}` : '';
  const provider = `${base}${FIXTURE_PROVIDER_PATH}?url={url}&callback={callback}${extra}`;
  drush(['config:set', 'ckeditor_media_embed.settings', 'embed_provider', provider, '-y']);
  drush(['state:delete', REQUESTED_URLS]);
  drush(['state:delete', REQUESTED_URLS_JSONP]);
});

After({ tags: '@oembed-fixture' }, function () {
  runDrush(['config:set', 'ckeditor_media_embed.settings', 'embed_provider', DEFAULT_PROVIDER, '-y']);
  runDrush(['state:delete', REQUESTED_URLS]);
  runDrush(['state:delete', REQUESTED_URLS_JSONP]);
});

/**
 * Read a list of urls the test module recorded.
 *
 * @param {string} key - the state key.
 * @return {string[]} the urls.
 */
function requestedUrls(key) {
  const raw = drushPhp("echo json_encode(array_values(\\Drupal::state()->get($input['key'], [])));", { key }).trim();
  return JSON.parse(raw || '[]');
}

/**
 * Assert what the site (the filter or the link formatter) asked the local
 * oEmbed fixture provider for since the scenario pointed the module at it.
 *
 * Example #1: Then the oEmbed fixture provider should not have been asked for an empty url
 * Example #2: Then the oEmbed fixture provider should have been asked for "https://vimeo.com/76979871"
 * Example #3: And the oEmbed fixture provider should have been asked for an empty url
 * Example #4: And the oEmbed fixture provider should not have been asked for "https://youtu.be/aqz-KE-bpKQ"
 * Example #5: Then the oEmbed fixture provider should have been asked for "https://x.com/drupal/status/1234567890123456789"
 */
Then(/^the oEmbed fixture provider should( not)* have been asked for (?:an empty url|"([^"]*)")$/, function (notCase, url) {
  const requested = requestedUrls(REQUESTED_URLS);
  // Cucumber passes no value for a group that did not match: an empty url.
  const wanted = url === undefined || url === null ? '' : url;
  assert.strictEqual(requested.includes(wanted), !notCase,
    `Expected the oEmbed fixture provider ${notCase ? 'not ' : ''}to have been asked for ${wanted === '' ? 'an empty url' : `"${wanted}"`}; it was asked for: ${JSON.stringify(requested)}`);
});

/**
 * Assert what the editor asked the local oEmbed fixture provider for, over
 * JSONP, to show the embed while the writer edits.
 *
 * Example #1: Then the editor should have asked the oEmbed fixture provider for "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
 * Example #2: Then the editor should not have asked the oEmbed fixture provider for "https://vimeo.com/76979871"
 * Example #3: And the editor should have asked the oEmbed fixture provider for "https://vimeo.com/76979871"
 * Example #4: And the editor should have asked the oEmbed fixture provider for "https://youtu.be/aqz-KE-bpKQ"
 * Example #5: Then the editor should not have asked the oEmbed fixture provider for "https://www.example.com/"
 */
Then(/^the editor should( not)* have asked the oEmbed fixture provider for "([^"]*)"$/, function (notCase, url) {
  const requested = requestedUrls(REQUESTED_URLS_JSONP);
  assert.strictEqual(requested.includes(url), !notCase,
    `Expected the editor ${notCase ? 'not ' : ''}to have asked the oEmbed fixture provider for "${url}"; it asked for: ${JSON.stringify(requested)}`);
});

/**
 * Create a content item with drush, with HTML no editor would write (an
 * <oembed> with no url, say), and remember it as the content item the
 * scenario created, for "I view the content item I created".
 *
 * Example #1: Given a published "article" content item titled "Empty oEmbed" exists with the "full_html" body:
 * Example #2: Given an unpublished "article" content item titled "Draft" exists with the "full_html" body:
 * Example #3: And a published "page" content item titled "About" exists with the "basic_html" body:
 * Example #4: Given a published "article" content item titled "Video" exists with the "full_html" body:
 * Example #5: And a published "page" content item titled "Embed" exists with the "basic_html" body:
 */
Given(/^an? (published|unpublished) "([^"]*)" content item titled "([^"]*)" exists with the "([^"]*)" body:$/, function (state, type, title, format, body) {
  const php = [
    "$node = \\Drupal\\node\\Entity\\Node::create(['type' => $input['type'], 'title' => $input['title'], 'uid' => 1, 'status' => $input['status'],",
    "'body' => ['value' => $input['body'], 'format' => $input['format']]]);",
    '$node->save();',
    'echo $node->id();',
  ].join(' ');
  const nid = drushPhp(php, { type, title, format, body, status: state === 'published' ? 1 : 0 }).trim();
  assert.ok(/^\d+$/.test(nid), `drush did not create the content item: ${nid}`);
  const base = String(this.parameters.launchUrl || '').replace(/\/+$/, '');
  this._drupalCreated = { nid, url: `${base}/node/${nid}` };
});

/**
 * Run a drush command against the site under test and keep what it printed
 * and its exit code for the steps below. The arguments are split on spaces.
 *
 * Example #1: When I run drush "list --filter=ckeditor_media_embed"
 * Example #2: When I run drush "ckeditor_media_embed:install --no"
 * Example #3: And I run drush "ckeditor_media_embed:update --no"
 * Example #4: When we run drush "config:get ckeditor_media_embed.settings"
 * Example #5: When I run drush "ckeditor_media_embed:install --yes"
 */
When(/^(?:I |we )?run drush "([^"]*)"$/, function (args) {
  this._drush = runDrush(args.split(/\s+/).filter(Boolean));
  this.attach(`drush ${args} (exit ${this._drush.status})\n${this._drush.stdout}\n${this._drush.stderr}`, 'text/plain');
});

/**
 * Assert what the last drush command printed, on STDOUT or STDERR.
 *
 * Example #1: Then the drush output should contain "ckeditor_media_embed:install"
 * Example #2: And the drush output should not contain "Downloading"
 * Example #3: Then the drush output should contain "This operation will overwrite plugins in"
 * Example #4: And the drush output should contain "Successfully installed CKEditor textmatch plugin."
 * Example #5: Then the drush output should not contain "Successfully installed"
 */
Then(/^the drush output should( not)* contain "([^"]*)"$/, function (notCase, text) {
  assert.ok(this._drush, 'No drush command was run in this scenario.');
  const output = `${this._drush.stdout}\n${this._drush.stderr}`;
  assert.strictEqual(output.includes(text), !notCase,
    `Expected the drush output ${notCase ? 'not ' : ''}to contain "${text}". It was:\n${output.slice(0, 1500)}`);
});

/**
 * Assert the exit code of the last drush command.
 *
 * Example #1: Then the drush command should succeed
 * Example #2: Then the drush command should fail
 * Example #3: And the drush command should succeed
 * Example #4: And the drush command should fail
 * Example #5: Then the drush command should succeed
 */
Then(/^the drush command should (succeed|fail)$/, function (outcome) {
  assert.ok(this._drush, 'No drush command was run in this scenario.');
  const succeeded = this._drush.status === 0;
  assert.strictEqual(succeeded, outcome === 'succeed',
    `Expected the drush command to ${outcome}; it exited with ${this._drush.status}:\n${this._drush.stderr}\n${this._drush.stdout}`.slice(0, 1500));
});

/**
 * Assert a configuration object exists, or does not, in active config.
 *
 * Example #1: Then the "ckeditor_media_embed.settings" configuration should not exist
 * Example #2: Then the "ckeditor_media_embed.settings" configuration should exist
 * Example #3: And the "editor.editor.full_html" configuration should exist
 * Example #4: And the "filter.format.basic_html" configuration should exist
 * Example #5: Then the "user.role.page_writer" configuration should exist
 */
Then(/^the "([^"]*)" configuration should( not)* exist$/, function (name, notCase) {
  const exists = drushPhp("echo \\Drupal::config($input['name'])->isNew() ? 'missing' : 'present';", { name }).trim() === 'present';
  assert.strictEqual(exists, !notCase, `Expected the "${name}" configuration ${notCase ? 'not ' : ''}to exist.`);
});

/**
 * Assert what a configuration object holds, as YAML, in active config.
 *
 * Example #1: Then the "editor.editor.full_html" configuration should contain "EmbedSemantic"
 * Example #2: Then the "filter.format.basic_html" configuration should contain "<oembed>"
 * Example #3: And the "ckeditor_media_embed.settings" configuration should not contain "plugins_version_installed: 4.99.0"
 * Example #4: And the "filter.format.full_html" configuration should not contain "filter_ckeditor_media_embed"
 * Example #5: Then the "core.entity_view_display.node.article.default" configuration should not contain "ckeditor_media_embed_link_formatter"
 */
Then(/^the "([^"]*)" configuration should( not)* contain "([^"]*)"$/, function (name, notCase, text) {
  const yaml = drushPhp("echo \\Drupal\\Component\\Serialization\\Yaml::encode(\\Drupal::config($input['name'])->getRawData());", { name });
  assert.strictEqual(yaml.includes(text), !notCase,
    `Expected the "${name}" configuration ${notCase ? 'not ' : ''}to contain "${text}". It holds:\n${yaml.slice(0, 1500)}`);
});

/**
 * Assert a configuration object matches its configuration schema, as the
 * configuration system checks it in tests.
 *
 * Example #1: Then the "editor.editor.full_html" configuration should match its schema
 * Example #2: Then the "editor.editor.basic_html" configuration should match its schema
 * Example #3: And the "ckeditor_media_embed.settings" configuration should match its schema
 * Example #4: And the "filter.format.full_html" configuration should match its schema
 * Example #5: Then the "filter.format.basic_html" configuration should match its schema
 */
Then(/^the "([^"]*)" configuration should match its schema$/, function (name) {
  const php = [
    '$checker = new class { use \\Drupal\\Core\\Config\\Schema\\SchemaCheckTrait;',
    'public function check($typed, $name, $data) { return $this->checkConfigSchema($typed, $name, $data); } };',
    "$result = $checker->check(\\Drupal::service('config.typed'), $input['name'], \\Drupal::config($input['name'])->getRawData());",
    'echo json_encode($result);',
  ].join(' ');
  const result = JSON.parse(drushPhp(php, { name }).trim());
  assert.strictEqual(result, true, `The "${name}" configuration does not match its schema: ${JSON.stringify(result)}`);
});

/**
 * Change a setting of the module with drush. Tag the scenario
 * @restores-config to put the settings back after it.
 *
 * Example #1: Given the CKEditor Media Embed "ckeditor_version" setting is "4.18.0"
 * Example #2: Given the CKEditor Media Embed "ckeditor_version" setting is "4.99.0"
 * Example #3: And the CKEditor Media Embed "plugins_version_installed" setting is "4.5.11"
 * Example #4: And the CKEditor Media Embed "ckeditor_version" setting is ""
 * Example #5: Given the CKEditor Media Embed "ckeditor_version" setting is "4.5.11"
 */
Given(/^the CKEditor Media Embed "([^"]*)" setting is "([^"]*)"$/, function (key, value) {
  drush(['config:set', 'ckeditor_media_embed.settings', key, value, '-y']);
  drush(['cache:rebuild']);
});

/**
 * Change the Auto Embed setting of a text format's CKEditor 4 editor with
 * drush, as its form does. Tag the scenario @restores-config to put it back.
 *
 * Example #1: Given the Auto Embed setting of the "full_html" text format is "embedsemantic"
 * Example #2: Given the Auto Embed setting of the "full_html" text format is "embed"
 * Example #3: And the Auto Embed setting of the "basic_html" text format is "embedsemantic"
 * Example #4: And the Auto Embed setting of the "full_html" text format is ""
 * Example #5: Given the Auto Embed setting of the "basic_html" text format is ""
 */
Given(/^the Auto Embed setting of the "([^"]*)" text format is "([^"]*)"$/, function (format, value) {
  drushPhp([
    "$editor = \\Drupal\\editor\\Entity\\Editor::load($input['format']);",
    '$settings = $editor->getSettings();',
    "$settings['plugins']['autoembed']['status'] = $input['value'];",
    '$editor->setSettings($settings);',
    '$editor->save();',
  ].join(' '), { format, value });
});

Before({ tags: '@restores-config' }, function () {
  const php = "$data = []; foreach ($input['names'] as $name) { $data[$name] = \\Drupal::config($name)->getRawData(); } echo json_encode($data);";
  this._savedConfig = JSON.parse(drushPhp(php, { names: RESTORED_CONFIG }).trim());
});

After({ tags: '@restores-config' }, function () {
  if (!this._savedConfig) {
    return;
  }
  drushPhp([
    'foreach ($input[\'data\'] as $name => $data) {',
    '  if (!$data) { continue; }',
    "  $entity = \\Drupal::service('config.manager')->loadConfigEntityByName($name);",
    '  if ($entity) {',
    "    $storage = \\Drupal::entityTypeManager()->getStorage($entity->getEntityTypeId());",
    '    $storage->updateFromStorageRecord($entity, $data)->save();',
    '  }',
    '  else { \\Drupal::configFactory()->getEditable($name)->setData($data)->save(); }',
    '}',
  ].join(' '), { data: this._savedConfig });
  runDrush(['cache:rebuild']);
});

/**
 * Move the CKEditor 4 plugins out of the way, as on a site that installed
 * the module and never ran its install command. Scenarios that use it are
 * tagged @missing-library, which puts the plugins back after.
 *
 * Example #1: Given the CKEditor 4 plugins are missing
 * Example #2: And the CKEditor 4 plugins are missing
 * Example #3: Given the CKEditor 4 plugins are missing
 * Example #4: When the CKEditor 4 plugins are missing
 * Example #5: And the CKEditor 4 plugins are missing
 */
Given(/^the CKEditor 4 plugins are missing$/, function () {
  const moved = drushPhp(
    "$from = DRUPAL_ROOT . '/' . $input['directory']; if (is_dir($from)) { rename($from, $from . '.off'); } echo is_dir($from) ? 'present' : 'moved';",
    { directory: PLUGIN_DIRECTORY },
  ).trim();
  assert.strictEqual(moved, 'moved', 'The CKEditor 4 plugins could not be moved away.');
  drush(['cache:rebuild']);
});

/**
 * Put the CKEditor 4 plugins back where the module looks for them.
 *
 * Example #1: When the CKEditor 4 plugins are put back
 * Example #2: And the CKEditor 4 plugins are put back
 * Example #3: Then the CKEditor 4 plugins are put back
 * Example #4: When the CKEditor 4 plugins are put back
 * Example #5: Given the CKEditor 4 plugins are put back
 */
Given(/^the CKEditor 4 plugins are put back$/, function () {
  restorePlugins();
});

/**
 * Move the plugins back from where the missing-plugins step put them,
 * replacing any a scenario downloaded in the meantime.
 */
function restorePlugins() {
  drushPhp(
    [
      "$to = DRUPAL_ROOT . '/' . $input['directory'];",
      "if (is_dir($to . '.off')) {",
      "  if (is_dir($to)) { \\Drupal::service('file_system')->deleteRecursive($to); }",
      "  rename($to . '.off', $to);",
      '}',
    ].join(' '),
    { directory: PLUGIN_DIRECTORY },
  );
  drush(['cache:rebuild']);
}

After({ tags: '@missing-library' }, function () {
  restorePlugins();
});
