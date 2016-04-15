<?php

class EventIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getEvents($args) {
    if (isset($args["eventId"])) {
      $eventID = intval($args["eventId"]);

      return $this->getEventById($args, $eventID);
    }

    if (isset($args["latitude"]) && isset($args["longitude"])) {
      $latitude = $args["latitude"];
      $longitude = $args["longitude"];

      return $this->getEventsSortedByDistance($args, $latitude, $longitude);
    }

    return $this->io-badRequest("Either event id or latitude and longitude must be set", $args);
  }

  private function getEventById($args, $eventID) {
    $query = "SELECT event.event_id, event.event_name, event.event_latitude, event.event_longitude, event.event_timestamp, event.event_archived, info.number_of_posts, info.most_recent_post FROM event LEFT JOIN (SELECT event_id, COUNT(*) AS number_of_posts, MAX(post_timestamp) as most_recent_post FROM post GROUP BY event_id) AS info ON info.event_id = event.event_id WHERE event.event_id = :event";
    $bindings = [];
    $bindings[":event"] = $eventID;

    return $this->io->queryDB($args, $query, $bindings);
  }

  private function getEventsSortedByDistance($args, $latitude, $longitude) {
    $searchTerm = "";
    if (isset($args["searchTerm"])) {
      $searchTerm = $args["searchTerm"];
    }
    /*Formula for calculating distance between two lat lngs, originally in JavaScript
      var R = 6371; // Radius of the earth in km
      var dLat = degreesToRadains(lat2 - lat1); // degreesToRadains below
      var dLon = degreesToRadains(lon2 - lon1);
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadains(lat1)) * Math.cos(degreesToRadains(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c; // Distance in km
    */
    $query = "SELECT event.event_id, event.event_name, event.event_latitude, event.event_longitude, event.event_timestamp, event.event_archived, info.number_of_posts, info.most_recent_post, " .
    "(" .
    "6371 * 2 * ATAN2(" .
    "SQRT(" .
    //a
    "SIN(RADIANS(event.event_latitude - :latitude) / 2) * " .
    "SIN(RADIANS(event.event_latitude - :latitude) / 2) + " .
    "COS(RADIANS(event.event_latitude)) * COS(RADIANS(:latitude)) * " .
    "SIN(RADIANS(event.event_longitude - :longitude) / 2) * " .
    "SIN(RADIANS(event.event_longitude - :longitude) / 2)" .
    "), " .
    "SQRT(1 - " .
    //a
    "SIN(RADIANS(event.event_latitude - :latitude) / 2) * " .
    "SIN(RADIANS(event.event_latitude - :latitude) / 2) + " .
    "COS(RADIANS(event.event_latitude)) * COS(RADIANS(:latitude)) * " .
    "SIN(RADIANS(event.event_longitude - :longitude) / 2) * " .
    "SIN(RADIANS(event.event_longitude - :longitude) / 2)" .
    "))".
    ") as distance_from_user " .
    "FROM event " .
    "LEFT JOIN (".
    "select event_id, COUNT(*) AS number_of_posts, MAX(post_timestamp) as most_recent_post FROM post GROUP BY event_id) AS info ON info.event_id = event.event_id " .
    "WHERE event.event_name LIKE :search " .
    "ORDER BY distance_from_user, info.most_recent_post, info.number_of_posts";

    $bindings = [];
    $bindings[":latitude"] = $latitude;
    $bindings[":longitude"] = $longitude;
    $bindings[":search"] = "%" . $searchTerm . "%";

    return $this->io->queryDB($args, $query, $bindings);
  }

  public function createEvent($args) {
    if (!isset($args["eventName"])) {
      return $this->io->badRequest("Event name was missing", $args);
    }
    if (!isset($args["latitude"])) {
      return $this->io->badRequest("Latitude was missing", $args);
    }
    if (!isset($args["longitude"])) {
      return $this->io->badRequest("Longitude was missing", $args);
    }

    $query = "insert into event (event_name, event_latitude, event_longitude, event_timestamp) values (:event, :latitude, :longitude, UTC_TIMESTAMP);";
    $bindings = [];
    $bindings[":event"] = $args["eventName"];
    $bindings[":latitude"] = $args["latitude"];
    $bindings[":longitude"] = $args["longitude"];

    $results = $this->io->queryDB($args, $query, $bindings);

    if ($results["data"] > 0) {
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Event was created";
    }

    return $results;
  }

}
