
var config = require('config');
var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true });

nightmare
    .viewport(1000, 1000)
    .useragent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36")
    .goto(config.get('tdURL'))
    .wait()
    .type('form[class="tdaForm loginForm"] [name=tbUsername]', config.get('tbUsername'))
    .type('form[class="tdaForm loginForm"] [name=tbPassword]', config.get('tbPassword'))
    .click('form[class="tdaForm loginForm"] [type=submit]')
    .wait()
//    .type('form[class="tdaForm securityChallengeForm"] [name=challengeAnswer]', config.get('challengeAnswer'))
//    .click('form[class="tdaForm securityChallengeForm"] [type=checkbox]')
//    .click('form[class="tdaForm securityChallengeForm"] [type=submit]')
    .cookies.get("TDATRADING")
    .then(function(cookies) {
        var output = {
            "webRequest": {
                "headers": {
                    "Cookie": "helloWorld"
                }
            }
        };
        output.webRequest.headers.Cookie = "TDATRADING=" + cookies.value;
        console.log(JSON.stringify(output));
        process.exit()
    });

