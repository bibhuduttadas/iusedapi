<?php

$con = new Mongo();
$mongoDB = $con->selectDB('market');
//days array
$dowMap = array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
$url = 'https://fcm.googleapis.com/fcm/send';
$DateTime = gmdate('Y-m-d H:i:s');

$PR = $mongoDB->selectCollection('PurchaseReqeusts');
$Products = $mongoDB->selectCollection('Products');
$cust = $mongoDB->selectCollection('Customers');
$Terms = $mongoDB->selectCollection('Terms');
$TermsDet = $Terms->findOne(array('_id' => new MongoId('57fe8e8731b401f4b6de73a1')));
$expHours = (int) $TermsDet * 24;
$getAllProd = $Products->find(array('Status' => '0'));

foreach ($getAllProd as $allPro) {
    $PRs = $PR->count(array('ProductId' => (string) $allPro['_id']));
    $custDet = $cust->findOne(array('_id' => new MongoId($allPro['PostedBy'])));
    if ($PRs == 0) {
        $hourdiff = round((strtotime($DateTime) - strtotime($allPro['PostedOnGMT'])) / 3600, 1);

//if notified and more then 7 days without any offer then unpublished item.
        if ($allPro['Notified'] == '1') {
            if ($hourdiff > $expHours) {
//                sendGCM('');
                $Products->update(
                        array('_id' => $allPro['_id']), array(
                    '$set' => array('Status' => '6'),
                        ), array("upsert" => true)
                );
                try {
                    $fields = array(
                        'registration_ids' => array(
                            $custDet['DeviceToken']
                        ),
                        'data' => array(
                            "message" => 'testing'
                        ),
                        'collapse_key' => 'your_collapse_key',
                        'priority' => 'high',
                        'notification' => array(
                            'title' => 'iUsed',
                            'body' => 'Since there are no offers from the buyers for the last one week. We unpublish the item. You can post back it with different price.',
                            'sound' => "default"
                        )
                    );
                    $fields = json_encode($fields);

                    $headers = array(
                        'Authorization: key=' . "AIzaSyCnZ1OL0HcrkZZPnyKh5dobnUQSTAF3cRY",
                        'Content-Type: application/json'
                    );

                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $url);
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);

                    $result = curl_exec($ch);
//    echo $result;
                    curl_close($ch);
                } catch (Exception $ex) {
                    
                }
            }
        } else {
//check if no offers more then 2 days then notify the user.
            if ($hourdiff > 48) {
//                sendGCM("Just to notify that, there are many users watching your posting but not making any offers. You may think about reducing the price and related. It's a friendly reminder though.", 'c2EfiEAEjns:APA91bF69-Xf7lcfbcnKP9Acr4SYX2ySPaeQFxWEuCDYV56ZD2ULzxF74wmg_jCVFaH66D-ZNwzBV9sNSuO0NmeyMyHXpCwRtmS-mNL9EGd1NruDDwyMfLtjdViXBg1GSjICDAXgwan6');
                $Products->update(
                        array('_id' => $allPro['_id']), array(
                    '$set' => array('Notified' => '1'),
                        ), array("upsert" => true)
                );
                try {
                    $fields = array(
                        'registration_ids' => array(
                            $custDet['DeviceToken']
                        ),
                        'data' => array(
                            "message" => 'testing'
                        ),
                        'collapse_key' => 'your_collapse_key',
                        'priority' => 'high',
                        'notification' => array(
                            'title' => 'iUsed',
                            'body' => "Just to notify that, there are many users watching your posting but not making any offers. You may think about reducing the price and related. It's a friendly reminder though.",
                            'sound' => "default"
                        )
                    );
                    $fields = json_encode($fields);

                    $headers = array(
                        'Authorization: key = ' . "AIzaSyCnZ1OL0HcrkZZPnyKh5dobnUQSTAF3cRY",
                        'Content-Type: application/json'
                    );

                    $ch = curl_init();
                    curl_setopt($ch, CURLOPT_URL, $url);
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);

                    $result = curl_exec($ch);
//    echo $result;
                    curl_close($ch);
                } catch (Exception $ex) {
                    
                }
            }
        }
    }
}

//sendGCM("Just to notify that, there are many users watching your posting but not making any offers. You may think about reducing the price and related. It's a friendly reminder though.", 'c2EfiEAEjns:APA91bF69-Xf7lcfbcnKP9Acr4SYX2ySPaeQFxWEuCDYV56ZD2ULzxF74wmg_jCVFaH66D-ZNwzBV9sNSuO0NmeyMyHXpCwRtmS-mNL9EGd1NruDDwyMfLtjdViXBg1GSjICDAXgwan6');
//echo 'sent';

function sendGCM($message, $id) {




    $fields = array(
        'registration_ids' => array(
            $id
        ),
        'data' => array(
            "message" => $message
        )
    );
}
