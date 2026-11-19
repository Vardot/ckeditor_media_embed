# CKEditor Media Embed - functional test suite

## Functional acceptance tests (webship-js: Playwright + Cucumber)

A browser BDD acceptance suite under `tests/features/drupal/`, driven by
[webship-js](https://github.com/webship/webship-js) (Playwright + Cucumber)
with [`@webship-js/drupal-core-steps`](https://github.com/webship/drupal-core-steps)
(login by user handle, the rich text editor, form submits, messages, the page
title, PHP errors, the status of modules and checkboxes).

`tests/step-definitions/ckeditor_media_embed.steps.js` holds only what those
steps cannot say, all through drush: building the library definitions from
the command line (the regression test for #3599775), pointing the provider at
the local oEmbed fixture provider and reading what it was asked for, creating
content with HTML no editor writes, running the module's Drush commands,
moving the plugin library away and back, and reading active configuration.
The suite runs against a standard Drupal 11.4 site with the module, its
CKEditor 5 plugin library (`vardot/ckeditor5-media-embed-drupal` ~47.6.2) and
the `tests/recipes/ckeditor_media_embed_test` fixtures applied: Article (Body
on Full HTML, and a Video link field shown by the module's link formatter),
Basic page (Body on Basic HTML), the Media Embed button and the filter on both
formats, the Page writer and Text format administrator roles, and the test
module below.

| Feature | What it holds the module to |
|---|---|
| `00-01-01-users-login` | the testing users exist (created with drush) and every one can log in |
| `01-01-01-install` | the module is installed, the status report finds the plugin library and the CKEditor version, the help page explains the provider and the filter |
| `02-01-01-settings` | the provider settings page is under Configuration > Media, saves a new provider, refuses a value that is not a URL, and needs "administer filters" |
| `03-01-01-text-format` | Full HTML carries the Media Embed button and the "Convert Oembed tags to media embeds" filter |
| `04-01-01-editor-toolbar` | the CKEditor 5 toolbar renders on the article form with the Media Embed button, for the administrator and the Content editor, with a root-relative plugin URL and no JavaScript errors; the button opens the media URL form |
| `05-01-01-drush-cache-rebuild` | after drush rebuilds the caches and the library definitions for `http://localhost` or `http://default`, the editor still loads and the plugin URL is still root-relative (#3599775) |
| `06-01-01-embed-media` | a YouTube link inserted through the button is saved as `<oembed>` and the saved article renders the embed through the filter, with the provider's title on the iframe |
| `07-01-01-access-control` | the provider settings need "administer filters" (the Text format administrator saves them; anonymous, a user with no role and the Content editor are refused); the button follows the text format permissions (a Page writer without Full HTML gets no editor on the article body and the button on a Basic HTML page); an anonymous visitor sees the embed the filter renders |
| `08-01-01-providers` | Vimeo, X, Twitter, Instagram and YouTube Shorts (#3492499) links are saved as `<oembed>` and rendered with the provider's markup and class; the provider's title goes on the player; a provider option on the provider URL (`enablejsapi=1`) reaches the provider and the player (#3496881); a link no provider knows is refused in the media form |
| `09-01-01-basic-html` | Basic HTML carries the button and the filter and allows `<oembed url>`; the format guidelines explain the oEmbed tag; a Page writer embeds a video on a Basic HTML page |
| `10-01-01-link-formatter` | Manage display offers the "Oembed element using CKEditor Media Embed provider" formatter; a video link renders as the provider's player; a link the provider cannot embed stays a plain link, with a warning |
| `11-01-01-alignment` | with the embed selected the text alignment button is disabled, text next to it can still be aligned, and the embed is saved without alignment (#3394816, closed as working as designed) |
| `12-01-01-provider-errors` | a link the provider has no answer for, and a provider that cannot be reached, keep the `<oembed>` and show "Unable to retrieve ... at this time" without breaking the page |
| `13-01-01-empty-url` | an `<oembed>` with an empty url is not sent to the provider and shows no warning (#3600610) |
| `14-01-01-drush-commands` | Drush lists `ckeditor_media_embed:install` and `ckeditor_media_embed:update`; both ask before overwriting the installed library, and "no" downloads and changes nothing |
| `15-01-01-missing-library` | with the plugin library missing, the status report shows the error and the settings page shows the install instructions; both are whole again once it is back |
| `16-01-01-uninstall` | the module cannot be uninstalled while its filter is in use; once the filter is off the formats, it uninstalls and leaves no settings, filter, formatter, plugin script, button or status report line behind. The MediaEmbed toolbar item leaves the editor configuration too, and the format still saves (#3620365) |

### The oEmbed provider

The render scenarios do not call a third-party oEmbed service. The hidden test
module `tests/modules/ckeditor_media_embed_test` answers at
`/ckeditor-media-embed-test/oembed?url={url}` like a provider: it returns the
fixture of `tests/fixtures/oembed` that matches the url (YouTube, YouTube
Shorts, Vimeo, X/Twitter, Instagram), a 400 for an empty url as public
providers do, and a 404 for any other url. It records every url it was asked
for, and adds `enablejsapi=1` to the YouTube player when the provider URL
carries that option. The step `the media embed provider is the local oEmbed
fixture provider` points the module at it, and the `@oembed-fixture` tag puts
the default provider back after the scenario. The media hosts themselves are
blocked in the browser, so nothing is loaded from a third party.

The test module is hidden, so the site needs
`$settings['extension_discovery_scan_tests'] = TRUE;` in `settings.php`
before the fixtures recipe is applied.

### Tags

| Tag | Meaning |
|---|---|
| `@oembed-fixture` | the scenario uses the local oEmbed fixture provider; the default provider is put back after it |
| `@missing-library` | the scenario moves the plugin library away; it is put back after it |
| `@uninstall` | the feature uninstalls the module, so it runs last, in a CI group of its own |
| `@js-fail` | any JavaScript error fails the scenario |
| `@wip` | left out of every run: the scenario describes the expected behavior of an open bug |

### Running it

```bash
corepack enable
yarn install
./node_modules/.bin/playwright install chromium
CKEDITOR_MEDIA_EMBED_DRUSH="ddev drush" LAUNCH_URL=https://your-site.ddev.site yarn test
```

Run the `15-*` and `16-*` features last, or on a copy of the site: they move
the plugin library away and uninstall the module.

`CKEDITOR_MEDIA_EMBED_DRUSH` is the drush command for the site under test
(`drush` by default). `FEATURES` runs some features only, and `CUCUMBER_TAGS`
sets the tag expression (`not @wip` by default).

### In CI

`.gitlab-ci.yml` builds the site once in the `pre-test` stage
(`drupal/recommended-project` ~11.4.0, the module from this checkout, the
plugin library, the fixtures recipe and the testing users), then runs a smoke
canary and seven feature groups in parallel against `drush runserver`. Every
group publishes its HTML and PDF report, failure screenshots and videos as
artifacts, and the report stage merges them into one report.

These jobs run on merge requests, on the `*.x` branches and on tag pipelines,
so every release tag carries its own merged report in the artifacts of its
"Create reports" job.
