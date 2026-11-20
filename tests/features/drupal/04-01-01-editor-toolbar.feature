@ckeditor-media-embed @editor
Feature: The CKEditor 4 toolbar renders with the Media Embed buttons
  As a content editor
  I want the CKEditor 4 toolbar to load on the node form with the Media
  Embed and Semantic Media Embed buttons
  So that I can embed media while I write

  @js-fail
  Scenario: The Webmaster gets CKEditor 4 and both buttons on a new article
    Given I am a logged in user with the "Webmaster" user
      And I am adding an "article"
     Then the "Body" field should have a CKEditor 4 editor
      And the CKEditor 4 toolbar of the "Body" field should have the "Embed" button
      And the CKEditor 4 toolbar of the "Body" field should have the "EmbedSemantic" button
      And the CKEditor 4 toolbar of the "Body" field should have the "Bold" button
      And I see visible media embed button
      And I see visible semantic media embed button
      And there should be no JavaScript errors
      And the page should not have PHP errors

  @js-fail
  Scenario: The Content editor gets the same toolbar
    Given I am a logged in user with the "Content editor" user
      And I am adding an "article"
     Then the CKEditor 4 toolbar of the "Body" field should have the "Embed" button
      And the CKEditor 4 toolbar of the "Body" field should have the "EmbedSemantic" button
      And there should be no JavaScript errors

  @js-fail
  Scenario: The plugin scripts are loaded from root-relative URLs
    Given I am a logged in user with the "Webmaster" user
      And I am adding an "article"
     Then the CKEditor 4 toolbar of the "Body" field should have the "Embed" button
      And "script[src^='/libraries/ckeditor/plugins/embed/plugin.js']" should have a count of 1
      And "script[src^='/libraries/ckeditor/plugins/embedsemantic/plugin.js']" should have a count of 1
      And "script[src^='/libraries/ckeditor/plugins/autoembed/plugin.js']" should have a count of 1
      And "script[src*='://'][src*='/libraries/ckeditor/plugins/']" should have a count of 0
      And there should be no JavaScript errors

  Scenario Outline: The <button> button opens the Media Embed dialog with a URL field
    Given I am a logged in user with the "Webmaster" user
      And I am adding an "article"
     When I click the "<button>" button in the CKEditor 4 toolbar of the "Body" field
     Then the CKEditor 4 dialog "Media Embed" should be open
      And I should see "URL"
     When I press "Cancel" in the CKEditor 4 dialog
     Then the CKEditor 4 dialog "Media Embed" should not be open
      And the CKEditor 4 field "Body" should not contain "oembed"

    Examples:
      | button        |
      | Embed         |
      | EmbedSemantic |
