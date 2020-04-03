deploy:
	@echo "Please specify:"
	@echo "    'make deploy-prod' to deploy to visitdata.org"
	@echo "    'make deploy-beta' to deploy to beta.visitdata.org"

deploy-prod:
	@echo "Deploying to visitdata.org..."
	bin/deploy.sh prod

deploy-beta:
	@echo "Deploying to beta.visitdata.org..."
	bin/deploy.sh beta

run:
	@echo "Running locally in development mode..."
	python main.py
