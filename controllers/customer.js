var express = require('express'),
 router = express.Router();
var randomstring = require("randomstring");
var requests = require('requests');
var CheckMobi = require('omrs-checkmobi');
var cb = new CheckMobi('91A58145-6AB9-4CA2-869A-2EF892DF182A');
ObjectID = require('mongodb').ObjectID;
var ErrObj = {
    'User_not_found': {num: '1001', message: "User Not Found.Please Register"},
    'Password_worng': {num: '1002', message: "Password worng, Please check password"},
    'unexpected_error': {num: '1003', message: "Unexpected Error"},
    "success": {num: '1004', message: "Success"},
    'field_missing': {num: '1005', message: "Mandatary Fields Missing"},
    'already_used': {num: '1006', message: "already used mobile number"},
    'already_available': {num: '1007', message: "already used mobile number"},
    'blocked': {num: '1008', message: "Oops! You are blocked, contact to our customer support for more information."}
};
//update customer profile

exports.updatecustomerprofile = function (req, res) {
    var custid = new ObjectID(req.body.UserId);
    var User = db.collection('Customers');
    User.findOne({
        "_id": custid
    }, function (err, userObj) {
        if (!err) {
            if (userObj.Status === 0) {
                res.send({
                    "errNum": ErrObj.blocked.num,
                    "errMsg": ErrObj.blocked.message,
                    "errFlag": '1'
                });
            } else {
                updobj = {
                    $set: {
                        "Name": req.body.Name,
                        "Photo": req.body.Photo
                    }
                };
                User.update({
                    "_id": custid
                }, updobj, function (err, Obj) {
                    if (!err) {
                        res.send({
                            "errNum": ErrObj.success.num,
                            "errMsg": ErrObj.success.message,
                            "errFlag": '0'
                        });
                    }
                })
            }

        }
    })

}


exports.Logout = function (req, res) {
    var custid = new ObjectID(req.body.UserId);
    var User = db.collection('Customers');
    if (custid === '') {
        res.send({
            "errNum": '1',
            "errMsg": 'Userid is mandatory',
            "errFlag": '1'
        });
    } else {
        res.send({
            "errNum": ErrObj.success.num,
            "errMsg": ErrObj.success.message,
            "errFlag": '0'
        });
    }
}

