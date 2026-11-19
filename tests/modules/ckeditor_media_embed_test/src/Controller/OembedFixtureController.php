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
 */
class OembedFixtureController implements ContainerInjectionInterface {

  /**
   * The state key that lists every url the provider was asked for.
   */
  const REQUESTED_URLS = 'ckeditor_media_embed_test.requested_urls';

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
   * Constructs an OembedFixtureController object.
   *
   * @param \Drupal\Core\State\StateInterface $state
   *   The state store, which records what the provider was asked for.
   */
  public function __construct(
    protected StateInterface $state,
  ) {}

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
   *   The request, with the media url and any provider options.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The fixture, a 400 for a missing url as public providers answer, or a
   *   404 for a url no fixture matches.
   */
  public function oembed(Request $request): JsonResponse {
    $url = (string) $request->query->get('url', '');
    $requested = $this->state->get(self::REQUESTED_URLS, []);
    $requested[] = $url;
    $this->state->set(self::REQUESTED_URLS, $requested);

    if ($url === '') {
      return new JsonResponse(['error' => "Missing required 'url' parameter"], 400);
    }

    foreach (self::FIXTURES as $pattern => $file) {
      if (preg_match($pattern, $url)) {
        $embed = json_decode(file_get_contents(dirname(__DIR__, 4) . '/fixtures/oembed/' . $file), TRUE);
        // A provider option, as oEmbed proxies offer one: ask the YouTube
        // player for its JavaScript API.
        if ($request->query->get('enablejsapi') === '1') {
          $embed['html'] = str_replace('?feature=oembed', '?feature=oembed&enablejsapi=1', $embed['html']);
        }
        return new JsonResponse($embed);
      }
    }

    return new JsonResponse(['error' => 'No matching provider found for ' . $url], 404);
  }

}
