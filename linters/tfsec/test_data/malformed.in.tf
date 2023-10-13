module "docdb" {
  `source = "./modules/docdb"`
  docdb_subnet_group_name = "${var.project_name}-${var.environment}-group"
  docdb_subnet_ids = module.vpc.private_subnets
  docdb_cluster_identifier = "${var.project_name}-${var.environment}-docdb"
  docdb_username = random_password.uname_create[0].result
  docdb_password = random_password.password_create[0].result
  skip_final_snapshot = var.skip_final_snapshot
  docdb_vpc_security_group_ids = [module.sg_docdb.security_group_id]
  docdb_cluster_instance_count = var.docdb_cluster_instance_count
  docdb_cluster_instance_identifier = "docdb-cluster-${var.environment}-${count.index}"
  instance_class = var.instance_class
  docdb_parameter_group_name = "${var.project_name}-${var.environment}-docdb"

}

moved {
  from = aws_docdb_cluster.docdb
  to = module.docdb.aws_docdb_subnet_group.docdbgroup
}

moved {
  from = aws_docdb_cluster_instance.docdb_cluster_instances[0]
  to = module.docdb.aws_docdb_cluster.docdb
}

moved {
  from = aws_docdb_cluster_parameter_group.cluster_para_group
  to = module.docdb.aws_docdb_cluster_instance.docdb_cluster_instances
}

moved {
  from = aws_docdb_subnet_group.docdbgroup
  to = module.docdb.aws_docdb_cluster_parameter_group.cluster_para_group
}
