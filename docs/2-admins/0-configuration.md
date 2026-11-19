# Configuration

The module has one settings page, for the oEmbed provider. The button and the
filter are set per text format, see
[Text Formats and Allowed HTML](1-text-formats.md).

## The settings page

Go to **Configuration > Media > CKEditor Media Embed**
(`/admin/config/media/ckeditor-media-embed/settings`). You need the
**Administer text formats and filters** permission (`administer filters`).

The page has one field, **Provider URL**. When the plugin library is missing,
it shows the install instructions instead.

## What the provider URL is

The module does not build embeds itself. For each `<oembed url="...">` in the
text, the filter calls an oEmbed provider with that URL and puts the HTML of
the answer in the page. **Provider URL** is the template of that call, with two
tokens:

- `{url}` is replaced with the media URL, URL-encoded.
- `{callback}` is the JSONP callback a browser would use. The module calls the
  provider from the server, so it drops the query parameter that holds it.

Put `{url}` in the query string, as every example below does.

The default is:

```
http://ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}
```

That is Iframely's endpoint for CKEditor, over plain HTTP. Iframely asks you to
create an account to use HTTPS, see their
[CKEditor documentation](https://iframely.com/docs/ckeditor).

### Examples

These come from the module's help page:

| Provider | Provider URL |
|----------|--------------|
| [Iframely](https://iframely.com/) | `//iframe.ly/api/oembed?url={url}&callback={callback}&api_key=MYAPITOKEN` |
| [Noembed](https://noembed.com/) | `//noembed.com/embed?url={url}&callback={callback}` |
| [embed.ly](https://embed.ly/) | `//api.embed.ly/1/oembed?url={url}&callback={callback}&key=MYAPITOKEN` |

Replace `MYAPITOKEN` with the key of your account. A URL that starts with `//`
takes the scheme of the current request. Many other services speak oEmbed, see
the [oEmbed specification](https://oembed.com/).

One provider serves every embed. A proxy service such as Iframely or Noembed
covers many sites. You can also use one site's own oEmbed endpoint, and then
only that site's media render.

### Validation

On save, the form removes `{url}` and `{callback}` and checks that the rest is
a valid absolute URL. A leading `//` is accepted. Anything else is refused with
**The provider url was not valid.**

### From the command line

```bash
drush config:set ckeditor_media_embed.settings embed_provider 'https://noembed.com/embed?url={url}&callback={callback}' -y
```

## Choosing a provider

- **Trust.** The filter writes the provider's HTML into your pages as it comes.
  Use a provider you trust.
- **API keys live in configuration.** A key in the provider URL is stored in
  `ckeditor_media_embed.settings` and goes wherever your configuration goes,
  including a configuration export.
- **The server makes the call.** Your web server calls the provider, not the
  visitor's browser, so it needs outbound access to it.
- **Calls follow the cache.** The filter calls the provider each time Drupal
  filters the text. Drupal caches the result with the rendered content, so the
  provider is called again when that cache is rebuilt: after a save, a cache
  clear, or on pages that are not cached. Caching the provider's answers
  themselves is proposed in
  [#3594347](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3594347).

## The help page

With the core Help module on, `/admin/help/ckeditor_media_embed` describes the
provider, the tokens and the examples above. The settings form links to it.

## Configuration keys

`ckeditor_media_embed.settings` holds three values:

| Key | Default | Set by | Purpose |
|-----|---------|--------|---------|
| `embed_provider` | the Iframely URL above | the settings page | The provider URL template. |
| `ckeditor_version` | empty | you, rarely | When set, replaces the CKEditor 5 version the module reads from core's `core.libraries.yml`. |
| `plugins_version_installed` | empty | the Drush commands | The CKEditor 5 version the Drush command last downloaded. |

The status report compares the plugin version with the CKEditor version. When
`plugins_version_installed` is empty, as it is after a Composer install, the
plugin version is taken to be core's, so there is nothing to compare.

Leave `ckeditor_version` empty unless you need the Drush command to download
another version. It also changes what the status report compares against, so
it can hide a real mismatch.

## Rendering a link field as an embed

The module also ships a formatter for **Link** fields:

1. Go to **Structure > Content types**, pick a type and open
   **Manage display**.
2. For a Link field, choose **Oembed element using CKEditor Media Embed
   provider**.
3. Save.

Each link goes to the same provider. When the provider returns HTML, the field
shows it, with the provider's title on the `iframe`. Otherwise the field shows
the URL as a plain link. The formatter has no settings and needs neither the
button nor the filter. Unlike the filter, it does not wrap the HTML in a
`div.embed-media`.

## Verifying the configuration

1. Save the settings page. It answers **The configuration options have been
   saved.**
2. Embed a YouTube URL with the **Insert media** button, save, and view the
   page.
3. In the page source, a `div.embed-media` sits where the `<oembed>` element
   was.

If the page warns *Unable to retrieve ... at this time, please check again
later.*, the server could not reach the provider, or the provider refused the
URL. The details are in **Reports > Recent log messages**, type
`ckeditor_media_embed`. After fixing the provider, clear the caches: the pages
that rendered during the failure cached the missing embed.

## Next steps

- [Text Formats and Allowed HTML](1-text-formats.md)
- [The CKEditor 5 Plugin Library](2-plugin-library.md)
- [Upgrading](3-upgrading.md)
