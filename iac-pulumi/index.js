const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const gcp = require("@pulumi/gcp");
const config = new pulumi.Config();
const awsConfig = new pulumi.Config('aws');
const gcpConfig = new pulumi.Config('gcp');

const cidrBlock = config.require("cidrBlock");
const keyName = config.require("keyName");
const subnetMask = config.require("subnetMask");
const dbIngressRules = config.getObject("dbIngressRules");
const lbIngressRules = config.getObject("lbIngressRules");
const instanceClass = config.require("instanceClass");
const engine = config.require("engine");
const allocatedStorage = config.require("allocatedStorage");
const engineVersion = config.require("engineVersion");
const dbName = config.require("dbName");
const dbInstanceIdentifier = config.require("dbInstanceIndentifier");
const dbInstanceUsername = config.require("dbInstanceUsername");
const dbParameterGroupFamily = config.require("dbParameterGroupFamily");
const amiOwnersString = config.require("amiOwners");
const instanceType = config.require("instanceType");
const ENVIRONMENT = config.require("ENVIRONMENT");
const port = config.require("port");
const dbInstancePassword= config.require("dbInstancePassword");
const linuxUser = config.require("linuxUser");
const domainName = config.require("domainName");
const bucketName = config.require("bucketName");
const mailgunApiKey = config.require("mailgunApiKey");
const stackName = pulumi.getStack();

// Create a new VPC
const vpc = new aws.ec2.Vpc(`${stackName}_VPC`, {
  cidrBlock: cidrBlock,
  tags: {
    Name: `${stackName}_VPC`,
  },
});

const publicSubnets = [];
const privateSubnets = [];

