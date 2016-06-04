<?php

namespace Drupal\ckeditor_media_embed\Command;

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Command\Command as BaseCommand;
use Drupal\Console\Command\Shared\CommandTrait;
use Drupal\Console\Style\DrupalStyle;

/**
 * Class InstallCommand.
 *
 * @package Drupal\ckeditor_media_embed
 */
class InstallCommand extends BaseCommand {

  use CommandTrait;

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

    $text = sprintf(
      'I am a new generated command for the module: %s',
      $this->getModule()
    );

    $io->info($text);
  }

}
