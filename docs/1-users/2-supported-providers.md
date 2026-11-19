# Supported Providers and What Renders

Two different lists decide what you can embed:

1. **The editor** accepts a URL only from a site that CKEditor 5 recognizes.
2. **The page** shows whatever HTML the site's oEmbed provider returns for that
   URL.

A link has to pass both to end up as an embed on the page.

## What the editor accepts

The module uses the default media providers of the CKEditor 5 Media embed
plugin. It adds none and removes none.

| Site | URL forms | Preview in the editor |
|------|-----------|-----------------------|
| YouTube | `youtube.com/watch?v=`, `youtube.com/shorts/`, `youtube.com/v/`, `youtube.com/embed/`, `youtu.be/` | Yes |
| Vimeo | `vimeo.com/<id>`, `player.vimeo.com/video/<id>`, and the album, channel, group and on-demand forms | Yes |
| Dailymotion | `dailymotion.com/video/<id>`, `dai.ly/<id>` | Yes |
| Spotify | `open.spotify.com/` followed by `artist/`, `album/` or `track/` | Yes |
| Instagram | `instagram.com/p/<id>`, `instagram.com/reel/<id>` | No, a placeholder |
| X (Twitter) | `x.com/...`, `twitter.com/...` | No, a placeholder |
| Google Maps | `google.com/maps`, `maps.google.com`, `goo.gl/maps`, `maps.app.goo.gl` | No, a placeholder |
| Flickr | `flickr.com/...` | No, a placeholder |
| Facebook | `facebook.com/...` | No, a placeholder |

The `http://` or `https://` prefix and a leading `www.` are optional. Any other
URL is refused with **This media URL is not supported.**

A placeholder shows an icon and the URL, as a link that opens the media in a
new tab. It is only an editing aid. The page still renders the embed if the
provider supports the URL.

## What the page shows

When the text is displayed, the **Convert Oembed tags to media embeds** filter
sends each URL to the oEmbed provider the site is configured with. The default
is the Iframely service, which supports a long list of sites. Your administrator
may have chosen another one; see [Configuration](../2-admins/0-configuration.md).

- **The provider returned HTML**: it replaces the `<oembed>` element, inside a
  `div` with the classes `embed-media` and
  `embed-media--<type>-<provider>`, for example
  `embed-media--video-youtube`. If the provider gave a title, it is set on the
  embed's `iframe`.
- **The provider returned no HTML** for that URL: the `<oembed>` element stays
  in the page and shows nothing.
- **The provider could not be reached**, or answered with an error: the embed
  is missing, and the page shows the warning *Unable to retrieve ... at this
  time, please check again later.*, with the media URL in place of the dots.

What the embed looks like, and whether it loads scripts from other sites,
depends on the provider's answer. A video usually renders as an `iframe`
player.

## Link fields

A site builder can also show the URL of a **Link** field as an embed, with the
**Oembed element using CKEditor Media Embed provider** formatter. The same
provider builds it. When the provider returns no HTML for the URL, the field
shows the URL as a plain link instead. See
[Configuration](../2-admins/0-configuration.md#rendering-a-link-field-as-an-embed).

## Tips

- Copy the URL from the browser's address bar or from the site's **Share**
  button. Both work for the sites above.
- A YouTube start time in the URL (`&t=30`, or `?t=30` on `youtu.be`) carries
  into the editor preview.
- Private or unlisted media may not render: the provider fetches the URL as an
  anonymous visitor.

## Next steps

- [Embedding media](1-embedding-media.md)
- [FAQ](../faq.md)