async function main() {
  let availabilityZones = [];

  // Create a public and private subnet in each availability zone
  const azs = await aws.getAvailabilityZones({
    state: "available", // You can filter by availability zone state if needed
  });

  if (azs.names.length >= 3) {
    availabilityZones = azs.names.slice(0, 3);
  } else {
    availabilityZones = azs.names;
  }

  const ipAddress = cidrBlock.split("/")[0];
  const address = ipAddress.split(".");

  availabilityZones.forEach((az, index) => {
    const publicSubnet = new aws.ec2.Subnet(`Public-Subnet_0${index + 1}`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: `${address[0]}.${address[1]}.${index}.${address[3]}/${subnetMask}`, 
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `Public-Subnet_0${index + 1}`,
      },
    },
    { dependsOn: [vpc] });
    publicSubnets.push(publicSubnet);

    const privateSubnet = new aws.ec2.Subnet(`Private-Subnet_0${index + 1}`, {
      vpcId: vpc.id,
      availabilityZone: az,
      cidrBlock: `${address[0]}.${address[1]}.${index + 3}.${address[3]}/${subnetMask}`,
      tags: {
        Name: `Private-Subnet_0${index + 1}`,
      },
    },
    { dependsOn: [vpc] });
    privateSubnets.push(privateSubnet);
  });

  // Create an Internet Gateway and attach it to the VPC
  const internetGateway = new aws.ec2.InternetGateway(
    `${stackName}_Internet-Gateway`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Internet-Gateway`,
      },
    },
    { dependsOn: [vpc] }
  );

  // Create public and private route tables
  const publicRouteTable = new aws.ec2.RouteTable(
    `${stackName}_Public-Route-Table`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Public-Route-Table`,
      },
    },
    { dependsOn: [vpc] }
  );

  const privateRouteTable = new aws.ec2.RouteTable(
    `${stackName}_Private-Route-Table`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${stackName}_Private-Route-Table`,
      },
    },
    { dependsOn: [vpc] }
  );

  // Create a route in the public route table to the Internet Gateway
  new aws.ec2.Route(`${stackName}_Public-Route`, {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: internetGateway.id,
    tags: {
      Name: `${stackName}_Public-Route`,
    },
  }, {
    dependsOn: [publicRouteTable, internetGateway]
  });

  // Associate public and private subnets with their respective route tables
  publicSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(
      `${stackName}_publicRTAssociation_0${index + 1}`,
      {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
        tags: {
          Name: `${stackName}_publicRTAssociation_0${index + 1}`,
        },
      },
      {dependsOn:[publicRouteTable]}
    );
  });

  privateSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(
      `${stackName}_privateRTAssociation_0${index + 1}`,
      {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
        tags: {
          Name: `${stackName}_privateRTAssociation_0${index + 1}`,
        },
      },
      {dependsOn:[privateRouteTable]}
    );
  });

  const privateSubnetsGroup = new aws.rds.SubnetGroup("private_subnets_group", {
    subnetIds: privateSubnets.filter((subnet) => subnet.id),
    tags: {
        Name: "Private Subnets Group",
    },
  });

  //LoadBalancer security group
  const loadBalancerSecurityGroup = new aws.ec2.SecurityGroup(
    "loadBalancerSecurityGroup",
    {
      vpcId: vpc.id,
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
      ingress: lbIngressRules,
    },
    { dependsOn: [vpc] }
  );

  // Create a security group allowing inbound access over port 80 and outbound
  // access to anywhere.
  const applicationSecurityGroup = new aws.ec2.SecurityGroup(
    "appSecurityGroup",
    {
      vpcId: vpc.id,
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
      ingress: [
        { fromPort: 22, toPort: 22, protocol: "tcp", cidrBlocks: ["0.0.0.0/0"] },
        { fromPort: 3000, toPort: 3000, protocol: "tcp", securityGroups: [loadBalancerSecurityGroup.id]}
      ],
      source_security_group_id: loadBalancerSecurityGroup.id,
    },
    { dependsOn: [vpc, loadBalancerSecurityGroup] }
  );

  // Create a DB security group
  const databaseSecurityGroup = new aws.ec2.SecurityGroup(
    "databaseSecurityGroup",
    {
      description: "DB Security Group for RDS",
      vpcId: vpc.id,
      egress: [
        { fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] },
      ],
      ingress: dbIngressRules,
      source_security_group_id: applicationSecurityGroup.id
    },
    { dependsOn: [vpc, applicationSecurityGroup] }
  )

  // Step 2: Create RDS Parameter Group
  const dbParameterGroup = new aws.rds.ParameterGroup("db-parameter-group", {
    family: dbParameterGroupFamily,
    parameters: [
      {
        name: "client_encoding",
        value: "UTF8"
      }
    ],
  });

  // Step 3: Create RDS Instance
  // If you want to specify "Multi-AZ deployment: No" when creating your RDS instance in the Pulumi code,
  // you can simply omit the availabilityZone and backupRetentionPeriod properties. 
  // creating the RDS instance with "Multi-AZ deployment: No"
  const dbInstance = new aws.rds.Instance(`${stackName}_db-instance`, {
    instanceClass: instanceClass, // Use the cheapest one
    allocatedStorage: allocatedStorage,
    dbSubnetGroupName: privateSubnetsGroup.name,
    engine: engine, // Use "postgres" for PostgreSQL
    engineVersion: engineVersion,
    // name: "postgres", // DB instance Identifier
    dbName: dbName,
    identifier: dbInstanceIdentifier,
    username: dbInstanceUsername,
    password: dbInstancePassword,
    skipFinalSnapshot: true,
    publiclyAccessible: false,
    vpcSecurityGroupIds: [databaseSecurityGroup.id],
    parameterGroupName: dbParameterGroup.name,
    userDataReplaceOnChange: true,
    },
  {dependsOn: [privateSubnetsGroup, databaseSecurityGroup, dbParameterGroup]});

  // Create an SNS topic
  const snsTopic = new aws.sns.Topic("submissionUpdate", {
    tags: {
      Name: "submissionUpdate",
    },
  });

  // Step 4: User Data
  const userDataScript = pulumi.all([dbInstance.address, dbInstance.username, dbInstance.password, dbInstance.dbName, dbInstance.port]).apply(
    values => 
    pulumi.interpolate`#!/bin/bash
    sudo -u ${linuxUser} bash
    cd /opt/csye6225/webapp

    sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/csye6225/cloudwatch.config.json \
    -s

    sudo systemctl enable amazon-cloudwatch-agent
    sudo systemctl start amazon-cloudwatch-agent

    sudo rm -rf .env
    sudo touch .env
    sudo echo "HOSTNAME=${values[0]}">> /opt/csye6225/webapp/.env
    sudo echo "DBUSER=${values[1]}">> /opt/csye6225/webapp/.env
    sudo echo "DBPASSWORD=${values[2]}">> /opt/csye6225/webapp/.env
    sudo echo "DATABASE=${values[3]}">> /opt/csye6225/webapp/.env
    sudo echo "DBPORT=${values[4]}">> /opt/csye6225/webapp/.env
    sudo echo "ENVIRONMENT=${ENVIRONMENT}">> /opt/csye6225/webapp/.env
    sudo echo "PORT=${port}">> /opt/csye6225/webapp/.env
    sudo echo "SNSTOPICARN=${snsTopic.arn}">> /opt/csye6225/webapp/.env
    sudo echo "AWS_REGION=${awsConfig.require('region')}">> /opt/csye6225/webapp/.env
    source /opt/csye6225/webapp/.env
    `
);

  // Find the latest AMI.
  const amiOwnersList = amiOwnersString.split().map(owner => owner.trim());
  const ami = pulumi.output(
    aws.ec2.getAmi({
      owners: amiOwnersList,
      mostRecent: true,
    })
  );

  // Create an IAM role for use with CloudWatch Agent
  const instanceIamRole = new aws.iam.Role('InstanceIamRole', {
    assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
                Service: 'ec2.amazonaws.com',
            },
        }],
    }),
  });

  // Attach the CloudWatchAgentServerPolicy to the IAM role
  const cloudWatchAgentPolicyAttachment = new aws.iam.PolicyAttachment(
    "CloudWatchAgentPolicyAttachment",
    {
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      roles: [instanceIamRole.name],
    },
    {dependsOn: [instanceIamRole]}
  );

  const snsPublishPolicy = new aws.iam.Policy("SNSPublishPolicy", {
    policy: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: "sns:Publish",
          Resource: snsTopic.arn,
        },
      ],
    },
    roles: [instanceIamRole.name],
    },
    {dependsOn: [instanceIamRole, snsTopic]}
  );

  const snsPublishPolicyAttachment = new aws.iam.RolePolicyAttachment(
    "SNSPublishPolicyAttachment",
    {
      role: instanceIamRole.name,
      policyArn: snsPublishPolicy.arn,
    },
    {dependsOn: [instanceIamRole, snsPublishPolicy]}
  );

  // Create an instance profile and attach the IAM role.
  const instanceProfile = new aws.iam.InstanceProfile("InstanceProfile", {
    role: instanceIamRole.name,
  },
  {dependsOn: [instanceIamRole]}
  );

  // Create and launch an Amazon Linux EC2 instance into the public subnet.
  // const instance = new aws.ec2.Instance(
  //   "instance",
  //   {
  //     ami: ami.id,
  //     instanceType: instanceType,
  //     subnetId: publicSubnets[0].id,
  //     vpcSecurityGroupIds: [applicationSecurityGroup.id],
  //     keyName: keyName,
  //     iamInstanceProfile: instanceProfile.name,
  //     userData: userDataScript,
  //   },
  //   { dependsOn: [applicationSecurityGroup] }
  // );

  // Create Launch Template
  const launchTemplate = new aws.ec2.LaunchTemplate("webAppLaunchTemplate", {
    imageId: ami.id,
    instanceType: instanceType,
    keyName: keyName,
    userData: userDataScript.apply(data => Buffer.from(data).toString("base64")),
    iamInstanceProfile: {
      name: instanceProfile.name,
    },
    updateDefaultVersion: true,
    networkInterfaces:[{
      associatePublicIpAddress: true,
      securityGroups: [applicationSecurityGroup.id],
      deleteOnTermination: true
    }],
    blockDeviceMappings: [{
      deviceName: "/dev/xvda",
      ebs: {
        deleteOnTermination: true,
        volumeSize: 25,
        volumeType: "gp2"
      }
    }],
    disableApiTermination: false,
    tagSpecifications: [
      {
        resourceType: "instance",
        tags: [
          {
              "Key": "Name",
              "Value": "asg_launch_config"
          }
        ]
      },
    ],
    tags: {
      Name: "asg_launch_config"
    },
  },
  { dependsOn: [applicationSecurityGroup, instanceProfile]}
  );

  const targetGroup = new aws.lb.TargetGroup(`${stackName}-target-group`, {
    port: port,
    protocol: "HTTP",
    targetType: "instance",
    associatePublicIpAddress: true,
    vpcId: vpc.id,
    healthCheck: {
      enabled: true,
      path: "/healthz",
      port: port,
      healthyThreshold: 2,
      unhealthyThreshold: 2,
      timeout: 6,
      interval: 30,
    }
  },{dependsOn: [vpc]});

  const publicSubnetIds = publicSubnets.map((subnet) => subnet.id)

  // Create Auto Scaling Group
  const autoScalingGroup = new aws.autoscaling.Group("webAppAutoScalingGroup", {
    desiredCapacity: 1,
    maxSize: 3,
    minSize: 1,
    vpcZoneIdentifiers: publicSubnetIds, // specify your subnet IDs
    launchTemplate: {
      id: launchTemplate.id,
      version: "$Latest",
    },
    tags: [
      {
        key: "Name",
        propagateAtLaunch: true,
        value: "webapp",
      },
    ],
    cooldown: 60,
    targetGroupArns: [targetGroup.arn],
    forceDelete: true,
    defaultCooldown: 60,
    instanceProfile: instanceProfile.name,
  }, 
  { dependsOn: [publicSubnets, targetGroup, launchTemplate]});

  const alb = new aws.lb.LoadBalancer(`${stackName}-alb`, {
    internal: false, // Set to true for internal ALB
    loadBalancerType: 'application',
    securityGroups: [loadBalancerSecurityGroup.id],
    subnets: publicSubnetIds,
    enableDeletionProtection: false
  },
  {dependsOn: [loadBalancerSecurityGroup, publicSubnets]});
  
  const certificate = await aws.acm.getCertificate({
    domain: domainName,
    mostRecent: true,
  });

  const albListener = new aws.lb.Listener(`${stackName}-alb-listener`, {
    loadBalancerArn: alb.arn,
    port: 443,
    protocol: "HTTPS",
    certificateArn: certificate.arn,
    sslPolicy: "ELBSecurityPolicy-2016-08",
    defaultActions: [
      {
        type: "forward",
        targetGroupArn: targetGroup.arn
      },
    ]
  },
  {dependsOn: [alb, targetGroup]});

  const hostedZone = await aws.route53.getZone({ name: domainName });

  // Create an A record pointing to the ALB DNS name
  const aRecord = new aws.route53.Record(`${domainName}`, {
    zoneId: hostedZone.zoneId,
    name: domainName,
    type: "A",
    aliases: [
      {
        evaluateTargetHealth: true,
        name: alb.dnsName,
        zoneId: alb.zoneId,
      },
    ],
  },
  {dependsOn: [alb]});

  const scaleUpPolicy = new aws.autoscaling.Policy(
    "webAppScaleUpPolicy",
    {
      scalingAdjustment: 1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 60,
      autoscalingGroupName: autoScalingGroup.name,
      autocreationCooldown: 60,
      cooldownDescription: "Scale up policy when average CPU usage is above 5%",
      policyType: "SimpleScaling",
      scalingTargetId: autoScalingGroup.id,
    },
    { dependsOn: [autoScalingGroup] }
  );

  const scaleDownPolicy = new aws.autoscaling.Policy(
    "webAppScaleDownPolicy",
    {
      scalingAdjustment: -1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 60,
      autoscalingGroupName: autoScalingGroup.name,
      autocreationCooldown: 60,
      cooldownDescription: "Scale down policy when average CPU usage is below 3%",
      policyType: "SimpleScaling",
      scalingTargetId: autoScalingGroup.id,
    },
    { dependsOn: [autoScalingGroup] }
  );

  const scaleUpAlarm = new aws.cloudwatch.MetricAlarm("scaleUpAlarm", {
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "CPUUtilization",
    namespace: "AWS/EC2",
    statistic: "Average",
    period: 60,
    threshold: 5,
    alarmActions: [scaleUpPolicy.arn],
    dimensions: {
      AutoScalingGroupName: autoScalingGroup.name,
    }
  }, {dependsOn: [scaleUpPolicy]});

  const scaleDownAlarm = new aws.cloudwatch.MetricAlarm("scaleDownAlarm", {
    comparisonOperator: "LessThanThreshold",
    evaluationPeriods: 1,
    metricName: "CPUUtilization",
    namespace: "AWS/EC2",
    statistic: "Average",
    period: 60,
    threshold: 3,
    alarmActions: [scaleDownPolicy.arn],
    dimensions: {
      AutoScalingGroupName: autoScalingGroup.name,
    }
  },{dependsOn: [scaleDownPolicy]});

  // Create the Google Cloud Storage Bucket
  const bucket = new gcp.storage.Bucket(bucketName, {
    location: gcpConfig.require('region'),
    uniformBucketLevelAccess: true,
    forceDestroy: true,
    lifecycleRules: [
      {
        action: {
          type: 'AbortIncompleteMultipartUpload'
        },
        condition: {
          age: 3,
        },
      },
      {
        action: {
          type: 'Delete'
        },
        condition: {
          age: 7,
        },
      },
      {
        action: {
          type: 'Delete'
        },
        condition: {
          numNewerVersions: 3,
          withState: 'ARCHIVED'
        },
      },
    ]
  });

  // Create GCP Service Account
  const serviceAccount = new gcp.serviceaccount.Account("lambda-service-account", {
    accountId: "lambda-service-account",
    displayName: "Service Account",
  });

  // Create aeccss keys for the service account is base64encoded
  const serviceAccountKey = new gcp.serviceaccount.Key("lamda-service-account-key", {
    serviceAccountId: serviceAccount.name,
  },{ dependsOn: [serviceAccount] });

  const adminAccountIam = new gcp.storage.BucketIAMBinding("bucketAccess", {
    bucket: bucket.name,
    role: "roles/storage.objectAdmin",
    members: [pulumi.interpolate`serviceAccount:${serviceAccount.email}`],
});

  // IAM Role and Policies for Lambda Function
  const lambdaRole = new aws.iam.Role("lambda-execution-role", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: "lambda.amazonaws.com" }),
  });

  // Create DynamoDB table
  const dynamoDBTable = new aws.dynamodb.Table("lambda-dynamodb-table", {
    name: "mailgunEmailTable",
    attributes: [
        { name: "messageId", type: "S" }
    ],
    hashKey: "messageId",
    readCapacity: 5,
    writeCapacity: 5,
  });

  const lambdaPolicy = new aws.iam.Policy("lambda-policy", {
    policy: {
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents",
                  "lambda:InvokeFunction"
                ],
                Resource: "arn:aws:logs:*:*:*",
            },
            {
              Effect: "Allow",
              Action: [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:Query",
              ],
              Resource: dynamoDBTable.arn,
            }
        ],
    },
  },
  { dependsOn: [dynamoDBTable] });

  // Attach policies to the role
  const lambdaRolePolicyAttachment = new aws.iam.RolePolicyAttachment(
    "lambda-role-policy-attachment",
    {
        policyArn: lambdaPolicy.arn,
        role: lambdaRole.name,
    },
    { dependsOn: [lambdaPolicy, lambdaRole] }
  );

  // Create AWS Lambda function
  const lambda = new aws.lambda.Function("github-release-lambda", {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    role: lambdaRole.arn,
    timeout: 300,
    environment: {
        variables: {
            GCP_BUCKET_NAME: bucket.name,
            GCP_SERVICE_ACCOUNT_KEY: serviceAccountKey.privateKey,
            MAILGUN_API_KEY: mailgunApiKey,
            DYNAMODB_TABLE_NAME: dynamoDBTable.name,
            MAILGUN_DOMAIN_NAME: domainName // domainName
        },
    },
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("../serverless/serverless.zip"), 
    }),
  },
  { dependsOn: [lambdaRole, serviceAccountKey, dynamoDBTable] });

  //create trigger for lamda explicitly
  const lambdaSnsPermission = new aws.lambda.Permission("lambda-sns-permission", {
    action: "lambda:InvokeFunction",
    function: lambda.name,
    principal: "sns.amazonaws.com",
    sourceArn: snsTopic.arn,
  },
  { dependsOn: [lambda, snsTopic] });

  // subscribe to sns from lamda
  const lamdaSnsSubscription = new aws.sns.TopicSubscription("lamdaSnsSubscription", {
    endpoint: lambda.arn,
    protocol: "lambda",
    topic: snsTopic.arn,
  },
  { dependsOn: [lambda, snsTopic] });

}

main();
