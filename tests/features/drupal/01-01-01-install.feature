@ckeditor-media-embed @admin
Feature: CKEditor Media Embed installs with its plugin library
  As a site administrator
  I want the module to install cleanly and to find its CKEditor 5 plugin
  So that I know the Media Embed button can load on my text formats

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: The module is installed and listed on the Extend page
    Then the "ckeditor_media_embed" module should be installed
     And the "ckeditor5" module should be installed
    When I go to "/admin/modules"
    Then I should see "CKEditor Media Embed plugin"
     And the page should not have PHP errors

  Scenario: The status report finds the plugin library and the CKEditor version
    When I go to "/admin/reports/status"
    Then I should see the page title "Status report"
     And I should see "CKEditor Media Embed plugin"
     And I should see "The following CKEditor plugins are installed: media-embed"
     And I should see "CKEditor version: 47."
     And I should not see "The following CKEditor plugins are missing"
     And I should not see "Mixed versions"
     And the page should not have PHP errors

  Scenario: The help page explains the provider and the filter
    When I go to "/admin/help/ckeditor_media_embed"
    Then I should see "Embed media resources"
     And I should see "Convert Oembed tags to media embeds"
     And I should see "CKEditor Media Embed plugin settings page"
     And the page should not have PHP errors
