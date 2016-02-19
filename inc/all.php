<?php

if (!file_exists(__DIR__.'/config.php')) {
  echo ("Missing config.php");
}

include __DIR__.'/config.php';
include __DIR__.'/DB.php';
include __DIR__.'/IO.php';
include __DIR__.'/EventIO.php';
include __DIR__.'/PostIO.php';
include __DIR__.'/Comment.php';
include __DIR__.'/UserIO.php';
include __DIR__.'/MessageIO.php';
