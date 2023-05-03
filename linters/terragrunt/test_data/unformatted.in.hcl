generate "provider" {
  path         = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  assume_role {
    role_arn = "arn:aws:iam::0123456789:role/terragrunt"
  }
}
EOF
}
