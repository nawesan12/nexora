package server

import (
	"github.com/go-chi/chi/v5"
	"github.com/hibiken/asynq"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pronto-erp/pronto/internal/config"
	"github.com/pronto-erp/pronto/internal/handler"
	jwtpkg "github.com/pronto-erp/pronto/internal/pkg/jwt"
	"github.com/pronto-erp/pronto/internal/service"
	"github.com/pronto-erp/pronto/internal/ws"
	"github.com/redis/go-redis/v9"
)

type Server struct {
	cfg            *config.Config
	db             *pgxpool.Pool
	redis          *redis.Client
	jwt            *jwtpkg.Manager
	hub            *ws.Hub
	authHandler         *handler.AuthHandler
	productHandler      *handler.ProductHandler
	clientHandler       *handler.ClientHandler
	orderHandler        *handler.OrderHandler
	employeeHandler     *handler.EmployeeHandler
	financeHandler      *handler.FinanceHandler
	permissionHandler   *handler.PermissionHandler
	dashboardHandler    *handler.DashboardHandler
	stockHandler        *handler.StockHandler
	transferHandler     *handler.TransferHandler
	logisticsHandler    *handler.LogisticsHandler
	invoiceHandler      *handler.InvoiceHandler
	supplierHandler     *handler.SupplierHandler
	purchaseHandler     *handler.PurchaseHandler
	branchHandler       *handler.BranchHandler
	reportHandler       *handler.ReportHandler
	afipHandler         *handler.AfipHandler
	retencionHandler    *handler.RetencionHandler
	salesKPIHandler     *handler.SalesKPIHandler
	loyaltyHandler      *handler.LoyaltyHandler
	conversionHandler   *handler.ConversionHandler
	userSettingsHandler *handler.UserSettingsHandler
	bankAccountHandler     *handler.BankAccountHandler
	supplierInvoiceHandler *handler.SupplierInvoiceHandler
	supplierReturnHandler  *handler.SupplierReturnHandler
	visitaHandler          *handler.VisitaHandler
	salidaVendedorHandler  *handler.SalidaVendedorHandler
	devolucionHandler      *handler.DevolucionHandler
	oauthHandler           *handler.OAuthHandler
	demoHandler            *handler.DemoHandler
	ecommerceHandler        *handler.EcommerceHandler
	percepcionHandler       *handler.PercepcionHandler
	ecommerceSvc            *service.EcommerceService
	interesMoraHandler      *handler.InteresMoraHandler
	periodoFiscalHandler    *handler.PeriodoFiscalHandler
	paymentHandler          *handler.PaymentHandler
	retencionConfigHandler  *handler.RetencionConfigHandler
	cotizacionHandler       *handler.CotizacionHandler
	taxReportHandler        *handler.TaxReportHandler
	loteHandler             *handler.LoteHandler
	priceListHandler        *handler.PriceListHandler
	router                  *chi.Mux
}

