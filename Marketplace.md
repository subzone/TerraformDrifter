# Terraform Drift Azure DevOps Task

## Overview

The Terraform Drift Azure DevOps Task is a custom task for Azure Pipelines that checks for Terraform drift and enables reconciliation. It's designed to help you maintain the desired state of your infrastructure as defined in your Terraform configuration files.

## Features

- **Terraform Drift Detection**: Checks for any drift in your infrastructure from the desired state defined in your Terraform configuration files.
- **Reconciliation**: Enables reconciliation of the drift to bring your infrastructure back to the desired state.

## Requirements

- Azure DevOps
- Terraform

## Usage

After installing the extension, you can add the Terraform Drift task to any of your pipelines. Currently task does not do installation of terraform, so that should be handled with task preceding TerraformDrift. Also this iteration supports only Azure deployments, aws and google is supported but not tested yet.

- task: TerraformDrift@1
    inputs:
        workingDirectory: 'Your working dir where your terraform files are'
        provider: 'azure'  #can be aws or gcp as well
        azureSubscription: 'Service Connection to Azure' #or other provider`
        autoReconcile: false # Boolean true/false  
To use manual option for reconciliation here is proposal:

```
stages:
- stage: DetectDrift
  jobs:
  - job: RunTerraformPlan
    steps:
    - task: TerraformDrift@1
      inputs:
        autoReconcile: false
        # Other inputs...

- stage: ApplyChanges
  dependsOn: DetectDrift
  condition: succeeded('DetectDrift')
  jobs:
  - deployment: RunTerraformApply
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: TerraformDrift@1
            inputs:
              autoReconcile: true
              # Other inputs...
```
## Support

If you encounter any issues or have any questions, please open an issue here https://dev.azure.com/subzone/TerraformDrifter/_workitems/create/Bug .

## License

[MIT](https://choosealicense.com/licenses/mit/)
