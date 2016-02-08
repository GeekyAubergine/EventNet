<?php

class Post {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getPosts($args) {
    if (isset($args["networkId"])) {
      $networkId = $args["networkId"];
    } else {
      return $this->io->badRequest("Network Id was not set", $args);
    }

    if (isset($args["postId"])) {
      return $this->getPostById($args, $networkId, $args["postId"]);
    }

    if (isset($args["before"])) {
      return $this->getPostBeforeTime($args, $networkId, $args["before"]);
    }

    if (isset($args["after"])) {
      return $this->getPostAfterTime($args, $networkId, $args["before"]);
    }

    return $this->getPostsWithNetworkId($args, $networkId);

  }

  private function getPostById($args, $networkId, $postId) {
    $query = "select * from post join user using(user_id) " .
     "where network_id = " . $networkId . " and post_id = " . $post_id;

   return $this->io->queryDB($args, $query);
  }

  public function getPostsWithNetworkId($args, $networkId) {
    $query = "select * from post join user using(user_id) " .
     "where network_id = " . $networkId;

    return $this->io->queryDB($args, $query);
  }

  private function getPostBeforeTime($args, $networkId, $time) {
    $query = "select post.post_id, post.post_content, post.post_timestamp, user.user_display_name, user.user_icon, info.number_of_comments " .
    "FROM post join user using(user_id) " .
    "LEFT JOIN (".
    "select post_id, COUNT(*) AS number_of_comments FROM comment GROUP BY post_id) AS info ON info.post_id = post.post_id " .
    "WHERE network_id = " . $networkId . " " .
    "AND post_timestamp > '" . $time ."'" .
    " ORDER BY post.post_timestamp asc ";

    return $this->io->queryDB($args, $query);
  }

  private function getPostAfterTime($args, $networkId, $time) {
    $query =  "select post.post_id, post.post_content, post.post_timestamp, user.user_display_name, user.user_icon, info.number_of_comments " .
    "FROM post join user using(user_id) " .
    "LEFT JOIN (".
    "select post_id, COUNT(*) AS number_of_comments FROM comment GROUP BY post_id) AS info ON info.post_id = post.post_id " .
    "WHERE network_id = " . $networkId . " " .
    "AND post_timestamp < '" . $time ."'".
    " ORDER BY post.post_timestamp asc ";

    return $this->io->queryDB($args, $query);
  }

  public function createPost($args) {
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

    $query = "insert into post (user_id, network_id, post_content, post_latitude, post_longitude, post_timestamp) values " .
     "(". $args["userId"] . "," . $args["networkId"] . ",'" . $args["postContent"] . "'," . $args["latitude"] . "," . $args["longitude"] . ", now());";

    $results = $this->io->queryDB($args, $query);

    if ($results["data"] > 0) {
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Post was created";
    }

    return $results;
  }

}
