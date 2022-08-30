var express = require('express');
var app = express();
var async = require('async');
moment = require('moment');
geolib = require('geolib');

var CheckMobi = require('omrs-checkmobi');
cb = new CheckMobi('91A58145-6AB9-4CA2-869A-2EF892DF182A');
//cb.getCountries((error, countries) => {
//  if(!error) {
//    console.log(countries);
//  }
//});




//$RequestValidation(array("type" = > "reverse_cli", "number" = > "+number_here"));

//cb.validatePhone('+918123131690', 'reverse_cli', function (err, res) {
//    if (!err) {
//        console.log(res);
//    } else {
//        console.log(err);
//    }
//});
//cb.validateNum('post', 'validateNum', {
//    'number': '+918123131690',
//    'type': 'reverse_cli'
//});

FCM = require('fcm-push');
var bodyParser = require('body-parser'),
        port = process.env.PORT || 8088;
var fs = require('fs');
//var http = require('http');
var path = require('path');
var randomstring = require("randomstring");
var MongoClient = require('mongodb').MongoClient
        , assert = require('assert');
// Connection URL 
var url = 'mongodb://iused_user:cnuXvVCg3BHPvece@54.244.57.208:27017/market';
// Use connect method to connect to the Server

db = null;
MongoClient.connect(url, function (err, dbObject) {
    assert.equal(null, err);
    console.log("Connected correctly to server mongodb");
    db = dbObject;

});
//cross origin access
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.urlencoded({extended: true}));
app.set('port', process.env.PORT || 8087);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
requests = require('request');
app.use(require('./controllers'));
app.get('/', function (req, res) {
    res.send('Hello World!');
});
app.listen(port, function () {
    console.log('Listening on port ' + port);
});

