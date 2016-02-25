var async = require('async'),
  _ = require('underscore'),
 config = require('config');

// Nodejs encryption with CTR
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = config.get('DATABASE_URL');

var redis = require('redis');
var client = redis.createClient(config.get('redisConfig'));
var cookie = config.get('webRequest.headers.Cookie');

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}


client.on('connect', function() {
  console.log('Connected to Redis');

  client.set("~90245~", encrypt(cookie), redis.print);
  client.get("~90245~", function (err, reply) {
    if (err) throw err

    console.log(decrypt(reply.toString()));

    client.quit();
  });

});



