SHELL := /bin/bash

.DEFAULT_GOAL := help

WORKSPACE    := $(realpath $(shell pwd))
PROJECT_NAME := $(notdir $(WORKSPACE))

# ── Deploy-Konfiguration ─────────────────────────────────────────────────────
# Überschreiben via: make deploy DEPLOY_HOST=user@server DEPLOY_PATH=/var/www/...
DEPLOY_HOST ?= deploy@mangolila.at
DEPLOY_PATH ?= /var/www/sv.mangolila.at

# ── Hilfe ────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Alle verfügbaren Befehle anzeigen
	@echo
	@echo "Please use \`make <target>' where <target> is one of"
	@echo
	@echo "Project: $(PROJECT_NAME)"
	@echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "    %-18s %s\n", $$1, $$2}'
	@echo
	@$(MAKE) hints

.PHONY: hints
hints: ## Nützliche Hinweise anzeigen
	@echo "Hints:"
	@echo
	@echo "    Deploy-Config (Makefile-Variablen):"
	@echo "        DEPLOY_HOST = $(DEPLOY_HOST)"
	@echo "        DEPLOY_PATH = $(DEPLOY_PATH)"
	@echo
	@echo "    Überschreiben: make deploy DEPLOY_HOST=user@server"
	@echo
	@echo "    URLs (nach make dev):"
	@echo "        Dev   - http://localhost:5173"
	@echo "        Live  - https://sv.mangolila.at"
	@echo

# ── Setup ────────────────────────────────────────────────────────────────────

##@ Setup

.PHONY: install
install: ## Node-Abhängigkeiten installieren
	npm install

# ── Entwicklung ──────────────────────────────────────────────────────────────

##@ Entwicklung

.PHONY: dev
dev: ## Dev-Server starten → http://localhost:5173
	npm run dev

.PHONY: preview
preview: ## Production Build lokal vorschauen
	npm run preview

# ── Tests ─────────────────────────────────────────────────────────────────────

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

# ── Build & Deploy ────────────────────────────────────────────────────────────

##@ Build & Deploy

.PHONY: build
build: ## Production Build erstellen → dist/
	npm run build

.PHONY: deploy
deploy: build ## Build erstellen und per rsync auf Server deployen
	@echo "→ Deploying to $(DEPLOY_HOST):$(DEPLOY_PATH) ..."
	rsync -avz --delete dist/ $(DEPLOY_HOST):$(DEPLOY_PATH)/
	@echo "✓ Deploy abgeschlossen → https://sv.mangolila.at"

.PHONY: deploy-dry
deploy-dry: build ## Deploy simulieren (kein Upload)
	rsync -avz --dry-run --delete dist/ $(DEPLOY_HOST):$(DEPLOY_PATH)/

# ── Wartung ───────────────────────────────────────────────────────────────────

##@ Wartung

.PHONY: clean
clean: ## node_modules und dist/ löschen
	rm -rf node_modules dist
