package server

import (
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/permissions"
	"github.com/pronto-erp/pronto/internal/pkg/response"
)

const version = "0.1.0"

func (s *Server) setupRouter() *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.Logger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.RateLimitByMethod(s.redis))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   strings.Split(s.cfg.CORSAllowedOrigins, ","),
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID", "X-API-Key", "X-API-Secret"},
		ExposedHeaders:   []string{"Link", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", s.handleHealth)

		// Auth routes (public, stricter rate limit)
		r.Route("/auth", func(r chi.Router) {
			r.Use(middleware.RateLimit(s.redis, 10, time.Minute))
			r.Post("/register", s.authHandler.Register)
			r.Post("/login", s.authHandler.Login)
			r.Post("/login/access-code", s.authHandler.LoginWithAccessCode)
			r.Post("/refresh", s.authHandler.Refresh)
			r.Post("/logout", s.authHandler.Logout)
			r.Post("/forgot-password", s.authHandler.ForgotPassword)
			r.Post("/reset-password", s.authHandler.ResetPassword)
			r.Post("/verify-email", s.authHandler.VerifyEmail)

			// Google OAuth
			r.Get("/google", s.oauthHandler.GoogleLogin)
			r.Get("/google/callback", s.oauthHandler.GoogleCallback)

			// Demo account
			r.Post("/demo", s.demoHandler.SeedDemo)

			// Protected
			r.Group(func(r chi.Router) {
				r.Use(middleware.Auth(s.jwt))
				r.Get("/me", s.authHandler.Me)
			})
		})

		// Products & Inventory (all authenticated)
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(s.jwt))

			// Familias
			r.Route("/productos/familias", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/", s.productHandler.ListFamilias)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ProductsManage))
					r.Post("/", s.productHandler.CreateFamilia)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/", s.productHandler.GetFamilia)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.ProductsManage))
						r.Put("/", s.productHandler.UpdateFamilia)
						r.Delete("/", s.productHandler.DeleteFamilia)
					})
				})
			})

			// Categorias
			r.Route("/productos/categorias", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/", s.productHandler.ListCategorias)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ProductsManage))
					r.Post("/", s.productHandler.CreateCategoria)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/", s.productHandler.GetCategoria)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.ProductsManage))
						r.Put("/", s.productHandler.UpdateCategoria)
						r.Delete("/", s.productHandler.DeleteCategoria)
					})
				})
			})

			// Productos
			r.Route("/productos", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/", s.productHandler.ListProductos)
				r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/importar/template", s.productHandler.DownloadTemplate)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ProductsManage))
					r.Post("/", s.productHandler.CreateProducto)
					r.Post("/importar/bulk", s.productHandler.BulkImport)
					r.Post("/importar/excel", s.productHandler.ImportExcel)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/", s.productHandler.GetProducto)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.ProductsManage))
						r.Put("/", s.productHandler.UpdateProducto)
						r.Delete("/", s.productHandler.DeleteProducto)
					})
				})
			})

			// Clientes
			r.Route("/clientes", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.ClientsView)).Get("/", s.clientHandler.ListClientes)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ClientsManage))
					r.Post("/", s.clientHandler.CreateCliente)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.ClientsView)).Get("/", s.clientHandler.GetCliente)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.ClientsManage))
						r.Put("/", s.clientHandler.UpdateCliente)
						r.Delete("/", s.clientHandler.DeleteCliente)
					})
					r.Route("/direcciones", func(r chi.Router) {
						r.With(middleware.RequirePermission(permissions.ClientsView)).Get("/", s.clientHandler.ListDirecciones)
						r.Group(func(r chi.Router) {
							r.Use(middleware.RequirePermission(permissions.ClientsManage))
							r.Post("/", s.clientHandler.CreateDireccion)
							r.Route("/{direccionId}", func(r chi.Router) {
								r.Put("/", s.clientHandler.UpdateDireccion)
								r.Delete("/", s.clientHandler.DeleteDireccion)
								r.Put("/principal", s.clientHandler.SetDireccionPrincipal)
							})
						})
					})
				})
			})

			// Catalogo
			r.Route("/catalogo", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/sucursal/{sucursalId}", s.productHandler.ListCatalogo)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ProductsManage))
					r.Post("/", s.productHandler.UpsertCatalogo)
					r.Delete("/{productoId}/sucursal/{sucursalId}", s.productHandler.DeleteCatalogo)
				})
			})

			// Pedidos
			r.Route("/pedidos", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.OrdersView)).Get("/", s.orderHandler.ListPedidos)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.OrdersCreate))
					r.Post("/", s.orderHandler.CreatePedido)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.OrdersView)).Get("/", s.orderHandler.GetPedido)
					r.With(middleware.RequirePermission(permissions.OrdersView)).Get("/historial", s.orderHandler.GetHistorial)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.OrdersEdit))
						r.Put("/", s.orderHandler.UpdatePedido)
					})
					r.Patch("/estado", s.orderHandler.TransitionEstado)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.OrdersCancel))
						r.Delete("/", s.orderHandler.DeletePedido)
					})
				})
			})

			// Facturas
			r.Route("/facturas", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.InvoicesView)).Get("/", s.invoiceHandler.List)
				r.With(middleware.RequirePermission(permissions.InvoicesView)).Get("/batch-pdf", s.invoiceHandler.GetBatchPDF)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.InvoicesCreate))
					r.Post("/", s.invoiceHandler.CreateManual)
					r.Post("/from-pedido", s.invoiceHandler.CreateFromPedido)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.InvoicesView)).Get("/", s.invoiceHandler.Get)
					r.With(middleware.RequirePermission(permissions.InvoicesView)).Get("/pdf", s.invoiceHandler.GetPDF)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.InvoicesCreate))
						r.Patch("/emitir", s.invoiceHandler.Emit)
					})
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.InvoicesCancel))
						r.Patch("/anular", s.invoiceHandler.Void)
						r.Delete("/", s.invoiceHandler.Delete)
					})
				})
			})

			// Empleados
			r.Route("/empleados", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.EmployeesView)).Get("/", s.employeeHandler.ListEmployees)
				r.With(middleware.RequirePermission(permissions.EmployeesView)).Get("/exportar", s.employeeHandler.ExportEmployees)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.EmployeesCreate))
					r.Post("/", s.employeeHandler.CreateEmployee)
				})
				r.Route("/bulk", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.EmployeesEdit)).Put("/estado", s.employeeHandler.BulkUpdateEstado)
					r.With(middleware.RequirePermission(permissions.EmployeesEdit)).Put("/rol", s.employeeHandler.BulkUpdateRol)
					r.With(middleware.RequirePermission(permissions.EmployeesAssign)).Put("/sucursales", s.employeeHandler.BulkAssignBranches)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.EmployeesView)).Get("/", s.employeeHandler.GetEmployee)
					r.With(middleware.RequirePermission(permissions.EmployeesEdit)).Post("/regenerar-codigo", s.employeeHandler.RegenerateAccessCode)
					r.Route("/sucursales", func(r chi.Router) {
						r.With(middleware.RequirePermission(permissions.EmployeesView)).Get("/", s.employeeHandler.ListEmployeeBranches)
						r.Group(func(r chi.Router) {
							r.Use(middleware.RequirePermission(permissions.EmployeesAssign))
							r.Put("/", s.employeeHandler.AssignEmployeeBranches)
						})
					})
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.EmployeesEdit))
						r.Put("/", s.employeeHandler.UpdateEmployee)
					})
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.EmployeesDelete))
						r.Delete("/", s.employeeHandler.DeleteEmployee)
					})
				})
			})

			// Finanzas
			r.Route("/finanzas", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.FinanceView))

				r.Get("/resumen", s.financeHandler.GetResumen)

				// Cajas
				r.Route("/cajas", func(r chi.Router) {
					r.Get("/", s.financeHandler.ListCajas)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceCashRegister))
						r.Post("/", s.financeHandler.CreateCaja)
					})
					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.financeHandler.GetCaja)
						r.Get("/movimientos", s.financeHandler.ListMovimientos)
						r.Get("/arqueos", s.financeHandler.ListArqueos)
						r.Group(func(r chi.Router) {
							r.Use(middleware.RequirePermission(permissions.FinanceCashRegister))
							r.Put("/", s.financeHandler.UpdateCaja)
							r.Delete("/", s.financeHandler.DeleteCaja)
							r.Route("/arqueos/{arqueoId}", func(r chi.Router) {
								r.Patch("/estado", s.financeHandler.UpdateArqueoEstado)
							})
						})
					})
				})

				// Movimientos
				r.Route("/movimientos", func(r chi.Router) {
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceCashRegister))
						r.Post("/", s.financeHandler.CreateMovimiento)
					})
				})

				// Arqueos
				r.Route("/arqueos", func(r chi.Router) {
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceCashRegister))
						r.Post("/", s.financeHandler.CreateArqueo)
					})
				})

				// Cheques
				r.Route("/cheques", func(r chi.Router) {
					r.Get("/", s.financeHandler.ListCheques)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceChecks))
						r.Post("/", s.financeHandler.CreateCheque)
					})
					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.financeHandler.GetCheque)
						r.Group(func(r chi.Router) {
							r.Use(middleware.RequirePermission(permissions.FinanceChecks))
							r.Put("/", s.financeHandler.UpdateCheque)
							r.Patch("/estado", s.financeHandler.UpdateChequeEstado)
						})
					})
				})

				// Gastos — recurrentes BEFORE {id}
				r.Route("/gastos", func(r chi.Router) {
					r.Get("/", s.financeHandler.ListGastos)
					r.Route("/recurrentes", func(r chi.Router) {
						r.Get("/", s.financeHandler.ListGastosRecurrentes)
						r.Group(func(r chi.Router) {
							r.Use(middleware.RequirePermission(permissions.FinanceExpenses))
							r.Post("/", s.financeHandler.CreateGastoRecurrente)
							r.Route("/{id}", func(r chi.Router) {
								r.Get("/", s.financeHandler.GetGastoRecurrente)
								r.Put("/", s.financeHandler.UpdateGastoRecurrente)
								r.Delete("/", s.financeHandler.DeleteGastoRecurrente)
							})
						})
					})
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceExpenses))
						r.Post("/", s.financeHandler.CreateGasto)
					})
					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.financeHandler.GetGasto)
						r.Group(func(r chi.Router) {
							r.Use(middleware.RequirePermission(permissions.FinanceExpenses))
							r.Put("/", s.financeHandler.UpdateGasto)
							r.Delete("/", s.financeHandler.DeleteGasto)
						})
					})
				})

				// Metodos de Pago
				r.Route("/metodos-pago", func(r chi.Router) {
					r.Get("/", s.financeHandler.ListMetodosPago)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceCashRegister))
						r.Post("/", s.financeHandler.CreateMetodoPago)
					})
					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.financeHandler.GetMetodoPago)
						r.Group(func(r chi.Router) {
							r.Use(middleware.RequirePermission(permissions.FinanceCashRegister))
							r.Put("/", s.financeHandler.UpdateMetodoPago)
							r.Delete("/", s.financeHandler.DeleteMetodoPago)
						})
					})
				})

				// Presupuestos
				r.Route("/presupuestos", func(r chi.Router) {
					r.Get("/", s.financeHandler.ListPresupuestos)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceBudgets))
						r.Post("/", s.financeHandler.CreatePresupuesto)
					})
					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.financeHandler.GetPresupuesto)
						r.Group(func(r chi.Router) {
							r.Use(middleware.RequirePermission(permissions.FinanceBudgets))
							r.Put("/", s.financeHandler.UpdatePresupuesto)
							r.Delete("/", s.financeHandler.DeletePresupuesto)
						})
					})
				})

				// Comisiones
				r.Route("/comisiones", func(r chi.Router) {
					r.Get("/", s.financeHandler.ListComisionesVendedor)
					r.Get("/configuracion", s.financeHandler.ListConfiguracionComisiones)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceReports))
						r.Post("/", s.financeHandler.CreateComisionVendedor)
						r.Post("/configuracion", s.financeHandler.CreateConfiguracionComision)
						r.Route("/configuracion/{id}", func(r chi.Router) {
							r.Get("/", s.financeHandler.GetConfiguracionComision)
							r.Put("/", s.financeHandler.UpdateConfiguracionComision)
							r.Delete("/", s.financeHandler.DeleteConfiguracionComision)
						})
					})
				})

				// Entidades Bancarias
				r.Route("/entidades-bancarias", func(r chi.Router) {
					r.Get("/", s.financeHandler.ListEntidadesBancarias)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceCashRegister))
						r.Post("/", s.financeHandler.CreateEntidadBancaria)
					})
					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.financeHandler.GetEntidadBancaria)
						r.Group(func(r chi.Router) {
							r.Use(middleware.RequirePermission(permissions.FinanceCashRegister))
							r.Put("/", s.financeHandler.UpdateEntidadBancaria)
							r.Delete("/", s.financeHandler.DeleteEntidadBancaria)
						})
					})
				})

				// Bank Accounts Dashboard
				r.Get("/cuentas-bancarias", s.bankAccountHandler.GetBankDashboard)

				// Financial Indices
				r.With(middleware.RequirePermission(permissions.FinanceReports)).Get("/indices", s.bankAccountHandler.GetFinancialIndices)
			})

			// Retenciones
			r.Route("/finanzas/retenciones", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/", s.retencionHandler.List)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.FinanceExpenses))
					r.Post("/", s.retencionHandler.Create)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/", s.retencionHandler.Get)
					r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/certificado", s.retencionHandler.DownloadCertificate)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.FinanceExpenses))
						r.Patch("/anular", s.retencionHandler.Anular)
						r.Delete("/", s.retencionHandler.Delete)
					})
				})
			})

			// Percepciones config
			r.Route("/configuracion/percepciones", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.SettingsManage))
				r.Get("/", s.percepcionHandler.ListConfigs)
				r.Post("/", s.percepcionHandler.CreateConfig)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", s.percepcionHandler.GetConfig)
					r.Put("/", s.percepcionHandler.UpdateConfig)
					r.Delete("/", s.percepcionHandler.DeleteConfig)
				})
			})

			// Percepciones records
			r.Route("/finanzas/percepciones", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/", s.percepcionHandler.List)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.FinanceExpenses))
					r.Post("/", s.percepcionHandler.Create)
					r.Post("/calcular", s.percepcionHandler.Calculate)
				})
			})

			// Proveedores
			r.Route("/proveedores", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.SuppliersView)).Get("/", s.supplierHandler.ListProveedores)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.SuppliersManage))
					r.Post("/", s.supplierHandler.CreateProveedor)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.SuppliersView)).Get("/", s.supplierHandler.GetProveedor)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.SuppliersManage))
						r.Put("/", s.supplierHandler.UpdateProveedor)
						r.Delete("/", s.supplierHandler.DeleteProveedor)
					})
				})
			})

			// Compras (Purchase Orders)
			r.Route("/compras", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.PurchasesView)).Get("/", s.purchaseHandler.List)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.PurchasesCreate))
					r.Post("/", s.purchaseHandler.Create)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.PurchasesView)).Get("/", s.purchaseHandler.Get)
					r.With(middleware.RequirePermission(permissions.PurchasesView)).Get("/historial", s.purchaseHandler.GetHistorial)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.PurchasesCreate))
						r.Put("/", s.purchaseHandler.Update)
					})
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.PurchasesApprove))
						r.Patch("/aprobar", s.purchaseHandler.Approve)
						r.Patch("/recibir", s.purchaseHandler.Receive)
					})
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.PurchasesCancel))
						r.Patch("/cancelar", s.purchaseHandler.Cancel)
						r.Delete("/", s.purchaseHandler.Delete)
					})
				})
			})

			// Facturas Proveedor (Supplier Invoices)
			r.Route("/compras/facturas", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.PurchasesView)).Get("/", s.supplierInvoiceHandler.List)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.PurchasesCreate))
					r.Post("/", s.supplierInvoiceHandler.Create)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.PurchasesView)).Get("/", s.supplierInvoiceHandler.Get)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.PurchasesCreate))
						r.Patch("/anular", s.supplierInvoiceHandler.Anular)
						r.Delete("/", s.supplierInvoiceHandler.Delete)
					})
				})
			})

			// Devoluciones Proveedor (Supplier Returns)
			r.Route("/compras/devoluciones", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.PurchasesView)).Get("/", s.supplierReturnHandler.List)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.PurchasesCreate))
					r.Post("/", s.supplierReturnHandler.Create)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.PurchasesView)).Get("/", s.supplierReturnHandler.Get)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.PurchasesCreate))
						r.Patch("/estado", s.supplierReturnHandler.Transition)
						r.Delete("/", s.supplierReturnHandler.Delete)
					})
				})
			})

			// Configuracion impuestos
			r.Route("/configuracion/impuestos", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.SettingsView))
				r.Get("/", s.orderHandler.ListConfigImpuestos)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.SettingsManage))
					r.Post("/", s.orderHandler.CreateConfigImpuesto)
					r.Route("/{id}", func(r chi.Router) {
						r.Put("/", s.orderHandler.UpdateConfigImpuesto)
						r.Delete("/", s.orderHandler.DeleteConfigImpuesto)
					})
				})
			})

			// Configuracion sucursales
			r.Route("/configuracion/sucursales", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.SettingsView))
				r.Get("/", s.branchHandler.List)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.SettingsManage))
					r.Post("/", s.branchHandler.Create)
					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.branchHandler.Get)
						r.Put("/", s.branchHandler.Update)
						r.Delete("/", s.branchHandler.Delete)
					})
				})
			})

			// Conversiones de Unidad
			r.Route("/configuracion/conversiones", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.SettingsView))
				r.Get("/", s.conversionHandler.List)
				r.Get("/convert", s.conversionHandler.Convert)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.SettingsManage))
					r.Post("/", s.conversionHandler.Create)
					r.Route("/{id}", func(r chi.Router) {
						r.Put("/", s.conversionHandler.Update)
						r.Delete("/", s.conversionHandler.Delete)
					})
				})
			})

			// Configuracion Retenciones
			r.Route("/configuracion/retenciones", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.SettingsView))
				r.Get("/", s.retencionConfigHandler.List)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.SettingsManage))
					r.Post("/", s.retencionConfigHandler.Create)
					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.retencionConfigHandler.Get)
						r.Put("/", s.retencionConfigHandler.Update)
						r.Delete("/", s.retencionConfigHandler.Delete)
					})
				})
			})

			// Dashboard
			r.Route("/dashboard", func(r chi.Router) {
				r.Get("/stats", s.dashboardHandler.GetStats)
			})

			// Inventario - Stock movements
			r.Route("/inventario/movimientos", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.StockView)).Get("/", s.stockHandler.ListMovimientos)
				r.With(middleware.RequirePermission(permissions.StockAdjust)).Post("/ajuste", s.stockHandler.AdjustStock)
			})

			// Inventario - Transfers
			r.Route("/inventario/transferencias", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.StockView)).Get("/", s.transferHandler.List)
				r.With(middleware.RequirePermission(permissions.StockTransfer)).Post("/", s.transferHandler.Create)
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.StockView)).Get("/", s.transferHandler.Get)
					r.With(middleware.RequirePermission(permissions.StockTransfer)).Patch("/estado", s.transferHandler.Transition)
					r.With(middleware.RequirePermission(permissions.StockTransfer)).Delete("/", s.transferHandler.Delete)
				})
			})

			// Inventario - Devoluciones
			r.Route("/inventario/devoluciones", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.StockView)).Get("/", s.devolucionHandler.List)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.StockAdjust))
					r.Post("/", s.devolucionHandler.Create)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.StockView)).Get("/", s.devolucionHandler.Get)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.StockAdjust))
						r.Patch("/aprobar", s.devolucionHandler.Approve)
						r.Patch("/rechazar", s.devolucionHandler.Reject)
						r.Delete("/", s.devolucionHandler.Delete)
					})
				})
			})

			// Listas de Precios
			r.Route("/inventario/listas-precios", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/", s.priceListHandler.List)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ProductsManage))
					r.Post("/", s.priceListHandler.Create)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/", s.priceListHandler.Get)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.ProductsManage))
						r.Put("/", s.priceListHandler.Update)
						r.Delete("/", s.priceListHandler.Delete)
					})
					r.With(middleware.RequirePermission(permissions.ProductsView)).Get("/precios", s.priceListHandler.ListPrecios)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.ProductsManage))
						r.Post("/precios", s.priceListHandler.UpsertPrecio)
						r.Delete("/precios/{productoId}", s.priceListHandler.DeletePrecio)
					})
				})
			})

			// Client price list lookup
			r.With(middleware.RequirePermission(permissions.OrdersView)).Get("/clientes/{clienteId}/precios", s.priceListHandler.GetPreciosForCliente)

			// Inventario - Lotes (stock lot tracking with expiry)
			r.Route("/inventario/lotes", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.StockView)).Get("/", s.loteHandler.List)
				r.With(middleware.RequirePermission(permissions.StockView)).Get("/alertas", s.loteHandler.Alertas)
				r.With(middleware.RequirePermission(permissions.StockView)).Get("/fifo", s.loteHandler.FIFO)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.StockAdjust))
					r.Post("/", s.loteHandler.Create)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.StockView)).Get("/", s.loteHandler.Get)
					r.With(middleware.RequirePermission(permissions.StockAdjust)).Post("/ajuste", s.loteHandler.AjustarStock)
				})
			})

			// Logistica - Vehiculos
			r.Route("/logistica/vehiculos", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.DeliveryView)).Get("/", s.logisticsHandler.ListVehiculos)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.DeliveryManage))
					r.Post("/", s.logisticsHandler.CreateVehiculo)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.DeliveryView)).Get("/", s.logisticsHandler.GetVehiculo)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.DeliveryManage))
						r.Put("/", s.logisticsHandler.UpdateVehiculo)
						r.Delete("/", s.logisticsHandler.DeleteVehiculo)
					})
				})
			})

			// Logistica - Zonas
			r.Route("/logistica/zonas", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.DeliveryView)).Get("/", s.logisticsHandler.ListZonas)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.DeliveryManage))
					r.Post("/", s.logisticsHandler.CreateZona)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.DeliveryView)).Get("/", s.logisticsHandler.GetZona)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.DeliveryManage))
						r.Put("/", s.logisticsHandler.UpdateZona)
						r.Delete("/", s.logisticsHandler.DeleteZona)
					})
				})
			})

			// Logistica - Repartos
			r.Route("/logistica/repartos", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.DeliveryView)).Get("/", s.logisticsHandler.ListRepartos)
				r.With(middleware.RequirePermission(permissions.DeliveryManage)).Post("/", s.logisticsHandler.CreateReparto)
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.DeliveryView)).Get("/", s.logisticsHandler.GetReparto)
					r.Patch("/estado", s.logisticsHandler.TransitionReparto)
					r.With(middleware.RequirePermission(permissions.DeliveryManage)).Delete("/", s.logisticsHandler.DeleteReparto)
					r.Route("/eventos", func(r chi.Router) {
						r.With(middleware.RequirePermission(permissions.DeliveryView)).Get("/", s.logisticsHandler.ListEventos)
						r.With(middleware.RequirePermission(permissions.DeliveryUpdate)).Post("/", s.logisticsHandler.CreateEvento)
					})
				})
			})

			// Permisos (permission management - admin only)
			r.Route("/permisos", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.SettingsManage))
				r.Get("/", s.permissionHandler.ListAll)
				r.Route("/{rol}", func(r chi.Router) {
					r.Get("/", s.permissionHandler.GetForRole)
					r.Put("/", s.permissionHandler.UpdateForRole)
					r.Delete("/", s.permissionHandler.ResetForRole)
				})
			})

			// Reportes
			r.Route("/reportes", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.ReportsView))
				r.Get("/ventas", s.reportHandler.GetSalesReport)
				r.Get("/compras", s.reportHandler.GetPurchasesReport)
				r.Get("/inventario", s.reportHandler.GetInventoryReport)
				r.Get("/finanzas", s.reportHandler.GetFinanceReport)
				r.Get("/productos", s.reportHandler.GetProductReport)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ReportsExport))
					r.Use(middleware.RateLimitExport(s.redis))
					r.Get("/ventas/exportar", s.reportHandler.ExportSalesCSV)
					r.Get("/compras/exportar", s.reportHandler.ExportPurchasesCSV)
					r.Get("/inventario/exportar", s.reportHandler.ExportInventoryCSV)
					r.Get("/finanzas/exportar", s.reportHandler.ExportFinanceCSV)
					r.Get("/ventas/excel", s.reportHandler.ExportSalesExcel)
					r.Get("/compras/excel", s.reportHandler.ExportPurchasesExcel)
					r.Get("/inventario/excel", s.reportHandler.ExportInventoryExcel)
					r.Get("/finanzas/excel", s.reportHandler.ExportFinanceExcel)
				})

				// Tax reports
				r.Get("/libro-iva-ventas", s.taxReportHandler.LibroIVAVentas)
				r.Get("/libro-iva-compras", s.taxReportHandler.LibroIVACompras)
				r.Get("/iibb", s.taxReportHandler.ResumenIIBB)
				r.Get("/retenciones-resumen", s.taxReportHandler.ResumenRetenciones)

				// CITI exports (require ReportsExport permission)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ReportsExport))
					r.Use(middleware.RateLimitExport(s.redis))
					r.Get("/citi-ventas/exportar", s.taxReportHandler.ExportCITIVentas)
					r.Get("/citi-compras/exportar", s.taxReportHandler.ExportCITICompras)
				})
			})

			// AFIP Configuration
			r.Route("/configuracion/afip", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.SettingsManage))
				r.Route("/{sucursalId}", func(r chi.Router) {
					r.Get("/", s.afipHandler.GetConfig)
					r.Put("/", s.afipHandler.SaveConfig)
					r.Post("/test", s.afipHandler.TestConnection)
				})
			})

			// AFIP Invoice Authorization (under facturas)
			r.Route("/facturas/{id}/afip", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.InvoicesCreate))
				r.Post("/", s.afipHandler.AuthorizeInvoice)
			})

			// Sales KPIs
			r.With(middleware.RequirePermission(permissions.ReportsView)).Get("/ventas/kpis", s.salesKPIHandler.GetKPIs)

			// Fidelidad (Customer Loyalty)
			r.Route("/fidelidad", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.ClientsView))
				r.Get("/programa", s.loyaltyHandler.GetPrograma)
				r.Get("/clientes/{clienteId}/puntos", s.loyaltyHandler.GetClientePuntos)
				r.Get("/clientes/{clienteId}/movimientos", s.loyaltyHandler.ListMovimientos)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ClientsManage))
					r.Put("/programa", s.loyaltyHandler.UpsertPrograma)
					r.Post("/clientes/{clienteId}/acumular", s.loyaltyHandler.Acumular)
					r.Post("/clientes/{clienteId}/canjear", s.loyaltyHandler.Canjear)
				})
			})

			// User Settings (dashboard layout)
			r.Route("/configuracion/usuario", func(r chi.Router) {
				r.Get("/dashboard-layout", s.userSettingsHandler.GetDashboardLayout)
				r.Put("/dashboard-layout", s.userSettingsHandler.SaveDashboardLayout)
			})

			// Salidas Vendedor
			r.Route("/salidas-vendedor", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.EmployeesView)).Get("/", s.salidaVendedorHandler.ListByFecha)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.EmployeesEdit))
					r.Post("/", s.salidaVendedorHandler.RegistrarSalida)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.EmployeesView)).Get("/", s.salidaVendedorHandler.Get)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.EmployeesEdit))
						r.Patch("/regreso", s.salidaVendedorHandler.RegistrarRegreso)
						r.Delete("/", s.salidaVendedorHandler.Delete)
					})
				})
			})

			// Cobros (Accounts Receivable - Payments)
			r.Route("/finanzas/cobros", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/", s.paymentHandler.ListPagos)
				r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/aging", s.paymentHandler.GetAgingReport)
				r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/comprobantes-con-deuda", s.paymentHandler.ListComprobantesConDeuda)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.FinanceCashRegister))
					r.Post("/", s.paymentHandler.CreatePago)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/", s.paymentHandler.GetPago)
					r.With(middleware.RequirePermission(permissions.FinanceCashRegister)).Patch("/anular", s.paymentHandler.AnularPago)
				})
			})

			// Cliente Balance & Credit
			r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/clientes/{id}/saldo", s.paymentHandler.GetClienteBalance)
			r.With(middleware.RequirePermission(permissions.FinanceCashRegister)).Put("/clientes/{id}/limite-credito", s.paymentHandler.UpdateClienteLimiteCredito)

			// Pagos a Proveedor (Accounts Payable)
			r.Route("/finanzas/pagos-proveedor", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/", s.paymentHandler.ListPagosProveedor)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.FinanceExpenses))
					r.Post("/", s.paymentHandler.CreatePagoProveedor)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.FinanceView)).Get("/", s.paymentHandler.GetPagoProveedor)
					r.With(middleware.RequirePermission(permissions.FinanceExpenses)).Patch("/anular", s.paymentHandler.AnularPagoProveedor)
				})
			})

			// Cotizaciones (exchange rates)
			r.Route("/finanzas/cotizaciones", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.FinanceView))
				r.Get("/", s.cotizacionHandler.List)
				r.Get("/tasa", s.cotizacionHandler.GetRate)
				r.Post("/", s.cotizacionHandler.Create)
				r.Delete("/{id}", s.cotizacionHandler.Delete)
			})

			// Intereses por Mora
			r.Route("/finanzas/intereses", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.FinanceView))
				r.Get("/", s.interesMoraHandler.List)
				r.Get("/config", s.interesMoraHandler.GetConfig)
				r.Post("/config", s.interesMoraHandler.UpsertConfig)
				r.Post("/calcular", s.interesMoraHandler.CalculateOverdue)
				r.Patch("/{id}/condonar", s.interesMoraHandler.Waive)
			})

			// Periodos Fiscales
			r.Route("/configuracion/periodos", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.SettingsManage))
				r.Get("/", s.periodoFiscalHandler.List)
				r.Post("/cerrar", s.periodoFiscalHandler.Close)
				r.Post("/reabrir", s.periodoFiscalHandler.Reopen)
			})

			// E-commerce Admin (API Client management)
			r.Route("/ecommerce/clients", func(r chi.Router) {
				r.Use(middleware.RequirePermission(permissions.SettingsManage))
				r.Get("/", s.ecommerceHandler.ListClients)
				r.Post("/", s.ecommerceHandler.CreateClient)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", s.ecommerceHandler.GetClient)
					r.Put("/", s.ecommerceHandler.UpdateClient)
					r.Delete("/", s.ecommerceHandler.DeleteClient)
					r.Post("/rotate-secret", s.ecommerceHandler.RotateSecret)
				})
			})

			// Visitas Cliente
			r.Route("/visitas", func(r chi.Router) {
				r.With(middleware.RequirePermission(permissions.ClientsView)).Get("/", s.visitaHandler.List)
				r.With(middleware.RequirePermission(permissions.ClientsView)).Get("/hoy", s.visitaHandler.ListToday)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ClientsManage))
					r.Post("/", s.visitaHandler.Create)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.ClientsView)).Get("/", s.visitaHandler.Get)
					r.Group(func(r chi.Router) {
						r.Use(middleware.RequirePermission(permissions.ClientsManage))
						r.Put("/", s.visitaHandler.Update)
						r.Delete("/", s.visitaHandler.Delete)
					})
				})
			})
		})
	})

	// E-commerce Public API (API Key auth)
	r.Route("/api/v1/ecommerce", func(r chi.Router) {
		r.Use(middleware.ApiKeyAuth(s.ecommerceSvc))
		r.Get("/products", s.ecommerceHandler.PublicListProducts)
		r.Get("/products/{id}", s.ecommerceHandler.PublicGetProduct)
		r.Get("/inventory/metrics", s.ecommerceHandler.PublicGetInventoryMetrics)
	})

	// WebSocket
	r.Get("/ws", s.hub.HandleWebSocket)

	return r
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	dbStatus := "ok"
	if err := s.db.Ping(ctx); err != nil {
		dbStatus = "error"
	}

	redisStatus := "ok"
	if err := s.redis.Ping(ctx).Err(); err != nil {
		redisStatus = "error"
	}

	status := "ok"
	if dbStatus != "ok" || redisStatus != "ok" {
		status = "degraded"
	}

	response.JSON(w, http.StatusOK, response.Map{
		"status":    status,
		"version":   version,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"database":  dbStatus,
		"redis":     redisStatus,
	})
}
