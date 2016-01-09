<?php

function extractVariables($method = INPUT_GET) {
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

function sendResults($results) {
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

function badRequest($message, $args) {
  $results = [];
  $results["meta"]["ok"] = false;
  $results["meta"]["status"] = 400;
  $results["meta"]["message"] = $message;
  if (DEBUGGING) {
    $results["meta"]["request"] = $args;
  }
  return $results;
}

// ---- NETWORKS ----- //
function getNetworks($args) {
  $results = [];
  try {
    $DB = new DB();

    $offset = 0;
    $limit = 25;

    if (isset($args["offset"])) {
      $offset = abs(intval($args["offset"]));
    }

    if (isset($args["limit"])) {
      $limit = abs(intval($args["limit"]));
    }

    $query = "select network_id, network_name, network_latitude, network_longitude, network_timestamp, count(*) as \"number_of_posts\" from network left join post using(network_id) group by network_id limit " . $limit . " offset " . $offset . ";";

    $queryOut = $DB->query($query);

    $results["data"] = $queryOut;
    $results["meta"]["ok"] = true;
    if (DEBUGGING) {
      $results["meta"]["query"] = $query;
      $results["meta"]["offset"] = $offset;
      $results["meta"]["limit"] = $limit;
      $results["meta"]["count"] = count($queryOut);
    }

  } catch (DBException $e) {
    error_log($e);
    $results["meta"]["ok"] = false;
    if (DEBUGGING) {
      $results["meta"]["exception"] = $e;
    }
  }
  return $results;
}
