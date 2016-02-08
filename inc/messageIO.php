<?php

class MessageIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getMessages($args) {
        if (!isset($args["networkId"])) {
      return badRequest("Network ID was missing", $args);
    }
    $query = "select * from message join user using(user_id) " .
    "WHERE network_id = " . $args["networkId"] .
    " ORDER BY message_timestamp desc";
    return $this->io->queryDB($args, $query);
  }

  public function createMessage($args) {
    if (!isset($args["networkId"])) {
      return badRequest("Network ID was missing", $args);
    }
    if (!isset($args["userId"])) {
      return badRequest("User ID was missing", $args);
    }
    if (!isset($args["messageContent"])) {
      return badRequest("Message content was missing", $args);
    }
    if (!isset($args["latitude"])) {
      return badRequest("Latitude was missing", $args);
    }
    if (!isset($args["longitude"])) {
      return badRequest("Longitude was missing", $args);
    }
    $query = "insert into message (user_id, network_id, message_content, message_latitude, message_longitude, message_timestamp) values " .
     "('". $args["userId"] . "','" . $args["networkId"] . "','" . $args["messageContent"] . "','" . $args["latitude"] . "','" . $args["longitude"] . "', NOW());";

     $results = $this->io->queryDB($args, $query);

     if ($results["data"] > 0) {
       $results["meta"]["status"] = 201;
       $results["meta"]["message"] = "Message was created";
     }
     return $results;
  }

}
