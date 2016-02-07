<?php

// ---- NETWORKS ----- //
function getNetworks($args) {
  $io = new IO();

  $query = "";

  if (isset($args["networkId"])) {
    $clause = "WHERE network.network_id = " . abs(intval($args["networkId"]));

    $query = "select network.network_id, network.network_name, network.network_latitude, network.network_longitude, network.network_timestamp, info.number_of_posts, info.most_recent_post " .
    "FROM network " .
    "LEFT JOIN (".
    "select network_id, COUNT(*) AS number_of_posts, MAX(post_timestamp) as most_recent_post FROM post GROUP BY network_id) AS info ON info.network_id = network.network_id " .
    "WHERE network.network_id = " . abs(intval($args["networkId"]));
  } else {
    if (!isset($args["latitude"])) {
      return $io->badRequest("Latitude was missing", $args);
    }
    if (!isset($args["longitude"])) {
      return $io->badRequest("Longitude was missing", $args);
    }

    $query = "select network.network_id, network.network_name, network.network_latitude, network.network_longitude, network.network_timestamp, info.number_of_posts, info.most_recent_post, " .
    /*Formula for calculating distance between two lat lngs, originally in JavScript
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
    "(" .
    "6371 * 2 * ATAN2(" .
    "SQRT(" .
    //a
    "SIN(RADIANS(network.network_latitude - " . $args["latitude"] . ") / 2) * " .
    "SIN(RADIANS(network.network_latitude - " . $args["latitude"] . ") / 2) + " .
    "COS(RADIANS(network.network_latitude)) * COS(RADIANS(" . $args["latitude"] . ")) * " .
    "SIN(RADIANS(network.network_longitude - " . $args["longitude"] . ") / 2) * " .
    "SIN(RADIANS(network.network_longitude - " . $args["longitude"] . ") / 2)" .
    "), " .
    "SQRT(1 - " .
    //a
    "SIN(RADIANS(network.network_latitude - " . $args["latitude"] . ") / 2) * " .
    "SIN(RADIANS(network.network_latitude - " . $args["latitude"] . ") / 2) + " .
    "COS(RADIANS(network.network_latitude)) * COS(RADIANS(" . $args["latitude"] . ")) * " .
    "SIN(RADIANS(network.network_longitude - " . $args["longitude"] . ") / 2) * " .
    "SIN(RADIANS(network.network_longitude - " . $args["longitude"] . ") / 2)" .
    "))".
    ") as distance_from_user " .
    "FROM network " .
    "LEFT JOIN (".
    "select network_id, COUNT(*) AS number_of_posts, MAX(post_timestamp) as most_recent_post FROM post GROUP BY network_id) AS info ON info.network_id = network.network_id " .
    "ORDER BY distance_from_user, info.most_recent_post, info.number_of_posts";
  }

  $query = str_replace("\/", "/", $query);

  $results = $io->queryDB($args, $query);

  return $results;
}

function createNetwork($args) {
    $io = new IO();

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

  $results = $io->queryDB($args, $query);

  return $results;
}

// ---- POSTS ----- //
function getPosts($args) {
    $io = new IO();

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

  return $io->queryDB($args, $query);
}

function createPost($args) {
    $io = new IO();

  if (!isset($args["userId"])) {
    return $io->badRequest("User ID was missing", $args);
  }
  if (!isset($args["postContent"])) {
    return $io->badRequest("Post content was missing", $args);
  }
  if (!isset($args["latitude"])) {
    return $io->badRequest("Latitude was missing", $args);
  }
  if (!isset($args["longitude"])) {
    return $io->badRequest("Longitude was missing", $args);
  }

  $query = "insert into post (user_id, network_id, post_content, post_latitude, post_longitude, post_timestamp) values " .
   "(". $args["userId"] . "," . $args["networkId"] . ",'" . $args["postContent"] . "'," . $args["latitude"] . "," . $args["longitude"] . ", now());";

  $results = $io->queryDB($args, $query);

  if ($results["data"] > 0) {
    $results["meta"]["status"] = 201;
    $results["meta"]["message"] = "Post was created";
  }

  return $results;
}

// ---- COMMENTS ----- //
function getComments($args) {
    $io = new IO();

    $query = "select user.user_display_name, user.user_icon, comment.comment_id, comment.comment_content, comment.comment_timestamp, comment.post_id, info.number_of_comments from comment " .
    "join user using(user_id) join post using(post_id) ".
    "join (select post_id, count(*) as number_of_comments from comment group by post_id) as info on info.post_id = comment.post_id ".
    "WHERE comment.post_id = " . $args["postId"] . " " .
    "ORDER BY comment_timestamp asc ";
  return $io->queryDB($args, $query);
}

function createComment($args) {
    $io = new IO();

  if (!isset($args["userId"])) {
    return $io->badRequest("User ID was missing", $args);
  }
  if (!isset($args["postId"])) {
    return $io->badRequest("Post ID was missing", $args);
  }
  if (!isset($args["commentContent"])) {
    return $io->badRequest("Comment content was missing", $args);
  }
  if (!isset($args["latitude"])) {
    return $io->badRequest("Latitude was missing", $args);
  }
  if (!isset($args["longitude"])) {
    return $io->badRequest("Longitude was missing", $args);
  }

  $query = "insert into comment (user_id, post_id, comment_content, comment_latitude, comment_longitude, comment_timestamp) values " .
   "(". $args["userId"] . "," . $args["postId"] . ",'" . $args["commentContent"] . "'," . $args["latitude"] . "," . $args["longitude"] . ", now());";

  $results = $io->queryDB($args, $query);

  if ($results["data"] > 0) {
    $results["meta"]["status"] = 201;
    $results["meta"]["message"] = "Comment was created";
  }

  return $results;
}

// ---- USERS ----- //
function getUsers($args) {
    $io = new IO();

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

  return $io->queryDB($args, $query);
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

// ---- MESSAGES ----- //
function getMessages($args) {
  $io = new IO();

  if (!isset($args["networkId"])) {
    return badRequest("Network ID was missing", $args);
  }
  $query = "select * from message join user using(user_id) " .
  "WHERE network_id = " . $args["networkId"] .
  " ORDER BY message_timestamp desc";
  return $io->queryDB($args, $query);
}


function createMessage($args) {
  $io = new IO();
  
  if (!isset($args["networkId"])) {
    return badRequest("Network ID was missing", $args);
  }
  if (!isset($args["userId"])) {
    return badRequest("User ID was missing", $args);
  }
  if (!isset($args["messageContent"])) {
    return badRequest("Message content was missing", $args);
  }
  if (!isset($args["latitude"])) {
    return badRequest("Latitude was missing", $args);
  }
  if (!isset($args["longitude"])) {
    return badRequest("Longitude was missing", $args);
  }
  $query = "insert into message (user_id, network_id, message_content, message_latitude, message_longitude, message_timestamp) values " .
   "('". $args["userId"] . "','" . $args["networkId"] . "','" . $args["messageContent"] . "','" . $args["latitude"] . "','" . $args["longitude"] . "', NOW());";

   $results = $io->queryDB($args, $query);

   if ($results["data"] > 0) {
     $results["meta"]["status"] = 201;
     $results["meta"]["message"] = "Message was created";
   }
   return $results;
}
