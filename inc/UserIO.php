<?php

class UserIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  function createUser($args) {
    $io = new IO();

    $facebookId = 0;
    $googleId = 0;
    $twitterId = 0;

    if (!isset($args["displayName"])) {
      return $io->badRequest("Display was missing", $args);
    }
    if (!isset($args["icon"])) {
      return $io->badRequest("Icon was missing", $args);
    }
    if (isset($args["googleId"])) {
      $googleId = $args["googleId"];
    }
    if (isset($args["twitterId"])) {
      $twitterId = $args["twitterId"];
    }

    $token = md5($args["displayName"] . time());

    $query = "INSERT INTO user (user_display_name, user_icon, user_google_id, user_twitter_id, user_access_token) VALUES (:name, :icon, :google, :twitter, :token)";

    $bindings = [];
    $bindings[":name"] = $args["displayName"];
    $bindings[":icon"] = $args["icon"];
    $bindings[":google"] = $googleId;
    $bindings[":twitter"] = $twitterId;
    $bindings[":token"] = $token;

    $results = $this->io->queryDB($args, $query, $bindings);

    if ($results["data"] > 0) {
     $results["meta"]["status"] = 201;
     $results["meta"]["message"] = "User was created";
    }

    $results["data"] = $token;

    return $results;
  }

  public function accessTokenValid($token) {
    if (!isset($token)) {
      return $this->io->badRequest("Access token missing");
    }

    $query = "SELECT user_id FROM user where user_access_token = :token";
    $bindings[":token"] = $token;

    $results = $this->io->queryDB([], $query, $bindings);

    return count($results["data"]) == 1;
  }

  public function getUserIdForAccessToken($token) {
    if (!isset($token)) {
      return $this->io->badRequest("Access token missing");
    }

    $query = "SELECT user_id FROM user where user_access_token = :token";
    $bindings[":token"] = $token;

    $results = $this->io->queryDB([], $query, $bindings);

    return $results["data"][0]["user_id"];
  }
}
