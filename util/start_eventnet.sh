#!/bin/bash

pkill php
pkill node
pkill nodejs

echo "Starting Node.js server on port 8081"

node server/server.js &
nodejs server/server.js &

echo "Starting PHP Server on port 8080"

php -S 0:8080 -t . &
