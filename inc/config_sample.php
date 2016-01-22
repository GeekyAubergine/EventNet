<?php

const DATABASE_HOST = '127.0.0.1';
const DATABASE_NAME = 'eventnet';
const DATABASE_USERNAME = 'default';
const DATABASE_PASSWORD = 'default';

const DEBUGGING = false;

/** Do not edit below**/
define("TABLE_NETWORK_INIT", 'CREATE TABLE IF NOT EXISTS network (
  network_id BIGINT NOT NULL AUTO_INCREMENT,
  network_name VARCHAR(256) NOT NULL,
  network_latitude DOUBLE NOT NULL,
  network_longitude DOUBLE NOT NULL,
  network_timestamp DATETIME NOT NULL,
  PRIMARY KEY (network_id))
  ENGINE = InnoDB;
  ');

define("USER_TABLE_INIT", 'CREATE TABLE IF NOT EXISTS user (
  user_id BIGINT NOT NULL AUTO_INCREMENT,
  user_display_name VARCHAR(128) NOT NULL,
  user_icon VARCHAR(512) NOT NULL,
  user_google_id VARCHAR(64),
  PRIMARY KEY (user_id))
  ENGINE = InnoDB;'
);

define("POST_TABLE_INIT", 'CREATE TABLE IF NOT EXISTS post (
  post_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  network_id BIGINT NOT NULL,
  post_content MEDIUMTEXT NOT NULL,
  post_latitude DOUBLE NOT NULL,
  post_longitude DOUBLE NOT NULL,
  post_timestamp DATETIME NOT NULL,
  PRIMARY KEY (post_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE NO ACTION,
  FOREIGN KEY (network_id) REFERENCES network(network_id) ON DELETE NO ACTION)
  ENGINE = InnoDB;'
);

define("MEDIA_TABLE_INIT", 'CREATE TABLE IF NOT EXISTS media (
  media_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  post_id BIGINT NOT NULL,
  media_source VARCHAR(255) NOT NULL,
  media_description VARCHAR(127) NULL,
  PRIMARY KEY (media_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE NO ACTION,
  FOREIGN KEY (post_id) REFERENCES post(post_id) ON DELETE NO ACTION)
  ENGINE = InnoDB;'
);

define("COMMENT_TABLE_INIT", 'CREATE TABLE IF NOT EXISTS comment (
  comment_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  post_id BIGINT NOT NULL,
  comment_content MEDIUMTEXT NOT NULL,
  comment_latitude DOUBLE NOT NULL,
  comment_longitude DOUBLE NOT NULL,
  comment_timestamp DATETIME NOT NULL,
  PRIMARY KEY (comment_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE NO ACTION,
  FOREIGN KEY (post_id) REFERENCES post(post_id) ON DELETE NO ACTION)
  ENGINE = InnoDB;
');

define("MESSAGE_TABLE_INIT", 'CREATE TABLE IF NOT EXISTS message (
  message_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  network_id BIGINT NOT NULL,
  message_content MEDIUMTEXT NOT NULL,
  message_latitude DOUBLE NOT NULL,
  message_longitude DOUBLE NOT NULL,
  message_timestamp DATETIME NOT NULL,
  PRIMARY KEY (message_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE NO ACTION,
  FOREIGN KEY (network_id) REFERENCES network(network_id) ON DELETE NO ACTION)
  ENGINE = InnoDB;
');

define("DEFAULT_DATA",   "insert into user
  (user_display_name, user_icon)
  values
  ('Anonymous', '/res/icons/default_user.svg');"
);

define("DATABASE_INIT", TABLE_NETWORK_INIT . USER_TABLE_INIT .
  POST_TABLE_INIT . MEDIA_TABLE_INIT . COMMENT_TABLE_INIT . MESSAGE_TABLE_INIT . DEFAULT_DATA);
