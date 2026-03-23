package handler

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/pronto-erp/pronto/internal/middleware"
	"github.com/pronto-erp/pronto/internal/pkg/excel"
	"github.com/pronto-erp/pronto/internal/pkg/pagination"
	"github.com/pronto-erp/pronto/internal/pkg/response"
	"github.com/pronto-erp/pronto/internal/pkg/validator"
	"github.com/pronto-erp/pronto/internal/service"
	"github.com/xuri/excelize/v2"
)

type ProductHandler struct {
	svc *service.ProductService
}

func NewProductHandler(svc *service.ProductService) *ProductHandler {
	return &ProductHandler{svc: svc}
}

// --- Familias ---

func (h *ProductHandler) CreateFamilia(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateFamiliaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateFamilia(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear familia")
		return
	}
	response.Created(w, result)
}

func (h *ProductHandler) GetFamilia(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetFamilia(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrFamiliaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "familia no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener familia")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ProductHandler) ListFamilias(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)

	items, total, err := h.svc.ListFamilias(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar familias")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *ProductHandler) UpdateFamilia(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateFamiliaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateFamilia(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrFamiliaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "familia no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar familia")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ProductHandler) DeleteFamilia(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteFamilia(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrFamiliaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "familia no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar familia")
		return
	}
	response.NoContent(w)
}

// --- Categorias ---

func (h *ProductHandler) CreateCategoria(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateCategoriaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateCategoria(r.Context(), userID, input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear categoría")
		return
	}
	response.Created(w, result)
}

func (h *ProductHandler) GetCategoria(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetCategoria(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrCategoriaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "categoría no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener categoría")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ProductHandler) ListCategorias(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	familiaID := r.URL.Query().Get("familia_id")
	if familiaID != "" {
		items, err := h.svc.ListCategoriasByFamilia(r.Context(), userID, familiaID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar categorías")
			return
		}
		response.JSON(w, http.StatusOK, items)
		return
	}

	params := pagination.Parse(r)
	items, total, err := h.svc.ListCategorias(r.Context(), userID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar categorías")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *ProductHandler) UpdateCategoria(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateCategoriaInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateCategoria(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrCategoriaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "categoría no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar categoría")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ProductHandler) DeleteCategoria(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteCategoria(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrCategoriaNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "categoría no encontrada")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar categoría")
		return
	}
	response.NoContent(w)
}

// --- Productos ---

func (h *ProductHandler) CreateProducto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var input service.CreateProductoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.CreateProducto(r.Context(), userID, input)
	if err != nil {
		if errors.Is(err, service.ErrCodigoDuplicado) {
			response.Error(w, http.StatusConflict, "CODIGO_DUPLICADO", "ya existe un producto con ese código")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al crear producto")
		return
	}
	response.Created(w, result)
}

