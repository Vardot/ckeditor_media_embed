@ckeditor-media-embed @admin @uninstall
Feature: Uninstalling the module leaves nothing behind
  As a site builder
  I want to uninstall CKEditor Media Embed cleanly
  So that no setting, no plugin script and no button of it stays on the site

  # These scenarios uninstall the module, so they run in this order, last, in
  # a CI group of their own.

  Scenario: Take the filter off the formats, uninstall, and the module's settings, script and formatter are gone
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/modules/uninstall"
     Then I should see "Provides a filter plugin that is in use in the following filter formats"
     When I go to "/admin/config/content/formats/manage/full_html"
      And I uncheck "Convert Oembed tags to media embeds"
      And I wait for the AJAX requests to finish
      And I submit by id "edit-submit"
     Then I should see a status message "The text format Full HTML has been updated."
     When I go to "/admin/config/content/formats/manage/basic_html"
      And I uncheck "Convert Oembed tags to media embeds"
      And I wait for the AJAX requests to finish
      And I submit by id "edit-submit"
     Then I should see a status message "The text format Basic HTML has been updated."
     When I go to "/admin/modules/uninstall"
      And I check "uninstall[ckeditor_media_embed]"
      And I submit by id "edit-submit"
     Then I should see the page title "Confirm uninstall"
     When I submit by id "edit-submit"
     Then I should see a status message "The selected modules have been uninstalled."
      And the "ckeditor_media_embed" module should not be installed
      And the "ckeditor_media_embed.settings" configuration should not exist
      And the "core.entity_view_display.node.article.default" configuration should not contain "ckeditor_media_embed_link_formatter"
      And the "filter.format.full_html" configuration should not contain "filter_ckeditor_media_embed"
      And the "filter.format.basic_html" configuration should not contain "filter_ckeditor_media_embed"
     When I go to "/admin/reports/status"
     Then I should not see "CKEditor Media Embed plugin"
     When I am adding an "article"
     Then the rich text editor toolbar should have the "Bold" button
      And the rich text editor toolbar should not have the "Insert media" button
      And "script[src*='media-embed.js']" should have a count of 0
      And there should be no JavaScript errors

  # Regression for #3620365: the uninstall used to leave the MediaEmbed toolbar
  # item in the editor configuration of every text format that had the button,
  # and saving such a format then failed with "The provided toolbar item
  # MediaEmbed is not valid."
  Scenario: After the uninstall the text formats no longer list the Media Embed button, and still save
    Given I am a logged in user with the "Webmaster" user
     Then the "ckeditor_media_embed" module should not be installed
      And the "editor.editor.full_html" configuration should not contain "MediaEmbed"
      And the "editor.editor.basic_html" configuration should not contain "MediaEmbed"
     When I go to "/admin/config/content/formats/manage/full_html"
      And I submit by id "edit-submit"
     Then I should see a status message "The text format Full HTML has been updated."
      And I should not see an error message
