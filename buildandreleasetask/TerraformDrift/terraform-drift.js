const { spawnSync } = require('child_process');
const tl = require('azure-pipelines-task-lib/task');

let provider = tl.getInput('provider', true);

switch (provider) {
  case 'azure':
    connectedService = tl.getInput('azureSubscription', true);
    let azureSubscription = tl.getInput('azureSubscription', true);
    let servicePrincipalId = tl.getEndpointAuthorizationParameter(azureSubscription, 'serviceprincipalid', false);
    let servicePrincipalKey = tl.getEndpointAuthorizationParameter(azureSubscription, 'serviceprincipalkey', false);
    let subscriptionId = tl.getEndpointDataParameter(connectedService, 'subscriptionid', true);
    let tenantId = tl.getEndpointAuthorizationParameter(azureSubscription, 'tenantid', false);

    process.env['ARM_TENANT_ID'] = tenantId;
    process.env['ARM_SUBSCRIPTION_ID'] = subscriptionId;
    process.env['ARM_CLIENT_ID'] = servicePrincipalId;
    process.env['ARM_CLIENT_SECRET'] = servicePrincipalKey;
    break;

  case 'aws':
    connectedService = tl.getInput('awsSubscription', true);
    let awsSubscription = tl.getInput('awsSubscription', true);
    let accessKeyId = tl.getEndpointAuthorizationParameter(awsSubscription, 'accesskeyid', false);
    let secretAccessKey = tl.getEndpointAuthorizationParameter(awsSubscription, 'secretaccesskey', false);

    process.env['AWS_ACCESS_KEY_ID'] = accessKeyId;
    process.env['AWS_SECRET_ACCESS_KEY'] = secretAccessKey;
    break;

  case 'gcp':
    connectedService = tl.getInput('gcpSubscription', true)
    let gcpSubscription = tl.getInput('gcpSubscription', true);
    let keyFile = tl.getEndpointAuthorizationParameter(gcpSubscription, 'keyfile', false);

    process.env['GOOGLE_APPLICATION_CREDENTIALS'] = keyFile;
    break;

  default:
    console.error('Invalid provider');
    process.exit(1);
}


let workingDirectory = tl.getInput('workingDirectory', true);
// let connectedService = tl.getInput('azureSubscription', true);
// let tenantId = tl.getEndpointAuthorizationParameter(connectedService, 'tenantid', false);
// let servicePrincipalId = tl.getEndpointAuthorizationParameter(connectedService, 'serviceprincipalid', false);
// let servicePrincipalKey = tl.getEndpointAuthorizationParameter(connectedService, 'serviceprincipalkey', false);
// let subscriptionId = tl.getEndpointDataParameter(connectedService, 'subscriptionid', true);

console.log('Tenant ID: ', tenantId);
// console.log('Service Principal ID: ', servicePrincipalId);
// console.log('Service Principal Key: ', servicePrincipalKey);
// process.env['ARM_TENANT_ID'] = tenantId;
// process.env['ARM_SUBSCRIPTION_ID'] = subscriptionId;
// process.env['ARM_CLIENT_ID'] = servicePrincipalId;
// process.env['ARM_CLIENT_SECRET'] = servicePrincipalKey;

process.on('uncaughtException', function(err) {
  console.error('Caught exception: ', err);
});

// // The working directory is passed as the first argument
// let workingDirectory = process.argv[2];

console.log('Working directory: ', workingDirectory);

// Initialize Terraform
let init = spawnSync('terraform', ['init'], { cwd: workingDirectory, stdio: 'inherit' });
if (init.error) {
  console.error('Error: Terraform init failed');
  process.exit(1);
}

// Check for drift
let plan = spawnSync('terraform', ['plan', '-detailed-exitcode'], { cwd: workingDirectory, stdio: 'inherit' });

// If the exit code is 2, there is drift
if (plan.status === 2) {
  console.log('Drift detected. Reconciling...');
  let apply = spawnSync('terraform', ['apply', '-auto-approve'], { cwd: workingDirectory, stdio: 'inherit' });
  if (apply.error) {
    console.error('Error: Terraform apply failed');
    process.exit(1);
  }
} else {
  console.log('No drift detected.');
}