var express = require("express"),
  router = express.Router();
var randomstring = require("randomstring");
ObjectID = require("mongodb").ObjectID;
var async = require("async");
var ErrObj = {
  unexpected_error: { num: "1003", message: "Unexpected Error" },
  success: { num: "1004", message: "Success" },
  field_missing: { num: "1005", message: "Mandatary Fields Missing" },
  faild: { num: "1006", message: "Mandatary Fields Missing" },
  blocked: {
    num: "1008",
    message:
      "Oops! You are blocked, contact to our customer support for more information.",
  },
};
//customer signup
exports.sellProduct = function (req, res) {
  //    console.log('1');
  var User = db.collection("Customers");
  var missingfield = [];
  if (!req.body.Name) {
    missingfield.push("Name");
  }
  //    if (!req.body.Description) {
  //        missingfield.push("Description");
  //    }

  if (!req.body.Type) {
    //0: non negotianble, 1: negotiable, 3: donate
    missingfield.push("Type");
  }
  if (!req.body.Qty) {
    missingfield.push("Qty");
  }
  if (!req.body.UserId) {
    missingfield.push("UserId");
  }
  if (req.body.Type !== "3") {
    if (!req.body.UsedFor) {
      missingfield.push("UsedFor");
    }
    if (!req.body.CategoryId) {
      missingfield.push("CategoryId");
    }
    if (!req.body.Price) {
      missingfield.push("Price");
    }
  } else {
    if (req.body.ExchangeOffer !== "0" && req.body.ExchangeOffer !== "1") {
      missingfield.push("ExchangeOffer");
    }
  }
  if (!req.body.Created_dt) {
    missingfield.push("Created_dt");
  }

  //console.log('2');

  if (missingfield.length > 0) {
    res.send({
      errNum: ErrObj.field_missing.num,
      errMsg: missingfield + " " + ErrObj.field_missing.message,
      errFlag: "1",
    });
  }

  User.findOne(
    {
      _id: new ObjectID(req.body.UserId),
    },
    function (err, userObj) {
      if (!err) {
        if (userObj.Status === 0) {
          res.send({
            errNum: ErrObj.blocked.num,
            errMsg: ErrObj.blocked.message,
            errFlag: "1",
          });
        } else if (
          userObj.Name === "" ||
          userObj.Name === null ||
          userObj.Email === ""
        ) {
          res.send({
            errNum: "1110",
            errMsg: "As a guest you can not post the item for sell",
            errFlag: "1",
          });
        } else {
          requests(
            "http://www.purgomalum.com/service/plain?text=" +
              req.body.Description,
            function (error, response, body) {
              req.body.Description = body;
              requests(
                "http://www.purgomalum.com/service/plain?text=" + req.body.Name,
                function (error1, response1, body1) {
                  req.body.Name = body1;
                  if (typeof req.body.ProductId !== "undefined") {
                    //                    console.log('1');
                    updateProduct(req.body.ProductId);
                  } else {
                    //                    console.log(2);
                    updateProduct("");
                  }
                }
              );
            }
          );
        }
      }
    }
  );
  function updateProduct(productId) {
    var Products = db.collection("Products");
    var Customers = db.collection("Customers");
    if (productId !== "") {
      //            console.log('1');
      Products.findOne({ _id: productId }, function (err, result) {
        if (!err) {
          if (result) {
            updobj = {
              $set: {
                Name: req.body.Name,
                Description: req.body.Description,
                Price: parseFloat(req.body.Price),
                UsedFor: req.body.UsedFor,
                OfferPer: req.body.OfferPer,
                OfferMins: req.body.OfferMins,
                Links: req.body.Links,
                ExchangeOffer: req.body.ExchangeOffer,
                Edited: "1",
                Condition: req.body.Condition,
              },
            };
            Products.update({ _id: productId }, updobj, function (err, Obj) {
              if (!err) {
                res.send({
                  errNum: ErrObj.success.num,
                  errMsg:
                    "We appreciate your generosity. Our team is currently reviewing the post and publish it very shortly.",
                  errFlag: "0",
                });
              }
            });
          } else {
          }
        } else {
          res.send({
            errNum: ErrObj.unexpected_error.num,
            errMsg: ErrObj.unexpected_error.message,
            errFlag: "1",
          });
        }
      });
    } else {
      //            console.log('2');
      Customers.findOne({ _id: new ObjectID(req.body.UserId) }, function (
        err,
        result
      ) {
        if (!err) {
          //AIzaSyArGUW7z9seJgoOSfNkYkm-OFLhnbrFkGg
          //get gmt time
          var GMTTime = new Date()
            .toISOString()
            .replace(/T/, " ")
            .replace(/\..+/, "");
          var fullAddress = "";
          var smallAddress = "";
          requests(
            "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyArGUW7z9seJgoOSfNkYkm-OFLhnbrFkGg&latlng=" +
              result.location.latitude +
              "," +
              result.location.longitude +
              "&sensor=true",
            function (error, response, body) {
              //                        if (!error) {
              var jsonRes = JSON.parse(body);
              fullAddress = jsonRes.results[0].formatted_address;
              smallAddress = jsonRes.results[4].formatted_address;

              var newId = new ObjectID();
              updobj = {
                _id: newId,
                Status: "5",
                Name: req.body.Name,
                Description: req.body.Description,
                Price: parseFloat(req.body.Price),
                Currency: req.body.Currency,
                Type: req.body.Type,
                Qty: req.body.Qty,
                UsedFor: req.body.UsedFor,
                CategoryId: req.body.CategoryId,
                OfferPer: req.body.OfferPer,
                OfferMins: req.body.OfferMins,
                VideoLinks: req.body.VideoLinks,
                ImageLinks: req.body.ImageLinks,
                ExchangeOffer: req.body.ExchangeOffer,
                PostedBy: req.body.UserId,
                PostedOn: req.body.Created_dt,
                PostedOnGMT: GMTTime,
                location: result.location,
                PostedUserAddress: result.SmallAddress,
                Address: fullAddress,
                City: smallAddress,
                Condition: req.body.Condition,
              };
              Products.insert(updobj, function (err, result) {
                if (!err) {
                  if (req.body.Type === "3") {
                    //
                    res.send({
                      errNum: ErrObj.success.num,
                      errMsg:
                        "We appreciate your generosity. Our team is currently reviewing the post and publish it very shortly. You will get the requests from the needy.",
                      errFlag: "0",
                      ProductId: newId,
                    });
                  } else {
                    res.send({
                      errNum: ErrObj.success.num,
                      errMsg:
                        "Thanks for posting the item. Our team is currently reviewing the post and publish it very shortly.",
                      errFlag: "0",
                      ProductId: newId,
                    });
                  }
                } else {
                  res.send({
                    errNum: ErrObj.unexpected_error.num,
                    errMsg: ErrObj.unexpected_error.message,
                    errFlag: "1",
                  });
                }
              });
              //                        }
            }
          );
        } else {
          res.send({
            errNum: ErrObj.unexpected_error.num,
            errMsg: ErrObj.unexpected_error.message,
            errFlag: "1",
          });
        }
      });
    }
  }
};
/*
 * { Longitude: '77.6961547',
 LowerPriceRange: '',
 UserId: '5805f7b6fa5a4c06f2d6afbe',
 PostedWithin: '',
 SortBy: '',
 Page: '0',
 LowerDistance: '',
 UpperPriceRange: '',
 CategoryId: '57fa4ce2f777738f5f415986',
 Latitude: '12.9393389',
 UpperDistance: '' }
 * 
 * 
 */
