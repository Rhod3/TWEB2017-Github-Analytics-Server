const request = require('superagent');

class Agent {
  constructor(cred) {
    this.credentials = cred;
  }

  calculateData(user, dataCalculated) {
    const data = {};
    this.fetchAllCommits(user, (err, commits) => {
      console.log(commits);
      commits.forEach((c) => {
        console.log(c);
        this.getStatsForCommit(c.url, (stats) => {
          console.log(stats);
          data[user][c.language].total += stats.total;
          data[user][c.language].nbCommit += 1;
        });
      });
    });
    console.log(data);
    dataCalculated(null, data);
  }

  /**
   * If we get a commit from a repo, it doesn't include the add/del
   * stats, so we have to fetch them one by one.
   */
  getStatsForCommit(commitUrl, stats) {
    // console.log('getStatsForCommit ' + commitUrl);
    request
      .get(commitUrl)
      .auth(this.credentials.username, this.credentials.token)
      .set('Accept', 'application/vnd.github.v3+json')
      .end((err, res) => {
        console.log(res.body);
        if (!err) {
          stats(null, res.body.stats);
        }
      });
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
            // console.log(res.body.length);
            res.body.language = repo.language;
            commits = commits.concat(res.body);
            // console.log(res.body.language);
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
          // console.log(fullNames);
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
