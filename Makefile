SHELL := /bin/bash

.DEFAULT_GOAL := help

WORKSPACE    := $(realpath $(shell pwd))
PROJECT_NAME := $(notdir $(WORKSPACE))

-include ${DEV_MAKE}/colours.mk

# Fallbacks wenn DEV_MAKE nicht verfügbar (z.B. auf dem Server)
YELLOW ?= $(shell printf "\033[38;5;3m")
GREEN  ?= $(shell printf "\033[38;5;2m")
BLUE   ?= $(shell printf "\033[38;5;6m")
ORANGE ?= $(shell printf "\033[38;5;214m")
RED    ?= $(shell printf "\033[38;5;1m")
WHITE  ?= $(shell printf "\033[38;5;7m")
RESET  ?= $(shell printf "\033[0m")
NC     ?= $(shell printf "\033[0m")

# THEME-Variablen — werden von colours.mk gesetzt, hier als Fallback
THEME_COLOR_GROUP  ?= $(YELLOW)
THEME_COLOR_TARGET ?= $(BLUE)
THEME_COLOR_DESC   ?= $(GREEN)
THEME_COLOR_SERVER ?= $(ORANGE)
THEME_COLOR_DANGER ?= $(RED)
THEME_INDENT_GROUP ?= $(shell printf "  ")
THEME_INDENT_TARGET?= $(shell printf "    ")

# ── Deploy-Konfiguration ──────────────────────────────────────────────────────
# Werte kommen aus .env.deploy (gitignored) — siehe .env.deploy.example
-include .env.deploy
export

DEPLOY_HOST ?=
DEPLOY_PATH ?=

# ─── Hilfe ───────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Alle verfügbaren Befehle anzeigen
	@echo
	@echo "Please use \`make <$(THEME_COLOR_GROUP)target$(RESET)>' where <target> is one of"
	@echo
	@echo "Project: $(THEME_COLOR_GROUP)$(PROJECT_NAME)$(RESET)"
	@echo
	@grep -hE '^(##@|[a-zA-Z0-9_-]+:.*?##[R]? )' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*##[R]? "}; \
	    /^##@/ { printf "\n$(THEME_INDENT_GROUP)$(THEME_COLOR_GROUP)%s$(RESET)\n", substr($$0, 4); next }; \
	    /##R /  { printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_SERVER)%-20s $(THEME_COLOR_DESC)%s$(RESET)\n", $$1, $$2; next }; \
	    /## /   { printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-20s $(THEME_COLOR_DESC)%s$(RESET)\n", $$1, $$2 }'
	@echo
	@echo "  $(THEME_COLOR_TARGET)■$(RESET) lokal   $(THEME_COLOR_SERVER)■$(RESET) SSH → Server, schreibend"
	@echo

.PHONY: info
info: ## Workspace-Variablen anzeigen
	@echo
	@echo "    $(YELLOW)PROJECT_NAME$(RESET) = $(BLUE)$(PROJECT_NAME)$(RESET)"
	@echo "    $(YELLOW)WORKSPACE$(RESET)    = $(BLUE)$(WORKSPACE)$(RESET)"
	@echo "    $(YELLOW)DEPLOY_HOST$(RESET)  = $(BLUE)$(DEPLOY_HOST)$(RESET)"
	@echo "    $(YELLOW)DEPLOY_PATH$(RESET)  = $(BLUE)$(DEPLOY_PATH)$(RESET)"
	@echo

