"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const IDLE_TIMEOUT = 25 * 60 * 1000;

export function SessionTimeout() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const idleTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  const resetIdle = useCallback(() => {
    if (showWarning) return;
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      setShowWarning(true);
      setCountdown(300);
    }, IDLE_TIMEOUT);
  }, [showWarning]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
    };
  }, [resetIdle]);

  useEffect(() => {
    if (showWarning) {
      countdownTimer.current = window.setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
            router.push("/login");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
    }
    return () => {
      if (countdownTimer.current !== null) window.clearInterval(countdownTimer.current);
    };
  }, [showWarning, router]);

  const handleContinue = () => {
    setShowWarning(false);
    resetIdle();
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sesion por expirar</AlertDialogTitle>
          <AlertDialogDescription>
            Tu sesion se cerrara por inactividad en{" "}
            <span className="font-mono font-bold text-foreground">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
            . Hace click en continuar para mantener la sesion activa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleContinue}>
            Continuar trabajando
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
