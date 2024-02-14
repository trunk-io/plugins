# tfsec thinks this file is malformed, even though it is borrowed from (below), so we pass it --ignore-hcl-errors
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document#example-assume-role-policy-with-multiple-principals
# pass

data "aws_iam_policy_document" "pass" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "s3:Describe*",
    ]
    resources = [
      "*",
    ]
  }
}

data "aws_iam_policy_document" "list" {
  version = "2012-10-17"

  statement = [{
    actions = [
      "s3:GetObject"
    ]
    resources = [
      "${aws_s3_bucket.default.arn}/*"
    ]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }]

  # Support replication ARNs
  statement = ["${flatten(data.aws_iam_policy_document.replication.*.statement)}"]

  # Support deployment ARNs
  statement = ["${flatten(data.aws_iam_policy_document.deployment.*.statement)}"]
}

# fail

data "aws_iam_policy_document" "fail" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "*"
    ]
    resources = [
      "*",
    ]
  }
}

data "aws_iam_policy_document" "no_effect" {
  version = "2012-10-17"

  statement {
    actions = [
      "*"
    ]
    resources = [
      "*",
    ]
  }
}

# unknown
