#!/bin/bash

# export PGDATABASE=postgres
# export PGUSER=postgres 
# export PGPASSWORD=postgres 
# export PGPORT=5432 
# export PORT=3000
# export PGHOST=localhost

# echo $PGDATABASE
# echo $PGUSER
# echo $PGPASSWORD
# echo $PGPORT
# echo $PGHOST
# echo $PORT

# Update and upgrade packages
sudo apt update
sudo apt upgrade -y

# Install PostgreSQL and related packages
# sudo apt install -y postgresql postgresql-contrib
sudo apt-get install -y postgresql-client

# Start and enable PostgreSQL service
# sudo systemctl start postgresql
# sudo systemctl enable postgresql

# Install Node.js and npm
sudo apt install -y nodejs
sudo apt install -y npm

# Check Node.js version
nodejs -v

# Configure PostgreSQL: set password, create database, and create user
# sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
# sudo -u postgres psql -c "CREATE USER apurvazawar WITH PASSWORD 'postgres';"
# sudo -u postgres psql -c "CREATE DATABASE apurvazawar;"
# sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE "apurvazawar" to apurvazawar;"

#user added
sudo groupadd csye6225
sudo useradd -s /bin/false -g csye6225 -d /opt/csye6225 -m csye6225

# unzip and remove artifacts .zip
sudo apt install unzip
sudo mkdir /opt/csye6225/webapp/
sudo mv /tmp/webapp.zip /opt/csye6225/
sudo unzip /opt/csye6225/webapp.zip -d /opt/csye6225/webapp
sudo rm -rf /opt/csye6225/webapp.zip

# mv cloudwatch config
sudo mv /tmp/cloudwatch.config.json /opt/csye6225/

#Install unified cloud watach
echo 'Downloading the CloudWatch Agent package...'
sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/debian/amd64/latest/amazon-cloudwatch-agent.deb
echo 'Installing the CloudWatch Agent package...'
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
echo 'Enabling the CloudWatch Agent service...'
sudo rm ./amazon-cloudwatch-agent.deb

#remove artifacts
sudo rm -rf /opt/csye6225/webapp/artifacts

# install dependencies
cd /opt/csye6225/webapp
sudo npm install

#change permissions of webapp
sudo chown -R csye6225:csye6225 /opt/csye6225/webapp
sudo chmod -R 700 /opt/csye6225/webapp
sudo -u csye6225 bash

# Setting up systemd
sudo cp ./service/node.service /etc/systemd/system/node.service
sudo systemctl daemon-reload
sudo systemctl enable node.service
sudo systemctl start node.service
sudo systemctl restart node.service
journalctl -u node.service -b

# Start the Unified CloudWatch Agent 
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl start amazon-cloudwatch-agent

# Remove git files
sudo apt-get remove -y git
