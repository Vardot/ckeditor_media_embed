# Regression for #3600610: the filter used to send the empty url to the
# provider, which answered 400, and every render showed "Unable to retrieve
# at this time, please check again later."
@ckeditor-media-embed @oembed-fixture
Feature: An oEmbed with an empty url is left alone
  As a site owner
  I want an <oembed> element with an empty url to render without calling
  the provider
  So that one broken element does not send a bad request on every render
  (#3600610)

  Scenario: An empty url is not sent to the provider and shows no warning
    Given the media embed provider is the local oEmbed fixture provider
      And a published "article" content item titled "Empty oEmbed article" exists with the "full_html" body:
        """
        <p>Text before.</p><figure class="media"><oembed url=""></oembed></figure><p>Text after.</p>
        """
      And I am a logged in user with the "Webmaster" user
     When I view the content item I created
     Then I should see "Text before."
      And I should see "Text after."
      And I should not see a warning message
      And the oEmbed fixture provider should not have been asked for an empty url
      And the page should not have PHP errors
