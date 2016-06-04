<?php

/**
 * @file
 * Definition of \Drupal\ckeditor_media_embed\Plugin\CKEditorPlugin\SemanticMediaEmbed.
 */

namespace Drupal\ckeditor_media_embed\Plugin\CKEditorPlugin;

use Drupal\ckeditor\CKEditorPluginBase;
use Drupal\ckeditor\CKEditorPluginConfigurableInterface;
use Drupal\editor\Entity\Editor;

/**
 * Defines the "Semantic Media Embed" plugin.
 *
 * @CKEditorPlugin(
 *   id = "embedsemantic",
 *   label = @Translation("Semantic Media Embed"),
 *   module = "ckeditor_media_embed"
 * )
 */
class SemanticMediaEmbed extends CKEditorPluginBase {

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
    return base_path() . 'libraries/ckeditor/plugins/' . $this->getPluginId() . '/plugin.js';
  }

  /**
   * {@inheritdoc}
   */
  public function getButtons() {
    return array(
      'EmbedSemantic' => array(
        'label' => t('Semantic Media Embed'),
        'image' => base_path() . 'libraries/ckeditor/plugins/' . $this->getPluginId() . '/icons/' . $this->getPluginId() . '.png',
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
