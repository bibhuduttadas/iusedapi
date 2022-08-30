
var express = require('express'),
        router = express.Router(),
//  manager = require('./manager'),
        customer = require('./customer'),
//        product1 = require('./product1'),
        product = require('./product');
//  orders = require('./orders'),
//  card = require('./card'),
//  driver = require('./driver');

//managae apis

//manager login
//router.post('/managerlogin', manager.login);

//manager logout
//router.post('/managerlogout', manager.logout);




//customer app apis

//customer login
router.post('/customerSignup', customer.Signup);
router.post('/Guest', customer.Guest);

router.post('/GetCategories', product.GetCategories);
router.post('/Terms', customer.Terms);
router.post('/customerdetails', customer.customerdetails);
router.post('/SendCodeAgain', customer.SendCodeAgain);



router.post('/Logout', customer.Logout);
router.post('/testpush', product.testpush);


//phone number verification
router.post('/phoneNumberverify', customer.phoneNumberverify);

//verification code for customer
router.post('/verificationcode', customer.verificationcode);

//customer profile update
router.post('/updatecustomerprofile', customer.updatecustomerprofile);
router.post('/UpdateLocation', customer.UpdateLocation);
router.post('/UpdateWishList', product.UpdateWishList);



//market apis
router.post('/sellProduct', product.sellProduct);
router.post('/GetProducts', product.GetProducts2);
router.post('/GetProducts1', product.GetProducts1);

router.post('/GetAllProducts', product.GetAllProducts);
router.post('/GetItemConditions', product.GetItemConditions);

router.post('/PurchaseRequests', product.PurchaseRequests);
router.post('/GetProductPurchaseRequests', product.GetProductPurchaseRequests);
router.post('/ProductDetail', product.ProductDetail);
router.post('/RespondToRequest', product.RespondToRequest);
router.post('/GetDonations', product.GetDonations);
router.post('/CheckCount', product.CheckCount);
router.post('/GenerateCode', product.GenerateCode);
router.post('/GetNotifications', product.GetNotifications);


//admin routes

router.get('/allcustomers',customer.getAllCustomers)
router.post('/changestatus/user/:userId',customer.blockCustomer)
router.get('/allproducts',customer.getAllProducts)
router.post('/changestatus/product/:productId',customer.blockProduct)


//market apis
//router.post('/sellProduct1', product1.sellProduct);
//router.post('/GetProducts1', product1.GetProducts);
//router.post('/PurchaseRequests1', product1.PurchaseRequests);
//router.post('/GetProductPurchaseRequests1', product1.GetProductPurchaseRequests);
//router.post('/ProductDetail1', product1.ProductDetail);
//router.post('/RespondToRequest1', product1.RespondToRequest);




module.exports = router;

