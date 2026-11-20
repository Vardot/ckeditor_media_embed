# CKEditor Media Embed 8.x-1.x - functional test suite

## Functional acceptance tests (webship-js: Playwright + Cucumber)

A browser BDD acceptance suite under `tests/features/drupal/`, driven by
[webship-js](https://github.com/webship/webship-js) (Playwright + Cucumber)
with [`@webship-js/drupal-core-steps`](https://github.com/webship/drupal-core-steps)
(login by user handle, form submits, messages, the page title, PHP errors, the
status of modules and checkboxes).

8.x-1.x is the CKEditor 4 branch. The Drupal core steps drive CKEditor 5, so
`tests/step-definitions/ckeditor_media_embed.steps.js` holds the CKEditor 4
steps: the editor of a field, its toolbar buttons, the Media Embed dialog, the
data the editor saves, the embed preview in the editing area, a paste and the
editor's notifications. Its other steps go through drush: pointing the
provider at the local oEmbed fixture provider and reading what it was asked
for, creating content with HTML no editor writes, running the module's Drush
commands, moving the CKEditor 4 plugins away and back, changing settings, and
reading active configuration.

The suite runs against a standard Drupal 10.6 site with the module, CKEditor 4
from the contrib [ckeditor](https://www.drupal.org/project/ckeditor) module,
the CKEditor 4 plugins downloaded with `drush ckeditor_media_embed:install`,
and the `tests/recipes/ckeditor_media_embed_test` fixtures applied: Full HTML
on CKEditor 4 with the "Media Embed" and "Semantic Media Embed" buttons and
Auto Embed set to Media Embed, Basic HTML on CKEditor 4 with the "Semantic
Media Embed" button only, `<oembed>` allowed and Auto Embed set to Semantic
Media Embed, the "Convert Oembed tags to media embeds" filter on both, Article
(Body on Full HTML, and a Video link field shown by the module's link
formatter), Basic page (Body on Basic HTML), the Page writer and Text format
administrator roles, and the test module below.

| Feature | What it holds the module to |
|---|---|
| `00-01-01-users-login` | the testing users exist (created with drush) and every one can log in |
| `01-01-01-install` | the module and CKEditor 4 are installed; the status report lists the installed CKEditor 4 plugins and their versions, and says "Mixed versions" with the update instructions when the CKEditor version differs from the plugins; the help page explains the two buttons, the provider, the filter and auto embed |
| `02-01-01-settings` | the provider settings page is under Configuration > Media, saves a new provider, refuses a value that is not a URL, and needs "administer filters" |
| `03-01-01-text-format` | Full HTML uses CKEditor 4 with both buttons in its toolbar, offers the Auto Embed choice, points to the provider settings and has the filter on |
| `04-01-01-editor-toolbar` | the CKEditor 4 toolbar renders on the article form with both buttons, for the administrator and the Content editor, with root-relative plugin scripts and no JavaScript errors; each button opens the Media Embed dialog |
| `05-01-01-media-embed-html` | a YouTube link inserted with the "Media Embed" button is previewed, saved as the provider's HTML in `<div data-oembed-url>` and rendered without the filter |
| `06-01-01-embed-media` | a YouTube link inserted with the "Semantic Media Embed" button is saved as `<oembed>URL</oembed>`, and the filter renders it with the provider's title on the iframe |
| `07-01-01-access-control` | the provider settings need "administer filters"; the buttons follow the text format permissions (a Page writer without Full HTML gets no editor on the article body, and the semantic button on a Basic HTML page); an anonymous visitor sees the embed the filter renders |
| `08-01-01-providers` | Vimeo, X, Twitter, Instagram and YouTube Shorts links are saved as `<oembed>` and rendered with the provider's markup and class; the provider's title goes on the player; a provider option on the provider URL (`enablejsapi=1`) reaches the provider and the player; the dialog refuses a link the provider does not know |
| `09-01-01-basic-html` | Basic HTML carries the semantic button only, the filter and `<oembed>`; the format guidelines explain the oEmbed tag; a Page writer embeds a video on a Basic HTML page |
| `10-01-01-link-formatter` | Manage display offers the "Oembed element using CKEditor Media Embed provider" formatter; a video link renders as the provider's player; a link the provider cannot embed stays a plain link, with a warning |
| `11-01-01-auto-embed` | a pasted YouTube link becomes the Media Embed HTML on Full HTML and an `<oembed>` on Basic HTML; a pasted link the provider cannot embed stays a link, with the editor's notification |
| `12-01-01-provider-errors` | a link the provider has no answer for, and a provider that cannot be reached, keep the `<oembed>` and show "Unable to retrieve ... at this time" without breaking the page |
| `13-01-01-empty-url` | an `<oembed>` with no url is not sent to the provider and shows no warning (`@wip`, #3600610) |
| `14-01-01-drush-commands` | Drush lists `ckeditor_media_embed:install` and `ckeditor_media_embed:update`; both ask before overwriting the installed plugins, and "no" downloads and changes nothing; with the CKEditor version set to 4.18.0 the install command downloads the matching plugins, textmatch included |
| `15-01-01-missing-library` | with the CKEditor 4 plugins missing, the status report shows the error, the settings page shows the install instructions, the editor loads without the buttons and the log names the missing plugins; all whole again once they are back |
| `16-01-01-uninstall` | the module cannot be uninstalled while its filter is in use; once the filter is off the formats, it uninstalls and leaves no settings, filter, formatter or status report line, and the editor and the text formats keep working |

### The oEmbed provider

The scenarios do not call a third-party oEmbed service. The hidden test module
`tests/modules/ckeditor_media_embed_test` answers at
`/ckeditor-media-embed-test/oembed?url={url}&callback={callback}` like a
provider: it returns the fixture of `tests/fixtures/oembed` that matches the url
(YouTube, YouTube Shorts, Vimeo, X/Twitter, Instagram), a 400 for an empty url
as public providers do, and a 404 for any other url. The CKEditor 4 plugins ask
it from the browser with a JSONP callback, and get JSONP; the filter and the
link formatter ask from the server, and get JSON. It records every url it was
asked for, the editor's and the site's apart, and adds `enablejsapi=1` to the
YouTube player when the provider URL carries that option. The step `the media
embed provider is the local oEmbed fixture provider` points the module at it,
and the `@oembed-fixture` tag puts the default provider back after the
scenario. The media hosts themselves are blocked in the browser, so nothing is
loaded from a third party.

The test module is hidden, so the site needs
`$settings['extension_discovery_scan_tests'] = TRUE;` in `settings.php`
before the fixtures recipe is applied.

### Tags

| Tag | Meaning |
|---|---|
| `@oembed-fixture` | the scenario uses the local oEmbed fixture provider; the default provider is put back after it |
| `@missing-library` | the scenario moves the CKEditor 4 plugins away; they are put back after it |
| `@restores-config` | the scenario changes the module settings or a text format's editor; they are put back after it |
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
the CKEditor 4 plugins away and uninstall the module. `14-*` downloads the
CKEditor 4.18.0 package from GitHub, then puts the site's own plugins back.

`CKEDITOR_MEDIA_EMBED_DRUSH` is the drush command for the site under test
(`drush` by default), run from the directory you start the suite in; `ddev
drush` works only inside the DDEV project, so point it at a small wrapper
script when the module lives elsewhere. `FEATURES` runs some features only,
and `CUCUMBER_TAGS` sets the tag expression (`not @wip` by default).

### In CI

`.gitlab-ci.yml` builds the site once in the `pre-test` stage
(`drupal/recommended-project` ~10.6.0, the module from this checkout,
`drupal/ckeditor`, the CKEditor 4 plugins downloaded by the module's Drush
command, the fixtures recipe and the testing users), then runs a smoke canary
and seven feature groups in parallel against `drush runserver`. Every group
publishes its HTML and PDF report, failure screenshots and videos as
artifacts, and the report stage merges them into one report.

These jobs run on merge requests, on the `8.x-1.x` branch and on tag
pipelines, so every release tag carries its own merged report in the
artifacts of its "Create reports" job.
