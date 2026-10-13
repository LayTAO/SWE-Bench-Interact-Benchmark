module.exports = {
  viewportWidth: 1024,
  viewportHeight: 768,
  video: true,
  retries: 0,
  e2e: {
    baseUrl: 'http://127.0.0.1:4173',
    supportFile: false,
    fixturesFolder: false,
    specPattern: 'cypress/e2e/**/*.cy.js'
  }
};
