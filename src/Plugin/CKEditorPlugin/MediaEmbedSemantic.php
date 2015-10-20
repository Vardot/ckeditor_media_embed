<?php

/**
 * @file
 * Definition of \Drupal\media_embed\Plugin\CKEditorPlugin\MediaEmbedSemantic.
 */

namespace Drupal\media_embed\Plugin\CKEditorPlugin;

use Drupal\ckeditor\CKEditorPluginBase;
use Drupal\ckeditor\CKEditorPluginConfigurableInterface;
use Drupal\editor\Entity\Editor;

/**
 * Defines the "Media Embed Semantic" plugin.
 *
 * @CKEditorPlugin(
 *   id = "embedsemantic",
 *   label = @Translation("Media Embed Semantic"),
 *   module = "media_embed"
 * )
 */
class MediaEmbedSemantic extends CKEditorPluginBase {
  /**
   * {@inheritdoc}
   */
  public function getDependencies(Editor $editor) {
    return array(
      'embedbase',
      'notificationaggregator',
      'notification',
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFile() {
    return drupal_get_path('module', 'media_embed') . '/js/plugins/embedsemantic/plugin.js';
  }

  /**
   * {@inheritdoc}
   */
  public function getButtons() {
    return array(
      'EmbedSemantic' => array(
        'label' => t('Media Embed Semantic'),
        'image' => drupal_get_path('module', 'media_embed') . '/js/plugins/embedsemantic/icons/embedsemantic.png',
      ),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getConfig(Editor $editor) {
    return array();
  }
}
