"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/store/user-store";
import { useProductos } from "@/hooks/queries/use-products";
import { useClientes } from "@/hooks/queries/use-clients";
import { useMetodosPago } from "@/hooks/queries/use-finance";
import { useCajas } from "@/hooks/queries/use-finance";
import { useCreatePedido } from "@/hooks/queries/use-orders";
import { useCreateMovimiento } from "@/hooks/queries/use-finance";
import { useDebounce } from "@/hooks/use-debounce";
import { reportsApi } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  CreditCard,
  Check,
  X,
  Package,
  Banknote,
  Receipt,
  Loader2,
  ChevronsUpDown,
  Monitor,
  BarChart3,
  ChevronDown,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import type { Producto, Cliente, MetodoPago, Caja } from "@pronto/shared/types";
import { ReceiptPreview, type ReceiptData } from "@/components/receipt-preview";
import { printReceipt } from "@/lib/thermal-print";

// ─── Types ───────────────────────────────────────────────────────────

interface CartItem {
  producto_id: string;
  nombre: string;
  codigo?: string;
  precio: number;
  unidad: string;
  cantidad: number;
}

interface PaymentEntry {
  id: string;
  metodo_pago_id: string;
  monto: number;
}

// ─── Currency formatter ──────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);

// ─── POS Page ────────────────────────────────────────────────────────

