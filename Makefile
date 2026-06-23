# HSE Pro Enterprise - Makefile
# Usage: make <target>

.PHONY: help dev prod stop restart logs build db-shell backup restore clean setup ssl

COMPOSE_DEV  = docker-compose -f docker-compose.yml
COMPOSE_PROD = docker-compose -f docker-compose.prod.yml

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup:  ## First-time setup: copy env files and generate SSL
	@[ -f backend/.env ] || cp backend/.env.example backend/.env && echo "Created backend/.env — edit it with your values"
	@[ -f frontend/.env.local ] || cp frontend/.env.local.example frontend/.env.local && echo "Created frontend/.env.local"
	@mkdir -p nginx/ssl uploads
	@bash docker/generate-ssl.sh
	@echo ""
	@echo "Setup complete. Run: make dev"

dev:  ## Start development environment
	$(COMPOSE_DEV) up --build

dev-bg:  ## Start development environment in background
	$(COMPOSE_DEV) up -d --build

prod:  ## Start production environment
	$(COMPOSE_PROD) up -d --build

stop:  ## Stop all containers
	$(COMPOSE_DEV) down 2>/dev/null; $(COMPOSE_PROD) down 2>/dev/null; true

restart:  ## Restart all containers
	$(COMPOSE_DEV) restart

logs:  ## Follow logs (all services)
	$(COMPOSE_DEV) logs -f

logs-backend:  ## Follow backend logs only
	$(COMPOSE_DEV) logs -f backend

logs-frontend:  ## Follow frontend logs only
	$(COMPOSE_DEV) logs -f frontend

build:  ## Build all Docker images
	$(COMPOSE_DEV) build --no-cache

db-shell:  ## Open PostgreSQL shell
	$(COMPOSE_DEV) exec postgres psql -U hse_user -d hse_pro

db-reset:  ## Drop and recreate database (DESTRUCTIVE)
	@read -p "This will DELETE all data. Type 'yes' to confirm: " c; [ "$$c" = "yes" ] || exit 1
	$(COMPOSE_DEV) exec postgres psql -U hse_user -c "DROP DATABASE IF EXISTS hse_pro; CREATE DATABASE hse_pro;"
	$(COMPOSE_DEV) exec postgres psql -U hse_user -d hse_pro -f /docker-entrypoint-initdb.d/01-schema.sql
	$(COMPOSE_DEV) exec postgres psql -U hse_user -d hse_pro -f /docker-entrypoint-initdb.d/02-seed.sql
	@echo "Database reset complete"

backup:  ## Create database backup
	$(COMPOSE_DEV) exec backend sh /app/docker/backup.sh

restore:  ## Restore database from backup (RESTORE_FILE=path/to/backup.sql.gz)
	$(COMPOSE_DEV) exec backend sh /app/docker/restore.sh $(RESTORE_FILE)

health:  ## Check system health
	$(COMPOSE_DEV) exec backend sh /app/docker/healthcheck.sh

ssl:  ## Generate SSL certificate
	@bash docker/generate-ssl.sh

clean:  ## Remove containers, volumes (DESTRUCTIVE)
	@read -p "This will DELETE all data and volumes. Type 'yes' to confirm: " c; [ "$$c" = "yes" ] || exit 1
	$(COMPOSE_DEV) down -v --remove-orphans
	$(COMPOSE_PROD) down -v --remove-orphans 2>/dev/null; true

install-backend:  ## Install backend dependencies
	cd backend && npm install

install-frontend:  ## Install frontend dependencies
	cd frontend && npm install

typecheck:  ## Run TypeScript checks on both projects
	@echo "Checking backend..."
	@cd backend && npx tsc --noEmit && echo "Backend: OK"
	@echo "Checking frontend..."
	@cd frontend && npx tsc --noEmit && echo "Frontend: OK"

seed:  ## Re-run seed data
	$(COMPOSE_DEV) exec postgres psql -U hse_user -d hse_pro -f /docker-entrypoint-initdb.d/02-seed.sql