.PHONY: hints
hints: ## Nützliche Links und URLs anzeigen
	@echo
	@echo "  $(YELLOW)GitHub$(RESET)"
	@echo
	@printf "    $(BLUE)%-12s$(RESET) $(WHITE)%s$(RESET)\n" "Repo" "https://github.com/MikeMitterer/secretvault"
	@echo
	@echo "  $(YELLOW)URLs$(RESET)"
	@echo
	@printf "    $(BLUE)%-12s$(RESET) $(WHITE)%s$(RESET)\n" "Dev"    "http://localhost:5173"
	@printf "    $(BLUE)%-12s$(RESET) $(WHITE)%s$(RESET)\n" "Live"   "https://sv.mangolila.at"
	@echo
	@echo "  $(YELLOW)Deploy$(RESET)"
	@echo
	@printf "    $(BLUE)%-12s$(RESET) $(WHITE)%s$(RESET)\n" "Host"   "$(DEPLOY_HOST)"
	@printf "    $(BLUE)%-12s$(RESET) $(WHITE)%s$(RESET)\n" "Path"   "$(DEPLOY_PATH)"
	@printf "    $(BLUE)%-12s$(RESET) $(WHITE)%s$(RESET)\n" "" "Überschreiben: make deploy DEPLOY_HOST=user@server"
	@echo

# ─── Setup ───────────────────────────────────────────────────────────────────

##@ Setup

.PHONY: install
install: ## Node-Abhängigkeiten installieren
	npm install

# ─── Entwicklung ─────────────────────────────────────────────────────────────

##@ Entwicklung

.PHONY: dev
dev: ## Dev-Server starten → http://localhost:5173
	npm run dev

.PHONY: preview
preview: ## Production Build lokal vorschauen
	npm run preview

# ─── Tests ───────────────────────────────────────────────────────────────────

##@ Tests

.PHONY: test
test: ## Tests einmalig ausführen
	npm run test

.PHONY: test-watch
test-watch: ## Tests im Watch-Modus (interaktiv)
	npm run test:watch

.PHONY: test-coverage
test-coverage: ## Tests mit Coverage-Report
	npm run test:coverage

# ─── Build & Deploy ──────────────────────────────────────────────────────────

##@ Build & Deploy

.PHONY: server-init
server-init: ##R Deploy-Script nach /tmp/ auf dem Server kopieren (einmalig)
	@test -n "$(DEPLOY_HOST)" || (echo "$(RED)Fehler: DEPLOY_HOST nicht gesetzt$(RESET)" && exit 1)
	scp scripts/fix-deploy-perms-secretvault.sh $(DEPLOY_HOST):/tmp/
	@echo "$(GREEN)✓ Script nach /tmp/ kopiert$(RESET)"
	@echo "$(YELLOW)→ Noch manuell auf dem Server ausführen:$(RESET)"
	@echo "  sudo mv /tmp/fix-deploy-perms-secretvault.sh /usr/local/bin/"
	@echo "  sudo chmod +x /usr/local/bin/fix-deploy-perms-secretvault.sh"
	@echo "  sudo visudo -f /etc/sudoers.d/10-deploy-secretvault"
	@echo "  Inhalt: ubuntu ALL=(ALL) NOPASSWD: /usr/local/bin/fix-deploy-perms-secretvault.sh"

.PHONY: build
build: ## Production Build erstellen → dist/
	npm run build

.PHONY: deploy
deploy: build ##R Build erstellen und per rsync auf Server deployencat
	@test -n "$(DEPLOY_HOST)" || (echo "$(RED)Fehler: DEPLOY_HOST nicht gesetzt — .env.deploy prüfen$(RESET)" && exit 1)
	@test -n "$(DEPLOY_PATH)" || (echo "$(RED)Fehler: DEPLOY_PATH nicht gesetzt — .env.deploy prüfen$(RESET)" && exit 1)
	@echo "→ Deploying to $(DEPLOY_HOST):$(DEPLOY_PATH) ..."
	rsync -avzO --no-perms --delete dist/ $(DEPLOY_HOST):$(DEPLOY_PATH)/
	ssh $(DEPLOY_HOST) "sudo /usr/local/bin/fix-deploy-perms-secretvault.sh"
	@echo "✓ Deploy abgeschlossen → https://sv.mangolila.at"

.PHONY: deploy-dry
deploy-dry: build ## Deploy simulieren (kein Upload, --dry-run)
	rsync -avzO --no-perms --dry-run --delete dist/ $(DEPLOY_HOST):$(DEPLOY_PATH)/

# ─── Wartung ─────────────────────────────────────────────────────────────────

##@ Wartung

.PHONY: clean
clean: ## node_modules und dist/ löschen
	rm -rf node_modules dist
