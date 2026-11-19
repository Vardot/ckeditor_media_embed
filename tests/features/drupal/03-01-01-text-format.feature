@ckeditor-media-embed @admin
Feature: A text format carries the Media Embed button and filter
  As a site builder
  I want the Media Embed button in the toolbar and the oEmbed filter on the
  same text format, as the README asks
  So that an embed added in the editor renders on the saved page

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: Full HTML lists the Media Embed button in its active toolbar
    When I go to "/admin/config/content/formats/manage/full_html"
    Then I should see the page title "Full HTML"
     And I should see "Insert media"
     And the page should not have PHP errors

  Scenario: Full HTML has the "Convert Oembed tags to media embeds" filter on
    When I go to "/admin/config/content/formats/manage/full_html"
    Then the checkbox labeled "Convert Oembed tags to media embeds" should be checked
     And the page should not have PHP errors
