<?php

class MessageIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getMessages($args) {
        if (!isset($args["eventId"])) {
      return $this->io->badRequest("Network ID was missing", $args);
    }
    $query = "select * from message join user using(user_id) " .
    "WHERE event_id = " . $args["eventId"] .
    " ORDER BY message_timestamp desc";
    return $this->io->queryDB($args, $query);
  }

  public function createMessage($args) {
    if (!isset($args["eventId"])) {
      return $this->io->badRequest("Network ID was missing", $args);
    }
    if (!isset($args["userId"])) {
      return $this->io->badRequest("User ID was missing", $args);
    }
    if (!isset($args["messageContent"])) {
      return $this->io->badRequest("Message content was missing", $args);
    }
    if (!isset($args["latitude"])) {
      return $this->io->badRequest("Latitude was missing", $args);
    }
    if (!isset($args["longitude"])) {
      return $this->io->badRequest("Longitude was missing", $args);
    }
    $query = "insert into message (user_id, event_id, message_content, message_latitude, message_longitude, message_timestamp) values " .
     "('". $args["userId"] . "','" . $args["eventId"] . "','" . $args["messageContent"] . "','" . $args["latitude"] . "','" . $args["longitude"] . "', NOW());";

     $results = $this->io->queryDB($args, $query);

     if ($results["data"] > 0) {
       $results["meta"]["status"] = 201;
       $results["meta"]["message"] = "Message was created";
     }
     return $results;
  }

}
