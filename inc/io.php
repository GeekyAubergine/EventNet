<?php

function extractVariables($method = INPUT_GET) {
  $variables = array();
  foreach ($_REQUEST as $key => $value) {
    $string = filter_input($method, $key, FILTER_SANITIZE_STRING);
    //Only encode if GET
    if ($method == INPUT_GET) {
      $string = urlencode($string);
    }
    $variables[$key] = stripslashes(strip_tags($string));
  }
  return $variables;
}

function sendResults($results) {
  global $_REQUEST;

  $jsonFormat = isset($_REQUEST['format']) && ($_REQUEST['format'] == 'json');
  $jsonHeader = !(stripos($_SERVER['HTTP_ACCEPT'], 'application/json') === false);
  $json = $jsonHeader || $jsonFormat;

  if (isset($result["meta"]["ok"]) && $results["meta"]["ok"] === false) { //Check for error
    $status = isset($results["meta"]["status"]) ? $results["meta"]["status"] : 599;
    $message = isset($results["meta"]["message"]) ? $results["meta"]["message"] : "An unknown error has occured";
  } else {
    $status = isset($results["meta"]["status"]) ? $results["meta"]["status"] : 200;
    $message = isset($results["meta"]["message"]) ? $results["meta"]["message"] : "OK";
  }

  header("HTTP/1.1" . $status . $message);

  if ($json) {
    header("Content-Type: application/json");
    echo json_encode($results);
  } else {
    header("Content-Type: text/plain");
    echo("results: ");
    var_dump($results);
  }
}

function badRequest($message, $args) {
  $results = [];
  $results["meta"]["ok"] = false;
  $results["meta"]["status"] = 400;
  $results["meta"]["message"] = $message;
  $results["debug"]["request"] = $args;
  return $results;
}

function queryDB($args, $query, $bindings = null) {
  $results = [];
  try {
    $DB = new DB();

    $offset = 0;
    $limit = 25;

    if (isset($args["offset"])) {
      $offset = abs(intval($args["offset"]));
    }

    if (isset($args["limit"])) {
      $limit = abs(intval($args["limit"]));
    }

    if (strpos($query, 'select') !== false) {
      $query .= " limit " . $limit . " offset " . $offset;
    }

    $query .= ";";

    $queryOut = $DB->query($query, $bindings);

    $results["data"] = $queryOut;
    $results["meta"]["ok"] = true;
    $results["debug"]["offset"] = $offset;
    $results["debug"]["limit"] = $limit;
    $results["debug"]["count"] = count($queryOut);
  } catch (Exception $e) {
    error_log($e);
    $results["meta"]["ok"] = false;
    $results["debug"]["dbException"] = $e->getMessage();
  }

  $results["debug"]["query"] = $query;
  $results["debug"]["bindings"] = $bindings;

  return $results;
}

// ---- NETWORKS ----- //
function getNetworks($args) {
  if (!isset($args["latitude"])) {
    return badRequest("Latitude was missing", $args);
  }
  if (!isset($args["longitude"])) {
    return badRequest("Longitude was missing", $args);
  }

  $clause = "";

  if (isset($args["networkId"])) {
    $clause = "WHERE network.network_id = " . abs(intval($args["networkId"]));
  }

  $query = "select network.network_id, network.network_name, network.network_latitude, network.network_longitude, network.network_timestamp, info.number_of_posts, info.most_recent_post, " .
  //Formula for calculating distance between two lat lngs
  "(network.network_latitude - " . $args["latitude"] . ") as deltaLatitude," .
  "(network.network_longitude - " . $args["longitude"] . ") as deltaLongitude " .
  "(SIN(deltaLatitude \/ 2) * SIN(deltaLatitude \/ 2) +" .
  "COS(RADIANS(network.network_latitude)) * COS(RADIANS(" . $args["latitude"] . ")) " .
  "SIN(deltaLongitude \/ 2) * SIN(deltaLongitude \/ 2)) as a " .
  //  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    // Math.cos(degreesToRadains(lat1)) * Math.cos(degreesToRadains(lat2)) *
    // Math.sin(dLon / 2) * Math.sin(dLon / 2);
  "FROM network " .
  "LEFT JOIN (".
  "select network_id, COUNT(*) AS number_of_posts, MAX(post_timestamp) as most_recent_post FROM post GROUP BY network_id) AS info ON info.network_id = network.network_id " .
  $clause . " ORDER BY network.network_timestamp ";

  $query = str_replace("\/", "/", $query);

  $results = queryDB($args, $query);

  return $results;
}

