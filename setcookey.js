var async = require('async'),
  _ = require('underscore'),
 config = require('config');

// Nodejs encryption with CTR
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = config.get('dbConfig.database');

var redis = require('redis');
var client = redis.createClient(config.get('redisConfig'));
var cookie = config.get('webRequest.headers.Cookie');
//cookie = "optionchainview=Jan%208%202016; dbox_logout=AMER; loginPromo=4; dv_data=93f4a29eac3e114de04ac650d511281102163523377; TDATRADING=0000DucY5KG9mgxtp-jPQaMS1Hr:17pbkcciu; invest_VENDOR=HEADER_PATH=/cgi-bin/apps/u/ResearchHeader&HEADER_HEIGHT=1&HEADER_WIDTH=100%&HEADER_STYLE=&HEADER_SCROLL=no&FOOTER_PATH=/cgi-bin/apps/u/ResearchFooter&FOOTER_HEIGHT=1&FOOTER_WIDTH=100%&FOOTER_STYLE=&FOOTER_SCROLL=no&CONTENT_SWITCH=1111411111011210111111101100101111&DOMAIN_NAME=https://invest.ameritrade.com&COMPANY_NAME=TD Ameritrade&TIME_STAMP=20160225 00:28:30&ACCT_ID=B6D3501853E62832A12D944A53E18F497B8B61040AB5B3D5&WALLST_CLIENTID=aac689a69d55e710f6c4aa94b9df0b9cb78b1949&MORNINGSTART_ CLIENTID=436c1d24b45ffde9aebd73c5bf02e0a8456abf49&SANDP_ CLIENTID=ad2ac2d2f23451857b1bd656bb2615fdbef4d93a&SNITILY_CARR_ CLIENTID=804e938f876bfbaf1246612cdf395179cf03ed4d&MINYANVILLE_ CLIENTID=0c9be6dc903209a921864467968df26f23769dfc&VALUEBOND_ CLIENTID=7e96b478d1becb6c710856405bef3f696def74ea&PREDICTWALLST_ CLIENTID=d58526369cea11d87fba74fb59b7213f6d56a072&VCE_ CLIENTID=083a97b2a3a10b1019fe6bd784d1b54d3501934a&GK_CLIENTID=ad94c616799314f8ad590b1d1a600b8daff765a6&INVESTOOLS_CLIENTID=1f33fcca96031d0d2b3f40d5bc4286f6fc86ae58&OPINION_CLIENTID=60001ba35305e8765ad3806edaf53816264608f1; oo_OODynamicRewrite_weight=0; oo_inv_percent=0; oo_inv_hit=1; 38974897-VID=1222201744148012; 38974897-SKEY=5805023755918017688; HumanClickSiteContainerID_38974897=Secondary4; invest_VCE_Context=Context%3DMain%26Indicator%3DFalse; invest_VCE_Account_en=H72Ms2oezJHi9uDsK7PIp2yHxYwM6%252BP19H89TKN4Edg%253D; audience=client; s_pers=%20s_fid%3D1FE5373C3E414133-38C87C3A9A5CA09F%7C1519536567892%3B%20s_pageName%3Dr%253DjPage%252Fcgi-bin%252Fapps%252Fu%252FEnhancedOptionTrade%7C1456379967894%3B; s_sess=%20s_cc%3Dtrue%3B%20s_ppv%3D-%3B%20s_sq%3D%3B"

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

//console.log(config);

client.on('connect', function() {
  console.log('Connected to Redis');

  client.publish("~90245~", encrypt(cookie));
  client.quit();

});



