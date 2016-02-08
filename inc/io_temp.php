<?php

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
