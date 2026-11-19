# Embedding Media

The **Insert media** button puts a video, a post or a map from another site into
your content. You give it the URL; the site builds the embed when the page is
displayed.

## Before you start

Two things have to be in place on the text format you write in:

- the **Insert media** button in its CKEditor 5 toolbar;
- the **Convert Oembed tags to media embeds** filter, which turns the saved URL
  into the embed on the page.

If you do not see the button, or your embeds do not show on the saved page, ask
a site administrator to
[set up the text format](../2-admins/1-text-formats.md).

## Embedding a media URL

1. Edit a piece of content and place the cursor where the media belongs.
2. Click the **Insert media** button in the toolbar.
3. Paste the address of the video or post into the **Media URL** field, for
   example `https://www.youtube.com/watch?v=aqz-KE-bpKQ`.
4. Click **Insert**.
5. Save the content.

In the editor, a YouTube, Vimeo, Dailymotion or Spotify link shows a live
preview. Links from the other supported sites show a placeholder with the URL.
See [Supported Providers and What Renders](2-supported-providers.md).

If the dialog says **This media URL is not supported.**, CKEditor 5 does not
recognize the site. If it says **The URL must not be empty.**, the field was
empty.

## Use the button, not paste

The dialog shows a tip once you type: *Paste the URL into the content to embed
faster.* That shortcut needs CKEditor's auto-embed plugin, which this module
does not load since 2.0.6. It was dropped because it raised an error on paste
when core's Drupal media button was in the same toolbar
([#3579176](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3579176)).

A URL pasted into the text stays text, or a plain link. Use the button.

## Changing or removing an embed

To change the URL, click the embed in the editor to select it, click
**Insert media** again, edit the URL and click **Save**.

To remove it, select the embed and press **Delete** or **Backspace**.

## What gets saved

The editor saves the URL, not the embed code:

```html
<figure class="media">
  <oembed url="https://www.youtube.com/watch?v=aqz-KE-bpKQ"></oembed>
</figure>
```

On the page, the filter replaces the `<oembed>` element with the HTML that the
oEmbed provider returns for that URL, wrapped in a `div`. For the YouTube link
above:

```html
<figure class="media">
  <div class="embed-media embed-media--video-youtube">
    <iframe width="200" height="113"
      src="https://www.youtube.com/embed/aqz-KE-bpKQ?feature=oembed"
      title="Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film"
      allowfullscreen></iframe>
  </div>
</figure>
```

The provider supplies the `iframe`. The module adds its `title` from the title
the provider returns, so screen readers can name the embed.

Because only the URL is stored, the content never carries stale embed code.
The provider's current HTML is used each time the text is rendered.

## Source editing

If your format has the **Source** button, you can write the element by hand:

```html
<oembed url="https://vimeo.com/76979871"></oembed>
```

CKEditor 5 turns it into an embed only when the `url` attribute holds a URL
from a site it recognizes. An `<oembed>` without a `url` attribute, for
example with the URL as text between the tags, is not treated as media.

## Next steps

- [Supported providers and what renders](2-supported-providers.md)
- [FAQ](../faq.md)
