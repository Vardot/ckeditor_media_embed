@ckeditor-media-embed @admin
Feature: CKEditor Media Embed installs with its CKEditor 4 plugins
  As a site administrator
  I want the module to install cleanly and to find the CKEditor 4 plugins it
  needs
  So that I know the Media Embed buttons can load on my text formats

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: The module is installed with CKEditor 4 and listed on the Extend page
    Then the "ckeditor_media_embed" module should be installed
     And the "ckeditor" module should be installed
    When I go to "/admin/modules"
    Then I should see "CKEditor Media Embed plugin"
     And the page should not have PHP errors

  Scenario: The status report finds every CKEditor 4 plugin and the versions
    When I go to "/admin/reports/status"
    Then I should see the page title "Status report"
     And I should see "CKEditor Media Embed plugin"
     And I should see "The following CKEditor plugins are installed: autoembed, autolink, embed, embedbase, embedsemantic, notification, notificationaggregator, link, fakeobjects"
     And I should see "Installed plugins version: 4."
     And I should see "CKEditor version: 4."
     And I should not see "The following CKEditor plugins are missing"
     And I should not see "Mixed versions"
     And the page should not have PHP errors

  # Found by this suite, not filed yet. On Drupal 10 CKEditor 4 comes from the
  # contrib ckeditor module (4.18.0), but AssetManager reads the version from
  # core/core.libraries.yml, which no longer defines it. The module falls back
  # to 4.5.11: it reports that version, and its Drush commands download the
  # 4.5.11 plugins for a 4.18.0 editor.
  @wip
  Scenario: The status report shows the version of the CKEditor 4 the editor loads
    When I go to "/admin/reports/status"
    Then I should see "CKEditor version: 4.18.0"

  @restores-config
  Scenario: When the CKEditor version differs from the installed plugins, the status report says so and how to update them
    Given the CKEditor Media Embed "ckeditor_version" setting is "4.18.0"
    When I go to "/admin/reports/status"
    Then I should see "Mixed versions"
     And I should see "The installed CKEditor plugins have a different version than the installed CKEditor. Please consider updating the plugins."
     And I should see "To update the CKEditor plugins run"
     And I should see "CKEditor version: 4.18.0"
     And the page should not have PHP errors

  Scenario: The help page explains the two buttons, the provider, the filter and auto embed
    When I go to "/admin/help/ckeditor_media_embed"
    Then I should see "Embed media resources"
     And I should see "Two different approaches"
     And I should see "Semantic Media Embed"
     And I should see "Convert Oembed tags to media embeds"
     And I should see "Autoembed"
     And I should see "CKEditor Media Embed plugin settings page"
     And the page should not have PHP errors
