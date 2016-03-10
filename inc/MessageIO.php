<?php

class MessageIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getMessages($args) {
    if (!isset($args["eventId"])) {
      return $this->io->badRequest("Event ID was missing", $args);
    }
    $query = "select * from message join user using(user_id) " .
    "WHERE event_id = :event ORDER BY message_timestamp desc";
    $bindings = [];
    $bindings[":event"] = $args["eventId"];

    return $this->io->queryDB($args, $query, $bindings);
  }

  public function createMessage($args) {
    if (!isset($args["eventId"])) {
      return $this->io->badRequest("Network ID was missing", $args);
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
    $query = "INSERT INTO message (user_id, event_id, message_content, message_latitude, message_longitude, message_timestamp) VALUE (:user, :event, :message, :latitude, :longitude, NOW());";

    $bindings = [];
    $bindings[":user"] = $this->io->getUserId($args);
    $bindings[":event"] = $args["eventId"];
    $bindings[":message"] = $args["messageContent"];
    $bindings[":latitude"] = $args["latitude"];
    $bindings[":longitude"] = $args["longitude"];

    $results = $this->io->queryDB($args, $query, $bindings);

    if ($results["data"] > 0) {
     $results["meta"]["status"] = 201;
     $results["meta"]["message"] = "Message was created";
    }
    return $results;
  }

}
