@ckeditor-media-embed @editor
Feature: The editor toolbar renders with the Media Embed button
  As a content editor
  I want the CKEditor 5 toolbar to load on the node form with the Media
  Embed button
  So that I can embed media while I write

  @js-fail
  Scenario: The Webmaster gets the toolbar and the Media Embed button on a new article
    Given I am a logged in user with the "Webmaster" user
      And I am adding an "article"
     Then I see visible rich text editor toolbar
      And the rich text editor toolbar should have the "Insert media" button
      And the rich text editor toolbar should have the "Bold" button
      And I see visible media embed button
      And there should be no JavaScript errors
      And the page should not have PHP errors

  @js-fail
  Scenario: The Content editor gets the same toolbar
    Given I am a logged in user with the "Content editor" user
      And I am adding an "article"
     Then the rich text editor toolbar should have the "Insert media" button
      And I see visible media embed button
      And there should be no JavaScript errors

  @js-fail
  Scenario: The plugin script is loaded from a root-relative URL
    Given I am a logged in user with the "Webmaster" user
      And I am adding an "article"
     Then "script[src^='/libraries/ckeditor5/plugins/media-embed/build/media-embed.js']" should have a count of 1
      And "script[src*='://'][src*='/libraries/ckeditor5/plugins/media-embed/']" should have a count of 0
      And the rich text editor toolbar should have the "Insert media" button
      And there should be no JavaScript errors

  Scenario: The Media Embed button opens the media URL form
    Given I am a logged in user with the "Webmaster" user
      And I am adding an "article"
     When I click on "Insert media" command button in the rich text editor field "Body"
     Then I see visible media embed dialog
      And I see visible media url field
      And I should see "Media URL"
