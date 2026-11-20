@ckeditor-media-embed @editor @oembed-fixture
Feature: A pasted media URL is embedded automatically
  As a content editor
  I want a media link I paste into the editor to become an embed
  So that I do not open a dialog for every video

  # The Auto Embed setting of a text format ("Enable auto embed") chooses what
  # a pasted media URL becomes: the Media Embed HTML or the semantic
  # <oembed>. The fixtures set Full HTML to Media Embed, and Basic HTML, which
  # has only the semantic button, to Semantic Media Embed. The paste is a real
  # paste event, so it goes through the editor's whole paste pipeline.

  Background:
    Given the media embed provider is the local oEmbed fixture provider
      And the URL "**/www.youtube.com/**" is blocked
      And the URL "**/i.ytimg.com/**" is blocked

  Scenario: On Full HTML a pasted YouTube link becomes the Media Embed HTML
    Given I am a logged in user with the "Content editor" user
      And I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "Auto embed article"
      And I paste "https://www.youtube.com/watch?v=aqz-KE-bpKQ" into the CKEditor 4 field "Body"
     Then the CKEditor 4 field "Body" should show a Media Embed preview of "iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']"
      And the CKEditor 4 field "Body" should contain "<div data-oembed-url=\"https://www.youtube.com/watch?v=aqz-KE-bpKQ\">"
     When I save the content
     Then I should see a status message "Auto embed article has been created."
      And "div[data-oembed-url] iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']" should have a count of 1

  Scenario: On Basic HTML a pasted YouTube link becomes a semantic oEmbed
    Given I am a logged in user with the "Page writer" user
      And I am adding a "page"
     When I fill in the field "#edit-title-0-value" with "Auto embed page"
      And I paste "https://youtu.be/aqz-KE-bpKQ" into the CKEditor 4 field "Body"
     Then the CKEditor 4 field "Body" should show a Semantic Media Embed preview of "iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']"
      And the CKEditor 4 field "Body" should contain "<oembed>https://youtu.be/aqz-KE-bpKQ</oembed>"
     When I save the content
     Then I should see a status message "Auto embed page has been created."
      And "div.embed-media.embed-media--video-youtube" should have a count of 1
      And "oembed" should have a count of 0

  Scenario: A pasted link the provider cannot embed stays a link
    Given I am a logged in user with the "Content editor" user
      And I am adding an "article"
     When I paste "https://www.example.com/a-page-with-no-embed" into the CKEditor 4 field "Body"
     Then I should see the CKEditor 4 notification "This URL could not be automatically embedded."
      And the CKEditor 4 field "Body" should contain "<a href=\"https://www.example.com/a-page-with-no-embed\">"
      And the CKEditor 4 field "Body" should not contain "data-oembed-url"

  # Found by this suite, not filed yet. With both buttons on the toolbar the
  # Auto Embed setting has no effect: AutoEmbed::getConfig() does not pass it
  # to CKEditor as autoEmbed_widget, so CKEditor's default, "embed,
  # embedSemantic", picks the first widget it has, the Media Embed one, and a
  # pasted link is saved as HTML instead of <oembed>.
  @wip @restores-config
  Scenario: With both buttons on the toolbar, the Semantic Media Embed setting makes a pasted link an oEmbed
    Given the Auto Embed setting of the "full_html" text format is "embedsemantic"
      And I am a logged in user with the "Content editor" user
      And I am adding an "article"
     When I paste "https://www.youtube.com/watch?v=aqz-KE-bpKQ" into the CKEditor 4 field "Body"
     Then the CKEditor 4 field "Body" should contain "<oembed>https://www.youtube.com/watch?v=aqz-KE-bpKQ</oembed>"
      And the CKEditor 4 field "Body" should not contain "data-oembed-url"
