"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface DemoLoginButtonProps {
  onSuccess: (email: string, password: string) => void;
}

export function DemoLoginButton({ onSuccess }: DemoLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/demo`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json();
      if (body.success) {
        toast.success("Cuenta demo lista");
        onSuccess(body.data.email, body.data.password);
      } else {
        toast.error(body.error?.message || "Error creando demo");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      className="w-full gap-2"
      onClick={handleDemo}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      Probar con cuenta demo
    </Button>
  );
}
