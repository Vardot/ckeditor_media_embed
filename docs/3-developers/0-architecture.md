# Architecture

How the Drupal module, the CKEditor 5 plugin library and the oEmbed provider fit
together.

## The three pieces

```
drupal/ckeditor_media_embed  (this module)
  |
  |-- declares a CKEditor 5 plugin  ......  ckeditor_media_embed.ckeditor5.yml
  |-- builds its asset libraries  ........  hook_library_info_build()
  |-- finds the plugin build on disk  ....  src/AssetManager.php
  |-- turns <oembed> into embed HTML  ....  src/Plugin/Filter/
  |-- calls the oEmbed provider  .........  src/Embed.php
  |-- renders link fields as embeds  .....  src/Plugin/Field/FieldFormatter/
  |-- reports the library status  ........  hook_requirements()
  |-- downloads the build from npm  ......  src/Command/ (Drush)
  |
  |-- loads ->  vardot/ckeditor5-media-embed-drupal  (the editor feature)
  |               libraries/ckeditor5/plugins/media-embed/build/media-embed.js
  |
  '-- calls ->  the oEmbed provider  (the embed HTML)
                  ckeditor_media_embed.settings:embed_provider
```

The division of labor matters when debugging. **Anything inside the editing
surface** (the button, the dialog, the preview, which URLs are accepted) is the
CKEditor 5 plugin's job. **What the page shows** is the filter's and the
provider's.

## Repository layout

