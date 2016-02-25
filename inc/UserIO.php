<?php

class UserIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getUsers($args) {
    $clause = "";

    if (isset($args["facebookId"])) {
      $clause = "where user_facebook_id = '" . $args["facebookId"] . "'";
    }
    else if (isset($args["googleId"])) {
      $clause = "where user_google_id = '" . $args["googleId"] . "'";
    }
    else if (isset($args["twitterId"])) {
      $clause = "where user_twitter_id = '" . $args["twitterId"] . "'";
    }
    else if (isset($args["userId"])) {
      $clause = "where user_id = " . $args["userId"];
    }

    $query = "select * from user ".
    $clause . " ";

    return $this->io->queryDB($args, $query);
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
    if (isset($args["facebookId"])) {
      $facebookId = $args["facebookId"];
    }
    if (isset($args["googleId"])) {
      $googleId = $args["googleId"];
    }
    if (isset($args["twitterId"])) {
      $twitterId = $args["twitterId"];
    }

    $query = "insert into user (user_display_name, user_icon, user_facebook_id, user_google_id, user_twitter_id) values " .
     "('". $args["displayName"] . "','" . $args["icon"] . "','" . $facebookId . "','" . $googleId . "','" . $twitterId . "');";

     $results = $io->queryDB($args, $query);

     if ($results["data"] > 0) {
       $results["meta"]["status"] = 201;
       $results["meta"]["message"] = "User was created";
     }

     return $results;
  }
}
