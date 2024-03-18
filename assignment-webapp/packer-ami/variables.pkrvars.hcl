ssh_username = "admin"

instance_type = "t2.micro"

ami_users = ["483484771402", "212987430038"]

profile = "dev"

owners = ["amazon"]

source_ami_filter_virtualization_type = "hvm"

source_ami_filter_name = "debian-12-amd64-*"

source_ami_filter_root_device_type = "ebs"