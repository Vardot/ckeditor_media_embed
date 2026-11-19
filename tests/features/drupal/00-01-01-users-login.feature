@ckeditor-media-embed @admin
Feature: Login for every configured user
  As a site administrator
  I want every user in the cucumber.shared.js users registry to be
  able to log in
  So that the suite has known-good fixtures for every role before any
  role-specific scenario runs

  Scenario: Webmaster can log in and sees every testing user
    Given I add testing users
      And I am a logged in user with the "Webmaster" user
     When I go to "/user"
     Then the url should match "/user/\d+$"
      And the page should not have PHP errors
     When I go to "/admin/people"
     Then I should see "content_editor_user"
      And the page should not have PHP errors

  Scenario: The Content editor can log in
    Given I am a logged in user with the "Content editor" user
     When I go to "/user"
     Then the url should match "/user/\d+$"
      And the page should not have PHP errors
