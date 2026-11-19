<?php

namespace Drupal\Tests\ckeditor_media_embed\Kernel;

use Drupal\ckeditor5\HTMLRestrictions;
use Drupal\ckeditor5\Plugin\Editor\CKEditor5;
use Drupal\editor\Entity\Editor;
use Drupal\filter\Entity\FilterFormat;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that uninstalling the module leaves text formats that still save.
 */
#[Group('ckeditor_media_embed')]
#[RunTestsInSeparateProcesses]
class UninstallTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'user',
    'filter',
    'editor',
    'ckeditor5',
    'ckeditor_media_embed',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    // The user module cleans its users_data table on every uninstall.
    $this->installSchema('user', ['users_data']);
    $this->installConfig(['ckeditor_media_embed']);

    // A text format that does not limit HTML, like Full HTML.
    FilterFormat::create([
      'format' => 'full_html',
      'name' => 'Full HTML',
      'filters' => [],
    ])->save();
    $this->createEditor('full_html', ['bold', 'MediaEmbed']);

    // A text format that limits HTML, like Basic HTML. Its allowed HTML is
    // exactly what the enabled plugins provide, as the text format form saves
    // it, so it allows <figure class> and <oembed url> for the button.
    FilterFormat::create([
      'format' => 'basic_html',
      'name' => 'Basic HTML',
      'filters' => [
        'filter_html' => [
          'status' => TRUE,
          'settings' => [
            'allowed_html' => '<p>',
            'filter_html_help' => FALSE,
            'filter_html_nofollow' => FALSE,
          ],
        ],
      ],
    ])->save();
    $editor = $this->createEditor('basic_html', ['bold', 'MediaEmbed']);
    $this->allowWhatThePluginsProvide($editor);

    // A text editor without the button, which the uninstall must not change.
    FilterFormat::create([
      'format' => 'plain_editor',
      'name' => 'Plain editor',
      'filters' => [],
    ])->save();
    $this->createEditor('plain_editor', ['bold', 'italic']);
  }

  /**
   * After the uninstall the button is gone and every text format saves.
   */
  public function testUninstallRemovesTheButton(): void {
    foreach (['full_html', 'basic_html', 'plain_editor'] as $format_id) {
      $this->assertSame([], $this->violations($format_id), "The $format_id text format is valid before the uninstall.");
    }
    $this->assertStringContainsString('<oembed url>', $this->allowedHtml('basic_html'));

    $this->container->get('module_installer')->uninstall(['ckeditor_media_embed']);

    $this->assertSame(['bold'], Editor::load('full_html')->getSettings()['toolbar']['items']);
    $this->assertSame(['bold'], Editor::load('basic_html')->getSettings()['toolbar']['items']);
    $this->assertSame(['bold', 'italic'], Editor::load('plain_editor')->getSettings()['toolbar']['items']);

    // What a site builder sees on the text format form: every format saves.
    foreach (['full_html', 'basic_html', 'plain_editor'] as $format_id) {
      $this->assertSame([], $this->violations($format_id), "The $format_id text format still saves after the uninstall.");
    }

    // Basic HTML stops allowing what only the button wrote, and keeps the
    // rest.
    $this->assertStringNotContainsString('<oembed', $this->allowedHtml('basic_html'));
    $this->assertStringNotContainsString('<figure', $this->allowedHtml('basic_html'));
    $this->assertStringContainsString('<strong>', $this->allowedHtml('basic_html'));
  }

  /**
   * Creates a CKEditor 5 text editor for a text format.
   *
   * @param string $format_id
   *   The text format.
   * @param string[] $toolbar_items
   *   The toolbar items.
   *
   * @return \Drupal\editor\Entity\Editor
   *   The saved text editor.
   */
  protected function createEditor(string $format_id, array $toolbar_items): Editor {
    $editor = Editor::create([
      'format' => $format_id,
      'editor' => 'ckeditor5',
      'image_upload' => ['status' => FALSE],
      'settings' => [
        'toolbar' => ['items' => $toolbar_items],
        'plugins' => [],
      ],
    ]);
    $editor->save();
    return $editor;
  }

  /**
   * Sets a text format's allowed HTML to what its editor's plugins provide.
   *
   * @param \Drupal\editor\Entity\Editor $editor
   *   The text editor.
   */
  protected function allowWhatThePluginsProvide(Editor $editor): void {
    /** @var \Drupal\ckeditor5\Plugin\CKEditor5PluginManagerInterface $plugin_manager */
    $plugin_manager = $this->container->get('plugin.manager.ckeditor5.plugin');
    $enabled_plugins = array_keys($plugin_manager->getEnabledDefinitions($editor));
    $provided = new HTMLRestrictions($plugin_manager->getProvidedElements($enabled_plugins, $editor));

    $format = $editor->getFilterFormat();
    $configuration = $format->filters('filter_html')->getConfiguration();
    $configuration['settings']['allowed_html'] = $provided->toFilterHtmlAllowedTagsString();
    $format->setFilterConfig('filter_html', $configuration);
    $format->save();
  }

  /**
   * Returns the violations of a text editor and text format pair.
   *
   * @param string $format_id
   *   The text format, which shares its id with its text editor.
   *
   * @return string[]
   *   The violation messages, empty when the pair saves.
   */
  protected function violations(string $format_id): array {
    $violations = CKEditor5::validatePair(Editor::load($format_id), FilterFormat::load($format_id));
    $messages = [];
    foreach ($violations as $violation) {
      $messages[] = (string) $violation->getMessage();
    }
    return $messages;
  }

  /**
   * Returns the allowed HTML of a text format.
   *
   * @param string $format_id
   *   The text format.
   *
   * @return string
   *   The value of "Allowed HTML tags".
   */
  protected function allowedHtml(string $format_id): string {
    return FilterFormat::load($format_id)->filters('filter_html')->getConfiguration()['settings']['allowed_html'];
  }

}
