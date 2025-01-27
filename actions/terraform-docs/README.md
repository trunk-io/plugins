# terraform-docs

Generate documentation from Terraform modules in various output formats. Read more about
terraform-docs [here](https://terraform-docs.io).

This action is intended to be used only with output mode as `inject` with `README.md` files as the
target. You can configure terraform-docs via a `.terraform-docs.yml` file at the root of your
repository. Read more about the configuration
[here](https://terraform-docs.io/user-guide/configuration/).

Is markdownlint causing consistent diffs in your README files? Try using the < !--
markdownlint-disable --> and < !-- markdownlint-enable --> comments to disable and re-enable
markdownlint for your terraform-docs section of your README.
