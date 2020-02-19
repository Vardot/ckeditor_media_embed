<?php

/**
 * @file
 * Hooks provided by the CKEditor Media Embed Plugin module.
 */

/**
 * @addtogroup hooks
 * @{
 */

/**
 * Alter the HTML of a DOM Element to be embedded.
 *
 * @param \DOMElement $child
 *   The DOM Element to be embedded.
 *
 * @param object $embed
 *   The embed json decoded object as provided by Embed::getEmbedObject().
 */
function hook_ckeditor_media_embed_dom_element_alter(\DOMElement $child, $embed) {
  if (!empty($embed->title) && $title = \Drupal\Component\Utility\Html::escape($embed->title)) {

    $child_is_iframe = ($child->tagName === 'iframe');
    if ($child_is_iframe) {
      $child->setAttribute('title', $title);
    }
    else {
      $iframes = $child->getElementsByTagName('iframe');
      $child_has_iframe = (!empty($iframes) && $iframes[0]);
      if ($child_has_iframe) {
        $iframes[0]->setAttribute('title', $title);
      }
    }
  }
}

/**
 * @} End of "addtogroup hooks".
 */
