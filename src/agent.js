const request = require('superagent');
const Throttle = require('superagent-throttle');
const Storage = require('../src/storage');
const fs = require('fs');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCurrentDataFromClientAsJSON(json) {
  request('https://raw.githubusercontent.com/Rhod3/TWEB2017-Github-Analytics/master/docs/data/data.json', (error, response) => {
    console.log(error);
    console.log(response.text);
    if (!error && response.statusCode === 200) {
      json(JSON.parse(response.text));
    } else {
      console.log('ERROR');
    }
  });
}

class Agent {
  constructor(cred) {
    this.credentials = cred;
  }

  /*
  getCurrentRateLimit(currentRateLimit) {
    request
      .get('https://api.github.com/rate_limit')
      .auth(this.credentials.username, this.credentials.token)
      .set('Accept', 'application/vnd.github.v3+json')
      .end((err, res) => {
        if (!err) {
          currentRateLimit(res.body.rate);
        }
      });
  }

  async handleRequest(url) {
    const throttle = new Throttle({
      active: true, // set false to pause queue
      rate: 5, // how many requests can be sent every `ratePer`
      ratePer: 1000, // number of ms in which `rate` requests may be sent
      concurrent: 10, // how many requests can be sent concurrently
    });

    getCurrentRateLimit((currentRateLimit) => {
      if (currentRateLimit.remaining === 0) {
        const currentTime = Math.round(new Date().getTime() / 1000);
        const waitingTime = currentRateLimit.rate.reset - currentTime;
        await sleep(waitingTime + 4000);
      }
      return request
        .get(pageUrl)
        .auth(credentials.username, credentials.token)
        .set('Accept', 'application/vnd.github.v3+json')
    });
  }
  */

  updateFile(fileUpdated) {
    getCurrentDataFromClientAsJSON((json) => {
      const users = Object.keys(json);
      const data = json;
      let size = users.length;
      users.forEach((key) => {
        console.log(size + ' KEY: ' + key);
        console.log(size + ' VALUE: ' + json[key]);

        this.calculateData(key, (err, dataCalculated) => {
          data[key] = dataCalculated;
          size -= 1;
          if (size === 0) {
            const out = fs.createWriteStream('data2.json');
            out.write(JSON.stringify(data, null, 2));
            out.end();

            const s = new Storage(this.credentials.username, this.credentials.token, 'TWEB2017-Github-Analytics');
            const currentTime = new Date().toISOString().replace('T', ' ').replace(/\..*$/, '');
            const commitMessage = `Updated Data ${currentTime}`;
            s.publish('docs/data/data.json', JSON.stringify(data, null, 2), commitMessage);
            console.log('PUBLISHED to repo');

            fileUpdated();
          }
        });
      });
    });
  }

  createFile(user, fileCreated) {
    this.calculateData(user, (err, dataCalculated) => {
      const payload = {};
      payload[user] = dataCalculated;

      console.log('WRITING FILE');

      const out = fs.createWriteStream('data.json');
      out.write(JSON.stringify(payload, null, 2));
      out.end();
      fileCreated();
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

          if (!error) {
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
                (data.stats[c.language].nbWordsMessage /
                  data.stats[c.language].nbCommit).toFixed(1);
              data.stats[c.language].nbAdd += stats.additions;
              data.stats[c.language].nbDelete += stats.deletions;
              data.stats[c.language].nbTotal += stats.total;
              data.stats[c.language].nbTotalPerCommit =
                (data.stats[c.language].nbTotal / data.stats[c.language].nbCommit).toFixed(1);
            }
          }
          // console.log(commitToProcess);
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
    console.log('Quering single commit ' + commitUrl);
    if (commitUrl) {
      request
        .get(commitUrl)
        .auth(this.credentials.username, this.credentials.token)
        .set('Accept', 'application/vnd.github.v3+json')
        .end((err, res) => {
          if (!err) {
            stats(null, res.body.stats);
          }
        });
    } else {
      stats('No URL', null);
    }
  }

  fetchAllCommits(user, allCommitsFetched) {
    let commits = [];

    this.fetchAllContributedRepos(user, (error, allContributedRepos) => {
      let reposStillToFetch = allContributedRepos.length;
      const throttle = new Throttle({
        active: true, // set false to pause queue
        rate: 5, // how many requests can be sent every `ratePer`
        ratePer: 1000, // number of ms in which `rate` requests may be sent
        concurrent: 10, // how many requests can be sent concurrently
      });

      allContributedRepos.forEach((repo) => {
        const url = `https://api.github.com/repos/${repo.full_name}/commits?author=${user}`;

        function fetchPageCommit(pageUrl, credentials) {
          request
            .get(pageUrl)
            .auth(credentials.username, credentials.token)
            .set('Accept', 'application/vnd.github.v3+json')
            .use(throttle.plugin())
            .end((err, res) => {
              const commitFromRepo = res.body;
              console.log('Quering repo ' + commitFromRepo.length + ' ' + url);

              for (let i = 0; i < commitFromRepo.length; i += 1) {
                commitFromRepo[i].language = repo.language;
              }

              commits = commits.concat(commitFromRepo);

              if (res.links.next) {
                // console.log(res.links.next);
                fetchPageCommit(res.links.next, credentials);
              } else {
                reposStillToFetch -= 1;
                if (reposStillToFetch === 0) {
                  allCommitsFetched(null, commits);
                }
              }
            });
        }
        fetchPageCommit(url, this.credentials);
      });
    });
  }

  fetchAllContributedRepos(user, allContributedReposFetched) {
    const url = `https://api.github.com/users/${user}/repos?type=all`;
    let contributedRepos = [];

    function fetchPage(pageUrl, credentials) {
      request
        .get(pageUrl)
        .auth(credentials.username, credentials.token)
        .set('Accept', 'application/vnd.github.v3+json')
        .end((err, res) => {
          console.log('Quering user ' + res.links.next);

          const fullNames = res.body.map((r) => {
            const tmp = {};
            tmp.full_name = r.full_name;
            tmp.language = r.language;
            return tmp;
          });

          // console.log(contributedRepos);

          contributedRepos = contributedRepos.concat(fullNames);

          if (res.links.next) {
            fetchPage(res.links.next, credentials);
          } else {
            // console.log(contributedRepos);
            allContributedReposFetched(null, contributedRepos);
          }
        });
    }
    fetchPage(url, this.credentials);
  }
}

module.exports = Agent;
