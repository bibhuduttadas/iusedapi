var express = require('express'),
        router = express.Router();
var randomstring = require("randomstring");
ObjectID = require('mongodb').ObjectID;
var async = require('async');
var ErrObj = {
    'unexpected_error': {num: '1003', message: "Unexpected Error"},
    "success": {num: '1004', message: "Success"},
    'field_missing': {num: '1005', message: "Mandatary Fields Missing"},
    'faild': {num: '1006', message: "Mandatary Fields Missing"}
};
//customer signup
exports.sellProduct = function (req, res) {
//console.log('1');
    var User = db.collection('Customers');
    var missingfield = [];
    if (!req.body.Name) {
        missingfield.push("Name");
    }
    if (!req.body.Description) {
        missingfield.push("Description");
    }
    if (!req.body.Price) {
        missingfield.push("Price");
    }

    if (!req.body.Type) {//0: non negotianble, 1: negotiable, 3: donate
        missingfield.push("Type");
    }
    if (!req.body.Qty) {
        missingfield.push("Qty");
    }
    if (!req.body.UserId) {
        missingfield.push("UserId");
    }
    if (!req.body.UsedFor) {
        missingfield.push("UsedFor");
    }
    if (!req.body.CategoryId) {
        missingfield.push("CategoryId");
    }
    if (!req.body.Created_dt) {
        missingfield.push("Created_dt");
    }


//console.log('2');

    if (missingfield.length > 0) {
        res.send({
            "errNum": ErrObj.field_missing.num,
            "errMsg": missingfield + ' ' + ErrObj.field_missing.message,
            "errFlag": '1'
        })
    }
    var productId = '';
//    if (req.body.ProductId !== '') {
//        productId = new ObjectID(req.body.ProductId);
//    }
//    console.log('3');

    updateProduct();
    function updateProduct() {

        var Products = db.collection('Products');
        var Customers = db.collection('Customers');
        if (productId !== '') {

            console.log('4');
            Products.findOne({"_id": productId}, function (err, result) {
                if (!err) {

                    if (result) {
                        updobj = {
                            $set: {
                                "Name": req.body.Name,
                                "Description": req.body.Description,
                                "Price": parseFloat(req.body.Price),
                                "Qty": req.body.Qty,
                                "UsedFor": req.body.UsedFor,
                                "OfferPer": req.body.OfferPer,
                                "OfferMins": req.body.OfferMins,
                                "Links": req.body.Links,
                                "ExchangeOffer": req.body.ExchangeOffer

                            }
                        };
                        Products.update({"_id": productId}, updobj, function (err, Obj) {
                            if (!err) {
                                res.send({
                                    "errNum": ErrObj.success.num,
                                    "errMsg": ErrObj.success.message,
                                    "errFlag": '0',
                                    "ProductId": productId
                                });
                            }
                        });
                    } else {
                    }

                } else {
                    res.send({
                        "errNum": ErrObj.unexpected_error.num,
                        "errMsg": ErrObj.unexpected_error.message,
                        "errFlag": '1112'
                    });
                }
            });
        } else {

            Customers.findOne({"_id": new ObjectID(req.body.UserId)}, function (err, result) {
                if (!err)
                {
                    //AIzaSyArGUW7z9seJgoOSfNkYkm-OFLhnbrFkGg	
                    //get gmt time
                    var GMTTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                    var fullAddress = '';
                    var smallAddress = '';
                    requests('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyArGUW7z9seJgoOSfNkYkm-OFLhnbrFkGg&latlng=' + result.location.latitude + ',' + result.location.longitude + '&sensor=true', function (error, response, body) {
                        if (!error) {
                            var jsonRes = JSON.parse(body);
                            fullAddress = jsonRes.results[0].formatted_address;
                            smallAddress = jsonRes.results[4].formatted_address;
                        }
                    });
                    var newId = new ObjectID();
                    updobj = {
                        '_id': newId,
                        'Status': "0",
                        "Name": req.body.Name,
                        "Description": req.body.Description,
                        "Price": parseFloat(req.body.Price),
                        "Type": req.body.Type,
                        "Qty": req.body.Qty,
                        "UsedFor": req.body.UsedFor,
                        "CategoryId": req.body.CategoryId,
                        "OfferPer": req.body.OfferPer,
                        "OfferMins": req.body.OfferMins,
                        "VideoLinks": req.body.VideoLinks,
                        "ImageLinks": req.body.ImageLinks,
                        "ExchangeOffer": req.body.ExchangeOffer,
                        'PostedBy': req.body.UserId,
                        "PostedOn": req.body.Created_dt,
                        "PostedOnGMT": GMTTime,
                        "location": result.location,
                        'Address': fullAddress,
                        'City': smallAddress,
                        'Condition': req.body.Condition,
                    };
                    Products.insert(updobj, function (err, result) {
                        if (!err) {

                            res.send({
                                "errNum": ErrObj.success.num,
                                "errMsg": ErrObj.success.message,
                                "errFlag": '0',
                                "ProductId": newId
                            });
                        } else {
                            res.send({
                                "errNum": ErrObj.unexpected_error.num,
                                "errMsg": ErrObj.unexpected_error.message,
                                "errFlag": '1112'
                            });
                        }
                    });
                } else {
                    res.send({
                        "errNum": ErrObj.unexpected_error.num,
                        "errMsg": ErrObj.unexpected_error.message,
                        "errFlag": '1112'
                    });
                }
            });
        }

    }
}

