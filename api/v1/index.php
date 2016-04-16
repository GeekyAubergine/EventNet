<?php

include __DIR__.'/../../inc/all.php';

//Create instance of IO and extract request variables
$io = new IO();
$verb = $_SERVER['REQUEST_METHOD'];
switch ($verb) {
  case "POST":
    $args = $io->extractVariables(INPUT_POST);
    break;
  default:
    $args = $io->extractVariables(INPUT_GET);
}

//Preare results array and prepare path
$results = [];
$results["meta"]["ok"] = true;
$path = explode('/', ltrim($_SERVER['PATH_INFO'], "/"));

switch ($path[0]) {
  case "events":
    $eventIO = new EventIO($io);
    //Get eventId
    if (isset($path[1]) && trim($path[1]) != "") {
      $args["eventId"] = $path[1];
    }
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
    $postIO = new PostIO($io);
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
      case "PUT":
        $results = $postIO->updatePost($args);
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
    $commentIO = new CommentIO($io);
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
      case "PUT":
        $results = $commentIO->updateComment($args);
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
    $userIO = new UserIO($io);
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
    $reportIO = new ReportIO($io);
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
    $messageIO = new MessageIO($io);
    //Get message id
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
  case "media":
    $mediaIO = new MediaIO($io);
    switch ($verb) {
      case "GET":
        $results = $mediaIO->getMedia($args);
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

//If data or debug is not set then it is set to an empty array
if (!isset($results["data"])) {
  $results["data"] = [];
}
if (!isset($results["debug"])) {
  $results["debug"] = [];
}

//If debugging mode active, add more debugging information, otherwise remove all debugging information
if (DEBUGGING) {
  $results["debug"]["request"] = $args;
  $results["debug"]["verb"] = $verb;
  $results["debug"]["path"] = $path;
  $results["debug"]["in"] = $args;
  $results["debug"]["INPUT_GET"] = $io->extractVariables();
  $results["debug"]["INPUT_POST"] = $io->extractVariables(INPUT_POST);
  $results["debug"]["request"] = $_REQUEST;
} else {
  unset($results["debug"]);
}

$io->sendResults($results);
