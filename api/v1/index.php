<?php

include __DIR__.'/../../inc/all.php';

$verb = $_SERVER['REQUEST_METHOD'];

switch ($_SERVER['REQUEST_METHOD']) {
  case "POST":
  case "PUT":
    $args = extractVariables(INPUT_POST);
    break;
  default:
    $args = extractVariables(INPUT_GET);
}

$results = [];
$results["meta"]["ok"] = true;
$path = explode('/', ltrim($_SERVER['PATH_INFO'], "/"));

switch ($path[0]) {
  case "networks":
    //Determine what's being called via path length
    switch (count($path)) {
      case 1: // /networks
      case 2: // /networks/{networkID}
        switch ($verb) {
          case "GET":
            if (isset($path[1]) && trim($path[1]) != "") {
              $args["networkId"] = $path[1];
            }
            $results = getNetworks($args);
            break;
          case "POST":
            $results = createNetwork($args);
            break;
          default:
            break;
        }
        break;
      case 3: // /networks/{networkId}/posts
      case 4: // /networks/{networkId}/posts/{postID}
        switch ($verb) {
          case "GET":
            if (isset($path[1]) && trim($path[1]) != "") {
              $args["networkId"] = $path[1];
            }
            $results = getPosts($args);
            break;
          default:
            break;
        }
        break;
      default:
        $results["meta"]["ok"] = false;
    }
  default:
    $results["meta"]["ok"] = false;
}

$results["debug"]["request"] = $args;
$results["debug"]["verb"] = $verb;
$results["debug"]["path"] = $path;
$results["debug"]["in"] = $args;
$results["debug"]["INPUT_GET"] = extractVariables();
$results["debug"]["INPUT_POST"] = extractVariables(INPUT_POST);
$results["debug"]["request"] = $_REQUEST;

if (!DEBUGGING) {
  unset($results["debug"]);
}

sendResults($results);
