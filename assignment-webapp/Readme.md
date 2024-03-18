# Health Check RESTful API

## Introduction

This Node.js application provides a Health Check RESTful API to monitor the health of the application instance and alert us when something is not working as expected. It helps us improve user experience by avoiding routing user requests to unhealthy instances. The primary purpose of this API is to answer the question, "How to detect that a running service instance is unable to handle requests?"

The Healthz Check API performs the following checks:

1. **Database Connection**: Ensures that the application is connected to the database or can establish a connection during the healthz check.

2. **Downstream API Calls**: Verifies the availability of downstream APIs that the application depends on. An outage of downstream APIs, without which the application cannot complete user requests, will be detected.

## Users & User Accounts

### User Data Source

The application loads user account information from a CSV file located at `/opt/user.csv` during startup. It creates users based on the information provided in the CSV file. If a user account already exists, no updates are made. Deletion of user accounts is not supported.

### User Authentication

To access authenticated endpoints, users must provide a basic authentication token. The application supports only Token-Based authentication, not Session Authentication.

### API Implementation

The following API endpoints are implemented:

1. **Create Assignment**: Any authenticated user can add an assignment. Assignment points must be between 1 and 10.

2. **Update Assignment**: Only the user who created the assignment can update it. Users can use either the PUT API for updates.

3. **Delete Assignment**: Only the user who created the assignment can delete it.

Users should not be able to set values for `assignment_created` and `assignment_updated`. Any value provided for these fields will be ignored.

## Continuous Integration (CI) with GitHub Actions

We have implemented Continuous Integration (CI) using GitHub Actions to run integration tests for the application. The following steps are taken:

1. A GitHub Actions workflow is defined to run integration tests for each pull request.

2. A pull request can only be merged if the workflow executes successfully.

3. GitHub branch protection is enabled to prevent users from merging a pull request when the GitHub Actions workflow run fails.

4. The CI check runs the integration tests for the `/healthz` endpoint. These tests ensure that the healthz check API meets its success criteria.

## Integration Tests

Integration tests are implemented for the `/healthz` endpoint. These tests focus on verifying the success criteria and do not test for failures. To run these tests, a GitHub action installs and sets up MySQL and PostgreSQL instances, providing configuration to the application to connect to them.

## Getting Started

To get started with this Node.js application, follow these steps:

1. Clone this repository to your local machine.

2. Install the required dependencies using `npm install`.

3. Set up the database configuration in your environment.

4. Create the user account CSV file at `/opt/user.csv` or provide an alternative path as needed.

5. Run the application using `npm start`.

