'use strict';

// CKEditor Media Embed steps: what webship-js and the Drupal core steps
// cannot say. They need the site's drush: CKEDITOR_MEDIA_EMBED_DRUSH is the
// drush command for the site under test (`drush` by default, e.g.
// `ddev drush` locally); CI sets it.

const assert = require('assert');
const { After, Given, Then, When } = require('@cucumber/cucumber');
const { spawnSync } = require('child_process');
const { friendly } = require('webship-js/tests/step-definitions/webship');

// The provider the module installs with (config/install).
const DEFAULT_PROVIDER = 'http://ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}';

// The route of tests/modules/ckeditor_media_embed_test, which answers oEmbed
// requests from tests/fixtures/oembed.
const FIXTURE_PROVIDER_PATH = '/ckeditor-media-embed-test/oembed';

// Where the test module records every url the provider was asked for.
const REQUESTED_URLS = 'ckeditor_media_embed_test.requested_urls';

// The plugin library, relative to the Drupal root.
const PLUGIN_LIBRARY = 'libraries/ckeditor5/plugins/media-embed';

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
 * Clear every cache from drush, then build the library definitions in that
 * same command-line process, for the administration theme and the default
 * theme, as a deployment does when it runs `drush cr` and a later drush
 * command renders. Library definitions are cached per theme, so the next web
 * request reuses what drush built. Before #3599775 the plugin script URL
 * held the host drush was given ("http://localhost" by default), and every
 * node form then failed to load the editor toolbar.
 *
 * Example #1: Given the library definitions are rebuilt by drush for "http://localhost"
 * Example #2: Given the library definitions are rebuilt by drush for "http://default"
 * Example #3: When the library definitions are rebuilt by drush for "https://example.com"
 * Example #4: And the library definitions are rebuilt by drush for "http://localhost:8080"
 * Example #5: Given the library definitions are rebuilt by drush for "http://127.0.0.1"
 */
Given(/^the library definitions are rebuilt by drush for "([^"]*)"$/, function (uri) {
  drush([`--uri=${uri}`, 'cache:rebuild']);
  const php = [
    "$themes = \\Drupal::config('system.theme');",
    "$initialization = \\Drupal::service('theme.initialization');",
    "$collector = \\Drupal::service('library.discovery.collector');",
    "foreach (array_unique(array_filter([$themes->get('admin'), $themes->get('default')])) as $theme) {",
    "  \\Drupal::theme()->setActiveTheme($initialization->getActiveThemeByName($theme));",
    '  $collector->reset();',
    "  $library = $collector->get('ckeditor_media_embed')['media-embed'] ?? NULL;",
    '  $collector->destruct();',
    "  echo $theme . ': ' . ($library['js'][0]['data'] ?? 'no media-embed library') . PHP_EOL;",
    '}',
  ].join(' ');
  const output = drush([`--uri=${uri}`, 'php:eval', php]);
  this.attach(`Library definitions built by drush for ${uri}:\n${output}`, 'text/plain');
});

/**
 * Point the module's provider at the test module, which answers like an
 * oEmbed provider from tests/fixtures/oembed (YouTube, YouTube Shorts,
 * Vimeo, X/Twitter, Instagram) and refuses an empty url with a 400, so no
 * third-party oEmbed service is called. Extra query parameters are provider
 * options, kept by the module as part of the provider URL. Scenarios that
 * use it are tagged @oembed-fixture, which puts the default provider back
 * after. The provider is set with drush; the settings form has scenarios of
 * its own.
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
});

After({ tags: '@oembed-fixture' }, function () {
  runDrush(['config:set', 'ckeditor_media_embed.settings', 'embed_provider', DEFAULT_PROVIDER, '-y']);
  runDrush(['state:delete', REQUESTED_URLS]);
});

/**
 * Assert what the local oEmbed fixture provider was asked for since the
 * scenario pointed the module at it.
 *
 * Example #1: Then the oEmbed fixture provider should not have been asked for an empty url
 * Example #2: Then the oEmbed fixture provider should have been asked for "https://vimeo.com/76979871"
 * Example #3: And the oEmbed fixture provider should have been asked for an empty url
 * Example #4: And the oEmbed fixture provider should not have been asked for "https://youtu.be/aqz-KE-bpKQ"
 * Example #5: Then the oEmbed fixture provider should have been asked for "https://x.com/drupal/status/1234567890123456789"
 */
