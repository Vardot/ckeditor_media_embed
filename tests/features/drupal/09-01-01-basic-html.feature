@ckeditor-media-embed @editor
Feature: The semantic button and the filter on a restricted text format
  As a site builder
  I want the Semantic Media Embed button and the "Convert Oembed tags to
  media embeds" filter on Basic HTML, which limits the HTML editors may
  write
  So that editors without Full HTML can embed media too

  # The README: on a format that limits HTML, use the Semantic Media Embed
  # button and allow <oembed>, because the filter, not the editor, writes the
  # embed HTML.

  Scenario: Basic HTML uses CKEditor 4 with the semantic button and the filter, and allows what the button writes
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/config/content/formats/manage/basic_html"
     Then I should see the page title "Basic HTML"
      And ".ckeditor-toolbar-active [data-drupal-ckeditor-button-name='EmbedSemantic']" should have a count of 1
      And ".ckeditor-toolbar-active [data-drupal-ckeditor-button-name='Embed']" should have a count of 0
      And the checkbox labeled "Convert Oembed tags to media embeds" should be checked
      And the checkbox with the id "edit-editor-settings-plugins-autoembed-status-embedsemantic" should be checked
      And the "filter.format.basic_html" configuration should contain "<oembed>"
      And the page should not have PHP errors

  Scenario: The text format guidelines explain the oEmbed tag on both formats
    Given I am a logged in user with the "Webmaster" user
     When I go to "/filter/tips"
     Then I should see "Basic HTML"
      And I should see "Full HTML"
      And I should see "tags are converted to the media embed HTML."

  @oembed-fixture
  Scenario: A Page writer embeds a video on a Basic HTML page
    Given the media embed provider is the local oEmbed fixture provider
      And the URL "**/www.youtube.com/**" is blocked
      And the URL "**/i.ytimg.com/**" is blocked
      And I am a logged in user with the "Page writer" user
      And I am adding a "page"
     When I fill in the field "#edit-title-0-value" with "Basic HTML embed page"
      And I fill in the CKEditor 4 field "Body" with "<p>Our latest video.</p>"
      And I click the "EmbedSemantic" button in the CKEditor 4 toolbar of the "Body" field
      And I fill in "URL" in the CKEditor 4 dialog with "https://youtu.be/aqz-KE-bpKQ"
      And I press "OK" in the CKEditor 4 dialog
     Then the CKEditor 4 field "Body" should contain "<oembed>https://youtu.be/aqz-KE-bpKQ</oembed>"
     When I save the content
     Then I should see a status message "Basic HTML embed page has been created."
      And I should see "Our latest video."
      And "div.embed-media.embed-media--video-youtube iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']" should have a count of 1
      And "oembed" should have a count of 0
      And I should not see a warning message