| Path | Purpose |
|------|---------|
| `ckeditor_media_embed.info.yml` | Module definition. Depends on `ckeditor5`. Drupal 10.3 or later, or 11. |
| `ckeditor_media_embed.ckeditor5.yml` | Declares the `ckeditor_media_embed_embed_media` CKEditor 5 plugin. |
| `ckeditor_media_embed.module` | `hook_help()`, `hook_library_info_build()`, the module's own `hook_ckeditor_media_embed_object_alter()`, and a CKEditor 4 hook. |
| `ckeditor_media_embed.install` | `hook_install()` and `hook_requirements()`. |
| `ckeditor_media_embed.api.php` | Documents `hook_ckeditor_media_embed_object_alter()`. |
| `ckeditor_media_embed.services.yml` | The `ckeditor_media_embed` service, the Drush command helpers and the logger channel. |
| `drush.services.yml` | The Drush command class. |
| `ckeditor_media_embed.routing.yml`, `ckeditor_media_embed.links.menu.yml` | The settings page under **Configuration > Media**. |
| `config/install/`, `config/schema/` | `ckeditor_media_embed.settings` and its schema. |
| `command/translations/en/` | The messages of the Drush commands. |
| `css/ckeditor_media_embed.admin.css` | The button icon in the toolbar configuration. |
| `src/AssetManager.php` | Static helpers: plugin names, paths, versions and install status. |
| `src/Embed.php`, `src/EmbedInterface.php` | Calls the provider and swaps each `<oembed>` for its HTML. |
| `src/Form/CKEditorMediaEmbedSettingsForm.php` | The provider settings form. |
| `src/Plugin/Filter/FilterCKEditorMediaEmbed.php` | The **Convert Oembed tags to media embeds** filter. |
| `src/Plugin/Field/FieldFormatter/CKEditorMediaEmbedFormatter.php` | The link field formatter. |
| `src/Command/` | The `ckeditor_media_embed:install` and `ckeditor_media_embed:update` Drush commands. |
| `src/CKEditorVersionAwarePluginBase.php`, `src/Plugin/CKEditorPlugin/` | CKEditor 4 leftovers, see [Legacy code](#legacy-code). |
| `composer.libraries.json` | The library require and installer path, to copy into a project. |
| `tests/` | The webship-js suite, its fixtures and recipe, and the PHPUnit test. |
| `mkdocs.yml`, `docs/` | This documentation site. |

## The CKEditor 5 plugin declaration

`ckeditor_media_embed.ckeditor5.yml`, without its comments:

```yaml
ckeditor_media_embed_embed_media:
  ckeditor5:
    plugins:
      - mediaEmbed.MediaEmbedEditing
      - mediaEmbed.MediaEmbedUI
  drupal:
    label: Media embed
    library: ckeditor_media_embed/media-embed
    admin_library: ckeditor_media_embed/ckeditor_media_embed.admin
    toolbar_items:
      MediaEmbed:
        label: Insert media
    elements:
      - <figure>
      - <figure class>
      - <oembed>
      - <oembed url>
```

Things to note:

- `mediaEmbed.MediaEmbedEditing` and `mediaEmbed.MediaEmbedUI` are exports of
  the library build. The module itself contains no CKEditor 5 source.
- Only the editing and UI plugins are loaded, not the `MediaEmbed` glue plugin
  that would also bring `AutoMediaEmbed`. Embedding on paste is off since 2.0.6
  ([#3579176](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3579176)).
- No `config` is passed to CKEditor, so its defaults apply: its own provider
  list, and `previewsInData: false`, which saves `<oembed url>` rather than
  preview HTML.
- `elements` is what Drupal merges into the allowed HTML of a format that
  limits HTML.
- `admin_library` loads only on the text format configuration page.

## The asset libraries

There is no `ckeditor_media_embed.libraries.yml`. The libraries are built in
code:

```php
function ckeditor_media_embed_library_info_build() {
  $libraryDiscovery = \Drupal::service('library.discovery');
  $configFactory = \Drupal::configFactory();
  $packageVersion = AssetManager::getCKEditorVersion($libraryDiscovery, $configFactory);

  $libraries = [];
  foreach (AssetManager::getPlugins($packageVersion) as $plugin) {
    $libraries[$plugin] = [
      'dependencies' => [
        'ckeditor5/ckeditor5',
      ],
      'js' => [
        AssetManager::getCKEditorLibraryPluginPath() . $plugin . '/build/' . $plugin . '.js' => [
          'preprocess' => FALSE,
          'minified' => TRUE,
        ],
      ],
    ];
  }
  // Plus 'ckeditor_media_embed.admin', the admin CSS.
  return $libraries;
}
```

`AssetManager::getPlugins()` returns `['media-embed']`, so this defines
`ckeditor_media_embed/media-embed` with
`/libraries/ckeditor5/plugins/media-embed/build/media-embed.js`. The build is
never aggregated: `preprocess` is `FALSE`. Why the path starts with a slash and
nothing else is explained in
[The Root-Relative Plugin Path](2-root-relative-plugin-path.md).

## AssetManager

`Drupal\ckeditor_media_embed\AssetManager` is a set of static methods, not a
service.

| Method | Returns |
|--------|---------|
| `getPlugins()` | `['media-embed']`, whatever the version. |
| `pluginIsInstalled($name)` | Whether `libraries/ckeditor5/plugins/<name>/build/<name>.js` exists under the Drupal root. |
| `pluginsAreInstalled()`, `getPluginsInstallStatuses()` | The same check for every plugin. |
| `getCKEditorVersion()` | `ckeditor_version` from config. Otherwise the `ckeditor5:` version in `core/core.libraries.yml`, cut at a `+`. Otherwise `4.5.x`. |
| `getPluginsInstalledVersion()` | `plugins_version_installed` from config. |
| `getPluginsVersion()` | `plugins_version_installed`, or `getCKEditorVersion()` when it is empty. |
| `getCKEditorLibraryPluginPath()` | `/libraries/ckeditor5/plugins/`, for library definitions. |
| `getCKEditorLibraryPluginDirectory()` | The same folder as a file system path under the Drupal root. |
| `getNPMRegistryPackageUrl($version)` | `https://registry.npmjs.org/@ckeditor/ckeditor5-media-embed/<version>` |
| `getCKEditorDevFullPackageName($version)` | `ckeditor5-media-embed-<version>`, the name of the download. |

## The filter

`FilterCKEditorMediaEmbed`, plugin id `filter_ckeditor_media_embed`, is a
`TYPE_TRANSFORM_REVERSIBLE` filter with no settings. Its `process()` returns the
text untouched unless it contains `<oembed`, and otherwise hands it to the
`ckeditor_media_embed` service:

```php
public function process($text, $langcode) {
  $result = new FilterProcessResult($text);

  if (strpos($text, '<oembed') !== FALSE) {
    $result->setProcessedText($this->ckeditorMediaEmbed->processEmbeds($text));
  }

  return $result;
}
```

## The Embed service

`Drupal\ckeditor_media_embed\Embed`, service id `ckeditor_media_embed`,
implements `EmbedInterface`.

**On construction** it reads `embed_provider` and calls `setEmbedProvider()`,
which parses the template, drops the query parameter whose value is
`{callback}`, and assembles an absolute URL. `{url}` is URL-encoded on the way,
to `%7Burl%7D`.

**`processEmbeds($text)`**

1. Loads the text into a DOM document.
2. Calls `getEmbedObject()` for each `//oembed` element, with its `url`
   attribute.
3. When the answer has `html`, replaces the element with a `div` holding that
   HTML. Its classes are `embed-media` and
   `embed-media--<type>-<provider_name>`, cleaned by `Html::getClass()`.
4. Serializes the document back to a string.

**`getEmbedObject($url)`**

1. Builds the request: the provider URL with `%7Burl%7D` replaced by the
   URL-encoded media URL. A provider URL that starts with `//` gets the scheme
   of the current request.
2. Sends a GET with Drupal's HTTP client and decodes the JSON answer.
3. On a transfer error, adds the warning *Unable to retrieve @url at this time,
   please check again later.*, logs the exception on the `ckeditor_media_embed`
   channel, and goes on with `NULL`.
4. Invokes `hook_ckeditor_media_embed_object_alter()` on the result, `NULL` or
   not, and returns it.

**`getSettingsLink()`** returns a link to the settings page, used by the help
page and the filter description.

## The field formatter

`CKEditorMediaEmbedFormatter`, plugin id `ckeditor_media_embed_link_formatter`,
applies to `link` fields. For each item it calls `getEmbedObject()` with the
link's URL. When the answer has `html`, it renders it through an inline
template, `{{ content|raw }}`. Otherwise it renders the URL as a link.

## Status report and install message

`hook_requirements()` adds the **CKEditor Media Embed plugin** row at runtime,
from `getPluginsVersion()`, `getPluginsInstallStatuses()` and
`getCKEditorVersion()`. See
[What the status report says](../2-admins/2-plugin-library.md#what-the-status-report-says).
`hook_install()` warns when the build is missing.

## The Drush commands

`CKEditorMediaEmbedCommands`, registered in `drush.services.yml`, defines
`ckeditor_media_embed:install` and `ckeditor_media_embed:update`.
`UpdateCommand` extends `InstallCommand` without changes, so both run the same
code, through `CliCommandWrapper`:

- `askToOverwritePluginFiles()` asks before overwriting an existing
  `libraries/ckeditor5/plugins` folder, unless `--yes` is given.
- `overwritePluginFiles()` downloads the npm tarball, extracts it with core's
  `Drupal\Core\Archiver\Tar`, mirrors its `package/` folder into
  `libraries/ckeditor5/plugins/media-embed`, saves `plugins_version_installed`
  and calls `drupal_flush_all_caches()`.

`Tar` is deprecated in Drupal 11.3 and removed in Drupal 12. `phpstan.neon`
ignores that one error, and
[#3620359](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3620359)
tracks the download.

## Legacy code

The 2.x branch still carries pieces of the CKEditor 4 era. Nothing on a CKEditor
5 site runs them:

- `ckeditor_media_embed_ckeditor_plugin_info_alter()` implements a hook that
  only the CKEditor 4 module invokes.
- `src/CKEditorVersionAwarePluginBase.php` implements an interface of the
  CKEditor 4 module. `phpstan.neon` excludes it.
- The files in `src/Plugin/CKEditorPlugin/` are empty.
- The `4.5.x` fallback of `getCKEditorVersion()` is a CKEditor 4 version.

## Next steps

- [Hooks and Extension Points](1-hooks-and-extension-points.md)
- [The Root-Relative Plugin Path](2-root-relative-plugin-path.md)
- [Testing Overview](../4-testing/0-overview.md)
