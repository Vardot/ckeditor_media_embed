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
      And I should see "page_writer_user"
      And I should see "text_format_admin_user"
      And I should see "authenticated_user"
      And the page should not have PHP errors

  Scenario Outline: The <user> can log in
    Given I am a logged in user with the "<user>" user
     When I go to "/user"
     Then the url should match "/user/\d+$"
      And the page should not have PHP errors

    Examples:
      | user                      |
      | Content editor            |
      | Page writer               |
      | Text format administrator |
      | Authenticated user        |
