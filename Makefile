.PHONY: help setup ssl env frontend build up down clean fclean re logs shell

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

help:
	@echo "$(GREEN)ft_transcendence - Available commands:$(NC)"
	@echo "  $(YELLOW)make setup$(NC)    - First time setup (SSL + .env + frontend)"
	@echo "  $(YELLOW)make frontend$(NC) - Build frontend only"
	@echo "  $(YELLOW)make build$(NC)    - Build Docker containers"
	@echo "  $(YELLOW)make up$(NC)       - Start all services"
	@echo "  $(YELLOW)make down$(NC)     - Stop all services"
	@echo "  $(YELLOW)make logs$(NC)     - View logs"
	@echo "  $(YELLOW)make shell$(NC)    - Django shell"
	@echo "  $(YELLOW)make clean$(NC)    - Stop and remove containers"
	@echo "  $(YELLOW)make fclean$(NC)   - Full clean (including volumes)"
	@echo "  $(YELLOW)make re$(NC)       - Rebuild everything"

setup: ssl env frontend
	@echo "$(GREEN)✓ Setup complete! You can now run: make build && make up$(NC)"

ssl:
	@echo "$(YELLOW)Generating SSL certificates...$(NC)"
	@mkdir -p nginx/ssl
	@if command -v openssl > /dev/null 2>&1; then \
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout nginx/ssl/key.pem \
			-out nginx/ssl/cert.pem \
			-subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=localhost" 2>/dev/null; \
		chmod 644 nginx/ssl/cert.pem; \
		chmod 600 nginx/ssl/key.pem; \
		echo "$(GREEN)✓ SSL certificates generated with local openssl$(NC)"; \
	else \
		echo "$(YELLOW)OpenSSL not found locally, using Docker...$(NC)"; \
		docker run --rm -v "$$(pwd)/nginx/ssl:/ssl" alpine/openssl req -x509 -nodes -days 365 \
			-newkey rsa:2048 -keyout /ssl/key.pem -out /ssl/cert.pem \
			-subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=localhost" 2>/dev/null; \
		echo "$(GREEN)✓ SSL certificates generated with Docker$(NC)"; \
	fi

env:
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from template...$(NC)"; \
		cp .env.example .env; \
		echo "$(GREEN)✓ .env file created$(NC)"; \
		echo "$(YELLOW)⚠ Please edit .env and add your OAuth 42 credentials$(NC)"; \
	else \
		echo "$(GREEN)✓ .env file already exists$(NC)"; \
	fi

frontend:
	@echo "$(YELLOW)Building frontend...$(NC)"
	@if command -v npm > /dev/null 2>&1; then \
		cd frontend && bash build.sh; \
	else \
		echo "$(YELLOW)npm not found locally, using Docker to build frontend...$(NC)"; \
		docker run --rm -v "$$(pwd)/frontend:/app" -w /app node:20-alpine sh -c "npm install && npm run build"; \
	fi
	@echo "$(GREEN)✓ Frontend built successfully$(NC)"

build:
	@echo "$(YELLOW)Building Docker containers...$(NC)"
	docker compose build
	@echo "$(GREEN)✓ Build complete$(NC)"

up:
	@echo "$(YELLOW)Starting all services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "$(GREEN)Access the application at: https://localhost:8443$(NC)"

down:
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker compose down
	@echo "$(GREEN)✓ Services stopped$(NC)"

clean: down
	@echo "$(YELLOW)Removing containers...$(NC)"
	docker compose down -v --remove-orphans
	@echo "$(GREEN)✓ Containers removed$(NC)"

fclean: clean
	@echo "$(YELLOW)Full cleanup (containers + volumes + images)...$(NC)"
	docker compose down -v --rmi all --remove-orphans
	@rm -rf nginx/ssl/*.pem
	@rm -rf frontend/dist
	@rm -rf frontend/node_modules
	@echo "$(GREEN)✓ Full cleanup complete$(NC)"

re: fclean setup build up

logs:
	docker compose logs -f

shell:
	docker compose exec web python manage.py shell

migrate:
	docker compose exec web python manage.py makemigrations
	docker compose exec web python manage.py migrate

superuser:
	docker compose exec web python manage.py createsuperuser

test:
	docker compose exec web python manage.py test

collectstatic:
	docker compose exec web python manage.py collectstatic --noinput
