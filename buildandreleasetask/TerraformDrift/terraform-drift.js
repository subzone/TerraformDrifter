const {spawnSync} = require('child_process');
const tl = require('azure-pipelines-task-lib/task');
const handleTerraformOperations = require('./operations/handleTerraformOperations');
const handleTofuOperations = require('./operations/handleTofuOperations');

const provider = tl.getInput('provider', true);
const tool = tl.getInput('tool', true);
const workingDirectory = tl.getInput('workingDirectory', true);
const autoReconcile = tl.getBoolInput('autoReconcile', false);

let azureService;
let servicePrincipalId;
let servicePrincipalKey;
let tenantId;
let subscriptionId;
let awsService;
let accessKeyId;
let secretAccessKey;
let gcpService;
let keyFile;
switch (provider) {
  case 'azure':
    azureService = tl.getInput('azureSubscription', true);
    servicePrincipalId = tl.getEndpointAuthorizationParameter(azureService,
        'serviceprincipalid', false);
    servicePrincipalKey = tl.getEndpointAuthorizationParameter(azureService,
        'serviceprincipalkey', false);
    tenantId = tl.getEndpointAuthorizationParameter(azureService,
        'tenantid', false);
    subscriptionId = tl.getEndpointDataParameter(azureService,
        'subscriptionid', false);

    process.env['ARM_TENANT_ID'] = tenantId;
    process.env['ARM_SUBSCRIPTION_ID'] = subscriptionId;
    process.env['ARM_CLIENT_ID'] = servicePrincipalId;
    process.env['ARM_CLIENT_SECRET'] = servicePrincipalKey;

    console.log('Tenant ID: ', tenantId);

    handleOperations(tool, workingDirectory);

    break;

  case 'aws':
    awsService = tl.getInput('awsSubscription', true);
    accessKeyId = tl.getEndpointAuthorizationParameter(awsService,
        'accesskeyid', false);
    secretAccessKey = tl.getEndpointAuthorizationParameter(awsService,
        'secretaccesskey', false);

    process.env['AWS_ACCESS_KEY_ID'] = accessKeyId;
    process.env['AWS_SECRET_ACCESS_KEY'] = secretAccessKey;
    handleOperations(tool, workingDirectory);
    break;

  case 'gcp':
    gcpService = tl.getInput('gcpSubscription', true);
    keyFile = tl.getEndpointAuthorizationParameter(gcpService,
        'keyfile', false);

    process.env['GOOGLE_APPLICATION_CREDENTIALS'] = keyFile;
    handleOperations(tool, workingDirectory);
    break;

  default:
    console.error('Invalid provider');
    process.exit(1);
}


function handleOperations(tool, workingDirectory) {
  if (tool === 'terraform') {
    handleTerraformOperations(workingDirectory);
  } else if (tool === 'tofu') {
    handleTofuOperations(workingDirectory);
  } else {
    console.error(`Unsupported tool: ${tool}`);
  }
}

