"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Eye } from "lucide-react";
import { buildReceiptHtml, printReceipt, type ReceiptData } from "@/lib/thermal-print";

// Re-export ReceiptData type from the lib
export type { ReceiptData } from "@/lib/thermal-print";

interface ReceiptPreviewProps {
  data: ReceiptData;
  trigger?: React.ReactNode;
}

export function ReceiptPreview({ data, trigger }: ReceiptPreviewProps) {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    printReceipt(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Vista Previa del Ticket
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border bg-white p-4">
          <div
            className="mx-auto font-mono text-[10px] leading-tight text-black"
            style={{ maxWidth: "58mm" }}
            dangerouslySetInnerHTML={{
              __html: buildReceiptHtml(data)
                .replace(/[\s\S]*<pre>/, "")
                .replace(/<\/pre>[\s\S]*/, "")
                .replace(/\n/g, "<br>"),
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
