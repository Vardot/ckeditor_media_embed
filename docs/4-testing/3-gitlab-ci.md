# GitLab CI

Every change to CKEditor Media Embed Plugin is gated by the pipeline in
`.gitlab-ci.yml`, which runs on
[git.drupalcode.org](https://git.drupalcode.org/project/ckeditor_media_embed)
on top of [drupal/gitlab_templates](https://project.pages.drupalcode.org/gitlab_templates/).

## Shape of the pipeline

| Stage | Jobs |
|-------|------|
| build | `composer` from the templates, and `pages` when the documentation changes |
| validate | `composer-lint`, `phpcs`, `phpstan`, `stylelint`, `eslint` and `cspell` from the templates, plus `eslint (step definitions)` and `🧩 webship-js dry run` |
| pre-test | `🏗️ Drupal core site` |
| test | `phpunit` from the templates, `🧪 functional smoke (Drupal core)` and `🧪 functional (Drupal core)` |
| report | `📊 Create reports` |

## Includes and variables

```yaml
include:
  - project: $_GITLAB_TEMPLATES_REPO
    # Pinned: bump it deliberately, in its own issue.
    ref: 1.17.3
    file:
      - '/includes/include.drupalci.main.yml'
      - '/includes/include.drupalci.variables.yml'
      - '/includes/include.drupalci.workflows.yml'

variables:
  YARN_ENABLE_IMMUTABLE_INSTALLS: "false"
  OPT_IN_TEST_CURRENT: 1
  _TARGET_PHP: "8.5"
  _ALL_VALIDATE_ALLOW_FAILURE: 0
  SKIP_NIGHTWATCH: 1
```

- The templates are pinned to `1.17.3`, so an upstream change cannot turn the
  pipeline red overnight.
- The template jobs build current Drupal 11 on PHP 8.5.
- `_ALL_VALIDATE_ALLOW_FAILURE: 0` makes every validate job block the merge.
- Nightwatch is skipped: the browser suite is webship-js.
- No `yarn.lock` is committed, so Yarn may create one in CI.

The `composer` jobs and `stylelint` also set `YARN_RC_FILENAME` to
`.yarnrc.core.yml`, so that Drupal core's own Yarn does not read the module's
`.yarnrc.yml`.

## The browser lane

One lane, Drupal core 11.4 with the standard profile and the Drupal core steps:

| Variable | Value |
|----------|-------|
| `SITE_PACKAGE` | `drupal/recommended-project:~11.4.0` |
| `PLUGIN_LIBRARY` | `vardot/ckeditor5-media-embed-drupal:~47.6.2` |
| `INSTALL_ARGS` | `standard` |

### Building the site once

`🏗️ Drupal core site`, in the pre-test stage:

1. Installs Node 24 and the browser dependencies.
2. Creates the project from `SITE_PACKAGE`, and requires the module from this
   checkout through a Composer path repository, the plugin library and Drush.
   It checks that `web/libraries/ckeditor5/plugins/media-embed/build/media-embed.js`
   exists and prints core's CKEditor 5 version.
3. Installs the site, or restores an install cached for the same
   `composer.lock`, install arguments and PHP version.
4. Applies the fixtures recipe, lifts the login flood limits and creates the
   testing users with Drush.
5. Hands the test jobs an artifact: the Composer files, `settings.php`, the
   public files and a gzipped database dump. The built site goes to the cache.

### Testing

`🧪 functional smoke (Drupal core)` runs the `00` feature alone. Every group
needs it, so a systemic break fails once there instead of in every group.

`🧪 functional (Drupal core)` then runs two groups in parallel:

| Group | Features |
|-------|----------|
| `01-03-install-settings-format` | `01` to `03` |
| `04-06-editor-embed` | `04` to `06` |

Each test job restores the dump, copies the oEmbed fixtures to
`sites/default/files/oembed-fixtures`, serves the site with `drush runserver` on
`http://127.0.0.1:8888`, loads the first pages once to warm them, and runs its
group. A job is retried once on a runner timeout or a runner failure, and none
is allowed to fail.

## When the jobs run

The browser jobs, `eslint (step definitions)` and the dry run run on merge
request pipelines and on release branches such as `2.x`. They do not run on tag
pipelines yet;
[#3620363](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3620363)
proposes that.

The template jobs follow the templates' workflow: merge requests, the default
and release branches of the project, tags, and manual or scheduled pipelines.

## Where the reports are published

The reports are job artifacts:

| Job | Artifacts | Kept |
|-----|-----------|------|
| Each `🧪` test job | `tests/reports` (the group's JSON, HTML and PDF), `tests/screenshots`, `tests/videos` | 30 days, also on failure |
| `📊 Create reports` | `tests/reports` with the merged report, `tests/screenshots` | 30 days, also on failure |

`📊 Create reports` merges the Cucumber JSON of every group with `jq` and
writes one HTML and one PDF report, named
`ckeditor-media-embed--<branch>--functional-testing-report--<date>--<time>`. It
runs even when a group fails, so a red pipeline still gets the combined report.

To read a report, open the pipeline, then the `📊 Create reports` job, then
**Browse** under the job artifacts, and open `tests/reports/`. The screenshots
and videos of a failed group are in that group's own job.

## The documentation site

The `pages` job of the templates builds this site in a `python:3.12` image,
with `mkdocs build --site-dir public --strict`. It runs:

- **on a push to `2.x`**, the default branch, in the project, when `docs/` or
  `mkdocs.yml` changed. GitLab Pages then publishes the site at
  <https://project.pages.drupalcode.org/ckeditor_media_embed/>;
- **on a manual or scheduled pipeline** in the project, when
  `_PAGES_FORCE_REBUILD` is `1`;
- **as a manual job in an issue fork** pipeline, when the documentation
  changed, so a change can be tested before it is merged.

A maintainer's merge request pipeline runs in the project and has no `pages`
job. Build the site locally to check a change, outside the checkout:

```bash
python3 -m venv /tmp/mkdocs-venv
/tmp/mkdocs-venv/bin/pip install mkdocs-material
/tmp/mkdocs-venv/bin/mkdocs build --strict --site-dir /tmp/ckeditor-media-embed-docs
```

`mkdocs serve` gives a live preview at `http://127.0.0.1:8000` while you edit.
`.gitlab-ci.yml` needs nothing for this: the job comes with the templates.

## Reading a failure

1. Open the pipeline and find the failed job.
2. Read the log from the bottom. A failure in `before_script` is a setup
   problem; a failure in `script` is a test.
3. For a browser failure, browse the job's artifacts: the screenshot prefixed
   `failed_`, the video and the group's HTML report.
4. Reproduce it locally, see [Running Tests](2-running-tests.md).

## Next steps

- [PHPUnit](4-phpunit.md)
- [Running Tests](2-running-tests.md)
