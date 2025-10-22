# xCMS - Adult Content Management System

<div align="center">

![xCMS Logo](https://porn-api.com/logo.png)

**A comprehensive adult content management system with intelligent data scraping capabilities**

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite-green)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-Private-red)]()

**🚀 Powered by [PORN-API.COM](https://porn-api.com) 🚀**

*Professional adult content management solutions*

</div>

---

A comprehensive adult content management system with intelligent data scraping capabilities from porn-api.com, built with Next.js 15 and SQLite.

## 🚀 Key Features

- **Content Management**: Videos, Models, Categories
- **Smart Data Scraping**: Auto-detect valid pages, avoid scraping empty pages
- **Auto-scraping**: Scheduled automatic data scraping
- **Admin Panel**: Full-featured admin interface at `/admin00o1`
- **Responsive Design**: Compatible with all devices
- **SEO Optimized**: Meta tags, sitemap, robots.txt
- **Featured Videos**: Advanced featured video management
- **AI Content Rewriting**: OpenAI-powered title and description rewriting

## 📋 System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: 2GB (4GB recommended)
- **Disk**: 5GB free space
- **CPU**: 1 core (2 cores recommended)
- **Network**: Stable internet connection

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 4GB or more
- **Disk**: 20GB free space
- **CPU**: 2+ cores
- **Network**: High-speed internet

## 🛠️ Complete Installation Guide (Ubuntu Server)

### Step 1: Update System and Install Prerequisites

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or newer
```

### Step 2: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify PM2 installation
pm2 --version
```

### Step 3: Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/pornapi/xCMS-by-Porn-API.git
cd xCMS-by-Porn-API

# Install dependencies
npm install

# Create necessary directories
mkdir -p data
mkdir -p public/backup
```

### Step 4: Database Setup

#### Option A: Use Existing Database (Recommended)

```bash
# Copy your existing database file to the correct location
# Replace 'your-database.sqlite' with your actual database file name
cp /path/to/your-database.sqlite ./data/database.sqlite

# Set proper permissions
chmod 644 ./data/database.sqlite
chown $USER:$USER ./data/database.sqlite

# Verify database file exists
ls -la ./data/database.sqlite
```

#### Option B: Initialize New Database

```bash
# Run database initialization
npm run migrate

# This will create a new database with default admin account
# Username: admin
# Password: 2cd95cc2466656a4
```

### Step 5: Environment Configuration

Create `.env.local` file:

```bash
nano .env.local
```

Add the following content:

```env
# ===========================================
# xCMS Environment Configuration
# ===========================================

# Database Configuration
DATABASE_URL="file:./data/database.sqlite"

# Application URLs
NEXT_PUBLIC_BASE_URL="http://your-server-ip:3000"
NEXTAUTH_URL="http://your-server-ip:3000"

# JWT Authentication Secrets (Generate strong random strings)
XCMS_JWT_ACCESS_SECRET="your-super-secret-access-key-here-32-chars-min"
XCMS_JWT_REFRESH_SECRET="your-super-secret-refresh-key-here-32-chars-min"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Admin Credentials (Change these in production!)
XCMS_DEFAULT_ADMIN_USERNAME="admin"
XCMS_DEFAULT_ADMIN_PASSWORD="2cd95cc2466656a4"

# reCAPTCHA Configuration (Optional - for production)
# Get these from: https://www.google.com/recaptcha/admin
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your_recaptcha_site_key_here"
RECAPTCHA_SECRET_KEY="your_recaptcha_secret_key_here"

# OpenAI Configuration (Optional - for AI content rewriting)
# Get this from: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Environment
NODE_ENV="production"
```

**Important**: Replace `your-server-ip` with your actual server IP address.

### Step 6: Generate Secure Secrets

```bash
# Generate secure JWT secrets
node -e "console.log('XCMS_JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('XCMS_JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated secrets to your `.env.local` file.

### Step 7: Build Application

```bash
# Build the application for production
npm run build

# Verify build was successful
ls -la .next/
```

### Step 8: Configure PM2

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [{
    name: 'xcms',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/xCMS', // Replace with actual path
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

**Important**: Replace `/path/to/your/xCMS` with your actual project path.

### Step 9: Create Log Directory

```bash
# Create logs directory
mkdir -p logs

# Set proper permissions
chmod 755 logs
```

### Step 10: Start Application

```bash
# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Follow the instructions shown by PM2 startup command
```

### Step 11: Verify Installation

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs xcms

# Check if application is running
curl http://localhost:3000
```

## 🌐 Access Your Application

### Local Access
- **Main Site**: `http://your-server-ip:3000`
- **Admin Panel**: `http://your-server-ip:3000/admin00o1`

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `2cd95cc2466656a4` or `admin123`

**⚠️ Important**: Change these credentials immediately after first login!

## 🔧 Nginx Reverse Proxy Setup (Recommended for Production)

### Step 1: Install Nginx

```bash
sudo apt install nginx -y
```

### Step 2: Configure Nginx

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/xcms
```

Add the following content:

```nginx
server {
    listen 80;
    server_name your-domain.com; # Replace with your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Main location
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 3: Enable Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/xcms /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔐 SSL Certificate Setup (Let's Encrypt)

### Step 1: Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Get SSL Certificate

```bash
# Replace your-domain.com with your actual domain
sudo certbot --nginx -d your-domain.com

# Follow the prompts to complete the setup
```

### Step 3: Auto-renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring and Maintenance

### PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs xcms

# Restart application
pm2 restart xcms

# Stop application
pm2 stop xcms

# Delete application
pm2 delete xcms

# Monitor in real-time
pm2 monit
```

### Database Backup

```bash
# Create backup script
nano backup-db.sh
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/your/xCMS/data/backup"
DB_FILE="/path/to/your/xCMS/data/database.sqlite"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
cp $DB_FILE $BACKUP_DIR/database_backup_$DATE.sqlite

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t database_backup_*.sqlite | tail -n +8 | xargs -r rm

echo "Database backed up to: $BACKUP_DIR/database_backup_$DATE.sqlite"
```

```bash
# Make script executable
chmod +x backup-db.sh

# Run backup
./backup-db.sh
```

### Database Restore

```bash
# Stop application
pm2 stop xcms

# Restore from backup
cp /path/to/backup/database_backup_YYYYMMDD_HHMMSS.sqlite ./data/database.sqlite

# Start application
pm2 start xcms
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

#### 2. Database Locked

```bash
# Restart application
pm2 restart xcms

# Or check for SQLite processes
ps aux | grep sqlite
```

#### 3. Memory Issues

```bash
# Check memory usage
free -h

# Restart with more memory
pm2 restart xcms --max-memory-restart 2G
```

#### 4. Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/your/xCMS
chmod -R 755 /path/to/your/xCMS
chmod 644 /path/to/your/xCMS/data/database.sqlite
```

### Log Analysis

```bash
# View application logs
pm2 logs xcms --lines 100

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo journalctl -u nginx -f
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Stop application
pm2 stop xcms

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Build application
npm run build

# Start application
pm2 start xcms
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services if needed
sudo systemctl restart nginx
pm2 restart xcms
```

## 📈 Performance Optimization

### Database Optimization

```bash
# Optimize SQLite database
sqlite3 ./data/database.sqlite "VACUUM;"

# Analyze database
sqlite3 ./data/database.sqlite "ANALYZE;"
```

### Nginx Optimization

Add to your Nginx configuration:

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Enable caching
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔐 Security Best Practices

### 1. Change Default Credentials

```bash
# Access admin panel and change:
# - Admin username and password
# - Database credentials (if applicable)
```

### 2. Firewall Configuration

```bash
# Only allow necessary ports
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Block direct access to app port
```

### 3. Regular Updates

```bash
# Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📞 Support and Maintenance

### Useful Commands

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check network connections
netstat -tulpn

# Check running processes
ps aux | grep node
```

### Backup Strategy

1. **Database**: Daily automated backups
2. **Application**: Version control with Git
3. **Configuration**: Backup `.env.local` and Nginx configs
4. **Logs**: Regular log rotation

## 📄 License

Private - All rights reserved

---

## 🤝 Support & Contact

<div align="center">

**Need help? Have questions? Want to contribute?**

### 📞 Contact Information

**Telegram**: [@b0b0b3b3](https://t.me/b0b0b3b3)

**Website**: [PORN-API.COM](https://porn-api.com)

**Email**: Contact via Telegram for fastest response

---

### 🚀 About PORN-API.COM

We specialize in providing high-quality adult content management solutions and APIs. Our team is dedicated to delivering professional-grade tools for content creators and website owners.

**Services we offer:**
- Adult content APIs
- Content management systems
- Data scraping solutions
- Custom development
- Technical support

</div>

---

## ⚠️ Important Notes

1. **Legal Compliance**: This is an adult content management system. Ensure compliance with local laws when deploying.
2. **Security**: Always use HTTPS in production and keep your credentials secure.
3. **Updates**: Regularly update your system and application for security patches.
4. **Monitoring**: Monitor your application logs for any issues or suspicious activity.
5. **Backups**: Keep your database backups secure and encrypted.
6. **Support**: For technical support, contact us via Telegram [@b0b0b3b3](https://t.me/b0b0b3b3).

---

<div align="center">

**🎉 Congratulations!** Your xCMS is now fully deployed and ready to use!

**Made with ❤️ by [PORN-API.COM](https://porn-api.com)**

*Professional adult content management solutions*

</div>