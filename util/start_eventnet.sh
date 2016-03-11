#!/bin/bash

pkill php
pkill nodes
pkill nodejs

echo "Starting Node.js server on port 8081"

nodejs server/server.js &
node server/server.js &

echo "Starting PHP Server on port 8080"

php -S 0:8080 -t . &
