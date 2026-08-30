variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment (staging or production)"
  type        = string
  default     = "staging"
}

variable "app_name" {
  description = "Application Name"
  type        = string
  default     = "pg-connect"
}

variable "db_name" {
  description = "PostgreSQL Database Name"
  type        = string
  default     = "pgconnect_db"
}

variable "db_username" {
  description = "Database Master Username"
  type        = string
  default     = "pgadmin"
}
