
var lactate = require('lactate')
  ,express = require('express')
  ,app = express()
  ,bodyParser = require('body-parser')
  ,api = require('./lib/api');


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 9090;        // set our port

app.use(function(req, res, next) {
  if (req.path === '/') // pass requests for index page
    res.redirect('/index.html'); // redirect to index page as default
  else
    next(); // else just pass the request along
});


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', api);


// all the static files will happen here -------------
app.use(lactate.static(__dirname + '/public'));


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

