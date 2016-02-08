<?php

if (!file_exists(__DIR__.'/config.php')) {
  echo ("Missing config.php");
}

include __DIR__.'/config.php';
include __DIR__.'/db.php';
include __DIR__.'/io.php';
include __DIR__.'/io_temp.php';
include __DIR__.'/network.php';
include __DIR__.'/post.php';
include __DIR__.'/comment.php';
