# Hooks and Extension Points

Reference for the hook, services and plugins the module ships, and for the
places where you can change its behavior.

## The hook the module defines

### `hook_ckeditor_media_embed_object_alter(&$embed)`

Documented in `ckeditor_media_embed.api.php`. `Embed::getEmbedObject()` invokes
it after every provider call, so it runs for each embed the filter renders and
for each link the field formatter renders.

`$embed` is the provider's oEmbed answer, decoded from JSON into an object:
`type`, `title`, `provider_name`, `html`, `width`, `height` and whatever else
the provider sends. It is `NULL` when the request failed, so check it before
you use it.

The example from `ckeditor_media_embed.api.php`:

```php
function hook_ckeditor_media_embed_object_alter(&$embed) {
  $title_exists = (
    !empty($embed->title)
    && $title = Html::escape($embed->title)
  );

  if ($title_exists && $document = Html::load(trim($embed->html))) {
    if ($iframes = $document->getElementsByTagName('iframe')) {
      foreach ($iframes as $iframe) {
        $iframe->setAttribute('title', $title);
      }

      $embed->html = Html::serialize($document);
    }
  }
}
```

What an implementation can do:

- **Change the HTML**: add attributes to the `iframe`, wrap it, or change the
  player URL.
- **Change `type` or `provider_name`**: the filter builds the wrapper class,
  `embed-media--<type>-<provider_name>`, after the hook runs.
- **Drop the embed**: without `html`, the filter leaves the `<oembed>` element
  in place, and the formatter falls back to a plain link.

### The module's own implementation

`ckeditor_media_embed_ckeditor_media_embed_object_alter()` does what the
example shows: it sets the `title` attribute of every `iframe` in the HTML to
the provider's title, escaped. This is what gives an embedded player an
accessible name. The functional suite checks it on the rendered page.

## Hooks the module implements

| Hook | File | What it does |
|------|------|--------------|
| `hook_help()` | `.module` | The help page at `/admin/help/ckeditor_media_embed`. |
| `hook_library_info_build()` | `.module` | Defines the `media-embed` and `ckeditor_media_embed.admin` libraries. |
| `hook_ckeditor_media_embed_object_alter()` | `.module` | Sets the `iframe` titles. |
| `hook_ckeditor_plugin_info_alter()` | `.module` | A CKEditor 4 hook. CKEditor 5 never invokes it. |
| `hook_install()` | `.install` | Warns when the plugin build is missing. |
| `hook_requirements()` | `.install` | The status report row. |

All are procedural functions. The module has no hook classes.

## Services

| Service id | Class | Notes |
|------------|-------|-------|
| `ckeditor_media_embed` | `Embed` | Calls the provider and renders embeds. The filter and the formatter receive it as `EmbedInterface`. |
| `ckeditor_media_embed_cli_commands` | `Command\CliCommandWrapper` | The download and install logic of the Drush commands. |
| `ckeditor_media_embed_install` | `Command\Drush\InstallCommand` | Runs the install. |
| `ckeditor_media_embed_update` | `Command\Drush\UpdateCommand` | Same as install. |
| `logger.channel.ckeditor_media_embed` | Logger channel | Where provider errors are logged. |
| `ckeditor_media_embed.commands` | `Command\Drush\CKEditorMediaEmbedCommands` | In `drush.services.yml`, tagged `drush.command`. |

## Plugins

| Type | Plugin id | Class or file |
|------|-----------|---------------|
| CKEditor 5 plugin | `ckeditor_media_embed_embed_media` | `ckeditor_media_embed.ckeditor5.yml`, no PHP class |
| Filter | `filter_ckeditor_media_embed` | `Plugin\Filter\FilterCKEditorMediaEmbed` |
| Field formatter | `ckeditor_media_embed_link_formatter` | `Plugin\Field\FieldFormatter\CKEditorMediaEmbedFormatter` |

The filter and the formatter are annotation-based plugins (`@Filter`,
`@FieldFormatter`).

## Configuration

`ckeditor_media_embed.settings`, a `config_object` with three strings:
`embed_provider`, `ckeditor_version` and `plugins_version_installed`. See
[Configuration keys](../2-admins/0-configuration.md#configuration-keys).

## Extension points

Beyond the alter hook, use the standard Drupal ones:

- **Decorate or replace the `ckeditor_media_embed` service** to change how
  embeds are fetched or rendered, for example to cache the provider's answers.
  Keep `EmbedInterface`: the filter and the formatter type-hint it. Caching in
  the module itself is proposed in
  [#3594347](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3594347).
- **`hook_ckeditor5_plugin_info_alter()`** to change the CKEditor 5 plugin
  definition, for example its label or the `config` it passes to the Media
  embed plugin.
- **`hook_library_info_alter()`** to load the build from another path.
- **Theme CSS** on `.embed-media` and `.embed-media--<type>-<provider>`, for
  example to make video embeds responsive.
- **Another filter**, placed after this one, when the provider's HTML needs
  more processing.

The module defines no permissions (the settings page uses
`administer filters`), no events and no plugin types. If you need something it
does not expose, open an issue in the
[issue queue](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items)
rather than patching locally.

## Next steps

- [Architecture](0-architecture.md)
- [The Root-Relative Plugin Path](2-root-relative-plugin-path.md)
