@ckeditor-media-embed @admin @missing-library
Feature: Missing CKEditor 4 plugins are reported with the way to install them
  As a site administrator
  I want the status report and the settings page to say when the CKEditor 4
  plugins the module needs are missing, and how to install them
  So that I fix the install instead of guessing why embeds do not work

  Background:
    Given the CKEditor 4 plugins are missing
      And I am a logged in user with the "Webmaster" user

  Scenario: The status report shows the missing plugins as an error
    When I go to "/admin/reports/status"
    Then I should see "CKEditor Media Embed plugin"
     And I should see "Missing plugins"
     And I should see "The following CKEditor plugins are missing: autoembed, autolink, embed, embedbase, embedsemantic, notification, notificationaggregator, link, fakeobjects"
     And I should see "To install the CKEditor plugins run"
     And the page should not have PHP errors

  Scenario: The settings page shows the install instructions instead of the form
    When I go to "/admin/config/media/ckeditor-media-embed/settings"
    Then I should see a warning message "To install the CKEditor plugins run"
     And "#edit-embed-provider" should have a count of 0
     And the page should not have PHP errors

  @js-fail
  Scenario: The editor still loads, without the Media Embed buttons, and the missing plugins are logged
    When I am adding an "article"
    Then the "Body" field should have a CKEditor 4 editor
     And the CKEditor 4 toolbar of the "Body" field should have the "Bold" button
     And the CKEditor 4 toolbar of the "Body" field should not have the "Embed" button
     And the CKEditor 4 toolbar of the "Body" field should not have the "EmbedSemantic" button
     And there should be no JavaScript errors
    When I go to "/admin/reports/dblog"
    Then I should see "The following plugins are missing"

  Scenario: Once the plugins are back, the status report, the settings page and the editor are whole again
    When the CKEditor 4 plugins are put back
     And I go to "/admin/reports/status"
    Then I should see "The following CKEditor plugins are installed: autoembed"
    When I go to "/admin/config/media/ckeditor-media-embed/settings"
    Then "#edit-embed-provider" should have a count of 1
    When I am adding an "article"
    Then the CKEditor 4 toolbar of the "Body" field should have the "EmbedSemantic" button
