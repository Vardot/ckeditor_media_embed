# CKEditor Media Embed - functional test suite

## Functional acceptance tests (webship-js: Playwright + Cucumber)

A browser BDD acceptance suite under `tests/features/drupal/`, driven by
[webship-js](https://github.com/webship/webship-js) (Playwright + Cucumber)
with [`@webship-js/drupal-core-steps`](https://github.com/webship/drupal-core-steps)
(login by user handle, the rich text editor, form submits, messages, the page
title, PHP errors, the status of modules and checkboxes).

`tests/step-definitions/ckeditor_media_embed.steps.js` holds only what those
steps cannot say: building the library definitions from drush (the regression
test for #3599775) and pointing the provider at a local oEmbed fixture. The
suite runs against a standard Drupal 11.4 site with the module, its CKEditor 5
plugin library (`vardot/ckeditor5-media-embed-drupal` ~47.6.2) and the
`tests/recipes/ckeditor_media_embed_test` fixtures applied.

| Feature | What it holds the module to |
|---|---|
| `00-01-01-users-login` | the testing users exist (created with drush) and every one can log in |
| `01-01-01-install` | the module is installed, the status report finds the plugin library and the CKEditor version, the help page explains the provider and the filter |
| `02-01-01-settings` | the provider settings page is under Configuration > Media, saves a new provider, refuses a value that is not a URL, and needs "administer filters" |
| `03-01-01-text-format` | Full HTML carries the Media Embed button and the "Convert Oembed tags to media embeds" filter |
| `04-01-01-editor-toolbar` | the CKEditor 5 toolbar renders on the article form with the Media Embed button, for the administrator and the Content editor, with a root-relative plugin URL and no JavaScript errors; the button opens the media URL form |
| `05-01-01-drush-cache-rebuild` | after drush rebuilds the caches and the library definitions for `http://localhost` or `http://default`, the editor still loads and the plugin URL is still root-relative (#3599775) |
| `06-01-01-embed-media` | a YouTube link inserted through the button is saved as `<oembed>` and the saved article renders the embed through the filter, with the provider's title on the iframe |

### The oEmbed provider

The render scenarios do not call a third-party oEmbed service. The step
`the media embed provider is the "youtube" oEmbed fixture` points the provider
at `tests/fixtures/oembed/youtube.json`, served by the site under test, and the
`@oembed-fixture` tag puts the default provider back after the scenario.
`CKEDITOR_MEDIA_EMBED_FIXTURES` is the path the site serves the fixtures at
(`/modules/contrib/ckeditor_media_embed/tests/fixtures/oembed` by default; CI
copies them to `/sites/default/files/oembed-fixtures`).

### Running it

```bash
corepack enable
yarn install
./node_modules/.bin/playwright install chromium
CKEDITOR_MEDIA_EMBED_DRUSH="ddev drush" LAUNCH_URL=https://your-site.ddev.site yarn test
```

`CKEDITOR_MEDIA_EMBED_DRUSH` is the drush command for the site under test
(`drush` by default). `FEATURES` runs some features only, and `CUCUMBER_TAGS`
sets the tag expression (`not @wip` by default).

### In CI

`.gitlab-ci.yml` builds the site once in the `pre-test` stage
(`drupal/recommended-project` ~11.4.0, the module from this checkout, the
plugin library, the fixtures recipe and the testing users), then runs a smoke
canary and the feature groups in parallel against `drush runserver`. Every
group publishes its HTML and PDF report, failure screenshots and videos as
artifacts, and the report stage merges them into one report.
