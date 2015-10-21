<?php

/**
 * @file
 * Definition of \Drupal\media_embed\Plugin\CKEditorPlugin\MediaEmbedBase.
 */

namespace Drupal\media_embed\Plugin\CKEditorPlugin;

use Drupal\Core\Plugin\PluginBase;
use Drupal\editor\Entity\Editor;
use Drupal\ckeditor\CKEditorPluginInterface;

/**
 * Defines the "Media Embed Base" plugin.
 *
 * @CKEditorPlugin(
 *   id = "embedbase",
 *   label = @Translation("Media Embed Base"),
 *   module = "media_embed"
 * )
 */
class MediaEmbedBase extends PluginBase implements CKEditorPluginInterface {
  /**
   * {@inheritdoc}
   */
  public function getDependencies(Editor $editor) {
    return array('notificationaggregator');
  }

  /**
   * {@inheritdoc}
   */
  public function getLibraries(Editor $editor) {
    return array();
  }

  /**
   * {@inheritdoc}
   */
  public function isInternal() {
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function getFile() {
    return drupal_get_path('module', 'media_embed') . '/js/plugins/embedbase/plugin.js';
  }

  /**
   * {@inheritdoc}
   */
  public function getConfig(Editor $editor) {
    return array();
  }
}
