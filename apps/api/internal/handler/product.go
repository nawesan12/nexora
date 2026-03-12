package handler

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nexora-erp/nexora/internal/middleware"
	"github.com/nexora-erp/nexora/internal/pkg/pagination"
	"github.com/nexora-erp/nexora/internal/pkg/response"
	"github.com/nexora-erp/nexora/internal/pkg/validator"
	"github.com/nexora-erp/nexora/internal/service"
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
