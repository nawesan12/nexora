package server

import (
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/permissions"
	"github.com/nexora-erp/nexora/internal/pkg/response"
)

const version = "0.1.0"

func (s *Server) setupRouter() *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.Logger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.RateLimit(s.redis, 100, time.Minute))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   strings.Split(s.cfg.CORSAllowedOrigins, ","),
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
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
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.ProductsManage))
					r.Post("/", s.productHandler.CreateProducto)
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
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequirePermission(permissions.InvoicesCreate))
					r.Post("/", s.invoiceHandler.CreateManual)
					r.Post("/from-pedido", s.invoiceHandler.CreateFromPedido)
				})
				r.Route("/{id}", func(r chi.Router) {
					r.With(middleware.RequirePermission(permissions.InvoicesView)).Get("/", s.invoiceHandler.Get)
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
					r.Get("/ventas/exportar", s.reportHandler.ExportSalesCSV)
					r.Get("/compras/exportar", s.reportHandler.ExportPurchasesCSV)
					r.Get("/inventario/exportar", s.reportHandler.ExportInventoryCSV)
					r.Get("/finanzas/exportar", s.reportHandler.ExportFinanceCSV)
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
		})
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