export default function POSPage() {
  const user = useUserStore((s) => s.user);
  const sucursalId = user?.sucursal_actual?.id || user?.sucursales?.[0]?.id || "";

  // ── Product search state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // ── Client selection state
  const [clienteSearch, setClienteSearch] = useState("");
  const debouncedClienteSearch = useDebounce(clienteSearch, 300);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientePopoverOpen, setClientePopoverOpen] = useState(false);

  // ── Payment state (multi-payment)
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [selectedCaja, setSelectedCaja] = useState("");

  // ── Daily summary state
  const [summaryOpen, setSummaryOpen] = useState(false);

  // ── Checkout state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReceiptData, setLastReceiptData] = useState<ReceiptData | null>(null);

  // ── Animation refs
  const pageRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // ── API queries
  const { data: productosData, isLoading: loadingProductos } = useProductos({
    page: 1,
    pageSize: 40,
    search: debouncedSearch || undefined,
  });
  const productos = productosData?.data || [];

  const { data: clientesData } = useClientes({
    page: 1,
    pageSize: 15,
    search: debouncedClienteSearch || undefined,
  });
  const clientes = clientesData?.data || [];

  const { data: metodosPagoData } = useMetodosPago({ page: 1, pageSize: 50 });
  const metodosPago = metodosPagoData?.data || [];

  const { data: cajasData } = useCajas({ page: 1, pageSize: 50 });
  const cajas = cajasData?.data || [];

  const createPedido = useCreatePedido();
  const createMovimiento = useCreateMovimiento();

  // ── Daily summary query
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: dailySalesData } = useQuery({
    queryKey: ["report-sales-today", todayStr],
    queryFn: () => reportsApi.sales({ desde: todayStr, hasta: todayStr }),
  });
  const dailyTotal = dailySalesData?.by_period?.reduce((s, p) => s + p.total, 0) ?? 0;
  const dailyCount = dailySalesData?.by_period?.reduce((s, p) => s + p.count, 0) ?? 0;
  const dailyAvg = dailyCount > 0 ? dailyTotal / dailyCount : 0;

  // ── Auto-select first caja
  useEffect(() => {
    if (cajas.length > 0 && !selectedCaja) {
      const efectivoCaja = cajas.find((c) => c.tipo === "EFECTIVO");
      setSelectedCaja(efectivoCaja?.id || cajas[0].id);
    }
  }, [cajas, selectedCaja]);

  // ── Entrance animation
  useEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pos-panel",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" },
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  // ── Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchInput("");
        searchRef.current?.focus();
      }
      // Focus search on "/" key when not in an input
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Cart calculations
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    [cart],
  );
  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.cantidad, 0),
    [cart],
  );

  // ── Cart actions
  const addToCart = useCallback(
    (producto: Producto) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.producto_id === producto.id);
        if (existing) {
          return prev.map((item) =>
            item.producto_id === producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item,
          );
        }
        return [
          ...prev,
          {
            producto_id: producto.id,
            nombre: producto.nombre,
            codigo: producto.codigo,
            precio: producto.precio_base,
            unidad: producto.unidad,
            cantidad: 1,
          },
        ];
      });

      // Animate the cart badge
      if (cartRef.current) {
        gsap.fromTo(
          cartRef.current.querySelector(".cart-badge"),
          { scale: 1.4 },
          { scale: 1, duration: 0.3, ease: "back.out(2)" },
        );
      }
    },
    [],
  );

  const updateQuantity = useCallback(
    (productoId: string, delta: number) => {
      setCart((prev) =>
        prev
          .map((item) =>
            item.producto_id === productoId
              ? { ...item, cantidad: Math.max(0, item.cantidad + delta) }
              : item,
          )
          .filter((item) => item.cantidad > 0),
      );
    },
    [],
  );

  const removeFromCart = useCallback((productoId: string) => {
    setCart((prev) => prev.filter((item) => item.producto_id !== productoId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCliente(null);
    setClienteSearch("");
    setPayments([]);
  }, []);

  // ── Multi-payment helpers
  const addPayment = useCallback(() => {
    setPayments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), metodo_pago_id: metodosPago[0]?.id || "", monto: 0 },
    ]);
  }, [metodosPago]);

  const updatePayment = useCallback((id: string, field: "metodo_pago_id" | "monto", value: string | number) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  }, []);

  const removePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + (Number(p.monto) || 0), 0),
    [payments],
  );
  const remaining = cartSubtotal - totalPaid;
  const paymentsValid = payments.length > 0 && Math.abs(remaining) < 0.01;

  // ── Checkout handler
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("El carrito esta vacio");
      return;
    }
    if (!selectedCliente) {
      toast.error("Debe seleccionar un cliente");
      return;
    }
    if (!sucursalId) {
      toast.error("No se encontro la sucursal");
      return;
    }
    if (!paymentsValid) {
      toast.error("Los pagos deben sumar el total exacto");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create pedido with ENTREGADO state (immediate POS sale)
      const pedidoData = {
        cliente_id: selectedCliente.id,
        sucursal_id: sucursalId,
        condicion_pago: "CONTADO" as const,
        descuento_porcentaje: 0,
        items: cart.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          descuento_porcentaje: 0,
        })),
        impuestos: [],
      };

      await createPedido.mutateAsync(pedidoData);

      // 2. Register cash movements for each payment entry
      if (selectedCaja) {
        const clienteName = `${selectedCliente.nombre}${selectedCliente.apellido ? ` ${selectedCliente.apellido}` : ""}`;
        for (const payment of payments) {
          const mpName = metodosPago.find((m) => m.id === payment.metodo_pago_id)?.nombre || "N/A";
          try {
            await createMovimiento.mutateAsync({
              cajaId: selectedCaja,
              data: {
                tipo: "INGRESO",
                caja_id: selectedCaja,
                monto: Number(payment.monto),
                concepto: `Venta POS - ${clienteName} (${mpName})`,
              },
            });
          } catch {
            toast.warning(`Movimiento de caja fallido para pago ${mpName}`);
          }
        }
      }

      // 3. Build receipt data for printing
      const clienteName = `${selectedCliente.nombre}${selectedCliente.apellido ? ` ${selectedCliente.apellido}` : ""}`;
      const receiptData: ReceiptData = {
        empresa: "Pronto ERP",
        sucursal: user?.sucursal_actual?.nombre || "Sucursal",
        cuit: selectedCliente.cuit || undefined,
        numero: `POS-${Date.now().toString(36).toUpperCase()}`,
        fecha: new Date().toLocaleString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        cliente: clienteName,
        vendedor: user?.nombre || undefined,
        items: cart.map((item) => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.precio * item.cantidad,
        })),
        subtotal: cartSubtotal,
        descuento: 0,
        impuestos: 0,
        total: cartSubtotal,
        condicion_pago: "CONTADO",
      };
      setLastReceiptData(receiptData);

      // 4. Show success animation
      setShowSuccess(true);
      if (successRef.current) {
        gsap.fromTo(
          successRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
        );
      }

      setTimeout(() => {
        setShowSuccess(false);
        clearCart();
        setLastReceiptData(null);
      }, 4000);

      toast.success("Venta registrada correctamente");
    } catch {
      toast.error("Error al procesar la venta");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <div ref={pageRef} className="flex h-[calc(100vh-4rem)] gap-4 overflow-hidden -m-6 p-4">
      {/* ─── LEFT PANEL: Product Search + Grid (60%) ─── */}
      <div className="pos-panel flex w-[60%] flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <Monitor className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Punto de Venta</h1>
              <p className="text-xs text-muted-foreground">
                {user.sucursal_actual?.nombre || "Sin sucursal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <Link href="/ventas/pos/analytics">
                <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                Analytics
              </Link>
            </Button>
            <Badge variant="secondary" className="border border-border/50 text-xs">
              {new Date().toLocaleDateString("es-AR", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </Badge>
          </div>
        </div>

        {/* Daily Summary (collapsible) */}
        <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-2.5 text-left transition-colors hover:bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resumen del Dia</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", summaryOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Ventas Hoy</p>
                  <p className="text-sm font-bold tabular-nums">{formatCurrency(dailyTotal)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Receipt className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Tickets</p>
                  <p className="text-sm font-bold tabular-nums">{dailyCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Promedio</p>
                  <p className="text-sm font-bold tabular-nums">{formatCurrency(dailyAvg)}</p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Buscar producto por nombre o codigo...  (/ para enfocar, Esc para limpiar)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-12 pl-11 pr-10 text-base rounded-xl border-border/50 bg-card shadow-sm transition-shadow focus:shadow-md"
            autoFocus
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                searchRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Product grid */}
        <ScrollArea className="flex-1">
          {loadingProductos ? (
            <div className="grid grid-cols-2 gap-3 pr-3 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-xl" />
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Package className="h-12 w-12 opacity-40" />
              <p className="text-sm">
                {searchInput
                  ? "No se encontraron productos"
                  : "Escribi para buscar productos"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pr-3 lg:grid-cols-3 xl:grid-cols-4">
              {productos.map((producto) => {
                const inCart = cart.find((c) => c.producto_id === producto.id);
                return (
                  <button
                    key={producto.id}
                    onClick={() => addToCart(producto)}
                    className={cn(
                      "group relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200",
                      "hover:border-[var(--accent)]/40 hover:shadow-md hover:-translate-y-0.5",
                      "active:scale-[0.97] active:shadow-sm",
                      inCart
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                        : "border-border/50 bg-card",
                    )}
                  >
                    {inCart && (
                      <Badge className="absolute -right-1.5 -top-1.5 h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] p-0 text-xs text-white shadow-sm">
                        {inCart.cantidad}
                      </Badge>
                    )}
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
                        {producto.nombre}
                      </span>
                    </div>
                    {producto.codigo && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {producto.codigo}
                      </span>
                    )}
                    <div className="mt-auto flex w-full items-end justify-between">
                      <span className="text-lg font-bold text-[var(--accent)]">
                        {formatCurrency(producto.precio_base)}
                      </span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                        {producto.unidad}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--accent)]/10 opacity-0 transition-opacity group-hover:opacity-100">
                      <Plus className="h-8 w-8 text-[var(--accent)]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ─── RIGHT PANEL: Cart + Checkout (40%) ─── */}
      <div
        ref={cartRef}
        className="pos-panel flex w-[40%] flex-col rounded-2xl border border-border/50 bg-card shadow-sm"
      >
        {/* Cart header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-base font-semibold">Carrito</h2>
            {cartItemCount > 0 && (
              <Badge
                className="cart-badge bg-[var(--accent)] text-white text-xs px-2"
              >
                {cartItemCount}
              </Badge>
            )}
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="h-8 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Vaciar
            </Button>
          )}
        </div>

        {/* Customer selection */}
        <div className="border-b border-border/50 px-5 py-3">
          <Popover open={clientePopoverOpen} onOpenChange={setClientePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between h-10 font-normal rounded-lg",
                  !selectedCliente && "text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {selectedCliente
                    ? `${selectedCliente.nombre}${selectedCliente.apellido ? ` ${selectedCliente.apellido}` : ""}`
                    : "Seleccionar cliente..."}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-2" align="start">
              <Input
                placeholder="Buscar cliente..."
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                className="mb-2"
              />
              <div className="max-h-[200px] overflow-y-auto">
                {clientes.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">Sin resultados</p>
                ) : (
                  clientes.map((c) => (
                    <button
                      key={c.id}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent",
                        selectedCliente?.id === c.id && "bg-accent",
                      )}
                      onClick={() => {
                        setSelectedCliente(c);
                        setClientePopoverOpen(false);
                        setClienteSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selectedCliente?.id === c.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium">
                          {c.nombre}
                          {c.apellido ? ` ${c.apellido}` : ""}
                        </div>
                        {c.cuit && (
                          <div className="text-xs text-muted-foreground">{c.cuit}</div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Cart items */}
        <ScrollArea className="flex-1 px-5">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 opacity-30" />
              <p className="text-sm">El carrito esta vacio</p>
              <p className="text-xs">Busca y selecciona productos para agregar</p>
            </div>
          ) : (
            <div className="space-y-1 py-3">
              {cart.map((item) => (
                <div
                  key={item.producto_id}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight truncate text-foreground">
                      {item.nombre}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.codigo && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {item.codigo}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(item.precio)} / {item.unidad}
                      </span>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.producto_id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.producto_id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-right text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(item.precio * item.cantidad)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.producto_id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Cart summary + Checkout */}
        <div className="mt-auto border-t border-border/50">
          {/* Multi-Payment & Caja selectors */}
          {cart.length > 0 && (
            <div className="px-5 py-3 border-b border-border/50 space-y-3">
              {/* Caja selector */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Banknote className="h-3 w-3" />
                  Caja
                </label>
                <Select value={selectedCaja} onValueChange={setSelectedCaja}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cajas.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment entries */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="h-3 w-3" />
                    Medios de Pago
                  </label>
                  <button
                    type="button"
                    onClick={addPayment}
                    className="flex items-center gap-1 text-[10px] font-medium text-[var(--accent)] hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Agregar
                  </button>
                </div>

                {payments.length === 0 ? (
                  <button
                    type="button"
                    onClick={addPayment}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar medio de pago
                  </button>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <Select
                          value={p.metodo_pago_id}
                          onValueChange={(v) => updatePayment(p.id, "metodo_pago_id", v)}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue placeholder="Metodo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {metodosPago.map((mp) => (
                              <SelectItem key={mp.id} value={mp.id} className="text-xs">
                                {mp.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={p.monto || ""}
                          onChange={(e) => updatePayment(p.id, "monto", parseFloat(e.target.value) || 0)}
                          placeholder="Monto"
                          className="h-8 w-28 text-xs tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => removePayment(p.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Remaining indicator */}
                    {payments.length > 0 && (
                      <div className={cn(
                        "flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium",
                        Math.abs(remaining) < 0.01
                          ? "bg-emerald-500/10 text-emerald-600"
                          : remaining > 0
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-destructive/10 text-destructive",
                      )}>
                        <span>Restante</span>
                        <span className="tabular-nums">{formatCurrency(Math.max(0, remaining))}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-3 px-5 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({cartItemCount} {cartItemCount === 1 ? "item" : "items"})
                </span>
                <span className="font-medium tabular-nums">{formatCurrency(cartSubtotal)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold tabular-nums text-[var(--accent)]">
                {formatCurrency(cartSubtotal)}
              </span>
            </div>

            {/* Checkout button */}
            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0 || !selectedCliente || isProcessing || !paymentsValid}
              className={cn(
                "h-14 w-full rounded-xl text-base font-semibold shadow-md transition-all duration-200",
                "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90",
                "disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
                cart.length > 0 && selectedCliente && !isProcessing && paymentsValid && "hover:shadow-lg hover:-translate-y-0.5",
              )}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Cobrar {cart.length > 0 ? formatCurrency(cartSubtotal) : ""}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Success Overlay ─── */}
      {showSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div
            ref={successRef}
            className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card p-10 shadow-2xl"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Venta Registrada</h2>
            <p className="text-muted-foreground">El pedido fue creado exitosamente</p>
            {lastReceiptData && (
              <div className="flex items-center gap-2 mt-2">
                <ReceiptPreview data={lastReceiptData} />
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    if (lastReceiptData) printReceipt(lastReceiptData);
                  }}
                >
                  <Receipt className="h-4 w-4" />
                  Imprimir Directo
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
