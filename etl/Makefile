AIRFLOW_HOME := $(PWD)/build/airflow
.PHONY: test-hello

airflow-tunnel:
	@echo "Starting airflow tunnel. Connect to http://localhost:18080"
	gcloud compute ssh airflow-master -- -N -L 18080:localhost:80

test-hello:
	airflow test --subdir "$(PWD)/dags" dag-hello task-hello $(shell date +'%Y-%m-%d')

deploy:
	gsutil rsync -rP dags/ gs://dev.visitdata.org/dags/
