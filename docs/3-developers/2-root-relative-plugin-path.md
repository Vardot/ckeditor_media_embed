# The Root-Relative Plugin Path

Release 2.0.8 fixed an editor that stopped loading after a Drush cache rebuild
([#3599775](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3599775)).
This page explains what went wrong and what the fix guarantees.

## The symptom

On 2.0.4 to 2.0.7, after a deployment with Drush, the CKEditor 5 toolbar could
fail to load on every node form. The browser console showed
`plugincollection-plugin-not-found`, and the plugin script was blocked with
`ERR_BLOCKED_BY_ORB`, because it came from another host, such as
`http://localhost` or `http://default`.

## The cause

Since 2.0.4
([#3444588](https://git.drupalcode.org/project/ckeditor_media_embed/-/work_items/3444588)),
`AssetManager::getCKEditorLibraryPluginPath()` built an absolute URL from the
current request:

```php
public static function getCKEditorLibraryPluginPath() {
  $origin_url = \Drupal::request()->getSchemeAndHttpHost() . \Drupal::request()->getBaseUrl();
  return $origin_url . '/libraries/' . self::$ckeditorName . '/plugins/';
}
```

That broke in two ways:

1. **Library definitions are cached.** When a Drush command built them, for
   example a command that renders after `drush cr`, the "request" was Drush's,
   with the host from `--uri`. Every later web request then used that cached
   URL, pointing at the wrong host.
2. **An absolute URL is an external asset.** Core adds no cache-busting query
   string to it, so browsers could keep a stale copy of the script after an
   update.

## The fix

```php
public static function getCKEditorLibraryPluginPath() {
  return '/libraries/' . self::$ckeditorName . '/plugins/';
}
```

In a library definition, a leading slash means "relative to the Drupal root".
Core adds the base path and the cache-busting query string when it renders the
asset. The value no longer depends on the request, so definitions built by
Drush are right for every web request, on every host the site answers to.

## How it is tested

- **Unit:** `AssetManagerTest::testGetCKEditorLibraryPluginPath()` asserts the
  exact value, `/libraries/ckeditor5/plugins/`.
- **Functional:** `05-01-01-drush-cache-rebuild.feature`, tagged `@regression`,
  runs for `http://localhost` and for `http://default`. It rebuilds the caches
  from Drush, then builds the library definitions in a Drush process for the
  administration theme and the default theme, as a deployment does. Then it
  opens a node form and checks that:
    - the toolbar has the **Insert media** button;
    - exactly one script loads from
      `/libraries/ckeditor5/plugins/media-embed/build/media-embed.js`;
    - no script URL contains `localhost` or `://default/`;
    - no request went to `<uri>/libraries/**`;
    - the page has no JavaScript errors.
- `04-01-01-editor-toolbar.feature` checks the root-relative script URL on an
  ordinary page load as well.

The step that builds the definitions from Drush lives in
`tests/step-definitions/ckeditor_media_embed.steps.js`. It attaches the
library path that Drush built to the report, so a failure shows the URL.

## If you are on 2.0.4 to 2.0.7

Update to 2.0.8, then rebuild the caches:

```bash
composer update drupal/ckeditor_media_embed
drush cache:rebuild
```

A cache rebuild from Drush is safe again from 2.0.8 on.

## Next steps

- [Architecture](0-architecture.md)
- [GitLab CI](../4-testing/3-gitlab-ci.md)
