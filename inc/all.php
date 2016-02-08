<?php

if (!file_exists(__DIR__.'/config.php')) {
  echo ("Missing config.php");
}

include __DIR__.'/config.php';
include __DIR__.'/db.php';
include __DIR__.'/io.php';
include __DIR__.'/eventIO.php';
include __DIR__.'/postIO.php';
include __DIR__.'/comment.php';
include __DIR__.'/userIO.php';
include __DIR__.'/messageIO.php';
