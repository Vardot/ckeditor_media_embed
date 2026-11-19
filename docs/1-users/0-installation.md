# Installation and Setup

This guide covers installing CKEditor Media Embed Plugin and its CKEditor 5
plugin library, and checking that the **Insert media** button is available.

## Requirements

### Core requirements

- Drupal 10.3 or later, or Drupal 11 (`^10.3 || ^11`)
- The PHP version your Drupal core requires. The module's CI runs on PHP 8.5.

### Required Drupal core modules

- **CKEditor 5** (`ckeditor5`)

It is enabled automatically as a dependency, together with the **Text Editor**
and **Filter** modules it needs.

### Required library

The editor plugin is a separate JavaScript build of the CKEditor 5 Media embed
plugin. The module loads it from this path, relative to the Drupal root:

```
/libraries/ckeditor5/plugins/media-embed/build/media-embed.js
```

So `libraries/ckeditor5/plugins/media-embed/build/media-embed.js` has to exist
in your web root. The module only suggests the library in its `composer.json`,
it does not require it. The
[plugin library page](../2-admins/2-plugin-library.md) explains why.

### An oEmbed provider

The embed HTML comes from an oEmbed provider that your server calls when it
renders the text. The default provider is Iframely. See
[Configuration](../2-admins/0-configuration.md).

## Installation methods

### Method 1: Using Composer (recommended)

```bash
composer require drupal/ckeditor_media_embed vardot/ckeditor5-media-embed-drupal:~47.6.2
drush en ckeditor_media_embed
```

`~47.6.2` is the library line for Drupal 11.4. For other core versions, read
[which version to require](../2-admins/2-plugin-library.md#which-version-to-require).

From tag 47.6.2.2 the library places itself in
`web/libraries/ckeditor5/plugins/media-embed`, through the `installer-name` in
its `composer.json`. That works when your project has the usual
`drupal-library` installer path, as projects created from
`drupal/recommended-project` do:

```json
"installer-paths": {
  "web/libraries/{$name}": ["type:drupal-library"]
}
```

If your project has no such path, add the one from the module's
`composer.libraries.json`:

```json
{
  "extra": {
    "installer-paths": {
      "web/libraries/ckeditor5/plugins/media-embed": [
        "vardot/ckeditor5-media-embed-drupal"
      ]
    }
  }
}
```

A distribution or recipe that pins one Drupal core minor should carry the
library require itself, since only it knows which CKEditor 5 version applies.

### Method 2: Using Drush

If the module is already in your codebase:

```bash
drush en ckeditor_media_embed
drush ckeditor_media_embed:install
```

The command downloads `@ckeditor/ckeditor5-media-embed` from the npm registry,
at the CKEditor 5 version core reports, and copies it into
`libraries/ckeditor5/plugins/media-embed`.

It fails on the core releases of 16 September 2026 and later (11.4.7, 11.3.17,
10.6.17 and newer). They bundle a CKEditor 5 version that npm does not publish,
so the download ends with a 404. Use Composer there. See
[The CKEditor 5 Plugin Library](../2-admins/2-plugin-library.md#the-drush-route).

### Method 3: Manual installation

1. Download the module from
   [Drupal.org](https://www.drupal.org/project/ckeditor_media_embed) and extract
   it into `modules/contrib`.
2. Download the matching tag of the
   [plugin library](https://github.com/Vardot/ckeditor5-media-embed-drupal/tags).
3. Extract it so that the file
   `libraries/ckeditor5/plugins/media-embed/build/media-embed.js` exists in your
   web root.
4. Go to **Administration > Extend** (`/admin/modules`).
5. Find **CKEditor Media Embed plugin**, tick it and click **Install**.
6. Clear the site cache.

Manual installation is the fragile path: nothing checks that the library still
matches core's CKEditor 5 after a core update. Prefer Composer.

## Verifying the install

After enabling the module:

```bash
drush pm:list --filter=ckeditor_media_embed --status=enabled
ls web/libraries/ckeditor5/plugins/media-embed/build/media-embed.js
```

The status report at `/admin/reports/status` carries a **CKEditor Media Embed
plugin** row:

| Value | Meaning |
|-------|---------|
| Installed | The library file is in place. The row lists the installed plugins and the CKEditor version. |
| Missing plugins | `build/media-embed.js` was not found. The row says how to install it. |
| Mixed versions | The Drush command installed a library for another CKEditor 5 version than core's. |

When the library is missing, the module also warns you right after it is
installed.

Then confirm the button is available:

1. Go to **Configuration > Content authoring > Text formats and editors**
   (`/admin/config/content/formats`).
2. Configure a format that uses CKEditor 5.
3. The **Insert media** button should be in the list of available toolbar
   items.

## Next steps

- [Add the button and the filter to a text format](../2-admins/1-text-formats.md)
- [Choose the oEmbed provider](../2-admins/0-configuration.md)
- [Embed your first media URL](1-embedding-media.md)
