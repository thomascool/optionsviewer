var async = require('async'),
  _ = require('underscore'),
 config = require('config');

// Nodejs encryption with CTR
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = config.get('dbConfig.database');

var redis = require('redis'),
    client = redis.createClient(config.get('redisConfig'));

var initObj = {
  "webRequest": {
    "headers": {
      "Cookie": ""
    }
  }
}


var jsonfile = require('jsonfile')
jsonfile.spaces = 4;

function decrypt(text){
    var decipher = crypto.createDecipher(algorithm,password)
        var dec = decipher.update(text,'hex','utf8')
          dec += decipher.final('utf8');
      return dec;
}

client.on('connect', function() {
  console.log('Connected to Redis');

  client.on("message", function(channel, message) {
    initObj.webRequest.headers.Cookie = decrypt(message);
    var file = __dirname + '/config/local.json'
    jsonfile.writeFile(file, initObj, function (err) {
      if (err)
        console.error(err)
      console.log("Message '" + decrypt(message) + "' on channel '" + channel + "' arrived!" )
    })
  });

  client.subscribe("~90245~");
});