//customer details based on phone number
exports.GetProducts = function (req, res) {
  //    console.log(req.body);
  var User = db.collection("Products");
  var PurchaseReqeusts = db.collection("PurchaseReqeusts");
  var lastitems = db.collection("lastitems");
  var Page = req.body.Page;
  var skip;
  skip = parseInt(req.body.Page) * 20;
  var limit = parseInt(skip);
  limit = limit + 20;
  // console.log(skip);
  // console.log(limit);
  //        User.find({}, function (err, result) {
  var SortBy = req.body.SortBy; //1:price low to high,2 : price hight to low, 3: distance,4: newest first
  var LowerPriceRange = req.body.LowerPriceRange;
  var UserId = req.body.UserId;
  var Longitude = req.body.Longitude;
  var Latitude = req.body.Latitude;
  //    console.log(Longitude);

  var CategoryId = req.body.CategoryId;
  var UpperPriceRange = req.body.UpperPriceRange;
  var LowerDistance = req.body.LowerDistance;
  var UpperDistance = req.body.UpperDistance;
  var PostedWithin = req.body.PostedWithin;
  //    if (UpperDistance === '') {
  //        UpperDistance = 100000;
  //    }
  //    if (LowerDistance === '') {
  //        LowerDistance = 0;
  //    }
  StartDate = "";
  var GMTTime = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
  var startdate = moment(GMTTime);
  if (PostedWithin === "1") {
    StartDate = moment(startdate)
      .subtract(1, "days")
      .format("YYYY-MM-DD HH:mm:ss");
  } else if (PostedWithin === "7") {
    StartDate = moment(startdate)
      .subtract(7, "days")
      .format("YYYY-MM-DD HH:mm:ss");
  } else if (PostedWithin === "30") {
    StartDate = moment(startdate)
      .subtract(30, "days")
      .format("YYYY-MM-DD HH:mm:ss");
  }

  var Qry = {};
  var sortbyQry = { PostedOnGMT: -1 };
  if (CategoryId === "") {
    Qry = {
      Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
      PostedBy: { $ne: UserId },
    };
    if (LowerPriceRange !== "") {
      if (StartDate !== "") {
        Qry = {
          PostedOnGMT: { $gt: StartDate },
          Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
          PostedBy: { $ne: UserId },
          $and: [
            { Price: { $lt: parseFloat(UpperPriceRange) } },
            { Price: { $gte: parseFloat(LowerPriceRange) } },
          ],
        };
      } else {
        Qry = {
          Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
          PostedBy: { $ne: UserId },
          $and: [
            { Price: { $lt: parseFloat(UpperPriceRange) } },
            { Price: { $gte: parseFloat(LowerPriceRange) } },
          ],
        };
      }
    } else {
      if (StartDate !== "") {
        Qry = {
          PostedOnGMT: { $gt: StartDate },
          Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
          PostedBy: { $ne: UserId },
        };
      } else {
        Qry = {
          Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
          PostedBy: { $ne: UserId },
        };
      }
    }

    if (SortBy === "3") {
      //closest first
    } else if (SortBy === "4") {
      //newest first
      sortbyQry = { PostedOnGMT: -1 };
    }
  } else {
    Qry = {
      Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
      CategoryId: CategoryId,
      PostedBy: { $ne: UserId },
    };
    if (LowerPriceRange !== "") {
      if (StartDate !== "") {
        Qry = {
          PostedOnGMT: { $gt: StartDate },
          Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
          PostedBy: { $ne: UserId },
          CategoryId: CategoryId,
          $and: [
            { Price: { $lt: parseFloat(UpperPriceRange) } },
            { Price: { $gte: parseFloat(LowerPriceRange) } },
          ],
        };
      } else {
        Qry = {
          Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
          PostedBy: { $ne: UserId },
          CategoryId: CategoryId,
          $and: [
            { Price: { $lt: parseFloat(UpperPriceRange) } },
            { Price: { $gte: parseFloat(LowerPriceRange) } },
          ],
        };
      }
    } else {
      if (StartDate !== "") {
        Qry = {
          PostedOnGMT: { $gt: StartDate },
          Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
          PostedBy: { $ne: UserId },
          CategoryId: CategoryId,
        };
      } else {
        Qry = {
          Status: { $nin: ["2", "3", "1", "4", "5", "6"] },
          PostedBy: { $ne: UserId },
          CategoryId: CategoryId,
        };
      }
    }
    //        if (SortBy === '1') {
    //
    //            sortbyQry = {Price: 1};
    //        } else if (SortBy === '2') {
    //
    //            sortbyQry = {Price: -1};
    //        } else
    if (SortBy === "3") {
      //highest first
    } else if (SortBy === "4") {
      //distance

      sortbyQry = { PostedOnGMT: -1 };
    }
  }
  var type1 = [];
  var type2 = [];
  var type3 = [];
  if (SortBy === "3") {
    getUserDetail(UserId, function (err, UserDet) {
      if (UserDet) {
        if (UserDet.Status === 0) {
          res.send({
            errNum: ErrObj.blocked.num,
            errMsg: ErrObj.blocked.message,
            errFlag: "1",
          });
        } else {
          if (
            Longitude === "" ||
            Latitude === "" ||
            typeof Longitude === "undefined" ||
            typeof Latitude === "undefined"
          ) {
            Longitude = UserDet.location.longitude;
            Latitude = UserDet.location.latitude;
          }
          var i = 0;
          var ii = 0;
          db.command(
            {
              geoNear: "Products",
              near: [parseFloat(Longitude), parseFloat(Latitude)],
              maxDistance: 1000000,
              query: Qry,
            },
            function (err, result) {
              //                                console.log(result);
              async.each(
                result.results,
                function (item, callback) {
                  //                                    console.log(item.obj);
                  var mainDistance =
                    geolib.getDistance(
                      {
                        latitude: item.obj.location.latitude,
                        longitude: item.obj.location.longitude,
                      },
                      { latitude: Latitude, longitude: Longitude }
                    ) / 1000;
                  var dta = {};
                  dta.UsedFor = item.obj.UsedFor;
                  dta.Condition = item.obj.Condition;
                  dta.ProductId = item.obj._id;
                  dta.ProductName = item.obj.Name;
                  dta.Distance = mainDistance.toString();
                  var imgg = item.obj.ImageLinks.split(",");
                  var MImg = imgg[0];
                  if (MImg === "" || MImg === null) {
                    MImg = "http://iusedapp.com/apis/controllers/default.png";
                  }
                  dta.Image = imgg[0];
                  dta.Price = item.obj.Price.toString();
                  dta.Currency = item.obj.Currency;
                  dta.PostedByImage = UserDet.Photo;
                  dta.Favorite = "0";
                  dta.Description = item.obj.Description;
                  var ok = 0;
                  //                                    console.log(mainDistance);
                  if (UpperDistance !== "" && UpperPriceRange !== "") {
                    if (
                      parseFloat(mainDistance) < parseFloat(UpperDistance) &&
                      parseFloat(mainDistance) >= parseFloat(LowerDistance) &&
                      parseFloat(item.obj.Price) <
                        parseFloat(UpperPriceRange) &&
                      parseFloat(item.obj.Price) >= parseFloat(LowerPriceRange)
                    ) {
                      ok = 1;
                    }
                  } else if (UpperDistance !== "") {
                    if (
                      parseFloat(mainDistance) < parseFloat(UpperDistance) &&
                      parseFloat(mainDistance) >= parseFloat(LowerDistance)
                    ) {
                      ok = 1;
                    }
                  } else if (UpperPriceRange !== "") {
                    if (
                      parseFloat(item.obj.Price) <
                        parseFloat(UpperPriceRange) &&
                      parseFloat(item.obj.Price) >= parseFloat(LowerPriceRange)
                    ) {
                      ok = 1;
                    }
                  } else {
                    ok = 1;
                  }

                  if (ok === 1) {
                    if (item.obj.Type === "1") {
                      if (i >= skip && i < limit) {
                        type1.push(dta);
                        i++;
                        callback();
                      } else {
                        i++;
                        callback();
                      }
                    }
                    //                                        console.log('1');
                    if (item.obj.Type === "2") {
                      PurchaseReqeusts.findOne(
                        {
                          $query: {
                            ProductId: item.obj._id.toString(),
                            Status: { $ne: "2" },
                          },
                          $orderby: { Datetime: -1 },
                        },
                        function (err, maxBid) {
                          if (ii >= skip && ii < limit) {
                            //                                                    console.log(maxBid);
                            if (maxBid) {
                              ii++;
                              dta.Price = maxBid.Amount;
                              dta.Favorite = "0";
                              type2.push(dta);
                              callback();
                            } else {
                              ii++;
                              type2.push(dta);
                              callback();
                            }
                          } else {
                            ii++;
                            callback();
                          }
                        }
                      );
                    }
                    if (item.obj.Type === "3") {
                      callback();
                    }
                  } else {
                    callback();
                  }
                },
                function (err) {
                  if (!err) {
                    console.log("2");
                    res.send({
                      errFlag: "0",
                      errNum: ErrObj.success.num,
                      errMsg: ErrObj.success.message,
                      Negotiable: type2,
                      NonNegotiable: type1,
                      WishList: type3,
                    });
                  }
                }
              );
            }
          );
        }
      }
    });
  } else {
    getUserDetail(UserId, function (err, UserDet) {
      if (UserDet) {
        if (UserDet.Status === 0) {
          //check user blocked or  not
          res.send({
            errNum: ErrObj.blocked.num,
            errMsg: ErrObj.blocked.message,
            errFlag: "1",
          });
        } else {
          if (
            Longitude === "" ||
            Latitude === "" ||
            typeof Longitude === "undefined" ||
            typeof Latitude === "undefined"
          ) {
            Longitude = UserDet.location.longitude;
            Latitude = UserDet.location.latitude;
          }
          //                    console.log(Qry);
          //                    console.log(sortbyQry);
          var i = 0;
          var ii = 0;
          User.find(Qry, {})
            .sort(sortbyQry)
            .toArray(function (err, orderlistObj) {
              if (!err) {
                if (orderlistObj) {
                  async.each(
                    orderlistObj,
                    function (item, callbackgetproduct) {
                      getProductDetailWithDistance(
                        item._id.toString(),
                        Longitude,
                        Latitude,
                        UpperDistance,
                        LowerDistance,
                        function (err, ItemDetail) {
                          if (ItemDetail) {
                            if (ItemDetail.Type === "2") {
                              PurchaseReqeusts.findOne(
                                {
                                  $query: {
                                    ProductId: item._id.toString(),
                                    Status: { $ne: "2" },
                                  },
                                  $orderby: { DatetimeGMT: -1 },
                                },
                                function (err, maxBid) {
                                  //                                                    if (i >= parseFloat(skip) && i < parseFloat(limit)) {
                                  if (maxBid) {
                                    //                                                            i++;
                                    ItemDetail.Price = maxBid.Amount;
                                    ItemDetail.Favorite = "0";
                                    type2.push(ItemDetail);
                                    callbackgetproduct();
                                  } else {
                                    //                                                            i++;

                                    ItemDetail.Favorite = "0";
                                    type2.push(ItemDetail);
                                    callbackgetproduct();
                                  }
                                  //                                                    } else {
                                  //                                                        i++;
                                  //                                                        callbackgetproduct();
                                  //                                                    }
                                }
                              );
                            } else if (ItemDetail.Type === "1") {
                              //                                                if (ii >= parseFloat(skip) && ii < parseFloat(limit)) {

                              //                                                    ii++;
                              ItemDetail.Favorite = "0";
                              type1.push(ItemDetail);
                              callbackgetproduct();
                              //                                                } else {
                              //                                                    ii++;
                              //                                                    callbackgetproduct();
                              //                                                }
                            } else {
                              callbackgetproduct();
                            }
                          } else {
                            callbackgetproduct();
                          }
                        }
                      );
                    },
                    function (err) {
                      if (!err) {
                        if (SortBy === "1") {
                          type2.sort(sortNumberRev);
                          type1.sort(sortNumberRev);
                        }
                        if (SortBy === "2") {
                          type2.sort(sortNumber);
                          type1.sort(sortNumber);
                        }

                        //                                        type1array = [];
                        //                                        type2array = [];
                        //                                        type1.forEach(function (value) {
                        //                                            lastitems.remove({'UserId': UserId}, function (err, exists) {
                        //
                        //                                            });
                        //
                        //                                            type1array.push(value.ProductId);
                        //                                        });
                        //                                        type2.forEach(function (value) {
                        //                                            type2array.push(value.ProductId);
                        //                                        });
                        //                                        lastitems.insert(updobj);
                        //                                        lastitems.insert(updobj);
                        //                                        console.log(skip);
                        //                                        console.log(limit);
                        res.send({
                          errFlag: "0",
                          errNum: ErrObj.success.num,
                          errMsg: ErrObj.success.message,
                          NonNegotiable: type1.slice(skip, limit),
                          Negotiable: type2.slice(skip, limit),
                          WishList: type3,
                        });
                      } else {
                        res.send({
                          errFlag: "1",
                          errNum: ErrObj.unexpected_error.num,
                          errMsg: ErrObj.unexpected_error.message,
                        });
                      }
                    }
                  );
                } else {
                  res.send({
                    errFlag: "1",
                    errNum: ErrObj.success.num,
                    errMsg: ErrObj.success.message,
                  });
                }
              }
            });
        }
      }
    });
  }
};

function sortNumber(a, b) {
  return b.Price - a.Price;
}
function sortNumberRev(a, b) {
  return a.Price - b.Price;
}

