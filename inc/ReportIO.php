<?php

class ReportIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function createReport($args) {
    if (!isset($args["accessToken"])) {
      return $this->io->badRequest("Access token was missing", $args);
    }

    $userId = $this->io->getUserId($args);

    if (isset($args["postId"])) {
      $query = "insert into report (user_id, post_id, report_timestamp) values (:user, :post, UTC_TIMESTAMP);";
      $bindings = [];
      $bindings[":user"] = $userId;
      $bindings[":post"] = $args["postId"];
    }
    if (isset($args["commentId"])) {
      $query = "insert into report (user_id, comment_id, report_timestamp) values (:user, :comment, UTC_TIMESTAMP);";
      $bindings = [];
      $bindings[":user"] = $userId;
      $bindings[":comment"] = $args["commentId"];
    }

    if (isset($query)) {
      $results = $this->io->queryDB($args, $query, $bindings);

      if ($results["data"] > 0) {
        $results["meta"]["status"] = 201;
        $results["meta"]["message"] = "Report was created";
      }
    } else {
      return $this->io->badRequest("Neither post id or comment id was set");
    }

    return $results;
  }

}
