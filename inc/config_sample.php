<?php

const DATABASE_HOST = '127.0.0.1';
const DATABASE_NAME = 'eventnet';
const DATABASE_USERNAME = 'default';
const DATABASE_PASSWORD = 'default';

/** Do not edit **/

const SCHEMA_INIT = 'CREATE SCHEME `' . DATABASE_NAME . '` DEFAULT CHARACTER SET  utf8;' .
  'USE `eventnet`;';

const NETWORK_TABLE_INIT = 'CREATE TABLE `eventnet`.`network` ('.
  '`network_id` BIGINT NOT NULL AUTO_INCREMENT,'.
  '`network_name` VARCHAR(256) NOT NULL,'.
  '`network_latitude` DOUBLE NOT NULL,'.
  '`network_longitude` DOUBLE NOT NULL,'.
  '`network_timestamp` DATETIME NOT NULL,'.
  'RIMARY KEY (`network_id`))';

const DBINIT = SCHEMA_INIT . NETWORK_TABLE_INIT;
