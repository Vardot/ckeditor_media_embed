<?php

namespace Drupal\ckeditor_media_embed_test\Controller;

use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\State\StateInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Answers oEmbed requests from local fixtures, the way a provider does.
 *
 * The functional tests point the module's provider URL here, so an embed
 * renders without calling a third-party oEmbed service:
 * /ckeditor-media-embed-test/oembed?url={url}&callback={callback}.
 *
 * Two callers ask it. The CKEditor 4 embed plugins in the browser ask with a
 * JSONP callback, and get JSONP back. The module's filter and link formatter
 * ask from the server without one, and get JSON.
 */
class OembedFixtureController implements ContainerInjectionInterface {

  /**
   * The state key that lists every url the site asked for, without JSONP.
   */
  const REQUESTED_URLS = 'ckeditor_media_embed_test.requested_urls';

  /**
   * The state key that lists every url the editor asked for, with JSONP.
   */
  const REQUESTED_URLS_JSONP = 'ckeditor_media_embed_test.requested_urls_jsonp';

  /**
   * The fixture file of each media URL pattern; the first match wins.
   */
  const FIXTURES = [
    '@^https?://(www\.|m\.)?youtube\.com/shorts/@' => 'youtube-shorts.json',
    '@^https?://((www\.|m\.)?youtube\.com/watch|youtu\.be/)@' => 'youtube.json',
    '@^https?://(www\.)?vimeo\.com/\d+@' => 'vimeo.json',
    '@^https?://(www\.)?(twitter|x)\.com/[^/]+/status/\d+@' => 'twitter.json',
    '@^https?://(www\.)?instagram\.com/(p|reel)/@' => 'instagram.json',
  ];

  /**
   * The state store, which records what the provider was asked for.
   *
   * @var \Drupal\Core\State\StateInterface
   */
  protected $state;

  /**
   * Constructs an OembedFixtureController object.
   *
   * @param \Drupal\Core\State\StateInterface $state
   *   The state store.
   */
  public function __construct(StateInterface $state) {
    $this->state = $state;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static($container->get('state'));
  }

  /**
   * Returns the oEmbed answer for the url query parameter.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request, with the media url, any provider options and, from the
   *   editor, the JSONP callback.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The fixture, a 400 for a missing url as public providers answer, or a
   *   404 for a url no fixture matches.
   */
  public function oembed(Request $request) {
    $url = (string) $request->query->get('url', '');
    $callback = (string) $request->query->get('callback', '');

    $key = $callback === '' ? self::REQUESTED_URLS : self::REQUESTED_URLS_JSONP;
    $requested = $this->state->get($key, []);
    $requested[] = $url;
    $this->state->set($key, $requested);

    if ($url === '') {
      $response = new JsonResponse(['error' => "Missing required 'url' parameter"], 400);
    }
    else {
      $response = new JsonResponse(['error' => 'No matching provider found for ' . $url], 404);
      foreach (self::FIXTURES as $pattern => $file) {
        if (preg_match($pattern, $url)) {
          $embed = json_decode(file_get_contents(dirname(__DIR__, 4) . '/fixtures/oembed/' . $file), TRUE);
          // A provider option, as oEmbed proxies offer one: ask the YouTube
          // player for its JavaScript API.
          if ($request->query->get('enablejsapi') === '1') {
            $embed['html'] = str_replace('?feature=oembed', '?feature=oembed&enablejsapi=1', $embed['html']);
          }
          $response = new JsonResponse($embed);
          break;
        }
      }
    }

    if ($callback !== '') {
      $response->setCallback($callback);
    }
    return $response;
  }

}
