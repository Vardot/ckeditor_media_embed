@ckeditor-media-embed @drush
Feature: The Drush commands
  As a site builder
  I want the module's Drush commands to be listed and to ask before they
  overwrite the plugin library
  So that a Composer-installed library is never replaced by accident

  # Only what runs offline: with --no the commands stop at their question and
  # download nothing. The download itself goes to the npm registry, which CI
  # does not call; #3620359 tracks it.

  Scenario: Drush lists the install and update commands
    When I run drush "list --filter=ckeditor_media_embed"
    Then the drush command should succeed
     And the drush output should contain "ckeditor_media_embed:install"
     And the drush output should contain "ckeditor_media_embed:update"

  Scenario Outline: The <command> command asks before overwriting the installed library, and "no" changes nothing
    When I run drush "ckeditor_media_embed:<command> --no"
    Then the drush output should contain "This operation will overwrite plugins in"
     And the drush output should not contain "Downloading CKEditor plugin version"
     And the drush output should not contain "Successfully installed"
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/reports/status"
     Then I should see "The following CKEditor plugins are installed: media-embed"
      And I should not see "The following CKEditor plugins are missing"

    Examples:
      | command |
      | install |
      | update  |
