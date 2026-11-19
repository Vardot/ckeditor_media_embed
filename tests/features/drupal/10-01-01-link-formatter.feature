@ckeditor-media-embed @formatter @oembed-fixture
Feature: The link field formatter renders a link through the provider
  As a site builder
  I want a link field shown with the "Oembed element using CKEditor Media
  Embed provider" formatter
  So that editors paste a video address into a field, not into the text

  Background:
    Given the media embed provider is the local oEmbed fixture provider
      And the URL "**/www.youtube.com/**" is blocked
      And the URL "**/i.ytimg.com/**" is blocked

  Scenario: Manage display offers the formatter for link fields
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/structure/types/manage/article/display/default"
     Then I should see "Video link"
      And the option "Oembed element using CKEditor Media Embed provider" should be selected within the select element "#edit-fields-field-video-link-type"
      And the page should not have PHP errors

  Scenario: A video link renders as the provider's player
    Given I am a logged in user with the "Content editor" user
      And I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "Video link article"
      And I fill in the field "#edit-field-video-link-0-uri" with "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
      And I save the content
     Then I should see a status message "Video link article has been created."
      And ".field--name-field-video-link iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']" should have a count of 1
      And ".field--name-field-video-link iframe" should have attribute "title" with value "Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film"
      And the oEmbed fixture provider should have been asked for "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
      And I should not see a warning message

  Scenario: A link the provider cannot embed stays a plain link
    Given I am a logged in user with the "Content editor" user
      And I am adding an "article"
     When I fill in the field "#edit-title-0-value" with "Plain link article"
      And I fill in the field "#edit-field-video-link-0-uri" with "https://www.example.com/a-page-with-no-embed"
      And I save the content
     Then I should see a status message "Plain link article has been created."
      And ".field--name-field-video-link a[href='https://www.example.com/a-page-with-no-embed']" should have a count of 1
      And ".field--name-field-video-link iframe" should have a count of 0
      And I should see a warning message "Unable to retrieve https://www.example.com/a-page-with-no-embed at this time, please check again later."