func New(cfg *config.Config, db *pgxpool.Pool, rdb *redis.Client, jwtMgr *jwtpkg.Manager, asynqClient *asynq.Client) *Server {
	authSvc := service.NewAuthService(db, jwtMgr, asynqClient, cfg.AppURL)
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
	hub := ws.NewHub()
	notificationSvc := service.NewNotificationService(db, hub)
	orderSvc := service.NewOrderService(db, stockSvc, notificationSvc, asynqClient, cfg.AppURL)
	transferSvc := service.NewTransferService(db, stockSvc)
	logisticsSvc := service.NewLogisticsService(db)
	invoiceSvc := service.NewInvoiceService(db, notificationSvc)
	supplierSvc := service.NewProveedorService(db)
	purchaseSvc := service.NewPurchaseService(db, stockSvc)
	branchSvc := service.NewBranchService(db)
	reportSvc := service.NewReportService(db)
	afipSvc := service.NewAfipService(db)
	retencionSvc := service.NewRetencionService(db)
	salesKPISvc := service.NewSalesKPIService(db)
	loyaltySvc := service.NewLoyaltyService(db)
	conversionSvc := service.NewConversionService(db)
	userSettingsSvc := service.NewUserSettingsService(db)
	bankAccountSvc := service.NewBankAccountService(db)
	financialIndicesSvc := service.NewFinancialIndicesService(db)
	supplierInvoiceSvc := service.NewSupplierInvoiceService(db)
	supplierReturnSvc := service.NewSupplierReturnService(db)
	visitaSvc := service.NewVisitaService(db)
	salidaVendedorSvc := service.NewSalidaVendedorService(db)
	devolucionSvc := service.NewDevolucionService(db, stockSvc)
	demoSvc := service.NewDemoService(db)
	ecommerceSvc := service.NewEcommerceService(db)
	percepcionSvc := service.NewPercepcionService(db)
	interesMoraSvc := service.NewInteresMoraService(db)
	periodoFiscalSvc := service.NewPeriodoFiscalService(db)
	retencionConfigSvc := service.NewRetencionConfigService(db)
	cotizacionSvc := service.NewCotizacionService(db)
	priceListSvc := service.NewPriceListService(db)
	taxReportSvc := service.NewTaxReportService(db)
	loteSvc := service.NewLoteService(db)
	paymentSvc := service.NewPaymentService(db, notificationSvc)
	supplierPaymentSvc := service.NewSupplierPaymentService(db, retencionConfigSvc)
	secure := cfg.Env != "development"

	s := &Server{
		cfg:            cfg,
		db:             db,
		redis:          rdb,
		jwt:            jwtMgr,
		hub:            hub,
		authHandler:         handler.NewAuthHandler(authSvc, secure),
		productHandler:      handler.NewProductHandler(productSvc),
		clientHandler:       handler.NewClientHandler(clientSvc),
		orderHandler:        handler.NewOrderHandler(orderSvc, taxSvc),
		employeeHandler:     handler.NewEmployeeHandler(employeeSvc),
		financeHandler:      handler.NewFinanceHandler(cajaSvc, chequeSvc, gastoSvc, presupuestoSvc, comisionSvc, financeResumenSvc),
		permissionHandler:   handler.NewPermissionHandler(permissionSvc),
		dashboardHandler:    handler.NewDashboardHandler(dashboardSvc),
		stockHandler:        handler.NewStockHandler(stockSvc),
		transferHandler:     handler.NewTransferHandler(transferSvc),
		logisticsHandler:    handler.NewLogisticsHandler(logisticsSvc),
		invoiceHandler:      handler.NewInvoiceHandler(invoiceSvc),
		supplierHandler:     handler.NewSupplierHandler(supplierSvc),
		purchaseHandler:     handler.NewPurchaseHandler(purchaseSvc),
		branchHandler:       handler.NewBranchHandler(branchSvc),
		reportHandler:       handler.NewReportHandler(reportSvc),
		afipHandler:         handler.NewAfipHandler(afipSvc, invoiceSvc),
		retencionHandler:    handler.NewRetencionHandler(retencionSvc),
		salesKPIHandler:     handler.NewSalesKPIHandler(salesKPISvc),
		loyaltyHandler:      handler.NewLoyaltyHandler(loyaltySvc),
		conversionHandler:   handler.NewConversionHandler(conversionSvc),
		userSettingsHandler: handler.NewUserSettingsHandler(userSettingsSvc),
		bankAccountHandler:     handler.NewBankAccountHandler(bankAccountSvc, financialIndicesSvc),
		supplierInvoiceHandler: handler.NewSupplierInvoiceHandler(supplierInvoiceSvc),
		supplierReturnHandler:  handler.NewSupplierReturnHandler(supplierReturnSvc),
		visitaHandler:          handler.NewVisitaHandler(visitaSvc),
		salidaVendedorHandler:  handler.NewSalidaVendedorHandler(salidaVendedorSvc),
		devolucionHandler:      handler.NewDevolucionHandler(devolucionSvc),
		oauthHandler:           handler.NewOAuthHandler(authSvc, cfg),
		demoHandler:            handler.NewDemoHandler(demoSvc),
		ecommerceHandler:        handler.NewEcommerceHandler(ecommerceSvc),
		percepcionHandler:       handler.NewPercepcionHandler(percepcionSvc),
		ecommerceSvc:            ecommerceSvc,
		interesMoraHandler:      handler.NewInteresMoraHandler(interesMoraSvc),
		periodoFiscalHandler:    handler.NewPeriodoFiscalHandler(periodoFiscalSvc),
		paymentHandler:          handler.NewPaymentHandler(paymentSvc, supplierPaymentSvc),
		retencionConfigHandler:  handler.NewRetencionConfigHandler(retencionConfigSvc),
		cotizacionHandler:       handler.NewCotizacionHandler(cotizacionSvc),
		taxReportHandler:        handler.NewTaxReportHandler(taxReportSvc),
		loteHandler:             handler.NewLoteHandler(loteSvc),
		priceListHandler:        handler.NewPriceListHandler(priceListSvc),
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
