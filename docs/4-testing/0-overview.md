# Testing Overview

CKEditor Media Embed Plugin ships two layers of automated tests.

## Test layers

| Layer | Tooling | Location | What it covers |
|-------|---------|----------|----------------|
| **Functional acceptance** | [webship-js](https://github.com/webship/webship-js) (Playwright and Cucumber) with [@webship-js/drupal-core-steps](https://github.com/webship/drupal-core-steps) | `tests/features/drupal/`, `tests/step-definitions/` | Real-browser behavior: the install and the status report, the settings page, the text format, the editor toolbar, the Drush cache rebuild regression, and embedding a URL through to the rendered page. |
| **PHPUnit** | The drupalci templates | `tests/src/Unit/` | `AssetManager`: plugin names, paths, versions and install status. |

## Why the browser layer carries the weight

Most of this module's behavior only exists once CKEditor 5 has booted with the
plugin build, or once a page renders through the filter: the button, the
dialog, the saved `<oembed>` element, the embed on the page and the URL of the
plugin script. A PHP-level test sees none of that. The suite drives a real
Chromium against a site built the way a site builder would set it up.

## What the acceptance suite proves

- the module installs, and the status report finds the plugin library and the
  CKEditor version;
- the help page explains the provider and the filter;
- the settings page saves a new provider, refuses a value that is not a URL,
  and is closed to users without **Administer text formats and filters**;
- Full HTML carries the **Insert media** button and the **Convert Oembed tags
  to media embeds** filter;
- the editor toolbar loads with the button, for an administrator and for a
  content editor, with a root-relative plugin URL and no JavaScript errors;
- after Drush rebuilds the caches and the library definitions, the editor still
  loads
  ([#3599775](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3599775));
- a YouTube link inserted with the button is saved as `<oembed url>`, and the
  saved article renders the embed, with the provider's title on the `iframe`.

## Suite layout

| Path | Purpose |
|------|---------|
| `tests/features/drupal/` | Gherkin `.feature` files, for a standard Drupal site. |
| `tests/step-definitions/ckeditor_media_embed.steps.js` | The two module steps: build the library definitions from Drush, and point the provider at a fixture. |
| `tests/scripts/add-testing-users.js` | Creates the testing users with Drush. |
| `tests/selectors/ckeditor_media_embed.json` | The module's named selectors. |
| `tests/recipes/ckeditor_media_embed_test/` | The fixtures recipe: Article, Full HTML with the button and the filter, and the Content editor role. |
| `tests/fixtures/oembed/youtube.json` | A provider answer for a YouTube link. |
| `tests/src/Unit/AssetManagerTest.php` | The PHPUnit test. |
| `tests/assets/` | The unit test's fake Drupal root: a stub plugin build and a test `core.libraries.yml`. |
| `cucumber.js`, `cucumber.shared.js`, `playwright.config.ts`, `package.json` | The suite's configuration. |
| `tests/reports/`, `tests/screenshots/`, `tests/videos/` | Run artifacts, not committed. |

## Feature files

| Feature | Tags | Covers |
|---------|------|--------|
| `00-01-01-users-login` | `@admin` | The testing users exist and every one can log in. Runs first. |
| `01-01-01-install` | `@admin` | The module is installed, the status report finds the plugin library and the CKEditor version, and the help page explains the provider and the filter. |
| `02-01-01-settings` | `@admin` | The settings page is under **Configuration > Media**, saves a new provider, refuses a value that is not a URL, and needs `administer filters`. |
| `03-01-01-text-format` | `@admin` | Full HTML carries the button and the filter. |
| `04-01-01-editor-toolbar` | `@editor` | The toolbar renders with the button for the Webmaster and the Content editor, the script URL is root-relative, and the button opens the media URL form. |
| `05-01-01-drush-cache-rebuild` | `@editor @regression` | The editor still loads after Drush rebuilt the caches, for `http://localhost` and `http://default`. |
| `06-01-01-embed-media` | `@editor @oembed-fixture` | A YouTube link is saved as `<oembed>` and renders as the embed, for the Webmaster and the Content editor. |

Every feature also carries `@ckeditor-media-embed`. Scenarios tagged `@js-fail`
fail on any error in the browser console; the others only report it.

## Requirements

- Node.js 24 or later, and Yarn 4.18.1 through Corepack (`packageManager` in
  `package.json`)
- Chromium, installed by Playwright
- A standard Drupal 11.4 site with the module, the plugin library
  (`vardot/ckeditor5-media-embed-drupal` `~47.6.2`) and the fixtures recipe
- Drush for that site: two steps and the testing users use it

## Next steps

- [Automated Functional Acceptance Testing](1-automated-functional-acceptance-testing.md)
- [Running Tests](2-running-tests.md)
- [GitLab CI](3-gitlab-ci.md)
- [PHPUnit](4-phpunit.md)