//customer details based on phone number
exports.GetProducts = function (req, res) {
    var User = db.collection('Products');
    var PurchaseReqeusts = db.collection('PurchaseReqeusts');

    var skip;
    skip = Number(req.body.Index) * 10;
//        User.find({}, function (err, result) {
    var SortBy = req.body.SortBy; //1:price, 2: distance, 3 : time
    var LowerPriceRange = req.body.LowerPriceRange;
    var UserId = req.body.UserId;
    var CategoryId = req.body.CategoryId;
    var UpperPriceRange = req.body.UpperPriceRange;
    var Qry = {};
    var sortbyQry = {};
    if (SortBy !== '') {
        var BasedOn = req.body.BasedOn;
        if (BasedOn === '' && SortBy !== '2' && SortBy !== '3' && SortBy !== '4') {
            res.send({
                "errNum": ErrObj.field_missing.num,
                "errMsg": 'BsedOn ' + ErrObj.field_missing.message,
                "errFlag": 1
            });
        }
        if (LowerPriceRange === '' && UpperPriceRange === '' && SortBy === '4') {
            res.send({
                "errNum": ErrObj.field_missing.num,
                "errMsg": 'Lower Price Range and Upper Price Range' + ErrObj.field_missing.message,
                "errFlag": 1
            });
        }
        Qry = {'Status': {'$nin': ['2', '3', '1']}, "CategoryId": CategoryId, 'PostedBy': {'$ne': UserId}};
        if (SortBy === '1') { //based on price
            if (BasedOn === '1') { // lowest first
// qry = {};
                sortbyQry = {Price: -1};

            } else if (BasedOn === '2') {//highest first
                sortbyQry = {Price: 1};
            } else if (SortBy === '2') { //distance
            } else if (SortBy === '3') {//time means nearest first
                sortbyQry = {PostedOn: -1};
            } else if (SortBy === '4') {//time means nearest first
                Qry = {'Status': {'$nin': ['2', '3', '1']}, 'PostedBy': {'$ne': UserId}, "CategoryId": CategoryId, '$and': [{Price: {'$lt': parseFloat(UpperPriceRange)}}, {Price: {'$gte': parseFloat(LowerPriceRange)}}]};
            }
        }
    } else {
        Qry = {'Status': {'$nin': ['2', '3', '1']}, "CategoryId": CategoryId, 'PostedBy': {'$ne': UserId}};
    }
    var type1 = [];
    var type2 = [];
    var type3 = [];

    if (SortBy === '2') {
        getUserDetail(UserId, function (err, UserDet) {
            if (UserDet) {

                var qry = {"CategoryId": CategoryId, 'Status': {'$nin': ['2', '3', '1']}, 'PostedBy': {'$ne': UserId}};
                GetProductallDetails(qry, UserDet.location.longitude, UserDet.location.latitude, function (err, GetProductDet) {
                    if (GetProductDet) {
                        var dta = {};
                        if (GetProductDet.Type === '1') {
                            type1.push(dta);
                        }
                        if (GetProductDet.Type === '2') {
                            type2.push(dta);
                        }
                        if (GetProductDet.Type === '3') {

                        }

                        MatchWishList(UserDet.WishList, GetProductDet.Name, function (err, WishLisst) {
                            if (WishLisst) {
                                type3.push(dta);
                                if (!err) {
                                    res.send({
                                        "errFlag": '0',
                                        "errNum": ErrObj.success.num,
                                        "errMsg": ErrObj.success.message,
                                        "Negotiable": type2,
                                        "NonNegotiable": type1,
                                        "WishList": type3
                                    });
                                }
                            } else {
                                if (!err) {
                                    res.send({
                                        "errFlag": '0',
                                        "errNum": ErrObj.success.num,
                                        "errMsg": ErrObj.success.message,
                                        "Negotiable": type2,
                                        "NonNegotiable": type1,
                                        "WishList": type3
                                    });
                                }
                            }
                        });

                    }
                });
            }
        });
    } else {
        getUserDetail(UserId, function (err, UserDet) {
            if (UserDet) {
                User.find(Qry, {}).sort(sortbyQry).skip(skip).limit(10).toArray(function (err, orderlistObj) {
                    if (!err) {
                        if (orderlistObj) {

                            async.each(orderlistObj, function (item, callback) {
                                console.log(item._id);
                                var qry = {"_id": new ObjectID(item._id.toString())};
                                GetProductallDetails(qry, UserDet.location.longitude, UserDet.location.latitude, function (err, GetProductDet) {
                                    if (GetProductDet) {
//                                        console.log(GetProductDet[0]);
                                        var dta = {};
                                        if (GetProductDet[0].Type === '1') {
                                            type1.push(GetProductDet[0]);
                                        }
                                        if (GetProductDet[0].Type === '2') {
                                            type2.push(GetProductDet[0]);
                                        }
                                        if (GetProductDet[0].Type === '3') {

                                        }

                                        MatchWishList(UserDet.WishList, GetProductDet[0].Name, function (err, WishLisst) {
                                            if (WishLisst) {
                                                type3.push(GetProductDet[0]);
                                                callback();
                                            } else {
                                                callback();
                                            }
                                        });
                                    }
                                });


                            }
                            , function (err) {
                                if (!err) {
                                    res.send({
                                        "errFlag": '0',
                                        "errNum": ErrObj.success.num,
                                        "errMsg": ErrObj.success.message,
                                        "NonNegotiable": type1,
                                        "Negotiable": type2,
                                        "WishList": type3
                                    });
                                } else {
                                    res.send({
                                        "errFlag": '1',
                                        "errNum": ErrObj.unexpected_error.num,
                                        "errMsg": ErrObj.unexpected_error.message,
                                    });
                                }
                            });
                        } else {
                            res.send({
                                "errFlag": '1',
                                "errNum": ErrObj.success.num,
                                "errMsg": ErrObj.success.message

                            });
                        }
                    }
                })
            }
        });
    }

}
exports.ProductDetail = function (req, res) {
    var Products = db.collection('Products');
    var ProductViews = db.collection('ProductViews');
    var ProductId = req.body.ProductId;
    var UserId = req.body.UserId;
    var Datetime = req.body.Datetime;
    var GMTTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var updobj = {'ProductId': ProductId, 'UserId': UserId, 'Datetime': Datetime, 'DatetimeGMT': GMTTime};

    Products.findOne({"_id": new ObjectID(ProductId)}, function (err, result) {
        if (!err) {
            if (result) {
                ProductViews.insert(updobj);
                res.send({
                    "errNum": ErrObj.success.num,
                    "errMsg": ErrObj.success.message,
                    "errFlag": '0',
                    "Data": [{'Qty': result.Qty, 'OfferPer': result.OfferPer,
                            'OfferMins': result.OfferMins, 'ExchangeOffer': result.ExchangeOffer, 'PostedOn': result.PostedOn, 'ImageLinks': result.ImageLinks, 'VideoLinks': result.VideoLinks}]
                });
            } else {
                res.send({
                    "errNum": ErrObj.unexpected_error.num,
                    "errMsg": "Product is not available now",
                    "errFlag": '1112'
                });
            }

        } else {
            res.send({
                "errNum": ErrObj.unexpected_error.num,
                "errMsg": ErrObj.unexpected_error.message,
                "errFlag": '1112'
            });
        }
    });
}


