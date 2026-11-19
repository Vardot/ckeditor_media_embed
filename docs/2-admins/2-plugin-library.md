# The CKEditor 5 Plugin Library

The module's PHP code registers the button, the filter and the settings. The
editor feature itself is the CKEditor 5 Media embed plugin: a JavaScript build
that the module loads from your `libraries` folder.

## What the module loads

The module defines the asset library `ckeditor_media_embed/media-embed` in code,
in `hook_library_info_build()`, with one file:

```
/libraries/ckeditor5/plugins/media-embed/build/media-embed.js
```

In a library definition, a leading slash means "relative to the Drupal root".
So the file has to be at `libraries/ckeditor5/plugins/media-embed/build/media-embed.js`
in your web root. The library depends on core's `ckeditor5/ckeditor5`.

## Why it must match core's CKEditor 5

A CKEditor 5 plugin must be built against the same CKEditor 5 version that
Drupal core bundles. Mixing versions makes the editor fail with
`ckeditor-duplicated-modules`.

That is why the module only *suggests* the library in its `composer.json`. It
supports several core versions, which bundle different CKEditor 5 versions, and
a single Composer constraint cannot say "whatever core bundles". The project,
distribution or recipe that pins the core version should require the matching
library.

## Which version to require

Read core's version from `web/core/core.libraries.yml`, the `ckeditor5:`
entry:

```bash
grep -A2 '^ckeditor5:' web/core/core.libraries.yml
```

Then require the matching tag of
[vardot/ckeditor5-media-embed-drupal](https://github.com/Vardot/ckeditor5-media-embed-drupal):

| Drupal core | CKEditor 5 in core | Library require |
|-------------|--------------------|-----------------|
| 11.4.x | 47.6.2, then 47.6.3 from 11.4.7 | `~47.6.2` |

The library has one line today, built from CKEditor 5 47.6.2: the tags
`47.6.2`, `47.6.2.1` and `47.6.2.2`. `~47.6.2` resolves to `47.6.2.2`, the
first tag that places itself in the right folder.

### Cores with CKEditor 5 47.6.3

The core security releases of 16 September 2026 (11.4.7, 11.3.17 and 10.6.17)
moved to CKEditor 5 `47.6.3`. From 11.4.9, 11.3.19 and 10.6.19 on, core
reports `47.6.3-drupal.1`. CKSource's 47.6 line ends at 47.6.2; these builds
come from Drupal's own fork of CKEditor 5. Neither version is published on npm,
and the library has no tag for them.

Keep `~47.6.2` on those cores. The module's CI runs the whole functional suite,
editor included, on the latest Drupal 11.4, which bundles `47.6.3-drupal.1`,
with library `~47.6.2`.

## Licensing

CKEditor 5 releases from 47.7.0 on the 47 line are the Long Term Support
edition, which CKSource publishes under a commercial license only. There is no
GPL option, so they must not ship in a GPL-2.0-or-later Drupal distribution.
47.6.2 is the last GPL dual-licensed release of the 47.6 line, and the library
is built only from GPL dual-licensed CKEditor 5 releases.

## The Composer route

The recommended route:

```bash
composer require vardot/ckeditor5-media-embed-drupal:~47.6.2
```

The package type is `drupal-library`. From 47.6.2.2 its `composer.json`
carries:

```json
"extra": {
  "installer-name": "ckeditor5/plugins/media-embed"
}
```

So the usual installer path, `web/libraries/{$name}` for `type:drupal-library`,
puts it in `web/libraries/ckeditor5/plugins/media-embed`. For an older tag, or a
project without that path, add the explicit path from the module's
`composer.libraries.json`.

The package ships only what Drupal serves: `build/`, the `lang/` contexts and
`theme/`.

Check the result:

```bash
composer show vardot/ckeditor5-media-embed-drupal
ls web/libraries/ckeditor5/plugins/media-embed/build/media-embed.js
```

## The Drush route

```bash
drush ckeditor_media_embed:install
drush ckeditor_media_embed:update
```

Both commands do the same thing:

1. Read the CKEditor 5 version that core reports, or `ckeditor_version` when
   it is set.
2. Ask before overwriting `libraries/ckeditor5/plugins` when that folder
   exists. `--yes` answers for you.
3. Download `@ckeditor/ckeditor5-media-embed` at that version from the npm
   registry, and extract it.
4. Copy the package into `libraries/ckeditor5/plugins/media-embed`.
5. Store the version in `plugins_version_installed`, and clear all caches.

Its limits:

- **Only versions that npm publishes.** On the 47.6.3 cores above, the
  download fails:

    ```
    Client error: `GET https://registry.npmjs.org/@ckeditor/ckeditor5-media-embed/47.6.3`
    resulted in a `404 Not Found` response
    ```

    This is tracked in
    [#3620359](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3620359).
    Its open merge request proposes loading the copy of the plugin that core
    already ships. Use Composer until then.

- **Not on Drupal 12.** The command extracts the archive with core's `Tar`
  class, deprecated in Drupal 11.3 and removed in Drupal 12.

## Switching from Drush to Composer

1. Remove the folder the Drush command created:

    ```bash
    rm -rf web/libraries/ckeditor5/plugins/media-embed
    ```

2. Require the library with Composer, as above.
3. Clear the version the Drush command stored, so the status report stops
   comparing it with core's:

    ```bash
    drush config:set ckeditor_media_embed.settings plugins_version_installed '' -y
    drush cache:rebuild
    ```

## What the status report says

The **CKEditor Media Embed plugin** row of `/admin/reports/status`:

| Value | When | What to do |
|-------|------|------------|
| Installed | `build/media-embed.js` is in place and the versions agree | Nothing. |
| Missing plugins | `build/media-embed.js` is not found | Install the library. |
| Mixed versions | `plugins_version_installed` is not core's CKEditor 5 version | Update with Drush, or switch to Composer as above. |

The row also lists the installed plugins (`media-embed`), the installed plugin
version when the Drush command set one, and the CKEditor version.

**Missing plugins** and **Mixed versions** are errors. **Installed** is
information only.

## Next steps

- [Text Formats and Allowed HTML](1-text-formats.md)
- [Upgrading](3-upgrading.md)
- [FAQ](../faq.md)
