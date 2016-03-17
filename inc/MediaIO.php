<?php

class MediaIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  public function getMedia($args) {
    if (isset($args["mediaId"])) {
      return $this->io->methodNotImplemented($args);
    }

    if (isset($args["postId"])) {
      return $this->getMediaForPostId($args);
    }

    return $this->io->badRequest($args, "MediaId or PostId must be set");
  }

  private function getMediaForPostId($args) {
    $query = "SELECT media_name FROM post_to_media JOIN media USING(media_id) WHERE post_id = :post";
    $bindings = [];
    $bindings[":post"] = $args["postId"];
    return $this->io->queryDB($args, $query, $bindings);
  }

  private function getFileName($fileName) {
    $ending = pathinfo($fileName, PATHINFO_EXTENSION);
    $fileName = md5(time()) . md5($fileName);
    return $fileName . '.' . $ending;
  }

  public function createMedia($args) {
    $results = [];
    $results["data"] = [];

    $array_name = "files";
    $physicalSaveFolder = $_SERVER['DOCUMENT_ROOT'] . UPLOADS_FOLDER;
    $dbSaveFolder = UPLOADS_FOLDER;

    if(isset($_FILES[$array_name])){
        $name_array = $_FILES[$array_name]['name'];
        $tmp_name_array = $_FILES[$array_name]['tmp_name'];
        $type_array = $_FILES[$array_name]['type'];
        $size_array = $_FILES[$array_name]['size'];
        $error_array = $_FILES[$array_name]['error'];
        for($i = 0; $i < count($tmp_name_array); $i++){

          $fileName = $this->getFileName($name_array[$i]);

          move_uploaded_file($tmp_name_array[$i], $physicalSaveFolder . $fileName);

          $query = "insert into media (media_name) values (:name)";
          $bindings = [];
          $bindings[":name"] = $dbSaveFolder . $fileName;

          $this->io->queryDB($args, $query, $bindings);
          $id = $this->io->getLastInsertedID();

          array_push($results["data"], $id);
        }
    }
    $results["debug"] = [];
    $results["debug"]["files"] = $_FILES["files"]['name'];
    $results["debug"]["errors"] = $error_array;

    return $results;
  }

}
