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
  if (DEBUGGING) {
    $results["debug"]["request"] = $args;
  }
  return $results;
}

// ---- NETWORKS ----- //
function getNetworks($args) {
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

    $clause = "";

    if (isset($args["networkId"])) {
      $clause = "WHERE network.network_id = " . abs(intval($args["networkId"]));
    }

    $query = "select network.network_id, network.network_name, network.network_latitude, network.network_longitude, network.network_timestamp, info.number_of_posts, info.most_recent_post " .
     "FROM network " .
     "LEFT JOIN (".
     "select network_id, COUNT(*) AS number_of_posts, MAX(post_timestamp) as most_recent_post FROM post GROUP BY network_id) AS info ON info.network_id = network.network_id " .
     $clause .
     " ORDER BY network.network_timestamp limit " . $limit . " offset " . $offset . ";";


    $queryOut = $DB->query($query);

    $results["data"] = $queryOut;
    $results["meta"]["ok"] = true;
    if (DEBUGGING) {
      $results["debug"]["query"] = $query;
      $results["debug"]["offset"] = $offset;
      $results["debug"]["limit"] = $limit;
      $results["debug"]["count"] = count($queryOut);
    }

  } catch (DBException $e) {
    error_log($e);
    $results["meta"]["ok"] = false;
    if (DEBUGGING) {
      $results["debug"]["exception"] = $e;
    }
  }
  return $results;
}

function createNetwork($args) {
  $results = [];
  try {
    $DB = new DB();

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

    $result = $DB->query($query);

    $results = [];
    if (count($result) > 0) {
      $results["meta"]["ok"] = true;
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Network was created";
    }
    else if (DEBUGGING) {
      $results["debug"]["query"] = $query;
    }

    $query = "select network_id, network_name, network_latitude, network_longitude, network_timestamp, count(*) as \"number_of_posts\" from network left join post using(network_id) group by network_id;";

    $results["data"] = $DB->query($query);

  } catch (DBException $e) {
    error_log($e);
    $results["meta"]["ok"] = false;
    if (DEBUGGING) {
      $results["debug"]["exception"] = $e;
    }
  }
  return $results;
}

// ---- POSTS ----- //
function getPosts($args) {
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
     " ORDER BY post_timestamp asc limit " . $limit . " offset " . $offset . ";";

    $query = "select post.post_id, post.post_content, post.post_timestamp, user.user_display_name, info.number_of_comments " .
    "FROM post join user using(user_id) " .
    "LEFT JOIN (".
    "select post_id, COUNT(*) AS number_of_comments FROM comment GROUP BY post_id) AS info ON info.post_id = post.post_id " .
    "WHERE network_id = " . $args["networkId"] . " " .
    $clause .
    " ORDER BY post.post_timestamp asc limit " . $limit . " offset " . $offset . ";";


    $queryOut = $DB->query($query);

    $results["data"] = $queryOut;
    $results["meta"]["ok"] = true;
    if (DEBUGGING) {
      $results["debug"]["query"] = $query;
      $results["debug"]["offset"] = $offset;
      $results["debug"]["limit"] = $limit;
      $results["debug"]["count"] = count($queryOut);
    }

  } catch (DBException $e) {
    error_log($e);
    $results["meta"]["ok"] = false;
    if (DEBUGGING) {
      $results["debug"]["exception"] = $e;
    }
  }
  return $results;
}

function createPost($args) {
  $results = [];
  try {
    $DB = new DB();

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

    $result = $DB->query($query);

    $results = [];
    if (count($result) > 0) {
      $results["meta"]["ok"] = true;
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Post was created";
    }
    else if (DEBUGGING) {
      $results["debug"]["query"] = $query;
    }

  } catch (DBException $e) {
    error_log($e);
    $results["meta"]["ok"] = false;
    if (DEBUGGING) {
      $results["debug"]["exception"] = $e;
    }
  }
  return $results;
}

// ---- COMMENTS ----- //
function getComments($args) {
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

    $query = "select user_display_name, comment_id, comment_content, comment_timestamp from comment " .
    "join user using(user_id) join post using(post_id) ".
    "WHERE post_id = " . $args["postId"] . " " .
    "ORDER BY comment_timestamp asc limit " . $limit . " offset " . $offset . ";";


    $queryOut = $DB->query($query);

    $results["data"] = $queryOut;
    $results["meta"]["ok"] = true;
    if (DEBUGGING) {
      $results["debug"]["query"] = $query;
      $results["debug"]["offset"] = $offset;
      $results["debug"]["limit"] = $limit;
      $results["debug"]["count"] = count($queryOut);
    }

  } catch (DBException $e) {
    error_log($e);
    $results["meta"]["ok"] = false;
    if (DEBUGGING) {
      $results["debug"]["exception"] = $e;
    }
  }
  return $results;
}

function createComment($args) {
  $results = [];
  try {
    $DB = new DB();

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

    $result = $DB->query($query);

    $results = [];
    if (count($result) > 0) {
      $results["meta"]["ok"] = true;
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Post was created";
    }
    else if (DEBUGGING) {
      $results["debug"]["query"] = $query;
    }

  } catch (DBException $e) {
    error_log($e);
    $results["meta"]["ok"] = false;
    if (DEBUGGING) {
      $results["debug"]["exception"] = $e;
    }
  }
  return $results;
}
