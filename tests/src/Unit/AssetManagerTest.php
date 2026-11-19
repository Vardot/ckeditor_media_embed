<?php

namespace Drupal\Tests\ckeditor_media_embed\Unit;

use Drupal\Tests\UnitTestCase;
use Drupal\ckeditor_media_embed\AssetManager;
use Symfony\Component\DependencyInjection\ContainerBuilder;

/**
 * Tests the asset manager.
 *
 * @group ckeditor_media_embed
 */
class AssetManagerTest extends UnitTestCase {

  /**
   * {@inheritdoc}
   */
  public function setUp(): void {
    parent::setUp();
    $container = new ContainerBuilder();
    $container->setParameter('app.root', __DIR__ . '/../../assets');
    \Drupal::setContainer($container);
  }

  /**
   * Tests AssetManager::getPlugins().
   */
  public function testGetPlugins() {
    $this->assertSame(['media-embed'], AssetManager::getPlugins());
    $this->assertSame(['media-embed'], AssetManager::getPlugins('47.6.2'), 'The CKEditor 5 plugin set does not depend on the version.');
  }

  /**
   * Tests AssetManager::getPluginsInstallStatuses().
   */
  public function testGetPluginsInstallStatuses() {
    $this->assertSame(['media-embed' => TRUE], AssetManager::getPluginsInstallStatuses(), 'There should be a status for each plugin.');
  }

  /**
   * Tests AssetManager::pluginsAreInstalled().
   */
  public function testPluginsAreInstalled() {
    $this->assertTrue(AssetManager::pluginsAreInstalled(), 'The media-embed plugin build should be found.');
  }

  /**
   * Tests AssetManager::pluginIsInstalled().
   */
  public function testPluginIsInstalled() {
    $this->assertTrue(AssetManager::pluginIsInstalled('media-embed'), 'The media-embed plugin should be installed.');
    $this->assertFalse(AssetManager::pluginIsInstalled('embed'), 'The embed plugin should NOT be installed.');
  }

  /**
   * Tests AssetManager::getCKEditorVersion().
   */
  // @codingStandardsIgnoreLine
  public function testGetCKEditorVersion() {
    $library_discovery = $this->createMock('Drupal\Core\Asset\LibraryDiscovery');

    $config_empty = $this->getMockBuilder('\Drupal\Core\Config\ImmutableConfig')
      ->disableOriginalConstructor()
      ->getMock();
    $config_empty->expects($this->exactly(2))
      ->method('get')
      ->with('ckeditor_version')
      ->willReturn('');

    $config_factory = $this->createMock('\Drupal\Core\Config\ConfigFactory');
    $config_factory->expects($this->exactly(2))
      ->method('get')
      ->with('ckeditor_media_embed.settings')
      ->willReturn($config_empty);

    $test_library_path = '';
    $test_extension = 'test.core';
    $test_empty_extension = 'empty.test.core';

    // Test with a config file that has no ckeditor_version set, and the
    // drupal library yml file isn't found or can't be parsed.
    $this->assertSame('4.5.x', AssetManager::getCKEditorVersion($library_discovery, $config_factory, $test_library_path, $test_empty_extension), 'The version that should be retrieved is 4.5.x');

    // Test with a config file that has no ckeditor_version set, and the
    // drupal library yml file is able to be found and parsed.
    $this->assertSame('x.x.x', AssetManager::getCKEditorVersion($library_discovery, $config_factory, $test_library_path, $test_extension), 'The version that should be retrieved is x.x.x');

    // Test with a config file that has ckeditor_version set.
    $config_set = $this->createMock('\Drupal\Core\Config\ImmutableConfig');
    $config_set->expects($this->once())
      ->method('get')
      ->with('ckeditor_version')
      ->willReturn('47.6.2');

    $config_factory = $this->createMock('\Drupal\Core\Config\ConfigFactory');
    $config_factory->expects($this->once())
      ->method('get')
      ->with('ckeditor_media_embed.settings')
      ->willReturn($config_set);

    $this->assertSame('47.6.2', AssetManager::getCKEditorVersion($library_discovery, $config_factory, $test_library_path, $test_extension), 'The version that should be retrieved is 47.6.2');
  }

