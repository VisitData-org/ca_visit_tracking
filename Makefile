deploy:
	@echo "Please specify:"
	@echo "    'make deploy-prod' to deploy to visitdata.org"
	@echo "    'make deploy-beta' to deploy to beta.visitdata.org"

deploy-prod:
	bin/deploy.sh prod

deploy-beta:
	bin/deploy.sh beta
