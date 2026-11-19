@ckeditor-media-embed @editor @regression
Feature: The editor still loads after Drush rebuilds the caches
  As a site owner who deploys with Drush
  I want the Media Embed plugin script URL to stay root-relative when the
  library definitions are built from the command line
  So that a deployment does not break the editor on every node form

  # Regression test for #3599775 (!27). Before it, library definitions built
  # by Drush stored http://localhost/libraries/ckeditor5/plugins/media-embed/
  # build/media-embed.js, and the editor failed with
  # plugincollection-plugin-not-found and ERR_BLOCKED_BY_ORB.

  @js-fail
  Scenario Outline: After a Drush cache rebuild for "<uri>" the editor loads with a root-relative plugin URL
    Given the library definitions are rebuilt by drush for "<uri>"
      And I am a logged in user with the "Webmaster" user
      And I start recording network requests
      And I am adding an "article"
     Then the rich text editor toolbar should have the "Insert media" button
      And I see visible media embed button
      And "script[src^='/libraries/ckeditor5/plugins/media-embed/build/media-embed.js']" should have a count of 1
      And "script[src*='localhost']" should have a count of 0
      And "script[src*='://default/']" should have a count of 0
      And no request to "<uri>/libraries/**" should have been made
      And there should be no JavaScript errors

    Examples:
      | uri              |
      | http://localhost |
      | http://default   |
