package service

import (
	"context"
	"errors"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

const (
	demoEmail    = "demo@pronto.app"
	demoPassword = "Demo1234!"
)

// DemoResult holds the credentials returned after seeding the demo account.
type DemoResult struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Message  string `json:"message"`
}

// DemoService creates and seeds a demo account with sample data.
type DemoService struct {
	db      *pgxpool.Pool
	queries *repository.Queries
}

// NewDemoService creates a new demo service.
func NewDemoService(db *pgxpool.Pool) *DemoService {
	return &DemoService{
		db:      db,
		queries: repository.New(db),
	}
}

// SeedDemoAccount creates a demo user with sample data. It is idempotent:
// if the demo account already exists it returns the existing credentials.
func (s *DemoService) SeedDemoAccount(ctx context.Context) (*DemoResult, error) {
	// Check if demo user already exists.
	_, err := s.queries.GetUserByEmail(ctx, demoEmail)
	if err == nil {
		return &DemoResult{
			Email:    demoEmail,
			Password: demoPassword,
			Message:  "Cuenta demo ya existente",
		}, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("check demo user: %w", err)
	}

	// Create everything inside a transaction.
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	// 1. Create demo user
	hash, err := bcrypt.GenerateFromPassword([]byte(demoPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user, err := qtx.CreateUser(ctx, repository.CreateUserParams{
		Email:        demoEmail,
		PasswordHash: string(hash),
		Nombre:       "Demo",
		Apellido:     "Pronto",
		Rol:          repository.RolADMIN,
	})
	if err != nil {
		return nil, fmt.Errorf("create demo user: %w", err)
	}

	// Mark email as verified.
	err = qtx.UpdateUserEmailVerified(ctx, demoEmail)
	if err != nil {
		return nil, fmt.Errorf("verify demo email: %w", err)
	}

	// Create user settings.
	_, err = qtx.CreateUserSettings(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("create demo settings: %w", err)
	}

	// 2. Create branch (Sucursal Central).
	branch, err := qtx.CreateBranch(ctx, repository.CreateBranchParams{
		Nombre:    "Sucursal Central",
		Direccion: pgtype.Text{String: "Av. Corrientes 1234, CABA", Valid: true},
		Telefono:  pgtype.Text{String: "011-4567-8900", Valid: true},
		UsuarioID: user.ID,
	})
	if err != nil {
		return nil, fmt.Errorf("create demo branch: %w", err)
	}

	// 3. Create product families.
	familyNames := []struct {
		Nombre string
		Desc   string
	}{
		{"Bebidas", "Bebidas alcoholicas y no alcoholicas"},
		{"Alimentos", "Productos alimenticios envasados"},
		{"Limpieza", "Articulos de limpieza para el hogar"},
		{"Higiene Personal", "Productos de higiene y cuidado personal"},
		{"Varios", "Productos miscelaneos"},
	}

	familyIDs := make([]pgtype.UUID, len(familyNames))
	for i, f := range familyNames {
		fam, err := qtx.CreateFamiliaProducto(ctx, repository.CreateFamiliaProductoParams{
			Nombre:      f.Nombre,
			Descripcion: pgtype.Text{String: f.Desc, Valid: true},
			UsuarioID:   user.ID,
		})
		if err != nil {
			return nil, fmt.Errorf("create family %s: %w", f.Nombre, err)
		}
		familyIDs[i] = fam.ID
	}

	// 4. Create categories (2 per family = 10 total).
	type catDef struct {
		Nombre    string
		Desc      string
		FamilyIdx int
	}
	categories := []catDef{
		{"Gaseosas", "Gaseosas y sodas", 0},
		{"Cervezas", "Cervezas nacionales e importadas", 0},
		{"Galletitas", "Galletitas dulces y saladas", 1},
		{"Enlatados", "Conservas y enlatados", 1},
		{"Lavandina", "Lavandinas y desinfectantes", 2},
		{"Detergentes", "Detergentes y lavavajillas", 2},
		{"Shampoo", "Shampoo y acondicionador", 3},
		{"Jabones", "Jabones y geles de ducha", 3},
		{"Pilas", "Pilas y baterias", 4},
		{"Bolsas", "Bolsas de residuos", 4},
	}

	catIDs := make([]pgtype.UUID, len(categories))
	for i, c := range categories {
		cat, err := qtx.CreateCategoriaProducto(ctx, repository.CreateCategoriaProductoParams{
			Nombre:      c.Nombre,
			Descripcion: pgtype.Text{String: c.Desc, Valid: true},
			FamiliaID:   familyIDs[c.FamilyIdx],
			UsuarioID:   user.ID,
		})
		if err != nil {
			return nil, fmt.Errorf("create category %s: %w", c.Nombre, err)
		}
		catIDs[i] = cat.ID
	}

	// 5. Create 30 products (3 per category).
	type prodDef struct {
		Codigo string
		Nombre string
		Precio float64
		Unidad repository.UnidadDeMedida
		CatIdx int
	}
	products := []prodDef{
		{"BEB001", "Coca-Cola 2.25L", 1500, repository.UnidadDeMedidaUNIDAD, 0},
		{"BEB002", "Sprite 1.5L", 1200, repository.UnidadDeMedidaUNIDAD, 0},
		{"BEB003", "Fanta 2.25L", 1400, repository.UnidadDeMedidaUNIDAD, 0},
		{"BEB004", "Cerveza Quilmes 1L", 1800, repository.UnidadDeMedidaUNIDAD, 1},
		{"BEB005", "Cerveza Brahma 1L", 1600, repository.UnidadDeMedidaUNIDAD, 1},
		{"BEB006", "Cerveza Patagonia IPA 473ml", 2200, repository.UnidadDeMedidaUNIDAD, 1},
		{"ALI001", "Galletitas Oreo x3", 800, repository.UnidadDeMedidaCAJA, 2},
		{"ALI002", "Galletitas Criollitas 500g", 650, repository.UnidadDeMedidaUNIDAD, 2},
		{"ALI003", "Galletitas Polvorita 250g", 450, repository.UnidadDeMedidaUNIDAD, 2},
		{"ALI004", "Tomates Perita 400g", 550, repository.UnidadDeMedidaUNIDAD, 3},
		{"ALI005", "Atun en Aceite 170g", 950, repository.UnidadDeMedidaUNIDAD, 3},
		{"ALI006", "Choclo Cremoso 350g", 600, repository.UnidadDeMedidaUNIDAD, 3},
		{"LIM001", "Lavandina Ayudin 1L", 400, repository.UnidadDeMedidaLITRO, 4},
		{"LIM002", "Lavandina Querubin 2L", 650, repository.UnidadDeMedidaLITRO, 4},
		{"LIM003", "Desinfectante Lysoform 900ml", 900, repository.UnidadDeMedidaUNIDAD, 4},
		{"LIM004", "Detergente Magistral 500ml", 750, repository.UnidadDeMedidaUNIDAD, 5},
		{"LIM005", "Detergente Ala 750ml", 600, repository.UnidadDeMedidaUNIDAD, 5},
		{"LIM006", "Lavavajillas Cif 750ml", 850, repository.UnidadDeMedidaUNIDAD, 5},
		{"HIG001", "Shampoo Dove 400ml", 1100, repository.UnidadDeMedidaUNIDAD, 6},
		{"HIG002", "Shampoo Sedal 350ml", 950, repository.UnidadDeMedidaUNIDAD, 6},
		{"HIG003", "Acondicionador Pantene 400ml", 1200, repository.UnidadDeMedidaUNIDAD, 6},
		{"HIG004", "Jabon Rexona 125g", 350, repository.UnidadDeMedidaUNIDAD, 7},
		{"HIG005", "Jabon Dove 90g", 400, repository.UnidadDeMedidaUNIDAD, 7},
		{"HIG006", "Gel de Ducha Axe 250ml", 900, repository.UnidadDeMedidaUNIDAD, 7},
		{"VAR001", "Pilas Duracell AA x4", 1500, repository.UnidadDeMedidaCAJA, 8},
		{"VAR002", "Pilas Energizer AAA x2", 1000, repository.UnidadDeMedidaCAJA, 8},
		{"VAR003", "Pilas Eveready 9V", 800, repository.UnidadDeMedidaUNIDAD, 8},
		{"VAR004", "Bolsa Residuos 45x60 x10", 500, repository.UnidadDeMedidaBOLSA, 9},
		{"VAR005", "Bolsa Consorcio 80x110 x10", 750, repository.UnidadDeMedidaBOLSA, 9},
		{"VAR006", "Bolsa Residuos 60x90 x20", 900, repository.UnidadDeMedidaBOLSA, 9},
	}

	_ = branch // used below for catalog seeding if needed

	for _, p := range products {
		precio := numericFromFloat(p.Precio)
		_, err := qtx.CreateProducto(ctx, repository.CreateProductoParams{
			Codigo:      pgtype.Text{String: p.Codigo, Valid: true},
			Nombre:      p.Nombre,
			Descripcion: pgtype.Text{},
			PrecioBase:  precio,
			Unidad:      p.Unidad,
			CategoriaID: catIDs[p.CatIdx],
			UsuarioID:   user.ID,
		})
		if err != nil {
			return nil, fmt.Errorf("create product %s: %w", p.Nombre, err)
		}
	}

	// 6. Create 10 clients with addresses.
	type clientDef struct {
		Nombre      string
		Apellido    string
		RazonSocial string
		Cuit        string
		Email       string
		Telefono    string
		Calle       string
		Ciudad      string
	}
	clients := []clientDef{
		{"Juan", "Perez", "Distribuidora Perez SRL", "30-12345678-9", "juan@perez.com", "011-1111-1111", "Av. Rivadavia 5000", "CABA"},
		{"Maria", "Garcia", "Almacen Garcia", "27-23456789-0", "maria@garcia.com", "011-2222-2222", "Calle Florida 100", "CABA"},
		{"Carlos", "Lopez", "Supermercado Lopez SA", "30-34567890-1", "carlos@lopez.com", "011-3333-3333", "Av. Santa Fe 3000", "CABA"},
		{"Ana", "Martinez", "Kiosco Martinez", "27-45678901-2", "ana@martinez.com", "011-4444-4444", "Calle Lavalle 800", "CABA"},
		{"Pedro", "Rodriguez", "Maxikiosco Rodriguez", "20-56789012-3", "pedro@rodriguez.com", "011-5555-5555", "Av. Cabildo 2000", "CABA"},
		{"Laura", "Fernandez", "Despensa Fernandez", "27-67890123-4", "laura@fernandez.com", "0341-666-6666", "Calle San Martin 500", "Rosario"},
		{"Diego", "Gonzalez", "Autoservicio Gonzalez", "20-78901234-5", "diego@gonzalez.com", "0351-777-7777", "Av. Colon 1200", "Cordoba"},
		{"Lucia", "Diaz", "Minimercado Diaz", "27-89012345-6", "lucia@diaz.com", "0261-888-8888", "Calle San Juan 300", "Mendoza"},
		{"Martin", "Sanchez", "Distribuidora Sanchez Hnos", "30-90123456-7", "martin@sanchez.com", "011-9999-9999", "Av. Belgrano 1500", "CABA"},
		{"Sofia", "Torres", "Torres Alimentos SA", "30-01234567-8", "sofia@torres.com", "011-1010-1010", "Av. Independencia 2500", "CABA"},
	}

	for _, c := range clients {
		cli, err := qtx.CreateCliente(ctx, repository.CreateClienteParams{
			Nombre:      c.Nombre,
			Apellido:    pgtype.Text{String: c.Apellido, Valid: true},
			RazonSocial: pgtype.Text{String: c.RazonSocial, Valid: true},
			Cuit:        pgtype.Text{String: c.Cuit, Valid: true},
			CondicionIva: repository.NullCondicionIva{
				CondicionIva: repository.CondicionIvaRESPONSABLEINSCRIPTO,
				Valid:        true,
			},
			Email:      pgtype.Text{String: c.Email, Valid: true},
			Telefono:   pgtype.Text{String: c.Telefono, Valid: true},
			Reputacion: repository.ReputacionBUENA,
			UsuarioID:  user.ID,
		})
		if err != nil {
			return nil, fmt.Errorf("create client %s: %w", c.Nombre, err)
		}

		_, err = qtx.CreateDireccion(ctx, repository.CreateDireccionParams{
			ClienteID:    cli.ID,
			Calle:        c.Calle,
			Numero:       pgtype.Text{String: "100", Valid: true},
			Piso:         pgtype.Text{},
			Departamento: pgtype.Text{},
			Ciudad:       pgtype.Text{String: c.Ciudad, Valid: true},
			Provincia:    pgtype.Text{String: "Buenos Aires", Valid: true},
			CodigoPostal: pgtype.Text{String: "1000", Valid: true},
			Latitud:      pgtype.Numeric{},
			Longitud:     pgtype.Numeric{},
		})
		if err != nil {
			return nil, fmt.Errorf("create address for client %s: %w", c.Nombre, err)
		}
	}

	// 7. Create 3 employees.
	type empDef struct {
		Nombre   string
		Apellido string
		DNI      string
		Rol      repository.Rol
	}
	employees := []empDef{
		{"Roberto", "Vendedor", "30123456", repository.RolVENDEDOR},
		{"Andrea", "Deposito", "31234567", repository.RolDEPOSITO},
		{"Marcos", "Repartidor", "32345678", repository.RolREPARTIDOR},
	}

	for _, e := range employees {
		_, err := qtx.CreateEmployee(ctx, repository.CreateEmployeeParams{
			Nombre:       e.Nombre,
			Apellido:     e.Apellido,
			Email:        pgtype.Text{},
			Cuil:         pgtype.Text{},
			AccessCode:   pgtype.Text{},
			Rol:          e.Rol,
			SucursalID:   branch.ID,
			UsuarioID:    user.ID,
			Telefono:     pgtype.Text{},
			FechaIngreso: pgtype.Date{},
			FechaEgreso:  pgtype.Date{},
			Estado:       repository.EstadoEmpleadoACTIVO,
			Dni:          pgtype.Text{String: e.DNI, Valid: true},
			Direccion:    pgtype.Text{},
			SalarioBase:  pgtype.Numeric{},
			Observaciones: pgtype.Text{},
			TipoContrato: repository.TipoContratoRELACIONDEPENDENCIA,
			ObraSocial:   pgtype.Text{},
			NumeroLegajo: pgtype.Text{},
			Banco:        pgtype.Text{},
			Cbu:          pgtype.Text{},
		})
		if err != nil {
			return nil, fmt.Errorf("create employee %s: %w", e.Nombre, err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return &DemoResult{
		Email:    demoEmail,
		Password: demoPassword,
		Message:  "Cuenta demo creada exitosamente",
	}, nil
}