exports.RespondToRequest = function (req, res) {
    var RequestId = new ObjectID(req.body.RequestId);
    var Status = new req.body.Status;
    var PurchaseReqeusts = db.collection('PurchaseReqeusts');
    var Products = db.collection('Products');
    PurchaseReqeusts.findOne({"_id": RequestId}, function (err, userObj) {
        if (!err) {
            if (userObj) {
                updobj = {$set: {'Status': Status}};
                PurchaseReqeusts.update({"_id": RequestId}, updobj, function (err, Obj) {
                    if (!err) {
                        if (Status === '1') {
                            updobj = {$set: {'Status': '1'}};
                            Products.update({"_id": new ObjectID(userObj.ProductId)}, updobj, function (err, Obj) {
                                if (!err) {
                                    res.send({
                                        "errNum": ErrObj.success.num,
                                        "errMsg": ErrObj.success.message,
                                        "errFlag": '0'
                                    });
                                }
                            })
                        } else {
                            res.send({
                                "errNum": ErrObj.success.num,
                                "errMsg": ErrObj.success.message,
                                "errFlag": '0'
                            });
                        }


                    }
                })
            } else {
                res.send({
                    "errNum": ErrObj.unexpected_error.num,
                    "errMsg": ErrObj.unexpected_error.message,
                    "errFlag": '1112'
                });
            }
        } else {
            res.send({
                "errNum": ErrObj.unexpected_error.num,
                "errMsg": ErrObj.unexpected_error.message,
                "errFlag": '1112'
            });
        }
    })

}


