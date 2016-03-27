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
    $query = "SELECT media_name FROM media WHERE post_id = :post";
    $bindings = [];
    $bindings[":post"] = $args["postId"];
    return $this->io->queryDB($args, $query, $bindings);
  }

  function resizeImage($source, $destination) {
    $ending = strtolower(pathinfo($source, PATHINFO_EXTENSION));

    switch ($ending) {
      case 'jpg':
      case 'jpeg':
        $createImageFunction = 'imagecreatefromjpeg';
        $saveImageFunction = 'imagejpeg';
        $imageExtension = '.jpg';
        break;
      case 'png':
        $createImageFunction = 'imagecreatefrompng';
        $saveImageFunction = 'imagepng';
        $imageExtension = '.png';
        break;
      case 'gif':
        $createImageFunction = 'imagecreatefromgif';
        $saveImageFunction = 'imagegif';
        $imageExtension = '.gif';
        break;
      default:
        throw new Exception('Unknown image type.');
    }

    //Create image from appropriate file type
    $img = $createImageFunction($source);
    list($width, $height) = getimagesize($source);

    $newWidth = 1024;

    if ($width <= $newWidth) {
      $newHeight = ($height / $width) * $newWidth;
      $temp = imagecreatetruecolor($newWidth, $newHeight);
      imagecopyresampled($temp, $img, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

      //Save image
      $saveImageFunction($temp, $destination);
    }
  }

  private function getNewFileName($fileName) {
    $ending = pathinfo($fileName, PATHINFO_EXTENSION);
    $fileName = md5(time()) . md5($fileName);
    return $fileName . '.' . $ending;
  }

  public function saveMediaForPost($args, $postId) {
    $array_name = "files";
    $physicalSaveFolder = $_SERVER['DOCUMENT_ROOT'] . UPLOADS_FOLDER;
    $dbSaveFolder = UPLOADS_FOLDER;
    $imageRegex = '/\.(png|jpg|jpeg|gif)$/i';

    if(isset($_FILES[$array_name])){
        $name_array = $_FILES[$array_name]['name'];
        $tmp_name_array = $_FILES[$array_name]['tmp_name'];
        $type_array = $_FILES[$array_name]['type'];
        $size_array = $_FILES[$array_name]['size'];
        $error_array = $_FILES[$array_name]['error'];
        for($i = 0; $i < count($tmp_name_array); $i++){
          $fileName = $this->getNewFileName($name_array[$i]);

          move_uploaded_file($tmp_name_array[$i], $physicalSaveFolder . $fileName);

          //If image, resize
          if (preg_match($imageRegex, $fileName)) {
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
