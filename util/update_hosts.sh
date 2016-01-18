!#/bin/bash

echo "Please enter the IP address for eventnet"

read ipAddress

hostSetting="$ipAddress eventnet.com"

echo "Adding $hostSetting to /etc/hosts"

echo "192.168.1.158 eventnet.com" >> /etc/hosts

echo "etc/hosts now looks like such:"

cat /etc/hosts
