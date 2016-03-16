var async = require('async'),
  cheerio = require('cheerio'),
  _ = require('underscore'),
  request = require('request'),
  config = require('config');
var redis = require('redis');

// Nodejs encryption with CTR
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = config.get('dbConfig.database');

var qQuote = require('./lib/getOptionsQuote');

function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

var updateStatus = function(bool) {
  var jsonfile = require('jsonfile')
  jsonfile.spaces = 4;

  var file = './config/default.json'
  jsonfile.readFile(file, function(err, obj) {
    if (err) throw err;
    console.log(2 );

    if ((bool == true) && (config.get('goodCooky') == false)) {
      obj.webRequest.headers.Cookie = webRequest_headers["Cookie"];
    }
    obj.goodCooky = bool;
    console.log(obj);
    jsonfile.writeFile(file, obj, function (err) {
      if (err)
        console.error(err)
    })
    console.log(3);

  })
}

var countryCode = '+1',
    message = 'Hello from KeepAlive',
    webRequest_headers = config.get('webRequest.headers');

if (config.get('goodCooky') == false) {
  var client = redis.createClient(config.get('redisConfig'));
  client.on('connect', function() {
    console.log('Connected to Redis');

    client.get("~90245~", function (err, reply) {
      if (err) throw err

      webRequest_headers["Cookie"] = decrypt(reply.toString());

      client.quit();
    });

  });

}

var buildURL= function(symbol) {
  return {
    url: config.get('webRequest.urlRealTime') + "?symbol="+symbol,
    headers: webRequest_headers
  }
}

var sendSMS = function() {
  request.post({
    headers: {
      'content-type' : 'application/x-www-form-urlencoded',
      'Accepts': 'application/json'
    },
    url:     config.get('blower') + '/messages',
    form:    {
      to: countryCode + config.get('mobileNumber'),
      message: message
    }
  }, function(error, response, body){
    if (!error && response.statusCode == 201)  {
      console.log('Message sent!')
    } else {
      var apiResult = JSON.parse(body)
      console.log('Error was: ' + apiResult.message)
    }
  })

}

qQuote.requestURL(buildURL('AAPL')  , function(err, data) {
  var $ = cheerio.load(data);
  console.log( $('amtd').text() );

  if ($('amtd').text().length < 30) {
    console.log(1);
    updateStatus(false);
  }
  else if (config.get('goodCooky') == false) {
    updateStatus(true);
  }
});

