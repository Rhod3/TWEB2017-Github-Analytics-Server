const chai = require('chai');
const credentials = require('../github-credentials.json');
const Agent = require('../src/agent.js');

const should = chai.should();

describe('agent', () => {
  it('should fetch all contributed repo', (done) => {
    const user = 'Rhod3';
    const agent = new Agent(credentials);
    agent.fetchAllContributedRepos(user, (err, res) => {
      should.not.exist(err);
      res.should.be.an('array');
      done();
    });
  });
});
