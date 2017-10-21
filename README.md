# TWEB2017-Github-Analytics-Server

## What does this repository contain ?
This repo contains the code for the agent/crawler in the 
[TWEB2017 Github Analytics](https://rhod3.github.io/TWEB2017-Github-Analytics/ "TWEB2017 Github Analytics") project (available at this [repo](https://github.com/Rhod3/TWEB2017-Github-Analytics)).

## What does the code do ?
It is deployed on Heroku and runs everyday. Basically, it fetches the data from the [Json](https://github.com/Rhod3/TWEB2017-Github-Analytics/blob/master/docs/data/data.json) stored in the client and query all the usernames contained in that file.

It queries the [Github API](https://developer.github.com/v3/) to fetch all the commit from a user and process them to output some data. Those data are then pushed on the client side repository to replace the previously mentioned Json file.

## What do I have to do to run it locally ?
First, install all the dependencies with :
```
npm install
```
Then, you have to modify a few lines in the *agent.js* file:
* Modify the *oldDataURL* and *clientSideRepoName* variables to match your settings.
* Use the *github-credentials.json* template to provide a username and a valid token to your agent.

You can then run the agent with :
```
node src/agent.js
```
The agent will fetch the data from the Github API, process them into a nice Json and commit that Json to your client side repository.

If you want to check that your code is compliant with the arbitrary choosen Airbnb linter, either install eslint for Visual Studio Code, or simply run the following command :
```
./node_modules/.bin/eslint agent.js
```