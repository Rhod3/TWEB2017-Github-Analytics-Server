const request = require('superagent');

class Agent {
  constructor(cred) {
    this.credentials = cred;
  }

  fetchAllContributedRepos(user, allContributedReposFetched) {
    const url = `https://api.github.com/users/${user}/repos`;
    let contributedRepos = [];
    function fetchPage(pageUrl, credentials) {
      request
        .get(url)
        .auth(credentials.username, credentials.token)
        .set('Accept', 'application/vnd.github.v3+json')
        .end((err, res) => {
          // console.log(res.body.keys('full_name'));
          const fullNames = res.body.map(r => r.full_name);
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
