'use strict';

// CKEditor Media Embed steps: what webship-js and the Drupal core steps
// cannot say. Both need the site's drush: CKEDITOR_MEDIA_EMBED_DRUSH is the
// drush command for the site under test (`drush` by default, e.g.
// `ddev drush` locally); CI sets it.

const { After, Given } = require('@cucumber/cucumber');
const { execFileSync } = require('child_process');
const { friendly } = require('webship-js/tests/step-definitions/webship');

// The provider the module installs with (config/install).
const DEFAULT_PROVIDER = 'http://ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}';

// Where the site serves the module's tests/fixtures/oembed folder.
const FIXTURES_PATH = process.env.CKEDITOR_MEDIA_EMBED_FIXTURES
  || '/modules/contrib/ckeditor_media_embed/tests/fixtures/oembed';

/**
 * Run drush against the site under test and return its output.
 *
 * @param {string[]} args - the drush arguments, one per element.
 * @return {string} what drush printed on STDOUT.
 */
function drush(args) {
  const [command, ...prefix] = (process.env.CKEDITOR_MEDIA_EMBED_DRUSH || 'drush').split(/\s+/).filter(Boolean);
  try {
    return execFileSync(command, [...prefix, ...args], { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch (err) {
    throw friendly({
      message: `drush ${args.join(' ')} failed.`,
      cause: String(err.stderr || err.message).trim().slice(0, 800),
      hint: 'Set CKEDITOR_MEDIA_EMBED_DRUSH to the drush command of the site under test, e.g. "ddev drush".',
    });
  }
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
 * Point the module's provider at a JSON fixture the test site serves itself,
 * so rendering an embed needs no third-party oEmbed service. The fixture
 * answers like the provider would for a YouTube link. Scenarios that use it
 * are tagged @oembed-fixture, which puts the default provider back after.
 *
 * Example #1: Given the media embed provider is the "youtube" oEmbed fixture
 * Example #2: Given the media embed provider is the "youtube" oEmbed fixture
 * Example #3: And the media embed provider is the "youtube" oEmbed fixture
 * Example #4: Given the media embed provider is the "youtube" oEmbed fixture
 * Example #5: And the media embed provider is the "youtube" oEmbed fixture
 */
Given(/^the media embed provider is the "([\w-]+)" oEmbed fixture$/, function (name) {
  const base = String(this.parameters.launchUrl || '').replace(/\/+$/, '');
  const provider = `${base}${FIXTURES_PATH}/${name}.json?url={url}&callback={callback}`;
  drush(['config:set', 'ckeditor_media_embed.settings', 'embed_provider', provider, '-y']);
});

After({ tags: '@oembed-fixture' }, function () {
  drush(['config:set', 'ckeditor_media_embed.settings', 'embed_provider', DEFAULT_PROVIDER, '-y']);
});
