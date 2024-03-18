# CloudCanvas

This project combines a Node.js application for assignment management with infrastructure as code (IaC) and serverless components for deploying and automating tasks. Below is an overview of each component and how they work together.

## Node.js Application (assignment-webapp)

The Node.js application provides functionality for managing assignments and health checks for a web application. Key features include:

- CRUD operations for assignments
- Assignment submission
- Health check endpoints to monitor database connection status

## Infrastructure as Code (IaC) (iac-pulumi)

Infrastructure is defined using Pulumi, enabling automated provisioning of resources on AWS and GCP clouds. This includes:

- Compute instances
- Networking configurations
- Databases
- Storage services

## Serverless Components (serverless)

The serverless component handles asynchronous tasks triggered by AWS SNS messages. Written in Node.js, it is deployed as an AWS Lambda function and performs the following tasks:

- Downloads files from GitHub releases using Axios
- Uploads files to Google Cloud Storage (GCS)
- Sends email notifications using Mailgun based on the download status
- Tracks email status in DynamoDB

## Workflow Overview

1. User interacts with the Node.js application for assignment management or health check.
2. Infrastructure as Code provisions resources on AWS and GCP clouds.
3. Asynchronous tasks are triggered by AWS SNS messages.
4. Serverless component handles tasks efficiently, including file downloads, uploads, and email notifications.
5. DynamoDB tracks the status of email notifications for monitoring and analytics.

## Usage

Ensure you have Node.js, Pulumi CLI, AWS CLI, and GCP CLI installed on your machine.

1. Clone the repository.
2. Navigate to the `node_app` directory and install dependencies using `npm install`.
3. Deploy infrastructure using Pulumi by navigating to the `infrastructure` directory and running `pulumi up`.
4. Deploy serverless component by navigating to the `serverless` directory and following the deployment instructions.

### Packer Configuration

The Packer configuration file defines the creation of a custom Amazon Machine Image (AMI) with the necessary dependencies and configurations for deploying the Node.js application. Key aspects of the configuration include:

- **AMI Customization**: The configuration specifies variables such as SSH username, instance type, and AMI users. It also defines filters for selecting the base AMI to use.
- **Provisioning Scripts**: Packer provisions the instance with necessary files, including the web application artifact, CloudWatch configuration, and setup script.
- **Setup Script**: The setup script installs required packages, sets up PostgreSQL, Node.js, npm, and other dependencies, and configures systemd for managing the Node.js service.

### Node.js Service Configuration

The Node.js service configuration file (`node.service`) defines the systemd service unit for managing the execution of the web application. Key aspects of the configuration include:

- **Service Description**: Describes the service as a Webapp Node.js Application.
- **Dependencies**: Ensures the service starts after network initialization and cloud-init.
- **Execution Settings**: Specifies the user, group, executable path, restart behavior, and working directory for the service.

### CloudWatch Agent Configuration

The CloudWatch Agent configuration file (`cloudwatch.config.json`) specifies the metrics, logs, and other data to collect and send to CloudWatch. Key aspects of the configuration include:

- **Metrics Collection**: Configures metrics collection settings such as metrics collection interval and aggregation interval.
- **Logs Collection**: Defines log files to collect, including their paths, log group names, and log stream names.
- **Metrics Collection Interval**: Sets the interval for collecting metrics.

### Setup Script (`demo.sh`)

The setup script is executed during the provisioning phase by Packer. It performs the following tasks:

1. Updates and upgrades system packages.
2. Installs PostgreSQL client, Node.js, npm, and other required packages.
3. Configures PostgreSQL, creates necessary database users and databases.
4. Sets up the Node.js application by unzipping artifacts, moving configuration files, installing dependencies, and configuring systemd.
5. Starts the Node.js service.
6. Installs and configures the CloudWatch Agent for metric and log collection.
7. Removes unnecessary artifacts and packages.

### Workflow Overview

