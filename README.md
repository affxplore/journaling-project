# Journaling Side Project

This is a fullstack journaling application built with a modern, emerging web design aesthetic (pastel pink, pixel art inspired). It features a React frontend and an Express/Node.js backend connected to a MySQL database.

## Architecture

The system is designed for deployment based on the following architecture:
- **Frontend/Backend Workers**: Deployed across EC2-2, EC2-3, EC2-4 via Docker Swarm, acting as worker nodes.
- **Database**: A MySQL database hosted on EC2-5, secured via UFW.
- **Orchestration**: Docker Swarm managed by an Ansible Control Node on EC2-1.

## Local Development (Testing)

You can run the entire stack locally using Docker Compose.

### Prerequisites
- Docker
- Docker Compose

### Running the App Locally

1. Clone the repository and navigate to the root directory.
2. Run `docker-compose up --build -d`
3. The frontend will be available at `http://localhost:5173`
4. The backend API will be available at `http://localhost:3000`
5. The MySQL database will be running on port `3306`.

### Stopping the App

Run `docker-compose down` to stop and remove the containers.

## Cloud Deployment Guide

Follow these steps to deploy the application to your AWS EC2 environment as per the architecture diagram.

### Phase 1: Prepare the Code

1. **Build Docker Images and Push to Registry**:
   Ensure you have a Docker Hub or ECR registry set up.
   ```bash
   # Build Frontend
   cd frontend
   docker build -t your-registry/journal-frontend:latest .
   docker push your-registry/journal-frontend:latest
   
   # Build Backend
   cd ../backend
   docker build -t your-registry/journal-backend:latest .
   docker push your-registry/journal-backend:latest
   ```

### Phase 2: Database Setup (EC2-5)

1. **Install MySQL**: Connect to EC2-5 and install MySQL.
   ```bash
   sudo apt update
   sudo apt install mysql-server
   sudo systemctl start mysql
   ```
2. **Configure MySQL**: Create the database and user. Run the provided `schema.sql` script to set up tables.
3. **Configure UFW Firewall**: Only allow connections from the Private VPC Network (EC2-2, EC2-3, EC2-4).
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   # Replace with your VPC CIDR, e.g., 10.0.0.0/16
   sudo ufw allow from 10.0.0.0/16 to any port 3306
   sudo ufw enable
   ```

### Phase 3: Docker Swarm Setup (EC2-1 to EC2-4)

1. **Initialize Swarm on Manager Node (EC2-1)**:
   ```bash
   docker swarm init --advertise-addr <EC2-1-Private-IP>
   ```
   This command outputs a `docker swarm join` token.

2. **Join Worker Nodes (EC2-2, EC2-3, EC2-4)**:
   SSH into each worker node and run the `docker swarm join` command copied from the manager node.

### Phase 4: Infrastructure as Code with Ansible (EC2-1)

Create an Ansible Playbook on EC2-1 to automate the deployment of the stack.

**Sample `deploy.yml`**:
```yaml
---
- hosts: swarm_manager
  tasks:
    - name: Deploy Journal Stack
      docker_stack:
        state: present
        name: journalapp
        compose:
          - version: "3.8"
            services:
              backend:
                image: your-registry/journal-backend:latest
                environment:
                  DB_HOST: <EC2-5-Private-IP>
                  DB_USER: root
                  DB_PASSWORD: your_secure_password
                  DB_NAME: journal_db
                  JWT_SECRET: your_production_jwt_secret
                deploy:
                  replicas: 3
                networks:
                  - backend_overlay
              frontend:
                image: your-registry/journal-frontend:latest
                environment:
                  VITE_API_URL: http://<Load-Balancer-IP>/api
                deploy:
                  replicas: 3
                ports:
                  - "80:5173"
                networks:
                  - backend_overlay
            networks:
              backend_overlay:
                driver: overlay
```

Run the playbook:
```bash
ansible-playbook -i inventory.ini deploy.yml
```

### Environment Variables

Ensure the following environment variables are set correctly during deployment:
*   **Backend:**
    *   `DB_HOST`: The private IP of EC2-5
    *   `DB_USER`: Database user
    *   `DB_PASSWORD`: Database password
    *   `DB_NAME`: `journal_db`
    *   `JWT_SECRET`: A strong random string for JWT signing
    *   `PORT`: `3000` (internal container port)
*   **Frontend:**
    *   `VITE_API_URL`: The public-facing URL of the backend API (e.g., via an Nginx reverse proxy or ALB).
