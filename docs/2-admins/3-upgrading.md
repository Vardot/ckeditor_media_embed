# Upgrading

What to watch for when moving between versions.

## Standard upgrade

```bash
composer update drupal/ckeditor_media_embed vardot/ckeditor5-media-embed-drupal
drush updatedb -y
drush cache:rebuild
```

The 2.x branch ships no update functions today. Running `drush updatedb` after
every module update is still the safe habit.

Then open the status report and check the **CKEditor Media Embed plugin** row.
After a **core** update, this row is the one to watch: a new core minor can
bundle a new CKEditor 5 version, and the library has to follow it. See
[Which version to require](2-plugin-library.md#which-version-to-require).

## The module and the library are versioned separately

| Component | Package | Where it lives |
|-----------|---------|----------------|
| Drupal module | `drupal/ckeditor_media_embed` | `modules/contrib/ckeditor_media_embed` |
| CKEditor 5 plugin | `vardot/ckeditor5-media-embed-drupal` | `libraries/ckeditor5/plugins/media-embed` |

The library's tags follow CKEditor 5 versions, not the module's. A module
update never changes which library tag you need; a core update can.

## Changes worth knowing in 2.0.x

| Release | Change |
|---------|--------|
| 2.0.4 | The plugin script got an absolute URL ([#3444588](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3444588)). A cache rebuilt from Drush could then break the editor. |
| 2.0.6 | The auto-embed on paste is gone. Use the button ([#3579176](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3579176)). |
| 2.0.7 | The module suggests `vardot/ckeditor5-media-embed-drupal`, and documents the version and licensing rules ([#3620358](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3620358)). |
| 2.0.8 | The plugin path is root-relative again, so a Drush cache rebuild no longer breaks the editor ([#3599775](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3599775)). |

If you run 2.0.4 to 2.0.7 and the editor fails to load after a deployment,
update to 2.0.8 and rebuild the caches. See
[The Root-Relative Plugin Path](../3-developers/2-root-relative-plugin-path.md).

## Upgrading from 8.x-1.x and CKEditor 4

The 8.x-1.x branch is for CKEditor 4. The 2.x branch is for CKEditor 5, on
Drupal 10.3 or later. Much more than the editor changed:

| | 8.x-1.x | 2.x |
|-|---------|-----|
| Editor | CKEditor 4 | CKEditor 5 |
| Buttons | Media Embed, Semantic Media Embed | Insert media |
| Libraries | Ten CKEditor 4 plugins in `libraries/ckeditor/plugins/` | One build in `libraries/ckeditor5/plugins/media-embed` |
| Saved markup | Media Embed: the provider's HTML. Semantic Media Embed: `<oembed>URL</oembed>` | `<oembed url="URL"></oembed>` in a `<figure class="media">` |
| Install commands | Drush, Drupal Console | Drush |

### Sequence

1. Update Drupal core to 10.3 or later.
2. Require the 2.x module and the plugin library:

    ```bash
    composer require drupal/ckeditor_media_embed:^2.0 vardot/ckeditor5-media-embed-drupal:~47.6.2
    drush updatedb -y
    ```

3. Switch each text format's editor from CKEditor 4 to CKEditor 5. The 2.x
   branch ships no CKEditor 4 to 5 upgrade plugin, so the old buttons are not
   carried over: add **Insert media** to the new toolbar yourself.
4. Keep the **Convert Oembed tags to media embeds** filter on those formats,
   or enable it.
5. Check the content embedded under CKEditor 4, as below.
6. Remove the CKEditor 4 plugins from `libraries/ckeditor/plugins` once
   nothing else uses them.

### Content saved with the Semantic Media Embed button

That button saved the URL as the text of the element:

```html
<oembed>https://www.youtube.com/watch?v=aqz-KE-bpKQ</oembed>
```

The 2.x filter reads only the `url` attribute, and CKEditor 5 only treats an
`<oembed>` with a `url` attribute as an embed. So after the upgrade such
content does not render the embed. The filter asks the provider about an empty
URL, which gives no embed, and the bare URL shows as text. When the provider
answers that request with an error, the page also shows the *Unable to
retrieve* warning.

Rewrite it to the 2.x form:

```html
<figure class="media">
  <oembed url="https://www.youtube.com/watch?v=aqz-KE-bpKQ"></oembed>
</figure>
```

Support for the old markup is proposed in
[#3389247](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3389247),
and skipping an empty URL in
[#3600610](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3600610).
Neither is part of the module yet.

### Content saved with the Media Embed button

That button saved the provider's HTML itself, in a `div` that carries the URL
in a `data-oembed-url` attribute. It renders as it is, as long as the format
allows its tags.

CKEditor 5's media plugin reads that attribute. When such content is opened in
CKEditor 5 and the URL is from a site it recognizes, the editor turns it into
an embed, and saving writes the 2.x markup.

## Verifying an upgrade

1. Open the status report. The row says **Installed**.
2. Open a node form. The toolbar loads with **Insert media**, and the browser
   console shows no errors.
3. Open existing content with embeds. They are still embeds in the editor.
4. View that content. Each embed renders, and no `<oembed>` is left in the page
   source.
5. Rebuild the caches from Drush, then reload a node form. The editor still
   loads.

These are the behaviors the functional suite covers. If you can run it, do. See
[Running Tests](../4-testing/2-running-tests.md).

## Rolling back

```bash
composer require drupal/ckeditor_media_embed:2.0.7
drush cache:rebuild
```

The 2.x branch has no update functions, so a rollback within 2.x needs nothing
else. Note that 2.0.4 to 2.0.7 carry the Drush cache rebuild problem fixed in
2.0.8.

## Next steps

- [The CKEditor 5 Plugin Library](2-plugin-library.md)
- [Architecture](../3-developers/0-architecture.md)
