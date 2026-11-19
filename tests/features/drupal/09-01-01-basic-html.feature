@ckeditor-media-embed @editor
Feature: The button and the filter on a restricted text format
  As a site builder
  I want the Media Embed button and the "Convert Oembed tags to media embeds"
  filter on Basic HTML, which limits the HTML editors may write
  So that editors without Full HTML can embed media too

  Scenario: Basic HTML carries the button and the filter, and allows what the button writes
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/config/content/formats/manage/basic_html"
     Then I should see the page title "Basic HTML"
      And I should see "Insert media"
      And the checkbox labeled "Convert Oembed tags to media embeds" should be checked
      And the "filter.format.basic_html" configuration should contain "<oembed url>"
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
      And I fill in the rich text editor field "Body" with "<p>Our latest video.</p>"
      And I click on "Insert media" command button in the rich text editor field "Body"
      And I fill in the field ".ck-media-form input" with "https://youtu.be/aqz-KE-bpKQ"
      And I click on the insert button in "Body" rich text editor field
     Then the rich text editor field "Body" should contain "<oembed url=\"https://youtu.be/aqz-KE-bpKQ\">"
     When I save the content
     Then I should see a status message "Basic HTML embed page has been created."
      And I should see "Our latest video."
      And "div.embed-media.embed-media--video-youtube iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']" should have a count of 1
      And "oembed" should have a count of 0
      And I should not see a warning message
