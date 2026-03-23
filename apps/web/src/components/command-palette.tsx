"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { filterNavByPermissions } from "@/config/navigation";
import { useUserStore } from "@/store/user-store";
import { api } from "@/lib/api-client";
import { User, Package, Users, ShoppingCart, FileText } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-command-palette", handler);
    return () => window.removeEventListener("open-command-palette", handler);
  }, []);

  const debouncedSearch = search.length >= 2 ? search : "";

  const { data: clientes } = useQuery({
    queryKey: ["cmd-clientes", debouncedSearch],
    queryFn: () =>
      api.getWithMeta<
        Array<{ id: string; nombre: string; apellido?: string; cuit?: string }>
      >(`/api/v1/clientes?search=${encodeURIComponent(debouncedSearch)}&page=1&pageSize=5`),
    enabled: !!debouncedSearch && open,
    staleTime: 10000,
  });

  const { data: productos } = useQuery({
    queryKey: ["cmd-productos", debouncedSearch],
    queryFn: () =>
      api.getWithMeta<Array<{ id: string; nombre: string; codigo?: string }>>(
        `/api/v1/productos?search=${encodeURIComponent(debouncedSearch)}&page=1&pageSize=5`,
      ),
    enabled: !!debouncedSearch && open,
    staleTime: 10000,
  });

  const { data: pedidos } = useQuery({
    queryKey: ["cmd-pedidos", debouncedSearch],
    queryFn: () =>
      api.getWithMeta<
        Array<{ id: string; numero: string; cliente_nombre: string }>
      >(`/api/v1/pedidos?search=${encodeURIComponent(debouncedSearch)}&page=1&pageSize=5`),
    enabled: !!debouncedSearch && open,
    staleTime: 10000,
  });

  const { data: facturas } = useQuery({
    queryKey: ["cmd-facturas", debouncedSearch],
    queryFn: () =>
      api.getWithMeta<
        Array<{ id: string; numero: string; cliente_nombre: string }>
      >(`/api/v1/facturas?search=${encodeURIComponent(debouncedSearch)}&page=1&pageSize=5`),
    enabled: !!debouncedSearch && open,
    staleTime: 10000,
  });

  const filteredNav = filterNavByPermissions(permissions);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setSearch("");
      router.push(href);
    },
    [router],
  );

  const clientesList = clientes?.data || [];
  const productosList = productos?.data || [];
  const pedidosList = pedidos?.data || [];
  const facturasList = facturas?.data || [];
  const hasResults =
    clientesList.length > 0 ||
    productosList.length > 0 ||
    pedidosList.length > 0 ||
    facturasList.length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSearch("");
      }}
    >
      <CommandInput
        placeholder="Buscar clientes, productos, pedidos, facturas..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        {clientesList.length > 0 && (
          <CommandGroup heading="Clientes">
            {clientesList.map((c) => (
              <CommandItem
                key={c.id}
                value={`cliente ${c.nombre} ${c.apellido || ""} ${c.cuit || ""}`}
                onSelect={() => handleSelect(`/ventas/clientes/${c.id}`)}
              >
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>
                  {c.apellido ? `${c.apellido}, ${c.nombre}` : c.nombre}
                </span>
                {c.cuit && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {c.cuit}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {productosList.length > 0 && (
          <CommandGroup heading="Productos">
            {productosList.map((p) => (
              <CommandItem
                key={p.id}
                value={`producto ${p.nombre} ${p.codigo || ""}`}
                onSelect={() => handleSelect(`/inventario/productos/${p.id}`)}
              >
                <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{p.nombre}</span>
                {p.codigo && (
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {p.codigo}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {pedidosList.length > 0 && (
          <CommandGroup heading="Pedidos">
            {pedidosList.map((p) => (
              <CommandItem
                key={p.id}
                value={`pedido ${p.numero} ${p.cliente_nombre}`}
                onSelect={() => handleSelect(`/ventas/pedidos/${p.id}`)}
              >
                <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs">{p.numero}</span>
                <span className="ml-2 text-sm">{p.cliente_nombre}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {facturasList.length > 0 && (
          <CommandGroup heading="Facturas">
            {facturasList.map((f) => (
              <CommandItem
                key={f.id}
                value={`factura ${f.numero} ${f.cliente_nombre}`}
                onSelect={() => handleSelect(`/ventas/facturas/${f.id}`)}
              >
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs">{f.numero}</span>
                <span className="ml-2 text-sm">{f.cliente_nombre}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hasResults && <CommandSeparator />}

        {filteredNav.map((section) => (
          <CommandGroup key={section.title} heading={section.title}>
            {section.items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${section.title} ${item.title}`}
                onSelect={() => handleSelect(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandGroup heading="Cuenta">
          <CommandItem
            value="perfil mi cuenta"
            onSelect={() => handleSelect("/perfil")}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
