<?php

include __DIR__.'/io.php';

if (!file_exists(__DIR__.'/config.php')) {
  echo ("Missing config.php");
}

include __DIR__.'/config.php';
include __DIR__.'/db.php';
