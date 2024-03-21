terraform {
  backend "azurerm" {
    resource_group_name  = "career-base-weu-dev"
    storage_account_name = "careerbaseweudev"
    container_name       = "tfstate"
    key                  = "example.tfstate"
  }
}