exports.GetCategories = function (req, res) {
    var Cats = db.collection('Categories');
    Cats.find({}, {}).sort().toArray(function (err, orderlistObj) {
        if (!err) {
            res.send({
                "errNum": ErrObj.success.num,
                "errMsg": ErrObj.success.message,
                "errFlag": '0',
                "Categories": orderlistObj
            });
        } else {
            res.send({
                "errNum": ErrObj.unexpected_error.num,
                "errMsg": ErrObj.unexpected_error.message,
                "errFlag": '1112'
            });
        }
    });
}

//customer details based on phone number
exports.PurchaseRequests = function (req, res) {
    var Products = db.collection('Products');
    var PurchaseReqeusts = db.collection('PurchaseReqeusts');
    var ProductId = req.body.ProductId;
//        User.find({}, function (err, result) {
    var Amount = req.body.Amount;
    var UserId = req.body.UserId;
    var Datetime = req.body.Datetime;
    var OfferTill = req.body.OfferTill;
    var OfferTillGMT = req.body.OfferTillGMT;
    var qty = req.body.Qty;
    var appliedOffer = 0;
    var GMTTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    //check product is sold or not and how many qty sold
    var totaltemSold = 0;
    PurchaseReqeusts.find({'ProductId': ProductId}, {}).sort().toArray(function (err, orderlistObj) {
        if (!err) {
            var data = [];
            async.each(orderlistObj, function (item, callback) {
//                console.log(item);
                if (item) {
                    if (item.Sold === '1') {
                        totaltemSold++;
                    }
                    callback();
                }
            }
            , function (err) {
                if (!err) {
                    Products.findOne({"_id": new ObjectID(ProductId)}, function (err, result) {
                        if (!err)
                        {
                            if (result) {
                                if (result.Qty === totaltemSold) {//check if all qty sold out
                                    res.send({
                                        "errNum": '1008',
                                        "errMsg": 'This product is soldout.',
                                        "errFlag": '1'
                                    });
                                } else {
                                    //check if reqeusted qty is available or not
                                    var availableQty = result.Qty - totaltemSold;
                                    if (availableQty === qty) {
                                        res.send({
                                            "errNum": '1009',
                                            "errMsg": 'Only ' + availableQty + ' quantity is available for this product',
                                            "errFlag": '1'
                                        });
                                    } else {
                                        //else check if i already reqeusted for purchasing this item
                                        PurchaseReqeusts.findOne({"ProductId": ProductId, 'UserId': UserId}, function (err, exists) {
                                            if (!err)
                                            {
                                                if (exists) {
                                                    res.send({
                                                        "errNum": '1007',
                                                        "errMsg": 'You already requested for purchase this product.',
                                                        "errFlag": '1'
                                                    });
                                                } else {
                                                    //else continue with the purchasing process
                                                    if (result.Type === '1') {
                                                        if (Amount === '') {
                                                            res.send({
                                                                "errNum": ErrObj.field_missing.num,
                                                                "errMsg": 'Amount ' + ErrObj.field_missing.message,
                                                                "errFlag": '1'
                                                            });
                                                        }
                                                        if (OfferTill === '') {
                                                            res.send({
                                                                "errNum": ErrObj.field_missing.num,
                                                                "errMsg": 'OfferTill ' + ErrObj.field_missing.message,
                                                                "errFlag": '1'
                                                            });
                                                        }
                                                        var OriginalP = parseFloat(result.Price);
                                                        var PriceShouldbe = OriginalP + (OriginalP * 5 / 100);
                                                        if (PriceShouldbe > parseFloat(Amount)) {
                                                            res.send({
                                                                "errNum": ErrObj.faild.num,
                                                                "errMsg": 'Amount should be 5% more the the existing amount.',
                                                                "errFlag": '1'
                                                            });
                                                        }
                                                    }
                                                    if (result.Type === '2') {
                                                        var timestring1 = result.PostedOnGMT;
                                                        var startdate = moment(timestring1);
                                                        var newTime = moment(startdate).add(result.OfferMins, 'minutes').format('YYYY-MM-DD HH:mm:ss'); // see the cloning?m YYYY-MM-DD HH:mm:ss
                                                        if (newTime >= GMTTime) {
                                                            appliedOffer = 1;
                                                            Amount = parseFloat(result.Price) - ((parseFloat(result.Price) * parseFloat(result.OfferPer) / 100));
                                                        } else {
                                                            Amount = parseFloat(result.Price);
                                                        }

                                                    }
                                                    sendReqeust(result.PostedBy);
                                                }
                                            }
                                        });
                                    }
                                }
//               
                            } else {
                                res.send({
                                    "errNum": ErrObj.unexpected_error.num,
                                    "errMsg": ErrObj.unexpected_error.message,
                                    'test': result,
                                    "errFlag": '1115'
                                });
                            }
                        }
                    });
                } else {
                    res.send({
                        "errNum": ErrObj.unexpected_error.num,
                        "errMsg": ErrObj.unexpected_error.message,
                        "errFlag": '1115'
                    });
                }
            });
        }
    })
    function sendReqeust(owner) {
        var updobj = {'ProductId': ProductId, 'Status': '0', 'ProductOwner': owner, 'Qty': qty, 'Sold': '0', 'OfferTillGMT': OfferTillGMT, 'UserId': UserId, 'Datetime': Datetime, 'DatetimeGMT': GMTTime, 'OfferTill': OfferTill, 'Amount': Amount, 'appliedOffer': appliedOffer};
        PurchaseReqeusts.insert(updobj, function (err, result) {
            if (!err) {
//                var updt = {'NewPrice': Amount, 'NewAmountTillGMT': OfferTillGMT};
//                 var update = {$set: updt};
//                Products.update({"_id": new ObjectID(req.body.ProductId)}, update, function (err, Obj) {
//                    if (!err) {
//
//                    }
//                });
                res.send({
                    "errNum": ErrObj.success.num,
                    "errMsg": ErrObj.success.message,
                    "errFlag": '0'
                });
            } else {
                res.send({
                    "errNum": ErrObj.unexpected_error.num,
                    "errMsg": ErrObj.unexpected_error.message,
                    "errFlag": '1112'
                });
            }
        });
    }
}


