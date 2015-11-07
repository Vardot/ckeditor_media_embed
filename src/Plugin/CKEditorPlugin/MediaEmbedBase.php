<?php

/**
 * @file
 * Definition of \Drupal\media_embed\Plugin\CKEditorPlugin\MediaEmbedBase.
 */

namespace Drupal\media_embed\Plugin\CKEditorPlugin;

use Drupal\Core\Plugin\PluginBase;
use Drupal\editor\Entity\Editor;
use Drupal\ckeditor\CKEditorPluginInterface;
use Drupal\ckeditor\CKEditorPluginConfigurableInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;

/**
 * Defines the "Media Embed Base" plugin.
 *
 * @CKEditorPlugin(
 *   id = "embedbase",
 *   label = @Translation("Media Embed Base"),
 *   module = "media_embed"
 * )
 */
class MediaEmbedBase extends PluginBase implements CKEditorPluginInterface, CKEditorPluginConfigurableInterface {

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
    $config = [];

    $settings = $editor->getSettings();
    if (!empty(isset($settings['plugins']['embedbase']['embed_provider']))) {
      $config['embed_provider'] = $settings['plugins']['embedbase']['embed_provider'];
    }

    return $config;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state, Editor $editor) {
    $settings = $editor->getSettings();

    $form['embed_provider'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Provider URL'),
      '#default_value' => isset($settings['plugins']['embedbase']['embed_provider']) ? $settings['plugins']['embedbase']['embed_provider'] : '',
      '#description' => $this->t('
        !link &mdash; A template for the URL of the provider endpoint. This URL will be queried for each resource to be embedded. By default CKEditor uses the Iframely service.<br />
        <strong>Template parameters</strong><br />
        {url} &mdash; The URL of the requested media, e.g. https://twitter.com/ckeditor/status/401373919157821441.<br />
        {callback} &mdash; The name of the globally available callback used for JSONP requests.<br />',
        array('!link' => \Drupal::l(t('embed_provider'), URL::fromUri('http://docs.ckeditor.com/#!/api/CKEDITOR.config-cfg-embed_provider', ['attributes' => ['target' => '_blank']])))
      ),
      '#placeholder' => '//example.com/api/oembed-proxy?resource-url={url}&callback={callback}',
    );

    return $form;
  }

}
