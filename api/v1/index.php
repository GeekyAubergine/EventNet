<?php

include __DIR__.'/../../inc/all.php';

$verb = $_SERVER['REQUEST_METHOD'];

switch ($_SERVER['REQUEST_METHOD']) {
  case "POST":
  case "PUT":
    $in = extractVariables(INPUT_POST);
    break;
  default:
    $in = extractVariables(INPUT_GET);
}

$results = [];
$results["meta"]["ok"] = true;
$path = explode('/', ltrim($_SERVER['PATH_INFO'], "/"));

switch ($path[0]) {
  case "networks":
    switch ($verb) {
      case "GET":

        $results = getNetworks($in);
        break;
      case "POST":
        $results = createNetwork($in);
        break;
      default:
        break;
    }
    break;
  default:
    $results["meta"]["ok"] = false;
}

if (DEBUGGING) {
  $results["meta"]["request"] = $in;
  $results["meta"]["verb"] = $verb;
  $results["meta"]["path"] = $path;
  $results["debug"]["in"] = $in;
  $results["debug"]["INPUT_GET"] = extractVariables();
  $results["debug"]["INPUT_POST"] = extractVariables(INPUT_POST);
  $results["debug"]["request"] = $_REQUEST;
}

sendResults($results);
