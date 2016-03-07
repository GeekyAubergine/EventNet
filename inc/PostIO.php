<?php

class PostIO {

  private $io;
  private $basePostQuery;

  public function __construct($io) {
    $this->io = $io;
    $this->basePostQuery = "SELECT post.post_id, post.post_content, post.post_latitude, post.post_longitude, post.post_timestamp, user.user_display_name, user.user_icon, IFNULL(info.number_of_comments, 0) as number_of_comments, reports.number_of_reports as number_of_reports, IF(post.user_id = :userId, 'true', 'false') AS posted_by_user FROM post JOIN user USING(user_id) LEFT JOIN report USING(post_id) LEFT JOIN (select post_id, COUNT(*) AS number_of_comments FROM comment GROUP BY post_id) AS info ON info.post_id = post.post_id LEFT JOIN (select post_id, COUNT(*) AS number_of_reports FROM report GROUP BY post_id) AS reports ON reports.post_id = post.post_id ";
  }

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

    return $this->getPostsWithEventId($args, $eventId);
  }

  private function getPostById($args, $postId) {
    $query = $this->basePostQuery . "WHERE post_id = :postId ORDER BY post.post_timestamp asc";
    $bindings = [];
    $bindings[":userId"] = $this->io->getUserId($args);
    $bindings[":postId"] = $postId;

    return $this->io->queryDB($args, $query, $bindings);
  }

  private function getPostsBetweenDates($args, $eventId, $before, $after) {
    $query = $this->basePostQuery . "WHERE event_id = :eventId AND post_timestamp < :before AND post_timestamp > :after AND (number_of_reports < :maxReports OR ISNULL(number_of_reports)) AND IF(report.user_id = :userId, 1, 0) = 0 ORDER BY post.post_timestamp asc ";
    $bindings = [];
    $bindings[":userId"] = $this->io->getUserId($args);
    $bindings[":eventId"] = $eventId;
    $bindings[":before"] = $before;
    $bindings[":after"] = $after;
    $bindings[":maxReports"] = REPORTS_BEFORE_HIDDING_CONTENT;

    return $this->io->queryDB($args, $query, $bindings);
  }

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

    $query = "insert into post (user_id, event_id, post_content, post_latitude, post_longitude, post_timestamp) values (:user, :event, :content, :lat, :lon, now())";
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
    }

    return $results;
  }

}
