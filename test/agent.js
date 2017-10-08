const chai = require('chai');
const credentials = require('../github-credentials.json');
const Agent = require('../src/agent.js');

const should = chai.should();

describe('agent', () => {
  const user = 'Rhod3';
  const agent = new Agent(credentials);
  it('should fetch all contributed repo', (done) => {
    agent.fetchAllContributedRepos(user, (err, res) => {
      should.not.exist(err);
      res.should.be.an('array');
      done();
    });
  });

  it('should fetch all commits from a user', (done) => {
    agent.fetchAllCommits(user, (err, res) => {
      should.not.exist(err);
      res.should.be.an('array');
      done();
    });
  });
});
