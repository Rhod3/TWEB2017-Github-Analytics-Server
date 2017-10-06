require('./chai-config');
const Client = require('../src/client-async.js');
const application = require('../src/application.js');

describe('application', () => {
  describe('fetchAllPages', () => {
    it('should return the correct number of pages', (done) => {
      const client = new Client(10);
      application.fetchAllPages(client, (responses) => {
        responses.should.be.an('array');
        responses.length.should.equal(10);
        done();
      });
    });
  });
});
