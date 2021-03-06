<?php

/*
  Class for controlling all posting functionality
*/
class PostIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  //Used by primary router, calls approriate functions within this class
  public function getPosts($args) {
    //Get post
    if (isset($args["postId"])) {
      return $this->getPostById($args, $args["postId"]);
    }

    //Get posts for event
    if (isset($args["eventId"])) {
      $eventId = $args["eventId"];

      $before = "9999-12-31";
      $after = "1000-01-01";

      if (isset($args["before"])) {
        $before = $args["before"];
      }

      if (isset($args["after"])) {
        $after = $args["after"];
      }

      return $this->getPostsBetweenDates($args, $eventId, $before, $after);
    }

    //Get posts for search term
    if (isset($args["searchTerm"])) {
      return $this->getPostsWithSearchTerm($args);
    }

    //Get posts for userId
    if (isset($args["userId"])) {
      return $this->getPostsByPublicId($args);
    }

    return $this->io-badRequest("Either the post id, a search term or the event id must be set", $args);
  }

  //Returns post with the given post id
  private function getPostById($args, $postId) {
    $query = "SELECT event.event_name, post.post_id, post.post_content, post.post_latitude, post.post_longitude, post.post_timestamp, post.post_id, user.user_display_name, user.user_icon FROM post JOIN event USING(event_id) JOIN user USING(user_id) WHERE post_id = :postId";
    $bindings = [];
    $bindings[":postId"] = $postId;

    return $this->io->queryDB($args, $query, $bindings);
  }

  //Returns posts for the given event id betwen the given dates
  private function getPostsBetweenDates($args, $eventId, $before, $after) {
    $query = "SELECT post.post_id, post.post_content, post.post_latitude, post.post_longitude, post.post_timestamp, post.post_edited, post.post_edited_timestamp, user.user_display_name, user.user_icon, (SELECT COUNT(*) FROM comment WHERE post.post_id = comment.post_id AND (SELECT COUNT(*) FROM report WHERE report.comment_id = comment.comment_id) < :maxReports AND (SELECT COUNT(*) FROM report WHERE report.comment_id = comment.comment_id AND report.user_id = :userId) = 0) AS number_of_comments, IF(post.user_id = :userId, 'true', 'false') AS posted_by_user FROM post JOIN user USING(user_id) LEFT JOIN report USING(post_id) WHERE event_id = :eventId AND post_timestamp < :before AND post_timestamp > :after AND IF(report.user_id = :userId, 1, 0) = 0 AND (SELECT COUNT(*) FROM report WHERE report.post_id = post.post_id) < :maxReports ORDER BY post.post_timestamp asc ";// AND (number_of_reports < :maxReports OR ISNULL(number_of_reports)) AND IF(report.user_id = :userId, 1, 0) = 0 ORDER BY post.post_timestamp asc ";
    $bindings = [];
    $bindings[":userId"] = $this->io->getUserId($args);
    $bindings[":eventId"] = $eventId;
    $bindings[":before"] = $before;
    $bindings[":after"] = $after;
    $bindings[":maxReports"] = REPORTS_BEFORE_HIDDING_CONTENT;

    return $this->io->queryDB($args, $query, $bindings);
  }

  //Returns posts who's contents matches the given search term
  private function getPostsWithSearchTerm($args) {
    $query = "SELECT post.post_id, post.post_content, post.post_latitude, post.post_longitude, post.post_timestamp, post.post_id, user.user_display_name, user.user_icon FROM post JOIN user USING(user_id) WHERE post_content LIKE :search ORDER BY post.post_timestamp asc ";
    $bindings = [];
    $bindings[":search"] = "%" . $args["searchTerm"] . "%";

    return $this->io->queryDB($args, $query, $bindings);
  }

  //Returns posts that were created by the given user 'public' ID
  private function getPostsByPublicId($args) {
    $query = "SELECT post.post_id, post.post_content, post.post_latitude, post.post_longitude, post.post_timestamp, post.post_id, user.user_display_name, user.user_icon FROM post JOIN user USING(user_id) WHERE user_public_id = :id ORDER BY post.post_timestamp asc ";

    $bindings = [];
    $bindings["id"] = $args["userId"];

    return $this->io->queryDB($args, $query, $bindings);
  }

  //Creates a post
  public function createPost($args) {
    if (!isset($args["eventId"])) {
      return $this->io->badRequest("Network ID was missing", $args);
    }
    if (!isset($args["accessToken"])) {
      return $this->io->badRequest("Access token was missing", $args);
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

    $query = "INSERT INTO post (user_id, event_id, post_content, post_latitude, post_longitude, post_timestamp) VALUES (:user, :event, :content, :lat, :lon, UTC_TIMESTAMP)";
    $bindings = [];

    $bindings[":user"] = $this->io->getUserId($args);;
    $bindings[":event"] = $args["eventId"];
    $bindings[":content"] = $args["postContent"];
    $bindings[":lat"] = $args["latitude"];
    $bindings[":lon"] = $args["longitude"];

    $results = $this->io->queryDB($args, $query, $bindings);

    if ($results["data"] > 0) {
      $results["meta"]["status"] = 201;
      $results["meta"]["message"] = "Post was created";
      $postId = $this->io->getLastInsertedID();
      $mediaIO = new MediaIO($this->io);
      $mediaIO->saveMediaForPost($args, $postId);
    }
    return $results;
  }

  //Updates a post
  public function updatePost($args) {
    if (!isset($args["postContent"])) {
      return $this->io->badRequest("Content missing", $args);
    }

    $query = "UPDATE post SET post_content = :content, post_edited = 1, post_edited_timestamp = UTC_TIMESTAMP WHERE post_id = :post";
    $bindings = [];
    $bindings[":post"] = $args["postId"];
    $bindings[":content"] = $args["postContent"];

    return $this->io->queryDB($args, $query, $bindings);
  }

  //Delete a post
  public function deletePost($args) {
    if (!isset($args["postId"])) {
      return $this->io->badRequest("Post id was missing");
    }

    $mediaIO = new MediaIO($this->io);
    $mediaIO->deleteMediaForPost($args);

    $query = "DELETE FROM comment WHERE post_id = :id; DELETE FROM post WHERE post_id = :id";
    $bindings = [];
    $bindings[":id"] = $args["postId"];

    $results = $this->io->queryDB($args, $query, $bindings);

    if ($results["data"] > 0) {
      $results["meta"]["status"] = 200;
      $results["meta"]["message"] = "Post was deleted";
    }

    return $results;
  }

}
