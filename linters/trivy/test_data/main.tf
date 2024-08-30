terraform {
  required_version = ">= 1.4.6"
  backend "local" {
    path = "terraform.tfstate"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.47.0"
    }
  }
}

# AWS Provider
provider "aws" {}

module "lambda_function" {
  source                                  = "terraform-aws-modules/lambda/aws"
  version                                 = "7.4.0"
  function_name                           = "LambdaFunction"
  handler                                 = "lambda_handler.lambda_handler"
  runtime                                 = "python3.12"
  local_existing_package                  = "lambda_package.zip"
  create_package                          = false
  create_current_version_allowed_triggers = false
  attach_policy_json                      = false
  timeout                                 = 900
  ignore_source_code_hash                 = true
  maximum_retry_attempts                  = 0
  # Because tc-db is private, this lambda function must run within the VPC
  vpc_subnet_ids         = ["subnet-1", "subnet-2", "subnet-3"]
  vpc_security_group_ids = ["security-group-1", "security-group-2"]
  attach_network_policy  = true
}
