const request = require('superagent');
const Throttle = require('superagent-throttle');

class Agent {
  constructor(cred) {
    this.credentials = cred;
  }

  calculateData(user, dataCalculated) {
    const data = {};

    data.user = user;
    data.nbCommits = 0;
    data.statsGlobal = {};
    data.statsGlobal.nbWordsMessage = 0;
    data.statsGlobal.nbAdd = 0;
    data.statsGlobal.nbDelete = 0;
    data.statsGlobal.nbTotal = 0;

    this.fetchAllCommits(user, (err, commits) => {
      // console.log('calculateData, all commits fetched');
      // console.log(commits);

      let commitToProcess = commits.length;

      commits.forEach((c) => {
        // console.log(c);
        this.getStatsForCommit(c.url, (error, stats) => {
          commitToProcess -= 1;

          data.nbCommits += 1;
          data.statsGlobal.nbWordsMessage += c.commit.message.split(' ').length;
          data.statsGlobal.nbAdd += stats.additions;
          data.statsGlobal.nbDelete += stats.deletions;
          data.statsGlobal.nbTotal += stats.total;

          // data[user][c.language].total += stats.total;
          // data[user][c.language].nbCommit += 1;

          if (commitToProcess === 0) {
            console.log(data);
            dataCalculated(null, data);
          }
        });
      });
    });
  }

  /**
   * If we get a commit from a repo, it doesn't include the add/del
   * stats, so we have to fetch them one by one.
   */
  getStatsForCommit(commitUrl, stats) {
    request
      .get(commitUrl)
      .auth(this.credentials.username, this.credentials.token)
      .set('Accept', 'application/vnd.github.v3+json')
      .end((err, res) => {
        if (!err) {
          // console.log(res.body.stats);
          stats(null, res.body.stats);
        }
      });
  }

  fetchAllCommits(user, allCommitsFetched) {
    this.fetchAllContributedRepos(user, (error, allContributedRepos) => {
      let commits = [];
      let reposStillToFetch = allContributedRepos.length;
      const throttle = new Throttle({
        active: true, // set false to pause queue
        rate: 500, // how many requests can be sent every `ratePer`
        ratePer: 1000, // number of ms in which `rate` requests may be sent
        concurrent: 10, // how many requests can be sent concurrently
      });

      allContributedRepos.forEach((repo) => {
        const url = `https://api.github.com/repos/${repo.full_name}/commits?author=${user}`;

        request
          .get(url)
          .auth(this.credentials.username, this.credentials.token)
          .set('Accept', 'application/vnd.github.v3+json')
          .use(throttle.plugin())
          .end((err, res) => {
            reposStillToFetch -= 1;

            const commitFromRepo = res.body;
            for (let i = 0; i < commitFromRepo.length;) {
              commitFromRepo[i].language = repo.language;
              i += 1;
            }

            commits = commits.concat(commitFromRepo);

            if (reposStillToFetch === 0) {
              console.log('Commits Fetched');
              console.log(commits.length);
              // console.log(commits[0]);
              allCommitsFetched(null, commits);
            }
          });
      });
    });
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
