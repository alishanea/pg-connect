output "alb_dns_name" {
  description = "Application Load Balancer DNS Name"
  value       = aws_lb.alb.dns_name
}

output "s3_bucket_name" {
  description = "S3 Bucket Name for Grievance Photos"
  value       = aws_s3_bucket.photos.id
}

output "rds_endpoint" {
  description = "PostgreSQL RDS Endpoint"
  value       = aws_db_instance.postgres.endpoint
}
