@ckeditor-media-embed @editor @oembed-fixture
Feature: The Media Embed button saves the provider's HTML
  As a content editor
  I want the "Media Embed" button to insert what the provider returns
  So that the saved page shows the media without the oEmbed filter

  # The Media Embed button asks the provider from the browser (JSONP) and
  # saves the HTML it returns, inside <div data-oembed-url>. The filter is not
  # involved: the Semantic Media Embed button and the filter have features of
  # their own. The provider is the test module ckeditor_media_embed_test, and
  # YouTube itself is blocked.

  Background:
    Given the media embed provider is the local oEmbed fixture provider
      And the URL "**/www.youtube.com/**" is blocked
      And the URL "**/i.ytimg.com/**" is blocked

  Scenario: Insert a YouTube link with the Media Embed button, save and see the provider's player
    Given I am a logged in user with the "Content editor" user
      And I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "Media embed HTML article"
      And I click the "Embed" button in the CKEditor 4 toolbar of the "Body" field
      And I fill in "URL" in the CKEditor 4 dialog with "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
      And I press "OK" in the CKEditor 4 dialog
     Then the CKEditor 4 dialog "Media Embed" should not be open
      And the CKEditor 4 field "Body" should show a Media Embed preview of "iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']"
      And the CKEditor 4 field "Body" should contain "<div data-oembed-url=\"https://www.youtube.com/watch?v=aqz-KE-bpKQ\">"
      And the CKEditor 4 field "Body" should not contain "<oembed>"
      And the editor should have asked the oEmbed fixture provider for "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
     When I save the content
     Then I should see a status message "Media embed HTML article has been created."
      And "div[data-oembed-url='https://www.youtube.com/watch?v=aqz-KE-bpKQ'] iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']" should have a count of 1
      And "div.embed-media" should have a count of 0
      And the oEmbed fixture provider should not have been asked for "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
      And the page should not have PHP errors
