# PHPUnit

The module's white-box coverage lives in `tests/src/Unit/`.

## What is covered

`AssetManagerTest` covers `Drupal\ckeditor_media_embed\AssetManager`, the static
helpers that find the plugin build and read the versions.

```php
/**
 * Tests the asset manager.
 *
 * @group ckeditor_media_embed
 */
class AssetManagerTest extends UnitTestCase
```

It is a plain `UnitTestCase`: no database, no kernel. `setUp()` builds a bare
container whose `app.root` parameter points at `tests/assets/`, a fake Drupal
root:

```
tests/assets/
  libraries/ckeditor5/plugins/media-embed/build/media-embed.js   a stub build
  test.core.libraries.yml                                        ckeditor5, version "x.x.x"
```

| Test | Asserts |
|------|---------|
| `testGetPlugins()` | `['media-embed']`, with and without a version. |
| `testGetPluginsInstallStatuses()` | `['media-embed' => TRUE]`, against the stub build. |
| `testPluginsAreInstalled()` | The build is found. |
| `testPluginIsInstalled()` | `media-embed` is installed, `embed` is not. |
| `testGetCKEditorVersion()` | `4.5.x` when no library file can be read, `x.x.x` from the test library file, `47.6.2` when `ckeditor_version` is set in config. |
| `testGetPluginsInstalledVersion()` | The value of `plugins_version_installed`. |
| `testGetPluginsVersion()` | `plugins_version_installed` when it is set, otherwise the CKEditor version. |
| `testGetCKEditorLibraryPluginPath()` | Exactly `/libraries/ckeditor5/plugins/`, see [#3599775](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3599775). |
| `testGetCKEditorLibraryPluginDirectory()` | The plugin folder under the fake root. |
| `testGetNPMRegistryPackageUrl()` | `https://registry.npmjs.org/@ckeditor/ckeditor5-media-embed/x.x.x` |
| `testGetCKEditorDevFullPackageName()` | `ckeditor5-media-embed-x.x.x` |

The configuration is mocked: each test hands `AssetManager` a config factory
that returns the value under test.

## Running the tests

From the Drupal root:

```bash
vendor/bin/phpunit -c web/core web/modules/contrib/ckeditor_media_embed/tests/src/Unit
```

By group:

```bash
vendor/bin/phpunit -c web/core --group ckeditor_media_embed
```

Under DDEV:

```bash
ddev exec vendor/bin/phpunit -c web/core web/modules/contrib/ckeditor_media_embed/tests/src/Unit
```

In CI, the `phpunit` job from the drupalci templates runs them, and it is not
allowed to fail.

## Where the coverage boundary sits

Most of the module cannot be reached from a unit test:

- The **editor behavior** lives in the CKEditor 5 plugin build. It needs a
  browser.
- The **filter and the Embed service** need a provider and Drupal's rendering.
  The functional suite covers them with an oEmbed fixture.
- The **Drush commands** download from npm.
- The **status report row** needs a running site.

That boundary is why the acceptance suite carries most of the weight. The module
has no Kernel test yet.

## Adding a unit test

Put it in `tests/src/Unit/`, in the namespace
`Drupal\Tests\ckeditor_media_embed\Unit`, tag it `@group ckeditor_media_embed`,
and prefer logic that runs without a container. `Embed::processEmbeds()` with a
mocked HTTP client is a good candidate. If a change needs the container or the
database, a Kernel test is the right tool.

If the behavior you want to pin shows in the editor or on the rendered page,
add a Gherkin scenario instead. See
[Automated Functional Acceptance Testing](1-automated-functional-acceptance-testing.md).

## Next steps

- [Testing Overview](0-overview.md)
- [Running Tests](2-running-tests.md)