Then(/^the oEmbed fixture provider should( not)* have been asked for (?:an empty url|"([^"]*)")$/, function (notCase, url) {
  const raw = drushPhp("echo json_encode(array_values(\\Drupal::state()->get($input['key'], [])));", { key: REQUESTED_URLS }).trim();
  const requested = JSON.parse(raw || '[]');
  // Cucumber passes no value for a group that did not match: an empty url.
  const wanted = url === undefined || url === null ? '' : url;
  const asked = requested.includes(wanted);
  assert.strictEqual(asked, !notCase,
    `Expected the oEmbed fixture provider ${notCase ? 'not ' : ''}to have been asked for ${wanted === '' ? 'an empty url' : `"${wanted}"`}; it was asked for: ${JSON.stringify(requested)}`);
});

/**
 * Create a content item with drush, with HTML no editor would write (an
 * <oembed> with an empty url, say), and remember it as the content item the
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
 * Example #5: When I run drush "status --field=drupal-version"
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
 * Example #4: And the drush output should contain "ckeditor_media_embed:update"
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
 * Example #1: Then the "editor.editor.full_html" configuration should not contain "MediaEmbed"
 * Example #2: Then the "editor.editor.full_html" configuration should contain "MediaEmbed"
 * Example #3: And the "filter.format.basic_html" configuration should contain "filter_ckeditor_media_embed"
 * Example #4: And the "filter.format.full_html" configuration should not contain "filter_ckeditor_media_embed"
 * Example #5: Then the "core.entity_view_display.node.article.default" configuration should not contain "ckeditor_media_embed_link_formatter"
 */
Then(/^the "([^"]*)" configuration should( not)* contain "([^"]*)"$/, function (name, notCase, text) {
  const yaml = drushPhp("echo \\Drupal\\Component\\Serialization\\Yaml::encode(\\Drupal::config($input['name'])->getRawData());", { name });
  assert.strictEqual(yaml.includes(text), !notCase,
    `Expected the "${name}" configuration ${notCase ? 'not ' : ''}to contain "${text}". It holds:\n${yaml.slice(0, 1500)}`);
});

/**
 * Move the CKEditor 5 Media embed plugin library out of the way, as on a
 * site that installed the module without the library. Scenarios that use it
 * are tagged @missing-library, which puts the library back after.
 *
 * Example #1: Given the CKEditor 5 Media embed plugin library is missing
 * Example #2: And the CKEditor 5 Media embed plugin library is missing
 * Example #3: Given the CKEditor 5 Media embed plugin library is missing
 * Example #4: When the CKEditor 5 Media embed plugin library is missing
 * Example #5: And the CKEditor 5 Media embed plugin library is missing
 */
Given(/^the CKEditor 5 Media embed plugin library is missing$/, function () {
  const moved = drushPhp(
    "$from = DRUPAL_ROOT . '/' . $input['library']; if (is_dir($from)) { rename($from, $from . '.off'); } echo is_dir($from) ? 'present' : 'moved';",
    { library: PLUGIN_LIBRARY },
  ).trim();
  assert.strictEqual(moved, 'moved', 'The plugin library could not be moved away.');
  drush(['cache:rebuild']);
});

/**
 * Put the plugin library back where the module looks for it.
 *
 * Example #1: When the CKEditor 5 Media embed plugin library is put back
 * Example #2: And the CKEditor 5 Media embed plugin library is put back
 * Example #3: Then the CKEditor 5 Media embed plugin library is put back
 * Example #4: When the CKEditor 5 Media embed plugin library is put back
 * Example #5: Given the CKEditor 5 Media embed plugin library is put back
 */
Given(/^the CKEditor 5 Media embed plugin library is put back$/, function () {
  restoreLibrary();
});

/**
 * Move the plugin library back from where the missing-library step put it.
 */
function restoreLibrary() {
  drushPhp(
    "$to = DRUPAL_ROOT . '/' . $input['library']; if (!is_dir($to) && is_dir($to . '.off')) { rename($to . '.off', $to); }",
    { library: PLUGIN_LIBRARY },
  );
  drush(['cache:rebuild']);
}

After({ tags: '@missing-library' }, function () {
  restoreLibrary();
});
