AIRFLOW_HOME := $(PWD)/build/airflow
.PHONY: test-hello

airflow-tunnel:
	@echo "Starting airflow tunnel. Connect to http://localhost:18080"
	gcloud compute ssh airflow-master -- -N -L 18080:localhost:80

test-hello:
	airflow test --subdir "$(PWD)/dags" dag-hello task-hello $(shell date +'%Y-%m-%d')

test-weather:
	@echo "Note: See Makefile for command to run to set config and replace PLACEHOLDER with weatherapi key"
	# airflow variables -s weather_config '{
	#   "weatherapi_base_url": "http://api.weatherapi.com/v1/history.json?key={key}&q={q}+united+states&dt={dt}",
	#   "weatherapi_key": "PLACEHOLDER",
	#   "visitdata_bucket_name": "data.visitdata.org",
	#   "weatherapi_raw_bucket_base_path": "raw/vendor/api.weatherapi.com/asof/{date}",
	#   "weatherapi_merged_bucket_base_path": "processed/vendor/api.weatherapi.com/asof/{date}",
	#   "start_date": "2020-02-01"
	# }'
	airflow test --subdir "$(PWD)/dags" dag-weather load-raw-weather-New-York "$(shell date +'%Y-%m-%d')"
	airflow test --subdir "$(PWD)/dags" dag-weather load-merged-weather-New-York "$(shell date +'%Y-%m-%d')"

deploy:
	gsutil rsync -rP dags/ gs://dev.visitdata.org/dags/