function createNetwork($args) {
  if (!isset($args["networkName"])) {
    return badRequest("Network name was missing", $args);
  }
  if (!isset($args["latitude"])) {
    return badRequest("Latitude was missing", $args);
  }
  if (!isset($args["longitude"])) {
    return badRequest("Longitude was missing", $args);
  }

  $query = "insert into network (network_name, network_latitude, network_longitude, network_timestamp) values (\"". $args["networkName"] . "\"," . $args["latitude"] . "," . $args["longitude"] . ", now());";

  $query = "select network_id, network_name, network_latitude, network_longitude, network_timestamp, count(*) as \"number_of_posts\" from network left join post using(network_id) group by network_id;";

  $results = queryDB($args, $query);

  return $results;
}

// ---- POSTS ----- //
function getPosts($args) {
  $clause = "";

  if (isset($args["postId"])) {
    $clause = "AND post_id = " . abs(intval($args["postId"]));
  }
  else if (isset($args["before"])) {
    $clause = "AND post_timestamp > '" . $args["before"] ."'";
  }
  else if (isset($args["after"])) {
    $clause = "AND post_timestamp < '" . $args["after"] ."'";
  }

  $toReplace = array("+", "%3A");
  $replaceWith = array(" ", ":");
  $clause = str_replace($toReplace, $replaceWith, $clause);

  $query = "select * from post join user using(user_id) " .
   "WHERE network_id = " . $args["networkId"] . " " .
   $clause .
   " ORDER BY post_timestamp asc ";

  $query = "select post.post_id, post.post_content, post.post_timestamp, user.user_display_name, user.user_icon, info.number_of_comments " .
  "FROM post join user using(user_id) " .
  "LEFT JOIN (".
  "select post_id, COUNT(*) AS number_of_comments FROM comment GROUP BY post_id) AS info ON info.post_id = post.post_id " .
  "WHERE network_id = " . $args["networkId"] . " " .
  $clause .
  " ORDER BY post.post_timestamp asc ";

  return queryDB($args, $query);
}

function createPost($args) {
  if (!isset($args["userId"])) {
    return badRequest("User ID was missing", $args);
  }
  if (!isset($args["postContent"])) {
    return badRequest("Post content was missing", $args);
  }
  if (!isset($args["latitude"])) {
    return badRequest("Latitude was missing", $args);
  }
  if (!isset($args["longitude"])) {
    return badRequest("Longitude was missing", $args);
  }

  $query = "insert into post (user_id, network_id, post_content, post_latitude, post_longitude, post_timestamp) values " .
   "(". $args["userId"] . "," . $args["networkId"] . ",'" . $args["postContent"] . "'," . $args["latitude"] . "," . $args["longitude"] . ", now());";

  $results = queryDB($args, $query);

  if ($results["data"] > 0) {
    $results["meta"]["status"] = 201;
    $results["meta"]["message"] = "Post was created";
  }

  return $results;
}

// ---- COMMENTS ----- //
function getComments($args) {
    $query = "select user.user_display_name, user.user_icon, comment.comment_id, comment.comment_content, comment.comment_timestamp, comment.post_id, info.number_of_comments from comment " .
    "join user using(user_id) join post using(post_id) ".
    "join (select post_id, count(*) as number_of_comments from comment group by post_id) as info on info.post_id = comment.post_id ".
    "WHERE comment.post_id = " . $args["postId"] . " " .
    "ORDER BY comment_timestamp asc ";
  return queryDB($args, $query);
}

function createComment($args) {
  if (!isset($args["userId"])) {
    return badRequest("User ID was missing", $args);
  }
  if (!isset($args["postId"])) {
    return badRequest("Post ID was missing", $args);
  }
  if (!isset($args["commentContent"])) {
    return badRequest("Comment content was missing", $args);
  }
  if (!isset($args["latitude"])) {
    return badRequest("Latitude was missing", $args);
  }
  if (!isset($args["longitude"])) {
    return badRequest("Longitude was missing", $args);
  }

  $query = "insert into comment (user_id, post_id, comment_content, comment_latitude, comment_longitude, comment_timestamp) values " .
   "(". $args["userId"] . "," . $args["postId"] . ",'" . $args["commentContent"] . "'," . $args["latitude"] . "," . $args["longitude"] . ", now());";

  $results = queryDB($args, $query);

  if ($results["data"] > 0) {
    $results["meta"]["status"] = 201;
    $results["meta"]["message"] = "Comment was created";
  }

  return $results;
}

// ---- USERS ----- //
function getUsers($args) {
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

  return queryDB($args, $query);
}

function createUser($args) {
  $facebookId = 0;
  $googleId = 0;
  $twitterId = 0;

  if (!isset($args["displayName"])) {
    return badRequest("Display was missing", $args);
  }
  if (!isset($args["icon"])) {
    return badRequest("Icon was missing", $args);
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

   $results = queryDB($args, $query);

   if ($results["data"] > 0) {
     $results["meta"]["status"] = 201;
     $results["meta"]["message"] = "User was created";
   }

   return $results;
}