//customer details based on phone number
exports.GetAllProducts = function (req, res) {
  //    console.log(req.body);
  var User = db.collection("Products");
  var PurchaseReqeusts = db.collection("PurchaseReqeusts");
  var skip;
  skip = parseInt(req.body.Page) * 10;
  var limit = parseInt(skip);
  limit = limit + 10;
  // console.log(skip);
  // console.log(limit);
  //        User.find({}, function (err, result) {
  var UserId = req.body.UserId;
  StartDate = "";
  var Qry = {};
  Qry = {
    Status: { $nin: ["2", "3", "1", "4", "5"] },
    PostedBy: { $ne: UserId },
  };
  var type1 = [];
  var type2 = [];
  var type3 = [];
  getUserDetail(UserId, function (err, UserDet) {
    if (UserDet) {
      if (UserDet.Status === 0) {
        //check user blocked or  not
        res.send({
          errNum: ErrObj.blocked.num,
          errMsg: ErrObj.blocked.message,
          errFlag: "1",
        });
      } else {
        // console.log(Qry);
        var i = 0;
        var ii = 0;
        //                    console.log(skip);
        //                    console.log(limit);
        //                    console.log('----------------');
        User.find(Qry, {})
          .sort()
          .toArray(function (err, orderlistObj) {
            if (!err) {
              if (orderlistObj) {
                async.each(
                  orderlistObj,
                  function (item, callbackgetproduct) {
                    //  console.log(item.Name);

                    getProductDetailWithDistance(
                      item._id.toString(),
                      UserDet.location.longitude,
                      UserDet.location.latitude,
                      "",
                      "",
                      function (err, ItemDetail) {
                        //                                        console.log(2);
                        if (ItemDetail) {
                          if (ItemDetail.Type === "1") {
                            PurchaseReqeusts.findOne(
                              {
                                $query: {
                                  ProductId: item._id.toString(),
                                  Status: { $ne: "2" },
                                },
                                $orderby: { Datetime: -1 },
                              },
                              function (err, maxBid) {
                                if (i >= skip && i < limit) {
                                  //                                                        console.log(i);
                                  if (maxBid) {
                                    i++;
                                    ItemDetail.Price = maxBid.Amount;
                                    MatchWishList(
                                      UserDet.WishList,
                                      ItemDetail.ProductName,
                                      function (err, WishLisst) {
                                        if (WishLisst) {
                                          ItemDetail.Favorite = "1";
                                          type1.push(ItemDetail);
                                          type3.push(ItemDetail);
                                          //                                                                    console.log(1);
                                          callbackgetproduct();
                                        } else {
                                          ItemDetail.Favorite = "0";
                                          type1.push(ItemDetail);
                                          //                                                                    console.log(2);
                                          callbackgetproduct();
                                        }
                                      }
                                    );
                                    //                                                    callback();
                                  } else {
                                    i++;
                                    MatchWishList(
                                      UserDet.WishList,
                                      ItemDetail.ProductName,
                                      function (err, WishLisst) {
                                        if (WishLisst) {
                                          ItemDetail.Favorite = "1";
                                          type1.push(ItemDetail);
                                          type3.push(ItemDetail);
                                          //                                                                    console.log(3);
                                          callbackgetproduct();
                                        } else {
                                          ItemDetail.Favorite = "0";
                                          type1.push(ItemDetail);
                                          //                                                                    console.log(4);
                                          callbackgetproduct();
                                        }
                                      }
                                    );
                                    //                                                    callback();
                                  }
                                } else {
                                  i++;
                                  //                                                        console.log(5);
                                  callbackgetproduct();
                                }
                              }
                            );
                          } else if (ItemDetail.Type === "2") {
                            // if(ii>=skip && ii<limit){
                            if (
                              ii >= parseFloat(skip) &&
                              ii < parseFloat(limit)
                            ) {
                              ii++;
                              //                                                console.log('1');
                              MatchWishList(
                                UserDet.WishList,
                                ItemDetail.ProductName,
                                function (err, WishLisst) {
                                  if (WishLisst) {
                                    ItemDetail.Favorite = "1";
                                    type2.push(ItemDetail);
                                    type3.push(ItemDetail);
                                    //                                                            console.log(6);
                                    callbackgetproduct();
                                  } else {
                                    ItemDetail.Favorite = "0";
                                    type2.push(ItemDetail);
                                    //                                                            console.log(7);
                                    callbackgetproduct();
                                  }
                                }
                              );
                            } else {
                              ii++;
                              //                                                    console.log(8);
                              callbackgetproduct();
                            }
                          } else {
                            //                                                console.log(9);
                            callbackgetproduct();
                          }
                          //                                            console.log(type1);
                          //                                            console.log(type2);

                          //                                            if (ItemDetail.Type === '3') {
                          //                                                type3.push(ItemDetail);
                          //                                                callback();
                          //
                          //                                            }
                        } else {
                          //                                            console.log(10);
                          callbackgetproduct();
                        }
                      }
                    );
                  },
                  function (err) {
                    if (!err) {
                      res.send({
                        errFlag: "0",
                        errNum: ErrObj.success.num,
                        errMsg: ErrObj.success.message,
                        NonNegotiable: type1,
                        Negotiable: type2,
                        WishList: type3,
                      });
                    } else {
                      res.send({
                        errFlag: "1",
                        errNum: ErrObj.unexpected_error.num,
                        errMsg: ErrObj.unexpected_error.message,
                      });
                    }
                  }
                );
              } else {
                res.send({
                  errFlag: "1",
                  errNum: ErrObj.success.num,
                  errMsg: ErrObj.success.message,
                });
              }
            }
          });
      }
    }
  });
};

//customer details based on phone number
exports.GetDonations = function (req, res) {
  //    console.log(req.body);
  var User = db.collection("Products");
  var PurchaseReqeusts = db.collection("PurchaseReqeusts");
  var skip;
  skip = Number(req.body.Page) * 10;
  var limit = parseInt(skip);
  limit = limit + 10;
  //    var skip = 0;
  //    var limit = 100;
  var UserId = req.body.UserId;
  var Qry = {};
  var sortbyQry = {};
  Qry = { Status: { $nin: ["2", "3", "1", "4", "6", "5"] }, Type: "3" };
  var myDonations = [];
  var Other = [];
  //    console.log(skip);
  //
  //    console.log(limit);
  getUserDetail(UserId, function (err, UserDet) {
    if (UserDet) {
      if (UserDet.Status === 0) {
        //check user blocked or  not
        res.send({
          errNum: ErrObj.blocked.num,
          errMsg: ErrObj.blocked.message,
          errFlag: "1",
        });
      } else {
        var countPro = 0;
        User.find(Qry, {})
          .sort({ PostedOnGMT: -1 })
          .toArray(function (err, orderlistObj) {
            if (!err) {
              if (orderlistObj) {
                async.each(
                  orderlistObj,
                  function (item, callback) {
                    getProductDetailWithDistance(
                      item._id.toString(),
                      UserDet.location.longitude,
                      UserDet.location.latitude,
                      "",
                      "",
                      function (err, ItemDetail) {
                        if (ItemDetail) {
                          if (item.PostedBy === UserId) {
                            //                                            myDonations.push(ItemDetail);
                            callback();
                          } else {
                            if (countPro < limit && countPro >= skip) {
                              Other.push(ItemDetail);
                              countPro++;
                              callback();
                            } else {
                              countPro++;
                              callback();
                            }
                          }
                        } else {
                          callback();
                        }
                      }
                    );
                  },
                  function (err) {
                    if (!err) {
                      res.send({
                        errFlag: "0",
                        errNum: ErrObj.success.num,
                        errMsg: ErrObj.success.message,
                        //"Mydonations": myDonations,
                        OtherDonations: Other,
                      });
                    } else {
                      res.send({
                        errFlag: "1",
                        errNum: ErrObj.unexpected_error.num,
                        errMsg: ErrObj.unexpected_error.message,
                      });
                    }
                  }
                );
              } else {
                res.send({
                  errFlag: "1",
                  errNum: ErrObj.success.num,
                  errMsg: ErrObj.success.message,
                });
              }
            }
          });
      }
    }
  });
};
exports.ProductDetail = function (req, res) {
  var Products = db.collection("Products");
  var ProductViews = db.collection("ProductViews");
  var PurchaseReqeusts = db.collection("PurchaseReqeusts");
  var ProductId = req.body.ProductId;
  var UserId = req.body.UserId;
  var Datetime = req.body.Datetime;
  //    console.log(1);
  //    return false;
  var GMTTime = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
  var updobj = {
    ProductId: ProductId,
    UserId: UserId,
    Datetime: Datetime,
    DatetimeGMT: GMTTime,
  };
  Products.findOne({ _id: new ObjectID(ProductId) }, function (err, result) {
    if (!err) {
      if (result) {
        //                console.log(1);
        ProductViews.insert(updobj);
        getUserDetail(UserId, function (err, MainUserDet) {
          if (MainUserDet) {
            if (MainUserDet.Status === 0) {
              //check user blocked or  not
              res.send({
                errNum: ErrObj.blocked.num,
                errMsg: ErrObj.blocked.message,
                errFlag: "1",
              });
            } else {
              getUserDetail(result.PostedBy, function (err, UserDet) {
                if (UserDet) {
                  //                                    console.log(1);
                  var OfferedPrice = "";
                  var OfferedBy = "";
                  var OriginalP = "";
                  var PriceShouldbe = "";
                  PurchaseReqeusts.findOne(
                    {
                      $query: {
                        ProductId: ProductId.toString(),
                        Status: { $ne: "2" },
                      },
                      $orderby: { Datetime: -1 },
                    },
                    function (err, maxBid) {
                      if (err) {
                        OriginalP = parseFloat(result.Price);
                        PriceShouldbe = OriginalP + (OriginalP * 5) / 100;
                        res.send({
                          errNum: ErrObj.success.num,
                          errMsg: ErrObj.success.message,
                          errFlag: "0",
                          Data: [
                            {
                              Qty: result.Qty,
                              OfferPer: result.OfferPer,
                              UserName: UserDet.Name,
                              OfferedPrice: OfferedPrice,
                              OfferedBy: OfferedBy,
                              NextBidShouldBe: PriceShouldbe,
                              OriginalPrice: result.Price.toString(),
                              OfferMins: result.OfferMins,
                              ExchangeOffer: result.ExchangeOffer,
                              PostedOn: result.PostedOn,
                              ImageLinks: result.ImageLinks,
                              VideoLinks: result.VideoLinks,
                            },
                          ],
                        });
                      }
                      if (maxBid) {
                        //                                            console.log(2);
                        OfferedPrice = maxBid.Amount;
                        OriginalP = parseFloat(OfferedPrice);
                        PriceShouldbe = OriginalP + (OriginalP * 5) / 100;
                        getUserDetail(maxBid.UserId, function (
                          err,
                          OfferedUser
                        ) {
                          if (OfferedUser) {
                            OfferedBy = OfferedUser.Name;
                            res.send({
                              errNum: ErrObj.success.num,
                              errMsg: ErrObj.success.message,
                              errFlag: "0",
                              Data: [
                                {
                                  Qty: result.Qty,
                                  OfferPer: result.OfferPer,
                                  UserName: UserDet.Name,
                                  OriginalPrice: result.Price.toString(),
                                  OfferedPrice: OfferedPrice,
                                  OfferedBy: OfferedBy,
                                  NextBidShouldBe: PriceShouldbe,
                                  OfferMins: result.OfferMins,
                                  ExchangeOffer: result.ExchangeOffer,
                                  PostedOn: result.PostedOn,
                                  ImageLinks: result.ImageLinks,
                                  VideoLinks: result.VideoLinks,
                                },
                              ],
                            });
                          } else {
                            res.send({
                              errNum: ErrObj.success.num,
                              errMsg: ErrObj.success.message,
                              errFlag: "0",
                              Data: [
                                {
                                  Qty: result.Qty,
                                  OfferPer: result.OfferPer,
                                  UserName: UserDet.Name,
                                  OriginalPrice: result.Price.toString(),
                                  OfferedPrice: OfferedPrice,
                                  OfferedBy: OfferedBy,
                                  NextBidShouldBe: PriceShouldbe,
                                  OfferMins: result.OfferMins,
                                  ExchangeOffer: result.ExchangeOffer,
                                  PostedOn: result.PostedOn,
                                  ImageLinks: result.ImageLinks,
                                  VideoLinks: result.VideoLinks,
                                },
                              ],
                            });
                          }
                        });
                      } else {
                        //                                            console.log(3);
                        OriginalP = parseFloat(result.Price);
                        PriceShouldbe = OriginalP + (OriginalP * 5) / 100;
                        res.send({
                          errNum: ErrObj.success.num,
                          errMsg: ErrObj.success.message,
                          errFlag: "0",
                          Data: [
                            {
                              Qty: result.Qty,
                              OfferPer: result.OfferPer,
                              UserName: UserDet.Name,
                              OriginalPrice: result.Price.toString(),
                              OfferedPrice: OfferedPrice,
                              OfferedBy: OfferedBy,
                              NextBidShouldBe: PriceShouldbe,
                              OfferMins: result.OfferMins,
                              ExchangeOffer: result.ExchangeOffer,
                              PostedOn: result.PostedOn,
                              ImageLinks: result.ImageLinks,
                              VideoLinks: result.VideoLinks,
                            },
                          ],
                        });
                      }
                    }
                  );
                } else {
                  res.send({
                    errNum: ErrObj.unexpected_error.num,
                    errMsg: "Item is not available now",
                    errFlag: "1",
                  });
                }
              });
            }
          }
        });
      } else {
        res.send({
          errNum: ErrObj.unexpected_error.num,
          errMsg: "Item is not available now",
          errFlag: "1",
        });
      }
    } else {
      res.send({
        errNum: ErrObj.unexpected_error.num,
        errMsg: ErrObj.unexpected_error.message,
        errFlag: "1112",
      });
    }
  });
};

