<?php
/**
 * @file
 * Contains \Drupal\ckeditor_media_embed\AssetManager.
 */

namespace Drupal\ckeditor_media_embed;

use Drupal\Core\Asset\LibraryDiscoveryInterface;

class AssetManager {

  private static $libraryVersion = '4.5.x';
  private static $packagePrefix = 'ckeditor-dev';

  /**
   * Retrieve a list of all plugins to install.
   *
   * @return array
   *    An array of CKEditor plugin names that will be installed.
   */
  public static function getPlugins() {
    return [
      'autoembed',
      'autolink',
      'embed',
      'embedbase',
      'embedsemantic',
      'notification',
      'notificationaggregator',
    ];
  }

  /**
   * @todo: Document.
   */
  public static function getCKEditorVersion(LibraryDiscoveryInterface $library_discovery) {
    $version = self::$libraryVersion;

    $ckeditor_library = $library_discovery->getLibraryByName('core', 'ckeditor');

    if (!empty($ckeditor_library['version'])) {
      $version = $ckeditor_library['version'];
    }

    return $version;
  }

  /**
   * @todo: Document.
   */
  public static function getCKEditorLibraryPluginPath($base_path = '') {
    $base_path = !empty($base_path) ? $base_path : base_path();
    return $base_path . 'libraries/ckeditor/plugins/';
  }

  /**
   * @todo: Document.
   */
  public static function getCKEditorDevFullPackageUrl($version) {
    return 'https://github.com/ckeditor/' . self::$packagePrefix . '/archive/' . $version . '.zip';
  }

  /**
   * @todo: Document.
   */
  public static function getCKEditorDevFullPackageName($version) {
    return self::$packagePrefix . '-' . $version;
  }

}