6. Access the API endpoints as described in the [API specifications](https://app.swaggerhub.com/apis-docs/csye6225-webapp/cloud-native-webapp/fall2023-a3).

# GitHub Action Workflow - Packer Status Check

This GitHub Action workflow is designed to ensure that your Packer templates are correctly formatted and validated before any Pull Requests are merged into the repository. It enforces strict quality control on Packer templates to maintain consistency and reliability.

## Purpose
The primary purposes of this workflow are:

1. Validate Packer Template: Ensure that Packer templates are correctly formatted. It checks for issues like missing closing brackets or syntax errors.

2. Prevent Merging of PRs with Invalid Templates: It does not allow Pull Requests to be merged if the Packer template is not correctly formatted.

3. Non-Building Workflow: Note that this workflow does not build the Amazon Machine Image (AMI). It's purely for checking the template's integrity.

4. Restrict to Organization Repository: The workflow is configured to run only on the organization's repository, not on any forked repositories.

## How to Test
To test this workflow, you can follow these steps:

1. Create a Pull Request with a Packer template that is not correctly formatted.
2. Observe that the workflow fails and prevents the PR from being merged.

---

# GitHub Action Workflow - Packer AMI Build

This GitHub Action workflow is responsible for building an Amazon Machine Image (AMI) only after a Pull Request is merged. It ensures that the AMI is built correctly with specific configurations.

## Purpose
The main objectives of this workflow are:

**Post-Merge Build** It runs only after a Pull Request is successfully merged into the main branch. It should not run when a Pull Request is raised.

**AMI Building and Sharing** The workflow builds an AMI in the DEV account and shares it with the DEMO account.

**Private AMI:** The resulting AMI is set to be private, ensuring that it's not accessible to the public.

**Debian 12 as Source Image:** The AMI uses Debian 12 as the source image.

**No Hard-Coded Values:** The Packer template is expected to be free of hard-coded values, promoting best practices for configuration management.

**No AWS Credentials:** The Packer template should not contain AWS credentials, following a secure approach to image building.

**Create a new Launch Template version:** After the AMI is successfully built, the workflow creates a new Launch Template version with the latest AMI ID for the autoscaling group.

**Instance Refresh for Auto-Scaling Group:** The workflow issues a command to the auto-scaling group to perform an instance refresh using the AWS CLI.

**Wait for Instance Refresh:** The GitHub Actions workflow must wait for the instance refresh to complete before exiting. The status of the GitHub Actions workflow must match the status of the instance refresh command.

## How to Test
To test this workflow, follow these steps:

1. Create a Pull Request with a correctly formatted Packer template.

2. After the PR is merged, observe that the workflow initiates and successfully builds the AMI with the specified configurations.

Please ensure that your GitHub Actions and AWS credentials are properly configured for these workflows to work seamlessly.

# Assignment - 06

This document provides a comprehensive guide to the setup and configuration of the web application. Please follow the instructions below to ensure a successful deployment and implementation of the application.

## Prerequisites

1. AWS account with necessary permissions to create EC2 instances, RDS instances, and other required resources.
2. Pulumi CLI installed and configured with appropriate credentials.
3. Familiarity with Systemd or an alternative tool for setting up autorun.
4. Understanding of how to manage cloud-init processes and userdata scripts on AWS.

## Setup Instructions

### 1. Launching the EC2 Instance and RDS

- Run Pulumi with the provided codebase to launch the EC2 instance and RDS. Ensure that the web application's database is the RDS instance created during this process.
- Make sure to configure the appropriate security groups and network settings for the EC2 instance and RDS instance to allow for communication between the two.

### 2. Configuring Autorun Using Systemd

- Utilize Systemd or any alternative tool of your choice to configure autorun for the web application.
- To ensure that the service starts after cloud-init has completed execution, set it to be required or wanted by cloud-init instead of the usual multi-user. Refer to https://serverfault.com/a/937723 for additional guidance on this process.

### 3. Integration Tests Setup

- For integration tests in your GitHub Actions, set up a local database on the EC2 instance that can be used for testing purposes.
- Configure the necessary scripts and environments for your GitHub Actions workflow to ensure smooth integration testing.

## Additional Notes

- Regularly monitor the application logs and AWS resources to ensure smooth functionality and performance.
- Document any changes made to the setup or configuration for future reference.
- Follow security best practices and ensure that all sensitive information is securely stored and accessed.

## Assignment Submission System - Assignment - 09 

### Submission Guidelines

1. **Making POST Requests**: Users can make POST requests to submit their assignments. The API endpoint for submission is:

    ```
    POST /:id/submission
    ```

    Include the necessary data in the request body according to the assignment requirements.

2. **Multiple Submission Attempts**: Users are allowed to submit multiple times for each assignment based on the specified retry configuration. The retry configuration is set externally and should be considered when submitting multiple times.

3. **Rejection on Exceeding Retries**: If a user exceeds the allowed number of retries for a specific assignment, the submission request will be rejected. Make sure to adhere to the retry configuration to avoid rejections.

4. **Rejection on Deadline Expiry**: Submissions will be rejected if the due date (deadline) for the assignment has passed. Ensure that your submission is made before the specified deadline.

5. **SNS Topic Notification**: Upon successful submission, the system will post the URL to the SNS (Simple Notification Service) topic. Additionally, user information, such as their email address, will be included in the notification.
