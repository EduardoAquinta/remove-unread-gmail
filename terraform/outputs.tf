output "public_ip" {
  description = "The public IP of the Gmail Cleanup Server"
  value       = aws_instance.gmail_cleanup_server.public_ip
}

output "web_url" {
  description = "Access the web terminal here"
  value       = "http://${aws_instance.gmail_cleanup_server.public_ip}:3000"
}
