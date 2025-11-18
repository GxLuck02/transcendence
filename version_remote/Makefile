.PHONY: build run stop clean logs restart help dev-start dev-stop install

# Variables
# Par défaut, SUDO est vide pour permettre l'exécution sans privilèges.
# Si l'utilisateur a besoin de sudo, exécutez: SUDO=sudo make <target>
SUDO ?=
DOCKER_COMPOSE = $(SUDO)docker compose
CONTAINER_NAME = pong_game
CONTAINER_DEV = pong_game_dev

# Couleurs pour les messages
GREEN = \033[0;32m
YELLOW = \033[0;33m
BLUE = \033[0;34m
RED = \033[0;31m
NC = \033[0m # No Color

help: ## Affiche l'aide
	@echo "$(GREEN)Makefile pour Pong Game (TypeScript + React)$(NC)"
	@echo ""
	@echo "$(BLUE)Production:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -v "dev-" | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BLUE)Développement:$(NC)"
	@grep -E '^dev-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Installe les dépendances npm localement
	@echo "$(GREEN)Installation des dépendances...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✓ Dépendances installées$(NC)"

build: ## Construit l'image Docker (production)
	@echo "$(GREEN)Construction de l'image Docker...$(NC)"
	$(DOCKER_COMPOSE) build

run: ## Lance le conteneur de production
	@echo "$(GREEN)Démarrage du jeu Pong (production)...$(NC)"
	$(DOCKER_COMPOSE) up -d --build
	@echo "$(GREEN)✓ Application disponible sur http://localhost:8080$(NC)"

stop: ## Arrête les conteneurs
	@echo "$(YELLOW)Arrêt des conteneurs...$(NC)"
	$(DOCKER_COMPOSE) stop

down: ## Arrête et supprime les conteneurs
	@echo "$(YELLOW)Arrêt et suppression des conteneurs...$(NC)"
	$(DOCKER_COMPOSE) down

restart: ## Redémarre les conteneurs
	@echo "$(YELLOW)Redémarrage des conteneurs...$(NC)"
	$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✓ Application redémarrée$(NC)"

logs: ## Affiche les logs des conteneurs
	$(DOCKER_COMPOSE) logs -f

clean: ## Nettoie tout (conteneurs, images, volumes)
	@echo "$(RED)Nettoyage complet...$(NC)"
	@$(SUDO)docker rm -f $(CONTAINER_NAME) 2>/dev/null || true
	@$(SUDO)docker rm -f $(CONTAINER_DEV) 2>/dev/null || true
	$(DOCKER_COMPOSE) down -v --rmi all
	@echo "$(GREEN)✓ Nettoyage terminé$(NC)"

status: ## Affiche le statut des conteneurs
	@echo "$(GREEN)Statut des conteneurs:$(NC)"
	@$(SUDO)docker ps -a | grep $(CONTAINER_NAME) || echo "$(RED)Aucun conteneur trouvé$(NC)"

re: clean run ## Reconstruit tout depuis zéro (production)
	@echo "$(GREEN)✓ Reconstruction complète terminée$(NC)"

# Commandes de développement
dev-start: ## Lance le serveur de développement (hot reload)
	@echo "$(BLUE)Démarrage du serveur de développement...$(NC)"
	$(DOCKER_COMPOSE) --profile dev up -d pong-dev
	@echo "$(GREEN)✓ Serveur de dev disponible sur http://localhost:5173$(NC)"
	@echo "$(YELLOW)Hot reload activé - vos modifications seront visibles instantanément$(NC)"

dev-stop: ## Arrête le serveur de développement
	@echo "$(YELLOW)Arrêt du serveur de développement...$(NC)"
	$(DOCKER_COMPOSE) stop pong-dev

dev-logs: ## Affiche les logs du serveur de développement
	$(DOCKER_COMPOSE) logs -f pong-dev

dev-restart: ## Redémarre le serveur de développement
	@echo "$(YELLOW)Redémarrage du serveur de développement...$(NC)"
	$(DOCKER_COMPOSE) restart pong-dev

dev-shell: ## Ouvre un shell dans le conteneur de développement
	@$(DOCKER_COMPOSE) exec pong-dev sh
