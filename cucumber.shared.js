// Shared worldParameters for the CKEditor Media Embed suite.

module.exports = {
  launchUrl: process.env.LAUNCH_URL || 'http://localhost',
  // Webmaster is the site-install admin. The build creates the rest with
  // tests/scripts/add-testing-users.js (drush); `I add testing users` adds
  // any that are missing through the People page.
  users: {
    Webmaster: {
      username: process.env.LOGIN_USER || 'webmaster',
      email: 'webmaster@example.test',
      password: process.env.LOGIN_PASS || 'dD.123123ddd',
      isAdmin: true,
    },
    webmaster: {
      username: process.env.LOGIN_USER || 'webmaster',
      email: 'webmaster@example.test',
      password: process.env.LOGIN_PASS || 'dD.123123ddd',
      isAdmin: true,
    },
    'Content editor': {
      username: 'content_editor_user',
      email: 'content_editor_user@example.test',
      password: 'dD.123123ddd',
      roles: ['content_editor'],
    },
  },
  minWaitTime: {
    page: 3000,
    before_scenario: 0,
    after_scenario: 0,
    before_step: 0,
    after_step: 0,
  },
  selectors: {
    css: {},
    xpath: {},
    // cucumber.js lists the selector files.
    filesPath: './tests/selectors/',
    files: [],
    offset: 60,
    breakpoints: {
      xs: { width: 375, height: 667 },
      sm: { width: 576, height: 800 },
      md: { width: 768, height: 1024 },
      lg: { width: 992, height: 768 },
      xl: { width: 1200, height: 900, default: true },
      xxl: { width: 1400, height: 900 },
    },
  },
  screenshot: {
    dir: './tests/screenshots',
    purge: false,
    onFailed: true,
    onEveryStep: false,
    alwaysFullscreen: false,
    failedPrefix: 'failed_',
    filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
    filenamePatternFailed: '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
    infoTypes: '',
  },
  video: {
    mode: 'on-failure',
    dir: './tests/videos',
    size: { width: 1280, height: 720 },
    filenamePattern: '{datetime}.{feature_file}.{scenario}.{status}.{ext}',
  },
  javascript: {
    mode: 'warn',
    levels: ['error'],
    ignore: '',
    beforeScenario: false,
    afterScenario: true,
  },
};
