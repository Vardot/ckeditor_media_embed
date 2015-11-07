<?php

/**
 * @file
 * Definition of \Drupal\media_embed\Plugin\CKEditorPlugin\AutoEmbed.
 */

namespace Drupal\media_embed\Plugin\CKEditorPlugin;

use Drupal\Core\Plugin\PluginBase;
use Drupal\editor\Entity\Editor;
use Drupal\ckeditor\CKEditorPluginInterface;
use Drupal\ckeditor\CKEditorPluginConfigurableInterface;
use Drupal\ckeditor\CKEditorPluginContextualInterface;
use Drupal\Core\Form\FormStateInterface;

/**
 * Defines the "Auto Embed" plugin.
 *
 * @CKEditorPlugin(
 *   id = "autoembed",
 *   label = @Translation("Auto Embed"),
 *   module = "media_embed"
 * )
 */
class AutoEmbed extends PluginBase implements CKEditorPluginInterface, CKEditorPluginContextualInterface, CKEditorPluginConfigurableInterface {

  /**
   * {@inheritdoc}
   */
  public function getDependencies(Editor $editor) {
    return array(
      'autolink',
      'embed',
      'embedbase',
      'notificationaggregator',
      'notification',
    );
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
    return drupal_get_path('module', 'media_embed') . '/js/plugins/autoembed/plugin.js';
  }

  /**
   * {@inheritdoc}
   */
  public function getConfig(Editor $editor) {
    return array();
  }

  /**
   * {@inheritdoc}
   */
  public function isEnabled(Editor $editor) {
    $settings = $editor->getSettings();

    return (isset($settings['plugins']['autoembed']['status']) && $settings['plugins']['autoembed']['status']);
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state, Editor $editor) {
    $settings = $editor->getSettings();

    $form['status'] = array(
      '#type' => 'checkbox',
      '#title' => $this->t('Enable auto embed'),
      '#default_value' => isset($settings['plugins']['autoembed']['status']) ? $settings['plugins']['autoembed']['status'] : 0,
      '#description' => $this->t('When enabled media resource URLs pasted into the editing area are turned into an embed resource.'),
    );

    return $form;
  }

}