exports.UpdateWishList = function (req, res) {
  var custid = new ObjectID(req.body.UserId);
  var User = db.collection("Customers");
  User.findOne(
    {
      _id: custid,
    },
    function (err, userObj) {
      if (!err) {
        if (userObj.Status === 0) {
          res.send({
            errNum: ErrObj.blocked.num,
            errMsg: ErrObj.blocked.message,
            errFlag: "1",
          });
        } else {
          //                updobj = {
          //                    $set: {"WishList": req.body.WishList}
          //                };
          //                User.update({
          //                    "_id": custid
          //                }, updobj, function (err, Obj) {
          //                    if (!err) {
          var type1 = [];
          var type2 = [];
          var type3 = [];
          getUserDetail(req.body.UserId, function (err, UserDet) {
            if (UserDet) {
              if (UserDet.Status === 0) {
                res.send({
                  errNum: ErrObj.blocked.num,
                  errMsg: ErrObj.blocked.message,
                  errFlag: "1",
                });
              } else {
                var replaced = req.body.WishList.split(" ").join("*");
                db.command(
                  {
                    geoNear: "Products",
                    near: [
                      parseFloat(UserDet.location.longitude),
                      parseFloat(UserDet.location.latitude),
                    ],
                    maxDistance: 1000000,
                    query: {
                      Status: { $nin: ["2", "3", "1", "4", "5"] },
                      $or: [
                        {
                          Name: { $regex: new RegExp(replaced), $options: "i" },
                        },
                        {
                          Name: {
                            $regex: new RegExp(req.body.WishList),
                            $options: "i",
                          },
                        },
                      ],
                      PostedBy: { $ne: req.body.UserId },
                    }, //'Status': {'$nin': ['2', '3', '1', '4', '5']},
                  },
                  function (err, result) {
                    //                                        console.log(result);
                    async.each(
                      result.results,
                      function (item, callbackmeupdatewishlist) {
                        var dta = {};
                        dta.UsedFor = item.obj.UsedFor;
                        dta.Condition = item.obj.Condition;
                        dta.PostedBy = item.obj.PostedBy;
                        dta.PostedByUserName = UserDet.Name;
                        dta.PostedByPhone = UserDet.Phone;
                        dta.ProductName = item.obj.Name;
                        //                                            dta.Distance = item.dis.toString();
                        dta.Distance = (
                          geolib.getDistance(
                            {
                              latitude: item.obj.location.latitude,
                              longitude: item.obj.location.longitude,
                            },
                            {
                              latitude: UserDet.location.latitude,
                              longitude: UserDet.location.longitude,
                            }
                          ) / 1000
                        ).toString();
                        var MImg = "";
                        if (item.obj.ImageLinks !== "") {
                          var imgg = item.obj.ImageLinks.split(",");
                          MImg = imgg[0];
                        }
                        if (MImg === "" || MImg === null) {
                          MImg =
                            "http://iusedapp.com/apis/controllers/default.png";
                        }
                        dta.Image = MImg;
                        //dta.Image = 'http://iusedapp.com/apis/controllers/default.png';
                        dta.Price = item.obj.Price.toString();
                        dta.Currency = item.obj.Currency;
                        dta.QtyRemaining = "0";
                        dta.Favorite = "0";
                        dta.Description = item.obj.Description;
                        dta.Type = item.obj.Type;
                        dta.ProductId = item.obj._id;
                        if (item.obj.Type === "1") {
                          type1.push(dta);
                          //                                                console.log('1');

                          callbackmeupdatewishlist();
                        } else if (item.obj.Type === "2") {
                          type2.push(dta);
                          //                                                console.log('2');

                          callbackmeupdatewishlist();
                        } else {
                          type3.push(dta);
                          //                                                console.log('2');
                          callbackmeupdatewishlist();
                        }

                        //                                            MatchItem(UserDet.WishList, item.obj.Name, function (err, WishLisst) {
                        //                                                if (WishLisst) {
                        //                                                    if (item.obj.Type === '1') {
                        //                                                        type1.push(dta);
                        //                                                        console.log('1');
                        //
                        //                                                        callbackmeupdatewishlist();
                        //                                                    } else if (item.obj.Type === '2') {
                        //                                                        type2.push(dta);
                        //                                                        console.log('2');
                        //
                        //                                                        callbackmeupdatewishlist();
                        //                                                    }
                        //
                        //                                                } else {
                        //                                                    console.log('3');
                        //                                                    callbackmeupdatewishlist();
                        //                                                }
                        //                                            });
                      },
                      function (err) {
                        if (!err) {
                          res.send({
                            errFlag: "0",
                            errNum: ErrObj.success.num,
                            errMsg: ErrObj.success.message,
                            NonNegotiable: type1,
                            Negotiable: type2,
                            Donation: type3,
                          });
                        }
                      }
                    );
                  }
                );
              }
            }
          });
          //                    }
          //                })
        }
      }
    }
  );
};

exports.RespondToRequest = function (req, res) {
  // console.log(req.body);
  var RequestId = new ObjectID(req.body.RequestId);
  var Status = req.body.OrderStatus;
  var Code = req.body.Code;
  var Location = req.body.Location;
  var PurchaseReqeusts = db.collection("PurchaseReqeusts");
  var Products = db.collection("Products");
  if (Status !== "1" && Status !== "2" && Status !== "3") {
    //accepted
    res.send({
      errNum: "1",
      errMsg: "Status is invalid",
      errFlag: "1",
    });
  } else {
    PurchaseReqeusts.findOne({ _id: RequestId }, function (err, userObj) {
      if (!err) {
        if (userObj) {
          if (Status === "3" && Code !== userObj.SecrateCode) {
            //completed
            res.send({
              errNum: "1",
              errMsg:
                "Secrate code is not correct ask buyer to generate code again",
              errFlag: "1",
            });
          } else {
            var updobj = {};
            if (Status === "1") {
              //accepted
              updobj = { $set: { Status: Status, Location: Location } };
            }
            if (Status === "2") {
              //Rejected/Canceled
              updobj = { $set: { Status: Status } };
            }
            if (Status === "3") {
              //completed
              updobj = { $set: { Status: Status } };
            }

            PurchaseReqeusts.update({ _id: RequestId }, updobj, function (
              err,
              Obj
            ) {
              if (!err) {
                var updobj = {};
                if (Status === "1") {
                  updobj = { $set: { Status: "2" } };
                } else if (Status === "2") {
                  updobj = { $set: { Status: "5" } };
                } else if (Status === "3") {
                  updobj = { $set: { Status: "3" } };
                }
                PurchaseReqeusts.update(
                  {
                    $and: [
                      { _id: { $ne: RequestId } },
                      { ProductId: userObj.ProductId },
                    ],
                  },
                  { $set: { Status: "2" } },
                  { multi: true },
                  function (err, Obj) {
                    if (!err) {
                      Products.update(
                        { _id: new ObjectID(userObj.ProductId) },
                        updobj,
                        function (err, Obj) {
                          if (!err) {
                            getUserDetail(userObj.UserId, function (
                              err,
                              PushTo
                            ) {
                              if (PushTo) {
                                getUserDetail(userObj.ProductOwner, function (
                                  err,
                                  Owner
                                ) {
                                  if (Owner) {
                                    getMainProductDetail(
                                      userObj.ProductId,
                                      function (err, ProDet) {
                                        if (ProDet) {
                                          var PushMsg = "";
                                          var pushType = "0";
                                          if (ProDet.Type === "3") {
                                            //                                                                            console.log('1');
                                            pushType = "1";
                                            if (Status === "2") {
                                              PushMsg =
                                                "Donor of " +
                                                ProDet.Name +
                                                " rejected your request.";
                                            } else {
                                              //                                                                                console.log('2');
                                              PushMsg =
                                                "Congratulations! The donor has accepted your request to donate " +
                                                ProDet.Name +
                                                ". You can find the donor's contact under 'Donate -> Donor Responses' and schedule the meet accordingly. Thanks";
                                              // PushMsg = 'Donor of ' + ProDet.Name + ' may be contacting you shortly. Alternatively, you can contact the donor at  ' + Owner.Phone + '.';
                                            }
                                          } else {
                                            if (Status === "2") {
                                              PushMsg =
                                                Owner.Name +
                                                ", the seller of the " +
                                                ProDet.Name +
                                                " rejected your offer.";
                                            } else {
                                              PushMsg =
                                                Owner.Name +
                                                ", the seller of the " +
                                                ProDet.Name +
                                                " almost accepted your offer. He would be contacting you very shortly. Alternatively, you can call the seller at " +
                                                Owner.Phone +
                                                ".";
                                            }
                                          }
                                          sendpush(
                                            PushTo.DeviceToken,
                                            PushMsg,
                                            "iUsed",
                                            { pushType: pushType, Type: "1" },
                                            function (err, r) {
                                              res.send({
                                                errNum: ErrObj.success.num,
                                                errMsg: ErrObj.success.message,
                                                errFlag: "0",
                                                test: err,
                                                test1: r,
                                                token: PushTo.DeviceToken,
                                              });
                                            }
                                          );
                                        } else {
                                          res.send({
                                            errNum: ErrObj.success.num,
                                            errMsg: ErrObj.success.message,
                                            errFlag: "0",
                                          });
                                        }
                                      }
                                    );
                                  } else {
                                    res.send({
                                      errNum: ErrObj.success.num,
                                      errMsg: ErrObj.success.message,
                                      errFlag: "0",
                                    });
                                  }
                                });
                              } else {
                                res.send({
                                  errNum: ErrObj.success.num,
                                  errMsg: ErrObj.success.message,
                                  errFlag: "0",
                                });
                              }
                            });
                          }
                        }
                      );
                    }
                  }
                );
              }
            });
          }
        } else {
          res.send({
            errNum: ErrObj.unexpected_error.num,
            errMsg: ErrObj.unexpected_error.message,
            errFlag: "1112",
          });
        }
      } else {
        res.send({
          errNum: ErrObj.unexpected_error.num,
          errMsg: ErrObj.unexpected_error.message,
          errFlag: "1112",
        });
      }
    });
  }
};
exports.GetCategories = function (req, res) {
  var Cats = db.collection("Categories");
  var Products = db.collection("Products");
  Cats.find({}, {})
    .sort({ count: 1 })
    .toArray(function (err, orderlistObj) {
      if (!err) {
        res.send({
          errNum: ErrObj.success.num,
          errMsg: ErrObj.success.message,
          errFlag: "0",
          Categories: orderlistObj,
        });
        //            });
      } else {
        res.send({
          errNum: ErrObj.unexpected_error.num,
          errMsg: ErrObj.unexpected_error.message,
          errFlag: "1112",
        });
      }
    });
};

