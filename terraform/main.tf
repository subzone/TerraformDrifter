provider "azurerm" {
    features {}
}

resource "azurerm_resource_group" "example" {
    name     = "example-resources"
    location = "West Europe"
    tags = {
        environment = "Production"
        department  = "Finance"
    }
}