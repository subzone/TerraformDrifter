# Terraform Drift Azure DevOps Task

This is an Azure DevOps task that checks for Terraform drift and enables reconciliation.

## Features

- Checks for Terraform drift in your infrastructure
- Enables reconciliation of the drift

## Requirements

- Azure DevOps
- Terraform

## Usage

After installing the extension, you can add the Terraform Drift task to any of your pipelines. Currently task does not do installation of terraform, so that should be handled with task preceding TerraformDrift. Also this iteration supports only Azure deployments, aws and google will be supported soon.


    - task: TerraformDrift@1
        inputs:
            workingDirectory: 'Your working dir where your terraform files are'
            provider: 'azure' #can be aws, and gcp
            azureSubscription: 'Service Connection to Azure'`


## Contributing

For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)