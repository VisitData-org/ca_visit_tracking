AIRFLOW_HOME := $(PWD)/build/airflow
.PHONY: test-hello

airflow-tunnel:
	@echo "Starting airflow tunnel. Connect to http://localhost:18080"
	gcloud compute ssh airflow-master -- -N -L 18080:localhost:80

test-hello:
	airflow test --subdir "$(PWD)/dags" dag-hello task-hello $(shell date +'%Y-%m-%d')

test-weather:
	@echo "Note: See Makefile for command to run to set config and replace PLACEHOLDER with weatherapi key"
	#airflow variables -s extract_weather_data_config '{"weatherapi_base_url": "http://api.weatherapi.com/v1/history.json?key={key}&q={q}+united+states&dt={dt}", "weatherapi_key": "PLACEHOLDER", "visitdata_bucket_name": "data.visitdata.org", "weatherapi_bucket_base_path": "processed/vendor/api.weatherapi.com/asof/{date}"}'
	airflow test --subdir "$(PWD)/dags" dag-extract-weather-data task-load-weather-New-York "$(shell date +'%Y-%m-%d')"

deploy:
	gsutil rsync -rP dags/ gs://dev.visitdata.org/dags/
