<?php

$con = new Mongo();
$mongoDB = $con->selectDB('market');
//days array
$dowMap = array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');

$DateTime = gmdate('Y-m-d H:i:s');

$PR = $mongoDB->selectCollection('PurchaseReqeusts');
$Products = $mongoDB->selectCollection('Products');
$getAllProd = $Products->find(array('Status' => '0', 'Type' => '2'));
//die();
foreach ($getAllProd as $allPro) {

    try {
        $PRs = $PR->find(array('ProductId' => (string) $allPro['_id'], 'Status' => '0'))->sort(array('Datetime' => -1));
        $i = 0;
        $firstReq = array();
        foreach ($PRs as $prss) {

            if ($prss['OfferTillGMT'] < $DateTime) {
                $PR->update(
                        array('_id' => $prss['_id']), array(
                    '$set' => array('Status' => '2'),
                        ), array("upsert" => true)
                );
                $firstReq = $prss;
//                echo 'here';
//                break;
            } else {
//                echo $prss['OfferTillGMT'] . '---' . $DateTime;
//                echo 'here1';
//                break;
            }
        }
//        if (count($firstReq) > 0) {
//
//            $PRs = $PR->find(array('ProductId' => (string) $allPro['_id'], 'Status' => '0'))->sort(array('Datetime' => -1));
//            $firstReq = array();
//            foreach ($PRs as $prss) {
//                $firstReq = $prss;
//                break;
//            }
//            if (count($firstReq) > 0) {
//                $offerTill = $firstReq['OfferTill'];
//                $newOfferTillGMT = date('Y-m-d H:i:s', strtotime($DateTime . ' + ' . $offerTill . ' minutes'));
//                $PR->update(
//                        array('_id' => $firstReq['_id']), array(
//                    '$set' => array('OfferTillGMT' => $newOfferTillGMT),
//                        ), array("upsert" => true)
//                );
//            }
//        }
    } catch (Exception $ex) {
        
    }
}

