const chai = require('chai');
const credentials = require('../github-credentials.json');
const Agent = require('../src/agent.js');

const should = chai.should();

describe('agent', () => {
  const user = 'Rhod3';
  const agent = new Agent(credentials);

  it('should create a data file', (done) => {
    agent.createFile(user, (fileCreated) => {
      done();
    });
  });

/*
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

  it('should fetch stats for a commit', (done) => {
    agent.getStatsForCommit('https://api.github.com/repos/Rhod3/TWEB2017-Github-Analytics-Server/commits/e8633b56a8caeb744dcc35d0285d0052c9ef7b07', (err, res) => {
      should.not.exist(err);
      res.should.be.an('object');
      done();
    });
  });

  it('should calculate data for a user', (done) => {
    agent.calculateData(user, (err, res) => {
      should.not.exist(err);
      res.should.be.an('object');
      done();
    });
  });
*/
});