1. Packer reads the configuration file and builds a custom AMI with the Node.js application and dependencies installed.
2. During AMI creation, Packer executes the setup script to configure the instance.
3. Once the AMI is created, the Node.js service is configured to run on instances launched from this AMI.
4. CloudWatch Agent is installed and configured to collect metrics and logs from the application.
5. Instances launched from the custom AMI run the Node.js application and send metrics and logs to CloudWatch.
6. Developers interact with the deployed application, which runs on instances provisioned using the custom AMI.

This workflow enables consistent deployment and management of the Node.js application with monitoring capabilities provided by CloudWatch.

### Github Action Workflow

1. **Integration Test Workflow:**
   - **Usage:** 
     - Use this workflow to automatically run integration tests for the CloudCanvas application whenever changes are made to the main branch or when a pull request targeting the main branch is opened or synchronized.
   - **Purpose:** 
     - Ensures that the application functions correctly and integrates smoothly with the PostgreSQL database.
   - **How to Trigger:** 
     - Make changes to the codebase and push them to the main branch or open/synchronize a pull request for the main branch.

2. **Packer AMI Build CI Workflow:**
   - **Usage:** 
     - Employ this workflow to automate the creation and deployment of Amazon Machine Images (AMIs) using Packer for the CloudCanvas application in AWS.
   - **Purpose:** 
     - Facilitates the seamless building and deployment of the application's infrastructure on AWS.
   - **How to Trigger:** 
     - Push changes to the main branch to initiate the workflow.

3. **Packer Status Check CI Workflow:**
   - **Usage:** 
     - Utilize this workflow to validate the Packer configuration and ensure its correctness and adherence to standards.
   - **Purpose:** 
     - Validates the Packer configuration to avoid potential issues and ensure smooth deployment.
   - **How to Trigger:** 
     - Open or synchronize a pull request targeting the main branch to trigger the workflow.

### Technologies:
- **Pulumi**: A modern infrastructure as code platform that allows developers to define cloud infrastructure using familiar programming languages such as JavaScript, TypeScript, Python, and Go.
- **Node.js**: A JavaScript runtime used for building scalable network applications.
- **Express.js**: A web application framework for Node.js used for building web APIs and handling HTTP requests.
- **Sequelize**: An ORM (Object-Relational Mapping) for Node.js used with SQL databases like PostgreSQL.
- **PostgreSQL (pg)**: A powerful, open-source relational database system used for data storage.
- **Node-statsd**: A Node.js client for Etsy's StatsD, used for sending application metrics to StatsD servers.
- **mailgun-js**: A Node.js client library for the Mailgun API, used for sending and managing emails.

### Development and Testing:
1. **Nodemon**: A utility that automatically restarts the Node.js application when file changes are detected during development.
2. **Jest**: A JavaScript testing framework used for writing unit and integration tests.
3. **Supertest**: A library for testing HTTP servers in Node.js, often used with Jest for API testing.

### Cloud Infrastructure:
- **aws-sdk**: A software development kit for AWS (Amazon Web Services) providing APIs for various AWS services.
- **@google-cloud/storage**: A Node.js client library for Google Cloud Storage, allowing interaction with Google Cloud Storage buckets.

### Other Utility Libraries:
- **app-root-path**: A module for getting the root path of the application.
- **body-parser**: A middleware for parsing incoming request bodies in Express.js.
- **lodash**: A JavaScript utility library providing functions for manipulating arrays, objects, and strings.
- **fs**: A core Node.js module used for file system operations.
- **path**: A core Node.js module providing utilities for working with file and directory paths.
- **bcrypt**: A library for hashing passwords securely, commonly used for user authentication.
- **dotenv**: A module for loading environment variables from a `.env` file into `process.env`.
- **Winston**: A logging library for Node.js used for logging application events and errors.
- **uuid**: A library for generating universally unique identifiers (UUIDs).
- **axios**: A promise-based HTTP client for Node.js and browsers, used for making HTTP requests to external resources.

These technologies collectively enable the development, testing, and deployment of the CloudCanvas application.
