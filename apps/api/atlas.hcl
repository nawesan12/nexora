env "local" {
  src = "file://migrations"
  url = "postgres://pronto:pronto@localhost:5433/pronto?sslmode=disable"
  dev = "docker://postgres/16/dev?search_path=public"

  migration {
    dir = "file://migrations"
  }
}
