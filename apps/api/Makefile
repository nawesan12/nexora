.PHONY: build run dev test lint migrate sqlc docker clean

# Build the server binary
build:
	go build -o bin/server ./cmd/server

# Run the server
run: build
	./bin/server

# Run with hot reload (requires air)
dev:
	air

# Run tests
test:
	go test -v -race ./...

# Run linter (requires golangci-lint)
lint:
	golangci-lint run ./...

# Run Atlas migrations
migrate-apply:
	atlas migrate apply --env local

migrate-diff:
	atlas migrate diff --env local

migrate-status:
	atlas migrate status --env local

# Generate sqlc code
sqlc:
	sqlc generate

# Docker build
docker:
	docker build -t nexora-api .

# Clean build artifacts
clean:
	rm -rf bin/ tmp/