func (h *ProductHandler) GetProducto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	result, err := h.svc.GetProducto(r.Context(), userID, id)
	if err != nil {
		if errors.Is(err, service.ErrProductoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "producto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al obtener producto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ProductHandler) ListProductos(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	params := pagination.Parse(r)
	search := r.URL.Query().Get("search")

	items, total, err := h.svc.ListProductos(r.Context(), userID, search, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar productos")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *ProductHandler) UpdateProducto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	var input service.UpdateProductoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpdateProducto(r.Context(), userID, id, input)
	if err != nil {
		if errors.Is(err, service.ErrProductoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "producto no encontrado")
			return
		}
		if errors.Is(err, service.ErrCodigoDuplicado) {
			response.Error(w, http.StatusConflict, "CODIGO_DUPLICADO", "ya existe un producto con ese código")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar producto")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ProductHandler) DeleteProducto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)
	id := chi.URLParam(r, "id")

	if err := h.svc.DeleteProducto(r.Context(), userID, id); err != nil {
		if errors.Is(err, service.ErrProductoNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "producto no encontrado")
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar producto")
		return
	}
	response.NoContent(w)
}

// --- Catalogo ---

func (h *ProductHandler) UpsertCatalogo(w http.ResponseWriter, r *http.Request) {
	var input service.UpsertCatalogoInput
	if errs := validator.DecodeAndValidate(r, &input); errs != nil {
		response.ValidationErrors(w, errs)
		return
	}

	result, err := h.svc.UpsertCatalogo(r.Context(), input)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al actualizar catálogo")
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ProductHandler) ListCatalogo(w http.ResponseWriter, r *http.Request) {
	sucursalID := chi.URLParam(r, "sucursalId")
	params := pagination.Parse(r)

	items, total, err := h.svc.ListCatalogoBySucursal(r.Context(), sucursalID, int32(params.PageSize), int32(params.Offset))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al listar catálogo")
		return
	}
	response.JSONWithMeta(w, http.StatusOK, items, pagination.NewMeta(params, total))
}

func (h *ProductHandler) DeleteCatalogo(w http.ResponseWriter, r *http.Request) {
	productoID := chi.URLParam(r, "productoId")
	sucursalID := chi.URLParam(r, "sucursalId")

	if err := h.svc.DeleteCatalogo(r.Context(), productoID, sucursalID); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al eliminar del catálogo")
		return
	}
	response.NoContent(w)
}

// --- Bulk Import ---

func (h *ProductHandler) BulkImport(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	var items []service.CreateProductoInput
	body, err := io.ReadAll(r.Body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "error al leer el body")
		return
	}
	if err := json.Unmarshal(body, &items); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "formato JSON invalido")
		return
	}
	if len(items) == 0 {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "la lista de productos esta vacia")
		return
	}
	if len(items) > 1000 {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "maximo 1000 productos por importacion")
		return
	}

	result, err := h.svc.BulkImport(r.Context(), userID, items)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ProductHandler) ImportExcel(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	userID := middleware.PgUserID(claims)

	// Parse multipart file
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10MB max
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "error al leer el archivo")
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "archivo no encontrado en el form")
		return
	}
	defer file.Close()

	// Parse Excel
	f, err := excelize.OpenReader(file)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "no se pudo leer el archivo Excel")
		return
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil || len(rows) < 2 {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "el archivo debe tener al menos una fila de headers y una de datos")
		return
	}

	// Parse header row to find column indices
	headerMap := map[string]int{}
	for i, cell := range rows[0] {
		headerMap[strings.TrimSpace(strings.ToLower(cell))] = i
	}

	requiredHeaders := []string{"nombre"}
	for _, h := range requiredHeaders {
		if _, ok := headerMap[h]; !ok {
			response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "falta la columna obligatoria: "+h)
			return
		}
	}

	// Parse data rows
	var items []service.CreateProductoInput
	for _, row := range rows[1:] {
		getCell := func(name string) string {
			idx, ok := headerMap[name]
			if !ok || idx >= len(row) {
				return ""
			}
			return strings.TrimSpace(row[idx])
		}

		nombre := getCell("nombre")
		if nombre == "" {
			continue
		}

		precio := 0.0
		if p := getCell("precio_base"); p != "" {
			p = strings.ReplaceAll(p, ",", ".")
			precio, _ = strconv.ParseFloat(p, 64)
		}

		unidad := strings.ToUpper(getCell("unidad"))
		if unidad == "" {
			unidad = "UNIDAD"
		}

		items = append(items, service.CreateProductoInput{
			Codigo:      getCell("codigo"),
			Nombre:      nombre,
			Descripcion: getCell("descripcion"),
			PrecioBase:  precio,
			Unidad:      unidad,
			AlicuotaIVA: getCell("alicuota_iva"),
		})
	}

	if len(items) == 0 {
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "no se encontraron filas validas")
		return
	}

	result, err := h.svc.BulkImport(r.Context(), userID, items)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func (h *ProductHandler) DownloadTemplate(w http.ResponseWriter, r *http.Request) {
	headers := []string{"nombre", "codigo", "precio_base", "unidad", "descripcion", "alicuota_iva"}
	sampleRows := [][]string{
		{"Alimento Balanceado Premium 25kg", "ALM-001", "15500.00", "BOLSA", "Alimento premium para ganado", "21"},
		{"Suplemento Mineral 5kg", "SUP-002", "8900.50", "UNIDAD", "Suplemento mineral bovino", "10.5"},
		{"Semilla de Maiz 50kg", "SEM-003", "22000.00", "BOLSA", "", "21"},
	}

	buf, err := excel.GenerateExcel("Productos", headers, sampleRows)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "error al generar template")
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename=plantilla_productos.xlsx")
	w.Header().Set("Content-Length", strconv.Itoa(buf.Len()))
	w.Write(buf.Bytes())
}
