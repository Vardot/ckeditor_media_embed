@ckeditor-media-embed @editor @oembed-fixture
Feature: A provider that cannot answer is reported, and the page still renders
  As a content editor
  I want to know when the provider could not return an embed
  So that I fix the link instead of publishing a hole in the page

  # The editor refuses a link the provider cannot answer for (see the
  # providers feature), so these <oembed> elements come from content saved
  # earlier, created here with drush.

  Background:
    Given the media embed provider is the local oEmbed fixture provider
      And the URL "**/www.dailymotion.com/**" is blocked
      And the URL "**/geo.dailymotion.com/**" is blocked

  Scenario: A link the provider has no answer for keeps its oEmbed and shows a warning
    Given a published "article" content item titled "Provider error article" exists with the "full_html" body:
        """
        <p>Text around the media.</p><oembed>https://www.dailymotion.com/video/x8abc12</oembed>
        """
      And I am a logged in user with the "Content editor" user
     When I view the content item I created
     Then I should see "Provider error article"
      And I should see a warning message "Unable to retrieve https://www.dailymotion.com/video/x8abc12 at this time, please check again later."
      And I should see "Text around the media."
      And "oembed" should have a count of 1
      And "div.embed-media" should have a count of 0
      And the oEmbed fixture provider should have been asked for "https://www.dailymotion.com/video/x8abc12"
      And the page should not have PHP errors

  Scenario: A provider that cannot be reached is reported the same way
    Given I am a logged in user with the "Webmaster" user
      And I go to "/admin/config/media/ckeditor-media-embed/settings"
      And I fill in the field "#edit-embed-provider" with "http://127.0.0.1:9/oembed?url={url}&callback={callback}"
      And I submit by id "edit-submit"
      And I should see a status message "The configuration options have been saved."
      And a published "article" content item titled "Unreachable provider article" exists with the "full_html" body:
        """
        <oembed>https://www.youtube.com/watch?v=aqz-KE-bpKQ</oembed>
        """
     When I view the content item I created
     Then I should see "Unreachable provider article"
      And I should see a warning message "Unable to retrieve https://www.youtube.com/watch?v=aqz-KE-bpKQ at this time, please check again later."
      And "div.embed-media" should have a count of 0
      And the page should not have PHP errors
