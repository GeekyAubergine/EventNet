<?php

include __DIR__.'/../../inc/all.php';

$io = new IO();
$eventIO = new EventIO($io);
$postIO = new PostIO($io);
$commentIO = new CommentIO($io);
$userIO = new UserIO($io);
$messageIO = new MessageIO($io);
$reportIO = new ReportIO($io);

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
  case "events":
    //Get eventId
    if (isset($path[1]) && trim($path[1]) != "") {
      $args["eventId"] = $path[1];
    }
    //Determine if this is the stopping level
    switch ($verb) {
      case "GET":
        $results = $eventIO->getEvents($args);
        break;
      case "POST":
        $results = $eventIO->createEvent($args);
        break;
      default:
        $results = $io->methodNotAllowed($args);
        break;
    }
    break;
  case "posts":
    //Get postId
    if (isset($path[1]) && trim($path[1]) != "") {
      $args["postId"] = $path[1];
    }
    switch ($verb) {
      case "GET":
        $results = $postIO->getPosts($args);
        break;
      case "POST":
        $results = $postIO->createPost($args);
        break;
      case "DELETE":
        $results = $postIO->deletePost($args);
        break;
      default:
        $$results = $io->methodNotAllowed($args);
        break;
    }
    break;
  case "comments":
    //Get commentId
    if (isset($path[1]) && trim($path[1]) != "") {
      $args["commentId"] = $path[1];
    }
    switch ($verb) {
      case "GET":
        $results = $commentIO->getComments($args);
        break;
      case "POST":
        $results = $commentIO->createComment($args);
        break;
      case "DELETE":
        $results = $commentIO->deleteComment($args);
        break;
      default:
        $results = $io->methodNotAllowed($args);
        break;
    }
    break;
  case "users":
    //Get renewToken
    if (isset($path[1]) && trim($path[1]) != "") {
      $args["renewToken"] = $path[1];
    }
    switch ($verb) {
      case "GET":
        $results = $userIO->getUser($args);
        break;
      case "POST":
        if (isset($args["renewToken"])) {
          $results = $userIO->renewToken($args);
        } else {
          $results = $userIO->createUser($args);
        }
        break;
      default:
        $results = $io->methodNotAllowed($args);
        break;
    }
    break;
  case "reports":
    switch ($verb) {
      case "POST":
        $results = $reportIO->createReport($args);
        break;
      default:
        $results = $io->methodNotAllowed($args);
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
        $results = $messageIO->getMessages($args);
        break;
      case "POST":
        $results = $messageIO->createMessage($args);
        break;
      default:
        $results = $io->methodNotAllowed($args);
        break;
    }
    break;
  default:
    $results = $io->methodNotAllowed($args);
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
