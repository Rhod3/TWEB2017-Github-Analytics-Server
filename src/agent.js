const request = require('superagent');
const Throttle = require('superagent-throttle');
const fs = require('fs');

class Agent {
  constructor(cred) {
    this.credentials = cred;
  }

  createFile(user) {
    this.calculateData(user, (err, dataCalculated) => {
      const payload = {};
      payload[user] = dataCalculated;
      console.log(payload);

      const out = fs.createWriteStream('data.json');
      out.write(JSON.stringify(payload, null, 2));
      out.end();
    });
  }

  calculateData(user, dataCalculated) {
    const data = {};

    data.user = user;
    data.statsGlobal = {};
    data.stats = {};
    data.statsGlobal.nbCommits = 0;
    data.statsGlobal.nbWordsMessage = 0;
    data.statsGlobal.nbAdd = 0;
    data.statsGlobal.nbDelete = 0;
    data.statsGlobal.nbTotal = 0;

    this.fetchAllCommits(user, (err, commits) => {
      let commitToProcess = commits.length;

      commits.forEach((c) => {
        this.getStatsForCommit(c.url, (error, stats) => {
          console.log('Quering ' + c.sha);
          commitToProcess -= 1;

          data.statsGlobal.nbCommits += 1;
          data.statsGlobal.nbWordsMessage += c.commit.message.split(' ').length;
          data.statsGlobal.nbWordsMessagePerCommit =
            (data.statsGlobal.nbWordsMessage / data.statsGlobal.nbCommits).toFixed(1);
          data.statsGlobal.nbAdd += stats.additions;
          data.statsGlobal.nbDelete += stats.deletions;
          data.statsGlobal.nbTotal += stats.total;
          data.statsGlobal.nbTotalPerCommit =
            (data.statsGlobal.nbTotal / data.statsGlobal.nbCommits).toFixed(1);

          if (c.language) {
            if (!(c.language in data.stats)) {
              data.stats[c.language] = {};
              data.stats[c.language].language = c.language;
              data.stats[c.language].nbCommit = 0;
              data.stats[c.language].nbWordsMessage = 0;
              data.stats[c.language].nbAdd = 0;
              data.stats[c.language].nbDelete = 0;
              data.stats[c.language].nbTotal = 0;
            }

            data.stats[c.language].nbCommit += 1;
            data.stats[c.language].nbWordsMessage += c.commit.message.split(' ').length;
            data.stats[c.language].nbWordsMessagePerCommit =
              (data.stats[c.language].nbWordsMessage / data.stats[c.language].nbCommit).toFixed(1);
            data.stats[c.language].nbAdd += stats.additions;
            data.stats[c.language].nbDelete += stats.deletions;
            data.stats[c.language].nbTotal += stats.total;
            data.stats[c.language].nbTotalPerCommit =
              (data.stats[c.language].nbTotal / data.stats[c.language].nbCommit).toFixed(1);
          }

          if (commitToProcess === 0) {
            // console.log(data);
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
            console.log('Quering repo ' + url);
            reposStillToFetch -= 1;

            const commitFromRepo = res.body;

            for (let i = 0; i < commitFromRepo.length;) {
              commitFromRepo[i].language = repo.language;
              i += 1;
            }

            commits = commits.concat(commitFromRepo);

            if (reposStillToFetch === 0) {
              allCommitsFetched(null, commits);
            }
          });
      });
    });
  }

  fetchAllContributedRepos(user, allContributedReposFetched) {
    const url = `https://api.github.com/users/${user}/repos?type=all`;
    let contributedRepos = [];
    let i = 0;
    function fetchPage(pageUrl, credentials) {
      request
        .get(url)
        .auth(credentials.username, credentials.token)
        .set('Accept', 'application/vnd.github.v3+json')
        .end((err, res) => {
          console.log('Quering user ' + url + i);
          i++;
          const fullNames = res.body.map((r) => {
            const tmp = {};
            tmp.full_name = r.full_name;
            tmp.language = r.language;
            return tmp;
          });

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
