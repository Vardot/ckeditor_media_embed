<?php

namespace Drupal\Tests\ckeditor_media_embed\Kernel;

use Drupal\ckeditor_media_embed\Embed;
use Drupal\KernelTests\KernelTestBase;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use Symfony\Component\DependencyInjection\ContainerBuilder;

/**
 * Tests that an oembed element with an empty url makes no provider request.
 */
#[CoversClass(Embed::class)]
#[Group('ckeditor_media_embed')]
#[RunTestsInSeparateProcesses]
class EmbedEmptyUrlTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'ckeditor_media_embed',
  ];

  /**
   * Records every HTTP request the mocked Guzzle client receives.
   *
   * @var array
   */
  protected array $httpHistory = [];

  /**
   * The mock handler whose queued responses are dispensed in order.
   *
   * @var \GuzzleHttp\Handler\MockHandler
   */
  protected MockHandler $mockHandler;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installConfig(['ckeditor_media_embed']);
  }

  /**
   * {@inheritdoc}
   */
  public function register(ContainerBuilder $container) {
    parent::register($container);

    // No responses are queued: any request the embed service tries to make
    // would throw, but the assertion on $httpHistory is what proves the fix.
    $this->mockHandler = new MockHandler();
    $stack = HandlerStack::create($this->mockHandler);
    $stack->push(Middleware::history($this->httpHistory));

    $container->set('http_client', new Client(['handler' => $stack]));
  }

  /**
   * An oembed element with an empty or missing url makes no upstream request.
   *
   * Regression test: an empty url attribute previously produced a
   * `GET ...?url=` call that the provider rejected with a 400 Bad Request,
   * logging an exception on every render of the host content.
   */
  public function testEmptyUrlOembedMakesNoRequest(): void {
    /** @var \Drupal\ckeditor_media_embed\EmbedInterface $embed */
    $embed = $this->container->get('ckeditor_media_embed');

    $output = $embed->processEmbeds('<p>Before</p><oembed url=""></oembed><oembed></oembed><p>After</p>');

    $this->assertCount(0, $this->httpHistory, 'An oembed element with an empty or missing url triggers no upstream request.');
    $this->assertStringContainsString('Before', $output);
    $this->assertStringContainsString('After', $output);
  }

}
