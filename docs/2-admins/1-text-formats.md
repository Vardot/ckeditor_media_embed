# Text Formats and Allowed HTML

An embed needs two things on the same text format:

- the **Insert media** button, which writes the `<oembed>` element;
- the **Convert Oembed tags to media embeds** filter, which turns that element
  into the embed when the text is displayed.

The button without the filter gives content that shows nothing where the media
should be.

## Adding the button

1. Go to **Configuration > Content authoring > Text formats and editors**
   (`/admin/config/content/formats`).
2. Click **Configure** on a format that uses **CKEditor 5**.
3. In **Toolbar configuration**, find **Insert media** among the available
   items and move it into the active toolbar.
4. Click **Save configuration**.

The button is live for every user who may use that format.

Do not confuse it with core's Media Library button. That one is listed as
**Drupal media**, shows the tooltip **Insert Media** in the editor, and inserts
media entities from the site's media library. This module's button embeds a
remote URL through the oEmbed provider.

## Enabling the filter

On the same page:

1. Under **Enabled filters**, tick **Convert Oembed tags to media embeds**.
2. Check the **Filter processing order**, see below.
3. Click **Save configuration**.

The filter has no settings of its own. Its description links to the provider
settings page.

## What the plugin declares

The CKEditor 5 plugin definition, in `ckeditor_media_embed.ckeditor5.yml`,
lists the HTML the editor writes:

```yaml
elements:
  - <figure>
  - <figure class>
  - <oembed>
  - <oembed url>
```

On a format that uses **Limit allowed HTML tags and correct faulty HTML**,
Drupal adds these to the allowed HTML when you save the format with the
button. You do not edit the allowed HTML by hand. A format that does not limit
HTML, such as Full HTML, needs nothing.

## Filter processing order

The embed HTML that the provider returns, usually an `iframe` and sometimes a
script, is added by the media embed filter. If **Limit allowed HTML tags and
correct faulty HTML** runs after it, those tags are stripped again and the
embed disappears.

So on a format that limits HTML, keep **Convert Oembed tags to media embeds**
below **Limit allowed HTML tags and correct faulty HTML** in **Filter
processing order**.

This also means the filter's output is not filtered by the format. It is the
provider's HTML, as the provider sent it. See
[Choosing a provider](0-configuration.md#choosing-a-provider).

## Which formats should get it

Give the button and the filter to formats used for body content written by
trusted editors.

The module's own tests use **Full HTML**: the test recipe adds the button to
its toolbar and enables the filter, exactly as this page describes, and limits
the Article body to that format.

## Restricting who can embed

There is no permission of its own. Access follows the text format:

1. Go to **People > Permissions** (`/admin/people/permissions`).
2. Find the **Filter** section.
3. Grant **Use the (format name) text format** only to the roles that may
   embed media.

Changing the provider needs **Administer text formats and filters**, a
restricted permission. A user who holds it can also change what every format
allows.

## Verifying the configuration

1. Create or edit content that uses the format.
2. Confirm the **Insert media** button is in the live toolbar.
3. Embed a YouTube URL, save, and view the page.
4. In the page source, a `div.embed-media` sits where the `<oembed>` element
   was, and no `<oembed>` is left.

## Troubleshooting

**Insert media is not among the available toolbar items.**
The format does not use CKEditor 5 as its editor, or the module is not
enabled.

**The button is in the toolbar, but the editor does not load.**
The plugin library is missing or unreachable. The status report says
**Missing plugins**. See [The CKEditor 5 Plugin Library](2-plugin-library.md).

**The embed shows in the editor but not on the page.**
The filter is off on that format, or **Limit allowed HTML tags and correct
faulty HTML** runs after it.

**Nothing shows where the embed should be, and there is no warning.**
The provider returned no HTML for that URL. Check the URL with the provider
directly, or try another provider.

## Next steps

- [Configuration](0-configuration.md)
- [The CKEditor 5 Plugin Library](2-plugin-library.md)