exports.GetProductPurchaseRequests = function (req, res) {
    var PurchaseReqeusts = db.collection('PurchaseReqeusts');
    var UserId = req.body.UserId;
    var Datetime = req.body.Datetime;
    var GMTTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    PurchaseReqeusts.find({'$or': [{'ProductOwner': UserId}, {'UserId': UserId}]}, {}).sort().toArray(function (err, PurchaseReqeust) {
        if (!err) {
            var MyRequestsTobuy = [];
            var MyRequestsToSell = [];
            async.each(PurchaseReqeust, function (item, callback) {
                if (item) {
                    var otherUserId = item.UserId;
                    var myProduct = 1;
                    if (UserId === item.UserId) {
                        myProduct = 0;
                        otherUserId = item.ProductOwner;
                    }
                    getUserDetail(otherUserId, function (err, UserDet) {
                        var mainData = {};
                        if (UserDet) {
                            mainData.RequestId = item._id;
                            mainData.UserName = UserDet.Name;
                            mainData.Photo = UserDet.Photo;
                            mainData.UserId = UserDet.UserId;
                            getProductDetail(item.ProductId, function (err, ProDet) {
                                if (ProDet) {
                                    mainData.ProductId = item.ProductId;
                                    mainData.ProductName = ProDet.Name;
                                    mainData.Qty = item.Qty.toString();
                                    mainData.Amount = item.Amount.toString();
                                    mainData.OriginalPrice = ProDet.Price.toString();
                                    mainData.OfferApplied = item.appliedOffer;
                                    mainData.OfferTill = item.OfferTill;

                                    if (item.OfferTill !== '' || item.OfferTill !== null) {
                                        var timestring1 = item.DatetimeGMT;
                                        var startdate = moment(timestring1);
                                        var newTime = moment(startdate).add(item.OfferTill, 'minutes').format('YYYY-MM-DD HH:mm:ss'); // see the cloning?m YYYY-MM-DD HH:mm:ss
                                        if (newTime >= GMTTime) {
                                            updobj = {$set: {'Status': '3'}};
                                            PurchaseReqeusts.update({"_id": new ObjectID(PurchaseReqeust._id.toString())}, updobj, function (err, Obj) {
                                                if (!err) {
                                                    mainData.Status = 'Expired';
                                                    if (myProduct === 1) {
                                                        MyRequestsToSell.push(mainData);
                                                    } else {
                                                        MyRequestsTobuy.push(mainData);
                                                    }
                                                    callback();
                                                }
                                            });
                                        } else {
                                            if (item.Status === '1') {
                                                mainData.Status = 'Accepted';
                                            }
                                            if (item.Status === '2') {
                                                mainData.Status = 'Rejected';
                                            }
                                            if (item.Status === '0') {
                                                mainData.Status = 'Pending';
                                            }

                                            if (myProduct === 1) {
                                                MyRequestsToSell.push(mainData);
                                            } else {
                                                MyRequestsTobuy.push(mainData);
                                            }

                                            callback();
                                        }
                                    } else {
                                        if (item.Status === '1') {
                                            mainData.Status = 'Accepted';
                                        }
                                        if (item.Status === '2') {
                                            mainData.Status = 'Rejected';
                                        }
                                        if (item.Status === '0') {
                                            mainData.Status = 'Pending';
                                        }
                                        if (myProduct === 1) {
                                            MyRequestsToSell.push(mainData);
                                        } else {
                                            MyRequestsTobuy.push(mainData);
                                        }

                                        callback();
                                    }


                                } else {
                                    callback();
                                }
                            });
                        } else {
                            callback();
                        }
                    });
                }
            }
            , function (err) {
                if (!err) {
                    res.send({
                        "errNum": ErrObj.success.num,
                        "errMsg": ErrObj.success.message,
                        "errFlag": '0',
                        "iWantToBuy": MyRequestsTobuy,
                        'iWantToSell': MyRequestsToSell
                    });
                }
            });
        }
    });
}


