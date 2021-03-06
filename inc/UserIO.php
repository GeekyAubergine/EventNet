<?php

/*
  Class controlling all user functionality
*/
class UserIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
    //Set timezone
    date_default_timezone_set('UTC');
  }

  //Used by primary router, calls approriate function
  public function getUser($args) {
    if (isset($args["searchTerm"])) {
      return $this->getUsernamesForSearchTerm($args);
    }
    if (isset($args["renewToken"])) {
      return $this->renewToken($args);
    }
    if (isset($args["accessToken"])){
      $valid = $this->accessTokenValid($args["accessToken"]);
      $results = [];
      $results["data"] = $valid;
      return $results;
    }

    return $this->io->badRequest("Either the renew token, search term or the access token must be set", $args);
  }

  //Returns the public ids for users who's names matches the given search term
  private function getUsernamesForSearchTerm($args) {
    $query = "SELECT user_public_id as id, user_display_name, user_icon FROM user WHERE user_display_name LIKE :search AND user_id != 1";
    $bindings = [];
    $bindings[":search"] = "%" . $args["searchTerm"] . "%";
    return $this->io->queryDB($args, $query, $bindings);
  }

  //Returns if the access token if valid
  public function accessTokenValid($accessToken) {
    if (!isset($accessToken)) {
      return $this->io->badRequest("Access token missing", []);
    }

    $query = "SELECT user_id FROM user WHERE user_access_token = :token AND user_access_token_expire > UTC_TIMESTAMP";
    $bindings[":token"] = $accessToken;

    $results = $this->io->queryDB([], $query, $bindings);

    return count($results["data"]) == 1;
  }

  //Returns the user id for a given access token
  public function getUserIdForAccessToken($accessToken) {
    if (!isset($accessToken)) {
      return $this->io->badRequest("Access token missing", []);
    }

    if (!$this->accessTokenValid($accessToken)) {
      return 0;
    }

    $query = "SELECT user_id FROM user where user_access_token = :token AND user_access_token_expire > UTC_TIMESTAMP";
    $bindings[":token"] = $accessToken;

    $results = $this->io->queryDB([], $query, $bindings);

    return $results["data"][0]["user_id"];
  }

  //Returns the access token and renewal date for the access token.
  public function renewToken($args) {
    $data = [];
    $bindings = [];
    $bindings[":renew"] = $args["renewToken"];

    //Get refresh time
    $query = "SELECT user_display_name, user_access_token, user_access_token_expire FROM user WHERE user_renew_token = :renew";

    $results = $this->io->queryDB([], $query, $bindings);

    $refresh =  $results["data"][0]["user_access_token_expire"];
    $displayName =  $results["data"][0]["user_display_name"];

    //Determine if refresh needs to occur
    $expire = strtotime($refresh);
    $margin = 60; //One minute margin
    if ($expire >= time() + $margin) {
      $data["accessToken"] = $results["data"][0]["user_access_token"];
      $data["tokenExpire"] = $results["data"][0]["user_access_token_expire"];

      $results["data"] = $data;

      return $results;
    }

    $accessToken = $this->generateAccessToken($displayName);
    $refreshTime = $this->getNextRefreshDate();

    $query = "UPDATE user SET user_access_token = :token, user_access_token_expire = :expire WHERE user_renew_token = :renew";
    $bindings[":token"] = $accessToken;
    $bindings[":expire"] = $refreshTime;

    $results = $this->io->queryDB($args, $query, $bindings);

    $data["accessToken"] = $accessToken;
    $data["tokenExpire"] = $refreshTime;

    $results["data"] = $data;

    return $results;
  }

  //Creates a user
  public function createUser($args) {
    $io = new IO();

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

    $query = "SELECT user_access_token, user_renew_token, user_access_token_expire FROM user WHERE user_google_id = :google OR user_twitter_id = :twitter";
    $bindings = [];
    $bindings[":google"] = $googleId;
    $bindings[":twitter"] = $twitterId;

    $results = $this->io->queryDB($args, $query, $bindings);

    if (count($results["data"]) == 1) {
      $data = [];
      $data["accessToken"] = $results["data"][0]["user_access_token"];
      $data["renewToken"] = $results["data"][0]["user_renew_token"];
      $data["tokenExpire"] = $results["data"][0]["user_access_token_expire"];

      $results["data"] = $data;

      return $results;
    }

    if (isset($args["googleId"])) {
      return $this->addUserToDatabaseForGoogleId($displayName, $icon, $googleId);
    }
    if (isset($args["twitterId"])) {
      return $this->addUserToDatabaseForTwitterId($displayName, $icon, $twitterId);
    }
  }

  //Creates a user for the given google id
  private function addUserToDatabaseForGoogleId($displayName, $icon,  $googleId) {
    $query = "INSERT INTO user (user_public_id, user_display_name, user_icon, user_google_id, user_access_token, user_renew_token, user_access_token_expire) VALUES (:publicId, :name, :icon, :google, :token, :renew, :refresh)";

    $accessToken = $this->generateAccessToken($displayName);
    $renewToken = $this->generateRenewToken($displayName);
    $refreshTime = $this->getNextRefreshDate();

    $bindings = [];
    $bindings[":name"] = $displayName;
    $bindings[":icon"] = $icon;
    $bindings[":google"] = $googleId;
    $bindings[":token"] = $accessToken;
    $bindings[":renew"] = $renewToken;
    $bindings[":refresh"] = $refreshTime;
    $bindings[":publicId"] = md5(time());

    $results = $this->io->queryDB([], $query, $bindings);

    if ($results["data"] > 0) {
     $results["meta"]["status"] = 201;
     $results["meta"]["message"] = "User was created";
    }

    $results["data"] = [];
    $results["data"]["accessToken"] = $accessToken;
    $results["data"]["renewToken"] = $renewToken;
    $results["data"]["tokenExpire"] = $refreshTime;

    return $results;
  }

  //Creates user for the given twitter id
  private function addUserToDatabaseForTwitterId($displayName, $icon, $twitterId) {
    $query = "INSERT INTO user (user_public_id, user_display_name, user_icon, user_twitter_id, user_access_token, user_renew_token, user_access_token_expire) VALUES (:publicId, :name, :icon, :twitter, :token, :renew, :refresh)";

    $accessToken = $this->generateAccessToken($displayName);
    $renewToken = $this->generateRenewToken($displayName);
    $refreshTime = $this->getNextRefreshDate();

    $bindings = [];
    $bindings[":name"] = $displayName;
    $bindings[":icon"] = $icon;
    $bindings[":twitter"] = $twitterId;
    $bindings[":token"] = $accessToken;
    $bindings[":renew"] = $renewToken;
    $bindings[":refresh"] = $refreshTime;
    $bindings[":publicId"] = md5(time());

    $results = $this->io->queryDB([], $query, $bindings);

    if ($results["data"] > 0) {
     $results["meta"]["status"] = 201;
     $results["meta"]["message"] = "User was created";
    }

    $results["data"] = [];
    $results["data"]["accessToken"] = $accessToken;
    $results["data"]["renewToken"] = $renewToken;
    $results["data"]["tokenExpire"] = $refreshTime;

    return $results;
  }

  //Generate a access token for a given user.
  private function generateAccessToken($userName) {
    return md5(time()) . md5($userName);
  }

  //Generates a renewal token
  private function generateRenewToken($userName) {
    return md5(time() . $userName) . md5($userName);
  }

  //Calculates the next refresh date
  private function getNextRefreshDate() {
    $timeDelta = 24 * 60 * 60; //Expires every day
    return date('Y-m-d H:i:s', time() + $timeDelta);
  }

}
