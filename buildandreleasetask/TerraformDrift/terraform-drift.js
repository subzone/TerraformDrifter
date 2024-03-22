const { spawnSync } = require('child_process');
const tl = require('azure-pipelines-task-lib/task');

let provider = tl.getInput('provider', true);

let azureService, servicePrincipalId, servicePrincipalKey, tenantId, subscriptionId;
let awsService, accessKeyId, secretAccessKey;
let gcpService, keyFile;
switch (provider) {
  case 'azure':
     azureService = tl.getInput('azureSubscription', true);
     servicePrincipalId = tl.getEndpointAuthorizationParameter(azureService, 'serviceprincipalid', false);
     servicePrincipalKey = tl.getEndpointAuthorizationParameter(azureService, 'serviceprincipalkey', false);
     tenantId = tl.getEndpointAuthorizationParameter(azureService, 'tenantid', false);
     subscriptionId = tl.getEndpointAuthorizationParameter(azureService, 'subscriptionid', false);

    process.env['ARM_TENANT_ID'] = tenantId;
    process.env['ARM_SUBSCRIPTION_ID'] = subscriptionId;
    process.env['ARM_CLIENT_ID'] = servicePrincipalId;
    process.env['ARM_CLIENT_SECRET'] = servicePrincipalKey;
    break;

  case 'aws':
    awsService = tl.getInput('awsSubscription', true);
    accessKeyId = tl.getEndpointAuthorizationParameter(awsService, 'accesskeyid', false);
    secretAccessKey = tl.getEndpointAuthorizationParameter(awsService, 'secretaccesskey', false);

    process.env['AWS_ACCESS_KEY_ID'] = accessKeyId;
    process.env['AWS_SECRET_ACCESS_KEY'] = secretAccessKey;
    break;

  case 'gcp':
    gcpService = tl.getInput('gcpSubscription', true)
    keyFile = tl.getEndpointAuthorizationParameter(gcpService, 'keyfile', false);

    process.env['GOOGLE_APPLICATION_CREDENTIALS'] = keyFile;
    break;

  default:
    console.error('Invalid provider');
    process.exit(1);
}


let workingDirectory = tl.getInput('workingDirectory', true);


console.log('Tenant ID: ', tenantId);

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