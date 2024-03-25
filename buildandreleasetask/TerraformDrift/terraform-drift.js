const {spawnSync} = require('child_process');
const tl = require('azure-pipelines-task-lib/task');

const provider = tl.getInput('provider', true);
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

    handleTerraformOperations(workingDirectory);

    break;

  case 'aws':
    awsService = tl.getInput('awsSubscription', true);
    accessKeyId = tl.getEndpointAuthorizationParameter(awsService,
        'accesskeyid', false);
    secretAccessKey = tl.getEndpointAuthorizationParameter(awsService,
        'secretaccesskey', false);

    process.env['AWS_ACCESS_KEY_ID'] = accessKeyId;
    process.env['AWS_SECRET_ACCESS_KEY'] = secretAccessKey;
    handleTerraformOperations(workingDirectory);
    break;

  case 'gcp':
    gcpService = tl.getInput('gcpSubscription', true);
    keyFile = tl.getEndpointAuthorizationParameter(gcpService,
        'keyfile', false);

    process.env['GOOGLE_APPLICATION_CREDENTIALS'] = keyFile;
    handleTerraformOperations(workingDirectory);
    break;

  default:
    console.error('Invalid provider');
    process.exit(1);
}

/**
 * Handles Terraform operations for a given working directory.
 *
 * @param {string} workingDirectory - The working
 *  directory for the Terraform operations.
 */
function handleTerraformOperations(workingDirectory) {
  console.log('Working directory: ', workingDirectory);

  // Initialize Terraform
  const init = spawnSync('terraform',
      ['init'], {cwd: workingDirectory, stdio: 'inherit'});
  if (init.error) {
    console.error('\x1b[31m%s\x1b[0m',
        'Error: Terraform init failed');
    process.exit(1);
  }

  // Check for drift
  const plan = spawnSync('terraform', ['plan',
    '-detailed-exitcode'],
  {cwd: workingDirectory, stdio: 'inherit'});

  if (plan.error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: Terraform plan failed');
    process.exit(1);
  }
  // If the exit code is 2, there is drift
  if (plan.status === 2) {
    if (autoReconcile) {
      console.log('\x1b[33m%s\x1b[0m\n\x1b[33m%s\x1b[0m',
          'Drift detected.',
          ' AutoReconciliation parameter set to true.',
          'Reconciling...');
      const apply = spawnSync('terraform', ['apply',
        '-auto-approve'],
      {cwd: workingDirectory, stdio: 'inherit'});
      if (apply.error) {
        console.error('Error: Terraform apply failed');
        process.exit(1);
      }
    } else {
      console.log('\x1b[32m%s\x1b[0m',
          'Auto Reconciliation is set to false, please reconcile manually.');
    }
  } else {
    console.log('\x1b[32m%s\x1b[0m',
        'No drift detected.');
  }
}

module.exports = handleTerraformOperations;
