variable "aws_region" {
  description = "AWS Region for deployment"
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type for Free Tier"
  default     = "t2.micro" # Use t3.micro in regions where t2 is unavailable
}

variable "key_name" {
  description = "The name of your AWS EC2 key pair (Must exist in AWS console)"
  type        = string
}