exports.GetNotifications = function (req, res) {
  var Cats = db.collection("HomescreenNotifications");
  Cats.find({}, {})
    .sort({ count: 1 })
    .toArray(function (err, orderlistObj) {
      if (!err) {
        res.send({
          errNum: ErrObj.success.num,
          errMsg: ErrObj.success.message,
          errFlag: "0",
          Notificaions: orderlistObj,
        });
        //            });
      } else {
        res.send({
          errNum: ErrObj.unexpected_error.num,
          errMsg: ErrObj.unexpected_error.message,
          errFlag: "1112",
        });
      }
    });
};

exports.CheckCount = function (req, res) {
  var Cats = db.collection("PurchaseReqeusts");
  Cats.count({}, {}, function (err, orderlistObj) {
    if (!err) {
      res.send({
        errNum: ErrObj.success.num,
        errMsg: ErrObj.success.message,
        errFlag: "0",
        Categories: orderlistObj,
      });
    } else {
      res.send({
        errNum: ErrObj.unexpected_error.num,
        errMsg: ErrObj.unexpected_error.message,
        errFlag: "1112",
      });
    }
  });
};

exports.GenerateCode = function (req, res) {
  var PurchaseReqeusts = db.collection("PurchaseReqeusts");
  var ReqeustId = req.body.ReqeustId;
  if (ReqeustId === "") {
    res.send({
      errNum: "1",
      errMsg: "Reqeust Id is missing",
      errFlag: "1",
    });
  } else {
    var code = randomString();
    updobjProduct = { $set: { SecrateCode: code } };
    PurchaseReqeusts.update(
      { _id: new ObjectID(ReqeustId) },
      updobjProduct,
      function (err, Obj) {
        if (!err) {
          res.send({
            errNum: ErrObj.success.num,
            errMsg: "Success",
            errFlag: "0",
            Code: code,
          });
        }
      }
    );
  }
};

