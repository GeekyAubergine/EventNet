<?php

class Network {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getNetworks($args) {
    if (isset($args["networkId"])) {
      $networkId = intval($args["networkId"]);

      return $this->getNetworkById($networkId);
    }

    if (isset($args["latitude"]) && isset($args["longitude"])) {
      $latitude = $args["latitude"];
      $longitude = $args["longitude"];

      return $this->getNetworksSortedByDistance($args, $latitude, $longitude);
    }

    return $this->io-badRequest("Not valid network request", $args);
  }

  private function getNetworkById($args, $networkId) {
    $clause = "WHERE network.network_id = " . abs(intval($args["networkId"]));

    $query = "select network.network_id, network.network_name, network.network_latitude, network.network_longitude, network.network_timestamp, info.number_of_posts, info.most_recent_post " .
    "FROM network " .
    "LEFT JOIN (".
    "select network_id, COUNT(*) AS number_of_posts, MAX(post_timestamp) as most_recent_post FROM post GROUP BY network_id) AS info ON info.network_id = network.network_id " .
    "WHERE network.network_id = " . $networkId;

    return $this->io->queryDB($args, $query);
  }

  private function getNetworksSortedByDistance($args, $latitude, $longitude) {
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
    $query = "select network.network_id, network.network_name, network.network_latitude, network.network_longitude, network.network_timestamp, info.number_of_posts, info.most_recent_post, " .
    "(" .
    "6371 * 2 * ATAN2(" .
    "SQRT(" .
    //a
    "SIN(RADIANS(network.network_latitude - " . $latitude . ") / 2) * " .
    "SIN(RADIANS(network.network_latitude - " . $latitude . ") / 2) + " .
    "COS(RADIANS(network.network_latitude)) * COS(RADIANS(" . $latitude . ")) * " .
    "SIN(RADIANS(network.network_longitude - " . $longitude . ") / 2) * " .
    "SIN(RADIANS(network.network_longitude - " . $longitude . ") / 2)" .
    "), " .
    "SQRT(1 - " .
    //a
    "SIN(RADIANS(network.network_latitude - " . $latitude . ") / 2) * " .
    "SIN(RADIANS(network.network_latitude - " . $latitude . ") / 2) + " .
    "COS(RADIANS(network.network_latitude)) * COS(RADIANS(" . $latitude . ")) * " .
    "SIN(RADIANS(network.network_longitude - " . $longitude . ") / 2) * " .
    "SIN(RADIANS(network.network_longitude - " . $longitude . ") / 2)" .
    "))".
    ") as distance_from_user " .
    "FROM network " .
    "LEFT JOIN (".
    "select network_id, COUNT(*) AS number_of_posts, MAX(post_timestamp) as most_recent_post FROM post GROUP BY network_id) AS info ON info.network_id = network.network_id " .
    "ORDER BY distance_from_user, info.most_recent_post, info.number_of_posts";

    return $this->io->queryDB($args, $query);
  }

  public function createNetwork($args) {
    if (!isset($args["networkName"])) {
      return $io->badRequest("Network name was missing", $args);
    }
    if (!isset($args["latitude"])) {
      return $io->badRequest("Latitude was missing", $args);
    }
    if (!isset($args["longitude"])) {
      return $io->badRequest("Longitude was missing", $args);
    }

    $query = "insert into network (network_name, network_latitude, network_longitude, network_timestamp) values (\"". $args["networkName"] . "\"," . $args["latitude"] . "," . $args["longitude"] . ", now());";

    $results = $this->io->queryDB($args, $query);

    if ($results["data"] > 0) {
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Network was created";
    }

    return $results;
  }

}
