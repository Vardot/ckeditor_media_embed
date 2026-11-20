@ckeditor-media-embed @admin
Feature: A text format carries the Media Embed buttons, auto embed and the filter
  As a site builder
  I want the Media Embed and Semantic Media Embed buttons in the CKEditor 4
  toolbar, a choice of what a pasted media URL becomes, and the oEmbed filter
  on the same text format, as the README asks
  So that an embed added in the editor renders on the saved page

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: Full HTML uses CKEditor 4 with both buttons in its active toolbar
    When I go to "/admin/config/content/formats/manage/full_html"
    Then I should see the page title "Full HTML"
     And ".ckeditor-toolbar-active [data-drupal-ckeditor-button-name='Embed'] a" should have attribute "title" with value "Media Embed"
     And ".ckeditor-toolbar-active [data-drupal-ckeditor-button-name='EmbedSemantic'] a" should have attribute "title" with value "Semantic Media Embed"
     And the page should not have PHP errors

  Scenario: The text format offers the Auto Embed choice and points to the provider settings
    When I go to "/admin/config/content/formats/manage/full_html"
    Then I should see "Enable auto embed"
     And I should see "When enabled to a Media embed plugin, media resource URLs pasted into the editing area are turned into an embed resource using the selected plugin."
     And the checkbox with the id "edit-editor-settings-plugins-autoembed-status-embed" should be checked
     And I should see "Settings for the Media Embed and Semantic Media Embed plugins are located on the CKEditor Media Embed plugin settings page."
     And the page should not have PHP errors

  Scenario: Full HTML has the "Convert Oembed tags to media embeds" filter on
    When I go to "/admin/config/content/formats/manage/full_html"
    Then the checkbox labeled "Convert Oembed tags to media embeds" should be checked
     And I should see "The provider specified as the CKEditor Media Embed plugin settings page will be used."
     And the page should not have PHP errors

  # Found by this suite, not filed yet. The Auto Embed setting the module adds
  # to a text format (settings.plugins.autoembed of the editor) has no
  # configuration schema: config/schema defines ckeditor_media_embed.settings
  # only.
  @wip
  Scenario: The editor configuration with the Auto Embed setting matches its schema
    Then the "editor.editor.full_html" configuration should match its schema
     And the "editor.editor.basic_html" configuration should match its schema
