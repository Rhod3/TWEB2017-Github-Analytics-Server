require('./chai-config');
const Client = require('../src/client-async.js');

describe('Client Async', () => {
  const numberOfPages = 10;
  const client = new Client(numberOfPages);

  describe('getPage', () => {
    it('should allow me to get a page', (done) => {
      client.getPage(1, (response) => {
        response.header.should.have.property('pageNumber', 1);
        response.header.should.have.property('hasNextPage', true);
        done();
      });
    });

    it('should tell me when I am on the last page', (done) => {
      client.getPage(10, (response) => {
        response.header.should.have.property('pageNumber', 10);
        response.header.should.have.property('hasNextPage', false);
        done();
      });
    });

    it('should return an error code if the page does not exist', (done) => {
      let completedFunctions = 0;
      function notifyFunctionCompleted() {
        completedFunctions += 1;
        if (completedFunctions === 3) {
          done();
        }
      }
      client.getPage(-99, (response) => {
        response.header.should.have.property('error', 'page does not exist');
        notifyFunctionCompleted();
      });

      client.getPage(0, (response) => {
        response.header.should.have.property('error', 'page does not exist');
        notifyFunctionCompleted();
      });

      client.getPage(numberOfPages + 99, (response) => {
        response.header.should.have.property('error', 'page does not exist');
        notifyFunctionCompleted();
      });
    });
  });
});
