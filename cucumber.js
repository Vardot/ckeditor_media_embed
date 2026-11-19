// cucumber-js config for the CKEditor Media Embed webship-js suite.
//   LAUNCH_URL=https://your-site.ddev.site yarn test
// The site needs ckeditor_media_embed, its CKEditor 5 plugin library and the
// tests/recipes/ckeditor_media_embed_test fixtures.

const baseWorldParameters = require('./cucumber.shared.js');

// CUCUMBER_TAGS, not --tags, because cucumber-js ANDs --tags with these.
const tagExpression = process.env.CUCUMBER_TAGS || 'not @wip';

// webship-js sets the step timeout from this when its steps load.
process.env.WEBSHIP_STEP_TIMEOUT = process.env.WEBSHIP_STEP_TIMEOUT || '60000';

// CUCUMBER_JSON names one CI group's report, e.g. cucumber_report--core--01-03.
const reportName = process.env.CUCUMBER_JSON || 'cucumber_report';

// Keep the webship-js exit report pointed at the json formatter output.
process.env.WEBSHIP_REPORT_JSON =
  process.env.WEBSHIP_REPORT_JSON || `tests/reports/${reportName}.json`;
process.env.WEBSHIP_REPORT_OUT =
  process.env.WEBSHIP_REPORT_OUT || `tests/reports/${reportName}.html`;

// The named selector registry, in load order (a later file wins a name):
// the webship-js admin theme preset, the Drupal core steps preset, then ours.
// Paths are relative to selectors.filesPath (tests/selectors/).
const PACKAGES = '../../node_modules/';
const SELECTOR_FILES = [
  `${PACKAGES}webship-js/tests/selectors/cms-drupal-core-claro.json`,
  `${PACKAGES}@webship-js/drupal-core-steps/tests/selectors/drupal-core.json`,
  'ckeditor_media_embed.json',
];

module.exports = {
  default: {
    // One retry absorbs a step timeout from runner load.
    retry: 1,
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'node_modules/@webship-js/drupal-core-steps/tests/step-definitions/**/*.js',
      'tests/step-definitions/**/*.js',
    ],
    // FEATURES runs one CI shard, e.g. "tests/features/drupal/04-*.feature".
    paths: [process.env.FEATURES || 'tests/features/drupal/**/*.feature'],
    tags: tagExpression,
    format: ['pretty', `json:tests/reports/${reportName}.json`],
    worldParameters: {
      ...baseWorldParameters,
      selectors: { ...baseWorldParameters.selectors, files: SELECTOR_FILES },
    },
  },
};
