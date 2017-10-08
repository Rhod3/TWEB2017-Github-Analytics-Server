const request = require('superagent');

class Agent {
  constructor(cred) {
    this.credentials = cred;
  }

  fetchAllCommits(user, allCommitsFetched) {
    let commits = [];

    this.fetchAllContributedRepos(user, (error, allContributedRepos) => {
      allContributedRepos.forEach((repo) => {
        const url = `https://api.github.com/repos/${repo.full_name}/commits?author=${user}`;
        request
          .get(url)
          .auth(this.credentials.username, this.credentials.token)
          .set('Accept', 'application/vnd.github.v3+json')
          .end((err, res) => {
            console.log(res.body.length);
            commits = commits.concat(res.body);
          });
      });
    });
    allCommitsFetched(null, commits);
  }

  fetchAllContributedRepos(user, allContributedReposFetched) {
    const url = `https://api.github.com/users/${user}/repos?type=all`;
    let contributedRepos = [];
    function fetchPage(pageUrl, credentials) {
      request
        .get(url)
        .auth(credentials.username, credentials.token)
        .set('Accept', 'application/vnd.github.v3+json')
        .end((err, res) => {
          // console.log(res.body.keys('full_name'));
          const fullNames = res.body.map((r) => {
            const tmp = {};
            tmp.full_name = r.full_name;
            tmp.language = r.language;
            return tmp;
          });
          console.log(fullNames);
          contributedRepos = contributedRepos.concat(fullNames);
          if (res.links.next) {
            fetchPage(res.links.next, credentials);
          } else {
            allContributedReposFetched(null, contributedRepos);
          }
        });
    }
    fetchPage(url, this.credentials);
  }
}

module.exports = Agent;
