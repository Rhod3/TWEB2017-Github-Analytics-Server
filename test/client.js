require('./chai-config');
const Client = require('../src/client.js');

describe('Client', () => {
  const numberOfPages = 10;
  const client = new Client(numberOfPages);

  describe('getPage', () => {
    it('should allow me to get a page', () => {
      const response = client.getPage(1);
      response.header.should.have.property('pageNumber', 1);
      response.heander.should.have.property('hasNextPage', true);
    });

    it('should tell me when I am on the last page', () => {
      const response = client.getPage(10);
      response.header.should.have.property('pageNumber', 10);
      response.heander.should.have.property('hasNextPage', true);
    });

    it('should return an error code if the page does not exist', () => {
      let response = client.getPage(-99);
      response.header.should.have.property('error', 'page does not exist');

      response = client.getPage(0);
      response.header.should.have.property('error', 'page does not exist');

      response = client.getPage(numberOfPages + 99);
      response.header.should.have.property('error', 'page does not exist');
    });
  });
});
