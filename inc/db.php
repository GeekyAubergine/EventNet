<?php
class DBException extends Exception {}

class DB {
  private $pdo;

  private function throwException($msg = "No error message set") {
    throw new DBException(
      $msg//.' '.
      //$this->$pdo->getCode()
      // $this->$pdo->getInfo().' '.
      // $this->$pdo->errorInfo()[1].' '.
      // $this->$pdo->errorInfo()[2]
    );
  }

  public function __construct() {
    // CONNECT TO THE DATABASE SERVER
    $dsn = 'mysql:'.DATABASE_HOST.';dbname='. DATABASE_NAME .';';
    $option = array(
    	PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    	PDO::ATTR_PERSISTENT => true
    );
    try {
        $this->pdo = new PDO($dsn, DATABASE_USERNAME, DATABASE_PASSWORD, $option);
        $this->pdo->query("use eventnet;");
    } catch (PDOException $e) {
         DB::throwException("Connect failed during construct");
    }
  }

  public function close() {
    $this->pdo = null;
  }

  public function query($query) {
    try {
      $result = $this->pdo->query($query);

      if (strpos($query, 'select') !== false) {
        return $result->fetchAll(PDO::FETCH_ASSOC);
      }

      return $result->rowCount();
    } catch (Exception $e) {

    }

  }

}