exports.UpdateLocation = function (req, res) {
//    console.log(req.body.Longitude);
//    console.log(req.body.Latitude);
//    console.log(req.body.UserId);

    var custid = new ObjectID(req.body.UserId);
    var User = db.collection('Customers');
    var CountryCode = db.collection('CountryCodes');
    var MobileCode = db.collection('MobileCodes');

    User.findOne({
        "_id": custid
    }, function (err, userObj) {
        if (!err) {
            if (userObj) {
                if (userObj.Status === 0) {
                    res.send({
                        "errNum": ErrObj.blocked.num,
                        "errMsg": ErrObj.blocked.message,
                        "errFlag": '1'
                    });
                } else {
                    var fullAddress = '';
                    var smallAddress = '';
             
                    requests('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyArGUW7z9seJgoOSfNkYkm-OFLhnbrFkGg&latlng=' + req.body.Latitude + ',' + req.body.Longitude + '&sensor=true')
                    .on('data', function (body) { {
                        console.log("bodybodybody",body);
                        if (!error) {
                            var jsonRes = JSON.parse(body);
                            if (typeof jsonRes.results[0].formatted_address !== 'undefined') {
                                fullAddress = jsonRes.results[0].formatted_address;
                            }
                            if (typeof jsonRes.results[4] !== 'undefined') {
                                if (typeof jsonRes.results[4].formatted_address !== 'undefined') {
                                    smallAddress = jsonRes.results[4].formatted_address;
                                }
                            }
                            updobj = {
                                $set: {"location": {
                                        "longitude": parseFloat(req.body.Longitude),
                                        "latitude": parseFloat(req.body.Latitude)
                                    }, 'FullAddress': fullAddress,
                                    'SmallAddress': smallAddress
                                }
                            };
                            User.update({
                                "_id": custid
                            }, updobj, function (err, Obj) {
                                CountryCode.findOne({
                                    "$or": [{'Code': req.body.CountryCode}, {'Code1': req.body.CountryCode}]
                                }, function (err, CountryCodeRes) {
                                    if (!err) {
                                        if (CountryCodeRes) {


                                            var symb = '';
                                            if (CountryCodeRes.CurrencySymb === '?' || CountryCodeRes.CurrencySymb === '??' || CountryCodeRes.CurrencySymb === '???' || CountryCodeRes.CurrencySymb === '????' ||
                                                    CountryCodeRes.CurrencySymb === null || CountryCodeRes.CurrencySymb === 'NULL') {
                                                symb = CountryCodeRes.Currency_code;
                                            } else {
                                                symb = CountryCodeRes.CurrencySymb;
                                            }

                                            res.send({
                                                "errNum": ErrObj.success.num,
                                                "errMsg": ErrObj.success.message,
                                                "errFlag": '0',
                                                'Currency': CountryCodeRes.Currency_code,
                                                'CurrencySymbole': symb,
                                                'CountryCode': CountryCodeRes.MobileCode
                                            });
                                        } else {
                                            res.send({
                                                "errNum": ErrObj.success.num,
                                                "errMsg": ErrObj.success.message,
                                                "errFlag": '0',
                                                'Currency': '',
                                                'CurrencySymbole': '',
                                                'CountryCode': ''
                                            });
                                        }
                                    } else {
                                        res.send({
                                            "errNum": ErrObj.success.num,
                                            "errMsg": ErrObj.success.message,
                                            "errFlag": '0',
                                            'Currency': '',
                                            'CurrencySymbole': '',
                                            'CountryCode': ''
                                        });
                                    }

                                });

                            })
                        }
                    }});
                }
            } else {
                console.log("userObj not founddd");

            }


        } else {
            res.send({
                "errNum": ErrObj.unexpected_error.num,
                "errMsg": ErrObj.unexpected_error.message,
                "errFlag": '1'
            });
        }
    })

}



//customer details based on phone number
exports.customerdetails = function (req, res) {
    var User = db.collection('Customers');
    var custid = new ObjectID(req.body.UserId);
    var obj = {"_id": custid}

    User.findOne(obj, function (err, result) {
        if (!err) {
//            console.log(result)
            if (result) {
                if (result.Status === 0) {
                    res.send({
                        "errNum": ErrObj.blocked.num,
                        "errMsg": ErrObj.blocked.message,
                        "errFlag": '1'
                    });
                } else {
                    res.send({
                        "errNum": ErrObj.success.num,
                        "errMsg": ErrObj.success.message,
                        "errCode": 1111,
                        "data": result
                    });
                }
            } else {
                res.send({
                    "errNum": ErrObj.success.num,
                    "errMsg": ErrObj.success.message,
                    "errCode": 1112
                });
            }
        }
    })
}



//customer details based on phone number
exports.Terms = function (req, res) {
    var User = db.collection('Terms');

    User.findOne({}, function (err, result) {
        if (!err) {
//            console.log(result)
            if (result) {
                if (result.Status === 0) {
                    res.send({
                        "errNum": ErrObj.blocked.num,
                        "errMsg": ErrObj.blocked.message,
                        "errFlag": '1'
                    });
                } else {
                    res.send({
                        "errNum": ErrObj.success.num,
                        "errMsg": ErrObj.success.message,
                        "errCode": 1111,
                        "data": result
                    });
                }
            } else {
                res.send({
                    "errNum": ErrObj.success.num,
                    "errMsg": ErrObj.success.message,
                    "errCode": 1112
                });
            }
        }
    })
}


