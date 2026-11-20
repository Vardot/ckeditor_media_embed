@ckeditor-media-embed @admin @uninstall
Feature: Uninstalling the module leaves the editor and the text formats working
  As a site builder
  I want to uninstall CKEditor Media Embed cleanly
  So that no setting, filter or formatter of it stays on the site, and the
  editor and the text formats keep working

  # These scenarios uninstall the module, so they run in this order, last, in
  # a CI group of their own.

  Scenario: Take the filter off the formats, uninstall, and the module's settings, filter and formatter are gone
    Given I am a logged in user with the "Webmaster" user
     When I go to "/admin/modules/uninstall"
     Then I should see "Provides a filter plugin that is in use in the following filter formats"
     When I go to "/admin/config/content/formats/manage/full_html"
      And I uncheck "Convert Oembed tags to media embeds"
      And I submit by id "edit-submit"
     Then I should see a status message "The text format Full HTML has been updated."
     When I go to "/admin/config/content/formats/manage/basic_html"
      And I uncheck "Convert Oembed tags to media embeds"
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

  @js-fail
  Scenario: After the uninstall the editor loads without the Media Embed buttons, and the text formats still save
    Given I am a logged in user with the "Webmaster" user
     Then the "ckeditor_media_embed" module should not be installed
     When I am adding an "article"
     Then the "Body" field should have a CKEditor 4 editor
      And the CKEditor 4 toolbar of the "Body" field should have the "Bold" button
      And the CKEditor 4 toolbar of the "Body" field should not have the "Embed" button
      And the CKEditor 4 toolbar of the "Body" field should not have the "EmbedSemantic" button
      And "script[src*='/libraries/ckeditor/plugins/']" should have a count of 0
      And there should be no JavaScript errors
     When I go to "/admin/config/content/formats/manage/full_html"
      And I submit by id "edit-submit"
     Then I should see a status message "The text format Full HTML has been updated."
      And I should not see an error message
