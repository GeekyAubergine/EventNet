<?php

include __DIR__.'/../../inc/all.php';

$io = new IO();
$network = new Network($io);

$verb = $_SERVER['REQUEST_METHOD'];

switch ($_SERVER['REQUEST_METHOD']) {
  case "POST":
  case "PUT":
    $args = $io->extractVariables(INPUT_POST);
    break;
  default:
    $args = $io->extractVariables(INPUT_GET);
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
          $results = $network->getNetworks($args);
          break;
        case "POST":
          $results = $network->createNetwork($args);
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
          } else {
            switch ($path[4]) {
              case "comments":
                //Get commentId
                if (isset($path[5]) && trim($path[5]) != "") {
                  $args["commentId"] = $path[5];
                }
                switch ($verb) {
                  case "GET":
                    $results = getComments($args);
                    break;
                  case "POST":
                    $results = createComment($args);
                    break;
                  default:
                    $results["meta"]["ok"] = false;
                    break;
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
    }
    break;
  case "users":
    //Get networkId
    if (isset($path[1]) && trim($path[1]) != "") {
      $args["userId"] = $path[1];
    }
    switch ($verb) {
      case "GET":
        $results = getUsers($args);
        break;
      case "POST":
        $results = createUser($args);
        break;
      default:
        $results["meta"]["ok"] = false;
        break;
    }
    break;
  case "messages":
    //Get networkId
    if (isset($path[1]) && trim($path[1]) != "") {
      $args["messageId"] = $path[1];
    }
    switch ($verb) {
      case "GET":
        $results = getMessages($args);
        break;
      case "POST":
        $results = createMessage($args);
        break;
      default:
        $results["meta"]["ok"] = false;
        break;
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
$results["debug"]["INPUT_GET"] = $io->extractVariables();
$results["debug"]["INPUT_POST"] = $io->extractVariables(INPUT_POST);
$results["debug"]["request"] = $_REQUEST;

if (!DEBUGGING) {
  unset($results["debug"]);
}

$io->sendResults($results);
