# Journal Application Deployment with Docker Swarm, Ansible, GitHub Actions, and AWS

## Overview

This project demonstrates a production-oriented deployment workflow for a containerized full-stack Journal Application using modern DevOps practices. The infrastructure is hosted on AWS EC2, automated with Ansible, orchestrated using Docker Swarm, and integrated with GitHub Actions for Continuous Deployment.

The architecture separates application services from the database layer by placing MySQL inside a private network protected with firewall rules, while frontend and backend services are distributed across multiple worker nodes.

---

# Architecture

```
                    GitHub Repository
                           │
                           │ Push
                           ▼
                  GitHub Actions Workflow
                           │
                    SSH + Ansible
                           │
                           ▼
      EC2-1 (Ansible Control Node & Swarm Manager)
          │
          ├──────────────┬──────────────┐
          │              │              │
          ▼              ▼              ▼
      EC2-2          EC2-3          EC2-4
   Swarm Worker   Swarm Worker   Swarm Worker
  Nginx + Express Nginx + Express Nginx + Express
          │              │              │
          └──────── Overlay Network ───┘
                      │
                      ▼
              EC2-5 MySQL Database
             Private VPC + UFW Firewall
```

---

# Project Highlights

### GitHub Actions

GitHub Actions serves as the Continuous Deployment trigger. Every push to the repository automatically connects to the Swarm Manager (EC2-1) and executes the Ansible deployment workflow.

### EC2-1 — Ansible Control Node & Docker Swarm Manager

EC2-1 functions as the central orchestration server.

Responsibilities include:

- Running Ansible playbooks
- Initializing Docker Swarm
- Managing worker nodes
- Deploying application stacks
- Coordinating service updates

### Docker Swarm Worker Nodes

EC2-2, EC2-3, and EC2-4 operate as Docker Swarm workers.

Each worker hosts:

- Nginx Reverse Proxy
- Express.js Backend
- Frontend Container

Docker Swarm distributes workloads automatically across all worker nodes.

### Private Database Layer

The MySQL server runs exclusively on EC2-5 inside a private AWS VPC network.

Security is enforced through:

- Private IP communication only
- UFW Firewall
- No public database access
- MySQL accepts connections only from internal Swarm nodes

---

# Technology Stack

- AWS EC2
- Ubuntu Server 24.04 LTS
- Docker
- Docker Swarm
- Docker Hub
- Ansible
- GitHub Actions
- Nginx
- Express.js
- MySQL
- UFW Firewall

---

# Infrastructure

| Instance | Role | Security Group | Public IP |
|-----------|------|----------------|-----------|
| EC2-1 | Ansible Control Node & Swarm Manager | SG-Swarm-Cluster | Yes |
| EC2-2 | Swarm Worker | SG-Swarm-Cluster | Yes |
| EC2-3 | Swarm Worker | SG-Swarm-Cluster | Yes |
| EC2-4 | Swarm Worker | SG-Swarm-Cluster | Yes |
| EC2-5 | MySQL Database Server | SG-Database | No (Recommended) |

Minimum instance specification:

- Ubuntu Server 24.04 LTS (or 22.04 LTS)
- t2.micro

---

# Security Group Configuration

## SG-Swarm-Cluster

Used by:

- EC2-1
- EC2-2
- EC2-3
- EC2-4

### Inbound Rules

| Port | Purpose | Source |
|------|----------|---------|
| 22 | SSH | Your Public IP + EC2-1 Private IP |
| 80 | HTTP | 0.0.0.0/0 |
| 3000 | Application | 0.0.0.0/0 |
| 2377 | Docker Swarm Manager | SG-Swarm-Cluster |
| 7946 TCP/UDP | Swarm Discovery | SG-Swarm-Cluster |
| 4789 UDP | Overlay Network | SG-Swarm-Cluster |

---

## SG-Database

Used only by EC2-5.

### Inbound Rules

| Port | Purpose | Source |
|------|----------|---------|
| 22 | SSH | EC2-1 Private IP |
| 3306 | MySQL | AWS Private VPC (e.g., 172.31.0.0/16) |

---

# Configuration Steps

## 1. Launch EC2 Instances

Create five EC2 instances using Ubuntu Server.

| Instance | Role |
|-----------|------|
| EC2-1 | Swarm Manager + Ansible |
| EC2-2 | Swarm Worker |
| EC2-3 | Swarm Worker |
| EC2-4 | Swarm Worker |
| EC2-5 | MySQL Server |

