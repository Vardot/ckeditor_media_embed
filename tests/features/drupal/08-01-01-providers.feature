@ckeditor-media-embed @editor @oembed-fixture
Feature: Embedding media from every common provider
  As a content editor
  I want to embed a video or a post from YouTube, Vimeo, X and Instagram
  through the same button
  So that one workflow covers the media my readers share

  # The provider is the test module ckeditor_media_embed_test, which answers
  # like an oEmbed provider from tests/fixtures/oembed. The media hosts are
  # blocked, so nothing is loaded from a third party.

  Background:
    Given the media embed provider is the local oEmbed fixture provider
      And the URL "**/www.youtube.com/**" is blocked
      And the URL "**/i.ytimg.com/**" is blocked
      And the URL "**/player.vimeo.com/**" is blocked
      And the URL "**/platform.twitter.com/**" is blocked
      And the URL "**/www.instagram.com/**" is blocked
      And I am a logged in user with the "Content editor" user

  Scenario Outline: A <provider> link is saved as an oEmbed and rendered as the provider's embed
    Given I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "<provider> embed article"
      And I click on "Insert media" command button in the rich text editor field "Body"
      And I fill in the field ".ck-media-form input" with "<url>"
      And I click on the insert button in "Body" rich text editor field
     Then the rich text editor field "Body" should contain "<oembed url=\"<url>\">"
     When I save the content
     Then I should see a status message "<provider> embed article has been created."
      And "div.embed-media.<class>" should have a count of 1
      And "div.embed-media.<class> <element>" should be attached
      And "oembed" should have a count of 0
      And the oEmbed fixture provider should have been asked for "<url>"
      And I should not see a warning message
      And the page should not have PHP errors

    Examples:
      | provider        | url                                                    | class                        | element                                                   |
      | Vimeo           | https://vimeo.com/76979871                             | embed-media--video-vimeo     | iframe[src^='https://player.vimeo.com/video/76979871']    |
      | X               | https://x.com/drupal/status/1234567890123456789        | embed-media--rich-twitter    | blockquote.twitter-tweet                                  |
      | Twitter         | https://twitter.com/drupal/status/1234567890123456789  | embed-media--rich-twitter    | blockquote.twitter-tweet                                  |
      | Instagram       | https://www.instagram.com/p/C0dEMoPost1/               | embed-media--rich-instagram  | blockquote.instagram-media                                |
      | YouTube Shorts  | https://www.youtube.com/shorts/Sh0rtsVid01             | embed-media--video-youtube   | iframe[src^='https://www.youtube.com/embed/Sh0rtsVid01']  |

  Scenario: The provider's title is given to the embedded player, for screen readers
    Given I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "Vimeo title article"
      And I click on "Insert media" command button in the rich text editor field "Body"
      And I fill in the field ".ck-media-form input" with "https://vimeo.com/76979871"
      And I click on the insert button in "Body" rich text editor field
      And I save the content
     Then "div.embed-media--video-vimeo iframe" should have attribute "title" with value "A Vimeo video for the media embed tests"

  Scenario: A provider option on the provider URL reaches the provider and the player (#3496881)
    Given the media embed provider is the local oEmbed fixture provider with "enablejsapi=1"
      And I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "YouTube JS API article"
      And I click on "Insert media" command button in the rich text editor field "Body"
      And I fill in the field ".ck-media-form input" with "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
      And I click on the insert button in "Body" rich text editor field
      And I save the content
     Then I should see a status message "YouTube JS API article has been created."
      And "div.embed-media--video-youtube iframe[src*='enablejsapi=1']" should have a count of 1

  Scenario: A link the editor does not know is refused in the media form
    Given I am adding an "article"
     When I click on "Insert media" command button in the rich text editor field "Body"
      And I fill in the field ".ck-media-form input" with "https://www.example.com/not-a-media-page"
      And I click on the insert button in "Body" rich text editor field
     Then I should see "This media URL is not supported."
      And the rich text editor field "Body" should not contain "<oembed"
