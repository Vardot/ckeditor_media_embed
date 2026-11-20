@ckeditor-media-embed @admin
Feature: The provider settings page loads and saves
  As a site builder
  I want to choose the oEmbed provider the Media Embed filter calls
  So that embeds render through a service I trust

  Scenario: The settings page is listed under Configuration > Media
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/config/media"
     Then I should see "CKEditor Media Embed"
      And I should see "Configure provider to use with CKEditor Media Embed plugin."
     When I click the "CKEditor Media Embed" link
     Then the url should match "/admin/config/media/ckeditor-media-embed/settings"
      And I should see the page title "CKEditor Media Embed"
      And I should see "Provider URL"
      And "#edit-embed-provider" should have value "http://ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}"
      And the page should not have PHP errors

  Scenario: A new provider URL is saved and kept, then the default is put back
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/config/media/ckeditor-media-embed/settings"
      And I fill in the field "#edit-embed-provider" with "https://noembed.com/embed?url={url}&callback={callback}"
      And I submit by id "edit-submit"
     Then I should see a status message "The configuration options have been saved."
      And I should not see an error message
      And "#edit-embed-provider" should have value "https://noembed.com/embed?url={url}&callback={callback}"
     When I go to "/admin/config/media/ckeditor-media-embed/settings"
     Then "#edit-embed-provider" should have value "https://noembed.com/embed?url={url}&callback={callback}"
     When I fill in the field "#edit-embed-provider" with "http://ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}"
      And I submit by id "edit-submit"
     Then I should see a status message "The configuration options have been saved."
      And "#edit-embed-provider" should have value "http://ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}"

  Scenario: A provider URL that is not a URL is refused
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/config/media/ckeditor-media-embed/settings"
      And I fill in the field "#edit-embed-provider" with "not a provider"
      And I submit by id "edit-submit"
     Then I should see an error message "The provider url was not valid."
      And I should not see a status message "The configuration options have been saved."
     When I go to "/admin/config/media/ckeditor-media-embed/settings"
     Then "#edit-embed-provider" should have value "http://ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}"

  Scenario: Only a user who may administer text formats reaches the settings
    Given I am a logged in user with the "Content editor" user
     Then I should be denied access to "/admin/config/media/ckeditor-media-embed/settings"
