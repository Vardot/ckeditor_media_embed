# Frequently Asked Questions

Common questions about CKEditor Media Embed Plugin.

## General

### What does this module do?

It adds an **Insert media** button to CKEditor 5 in Drupal. Editors paste the
URL of a video, a post or a map, the content stores that URL as an
`<oembed url="...">` element, and a filter turns it into the embed when the
page is displayed, with the HTML that an oEmbed provider returns.

### How is it different from core's Media module?

Core's Media module stores remote videos, YouTube and Vimeo, as media entities
of the **Remote video** type, which editors insert with the Media Library
button. They are reusable and managed like any other content.

This module puts a URL straight into the text, with no media entity, for any
site that both CKEditor 5 and your oEmbed provider support. Both buttons can sit
in the same toolbar.

### Which Drupal versions are supported?

The 2.x branch supports Drupal 10.3 and later, and Drupal 11, with CKEditor 5.
The 8.x-1.x branch was for CKEditor 4.

### Is it free?

Yes. GPL-2.0-or-later, like Drupal itself. Some oEmbed providers need a paid
account, see [Configuration](2-admins/0-configuration.md).

### Do I need an account with an oEmbed provider?

Not to start: the default Iframely endpoint takes no key. Iframely asks for an
account to use HTTPS, and embed.ly needs a key. Noembed needs none.

---

## Installation

### The toolbar does not show the button.

Check, in this order:

1. **The button is not in that format's toolbar.** Add **Insert media** to the
   CKEditor 5 toolbar of the format, see
   [Text Formats and Allowed HTML](2-admins/1-text-formats.md).
2. **The content uses another format.** The button belongs to a format, not to
   the site. Check the format under the editor.
