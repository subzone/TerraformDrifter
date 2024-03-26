provider "azurerm" {
    features {}
}

resource "azurerm_resource_group" "example" {
    name     = "example-tofu-resources"
    location = "West Europe"
    tags = {
        environment = "Production"
        department  = "Finance"
    }
}