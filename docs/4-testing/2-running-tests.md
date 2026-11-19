# Running Tests

How to run the suites against a local site or a DDEV site.

## Prerequisites

- Node.js 24 or later, with Corepack for Yarn 4.18.1 (`packageManager` in
  `package.json`)
- A standard Drupal 11.4 site with the module, the plugin library
  (`vardot/ckeditor5-media-embed-drupal` `~47.6.2`), the fixtures recipe and the
  testing users
- Drush for that site

Install the dependencies and the browser, from the module folder:

```bash
corepack enable
yarn install
./node_modules/.bin/playwright install chromium
```

## Provisioning the site under test

From the site:

```bash
# The module and its plugin library.
composer require drupal/ckeditor_media_embed vardot/ckeditor5-media-embed-drupal:~47.6.2

# Article, Full HTML with the button and the filter, the Content editor role.
# The recipe also installs the module.
drush recipe /path/to/ckeditor_media_embed/tests/recipes/ckeditor_media_embed_test -y

drush cache:rebuild
```

Then, from the module folder, create the testing users:

```bash
CKEDITOR_MEDIA_EMBED_DRUSH="drush --root=/path/to/site/web" node tests/scripts/add-testing-users.js
```

The suite logs in as the Webmaster, `webmaster` by default. Install the site
with that account, or point `LOGIN_USER` and `LOGIN_PASS` at your administrator.

## Running the acceptance suite

```bash
CKEDITOR_MEDIA_EMBED_DRUSH="drush --root=/path/to/site/web" \
  LAUNCH_URL="https://my-site.example" yarn test
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `LAUNCH_URL` | `http://localhost` | The site under test. |
| `CKEDITOR_MEDIA_EMBED_DRUSH` | `drush` | The Drush command of that site. |
| `CKEDITOR_MEDIA_EMBED_FIXTURES` | `/modules/contrib/ckeditor_media_embed/tests/fixtures/oembed` | Where the site serves the oEmbed fixtures. |
| `FEATURES` | `tests/features/drupal/**/*.feature` | The features to run. |
| `CUCUMBER_TAGS` | `not @wip` | The tag expression. |
| `LOGIN_USER`, `LOGIN_PASS` | `webmaster` and the suite's password | The Webmaster account. |
| `BROWSER` | `chromium` | `chromium`, `firefox` or `webkit`. |
| `HEADLESS` | `true` | `false` opens a visible browser. |
| `SLOW_MO` | `0`, or `800` when headed | Milliseconds between browser actions. |

The package scripts:

```bash
yarn test            # BROWSER, chromium by default
yarn test:chromium
yarn test:firefox
yarn test:webkit
yarn test:headed     # a visible browser, slowed down
```

### Useful filters

```bash
# The embed feature only.
FEATURES="tests/features/drupal/06-*.feature" yarn test

# The Drush cache rebuild regression only.
CUCUMBER_TAGS="@regression" yarn test

# The administration features only.
CUCUMBER_TAGS="@admin and not @wip" yarn test
```

Every feature after the first needs the testing users. On a fresh site, run the
user script, or the `00` feature, before a filtered run.

### The report

webship-js writes `tests/reports/cucumber_report.html` when cucumber-js exits.
For the HTML and a PDF, run:

```bash
node ./node_modules/webship-js/bin/generate-reports.js \
  --json tests/reports/cucumber_report.json \
  --out tests/reports/cucumber_report.html \
  --format all \
  --pdf-out tests/reports/cucumber_report.pdf \
  --title "CKEditor Media Embed functional testing"
```

## Running on DDEV

Provision the site:

```bash
ddev composer require drupal/ckeditor_media_embed vardot/ckeditor5-media-embed-drupal:~47.6.2
ddev drush recipe web/modules/contrib/ckeditor_media_embed/tests/recipes/ckeditor_media_embed_test -y
ddev drush cache:rebuild
```

Then, from the module folder:

```bash
CKEDITOR_MEDIA_EMBED_DRUSH="ddev drush" node tests/scripts/add-testing-users.js
CKEDITOR_MEDIA_EMBED_DRUSH="ddev drush" LAUNCH_URL=https://my-site.ddev.site yarn test
```

## Checking the suite itself

The two module-specific validate jobs of CI run locally too. eslint comes with
`yarn install`, as a development dependency:

```bash
# eslint, as the 'eslint (step definitions)' job runs it.
node ./node_modules/eslint/bin/eslint.js --no-eslintrc -c tests/.eslintrc.json \
  --no-ignore tests/step-definitions tests/scripts

# Every step of every feature resolves to exactly one definition.
CUCUMBER_TAGS='not @wip' yarn test --dry-run
```

`yarn lint:js` is a shorter form of the first check, for the step definitions
only.

## PHPUnit

From the Drupal root:

```bash
vendor/bin/phpunit -c web/core web/modules/contrib/ckeditor_media_embed/tests/src/Unit
```

See [PHPUnit](4-phpunit.md).

## Troubleshooting

**A step fails with `drush ... failed.`**
The step could not run Drush. Set `CKEDITOR_MEDIA_EMBED_DRUSH` to the Drush
command of the site under test, for example `ddev drush`.

**The embed scenarios see the *Unable to retrieve* warning.**
The site could not fetch the fixture. The site requests it from its own
`LAUNCH_URL`, so that URL has to work from the web server too, and
`CKEDITOR_MEDIA_EMBED_FIXTURES` has to be the path the site serves
`tests/fixtures/oembed` at.

**Steps time out on the first editor load.**
The first authenticated load builds the admin theme and the CKEditor 5 assets.
Load a node form once before the run. CI warms the pages the suite opens first.

**A scenario fails on browser console errors.**
That is the point of `@js-fail`. Read the reported error rather than removing
the tag.

## Next steps

- [GitLab CI](3-gitlab-ci.md)
- [PHPUnit](4-phpunit.md)