//if order accept getting orderdata
function getUserDetail(UserId, callback) {
    var customer = db.collection('Customers');
    var _id = new ObjectID(UserId);
    customer.findOne({"_id": _id}, function (err, result1) {
        if (!err) {
            callback(null, result1);
        } else {
            callback(null, null);
        }
    })
}


//if order accept getting orderdata
function getProductDetail(ProductId, callback) {
    var customer = db.collection('Products');
    var _id = new ObjectID(ProductId);
    customer.findOne({"_id": _id}, function (err, result1) {
        if (!err) {
            callback(null, result1);
        } else {
            callback(null, null);
        }
    })
}

//if order accept getting orderdata
function MatchWishList(Wishlist, itemName, callback) {
    //wishlist products
    if (Wishlist) {
        var wishlists = Wishlist.split(",");
        for (var i = 0; i < wishlists.length; i++) {

            var str = itemName;
            var re = new RegExp(wishlists[i], 'gi');
            var res = str.match(re);
            if (res) {
                callback(null, res);
            } else {
                str = wishlists[i];
                re = new RegExp(itemName, 'gi');
                res = str.match(re);
                if (res) {
                    callback(null, res);
                } else {
                    callback(null, null);
                }
            }

            //Do something
        }
    } else {
        callback();
    }
}

