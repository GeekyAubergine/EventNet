<?php

/*
  Class controlling all commenting functionality
*/
class CommentIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  //Used by primary router, calls approriate functions within this class
  public function getComments($args) {
    if (isset($args["postId"])) {
      return $this->getCommentsForPostId($args, $args["postId"]);
    }

    if (isset($args["searchTerm"])) {
      return $this->getCommentsWithSearchTerm($args);
    }

    return $this->io->badRequest("Post id or search term must be set", $args);
  }

  //Returns comments for given post id
  private function getCommentsForPostId($args, $postId) {
    $query = "SELECT comment.comment_id, comment.comment_content, comment.comment_latitude, comment.comment_longitude, comment.comment_timestamp, comment.post_id, comment.comment_edited, comment.comment_edited_timestamp, user.user_display_name, user.user_icon, (SELECT COUNT(*) FROM comment WHERE comment.post_id = :postId AND (SELECT COUNT(*) FROM report WHERE report.comment_id = comment.comment_id) < :maxReports AND (SELECT COUNT(*) FROM report WHERE report.comment_id = comment.comment_id AND report.user_id = :userId) = 0) as number_of_comments, IF(comment.user_id = :userId, 'true', 'false') AS commented_by_user FROM comment JOIN user USING(user_id) WHERE comment.post_id = :postId AND (SELECT COUNT(*) FROM report WHERE report.comment_id = comment.comment_id) < :maxReports AND (SELECT COUNT(*) FROM report WHERE report.comment_id = comment.comment_id AND report.user_id = :userId) = 0 ORDER BY comment.comment_timestamp asc";
    $bindings = [];
    $bindings[":userId"] = $this->io->getUserId($args);
    $bindings[":postId"] = $postId;
    $bindings[":maxReports"] = REPORTS_BEFORE_HIDDING_CONTENT;

    return $this->io->queryDB($args, $query, $bindings);
  }

  //Returns comments that contain content that matches the given search term
  private function getCommentsWithSearchTerm($args) {
      $query = "SELECT comment.comment_id, comment.comment_content, comment.comment_latitude, comment.comment_longitude, comment.comment_timestamp, comment.post_id, user.user_display_name, user.user_icon FROM comment JOIN user USING(user_id) WHERE comment_content LIKE :search";
      $bindings = [];
      $bindings[":search"] = "%" . $args["searchTerm"] . "%";

      return $this->io->queryDB($args, $query, $bindings);
  }

  //Creates a comment
  public function createComment($args) {
    if (!isset($args["postId"])) {
      return $this->io->badRequest("Post ID was missing", $args);
    }
    if (!isset($args["commentContent"])) {
      return $this->io->badRequest("Comment content was missing", $args);
    }
    if (!isset($args["latitude"])) {
      return $this->io->badRequest("Latitude was missing", $args);
    }
    if (!isset($args["longitude"])) {
      return $this->io->badRequest("Longitude was missing", $args);
    }

    $query = "insert into comment (user_id, post_id, comment_content, comment_latitude, comment_longitude, comment_timestamp) values (:user, :post, :content, :lat, :lon, UTC_TIMESTAMP)";
    $bindings = [];

    $bindings[":user"] = $this->io->getUserId($args);;
    $bindings[":post"] = $args["postId"];
    $bindings[":content"] = $args["commentContent"];
    $bindings[":lat"] = $args["latitude"];
    $bindings[":lon"] = $args["longitude"];

    $results = $this->io->queryDB($args, $query, $bindings);

    if ($results["data"] > 0) {
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Comment was created";
    }

    return $results;
  }

  //Updates a comment
  public function updateComment($args) {
    if (!isset($args["commentContent"])) {
      return $this->io->badRequest("Content missing", $args);
    }

    $query = "UPDATE comment SET comment_content = :content, comment_edited = 1, comment_edited_timestamp = UTC_TIMESTAMP WHERE comment_id = :comment";
    $bindings = [];
    $bindings[":comment"] = $args["commentId"];
    $bindings[":content"] = $args["commentContent"];

    return $this->io->queryDB($args, $query, $bindings);
  }

  //Delete a comment
  public function deleteComment($args) {
    if (!isset($args["commentId"])) {
      return $this->io->badRequest("Comment id was missing");
    }

    $query = "DELETE FROM comment WHERE comment_id = :id";
    $bindings = [];
    $bindings[":id"] = $args["commentId"];

    $results = $this->io->queryDB($args, $query, $bindings);

    if ($results["data"] > 0) {
      $results["meta"]["status"] = 200;
      $results["meta"]["message"] = "Comment was deleted";
    }

    return $results;
  }

}
