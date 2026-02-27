env "local" {
  src = "file://migrations"
  url = "postgres://nexora:nexora@localhost:5432/nexora?sslmode=disable"
  dev = "docker://postgres/16/dev?search_path=public"

  migration {
    dir = "file://migrations"
  }
}
