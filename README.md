# EventNet
An open source social networking website built for my second year WebScript unit.

### Install instructions

This requires PHP, MySQL, Node.js and npm.

To install the required packages for Node.js run the command `npm install` from the root folder of the server.

In the folder 'inc' copy the 'config_sample.php' to a new file 'config.php' and update the fields at the top to use the settings for you database.

In the root folder of your server run the command `sh util/start_eventnet.sh` to start the servers.

### Client instructions

On any clients connecting to EventNet, if EventNet is not running on a server and a domain the hosts file must be updated to point eventnet.com to the ip address of the server running EventNet.
