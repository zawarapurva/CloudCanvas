packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.2"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "ssh_username" {
  type    = string
  default = "admin"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "ami_users" {
  type    = list(string)
  default = ["483484771402", "212987430038"]
}

variable "profile" {
  type    = string
  default = "dev"
}

variable "owners" {
  type    = list(string)
  default = ["amazon"]
}

variable "source_ami_filter_virtualization_type" {
  type    = string
  default = "hvm"
}

variable "source_ami_filter_name" {
  type    = string
  default = "debian-12-amd64-*"
}

variable "source_ami_filter_root_device_type" {
  type    = string
  default = "ebs"
}

source "amazon-ebs" "debian" {
  profile       = "${var.profile}"
  ami_name      = "debian_12_${formatdate("YYYY_MM_DD_HH_mm_ss", timestamp())}"
  instance_type = "${var.instance_type}"
  ssh_username  = "${var.ssh_username}"
  source_ami_filter {
    owners      = "${var.owners}"
    most_recent = true
    filters = {
      virtualization-type = "${var.source_ami_filter_virtualization_type}"
      name                = "${var.source_ami_filter_name}"
      root-device-type    = "${var.source_ami_filter_root_device_type}"
    }
  }
  ami_users = "${var.ami_users}"
}

build {
  sources = [
    "source.amazon-ebs.debian",
  ]
  provisioner "file" {
    direction   = "upload"
    source      = "./artifacts/webapp.zip"
    destination = "/tmp/webapp.zip"
  }
  provisioner "file" {
    direction   = "upload"
    source      = "./config/cloudwatch.config.json"
    destination = "/tmp/cloudwatch.config.json"
  }
  provisioner "file" {
    source      = "demo.sh"
    destination = "~/"
  }
  provisioner "shell" {
    inline = [
      "pwd",
      "ls -a -l",
      "sudo bash ~/demo.sh",
    ]
  }
}
