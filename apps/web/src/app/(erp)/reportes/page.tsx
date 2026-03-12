"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportFilters } from "./components/report-filters";
import { SalesReport } from "./components/sales-report";
import { PurchasesReport } from "./components/purchases-report";
import { InventoryReport } from "./components/inventory-report";
import { FinanceReport } from "./components/finance-report";
import { ProductReport } from "./components/product-report";
import { reportsApi } from "@/lib/reports";
import gsap from "gsap";

export default function ReportesPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tab, setTab] = useState("ventas");

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".reportes-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".reportes-content", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const getExportUrl = () => {
    const params = { desde: desde || undefined, hasta: hasta || undefined };
    switch (tab) {
      case "ventas": return reportsApi.exportSales(params);
      case "compras": return reportsApi.exportPurchases(params);
      case "inventario": return reportsApi.exportInventory(params);
      case "finanzas": return reportsApi.exportFinance(params);
      default: return undefined;
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="reportes-header space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">Analiza ventas, compras, inventario y finanzas</p>
      </div>

      <div className="reportes-content space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <TabsList>
              <TabsTrigger value="ventas">Ventas</TabsTrigger>
              <TabsTrigger value="compras">Compras</TabsTrigger>
              <TabsTrigger value="inventario">Inventario</TabsTrigger>
              <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
              <TabsTrigger value="productos">Productos</TabsTrigger>
            </TabsList>
            <ReportFilters desde={desde} hasta={hasta} onDesdeChange={setDesde} onHastaChange={setHasta} exportUrl={getExportUrl()} />
          </div>

          <TabsContent value="ventas"><SalesReport desde={desde} hasta={hasta} /></TabsContent>
          <TabsContent value="compras"><PurchasesReport desde={desde} hasta={hasta} /></TabsContent>
          <TabsContent value="inventario"><InventoryReport /></TabsContent>
          <TabsContent value="finanzas"><FinanceReport desde={desde} hasta={hasta} /></TabsContent>
          <TabsContent value="productos"><ProductReport desde={desde} hasta={hasta} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
