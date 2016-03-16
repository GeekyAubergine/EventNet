<?php
/** Do not edit below**/
define("TABLE_NETWORK_INIT", 'CREATE TABLE IF NOT EXISTS event (
  event_id BIGINT NOT NULL AUTO_INCREMENT,
  event_name VARCHAR(256) NOT NULL,
  event_latitude DOUBLE NOT NULL,
  event_longitude DOUBLE NOT NULL,
  event_timestamp DATETIME NOT NULL,
  PRIMARY KEY (event_id))
  ENGINE = InnoDB;
  ');
define("USER_TABLE_INIT", "CREATE TABLE IF NOT EXISTS user (
  user_id BIGINT NOT NULL AUTO_INCREMENT,
  user_display_name VARCHAR(128) NOT NULL,
  user_icon VARCHAR(512) NOT NULL,
  user_google_id VARCHAR(64),
  user_twitter_id VARCHAR(64),
  user_access_token VARCHAR(64) NOT NULL,
  user_renew_token VARCHAR(64) NOT NULL,
  user_access_token_expire DATETIME NOT NULL,
  PRIMARY KEY (user_id))
  ENGINE = InnoDB;

  INSERT INTO USER (user_display_name, user_icon, user_access_token, user_renew_token, user_access_token_expire)
  values
  ('Anonymous', '/res/icons/default_user.svg', '1', '1', '9999-12-31 23:59:59');"
);
define("POST_TABLE_INIT", 'CREATE TABLE IF NOT EXISTS post (
  post_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  post_content MEDIUMTEXT NOT NULL,
  post_latitude DOUBLE NOT NULL,
  post_longitude DOUBLE NOT NULL,
  post_timestamp DATETIME NOT NULL,
  PRIMARY KEY (post_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE NO ACTION,
  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE NO ACTION)
  ENGINE = InnoDB;'
);
define("MEDIA_TABLE_INIT", 'CREATE TABLE IF NOT EXISTS media (
  media_id BIGINT NOT NULL AUTO_INCREMENT,
  media_name VARCHAR(80) NOT NULL,
  PRIMARY KEY (media_id))
  ENGINE = InnoDB;'
);
define("POST_TO_MEDIA_TABLE_INIT", 'CREATE TABLE IF NOT EXISTS post_to_media (
  post_to_media_id BIGINT NOT NULL AUTO_INCREMENT,
  media_id BIGINT NOT NULL,
  post_id BIGINT NOT NULL,
  PRIMARY KEY (post_to_media_id),
  FOREIGN KEY (media_id) REFERENCES media(media_id) ON DELETE NO ACTION,
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
define("REPORT_TABLE_INIT", 'CREATE TABLE IF NOT EXISTS report (
  report_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  post_id BIGINT,
  comment_id BIGINT,
  report_timestamp DATETIME NOT NULL,
  PRIMARY KEY (report_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE NO ACTION,
  FOREIGN KEY (post_id) REFERENCES post(post_id) ON DELETE NO ACTION,
  FOREIGN KEY (comment_id) REFERENCES comment(comment_id) ON DELETE NO ACTION)
  ENGINE = InnoDB;'
);
define("MESSAGE_TABLE_INIT", "CREATE TABLE IF NOT EXISTS message (
  message_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  message_content MEDIUMTEXT NOT NULL,
  message_latitude DOUBLE NOT NULL,
  message_longitude DOUBLE NOT NULL,
  message_timestamp DATETIME NOT NULL,
  PRIMARY KEY (message_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE NO ACTION,
  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE NO ACTION)
  ENGINE = InnoDB;
");

define("DATABASE_INIT", TABLE_NETWORK_INIT . USER_TABLE_INIT .
  POST_TABLE_INIT . MEDIA_TABLE_INIT . POST_TO_MEDIA_TABLE_INIT . COMMENT_TABLE_INIT . REPORT_TABLE_INIT . MESSAGE_TABLE_INIT);
