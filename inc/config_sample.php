<?php
/*
  Example config file. Please copy this to a new file called 'config.php' and
  set the variables to the values for your environment
*/

const DATABASE_HOST = '127.0.0.1';
const DATABASE_NAME = 'eventnet';
const DATABASE_USERNAME = 'default';
const DATABASE_PASSWORD = 'default';

const DEBUGGING = false;

//The number of reports a piece of content must have before it is hidden
const REPORTS_BEFORE_HIDDING_CONTENT = 5;

//Uploads folder
const UPLOADS_FOLDER = "uploads/";

ini_set('upload_max_filesize', '500M');
ini_set('post_max_size', '500M');
ini_set('max_input_time', 4000); // Play with the values
ini_set('max_execution_time', 4000); // Play with the values
