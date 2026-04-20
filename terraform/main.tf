terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. Create a Security Group to allow traffic on Port 3000 and SSH
resource "aws_security_group" "gmail_cleanup_sg" {
  name        = "gmail-cleanup-sg"
  description = "Allow Port 3000 and SSH"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # For production, restrict this to your IP
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. Find the latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# 3. Create the EC2 Instance (Free Tier)
resource "aws_instance" "gmail_cleanup_server" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.gmail_cleanup_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              # Install Node.js
              curl -sL https://rpm.nodesource.com/setup_20.x | bash -
              yum install -y nodejs git

              # Create app directory
              mkdir -p /home/ec2-user/app
              chown ec2-user:ec2-user /home/ec2-user/app

              # Instructions for the user:
              # After this instance starts, you will need to:
              # 1. Clone your repo into /home/ec2-user/app
              # 2. Upload your credentials.json and token.json manually
              # 3. Run: npm install && npm start
              EOF

  tags = {
    Name = "Gmail-Cleanup-Server"
  }
}
