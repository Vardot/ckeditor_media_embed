# CKEditor Media Embed Plugin Documentation

A Drupal module that adds the CKEditor 5 Media embed plugin to Drupal, so
editors can put videos, posts and maps from other sites into their content by
pasting a URL.

## What is CKEditor Media Embed Plugin?

CKEditor Media Embed Plugin gives CKEditor 5 in Drupal an **Insert media**
button. An editor pastes a media URL, for example a YouTube link, and the
editor saves it as an `<oembed url="...">` element.

When the text is displayed, the **Convert Oembed tags to media embeds** filter
asks an oEmbed provider for the embed HTML and puts that HTML in the page. The
content keeps the URL, not the embed code.

### Key features

- **Insert media button**: embed a media URL from the CKEditor 5 toolbar.
- **Previews while editing**: YouTube, Vimeo, Dailymotion and Spotify links
  show a live preview in the editor.
- **Semantic storage**: only the URL is saved. The content carries no embed
  code; the provider builds it when the page renders.
- **One configurable provider**: Iframely by default, or Noembed, embed.ly or
  any other oEmbed service.
- **Accessible iframes**: the title the provider returns is set on the embed's
  `iframe`.
- **Link field formatter**: render the URL of a link field as an embed.
- **Status report check**: the site reports a missing plugin library, or one
  that does not match core's CKEditor 5.
- **Drush commands**: download the plugin library from npm.

## Getting started

### For content editors

If you write content and want to embed media:

- [Installation and Setup](1-users/0-installation.md) - Get the module and the
  plugin library in place
- [Embedding Media](1-users/1-embedding-media.md) - Use the Insert media button
  in CKEditor 5
- [Supported Providers and What Renders](1-users/2-supported-providers.md) -
  Which URLs the editor accepts and what the page shows

### For site administrators

If you configure text formats and editor toolbars:

- [Configuration](2-admins/0-configuration.md) - The provider URL and the link
  field formatter
- [Text Formats and Allowed HTML](2-admins/1-text-formats.md) - The button, the
  filter and the HTML they need
- [The CKEditor 5 Plugin Library](2-admins/2-plugin-library.md) - Which version
  to require, with Composer or Drush
- [Upgrading](2-admins/3-upgrading.md) - Updates, and the move from 8.x-1.x and
  CKEditor 4

### For developers

If you extend or integrate with the module:

- [Architecture](3-developers/0-architecture.md) - How the module, the plugin
  library and the provider fit together
- [Hooks and Extension Points](3-developers/1-hooks-and-extension-points.md) -
  The alter hook, the services and the plugins
- [The Root-Relative Plugin Path](3-developers/2-root-relative-plugin-path.md) -
  Why a Drush cache rebuild no longer breaks the editor

### Testing

- [Testing Overview](4-testing/0-overview.md) - The two test layers
- [Automated Functional Acceptance Testing](4-testing/1-automated-functional-acceptance-testing.md) -
  The webship-js browser suite
- [Running Tests](4-testing/2-running-tests.md) - Locally and in DDEV
- [GitLab CI](4-testing/3-gitlab-ci.md) - The pipeline that gates every change
- [PHPUnit](4-testing/4-phpunit.md) - Unit coverage

## Requirements

- Drupal 10.3 or later, or Drupal 11
- Drupal core **CKEditor 5**
- The CKEditor 5 Media embed plugin library in
  `libraries/ckeditor5/plugins/media-embed`, from
  [vardot/ckeditor5-media-embed-drupal](https://github.com/Vardot/ckeditor5-media-embed-drupal)
  (`~47.6.2` for Drupal 11.4) or from the module's Drush command
- An oEmbed provider your server can reach

## Quick links

- [FAQ](faq.md) - Frequently asked questions
- [Project page](https://www.drupal.org/project/ckeditor_media_embed) -
  Drupal.org project page
- [Issue queue](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items) -
  Report bugs and request features
- [Plugin library](https://github.com/Vardot/ckeditor5-media-embed-drupal) -
  The CKEditor 5 Media embed build this module loads
- [CKEditor 5 media embed](https://ckeditor.com/docs/ckeditor5/latest/features/media-embed.html) -
  Upstream documentation of the editor feature

## Need help?

- Check the [FAQ](faq.md) for common questions
- Review the documentation section that matches your role
- Search the
  [issue queue](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items)
  before filing something new
