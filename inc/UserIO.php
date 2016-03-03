<?php

class UserIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getUser($args) {
    if (isset($args["renewToken"])) {
    } else {
      $valid = $this->accessTokenValid($args["accessToken"]);
      $results = [];
      $results["data"] = count($results["data"]) == 1;
      return $results;
    }
  }

  public function accessTokenValid($token) {
    if (!isset($token)) {
      return $this->io->badRequest("Access token missing");
    }

    $query = "SELECT user_id FROM user where user_access_token = :token";
    $bindings[":token"] = $token;

    $results = $this->io->queryDB([], $query, $bindings);

    return count($results) == 1;
  }

  public function getUserIdForAccessToken($token) {
    if (!isset($token)) {
      return $this->io->badRequest("Access token missing");
    }

    if (!$this->accessTokenValid($token)) {
      return 0;
    }

    $query = "SELECT user_id FROM user where user_access_token = :token";
    $bindings[":token"] = $token;

    $results = $this->io->queryDB([], $query, $bindings);

    return $results["data"][0]["user_id"];
  }

  function createUser($args) {
    $io = new IO();

    $facebookId = 0;
    $googleId = 0;
    $twitterId = 0;

    if (!isset($args["displayName"])) {
      return $io->badRequest("Display was missing", $args);
    } else {
      $displayName = $args["displayName"];
    }
    if (!isset($args["icon"])) {
      return $io->badRequest("Icon was missing", $args);
    } else {
      $icon = $args["icon"];
    }
    if (isset($args["googleId"])) {
      $googleId = $args["googleId"];
    }
    if (isset($args["twitterId"])) {
      $twitterId = $args["twitterId"];
    }

    $query = "SELECT user_access_token FROM user WHERE user_google_id = :google OR user_twitter_id = :twitter";
    $bindings = [];
    $bindings[":google"] = $googleId;
    $bindings[":twitter"] = $twitterId;

    $results = $this->io->queryDB($args, $query, $bindings);
    if (count($results["data"]) == 1) {
      $results["data"] = $results["data"][0]["user_access_token"];
      return $results;
    }

    return $this->addUserToDatabase($displayName, $icon, $googleId, $twitterId);
  }

  private function addUserToDatabase($displayName, $icon,  $googleId, $twitterId) {
    $query = "INSERT INTO user (user_display_name, user_icon, user_google_id, user_twitter_id, user_access_token) VALUES (:name, :icon, :google, :twitter, :token)";

    $token = $this->generateToken($displayName);

    $bindings = [];
    $bindings[":name"] = $displayName;
    $bindings[":icon"] = $icon;
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

  private function generateToken($userName) {
    return md5($args["displayName"]) . md5(time());
  }

}
