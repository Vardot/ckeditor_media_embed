# Automated Functional Acceptance Testing

The functional acceptance suite uses
[webship-js](https://github.com/webship/webship-js) 2.0, a Behavior-Driven
Development layer over Playwright and Cucumber, with the Drupal steps of
[@webship-js/drupal-core-steps](https://github.com/webship/drupal-core-steps)
2.2: login by user handle, the rich text editor, form submits, messages, the
page title, PHP errors, and the status of modules and checkboxes. Scenarios are
plain Gherkin, driven through a real browser.

## Principles

**Through the browser.** Scenarios use the site the way an administrator or an
editor does: pages, forms and the editor. Drush is used only where a browser
cannot help: to build the library definitions the way a deployment does, and to
point the provider at a fixture.

**No third-party calls.** The render scenarios call no oEmbed service. The
provider points at a JSON fixture that the site under test serves, and YouTube
itself is blocked, so neither the editor preview nor the rendered `iframe`
waits on the network.

**One concern per feature.** Each `.feature` file covers one behavior, so a
failure names what broke.

## Configuration

`cucumber.js` at the module root configures the run:

```js
module.exports = {
  default: {
    retry: 1,
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'node_modules/@webship-js/drupal-core-steps/tests/step-definitions/**/*.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: [process.env.FEATURES || 'tests/features/drupal/**/*.feature'],
    tags: tagExpression,
    format: ['pretty', `json:tests/reports/${reportName}.json`],
    worldParameters: { /* ... */ },
  },
};
```

Key points:

- Reusable steps come from webship-js and the Drupal core steps. Only what they
  cannot say lives in `tests/step-definitions/ckeditor_media_embed.steps.js`.
- `FEATURES` runs a subset, for example `tests/features/drupal/04-*.feature`.
- `CUCUMBER_TAGS` sets the tag expression, `not @wip` by default. Use it rather
  than `--tags`, which cucumber-js would combine with this one.
- `CUCUMBER_JSON` names the JSON report, `cucumber_report` by default.
- `WEBSHIP_STEP_TIMEOUT` sets the step timeout, 60 seconds by default, which
  covers the first CKEditor 5 boot.
- `retry: 1` absorbs a single step timeout from a loaded runner.

The named selectors are loaded in order, and a later file wins a name: the
webship-js preset for the Claro admin theme, the Drupal core steps preset, then
`tests/selectors/ckeditor_media_embed.json`.

### World parameters

`cucumber.shared.js` holds the world parameters:

| Parameter | Purpose |
|-----------|---------|
| `launchUrl` | The base URL, from `LAUNCH_URL`, `http://localhost` by default. |
| `users` | The testing users, see below. |
| `minWaitTime` | A page-settle budget of three seconds for navigation steps. |
| `selectors` | The named selector files and the breakpoints. |
| `screenshot` | Screenshots on failure, in `tests/screenshots/`, prefixed `failed_`. |
| `video` | Videos on failure, in `tests/videos/`. |
| `javascript` | Browser console errors, reported after each scenario. |

The last one is worth calling out. The suite watches the browser console. In
the default `warn` mode an error is reported and the scenario still passes.
Scenarios tagged `@js-fail` fail on it, and the step
`Then there should be no JavaScript errors` always fails on it.

## Users

| Name | Username | Role |
|------|----------|------|
| Webmaster | `webmaster`, or `LOGIN_USER` | The site-install administrator |
| Content editor | `content_editor_user` | `content_editor` |

The passwords come from `cucumber.shared.js`, and `LOGIN_PASS` for the
Webmaster.

`tests/scripts/add-testing-users.js` creates every user that is not the
administrator with Drush, or resets its password when it exists, and gives it
its roles. It can run any number of times:

```bash
CKEDITOR_MEDIA_EMBED_DRUSH="drush --root=web" node tests/scripts/add-testing-users.js
```

The first feature also runs `Given I add testing users`, which adds any user
that is still missing, through the browser.

## The module's steps

**`Given the library definitions are rebuilt by drush for "<uri>"`**
runs `drush --uri=<uri> cache:rebuild`, then builds the library definitions
in a Drush process, for the administration theme and the default theme. It
attaches the media embed script path that Drush built to the report. This is
the regression test for
[#3599775](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3599775).

**`Given the media embed provider is the "<name>" oEmbed fixture`**
sets `embed_provider` to the fixture `<name>.json` served by the site under
test, with `drush config:set`. Scenarios that use it are tagged
`@oembed-fixture`, and an `After` hook puts the default provider back.

Both run the Drush command in `CKEDITOR_MEDIA_EMBED_DRUSH`: `drush` by default,
`ddev drush` on a DDEV site. When Drush fails, the step fails with the command,
its error and that hint.

## Named selectors

`tests/selectors/ckeditor_media_embed.json`:

| Name | Selector |
|------|----------|
| media embed button | `.ck-toolbar button[data-cke-tooltip-text='Insert media']` |
| media url field | `.ck-media-form input` |
| media embed dialog | `.ck-dialog .ck-media-form` |
| editor media preview | `.ck-editor__editable figure.media` |
| rendered media embed | `div.embed-media.embed-media--video-youtube` |
| rendered media embed iframe | `div.embed-media.embed-media--video-youtube iframe` |
| provider url field | `#edit-embed-provider` |

Steps refer to a selector by name, as in `I see visible media embed button`.
When CKEditor or Claro moves an element, the fix is one entry in this file
rather than a search through the feature files.

## The fixtures recipe

`tests/recipes/ckeditor_media_embed_test/` provisions what the suite expects, on
a standard site:

- core's `article_content_type`, `full_html_format_editor` and
  `content_editor_role` recipes;
- the `ckeditor_media_embed` module;
- the Article body limited to Full HTML, so the form has no format switch;
- the **Insert media** button in the Full HTML toolbar;
- the **Convert Oembed tags to media embeds** filter on Full HTML;
- a Content editor role that may create and edit its own articles in Full HTML.

```bash
drush recipe /path/to/ckeditor_media_embed/tests/recipes/ckeditor_media_embed_test -y
```

## The oEmbed fixture

`tests/fixtures/oembed/youtube.json` answers the way a provider would for the
YouTube video `aqz-KE-bpKQ`: type `video`, provider `YouTube`, a title, and an
`iframe` in `html`.

The site under test serves the file. `CKEDITOR_MEDIA_EMBED_FIXTURES` is the
path it is served at, `/modules/contrib/ckeditor_media_embed/tests/fixtures/oembed`
by default. CI copies the fixtures to `/sites/default/files/oembed-fixtures`.

## Reports and artifacts

A run writes, under `tests/`:

- `reports/<name>.json`: the Cucumber JSON;
- `reports/<name>.html` and `.pdf`: the report, from
  `webship-js/bin/generate-reports.js`;
- `screenshots/`: on failure, prefixed `failed_`;
- `videos/`: on failure.

None of these are committed. CI sets `WEBSHIP_REPORT_DISABLE=1`, which skips
the report webship-js would write when cucumber-js exits, and generates each
report explicitly. See [GitLab CI](3-gitlab-ci.md).

## Next steps

- [Running Tests](2-running-tests.md)
- [GitLab CI](3-gitlab-ci.md)