---

## 2. Install MySQL (EC2-5)

```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl enable --now mysql
```

---

## 3. Configure MySQL

Edit MySQL configuration:

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Change:

```text
bind-address = 0.0.0.0
```

Restart MySQL:

```bash
sudo systemctl restart mysql
```

---

## 4. Create Database

Enter MySQL:

```bash
sudo mysql
```

Create:

- Database
- User
- Password

Then import your schema:

```sql
SOURCE schema.sql;
```

---

## 5. Configure UFW Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow ssh

sudo ufw allow from 172.31.0.0/16 to any port 3306

sudo ufw --force enable
```

This configuration ensures that only internal AWS VPC addresses can access MySQL.

---

## 6. Install Ansible (EC2-1)

```bash
sudo apt update

sudo apt install software-properties-common -y

sudo add-apt-repository --yes --update ppa:ansible/ansible

sudo apt install ansible -y
```

---

## 7. Generate JWT Secret

Generate a secure JWT secret:

```bash
openssl rand -base64 32
```

Copy the generated value into the `JWT_SECRET` variable inside `deploy.yml`.

---

## 8. Configure Ansible Inventory

Create `inventory.ini`.

```ini
[swarm_manager]
manager1 ansible_host=<PRIVATE_IP_EC2-1> ansible_connection=local

[swarm_workers]
worker1 ansible_host=<PRIVATE_IP_EC2-2> ansible_user=ubuntu
worker2 ansible_host=<PRIVATE_IP_EC2-3> ansible_user=ubuntu
worker3 ansible_host=<PRIVATE_IP_EC2-4> ansible_user=ubuntu
```

---

## 9. Prepare Application Images

Choose one of the following options:

### Option A

Clone this repository and build/push your own Docker images to Docker Hub.

### Option B

Pull the pre-built images:

```text
afifatulrohmah/journal-frontend:latest

afifatulrohmah/journal-backend:latest
```

---

## 10. Create the Deployment Playbook

Create:

```
deploy.yml
```

The playbook should automate:

- Docker installation
- Docker Swarm initialization
- Worker node joining
- Overlay network creation
- Docker image pulling
- Stack deployment
- Environment variable configuration
- Application deployment

---

# GitHub Actions

Configure the following repository secrets:

| Secret | Description |
|---------|-------------|
| DOCKER_USERNAME | Docker Hub username |
| DOCKER_PASSWORD | Docker Hub password or access token |
| EC2_MANAGER_IP | Public IP of EC2-1 |
| EC2_SSH_KEY | Private SSH (.pem) key for EC2-1 |

GitHub Actions will automatically trigger the deployment whenever code is pushed to the repository.

---

# Manual Deployment

Run the deployment manually from EC2-1:

```bash
ansible-playbook -i inventory.ini deploy.yml
```

---

# Verification & Monitoring

After deployment completes successfully, verify the Docker Swarm cluster.

### Check Swarm Nodes

```bash
docker node ls
```

---

### Check Deployed Stacks

```bash
docker stack ls
```

---

### Check Service Distribution

```bash
docker stack ps journalapp
```

This command verifies that containers are running across EC2-2, EC2-3, and EC2-4.

---

# Security Best Practices

- Database is isolated inside a private VPC.
- MySQL is inaccessible from the public internet.
- UFW restricts database access to internal network traffic only.
- Docker Overlay Network enables secure container communication.
- Deployment is fully automated through GitHub Actions and Ansible.
- Docker Swarm ensures high availability and workload distribution.

---

# Deployment Workflow

```text
Developer
     │
     ▼
Git Push
     │
     ▼
GitHub Actions
     │
     ▼
SSH into EC2-1
     │
     ▼
Run Ansible Playbook
     │
     ▼
Initialize Docker Swarm
     │
     ▼
Configure Worker Nodes
     │
     ▼
Pull Docker Images
     │
     ▼
Deploy Docker Stack
     │
     ▼
Workers Connect to MySQL
through Private VPC
     │
     ▼
Application Available
```

---

# License

This project is intended for educational and portfolio purposes, demonstrating practical implementation of Infrastructure as Code (IaC), container orchestration, CI/CD automation, and secure cloud deployment using AWS, Docker Swarm, Ansible, and GitHub Actions.
