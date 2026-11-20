@ckeditor-media-embed @access
Feature: Who can use the buttons, the provider settings and the filter
  As a site owner
  I want the Media Embed buttons to follow the text format permissions, the
  provider settings to need "administer filters", and every visitor to see
  the embeds the filter renders
  So that only trusted roles change the provider and every reader sees media

  Scenario: Only the administrative roles have the "administer filters" permission
    Given I am a logged in user with the "Webmaster" user
     Then the "Text format administrator" role should have the "administer filters" permission
      And the "Content editor" role should not have the "administer filters" permission
      And the "Page writer" role should not have the "administer filters" permission

  Scenario: An anonymous visitor reaches neither the settings nor the editor
    Given I am not logged in
     When I go to "/admin/config/media/ckeditor-media-embed/settings"
     Then the page should return HTTP status 403
     When I go to "/node/add/article"
     Then the page should return HTTP status 403

  Scenario: A user with no role reaches neither the settings nor the editor
    Given I am a logged in user with the "Authenticated user" user
     Then I should be denied access to "/admin/config/media/ckeditor-media-embed/settings"
      And I should be denied access to "/admin/config/content/formats"
      And I should be denied access to "/node/add/article"

  Scenario: The Content editor writes with the buttons but changes no provider or format
    Given I am a logged in user with the "Content editor" user
     Then I should be denied access to "/admin/config/media/ckeditor-media-embed/settings"
      And I should be denied access to "/admin/config/content/formats/manage/full_html"
     When I am adding an "article"
     Then the CKEditor 4 toolbar of the "Body" field should have the "EmbedSemantic" button

  Scenario: The Text format administrator changes the provider but writes nothing
    Given I am a logged in user with the "Text format administrator" user
     Then I should be allowed access to "/admin/config/media/ckeditor-media-embed/settings"
      And I should be allowed access to "/admin/config/content/formats/manage/full_html"
      And I should be denied access to "/node/add/article"
     When I go to "/admin/config/media/ckeditor-media-embed/settings"
     Then I should see the page title "CKEditor Media Embed"
      And "#edit-embed-provider" should have value "http://ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}"
     When I submit by id "edit-submit"
     Then I should see a status message "The configuration options have been saved."

  @js-fail
  Scenario: Without Full HTML the article body has no editor, and a Basic HTML page has the semantic button
    Given I am a logged in user with the "Page writer" user
      And I am adding an "article"
     Then I should see "This field has been disabled because you do not have sufficient permissions to edit it."
      And the "Body" field should not have a CKEditor 4 editor
     When I am adding a "page"
     Then the CKEditor 4 toolbar of the "Body" field should have the "EmbedSemantic" button
      And the CKEditor 4 toolbar of the "Body" field should not have the "Embed" button
      And there should be no JavaScript errors

  @oembed-fixture
  Scenario: An anonymous visitor sees the embed the filter renders
    Given the media embed provider is the local oEmbed fixture provider
      And the URL "**/www.youtube.com/**" is blocked
      And a published "article" content item titled "Embed for every visitor" exists with the "full_html" body:
        """
        <p>Watch this.</p><oembed>https://www.youtube.com/watch?v=aqz-KE-bpKQ</oembed>
        """
      And I am not logged in
     When I view the content item I created
     Then I should see "Embed for every visitor"
      And "div.embed-media.embed-media--video-youtube iframe[src^='https://www.youtube.com/embed/aqz-KE-bpKQ']" should have a count of 1
      And "oembed" should have a count of 0
      And I should not see a warning message
