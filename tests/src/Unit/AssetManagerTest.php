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

  public function setUp () {
    $container = new ContainerBuilder();
    $container->set('app.root', __DIR__ . '/../../assets');
    \Drupal::setContainer($container);
  }

  public function testGetPlugins() {
    $this->assertTrue(is_array(AssetManager::getPlugins()));
  }

  public function testGetPluginInstallStatusesMissing() {
    $plugins = AssetManager::getPlugins();
    $plugin_count = count($plugins);
    $statuses = AssetManager::getPluginsInstallStatuses();
    $this->assertCount($plugin_count, $statuses);

    $missing_plugins = array_filter($statuses, function ($is_installed) {
      return !$is_installed;
    });
    $this->assertCount($plugin_count - 1, $missing_plugins);

    $installed_plugins = array_filter($statuses);
    $this->assertCount(1, $installed_plugins);
  }

}
