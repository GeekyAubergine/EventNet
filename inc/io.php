<?php

class IO {
  private $database;

  public function __construct() {
    $this->database = new DB();
  }

  public function extractVariables($method = INPUT_GET) {
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

  public function sendResults($results) {
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

  public function badRequest($message, $args) {
    $results = [];
    $results["meta"]["ok"] = false;
    $results["meta"]["status"] = 400;
    $results["meta"]["message"] = $message;
    $results["debug"]["request"] = $args;
    return $results;
  }

  public function queryDB($args, $query, $bindings = null) {
    $limit = 25;
    $offset = 0;

    if (isset($args["offset"])) {
      $offset = abs(intval($args["offset"]));
    }

    if (isset($args["limit"])) {
      $limit = abs(intval($args["limit"]));
    }

    $isSelectQuery = strpos($query, 'select') !== false;

    if ($isSelectQuery) {
      $query .= " limit " . $limit . " offset " . $offset;
    }

    $query .= ";";

    $results = $this->database->query($query, $bindings);

    $results["debug"]["offset"] = $offset;
    $results["debug"]["limit"] = $limit;
    $results["debug"]["query"] = $query;
    $results["debug"]["bindings"] = $bindings;

    return $results;
  }

  public function close() {
    $this->database = null;
  }

}
