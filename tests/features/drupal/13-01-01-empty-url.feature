@ckeditor-media-embed @oembed-fixture
Feature: An oEmbed with no url is left alone
  As a site owner
  I want an <oembed> element with no url to render without calling the
  provider
  So that one broken element does not send a bad request on every render

  # #3600610: the filter sends the empty url to the provider, which answers
  # 400, and every render shows "Unable to retrieve  at this time, please
  # check again later." Fixed on 2.x (!24), not on 8.x-1.x, where the empty
  # element is <oembed></oembed>. The scenario holds the fixed behavior.
  @wip
  Scenario: An empty oEmbed is not sent to the provider and shows no warning
    Given the media embed provider is the local oEmbed fixture provider
      And a published "article" content item titled "Empty oEmbed article" exists with the "full_html" body:
        """
        <p>Text before.</p><oembed></oembed><p>Text after.</p>
        """
      And I am a logged in user with the "Webmaster" user
     When I view the content item I created
     Then I should see "Text before."
      And I should see "Text after."
      And I should not see a warning message
      And the oEmbed fixture provider should not have been asked for an empty url
      And the page should not have PHP errors
