@ckeditor-media-embed @editor @oembed-fixture
Feature: Embedding a media URL through the Semantic Media Embed button
  As a content editor
  I want to paste a YouTube link into the Semantic Media Embed form
  So that the saved page shows the video, rendered by the filter from the
  link alone

  # The Semantic Media Embed button saves <oembed>URL</oembed>, and the
  # "Convert Oembed tags to media embeds" filter asks the provider for the
  # embed when the page renders. The provider is the test module
  # ckeditor_media_embed_test, which answers like an oEmbed provider from
  # tests/fixtures/oembed; no third-party oEmbed service is called. YouTube
  # itself is blocked so the editor preview and the rendered iframe do not
  # wait on the network.

  Background:
    Given the media embed provider is the local oEmbed fixture provider
      And the URL "**/www.youtube.com/**" is blocked
      And the URL "**/i.ytimg.com/**" is blocked

  Scenario: Insert a YouTube link, save the article and see the embed
    Given I am a logged in user with the "Webmaster" user
      And I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "Media embed acceptance article"
      And I click the "EmbedSemantic" button in the CKEditor 4 toolbar of the "Body" field
      And I fill in "URL" in the CKEditor 4 dialog with "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
      And I press "OK" in the CKEditor 4 dialog
     Then the CKEditor 4 field "Body" should contain "<oembed>https://www.youtube.com/watch?v=aqz-KE-bpKQ</oembed>"
      And the CKEditor 4 field "Body" should show a Semantic Media Embed preview of "iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']"
     When I submit by id "edit-submit"
     Then I should see a status message "Media embed acceptance article has been created."
      And "div.embed-media.embed-media--video-youtube" should have a count of 1
      And "div.embed-media iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']" should be attached
      And "div.embed-media iframe" should have attribute "title" with value "Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film"
      And "oembed" should have a count of 0
      And the oEmbed fixture provider should have been asked for "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
      And I should not see a warning message "Unable to retrieve"
      And the page should not have PHP errors
     When I delete the content item I am viewing
     Then I should see a status message "has been deleted."

  Scenario: The Content editor embeds the same video by its short link
    Given I am a logged in user with the "Content editor" user
      And I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "Media embed editor article"
      And I click the "EmbedSemantic" button in the CKEditor 4 toolbar of the "Body" field
      And I fill in "URL" in the CKEditor 4 dialog with "https://youtu.be/aqz-KE-bpKQ"
      And I press "OK" in the CKEditor 4 dialog
     Then the CKEditor 4 field "Body" should contain "<oembed>https://youtu.be/aqz-KE-bpKQ</oembed>"
     When I submit by id "edit-submit"
     Then I should see a status message "Media embed editor article has been created."
      And "div.embed-media.embed-media--video-youtube" should have a count of 1
      And "oembed" should have a count of 0
