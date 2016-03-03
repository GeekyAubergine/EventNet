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
    $dsn = 'mysql:'.DATABASE_HOST.';';
    $option = array(
    	PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    	PDO::ATTR_PERSISTENT => true
    );
    try {
        $this->pdo = new PDO($dsn, DATABASE_USERNAME, DATABASE_PASSWORD, $option);
    } catch (PDOException $e) {
         DB::throwException("Connect failed during construct");
    }
    try {
      $this->pdo->query("use " . DATABASE_NAME . ";");
    } catch (PDOException $e) {
      $this->pdo->query("create database " . DATABASE_NAME . "; use " . DATABASE_NAME . ";");
      $this->pdo->query(DATABASE_INIT);
    }
  }

  public function query($query, $bindings = null) {
    $results = [];

    $isSelectQuery = strpos(strtolower($query), 'select') !== false;

    try {
      if (isset($bindings)) {
        $result = $this->pdo->prepare($query);
        $result->execute($bindings);
      } else {
        $result = $this->pdo->query($query);
      }

      if ($isSelectQuery) {
        $result = $result->fetchAll(PDO::FETCH_ASSOC);
      } else {
        $result = $result->rowCount();
      }
    } catch (Exception $e) {
       error_log($e);
       $results["meta"]["ok"] = false;
       $results["debug"]["dbException"] = $e->getMessage();
    }

    $results["data"] = $result;
    if (!isset($results["meta"]["ok"])) {
      $results["meta"]["ok"] = true;
    }
    $results["debug"]["count"] = count($result);

    return $results;
  }

  public function close() {
    $this->pdo = null;
  }
}
