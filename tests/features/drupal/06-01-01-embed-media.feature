@ckeditor-media-embed @editor @oembed-fixture
Feature: Embedding a media URL through the button
  As a content editor
  I want to paste a YouTube link into the Media Embed form
  So that the saved page shows the video

  # The provider is a JSON fixture the test site serves, answering like an
  # oEmbed provider for a YouTube link; no third-party oEmbed service is
  # called. YouTube itself is blocked so the editor preview and the rendered
  # iframe do not wait on the network.

  Background:
    Given the media embed provider is the "youtube" oEmbed fixture
      And the URL "**/www.youtube.com/**" is blocked
      And the URL "**/i.ytimg.com/**" is blocked

  Scenario: Insert a YouTube link, save the article and see the embed
    Given I am a logged in user with the "Webmaster" user
      And I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "Media embed acceptance article"
      And I click on "Insert media" command button in the rich text editor field "Body"
      And I fill in the field ".ck-media-form input" with "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
      And I click on the insert button in "Body" rich text editor field
     Then the rich text editor field "Body" should contain "<oembed url=\"https://www.youtube.com/watch?v=aqz-KE-bpKQ\">"
      And I see visible editor media preview
     When I submit by id "edit-submit"
     Then I should see a status message "Media embed acceptance article has been created."
      And "div.embed-media.embed-media--video-youtube" should have a count of 1
      And "div.embed-media iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']" should be attached
      And "div.embed-media iframe" should have attribute "title" with value "Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film"
      And "oembed" should have a count of 0
      And I should not see a warning message "Unable to retrieve"
      And the page should not have PHP errors
     When I delete the content item I am viewing
     Then I should see a status message "has been deleted."

  Scenario: The Content editor embeds the same link
    Given I am a logged in user with the "Content editor" user
      And I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "Media embed editor article"
      And I click on "Insert media" command button in the rich text editor field "Body"
      And I fill in the field ".ck-media-form input" with "https://youtu.be/aqz-KE-bpKQ"
      And I click on the insert button in "Body" rich text editor field
     Then the rich text editor field "Body" should contain "<oembed url=\"https://youtu.be/aqz-KE-bpKQ\">"
     When I submit by id "edit-submit"
     Then I should see a status message "Media embed editor article has been created."
      And "div.embed-media.embed-media--video-youtube" should have a count of 1
      And "oembed" should have a count of 0
