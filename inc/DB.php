<?php
// Class for DB exceptions
class DBException extends Exception {}

//Class used to perform all DB actions
class DB {
  private $pdo;

  //Throws a DB exception with given message
  private function throwException($msg = "No error message set") {
    throw new DBException($msg);
  }

  /*
    Constructor.
    Creates connection to the database, if the database does not exsist then
    it will attempt to create it and then use it.
  */
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

  //Queries the database using the given query and bindings, then returns the results
  public function query($query, $bindings = null) {
    $results = [];

    //Determines if the query is a select query
    $isSelectQuery = strpos(strtolower($query), 'select') !== false;

    try {
      if (isset($bindings)) {
        $result = $this->pdo->prepare($query);
        $result->execute($bindings);
      } else {
        $result = $this->pdo->query($query);
      }

      //If it is a select query it fetches the rows, else the result is the row count
      if ($isSelectQuery) {
        $result = $result->fetchAll(PDO::FETCH_ASSOC);
      } else {
        $result = $result->rowCount();
      }
    } catch (Exception $e) {
       error_log($e);
       $results["meta"]["ok"] = false;
       $results["debug"]["dbException"] = $e->getMessage();
       $results["data"] = [];
       return $results;
    }

    $results["data"] = $result;
    if (!isset($results["meta"]["ok"])) {
      $results["meta"]["ok"] = true;
    }
    $results["debug"]["count"] = count($result);

    return $results;
  }

  //Returns the last inserted id to the database
  public function getLastInsertedID() {
    return $this->pdo->lastInsertId();
  }

  public function close() {
    $this->pdo = null;
  }
}