  /**
   * Tests AssetManager::getPluginsInstalledVersion().
   */
  public function testGetPluginsInstalledVersion() {
    $config_set = $this->createMock('\Drupal\Core\Config\ImmutableConfig');
    $config_set->expects($this->once())
      ->method('get')
      ->with('plugins_version_installed')
      ->willReturn('47.6.2');

    $config_factory = $this->createMock('\Drupal\Core\Config\ConfigFactory');
    $config_factory->expects($this->once())
      ->method('get')
      ->with('ckeditor_media_embed.settings')
      ->willReturn($config_set);

    $this->assertSame('47.6.2', AssetManager::getPluginsInstalledVersion($config_factory), 'The plugin version that should be retrieved is 47.6.2');
  }

  /**
   * Tests AssetManager::getPluginsVersion().
   */
  public function testGetPluginsVersion() {
    $test_library_path = '';
    $test_extension = 'test.core';

    // Retrieve the version from the CKEditor plugins.
    $library_discovery = $this->createMock('Drupal\Core\Asset\LibraryDiscovery');
    $config_set = $this->createMock('\Drupal\Core\Config\ImmutableConfig');
    $config_set->expects($this->once())
      ->method('get')
      ->with('plugins_version_installed')
      ->willReturn('x.x.x');

    $config_factory = $this->createMock('\Drupal\Core\Config\ConfigFactory');
    $config_factory->expects($this->once())
      ->method('get')
      ->with('ckeditor_media_embed.settings')
      ->willReturn($config_set);

    $this->assertSame('x.x.x', AssetManager::getPluginsVersion($library_discovery, $config_factory, $test_library_path, $test_extension), 'The plugin version that should be retrieved is x.x.x');

    // Retrieve the version from the CKEditor.
    $value_map = [
      ['plugins_version_installed', ''],
      ['ckeditor_version', '47.6.2'],
    ];

    $config_set = $this->createMock('\Drupal\Core\Config\ImmutableConfig');
    $config_set->expects($this->exactly(2))
      ->method('get')
      ->willReturnMap($value_map);

    $config_factory = $this->createMock('\Drupal\Core\Config\ConfigFactory');
    $config_factory->expects($this->exactly(2))
      ->method('get')
      ->with('ckeditor_media_embed.settings')
      ->willReturn($config_set);

    $this->assertSame('47.6.2', AssetManager::getPluginsVersion($library_discovery, $config_factory, $test_library_path, $test_extension), 'The plugin version that should be retrieved is 47.6.2');
  }

  /**
   * Tests AssetManager::getCKEditorLibraryPluginPath().
   *
   * The path must stay root-relative, whatever the request: see #3599775.
   */
  // @codingStandardsIgnoreLine
  public function testGetCKEditorLibraryPluginPath() {
    $this->assertSame('/libraries/ckeditor5/plugins/', AssetManager::getCKEditorLibraryPluginPath());
  }

  /**
   * Tests AssetManager::getCKEditorLibraryPluginDirectory().
   */
  // @codingStandardsIgnoreLine
  public function testGetCKEditorLibraryPluginDirectory() {
    $this->assertSame(__DIR__ . '/../../assets/libraries/ckeditor5/plugins/', AssetManager::getCKEditorLibraryPluginDirectory());
  }

  /**
   * Tests AssetManager::getNPMRegistryPackageUrl().
   */
  // @codingStandardsIgnoreLine
  public function testGetNPMRegistryPackageUrl() {
    $this->assertSame('https://registry.npmjs.org/@ckeditor/ckeditor5-media-embed/x.x.x', AssetManager::getNPMRegistryPackageUrl('x.x.x'));
  }

  /**
   * Tests AssetManager::getCKEditorDevFullPackageName().
   */
  // @codingStandardsIgnoreLine
  public function testGetCKEditorDevFullPackageName() {
    $this->assertSame('ckeditor5-media-embed-x.x.x', AssetManager::getCKEditorDevFullPackageName('x.x.x'));
  }

}
