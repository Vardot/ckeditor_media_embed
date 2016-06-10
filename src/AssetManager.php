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
   * Retrieve the install status of all CKEditor plugins.
   */
  public static function getPluginsInstallStatuses() {
    $plugin_statuses = array();

    foreach (self::getPlugins() as $plugin_name) {
      $plugin_statuses[$plugin_name] = self::pluginIsInstalled($plugin_name);
    }

    return $plugin_statuses;
  }

  /**
   * @todo: Document.
   */
  public static function pluginsAreInstalled() {
    $installed = TRUE;

    foreach (self::getPlugins() as $plugin_name) {
      if (!self::pluginIsInstalled($plugin_name)) {
        $installed = FALSE;
      }
    }

    return $installed;
  }

  /**
   * @todo: Document.
   */
  public static function pluginIsInstalled($plugin_name) {
    $is_installed = FALSE;

    $library_plugin_path = self::getCKEditorLibraryPluginDirectory() . $plugin_name;
    if (is_dir($library_plugin_path) && is_file($library_plugin_path . '/plugin.js')) {
      $is_installed = TRUE;
    }

    return $is_installed;
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
  public static function getCKEditorLibraryPluginPath() {
    return base_path() . 'libraries/ckeditor/plugins/';
  }

  /**
   * @todo: Document.
   */
  public static function getCKEditorLibraryPluginDirectory() {
    return DRUPAL_ROOT . '/libraries/ckeditor/plugins/';
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
