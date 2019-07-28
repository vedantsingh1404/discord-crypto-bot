//jshint esversion : 6

const request = require('request');
const fs = require('fs');
const auth = require('./auth.json');

var options = {
  "method" : "GET",
  "url" : "https://rest.coinapi.io/v1/assets",
  "headers" : {
    'X-CoinAPI-Key' : `${auth.key2}`
  }
};

request(options, (err, res, body) => {
  if(err) {
    console.log(err);
  } else {
    fs.writeFile('meta.json', body, (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  }
});
