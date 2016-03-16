#!/bin/bash

pkill php
pkill node
pkill nodejs

echo "Making folders"

mkdir -p "uploads"

echo "Starting Node.js server on port 8081"

nodejs server/server.js &
node server/server.js &

echo "Starting PHP Server on port 8080"

php -S 0:8080 -t . &