//phone number verification already userd or not
exports.phoneNumberverify = function (req, res) {
    // console.log(req.body.phone);
    var User = db.collection('Customers');
    var custid = new ObjectID(req.body.UserId);
    User.findOne({
        "Phone": req.body.phone,
        "_id": custid
    }, function (err, userObj) {
        if (!err) {
            // console.log("fhgfh", userObj);
            if (userObj) {
                //if registered number send otp
                var randomnumber = Math.floor((Math.random() * 100000) + 1);
                updobj = {
                    $set: {
                        "Code": randomnumber
                    }
                };
                User.update({
                    "Phone": req.body.phone,
                    "_id": custid
                }, updobj, function (err, Obj) {
                    if (!err) {
                        res.send({
                            "errNum": ErrObj.success.num,
                            "errMsg": ErrObj.success.message,
                            "errFlag": '1',
                            "verification_code": randomnumber,
                            "msg": "already registered user"
                        });
                    }
                });
            } else {
                res.send({
                    "errNum": ErrObj.success.num,
                    // "errMsg": ErrObj.success.message,
                    "errMsg": 'This number is not registered',
                    "errFlag": '0',
                    "msg": "not registered user"
                });
            }
        } else {
            res.send({
                "errNum": ErrObj.unexpected_error.num,
                "errMsg": ErrObj.unexpected_error.message,
                "errFlag": '1'
            });
        }
    })
}

//verification Code while signup
exports.verificationcode = function (req, res) {
    var code = req.body.code;
    var phone = req.body.phone;
    var UserId = new ObjectID(req.body.UserId);
    var User = db.collection('Customers');
    User.findOne({
        "Phone": phone, "Code": code, '_id': UserId
    }, function (err, userObj) {
        if (!err) {
            if (userObj) {
                var updobj = {
                    $set: {"Status": 1}
                }
                User.update({
                    "Phone": phone
                }, updobj, function (err, Obj) {
                    if (!err) {
                        res.send({
                            "errNum": ErrObj.success.num,
                            "errMsg": ErrObj.success.message,
                            "errFlag": '0',
                            "msg": "verified"
                        });
                    } else {
                        res.send({
                            "errNum": ErrObj.unexpected_error.num,
                            "errMsg": ErrObj.unexpected_error.message,
                            "errFlag": '1'
                        });
                    }
                })
            } else {
                res.send({
                    "errNum": ErrObj.User_not_found.num,
                    "errMsg": 'Verification code does not match. Please enter the valid code.',
                    "errFlag": '1',
                    "Msg": userObj
                });
            }
        } else {
            res.send({
                "errNum": ErrObj.unexpected_error.num,
                "errMsg": ErrObj.unexpected_error.message,
                "errFlag": '1'
            });
        }
    })
}

//customer signup
exports.Guest = function (req, res) {
    var User = db.collection('Customers');
    var missingfield = [];
    if (!req.body.DeviceId) {
        missingfield.push("DeviceId");
    }
//    if (!req.body.Longitude) {
//        missingfield.push("Longitude");
//    }
//    if (!req.body.Latitude) {
//        missingfield.push("Latitude");
//    }
    if (req.body.DeviceId) {
        User.findOne({"DeviceId": req.body.DeviceId}, function (err, result) {
            if (!err) {
                if (result) {
                    res.send({
                        "errNum": ErrObj.success.num,
                        "errMsg": ErrObj.success.message,
                        "errFlag": '0',
                        "UserId": result._id,
                        "Guest": '0'
                    });
                } else {
                    updobj = {'DeviceId': req.body.DeviceId, 'Status': 1, 'location': {'longitude': req.body.Longitude, 'latitude': req.body.Latitude}};
                    User.insert(updobj, function (err, result) {
                        if (!err) {
                            User.findOne({"DeviceId": req.body.DeviceId}, function (err, result) {
                                res.send({
                                    "errNum": ErrObj.success.num,
                                    "errMsg": ErrObj.success.message,
                                    "errFlag": '0',
                                    "UserId": result._id,
                                    "Guest": '0'
                                });
                            });
                        }
                    });
                }
            } else {
                res.send({
                    "errNum": ErrObj.unexpected_error.num,
                    "errMsg": ErrObj.unexpected_error.message,
                    "errFlag": '1'
                });
            }
        });
    } else {
        res.send({
            "errNum": ErrObj.field_missing.num,
            "errMsg": missingfield + ' ' + ErrObj.field_missing.message,
            "errFlag": '1'
        })
    }

}


