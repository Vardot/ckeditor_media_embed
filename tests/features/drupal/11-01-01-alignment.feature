@ckeditor-media-embed @editor @oembed-fixture
Feature: Alignment of an embed in the editor
  As a content editor
  I want to know what the alignment buttons do to an embedded media
  So that I do not expect the editor to align a video (#3394816)

  # #3394816 was closed as working as designed: the Media Embed plugin has no
  # alignment of its own, and CKEditor 5 text alignment applies to text
  # blocks, not to an embedded media. These scenarios hold that behavior.

  Background:
    Given the media embed provider is the local oEmbed fixture provider
      And the URL "**/www.youtube.com/**" is blocked
      And the URL "**/i.ytimg.com/**" is blocked
      And I am a logged in user with the "Content editor" user
      And I am adding an "article"
      And I fill in the rich text editor field "Body" with "<p>Text above the video.</p>"
      And I click on "Insert media" command button in the rich text editor field "Body"
      And I fill in the field ".ck-media-form input" with "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
      And I click on the insert button in "Body" rich text editor field

  Scenario: With the embed selected, the text alignment button is disabled
    Then the rich text editor toolbar should have the "Text alignment" button
     And ".ck-toolbar button[data-cke-tooltip-text='Text alignment']" should have class "ck-disabled"

  Scenario: Text next to the embed can still be aligned, and the embed is saved without alignment
    When I click on the element ".ck-editor__editable p"
    Then ".ck-toolbar button.ck-disabled[data-cke-tooltip-text='Text alignment']" should have a count of 0
    When I fill in the field "#edit-title-0-value" with "Alignment article"
     And I save the content
    Then I should see a status message "Alignment article has been created."
     And "div.embed-media.embed-media--video-youtube" should have a count of 1
     And "div.embed-media[class*='align']" should have a count of 0
