<?php

/*
  Class controlling all input and output within the API
*/
class IO {
  private $database;

  public function __construct() {
    $this->database = new DB();
  }

  //Extracts the variables sent in the request. It santitises the input.
  public function extractVariables($method = INPUT_GET) {
    $variables = array();
    foreach ($_REQUEST as $key => $value) {
      $variables[$key] = stripslashes(strip_tags(urldecode(filter_input($method, $key, FILTER_SANITIZE_STRING))));
    }
    return $variables;
  }

  //Formats the results to send back the client in the requested format.
  public function sendResults($results) {
    global $_REQUEST;

    $jsonFormat = isset($_REQUEST['format']) && ($_REQUEST['format'] == 'json');
    $jsonHeader = !(stripos($_SERVER['HTTP_ACCEPT'], 'application/json') === false);
    $json = $jsonHeader || $jsonFormat;

    //Check for error
    if (isset($result["meta"]["ok"]) && $results["meta"]["ok"] === false) {
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
      echo("Results: ");
      var_dump($results);
    }
  }

  //Returns information to the client that their request is bad.
  public function badRequest($message, $args) {
    $results = [];
    $results["meta"]["ok"] = false;
    $results["meta"]["status"] = 400;
    $results["meta"]["message"] = $message;
    $results["debug"]["request"] = $args;
    return $results;
  }

  //Returns information to the client that the method is not allowed.
  public function methodNotAllowed($args) {
    $results = [];
    $results["meta"]["ok"] = false;
    $results["meta"]["status"] = 405;
    $results["meta"]["message"] = "Method now allowed";
    $results["debug"]["request"] = $args;
    return $results;
  }

  //Returns information to the client if the requested method has not be implemented.
  public function methodNotImplemented($args) {
    $results = [];
    $results["meta"]["ok"] = false;
    $results["meta"]["status"] = 501;
    $results["meta"]["message"] = "Method not implemented";
    $results["debug"]["request"] = $args;
    return $results;
  }

  /*
    Queryies the database using the given query and bindings. It will also
    extract and limits and offsets in the args.
  */
  public function queryDB($args, $query, $bindings = null) {
    $limit = 25;
    $offset = 0;

    if (isset($args["offset"])) {
      $offset = abs(intval($args["offset"]));
    }

    if (isset($args["limit"])) {
      $limit = min(abs(intval($args["limit"])), 1000); //Max 1000 rows
    }

    $isSelectQuery = strpos(strtolower($query), 'select') !== false;

    if ($isSelectQuery) {
      $query .= " LIMIT " . $limit . " OFFSET " . $offset;
    }

    $query .= ";";

    //Replace now() width UTC_TIMESTAMP
    $query = str_replace("now()", "UTC_TIMESTAMP", $query);
    $query = str_replace("NOW()", "UTC_TIMESTAMP", $query);

    $results = $this->database->query($query, $bindings);

    $results["debug"]["offset"] = $offset;
    $results["debug"]["limit"] = $limit;
    $results["debug"]["query"] = $query;
    $results["debug"]["bindings"] = $bindings;

    return $results;
  }

  //Returns the last ID inserted into the database.
  public function getLastInsertedID() {
    return $this->database->getLastInsertedID();
  }

  //Returns the user ID, returns 0 if
  public function getUserID($args) {
    if (!isset($args["accessToken"])) {
      return -1;
    }
    $accessToken = $args["accessToken"];
    $user = new UserIO($this);

    if ($user->accessTokenValid($accessToken)) {
      $userId = $user->getUserIdForAccessToken($accessToken);
    } else {
      $userId = 0;
    }

    return $userId;
  }

  public function close() {
    $this->database->close();
    $this->database = null;
  }

}
