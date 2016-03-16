<?php

class MediaIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getMessages($args) {
    if (!isset($args["mediaId"])) {
      return $this->io->badRequest("Event ID was missing", $args);
    }
    $query = "select * from message join user using(user_id) " .
    "WHERE event_id = :event ORDER BY message_timestamp desc";
    $bindings = [];
    $bindings[":event"] = $args["eventId"];

    return $this->io->queryDB($args, $query, $bindings);
  }

  private function getFileName($fileName) {
    $ending = pathinfo($fileName, PATHINFO_EXTENSION);
    return md5(time()) . md5($fileName) . '.' . $ending;
  }

  public function createMedia($args) {
    $results = [];
    $results["data"] = [];

    $array_name = "files";
    $folder = __DIR__ . "/.." . UPLOADS_FOLDER;

    if(isset($_FILES[$array_name])){
        $name_array = $_FILES[$array_name]['name'];
        $tmp_name_array = $_FILES[$array_name]['tmp_name'];
        $type_array = $_FILES[$array_name]['type'];
        $size_array = $_FILES[$array_name]['size'];
        $error_array = $_FILES[$array_name]['error'];
        for($i = 0; $i < count($tmp_name_array); $i++){

          $fileName = $this->getFileName($name_array[$i]);
          move_uploaded_file($tmp_name_array[$i], $folder . $fileName);

          $query = "insert into media (media_name) values (:name)";
          $bindings = [];
          $bindings[":name"] = $fileName;

          $this->io->queryDB($args, $query, $bindings);
          $id = $this->io->getLastInsertedID();

          array_push($results["data"], $id);
        }
    }
    $results["debug"] = [];
    $results["debug"]["files"] = $_FILES["files"];
    $results["debug"]["errors"] = $error_array;

    return $results;
  }

}
