<?php

/*
  Class controlling all media funcionality
*/
class MediaIO {

  private $io;

  public function __construct($io) {
    $this->io = $io;
  }

  //Used by primary router, calls approriate functions within this class
  public function getMedia($args) {
    if (isset($args["mediaId"])) {
      return $this->io->methodNotImplemented($args);
    }

    if (isset($args["postId"])) {
      return $this->getMediaForPostId($args);
    }

    return $this->io->badRequest($args, "MediaId or PostId must be set");
  }

  //Returns the media for a given media id
  private function getMediaForPostId($args) {
    $query = "SELECT media_name FROM media WHERE post_id = :post";
    $bindings = [];
    $bindings[":post"] = $args["postId"];
    return $this->io->queryDB($args, $query, $bindings);
  }

  /*
    Resizes a given image and saves it to the given destiantaion.
    If the file is of a known type it will be resized, if it is not then it is ignored.
  */
  private function resizeImage($source, $destination) {
    $ending = strtolower(pathinfo($source, PATHINFO_EXTENSION));

    switch ($ending) {
      case 'jpg':
      case 'jpeg':
        $createImageFunction = 'imagecreatefromjpeg';
        $saveImageFunction = 'imagejpeg';
        $imageExtension = '.jpg';
        $exif = exif_read_data($source);
        $orientation = $exif['Orientation'];
        break;
      case 'png':
        $createImageFunction = 'imagecreatefrompng';
        $saveImageFunction = 'imagepng';
        $imageExtension = '.png';
        break;
      default:
        return;
    }

    //Create image from appropriate file type
    $image = $createImageFunction($source);
    list($width, $height) = getimagesize($source);

    $newWidth = 1024;

    if ($width <= $newWidth) {
      $newHeight = ($height / $width) * $newWidth;
      $temp = imagecreatetruecolor($newWidth, $newHeight);
      imagecopyresampled($temp, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
      $image = $temp;
    }

    if (isset($orientation)) {
      $rotation = 0;

      switch($orientation) {
        case 3:
          $rotation = 180;
          break;

        case 6:
          $rotation = -90;
          break;

        case 8:
          $rotation = 90;
          break;
      }

      $image = imagerotate($image, $rotation, 0);
    }

    //Save image
    $saveImageFunction($image, $destination);
  }

  //Returns a 'random' new file name for the image
  private function getNewFileName($fileName) {
    $ending = pathinfo($fileName, PATHINFO_EXTENSION);
    $fileName = md5(time()) . md5($fileName);
    return $fileName . '.' . $ending;
  }

  //Saves the uploaded files (if they exist) and links them to the given post.
  public function saveMediaForPost($args, $postId) {
    $array_name = "files";
    $physicalSaveFolder = $_SERVER['DOCUMENT_ROOT'] . "/" . UPLOADS_FOLDER;
    $dbSaveFolder = UPLOADS_FOLDER;
    $imageRegex = '/\.(png|jpg|jpeg)$/i';

    if(isset($_FILES[$array_name])){
        $name_array = $_FILES[$array_name]['name'];
        $tmp_name_array = $_FILES[$array_name]['tmp_name'];
        $type_array = $_FILES[$array_name]['type'];
        $size_array = $_FILES[$array_name]['size'];
        $error_array = $_FILES[$array_name]['error'];
        for($i = 0; $i < count($tmp_name_array); $i++){
          $fileName = $this->getNewFileName($name_array[$i]);

          if (move_uploaded_file($tmp_name_array[$i], $physicalSaveFolder . $fileName)) {

            //If image, resize
            if (function_exists("imagecreatefromjpeg") && function_exists("imagecreatefrompng") && preg_match($imageRegex, $fileName)) {
              $this->resizeImage($physicalSaveFolder . $fileName, $physicalSaveFolder . $fileName);
            }

            $query = "insert into media (media_name, post_id) values (:name, :post)";
            $bindings = [];
            $bindings[":post"] = $postId;
            $bindings[":name"] = $dbSaveFolder . $fileName;

            $this->io->queryDB($args, $query, $bindings);
          }
        }
    }
  }

  //Deletes all media for a given post id
  public function deleteMediaForPost($args) {
    $physicalSaveFolder = $_SERVER['DOCUMENT_ROOT'] . UPLOADS_FOLDER;
    $media = $this->getMediaForPostId($args)["data"];

    foreach ($media as $fileName) {
      $fileName = $fileName["media_name"];
      $fileName = substr($fileName, strpos($fileName, "/", 2));

      unlink($physicalSaveFolder . $fileName);
    }

    $query = "DELETE FROM media WHERE post_id = :post";
    $bindings = [];
    $bindings[":post"] = $args["postId"];

    return $this->io->queryDB($args, $query, $bindings);
  }

}
