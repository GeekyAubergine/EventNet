<?php

include __DIR__.'/../../inc/all.php';

$io = new IO();
$eventIO = new EventIO($io);
$postIO = new PostIO($io);
$comment = new Comment($io);
$userIO = new UserIO($io);
$messageIO = new MessageIO($io);

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
        $results["meta"]["ok"] = false;
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
      default:
        $results["meta"]["ok"] = false;
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
        $results = $comment->getComments($args);
        break;
      case "POST":
        $results = $comment->createComment($args);
        break;
      default:
        $results["meta"]["ok"] = false;
        break;
    }
    break;
  case "users":
    switch ($verb) {
      case "POST":
        $results = $userIO->createUser($args);
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
        $results = $messageIO->getMessages($args);
        break;
      case "POST":
        $results = $messageIO->createMessage($args);
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
