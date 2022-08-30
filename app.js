var express = require('express');
var app = express();
var async= require('async');

var bodyParser = require('body-parser'),
  port = process.env.PORT || 3000;

//var fs = require('fs');
//var http = require('http');
var path = require('path');
var mysql = require('mysql');
var randomstring = require("randomstring");

//pubnub
var PubNub = require('pubnub')
pubnub = new PubNub({
        publishKey : 'pub-c-f591132c-1fb7-4e91-a4f1-3b90a712794a',
        subscribeKey : 'sub-c-b7e72e8c-e1dd-11e4-a366-0619f8945a4f'
    })

mdb=null;
//connecting mysql db
var connection = mysql.createConnection({
  host: '13.127.235.41',
  user: 'root',
  password: "test",
  database: 'Tebse'
});
connection.connect(function (err) {
  if (err) {
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established mysql');
});

mdb=connection;

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL 
var url = 'mongodb://127.0.0.1:27017/market';
// Use connect method to connect to the Server

db = null;
MongoClient.connect(url, function (err, dbObject) {
  assert.equal(null, err);

   console.log(err);
  console.log("Connected correctly to server mongodb");
  db = dbObject;
  // var counters = db.collection('counters');
  // counters.insert(
  //  {
  //     _id: "orderid",
  //     seq: 0
  //  }
//)
  // db.close();
});

//cross origin access
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.urlencoded({extended: true}));

app.set('port', process.env.PORT || 8088);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(require('./controllers'));


var https = require('https');
var http = require('http');
var fs = require('fs');

var options = {
  key: fs.readFileSync(__dirname+'/ssl/b93f6_0ecfd_9a50da7c3b8e2b13d99de850c70f0d8e.key'),
  cert: fs.readFileSync(__dirname+'/ssl/tebse_com.pem')
};

http.createServer(app).listen(8088);

//this for only https request
//https.createServer(options,app).listen(3000);
console.log("server start port no 3000");

app.get('/route', function(req, res) {
    if (req.secure) {
       // console.log("hai");
        res.send({"hai":"hey"})
    } else {
        res.redirect(301, 'https://localhost:8000/route');
    }
});


app.use((req, res, next)=> {
  next();
});


app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });

  });



//only for http requests
// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });


// app.listen(port, function () {
//   console.log('Listening on port ' + port);
// });

//both http and https requests 
// https.createServer(options,app).listen(8087);

// // Redirect from http port 80 to https
// var http = require('http');
// http.createServer(function (req, res) {
//   //console.log(req.headers['host']);
//   //console.log(req.url)
//     res.writeHead(307, { "Location": "https://54.174.164.30:8087"  + req.url });
//     res.end();
// }).listen(8089);


