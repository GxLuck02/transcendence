.PHONY: all help setup ssl env frontend build rebuild up down clean fclean re nuke logs shell

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

# Default target - launches everything with a single command
all: setup build up
	@echo "$(GREEN)═══════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  ✓ ft_transcendence is ready!$(NC)"
	@echo "$(GREEN)  Access the application at: https://localhost:8443$(NC)"
	@echo "$(GREEN)═══════════════════════════════════════════════════════════$(NC)"

help:
	@echo "$(GREEN)ft_transcendence - Available commands:$(NC)"
	@echo ""
	@echo "  $(YELLOW)make$(NC)          - Setup + build + start (single command launch)"
	@echo ""
	@echo "  $(YELLOW)make setup$(NC)    - First time setup (SSL + .env + frontend)"
	@echo "  $(YELLOW)make frontend$(NC) - Build frontend only"
	@echo "  $(YELLOW)make build$(NC)    - Build Docker containers"
	@echo "  $(YELLOW)make rebuild$(NC)  - Build containers without cache"
	@echo "  $(YELLOW)make up$(NC)       - Start all services"
	@echo "  $(YELLOW)make down$(NC)     - Stop all services"
	@echo "  $(YELLOW)make logs$(NC)     - View logs"
	@echo "  $(YELLOW)make shell$(NC)    - API shell (Node.js)"
	@echo "  $(YELLOW)make clean$(NC)    - Stop and remove containers"
	@echo "  $(YELLOW)make fclean$(NC)   - Full clean (including volumes)"
	@echo "  $(YELLOW)make re$(NC)       - Rebuild everything from scratch"
	@echo "  $(YELLOW)make nuke$(NC)     - $(RED)NUCLEAR$(NC) rebuild (purge ALL Docker cache)"

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

rebuild:
	@echo "$(YELLOW)Rebuilding Docker containers (no cache)...$(NC)"
	docker compose build --no-cache
	@echo "$(GREEN)✓ Rebuild complete$(NC)"

up:
	@echo "$(YELLOW)Starting all services...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✓ Services started$(NC)"

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

nuke:
	@echo "$(RED)═══════════════════════════════════════════════════════════$(NC)"
	@echo "$(RED)  ⚠️  ATTENTION: NUCLEAR REBUILD  ⚠️$(NC)"
	@echo "$(RED)═══════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)Cette commande va:$(NC)"
	@echo "  - Supprimer TOUS les containers et volumes du projet"
	@echo "  - $(RED)Purger TOUT le cache Docker de votre machine$(NC)"
	@echo "  - $(RED)Supprimer TOUTES les images Docker non utilisées$(NC)"
	@echo "  - Reconstruire le projet de zéro"
	@echo ""
	@echo "$(YELLOW)Cela peut affecter vos autres projets Docker!$(NC)"
	@echo ""
	@read -p "Êtes-vous sûr de vouloir continuer? [y/N] " confirm && [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ] || (echo "$(GREEN)Annulé.$(NC)" && exit 1)
	@echo ""
	$(MAKE) fclean
	@echo "$(RED)Nuclear rebuild - removing ALL Docker cache...$(NC)"
	docker system prune -af --volumes 2>/dev/null || true
	@echo "$(YELLOW)Rebuilding from scratch...$(NC)"
	$(MAKE) setup
	docker compose build --no-cache --pull
	docker compose up -d
	@echo "$(GREEN)═══════════════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN)  ✓ Nuclear rebuild complete!$(NC)"
	@echo "$(GREEN)  Access the application at: https://localhost:8443$(NC)"
	@echo "$(GREEN)═══════════════════════════════════════════════════════════$(NC)"

logs:
	docker compose logs -f

shell:
	@echo "$(YELLOW)Opening Node.js shell in API container...$(NC)"
	docker compose exec api node