//if order accept getting orderdata
function getProductDetailWithDistance(ProductId, long, lat, callback) {
    var customer = db.collection('Products');
    var _id = new ObjectID(ProductId);
//    console.log(_id);
    var dta = {};
    db.command({
        geoNear: "Products",
        near: [parseFloat(long), parseFloat(lat)],
        maxDistance: 1000000,
        'query': {'_id': _id}},
            function (err, result) {
                async.each(result.results, function (item, callback1) {
                    dta.UsedFor = item.obj.UsedFor;
                    dta.ProductName = item.obj.Name;
                    dta.Distance = item.dis.toString();
                    dta.Image = 'http://52.41.70.254/pics/user.jpg';
                    dta.Price = item.obj.Price.toString();
                    dta.Favorite = '0';
                    dta.Description = item.obj.Description;
                    dta.Type = item.obj.Type;
                    dta.ProductId = item.obj._id;
                    callback1();
                }, function (err) {
                    if (!err) {
                        callback(null, dta);
                    } else {
                        callback(null, null);
                    }
                });
            });
}



function GetProductallDetails(Qry, Lat, Long, callbackMain) {
    var PurchaseReqeusts = db.collection('PurchaseReqeusts');

    var FullArray = [];
    db.command({
        geoNear: "Products",
        near: [parseFloat(Lat), parseFloat(Long)],
        maxDistance: 1000000,
        "query": Qry
    },
            function (err, result) {
                if (!err) {
                    async.each(result.results, function (item, callback) {
                        console.log('5');
                        var dta = {};
                        dta = item.obj;
                        dta.Price = dta.Price.toString();
                        dta.Distance = item.dis.toString();
                        dta.Image = 'http://52.41.70.254/pics/user.jpg';
                        dta.Favorite = '0';
                        getUserDetail(dta.PostedBy, function (err, UserDet) {
                            if (UserDet) {

                                console.log('6');
                                dta.SellarName = UserDet.Name;
                                if (dta.Type === '1') {
                                    var timestring1 = dta.PostedOnGMT;
                                    var startdate = moment(timestring1);
                                    var newTime = moment(startdate).add(item.obj.OfferMins, 'minutes').format('YYYY-MM-DD HH:mm:ss'); // see the cloning?m YYYY-MM-DD HH:mm:ss
                                    if (newTime >= GMTTime) {
                                        dta.OfferedPrice = (parseFloat(dta.Price) - ((parseFloat(dta.Price) * parseFloat(dta.OfferPer) / 100))).toString();
                                    } else {
                                        dta.OfferedPrice = parseFloat(dta.Price).toString();
                                    }
                                    FullArray.push(dta);
                                    callback();
                                }

                                if (dta.Type === '2') {
                                    PurchaseReqeusts.findOne({$query: {"ProductId": dta._id.toString(), "Status": {'$ne': "2"}}, $orderby: {Datetime: -1}}, function (err, maxBid) {
                                        if (err) {
                                            FullArray.push(dta);
                                            console.log('4');
                                        }
                                        if (maxBid) {
                                            dta.OfferedPrice = maxBid.Amount;
                                            getUserDetail(maxBid.UserId, function (err, OfferedUser) {
                                                if (OfferedUser) {
                                                    dta.OfferedBy = OfferedUser.Name;
                                                }
                                                FullArray.push(dta);
                                                console.log('1');
                                            });
                                        } else {
                                            console.log('3');
                                            FullArray.push(dta);

                                        }
                                        callback();
                                    });

                                }
                                if (dta.Type === '3') {
                                    FullArray.push(dta);
                                    callback();
                                }


                            } else {
                                callback();
                            }
                        });
                    }, function (err) {
                        if (err) {
                            callbackMain(null, null);

                        }
                        callbackMain(null, FullArray);
                    });
                } else {
                    callbackMain(null, null);
                }
            });

}