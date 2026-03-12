package server

import (
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nexora-erp/nexora/internal/config"
	"github.com/nexora-erp/nexora/internal/handler"
	jwtpkg "github.com/nexora-erp/nexora/internal/pkg/jwt"
	"github.com/nexora-erp/nexora/internal/service"
	"github.com/nexora-erp/nexora/internal/ws"
	"github.com/redis/go-redis/v9"
)

type Server struct {
	cfg            *config.Config
	db             *pgxpool.Pool
	redis          *redis.Client
	jwt            *jwtpkg.Manager
	hub            *ws.Hub
	authHandler       *handler.AuthHandler
	productHandler    *handler.ProductHandler
	clientHandler     *handler.ClientHandler
	orderHandler      *handler.OrderHandler
	employeeHandler   *handler.EmployeeHandler
	financeHandler    *handler.FinanceHandler
	permissionHandler *handler.PermissionHandler
	dashboardHandler  *handler.DashboardHandler
	stockHandler      *handler.StockHandler
	transferHandler   *handler.TransferHandler
	logisticsHandler  *handler.LogisticsHandler
	invoiceHandler    *handler.InvoiceHandler
	supplierHandler   *handler.SupplierHandler
	purchaseHandler   *handler.PurchaseHandler
	branchHandler     *handler.BranchHandler
	reportHandler     *handler.ReportHandler
	afipHandler       *handler.AfipHandler
	router         *chi.Mux
}

func New(cfg *config.Config, db *pgxpool.Pool, rdb *redis.Client, jwtMgr *jwtpkg.Manager) *Server {
	authSvc := service.NewAuthService(db, jwtMgr)
	productSvc := service.NewProductService(db)
	clientSvc := service.NewClientService(db)
	taxSvc := service.NewTaxService(db)
	employeeSvc := service.NewEmployeeService(db)
	cajaSvc := service.NewCajaService(db)
	chequeSvc := service.NewChequeService(db)
	gastoSvc := service.NewGastoService(db)
	presupuestoSvc := service.NewPresupuestoService(db)
	comisionSvc := service.NewComisionService(db)
	permissionSvc := service.NewPermissionService(db)
	financeResumenSvc := service.NewFinanceResumenService(db)
	dashboardSvc := service.NewDashboardService(db)
	stockSvc := service.NewStockService(db)
	orderSvc := service.NewOrderService(db, stockSvc)
	transferSvc := service.NewTransferService(db, stockSvc)
	logisticsSvc := service.NewLogisticsService(db)
	invoiceSvc := service.NewInvoiceService(db)
	supplierSvc := service.NewProveedorService(db)
	purchaseSvc := service.NewPurchaseService(db, stockSvc)
	branchSvc := service.NewBranchService(db)
	reportSvc := service.NewReportService(db)
	afipSvc := service.NewAfipService(db)
	secure := cfg.Env != "development"

	hub := ws.NewHub()

	s := &Server{
		cfg:            cfg,
		db:             db,
		redis:          rdb,
		jwt:            jwtMgr,
		hub:            hub,
		authHandler:     handler.NewAuthHandler(authSvc, secure),
		productHandler:  handler.NewProductHandler(productSvc),
		clientHandler:   handler.NewClientHandler(clientSvc),
		orderHandler:    handler.NewOrderHandler(orderSvc, taxSvc),
		employeeHandler: handler.NewEmployeeHandler(employeeSvc),
		financeHandler:    handler.NewFinanceHandler(cajaSvc, chequeSvc, gastoSvc, presupuestoSvc, comisionSvc, financeResumenSvc),
		permissionHandler: handler.NewPermissionHandler(permissionSvc),
		dashboardHandler:  handler.NewDashboardHandler(dashboardSvc),
		stockHandler:      handler.NewStockHandler(stockSvc),
		transferHandler:   handler.NewTransferHandler(transferSvc),
		logisticsHandler:  handler.NewLogisticsHandler(logisticsSvc),
		invoiceHandler:    handler.NewInvoiceHandler(invoiceSvc),
		supplierHandler:   handler.NewSupplierHandler(supplierSvc),
		purchaseHandler:   handler.NewPurchaseHandler(purchaseSvc),
		branchHandler:     handler.NewBranchHandler(branchSvc),
		reportHandler:     handler.NewReportHandler(reportSvc),
		afipHandler:       handler.NewAfipHandler(afipSvc, invoiceSvc),
	}
	s.router = s.setupRouter()
	return s
}

func (s *Server) Router() *chi.Mux {
	return s.router
}

func (s *Server) Hub() *ws.Hub {
	return s.hub
}
