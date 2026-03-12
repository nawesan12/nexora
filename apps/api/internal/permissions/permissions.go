package permissions

// Permission constants
const (
	EmployeesView   = "employees:view"
	EmployeesCreate = "employees:create"
	EmployeesEdit   = "employees:edit"
	EmployeesDelete = "employees:delete"
	EmployeesAssign = "employees:assign"

	ClientsView   = "clients:view"
	ClientsManage = "clients:manage"

	OrdersView        = "orders:view"
	OrdersCreate      = "orders:create"
	OrdersEdit        = "orders:edit"
	OrdersApprove     = "orders:approve"
	OrdersCancel      = "orders:cancel"
	OrdersAssignRoute = "orders:assign_route"

	ProductsView   = "products:view"
	ProductsManage = "products:manage"
	StockView     = "stock:view"
	StockAdjust   = "stock:adjust"
	StockTransfer = "stock:transfer"

	FinanceView         = "finance:view"
	FinanceCashRegister = "finance:cash_register"
	FinanceExpenses     = "finance:expenses"
	FinanceChecks       = "finance:checks"
	FinanceBudgets      = "finance:budgets"
	FinanceReports      = "finance:reports"

	DeliveryView    = "delivery:view"
	DeliveryManage  = "delivery:manage"
	DeliveryUpdate  = "delivery:update"
	DeliveryCollect = "delivery:collect"

	InvoicesView   = "invoices:view"
	InvoicesCreate = "invoices:create"
	InvoicesCancel = "invoices:cancel"

	SuppliersView    = "suppliers:view"
	SuppliersManage  = "suppliers:manage"
	PurchasesView    = "purchases:view"
	PurchasesCreate  = "purchases:create"
	PurchasesApprove = "purchases:approve"
	PurchasesCancel  = "purchases:cancel"

	SettingsView   = "settings:view"
	SettingsManage = "settings:manage"
	ReportsView    = "reports:view"
	ReportsExport  = "reports:export"
)

// AllPermissions is the complete list of permissions.
var AllPermissions = []string{
	EmployeesView, EmployeesCreate, EmployeesEdit, EmployeesDelete, EmployeesAssign,
	ClientsView, ClientsManage,
	OrdersView, OrdersCreate, OrdersEdit, OrdersApprove, OrdersCancel, OrdersAssignRoute,
	ProductsView, ProductsManage, StockView, StockAdjust, StockTransfer,
	FinanceView, FinanceCashRegister, FinanceExpenses, FinanceChecks, FinanceBudgets, FinanceReports,
	InvoicesView, InvoicesCreate, InvoicesCancel,
	SuppliersView, SuppliersManage, PurchasesView, PurchasesCreate, PurchasesApprove, PurchasesCancel,
	DeliveryView, DeliveryManage, DeliveryUpdate, DeliveryCollect,
	SettingsView, SettingsManage, ReportsView, ReportsExport,
}

// DefaultPermissions maps each role to its default permission set.
var DefaultPermissions = map[string][]string{
	"ADMIN": AllPermissions,
	"SUPERVISOR": {
		EmployeesView, EmployeesCreate, EmployeesEdit, EmployeesDelete, EmployeesAssign,
		ClientsView, ClientsManage,
		OrdersView, OrdersCreate, OrdersEdit, OrdersApprove, OrdersCancel, OrdersAssignRoute,
		ProductsView, ProductsManage, StockView, StockAdjust, StockTransfer,
		FinanceView, FinanceCashRegister, FinanceExpenses, FinanceChecks, FinanceBudgets, FinanceReports,
		InvoicesView, InvoicesCreate, InvoicesCancel,
		SuppliersView, SuppliersManage, PurchasesView, PurchasesCreate, PurchasesApprove, PurchasesCancel,
		DeliveryView, DeliveryManage,
		SettingsView,
		ReportsView, ReportsExport,
	},
	"JEFE_VENTAS": {
		EmployeesView,
		ClientsView, ClientsManage,
		OrdersView, OrdersCreate, OrdersEdit, OrdersApprove, OrdersCancel,
		InvoicesView, InvoicesCreate,
		ProductsView,
		DeliveryView,
		ReportsView,
	},
	"VENDEDOR": {
		ClientsView, ClientsManage,
		OrdersView, OrdersCreate, OrdersEdit,
		InvoicesView,
		ProductsView,
	},
	"VENDEDOR_CALLE": {
		ClientsView, ClientsManage,
		OrdersView, OrdersCreate,
		ProductsView,
	},
	"DEPOSITO": {
		OrdersView,
		ProductsView, ProductsManage, StockView, StockAdjust, StockTransfer,
		DeliveryView,
		SuppliersView, PurchasesView,
	},
	"FINANZAS": {
		ClientsView,
		OrdersView,
		FinanceView, FinanceCashRegister, FinanceExpenses, FinanceChecks, FinanceBudgets, FinanceReports,
		InvoicesView, InvoicesCreate, InvoicesCancel,
		SuppliersView, PurchasesView,
		ReportsView, ReportsExport,
	},
	"REPARTIDOR": {
		OrdersView,
		DeliveryView, DeliveryUpdate, DeliveryCollect,
	},
}

// Override represents a single permission override from the database.
type Override struct {
	Permission string
	Granted    bool
}

// ResolvePermissions computes the final permission set for a role by applying overrides to defaults.
func ResolvePermissions(role string, overrides []Override) []string {
	if role == "ADMIN" {
		return AllPermissions
	}

	defaults, ok := DefaultPermissions[role]
	if !ok {
		return nil
	}

	permSet := make(map[string]bool, len(defaults))
	for _, p := range defaults {
		permSet[p] = true
	}

	for _, o := range overrides {
		if o.Granted {
			permSet[o.Permission] = true
		} else {
			delete(permSet, o.Permission)
		}
	}

	result := make([]string, 0, len(permSet))
	for p := range permSet {
		result = append(result, p)
	}
	return result
}

// HasPermission checks if a permission exists in the given list.
func HasPermission(permissions []string, required string) bool {
	for _, p := range permissions {
		if p == required {
			return true
		}
	}
	return false
}
