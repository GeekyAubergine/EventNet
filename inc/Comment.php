<?php

class Comment {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getComments($args) {
    if (isset($args["postId"])) {
      return $this->getCommentsForPostId($args, $args["postId"]);
    }
  }

  private function getCommentsForPostId($args, $postId) {
    $query = "select user.user_display_name, user.user_icon, comment.comment_id, comment.comment_content, comment.comment_timestamp, comment.post_id, info.number_of_comments from comment " .
    "join user using(user_id) join post using(post_id) ".
    "join (select post_id, count(*) as number_of_comments from comment group by post_id) as info on info.post_id = comment.post_id ".
    "WHERE comment.post_id = " . $postId . " " .
    "ORDER BY comment_timestamp asc ";

    return $this->io->queryDB($args, $query);
  }

  public function createComment($args) {
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

    $results = $this->io->queryDB($args, $query);

    if ($results["data"] > 0) {
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Comment was created";
    }

    return $results;
  }

}
