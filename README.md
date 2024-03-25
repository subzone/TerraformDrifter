# Terraform Drift Azure DevOps Task

This is an Azure DevOps task that checks for Terraform drift and enables reconciliation.
You can install it via [Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=subzone.terraform-drift)

## Features

- Checks for Terraform drift in your infrastructure
- Enables reconciliation of the drift

## Requirements

- Azure DevOps
- Terraform

## Usage

After installing the extension, you can add the Terraform Drift task to any of your pipelines. Currently task does not do installation of terraform, so that should be handled with task preceding TerraformDrift. Also this iteration supports only Azure deployments, aws and google will be supported soon.


```task: TerraformDrift@1
- task: TerraformDrift@1
  inputs:
     workingDirectory: 'Your working dir where your terraform files are'
     provider: 'azure'  #can be aws or gcp as well
     azureSubscription: 'Service Connection to Azure' #or other provider`
     autoReconcile: false # Boolean true/false
```


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


## Contributing

For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)