<?php

class Post {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getPosts($args) {
    if (isset($args["eventId"])) {
      $eventId = $args["eventId"];
    }

    if (isset($args["postId"])) {
      return $this->getPostById($args, $eventId, $args["postId"]);
    }

    if (isset($args["before"])) {
      return $this->getPostBeforeTime($args, $eventId, $args["before"]);
    }

    if (isset($args["after"])) {
      return $this->getPostAfterTime($args, $eventId, $args["before"]);
    }

    return $this->getPostsWithNetworkId($args, $eventId);
  }

  private function getPostById($args, $eventId, $postId) {
    $query = "select post.post_id, post.post_content, post.post_timestamp, user.user_display_name, user.user_icon, info.number_of_comments " .
    "FROM post join user using(user_id) " .
    "LEFT JOIN (".
    "select post_id, COUNT(*) AS number_of_comments FROM comment GROUP BY post_id) AS info ON info.post_id = post.post_id " .
    "WHERE event_id = " . $eventId . " " .
    " and post_id = " . $post_id .
    " ORDER BY post.post_timestamp asc ";

   return $this->io->queryDB($args, $query);
  }

  public function getPostsWithNetworkId($args, $eventId) {
    $query = "select post.post_id, post.post_content, post.post_timestamp, user.user_display_name, user.user_icon, info.number_of_comments " .
    "FROM post join user using(user_id) " .
    "LEFT JOIN (".
    "select post_id, COUNT(*) AS number_of_comments FROM comment GROUP BY post_id) AS info ON info.post_id = post.post_id " .
    "WHERE event_id = " . $eventId . " " .
    " ORDER BY post.post_timestamp asc ";

    return $this->io->queryDB($args, $query);
  }

  private function getPostBeforeTime($args, $eventId, $time) {
    $query = "select post.post_id, post.post_content, post.post_timestamp, user.user_display_name, user.user_icon, info.number_of_comments " .
    "FROM post join user using(user_id) " .
    "LEFT JOIN (".
    "select post_id, COUNT(*) AS number_of_comments FROM comment GROUP BY post_id) AS info ON info.post_id = post.post_id " .
    "WHERE event_id = " . $eventId . " " .
    "AND post_timestamp > '" . $time ."'" .
    " ORDER BY post.post_timestamp asc ";

    return $this->io->queryDB($args, $query);
  }

  private function getPostAfterTime($args, $eventId, $time) {
    $query =  "select post.post_id, post.post_content, post.post_timestamp, user.user_display_name, user.user_icon, info.number_of_comments " .
    "FROM post join user using(user_id) " .
    "LEFT JOIN (".
    "select post_id, COUNT(*) AS number_of_comments FROM comment GROUP BY post_id) AS info ON info.post_id = post.post_id " .
    "WHERE event_id = " . $eventId . " " .
    "AND post_timestamp < '" . $time ."'".
    " ORDER BY post.post_timestamp asc ";

    return $this->io->queryDB($args, $query);
  }

  public function createPost($args) {
    if (!isset($args["eventId"])) {
      return $this->io->badRequest("Network ID was missing", $args);
    }
    if (!isset($args["userId"])) {
      return $this->io->badRequest("User ID was missing", $args);
    }
    if (!isset($args["postContent"])) {
      return $this->io->badRequest("Post content was missing", $args);
    }
    if (!isset($args["latitude"])) {
      return $this->io->badRequest("Latitude was missing", $args);
    }
    if (!isset($args["longitude"])) {
      return $this->io->badRequest("Longitude was missing", $args);
    }

    $query = "insert into post (user_id, event_id, post_content, post_latitude, post_longitude, post_timestamp) values " .
     "(". $args["userId"] . "," . $args["eventId"] . ",'" . $args["postContent"] . "'," . $args["latitude"] . "," . $args["longitude"] . ", now());";

    $results = $this->io->queryDB($args, $query);

    if ($results["data"] > 0) {
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Post was created";
    }

    return $results;
  }

}