//customer signup
exports.Signup = function (req, res) {
//    res.send({
//        "errNum": ErrObj.unexpected_error.num,
//        "errMsg": ErrObj.unexpected_error.message,
//        "errFlag": '111111111'
//    });
//    return;
//    console.log(1);
    var User = db.collection('Customers');
    var missingfield = [];
    if (!req.body.Latitude) {
        missingfield.push("Latitude");
    }
    if (!req.body.Longitude) {
        missingfield.push("Longitude");
    }
    if (!req.body.Name) {
        missingfield.push("Name");
    }
    if (!req.body.Created_dt) {
        missingfield.push("created_dt");
    }
    if (!req.body.Email) {
        missingfield.push("email");
    }
    if (!req.body.DeviceId) {
        missingfield.push("DeviceId");
    }
    if (!req.body.DeviceToken) {
        missingfield.push("DeviceToken");
    }
//    console.log(1);

    var fullAddress = '';
    var smallAddress = '';
    console.log("resultresultresult222");
    if (req.body.Phone && req.body.Latitude && req.body.Name && req.body.Email) {
        User.findOne({"Email": req.body.Email}, function (err, result) {
            console.log("resultresultresult",result);
            console.log("errerrerrerrerr",err);
            if (!err) {
                if (result) {
                    if (result.Status === 0) {
                        res.send({
                            "errNum": '1009',
                            "errMsg": 'Oops! You are blocked, contact to our customer support for more information.',
                            "errFlag": '1'
                        });
                    } else {
                        Login();
                    }
                } else {
//                    console.log(2);
                    requests('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyArGUW7z9seJgoOSfNkYkm-OFLhnbrFkGg&latlng=' + req.body.Latitude + ',' + req.body.Longitude + '&sensor=true')
                    .on('data', function (body)  {
                        if (body) {
                             console.log(3);
                            var jsonRes = JSON.parse(body);
                            fullAddress = jsonRes.results[0].formatted_address;
                            smallAddress = jsonRes.results[4].formatted_address;
                            Signup(fullAddress, smallAddress);
                        } else {
//                            console.log(4);
                            Signup(fullAddress, smallAddress);
                        }
                    });
                }
            }
        });
    } else {
        res.send({
            "errNum": ErrObj.field_missing.num,
            "errMsg": missingfield + ' ' + ErrObj.field_missing.message,
            "errFlag": '1'
        })
    }


    function Login(fulladdress, smalladdress) {
        var sessionToken = randomstring.generate(12);
        var User = db.collection('Customers');
        var randomnumber = Math.floor(10000 + Math.random() * 90000);
//        randomnumber = '11111';
        cb.sendMessage({text: randomnumber + ' is your iUsed App verification code.', to: req.body.Phone}, function (err, Success) {
            if (!err) {

                User.findOne({"Email": req.body.Email}, function (err, result) {
                    if (!err) {

                        if (result) {
                            updobj = {
                                $set: {
                                    'Status': 2,
                                    "location": {
                                        "longitude": parseFloat(req.body.Longitude),
                                        "latitude": parseFloat(req.body.Latitude)
                                    },
                                    "DeviceType": req.body.DeviceType,
                                    "Phone": req.body.Phone,
                                    "CountryCode": req.body.CountryCode,
                                    'FullAddress': fulladdress,
                                    'SmallAddress': smalladdress,
                                    "DeviceId": req.body.DeviceId,
                                    "DeviceToken": req.body.DeviceToken,
                                    "LastOnline": req.body.Created_dt,
                                    "TimeZone": req.body.Timezone,
                                    'SessionToken': sessionToken,
                                    "Code": randomnumber.toString()
                                }
                            };
                            User.update({
                                "Email": req.body.Email
                            }, updobj, function (err, Obj) {
                                if (!err) {
                                    res.send({
                                        "errNum": ErrObj.success.num,
                                        "errMsg": 'Hey, You are almost there. Verification code has been sent to your mobile.',
                                        "errFlag": '0',
                                        "UserId": result._id,
                                        "Code": randomnumber.toString()
                                    });
                                }
                            });
                        } else {

                            res.send({
                                "errNum": ErrObj.User_not_found.num,
                                "errMsg": "We don't recognize that email address or phone number. Please try again.",
                                "errFlag": '1'
                            });
                        }

                    } else {
                        res.send({
                            "errNum": ErrObj.unexpected_error.num,
                            "errMsg": ErrObj.unexpected_error.message,
                            "errFlag": '1'
                        });
                    }
                });
            } else {
                console.log(err);
                res.send({
                    "errNum": ErrObj.unexpected_error.num,
                    "errMsg": "try again later",
                    "errFlag": '1',
                    'test': err
                });
            }
        });
    }
    function Signup(fulladdress, smalladdress) {
//        console.log(5);
        var sessionToken = randomstring.generate(12);
        var User = db.collection('Customers');
        var randomnumber = Math.floor(10000 + Math.random() * 90000);
       console.log(6);
//        randomnumber = '11111';
        cb.sendMessage({text: randomnumber + ' is your iUsed App verification code.', to: req.body.Phone}, function (err, success) {
            console.log("errerr999",err);
            if (!err) {

                updobj = {
                    'Status': 2,
                    "Name": req.body.Name,
                    "Email": req.body.Email,
                    "Phone": req.body.Phone,
                    "CountryCode": req.body.CountryCode,
                    "Code": randomnumber.toString(),
                    "Photo": req.body.Photo,
                    "location": {
                        "longitude": parseFloat(req.body.Longitude),
                        "latitude": parseFloat(req.body.Latitude)
                    },
                    'FullAddress': fulladdress,
                    'SmallAddress': smalladdress,
                    "DeviceType": req.body.DeviceType,
                    "SignupBy": req.body.SignupBy,
                    "FbId": req.body.FbId,
                    "Os": req.body.Os,
                    "SignupDate": req.body.Created_dt,
                    "DeviceId": req.body.DeviceId,
                    "DeviceToken": req.body.DeviceToken,
                    "LastLogin": req.body.Created_dt,
                    "TimeZone": req.body.Timezone,
                    'SessionToken': sessionToken

                };
                console.log("errerrUserUserUsererrerrerrinsertinsertinsert");
                User.insert(updobj, function (err, result) {
                    if (!err) {
                        User.findOne({"Email": req.body.Email}, function (err, result) {
                            res.send({
                                "errNum": ErrObj.success.num,
                                "errMsg": 'Hey, You are almost there. Verification code has been sent to your mobile.',
                                "errFlag": '0',
                                "UserId": result._id,
                                "Code": randomnumber.toString()
                            });
                        });
                    }
                });

            } else {
                res.send({
                    "errNum": ErrObj.unexpected_error.num,
                    "errMsg": 'Please try again later',
                    "errFlag": '1'
                });
            }
        });
    }
}


