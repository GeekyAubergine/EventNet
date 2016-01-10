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
    //Get networkId
    if (isset($path[1]) && trim($path[1]) != "") {
      $args["networkId"] = $path[1];
    }
    //Determine if this is the stopping level
    if (count($path) <= 2) {
      switch ($verb) {
        case "GET":
          $results = getNetworks($args);
          break;
        case "POST":
          $results = createNetwork($args);
          break;
        default:
          $results["meta"]["ok"] = false;
          break;
      }
    } else {
      switch ($path[2]) {
        case "posts":
          //Get postId
          if (isset($path[3]) && trim($path[3]) != "") {
            $args["postId"] = $path[3];
          }
          //Determine if this is the stopping level
          if (count($path) <= 4) {
            switch ($verb) {
              case "GET":
                $results = getPosts($args);
                break;
              case "POST":
                $results = createPost($args);
                break;
              default:
                $results["meta"]["ok"] = false;
                break;
            }
          }
          break;
        default:
          $results["meta"]["ok"] = false;
          break;
      }
    }
    break;
  default:
    $results["meta"]["ok"] = false;
    break;
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
