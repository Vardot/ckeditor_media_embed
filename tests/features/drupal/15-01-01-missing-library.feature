@ckeditor-media-embed @admin @missing-library
Feature: A missing plugin library is reported with the way to install it
  As a site administrator
  I want the status report and the settings page to say when the CKEditor 5
  Media embed plugin library is missing, and how to install it
  So that I fix the install instead of guessing why embeds do not work

  Background:
    Given the CKEditor 5 Media embed plugin library is missing
      And I am a logged in user with the "Webmaster" user

  Scenario: The status report shows the missing plugin as an error
    When I go to "/admin/reports/status"
    Then I should see "CKEditor Media Embed plugin"
     And I should see "Missing plugins"
     And I should see "The following CKEditor plugins are missing: media-embed"
     And I should see "To install the CKEditor plugins run"
     And the page should not have PHP errors

  Scenario: The settings page shows the install instructions instead of the form
    When I go to "/admin/config/media/ckeditor-media-embed/settings"
    Then I should see a warning message "To install the CKEditor plugins run"
     And "#edit-embed-provider" should have a count of 0
     And the page should not have PHP errors

  Scenario: Once the library is back, the status report and the settings page are whole again
    When the CKEditor 5 Media embed plugin library is put back
     And I go to "/admin/reports/status"
    Then I should see "The following CKEditor plugins are installed: media-embed"
    When I go to "/admin/config/media/ckeditor-media-embed/settings"
    Then "#edit-embed-provider" should have a count of 1
