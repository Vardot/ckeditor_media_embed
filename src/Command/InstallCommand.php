<?php

namespace Drupal\ckeditor_media_embed\Command;

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Drupal\Console\Command\Command as BaseCommand;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Console\Helper\HelperSet;
use Drupal\Console\Helper\HelperTrait;
use Drupal\Console\Style\DrupalStyle;
use Alchemy\Zippy\Zippy;

/**
 * Class InstallCommand.
 *
 * @package Drupal\ckeditor_media_embed
 */
class InstallCommand extends BaseCommand {

  use HelperTrait;

  protected $packageVersion = '4.5.7';
  protected $packagePrefix = 'ckeditor-dev';
  protected $fileSystem;

  /**
   * {@inheritdoc}
   */
  public function __construct(HelperSet $helper_set) {
    parent::__construct($helper_set);

    $this->fileSystem = new FileSystem();
  }

  /**
   * {@inheritdoc}
   */
  protected function configure() {
    $this
      ->setName('ckeditor_media_embed:install')
      ->setDescription($this->trans('commands.ckeditor_media_embed.install.description'));
  }

  /**
   * {@inheritdoc}
   */
  protected function execute(InputInterface $input, OutputInterface $output) {
    $io = new DrupalStyle($input, $output);

    $package_directory = $this->downloadCKEditorFull($io);

    foreach ($this->getPlugins() as $plugin) {
      $this->installCKeditorPlugin($io, $package_directory, $plugin);
    }
  }

  /**
   * Retrieve a list of all plugins to install.
   *
   * @return array
   *    An array of CKEditor plugin names that will be installed.
   */
  protected function getPlugins() {
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
  protected function installCKeditorPlugin(DrupalStyle $io, $package_directory, $plugin_name) {
    $relative_path = 'plugins/' . $plugin_name;
    $libraries_path = $this->getSite()->getSiteRoot() . '/libraries/ckeditor/' . $relative_path;
    $package_plugin_path = $package_directory . '/' . $relative_path;

    try {
      $this->fileSystem->mkdir($libraries_path);
      $this->fileSystem->mirror($package_plugin_path, $libraries_path);

      $io->success(
        sprintf(
          $this->trans('commands.ckeditor_media_embed.install.messages.success-installed-plugin'),
          $plugin_name
        )
      );
    }
    catch (IOExceptionInterface $e) {
      $io->error($e->getMessage());
    }

    return $this;
  }

  /**
   * @todo: Document.
   */
  protected function downloadCKEditorFull(DrupalStyle $io) {
    $io->comment(
      sprintf(
        $this->trans('commands.ckeditor_media_embed.install.messages.comment-downloading-package'),
         $this->packageVersion
      )
    );

    $package_name = $this->packagePrefix . '-' . $this->packageVersion;
    $package_url = 'https://github.com/ckeditor/' . $this->packagePrefix . '/archive/' . $this->packageVersion . '.zip';
    $package_directory = sys_get_temp_dir() . '/' . $package_name;
    $package_archive = sys_get_temp_dir() . "/$package_name.zip";

    try {
      $this->getHttpClientHelper()->downloadFile($package_url, $package_archive);
      if (is_file($package_archive)) {
        $zippy = Zippy::load();
        $archive = $zippy->open($package_archive);
        $archive->extract(sys_get_temp_dir());
        $io->success(
          sprintf(
            $this->trans('commands.ckeditor_media_embed.install.messages.success-downloading-package'),
            $this->packageVersion
          )
        );
      }
    }
    catch (\Exception $e) {
      $io->error($e->getMessage());
    }

    return $package_directory;
  }

}
