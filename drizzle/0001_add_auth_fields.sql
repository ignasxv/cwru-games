-- Migration: Add password and phone_number fields to users table
ALTER TABLE users ADD COLUMN password TEXT;
ALTER TABLE users ADD COLUMN phone_number TEXT;