//verification Code while signup
exports.SendCodeAgain = function (req, res) {
    var phone = req.body.Phone;
    var UserId = new ObjectID(req.body.UserId);
    var User = db.collection('Customers');
    var randomnumber = Math.floor(10000 + Math.random() * 90000);
//    cb.validatePhone(req.body.Phone, 'reverse_cli', function (err, resp) {
    cb.sendMessage({text: randomnumber + ' is your iUsed App verification code.', to: req.body.Phone}, function (err, Success) {

        if (!err) {
//            randomnumber = resp.cli_prefix;
            updobj = {
                $set: {
                    "Code": randomnumber.toString(),
                    "Phone": req.body.Phone
                }
            };
            User.update({
                "_id": UserId
            }, updobj, function (err, Obj) {
                if (!err) {
                    res.send({
                        "errNum": ErrObj.success.num,
                        "errMsg": ErrObj.success.message,
                        "errFlag": '0',
                        'Code': randomnumber.toString()
                    });
                }
            });
        } else {
            res.send({
                "errNum": ErrObj.success.num,
                "errMsg": 'Try again later',
                "errFlag": '1'
            });
        }
    });
}

exports.getAllCustomers = (req, res) => {
    var User = db.collection("Customers");
    User.find()
      .sort()
      .toArray(function (err, orderlistObj) {
        console.log(orderlistObj);
        if (err) {
        } else {
          res.status(200).send({
            data: orderlistObj,
          });
        }
      });
  };
  exports.getAllProducts = (req, res) => {
    var Products = db.collection("Products");
    Products.find()
      .sort()
      .toArray(function (err, orderlistObj) {
        console.log(orderlistObj);
        if (err) {
        } else {
          res.status(200).send({
            data: orderlistObj,
          });
        }
      });
  };
  exports.blockCustomer = (req, res) => {
      console.log(req.body)
      console.log(req.params)
    var User = db.collection("Customers");
    User.find(
      {
        _id: req.params.userId,
      },
      function (error, userObj) {
        if (!error) {
          console.log(userObj)
          if (userObj) {
            var updobj = {
              $set: { "Status": req.body.status},
            };
            User.update(
              {
                _id:ObjectID( req.params.userId)
              },
              updobj,
              {multi: true},
              function (err, Obj) {
                if (!err) {
                  console.log("test hweqjwhegjh",Obj)
                  res.send({
                    errNum: ErrObj.success.num,
                    errMsg: ErrObj.success.message,
                    errFlag: "0",
                    msg: "updated",   
                  });
                } else {
                  res.send({
                    errNum: ErrObj.unexpected_error.num,
                    errMsg: ErrObj.unexpected_error.message,
                    errFlag: "1",
                  });
                }
              }
            );
          } else {
              console.log("jehwgrhewgrhj", error)
            res.send({
              errNum: ErrObj.User_not_found.num,
              errMsg:
                "User not found",
              errFlag: "1",
              Msg: error,
            });
          }
        } else {
          res.send({
            errNum: ErrObj.unexpected_error.num,
            errMsg: ErrObj.unexpected_error.message,
            errFlag: "1",
          });
        }
      }
    );
  };
  exports.blockProduct = (req, res) => {
      console.log(req.body)
      console.log(req.params)
    var User = db.collection("Products");
    User.find(
      {
        _id: req.params.productId,
      },
      function (error, userObj) {
        if (!error) {
          console.log(userObj)
          if (userObj) {
            var updobj = {
              $set: { "Status": req.body.status},
            };
            User.update(
              {
                _id:ObjectID( req.params.productId)
              },
              updobj,
              {multi: true},
              function (err, Obj) {
                if (!err) {
                  console.log("test hweqjwhegjh",Obj)
                  res.send({
                    errNum: ErrObj.success.num,
                    errMsg: ErrObj.success.message,
                    errFlag: "0",
                    msg: "updated",   
                  });
                } else {
                  res.send({
                    errNum: ErrObj.unexpected_error.num,
                    errMsg: ErrObj.unexpected_error.message,
                    errFlag: "1",
                  });
                }
              }
            );
          } else {
              console.log("jehwgrhewgrhj", error)
            res.send({
              errNum: ErrObj.User_not_found.num,
              errMsg:
                "User not found",
              errFlag: "1",
              Msg: error,
            });
          }
        } else {
          res.send({
            errNum: ErrObj.unexpected_error.num,
            errMsg: ErrObj.unexpected_error.message,
            errFlag: "1",
          });
        }
      }
    );
  };