//customer details based on phone number
exports.PurchaseRequests = function (req, res) {
  //    console.log(req.body);
  var Products = db.collection("Products");
  var PurchaseReqeusts = db.collection("PurchaseReqeusts");
  var ProductId = req.body.ProductId;
  //        User.find({}, function (err, result) {
  var Amount = req.body.Amount;
  var UserId = req.body.UserId;
  var Datetime = req.body.Datetime;
  var OfferTill = req.body.OfferTill;
  var Message = req.body.Message;
  //    var OfferTillGMT = req.body.OfferTillGMT;
  var qty = req.body.Qty;
  var appliedOffer = 0;
  var GMTTime = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
  if (OfferTill !== "" || OfferTill !== null) {
    var startdate = moment(GMTTime);
    var OfferTillGMT = moment(startdate)
      .add(OfferTill, "minutes")
      .format("YYYY-MM-DD HH:mm:ss"); // see the cloning?m YYYY-MM-DD HH:mm:ss
  }
  //check product is sold or not and how many qty sold
  var totaltemSold = 0;
  var gterestValue = 0;
  PurchaseReqeusts.find({ ProductId: ProductId }, {})
    .sort({ DatetimeGMT: 1 })
    .toArray(function (err, orderlistObj) {
      if (!err) {
        var data = [];
        async.each(
          orderlistObj,
          function (item, callback) {
            //                console.log(item);
            if (item) {
              //                    console.log('1');

              if (item.length >= 5 && item.Type === "1") {
                res.send({
                  errNum: ErrObj.unexpected_error.num,
                  errMsg:
                    "Oops, this item got more than 5 reqeusts so you can try again later.",
                  errFlag: "1",
                });
              } else {
                if (item.Status === "3") {
                  totaltemSold += parseFloat(item.Qty);
                  callback();
                } else if (item.Status !== "2" && item.Status !== "3") {
                  gterestValue = item.Amount;
                  callback();
                } else {
                  callback();
                }
              }

              /* PurchaseReqeusts.count({'ProductId': ProductId}, {}, function (err, orderlistObj) {
                     if (!err) {
                     if (orderlistObj.toString() === '5') {
                     res.send({
                     "errNum": ErrObj.unexpected_error.num,
                     "errMsg": "Oops, this product got more then 5 reqeusts so you try again later.",
                     "errFlag": '1'
                     });
                     } else {
                     
                     if (item.Status === '3') {
                     totaltemSold += parseFloat(item.Qty);
                     }
                     callback();
                     }
                     
                     } else {
                     res.send({
                     "errNum": ErrObj.unexpected_error.num,
                     "errMsg": ErrObj.unexpected_error.message,
                     "errFlag": '1'
                     });
                     }
                     });*/
            } else {
              res.send({
                errNum: ErrObj.unexpected_error.num,
                errMsg: ErrObj.unexpected_error.message,
                errFlag: "1",
              });
            }
          },
          function (err) {
            //                console.log('2');
            if (!err) {
              Products.findOne({ _id: new ObjectID(ProductId) }, function (
                err,
                result
              ) {
                if (!err) {
                  if (result) {
                    //                                console.log('3');
                    //                                if (result.Qty === totaltemSold) {//check if all qty sold out
                    //                                    res.send({
                    //                                        "errNum": '1008',
                    //                                        "errMsg": 'This product is soldout.',
                    //                                        "errFlag": '1'
                    //                                    });
                    //                                } else {
                    //check if reqeusted qty is available or not
                    var availableQty = result.Qty - totaltemSold;
                    //                                    if (availableQty < parseFloat(qty)) {
                    //                                        res.send({
                    //                                            "errNum": '1009',
                    //                                            "errMsg": 'Only ' + availableQty + ' quantity is available for this product',
                    //                                            "errFlag": '1'
                    //                                        });
                    //                                    } else {
                    //else check if i already reqeusted for purchasing this item
                    PurchaseReqeusts.findOne(
                      { ProductId: ProductId, UserId: UserId },
                      function (err, exists) {
                        if (!err) {
                          //                                        if (exists) {
                          //                                            res.send({
                          //                                                "errNum": '1007',
                          //                                                "errMsg": 'You’ve already offered for the same item in the past.',
                          //                                                "errFlag": '1'
                          //                                            });
                          //                                        } else {
                          //                                            console.log('4');

                          var currency = "";
                          if (
                            result.Currency === "" ||
                            result.Currency === null ||
                            result.Currency === "null"
                          ) {
                          } else {
                            currency = result.Currency;
                          }
                          if (result.Type === "1") {
                            var timestring1 = result.PostedOnGMT;
                            var startdate = moment(timestring1);
                            var newTime = moment(startdate)
                              .add(result.OfferMins, "minutes")
                              .format("YYYY-MM-DD HH:mm:ss"); // see the cloning?m YYYY-MM-DD HH:mm:ss
                            if (newTime >= GMTTime) {
                              appliedOffer = 1;
                              Amount =
                                parseFloat(result.Price) -
                                (parseFloat(result.Price) *
                                  parseFloat(result.OfferPer)) /
                                  100;
                            } else {
                              Amount = parseFloat(result.Price);
                            }
                            if (exists) {
                              PurchaseReqeusts.remove(
                                {
                                  $and: [
                                    { ProductId: ProductId },
                                    { UserId: UserId },
                                  ],
                                },
                                function (err, exists) {
                                  sendReqeust(
                                    result.PostedBy,
                                    result.Type,
                                    qty,
                                    availableQty,
                                    currency
                                  );
                                }
                              );
                            } else {
                              PurchaseReqeusts.count(
                                {
                                  $and: [
                                    { ProductId: ProductId },
                                    { Status: "0" },
                                  ],
                                },
                                {},
                                function (err, totalReq) {
                                  if (totalReq + 1 <= 5) {
                                    if (totalReq + 1 === 5) {
                                      Products.update(
                                        { _id: new ObjectID(ProductId) },
                                        { $set: { Status: "6" } },
                                        function (err, Obj) {
                                          //unpublished
                                          sendReqeust(
                                            result.PostedBy,
                                            result.Type,
                                            qty,
                                            availableQty,
                                            currency
                                          );
                                        }
                                      );
                                    } else {
                                      sendReqeust(
                                        result.PostedBy,
                                        result.Type,
                                        qty,
                                        availableQty,
                                        currency
                                      );
                                    }
                                  } else {
                                    res.send({
                                      errNum: ErrObj.faild.num,
                                      errMsg:
                                        "Sorry, the seller is no more accepting the offers at this time. ",
                                      errFlag: "1",
                                    });
                                  }
                                }
                              );
                            }
                          }
                          var availableQty = result.Qty - totaltemSold;
                          var per = 5;
                          var perMax = 10;
                          if (result.Type === "2") {
                            if (Amount === "") {
                              res.send({
                                errNum: ErrObj.field_missing.num,
                                errMsg:
                                  "Amount " + ErrObj.field_missing.message,
                                errFlag: "1",
                              });
                            } else if (OfferTill === "") {
                              res.send({
                                errNum: ErrObj.field_missing.num,
                                errMsg:
                                  "OfferTill " + ErrObj.field_missing.message,
                                errFlag: "1",
                              });
                            } else {
                              var PriceRange = db.collection("PriceRange");
                              PriceRange.findOne(
                                {
                                  $and: [
                                    { From: { $lte: result.Price } },
                                    { To: { $gt: result.Price } },
                                  ],
                                },
                                function (err1, dataexists) {
                                  if (!err1) {
                                    if (dataexists) {
                                      perMax = parseFloat(dataexists.PerMax);
                                      per = parseFloat(dataexists.Per);
                                    }
                                    //                                                        console.log(dataexists);
                                    //                                                        console.log(per);
                                    //                                                        console.log(perMax);
                                    //console.log(gterestValue);
                                    if (
                                      gterestValue === 0 ||
                                      gterestValue === "0"
                                    ) {
                                      gterestValue = result.Price;
                                    }
                                    var OriginalP = parseInt(gterestValue);
                                    //                                                        console.log('OriginalP : ' + OriginalP);
                                    var PriceShouldbe = parseInt(
                                      OriginalP + (OriginalP * per) / 100
                                    );
                                    //                                                        console.log('PriceShouldbe : ' + PriceShouldbe);
                                    var PriceShouldbelessthen = parseInt(
                                      OriginalP + (OriginalP * perMax) / 100
                                    );
                                    //                                                        console.log('PriceShouldbelessthen : ' + PriceShouldbelessthen);
                                    if (PriceShouldbe > parseInt(Amount)) {
                                      res.send({
                                        errNum: ErrObj.faild.num,
                                        // "errMsg": 'Amount should be ' + per + '% more than the existing amount.',
                                        errMsg:
                                          "Hey, We have certain price considerations based on the competition. Your offer must be at least " +
                                          currency +
                                          "" +
                                          PriceShouldbe,
                                        errFlag: "1",
                                      });
                                    } else if (
                                      PriceShouldbelessthen < parseInt(Amount)
                                    ) {
                                      res.send({
                                        errNum: ErrObj.faild.num,
                                        errMsg:
                                          "Hey, We have certain price considerations based on the competition. You offer has to be between " +
                                          currency +
                                          "" +
                                          PriceShouldbe +
                                          " and " +
                                          currency +
                                          "" +
                                          PriceShouldbelessthen +
                                          " at this time. Thank you. ",
                                        errFlag: "1",
                                      });
                                      //
                                    } else {
                                      if (exists) {
                                        PurchaseReqeusts.remove(
                                          {
                                            $and: [
                                              { ProductId: ProductId },
                                              { UserId: UserId },
                                            ],
                                          },
                                          function (err, exists) {
                                            sendReqeust(
                                              result.PostedBy,
                                              result.Type,
                                              qty,
                                              availableQty,
                                              currency
                                            );
                                          }
                                        );
                                      } else {
                                        sendReqeust(
                                          result.PostedBy,
                                          result.Type,
                                          qty,
                                          availableQty,
                                          currency
                                        );
                                      }
                                    }
                                  }
                                }
                              );
                            }
                          }
                          if (result.Type === "3") {
                            PurchaseReqeusts.count(
                              {
                                $and: [
                                  { ProductId: ProductId },
                                  { Status: "0" },
                                ],
                              },
                              {},
                              function (err, totalReq) {
                                if (totalReq + 1 <= 3) {
                                  if (totalReq + 1 === 3) {
                                    Products.update(
                                      { _id: new ObjectID(ProductId) },
                                      { $set: { Status: "6" } },
                                      function (err, Obj) {
                                        //unpublished
                                        sendReqeust(
                                          result.PostedBy,
                                          result.Type,
                                          qty,
                                          availableQty,
                                          currency
                                        );
                                      }
                                    );
                                  } else {
                                    sendReqeust(
                                      result.PostedBy,
                                      result.Type,
                                      qty,
                                      availableQty,
                                      currency
                                    );
                                  }
                                } else {
                                  res.send({
                                    errNum: ErrObj.faild.num,
                                    errMsg:
                                      "Sorry, the seller is no more accepting the offers at this time. ",
                                    errFlag: "1",
                                  });
                                }
                              }
                            );
                          }
                          //                                        }
                        }
                      }
                    );
                    //                                    }
                    //                                }
                    //
                  } else {
                    res.send({
                      errNum: ErrObj.unexpected_error.num,
                      errMsg: ErrObj.unexpected_error.message,
                      test: result,
                      errFlag: "1",
                    });
                  }
                }
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
      }
    });
  function sendReqeust(owner, type, qty, availableQty, currency) {
    getUserDetail(UserId, function (err, UserDet) {
      if (UserDet) {
        if (UserDet.Status === 0) {
          //check user blocked or  not
          res.send({
            errNum: ErrObj.blocked.num,
            errMsg: ErrObj.blocked.message,
            errFlag: "1",
          });
        } else {
          var updobj = {};
          if (type === "3") {
            //if type is donation then complete the purchase process update the product is sold

            updobj = {
              ProductId: ProductId,
              Status: "0",
              Message: Message,
              ProductOwner: owner,
              Qty: qty,
              OfferTillGMT: OfferTillGMT,
              UserId: UserId,
              Datetime: Datetime,
              DatetimeGMT: GMTTime,
              OfferTill: OfferTill,
              Amount: Amount,
              appliedOffer: appliedOffer,
              BuyerLocation: UserDet.FullAddress,
              BuyerLatitude: UserDet.location.latitude,
              BuyerLongitude: UserDet.location.longitude,
              Currency: currency,
            };
            PurchaseReqeusts.insert(updobj, function (err, result) {
              if (!err) {
                //                            console.log(qty + '--' + availableQty);
                //                                if (qty.toString() === availableQty.toString()) { // if buyer wants all the available qty then complet the transection
                //                                    updobjProduct = {$set: {'Status': '3'}};
                //                                    Products.update({"_id": new ObjectID(ProductId)}, updobjProduct, function (err, Obj) {
                //                                        if (!err) {
                //                                            res.send({
                //                                                "errNum": ErrObj.success.num,
                //                                                "errMsg": 'Thanks for the offer. We will get back to you when the seller accepts your offer.',
                //                                                "errFlag": '0'
                //                                            });
                //                                        }
                //                                    });
                //                                } else {
                getUserDetail(owner, function (err, OwnerDet) {
                  if (OwnerDet) {
                    var PushMsg =
                      "You have some request(s) from the needy.. Some people are interested. Check the details now!";
                    sendpush(
                      OwnerDet.DeviceToken,
                      PushMsg,
                      "iUsed",
                      { pushType: "1", Type: "0" },
                      function (err, r) {
                        //                                            console.log('2');
                        res.send({
                          errNum: ErrObj.success.num,
                          errMsg:
                            "Thanks for the message. We share it with the donor and update you on the status shortly. Once your request is approved by the donor, you are free to contact the donor directly.",
                          errFlag: "0",
                        });
                      }
                    );
                  } else {
                    //                                        console.log('1');
                    res.send({
                      errNum: ErrObj.success.num,
                      errMsg:
                        "Thanks for the message. We share it with the donor and update you on the status shortly. Once your request is approved by the donor, you are free to contact the donor directly. ",
                      errFlag: "0",
                    });
                  }
                });
                //                                }
              } else {
                res.send({
                  errNum: ErrObj.unexpected_error.num,
                  errMsg: ErrObj.unexpected_error.message,
                  errFlag: "1",
                });
              }
            });
          } else {
            //if not donation then update that product is under process seller will get request and he will decide what to do
            updobj = {
              ProductId: ProductId,
              Status: "0",
              Message: Message,
              ProductOwner: owner,
              Qty: qty,
              OfferTillGMT: OfferTillGMT,
              UserId: UserId,
              Datetime: Datetime,
              DatetimeGMT: GMTTime,
              OfferTill: OfferTill,
              Amount: Amount,
              appliedOffer: appliedOffer,
              BuyerLocation: UserDet.FullAddress,
              BuyerLatitude: UserDet.location.latitude,
              BuyerLongitude: UserDet.location.longitude,
            };
            PurchaseReqeusts.insert(updobj, function (err, result) {
              if (!err) {
                PurchaseReqeusts.count({}, {}, function (err, orderlistObj) {
                  if (!err) {
                    getUserDetail(owner, function (err, OwnerDet) {
                      if (OwnerDet) {
                        sendpush(
                          OwnerDet.DeviceToken,
                          "You got some offer from the buyer(s). Please check and respond quickly.",
                          "iUsed",
                          { pushType: "0", Type: "0" },
                          function (err, r) {
                            if (orderlistObj.toString() === "5") {
                              Products.update(
                                { _id: new ObjectID(ProductId) },
                                { $set: { Status: "2" } },
                                function (err, Obj) {
                                  //unpublished
                                  if (!err) {
                                    res.send({
                                      errNum: ErrObj.success.num,
                                      errMsg:
                                        "Thanks for the offer. We will get back to you when seller accepts your offer.",
                                      errFlag: "0",
                                    });
                                  }
                                }
                              );
                            } else {
                              res.send({
                                errNum: ErrObj.success.num,
                                errMsg:
                                  "Thanks for the offer. We will get back to you when seller accepts your offer.",
                                errFlag: "0",
                              });
                            }
                          }
                        );
                      } else {
                        if (orderlistObj.toString() === "5") {
                          Products.update(
                            { _id: new ObjectID(ProductId) },
                            { $set: { Status: "2" } },
                            function (err, Obj) {
                              //unpublished
                              if (!err) {
                                res.send({
                                  errNum: ErrObj.success.num,
                                  errMsg:
                                    "Thanks for the offer. We will get back to you when seller accepts your offer.",
                                  errFlag: "0",
                                });
                              }
                            }
                          );
                        } else {
                          res.send({
                            errNum: ErrObj.success.num,
                            errMsg:
                              "Thanks for the offer. We will get back to you when seller accepts your offer.",
                            errFlag: "0",
                          });
                        }
                      }
                    });
                  } else {
                    res.send({
                      errNum: ErrObj.unexpected_error.num,
                      errMsg: ErrObj.unexpected_error.message,
                      errFlag: "1",
                    });
                  }
                });
              } else {
                res.send({
                  errNum: ErrObj.unexpected_error.num,
                  errMsg: ErrObj.unexpected_error.message,
                  errFlag: "1",
                });
              }
            });
          }
        }
      }
    });
  }
};

exports.GetProductPurchaseRequests = function (req, res) {
  var PurchaseReqeusts = db.collection("PurchaseReqeusts");
  var UserId = req.body.UserId;
  var Datetime = req.body.Datetime;
  var For = req.body.For; //0: donation,1: means buy and sell
  var GMTTime = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
  getUserDetail(UserId, function (err, UserDet) {
    if (UserDet) {
      if (UserDet.Status === 0) {
        //check user blocked or  not
        res.send({
          errNum: ErrObj.blocked.num,
          errMsg: ErrObj.blocked.message,
          errFlag: "1",
        });
      } else {
        PurchaseReqeusts.find({ UserId: UserId }, {})
          .sort()
          .toArray(function (err, PurchaseReqeust) {
            if (!err) {
              var MyRequestsTobuy = [];
              async.each(
                PurchaseReqeust,
                function (item, callback) {
                  if (item) {
                    otherUserId = item.ProductOwner;
                    getUserDetail(otherUserId, function (err, UserDet) {
                      var mainData = {};
                      if (UserDet) {
                        getProductDetail(item.ProductId, For, function (
                          err,
                          ProDet
                        ) {
                          if (ProDet) {
                            mainData.RequestId = item._id;
                            mainData.Location = item.Location;
                            mainData.UserName = UserDet.Name;
                            mainData.Photo = UserDet.Photo;
                            mainData.UserPhone = UserDet.Phone;
                            mainData.UserId = UserDet.UserId;
                            mainData.ProductId = item.ProductId;
                            mainData.ProductName = ProDet.Name;
                            mainData.ImotionalMessage = item.Message;
                            mainData.Qty = ""; //item.Qty.toString();
                            mainData.Amount = item.Amount.toString();
                            mainData.Currency = ProDet.Currency;
                            mainData.UsedFor = ProDet.UsedFor.toString();
                            mainData.Condition = ProDet.Condition;
                            mainData.OriginalPrice = ProDet.Price;
                            mainData.VideoLinks = ProDet.VideoLinks;
                            if (
                              ProDet.ImageLinks !== "" &&
                              ProDet.ImageLinks !== null &&
                              typeof ProDet.ImageLinks !== "undefined"
                            ) {
                              mainData.ProductImage = ProDet.ImageLinks.split(
                                ","
                              )[0];
                            } else {
                              mainData.ProductImage = "";
                            }
                            mainData.ProductImage = ProDet.ImageLinks;
                            mainData.OfferApplied = item.appliedOffer;
                            mainData.OfferTill = item.OfferTill;
                            mainData.Status = item.Status;
                            MyRequestsTobuy.push(mainData);
                            callback();
                          } else {
                            callback();
                          }
                        });
                      } else {
                        callback();
                      }
                    });
                  }
                },
                function (err) {
                  var Products = db.collection("Products");
                  if (For === "0") {
                    For = "3";
                  } else {
                    For = { $ne: "3" };
                  }
                  Products.find(
                    { $and: [{ PostedBy: UserId }, { Type: For }] },
                    {}
                  )
                    .sort({ PostedOnGMT: -1 })
                    .toArray(function (err, MyProducts) {
                      if (!err) {
                        var MyRequestsToSell = [];
                        async.each(
                          MyProducts,
                          function (ProDet, callbackMain) {
                            var check = 0;
                            PurchaseReqeusts.find(
                              { ProductId: ProDet._id.toString() },
                              {}
                            )
                              .sort({ OfferTillGMT: -1 })
                              .toArray(function (err, PurchaseReqeust) {
                                if (!err) {
                                  async.each(
                                    PurchaseReqeust,
                                    function (item, callback) {
                                      if (item) {
                                        var otherUserId = item.UserId;
                                        check++;
                                        getUserDetail(otherUserId, function (
                                          err,
                                          UserDet
                                        ) {
                                          var mainData = {};
                                          var SellReqs = {};
                                          if (UserDet) {
                                            SellReqs.ImotionalMessage = "";
                                            SellReqs.RequestId = item._id;
                                            SellReqs.Location = item.Location;
                                            SellReqs.UserName = UserDet.Name;
                                            SellReqs.Photo = UserDet.Photo;
                                            SellReqs.UserPhone = UserDet.Phone;
                                            SellReqs.UserId = UserDet.UserId;
                                            mainData.Reqeusts = [];
                                            SellReqs.Qty = ""; //item.Qty.toString();
                                            SellReqs.Amount = item.Amount.toString();
                                            SellReqs.OriginalPrice = ProDet.Price.toString();
                                            SellReqs.OfferApplied =
                                              item.appliedOffer;
                                            SellReqs.OfferTill = item.OfferTill;
                                            SellReqs.Status = item.Status;
                                            SellReqs.Currency = ProDet.Currency;
                                            SellReqs.ProductId = item.ProductId;
                                            SellReqs.ProductName = ProDet.Name;
                                            SellReqs.expiresOn = moment(
                                              item.Datetime
                                            )
                                              .add(item.OfferTill, "minutes")
                                              .format("YYYY-MM-DD HH:mm:ss");
                                            var expiresOnvar = moment(
                                              item.DatetimeGMT
                                            )
                                              .add(item.OfferTill, "minutes")
                                              .format("YYYY-MM-DD HH:mm:ss");
                                            var ms = moment(
                                              expiresOnvar,
                                              "YYYY-MM-DD HH:mm:ss"
                                            ).diff(
                                              moment(
                                                GMTTime,
                                                "YYYY-MM-DD HH:mm:ss"
                                              )
                                            );
                                            var d = moment.duration(ms);
                                            var s =
                                              Math.floor(d.asHours()) +
                                              moment.utc(ms).format(":mm:ss");
                                            SellReqs.expiresin = s;
                                            mainData.ProductId = item.ProductId;
                                            mainData.ProductName = ProDet.Name;
                                            mainData.Currency = ProDet.Currency;
                                            mainData.UsedFor = ProDet.UsedFor.toString();
                                            mainData.Condition =
                                              ProDet.Condition;
                                            SellReqs.ImotionalMessage =
                                              item.Message;
                                            mainData.Type = ProDet.Type;
                                            mainData.VideoLinks =
                                              ProDet.VideoLinks;
                                            if (
                                              ProDet.ImageLinks !== "" &&
                                              ProDet.ImageLinks !== null &&
                                              typeof ProDet.ImageLinks !==
                                                "undefined"
                                            ) {
                                              mainData.ProductImage = ProDet.ImageLinks.split(
                                                ","
                                              )[0];
                                            } else {
                                              mainData.ProductImage = "";
                                            }
                                            mainData.ProductImage =
                                              ProDet.ImageLinks;
                                            mainData.count = item.length;
                                            mainData.Status = item.Status;
                                            if (
                                              typeof in_array(
                                                MyRequestsToSell,
                                                item.ProductId
                                              ) === "undefined"
                                            ) {
                                              if (
                                                SellReqs.Status === "0" ||
                                                SellReqs.Status === "1"
                                              ) {
                                                mainData.Reqeusts.push(
                                                  SellReqs
                                                );
                                              }
                                              mainData.count =
                                                mainData.Reqeusts.length;
                                              MyRequestsToSell.push(mainData);
                                            } else {
                                              if (
                                                SellReqs.Status === "0" ||
                                                SellReqs.Status === "1"
                                              ) {
                                                var index = in_array(
                                                  MyRequestsToSell,
                                                  item.ProductId
                                                );
                                                //                                                                        console.log(MyRequestsToSell[index].Reqeusts.length);
                                                if (
                                                  mainData.Type === "2" &&
                                                  MyRequestsToSell[index]
                                                    .Reqeusts.length < 5
                                                ) {
                                                  MyRequestsToSell[
                                                    index
                                                  ].Reqeusts.push(SellReqs);
                                                  var ct =
                                                    parseFloat(
                                                      MyRequestsToSell[index]
                                                        .count
                                                    ) + 1;
                                                  MyRequestsToSell[
                                                    index
                                                  ].count = ct.toString();
                                                } else if (
                                                  mainData.Type === "3" &&
                                                  MyRequestsToSell[index]
                                                    .Reqeusts.length < 3
                                                ) {
                                                  MyRequestsToSell[
                                                    index
                                                  ].Reqeusts.push(SellReqs);
                                                  var ct =
                                                    parseFloat(
                                                      MyRequestsToSell[index]
                                                        .count
                                                    ) + 1;
                                                  MyRequestsToSell[
                                                    index
                                                  ].count = ct.toString();
                                                } else if (
                                                  mainData.Type === "1"
                                                ) {
                                                  MyRequestsToSell[
                                                    index
                                                  ].Reqeusts.push(SellReqs);
                                                  var ct =
                                                    parseFloat(
                                                      MyRequestsToSell[index]
                                                        .count
                                                    ) + 1;
                                                  MyRequestsToSell[
                                                    index
                                                  ].count = ct.toString();
                                                }
                                              }
                                            }
                                            callback();
                                          } else {
                                            callback();
                                          }
                                        });
                                      }
                                    },
                                    function (err) {
                                      if (check === 0) {
                                        var mainData = {};
                                        mainData.Reqeusts = [];
                                        mainData.UsedFor = ProDet.UsedFor.toString();
                                        mainData.Condition = ProDet.Condition;
                                        mainData.ProductId = ProDet._id.toString();
                                        mainData.ProductName = ProDet.Name;
                                        if (
                                          ProDet.ImageLinks !== "" ||
                                          ProDet.ImageLinks !== null
                                        ) {
                                          mainData.ProductImage = ProDet.ImageLinks.split(
                                            ","
                                          )[0];
                                        } else {
                                          mainData.ProductImage = "";
                                        }
                                        mainData.count = "0";
                                        mainData.Status = ProDet.Status;
                                        mainData.Type = ProDet.Type;
                                        MyRequestsToSell.push(mainData);
                                        callbackMain();
                                      } else {
                                        callbackMain();
                                      }
                                    }
                                  );
                                }
                              });
                          },
                          function (err) {
                            if (!err) {
                              res.send({
                                errNum: ErrObj.success.num,
                                errMsg: ErrObj.success.message,
                                errFlag: "0",
                                iWantToBuy: MyRequestsTobuy,
                                iWantToSell: MyRequestsToSell,
                              });
                            }
                          }
                        );
                      }
                    });
                }
              );
            }
          });
      }
    }
  });
};

//if order accept getting orderdata
function getUserDetail(UserId, callbackuserdetail) {
  var customer = db.collection("Customers");
  var _id = new ObjectID(UserId);
  customer.findOne({ _id: _id }, function (err, result1) {
    if (!err) {
      callbackuserdetail(null, result1);
    } else {
      callbackuserdetail(null, null);
    }
  });
}

//if order accept getting orderdata
function getProductDetail(ProductId, For, callbackProDet) {
  var customer = db.collection("Products");
  var _id = new ObjectID(ProductId);
  if (For === "0") {
    For = "3";
  } else {
    For = { $ne: "3" };
  }
  customer.findOne({ $and: [{ _id: _id }, { Type: For }] }, function (
    err,
    result1
  ) {
    if (!err) {
      callbackProDet(null, result1);
    } else {
      callbackProDet(null, null);
    }
  });
}
//if order accept getting orderdata
function getMainProductDetail(ProductId, callbackmainprodet) {
  var customer = db.collection("Products");
  var _id = new ObjectID(ProductId);
  customer.findOne({ _id: _id }, function (err, result1) {
    if (!err) {
      callbackmainprodet(null, result1);
    } else {
      callbackmainprodet(null, null);
    }
  });
}

//if order accept getting orderdata
function MatchWishList(Wishlist, itemName, callbacktomain) {
  //wishlist products
  //    console.log(Wishlist);
  //    console.log(itemName);
  if (Wishlist) {
    var wishlists = Wishlist.split(",");
    for (var i = 0; i < wishlists.length; i++) {
      var str = itemName;
      var re = new RegExp(wishlists[i], "gi");
      var res = str.match(re);
      if (res) {
        //if its matched
        callbacktomain(null, res);
        break;
      } else {
        str = wishlists[i];
        re = new RegExp(itemName, "gi");
        res = str.match(re);
        if (res) {
          //if its matched
          callbacktomain(null, res);
          break;
        } else {
          var Words = wishlists[i].split(" ");
          //                    console.log(Wishlist[i]);
          if (Words.length > 0) {
            //                        console.log(Words);
            var str = itemName;
            for (var j = 0; j < Words.length; j++) {
              if (Words[j].length >= 2) {
                var re = new RegExp(Words[j], "gi");
                var res = str.match(re);
                //                                console.log(res);
                if (res) {
                  //                                    console.log('1');
                  callbacktomain(null, res);
                  break;
                } else {
                  callbacktomain(null, null);
                  //                                    break;

                  if (j === Words.length - 1) {
                    //                                        callback(null, null);
                  }
                }
              }
            }
            //                        if (matched === 1) {
            //
            //                        } else {
            //                            callback(null, null);
            //                        }
          }
          //                    callback(null, null);
        }
      }

      //Do something
    }
  } else {
    callbacktomain(null, null);
    //        return;
  }
}

//if order accept getting orderdata
function MatchItem(wishlists, itemName, callbacktomain) {
  //wishlist products
  //    console.log(Wishlist);
  //    console.log(itemName);
  if (wishlists) {
    var str = itemName;
    var re = new RegExp(wishlists, "gi");
    var res = str.match(re);
    if (res) {
      //if its matched
      callbacktomain(null, res);
    } else {
      str = wishlists;
      re = new RegExp(itemName, "gi");
      res = str.match(re);
      if (res) {
        //if its matched
        callbacktomain(null, res);
      } else {
        var Words = wishlists.split(" ");
        //                    console.log(Wishlist[i]);
        if (Words.length > 0) {
          //                        console.log(Words);
          var str = itemName;
          for (var j = 0; j < Words.length; j++) {
            if (Words[j].length >= 2) {
              var re = new RegExp(Words[j], "gi");
              var res = str.match(re);
              //                                console.log(res);
              if (res) {
                //                                    console.log('1');
                callbacktomain(null, res);
              } else {
                callbacktomain(null, null);
                if (j === Words.length - 1) {
                }
              }
            }
          }
        }
      }
    }

    //Do something
  } else {
    callbacktomain(null, null);
    //        return;
  }
}

//if order accept getting orderdata
function getProductDetailWithDistance(
  ProductId,
  long,
  lat,
  upDis,
  lowDis,
  callbackprodewithdist
) {
  var customer = db.collection("Products");
  var Terms = db.collection("Terms");
  var PurchaseReqeusts = db.collection("PurchaseReqeusts");
  var _id = new ObjectID(ProductId);
  var totaltemSold = 0;
  //    console.log(_id);
  var dta = {};
  db.command(
    {
      geoNear: "Products",
      near: [parseFloat(long), parseFloat(lat)],
      maxDistance: 1000000,
      query: { _id: _id },
    },
    function (err, result) {
      if (result) {
        async.each(
          result.results,
          function (item, callback1) {
            PurchaseReqeusts.find({ ProductId: ProductId }, {})
              .sort()
              .toArray(function (err, orderlistObj) {
                if (!err) {
                  var data = [];
                  getUserDetail(item.obj.PostedBy, function (err, UserDet) {
                    if (UserDet) {
                      dta.UsedFor = item.obj.UsedFor;
                      dta.Condition = item.obj.Condition;
                      dta.PostedBy = item.obj.PostedBy;
                      dta.PostedByUserName = UserDet.Name;
                      dta.PostedByPhone = UserDet.Phone;
                      dta.PostedByImage = UserDet.Photo;
                      dta.ProductName = item.obj.Name;
                      //                                            dta.Distance = item.dis.toString();
                      dta.Distance = (
                        geolib.getDistance(
                          {
                            latitude: item.obj.location.latitude,
                            longitude: item.obj.location.longitude,
                          },
                          { latitude: lat, longitude: long }
                        ) / 1000
                      ).toString();
                      var MImg = "";
                      if (item.obj.ImageLinks !== "") {
                        var imgg = item.obj.ImageLinks.split(",");
                        MImg = imgg[0];
                      }
                      if (MImg === "" || MImg === null) {
                        MImg =
                          "http://iusedapp.com/apis/controllers/default.png";
                      }
                      dta.Image = MImg;
                      //dta.Image = 'http://iusedapp.com/apis/controllers/default.png';
                      dta.Price = item.obj.Price.toString();
                      dta.Currency = item.obj.Currency;
                      dta.ExchangeOffer = item.obj.ExchangeOffer;
                      dta.QtyRemaining = "0";
                      dta.Favorite = "0";
                      dta.Description = item.obj.Description;
                      dta.Type = item.obj.Type;
                      dta.ProductId = item.obj._id;
                      callback1();
                    } else {
                      callback1();
                    }
                  });
                } else {
                  callback1();
                }
              });
          },
          function (err) {
            if (!err) {
              if (upDis !== "") {
                if (
                  parseFloat(dta.Distance) < parseFloat(upDis) &&
                  parseFloat(dta.Distance) >= parseFloat(lowDis)
                ) {
                  callbackprodewithdist(null, dta);
                } else {
                  callbackprodewithdist(null, null);
                }
              } else {
                Terms.findOne({}, function (err, userObj) {
                  var dis = 500;
                  if (userObj.ItemRadius !== "") {
                    dis = parseInt(userObj.ItemRadius);
                  }
                  if (parseFloat(dta.Distance) < dis) {
                    callbackprodewithdist(null, dta);
                  } else {
                    callbackprodewithdist(null, null);
                  }
                });
              }
            } else {
              callbackprodewithdist(null, null);
            }
          }
        );
      } else {
        callbackprodewithdist(null, null);
      }
    }
  );
}

function in_array(arrayy, id) {
  //    console.log(array.length);
  for (var i = 0; i <= arrayy.length - 1; i++) {
    if (arrayy[i].ProductId === id) {
      return i;
    }
  }
}
exports.testpush = function (req, res) {
  //    var PurchaseReqeusts = db.collection('PurchaseReqeusts');
  //    PurchaseReqeusts.update({'$and': [{"_id": {'$ne': new ObjectID('58427359853d84136f05af8f')}}, {"ProductId": "583c7e5188ccf616d0b6be77"}]}, {$set: {'Status': '2'}}, {'multi': true}, function (err, Obj) {
  //        if (!err) {
  //            res.send({
  //                "errFlag": Obj
  //            });
  //        } else {
  //            res.send({
  //                "errFlag": err
  //            });
  //        }
  //    });
  sendpush(
    "erbtO5LHZRo:APA91bHoN80rV-eqJjBEb-76ETcbCJXGPSElnxJ3rz9p1mpuxc8He3TuNw-wznapGeH99d68tyStc18zre4WUySMhFSsmDGSa_bueWa6dMFnv4nFg2bPhPmRWV1-pFIODUY81osGh4U6",
    "kya be lodu?",
    "iUsed",
    { pushType: "0", Type: "0" },
    function (err, r) {
      if (!err) {
        res.send({
          errFlag: r,
        });
      } else {
        res.send({
          errFlag: err,
        });
      }
    }
  );
};
exports.GetItemConditions = function (req, res) {
  res.send({
    errFlag: "0",
    Conditions: [
      "Brand-new / Unused",
      "Almost looking new",
      "Well maintained",
      "Refurbished",
      "Few scratches",
      "Little broken",
      "Some repair work needed",
      "Not working",
    ],
  });
};

function sendpush(token, message, title, data, callbacksendpush) {
  //    console.log("push ")

  var serverKey = "AIzaSyCnZ1OL0HcrkZZPnyKh5dobnUQSTAF3cRY"; //'AIzaSyCq2FRWpk9P5XTbe_9K7jvAzTTi7AUbR6M';
  var fcm = new FCM(serverKey);
  var PushMsg = {
    to: token, // required fill with device token or topics
    collapse_key: "your_collapse_key",
    priority: "high",
    data: data,
    notification: {
      title: title,
      body: message,
      sound: "default",
    },
  };
  //fcm.send(PushMsg)
  //    .then(function(response){
  //        console.log("Successfully sent with response: ", response);
  //    })
  //    .catch(function(err){
  //        console.log("Something has gone wrong!");
  //        console.error(err);
  //    })

  //callback style
  fcm.send(PushMsg, function (err, response) {
    if (err) {
      //console.log('err');
      //console.log(err);
      callbacksendpush(null, err);
    } else {
      //console.log('res');
      //console.log(response);
      callbacksendpush(null, response);
      // console.log("Successfully sent with response: ", response);
    }
  });
}

function randomString() {
  chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  length = 6;
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
