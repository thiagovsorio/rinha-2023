build.up:
	docker compose build
	docker compose up
build.up.db:
	docker compose up postgres
build.up.apps:
	docker compose build app1 app2
	docker compose up app1 app2
