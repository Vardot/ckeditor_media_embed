@ckeditor-media-embed @drush
Feature: The Drush commands
  As a site builder
  I want the module's Drush commands to download the CKEditor 4 plugins it
  needs, and to ask before they overwrite them
  So that I install the plugins in one command and never replace them by
  accident

  # The CI site build itself runs "drush ckeditor_media_embed:install --yes",
  # which downloads the CKEditor 4 package from GitHub, so every pipeline
  # checks that the download still works.

  Scenario: Drush lists the install and update commands
    When I run drush "list --filter=ckeditor_media_embed"
    Then the drush command should succeed
     And the drush output should contain "ckeditor_media_embed:install"
     And the drush output should contain "ckeditor_media_embed:update"

  Scenario Outline: The <command> command asks before overwriting the installed plugins, and "no" changes nothing
    When I run drush "ckeditor_media_embed:<command> --no"
    Then the drush output should contain "This operation will overwrite plugins in"
     And the drush output should not contain "Downloading CKEditor package version"
     And the drush output should not contain "Successfully installed"
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/reports/status"
     Then I should see "The following CKEditor plugins are installed: autoembed, autolink, embed, embedbase, embedsemantic, notification, notificationaggregator, link, fakeobjects"
      And I should not see "The following CKEditor plugins are missing"

    Examples:
      | command |
      | install |
      | update  |

  @missing-library @restores-config
  Scenario: With the CKEditor version set to 4.18.0, the install command downloads the matching plugins, textmatch included
    Given the CKEditor 4 plugins are missing
      And the CKEditor Media Embed "ckeditor_version" setting is "4.18.0"
     When I run drush "ckeditor_media_embed:install --yes"
     Then the drush command should succeed
      And the drush output should contain "Successfully downloaded CKEditor package version 4.18.0."
      And the drush output should contain "Successfully installed CKEditor textmatch plugin."
      And the "ckeditor_media_embed.settings" configuration should contain "plugins_version_installed: 4.18.0"
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/reports/status"
     Then I should see "The following CKEditor plugins are installed: autoembed, autolink, embed, embedbase, embedsemantic, notification, notificationaggregator, link, fakeobjects, textmatch"
      And I should see "Installed plugins version: 4.18.0"
      And I should not see "Mixed versions"

  # Found by this suite, not filed yet. When the download fails (GitHub has no
  # 4.99.0 archive), the command prints the errors but exits 0, records
  # plugins_version_installed: 4.99.0, and the status report then lists the
  # plugins of that version as installed. A version above 4.11 also needs the
  # textmatch plugin, so the module then drops every one of its plugins and
  # the editor loses both buttons.
  @wip @missing-library @restores-config
  Scenario: A download that fails is reported as a failure and records no version
    Given the CKEditor 4 plugins are missing
      And the CKEditor Media Embed "ckeditor_version" setting is "4.99.0"
     When I run drush "ckeditor_media_embed:install --yes"
     Then the drush command should fail
      And the "ckeditor_media_embed.settings" configuration should not contain "plugins_version_installed: 4.99.0"