3. **The editor does not load at all.** The browser console shows
   `Failed to load mediaEmbed - MediaEmbedEditing` and a
   `plugincollection-plugin-not-found` error. The plugin build is missing, or
   loads from the wrong URL. The status report says **Missing plugins** when
   the file is missing:

    ```bash
    ls web/libraries/ckeditor5/plugins/media-embed/build/media-embed.js
    ```

    On 2.0.4 to 2.0.7, a Drush cache rebuild could also cause this. Update to
    2.0.8, see
    [A Drush cache rebuild broke the editor](#a-drush-cache-rebuild-broke-the-editor).

### Which library version do I need?

The one that matches the CKEditor 5 version core bundles. Read it from
`web/core/core.libraries.yml`, under `ckeditor5:`. For Drupal 11.4, including
the releases that bundle 47.6.3, require
`vardot/ckeditor5-media-embed-drupal:~47.6.2`. See
[Which version to require](2-admins/2-plugin-library.md#which-version-to-require).

### Why is the library not required by the module?

Because the right version depends on your core. The module supports several
core versions, which bundle different CKEditor 5 versions, and one Composer
constraint cannot follow them. It suggests the library and leaves the version
to your project.

### Composer put the library in the wrong folder.

Tags `47.6.2` and `47.6.2.1` do not place themselves. Require `~47.6.2`, which
resolves to `47.6.2.2`, or add the installer path from the module's
`composer.libraries.json` to your project. See
[Installation and Setup](1-users/0-installation.md).

### `drush ckeditor_media_embed:install` fails with a 404.

Core reports a CKEditor 5 version that npm does not publish. Core releases from
16 September 2026 on bundle `47.6.3`, later `47.6.3-drupal.1`, and npm has
neither. Install the library with Composer instead. This is tracked in
[#3620359](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3620359).

### The status report says Mixed versions.

The Drush command installed the library for one CKEditor 5 version, and core now
bundles another, usually after a core update. Either run
`drush ckeditor_media_embed:update`, when npm has core's version, or switch to
Composer and clear the stored version, see
[Switching from Drush to Composer](2-admins/2-plugin-library.md#switching-from-drush-to-composer).

### The settings page shows only a warning.

The page shows the provider field only when the plugin build is installed.
Install the library, then reload the page.

---

## Embedding media

### The dialog says "This media URL is not supported."

CKEditor 5 only accepts URLs from the sites it knows: YouTube, Vimeo,
Dailymotion, Spotify, Instagram, X, Google Maps, Flickr and Facebook. The
module adds none. See
[Supported Providers and What Renders](1-users/2-supported-providers.md).

### I pasted a URL and it did not become an embed.

Embedding on paste is off since 2.0.6, because it raised an error when core's
Drupal media button was in the same toolbar
([#3579176](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3579176)).
Use the **Insert media** button.

### The embed renders as a plain link.

- **In a link field** shown with the **Oembed element using CKEditor Media
  Embed provider** formatter: the provider returned no HTML for that URL, so
  the formatter shows the link instead. Check the URL with your provider.
- **In the body**: the URL was pasted as text rather than inserted with the
  button, and the format turned it into a link. Insert it with the button.
- **In content from 8.x-1.x**: the Semantic Media Embed button stored the URL
  inside the tag, which 2.x does not read. See
  [Upgrading](2-admins/3-upgrading.md#content-saved-with-the-semantic-media-embed-button).

### The embed shows in the editor but not on the page.

- The **Convert Oembed tags to media embeds** filter is off on that format.
- **Limit allowed HTML tags and correct faulty HTML** runs after it and strips
  the `iframe`. Move it above the media embed filter.
- The provider returned no HTML for the URL. The `<oembed>` element stays in
  the page and shows nothing.
- The provider failed. The page shows *Unable to retrieve ... at this time,
  please check again later.* The details are in the log, type
  `ckeditor_media_embed`. Fix the provider, then clear the caches.

### Does every page view call the provider?

No. The filter calls the provider when Drupal filters the text, and Drupal
caches the result with the rendered content. The provider is called again when
that cache is rebuilt: after a save, a cache clear, or on a page that is not
cached. Caching the provider's answers as well is proposed in
[#3594347](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3594347).

### How do I style the embeds?

The filter wraps each embed in a `div` with the classes `embed-media` and
`embed-media--<type>-<provider>`, for example `embed-media--video-youtube`.
Style those in your theme, for example to make video players responsive.

---

## Text formats and the provider

### Do I need to edit the allowed HTML?

No. When you save a format that limits HTML with the button in its toolbar,
Drupal adds `<figure class>` and `<oembed url>` to the allowed HTML. What you do
need is the filter, below **Limit allowed HTML tags and correct faulty HTML**.

### Is the provider's HTML filtered?

No. With the filter below **Limit allowed HTML tags and correct faulty HTML**,
as it should be, the provider's HTML reaches the page as it comes. Use a
provider you trust.

### Can I use a different provider for each format?

No. One provider URL serves the whole site.

---

## Upgrading

### A Drush cache rebuild broke the editor.

That is the 2.0.4 to 2.0.7 bug fixed in 2.0.8
([#3599775](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3599775)).
Those releases built the plugin URL from the current request, and library
definitions built by Drush cached a host such as `http://localhost`. Update to
2.0.8 and rebuild the caches. See
[The Root-Relative Plugin Path](3-developers/2-root-relative-plugin-path.md).

### How do I upgrade from 8.x-1.x and CKEditor 4?

Update core, require 2.x and the plugin library, switch each format to
CKEditor 5 and add the **Insert media** button by hand: 2.x has no CKEditor 4
to 5 upgrade plugin. See [Upgrading](2-admins/3-upgrading.md).

### My embeds from CKEditor 4 no longer render.

Content from the Semantic Media Embed button stores the URL as the text of the
`<oembed>` element. 2.x reads only the `url` attribute. Rewrite it as
`<oembed url="...">`. Support for the old markup is proposed in
[#3389247](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3389247).

---

## Development and testing

### How do I run the tests?

There are two suites: a webship-js browser suite and a PHPUnit unit test. See
[Running Tests](4-testing/2-running-tests.md).

### Does the module provide hooks or an API?

One alter hook, `hook_ckeditor_media_embed_object_alter()`, on the provider's
answer, and the `ckeditor_media_embed` service, which you can decorate. See
[Hooks and Extension Points](3-developers/1-hooks-and-extension-points.md).

### Where do I report a bug?

In the
[issue queue](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items).
Say which module release, core release and library version you run, and
copy the **CKEditor Media Embed plugin** row of the status report.
