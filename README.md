# TWEB2017-Github-Analytics-Server

## What does this repository contain ?
This repo contains the code for the agent/crawler in the 
[TWEB2017 Github Analytics](https://rhod3.github.io/TWEB2017-Github-Analytics/ "TWEB2017 Github Analytics") project (available at this [repo](https://github.com/Rhod3/TWEB2017-Github-Analytics)).

## What does the code do ?
It is deployed on Heroku and runs everyday. Basically, it fetches the data from the [Json](https://github.com/Rhod3/TWEB2017-Github-Analytics/blob/master/docs/data/data.json) stored in the client and query all the usernames contained in that file.

It queries the [Github API](https://developer.github.com/v3/) to fetch all the commit from a user and process them to output some data. Those data are then pushed on the client side repo to replace the previously mentioned Json file.