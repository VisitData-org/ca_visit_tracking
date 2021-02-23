deploy:
	@echo "Please specify:"
	@echo "    'make deploy-prod' to deploy to visitdata.org"
	@echo "    'make deploy-beta' to deploy to beta.visitdata.org"
	@echo "    'make deploy-prod-quiet' to deploy to visitdata.org without asking"
	@echo "    'make deploy-beta-quiet' to deploy to beta.visitdata.org without asking"

deploy-prod:
	@echo "Deploying to visitdata.org..."
	bin/deploy.sh prod

deploy-beta:
	@echo "Deploying to beta.visitdata.org..."
	bin/deploy.sh beta

deploy-prod-quiet:
	@echo "Quietly deploying to visitdata.org..."
	bin/deploy.sh prod true

deploy-beta-quiet:
	@echo "Quietly deploying to beta.visitdata.org..."
	bin/deploy.sh beta true

run:
	@echo "Running locally in development mode..."
	python main.py
