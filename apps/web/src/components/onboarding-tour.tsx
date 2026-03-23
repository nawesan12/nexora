"use client";

import { useEffect, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_KEY = "pronto-tour-completed";

const tourSteps = [
  {
    element: "[data-tour='sidebar']",
    popover: {
      title: "Navegacion",
      description:
        "Usa el menu lateral para acceder a todos los modulos del sistema: ventas, inventario, finanzas y mas.",
    },
  },
  {
    element: "[data-tour='header-search']",
    popover: {
      title: "Busqueda Rapida",
      description:
        "Presiona Ctrl+K para buscar rapidamente cualquier seccion, cliente o producto.",
    },
  },
  {
    element: "[data-tour='notifications']",
    popover: {
      title: "Notificaciones",
      description:
        "Aqui veras alertas de stock bajo, pedidos pendientes y otras notificaciones importantes.",
    },
  },
  {
    element: "[data-tour='branch-selector']",
    popover: {
      title: "Selector de Sucursal",
      description:
        "Si tienes acceso a multiples sucursales, cambia entre ellas desde aqui.",
    },
  },
  {
    element: "[data-tour='dashboard']",
    popover: {
      title: "Dashboard",
      description:
        "Tu panel principal muestra KPIs, graficos y actividad reciente. Puedes personalizar el layout.",
    },
  },
];

export function OnboardingTour() {
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0, 0, 0, 0.6)",
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: "pronto-tour-popover",
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "!Listo!",
      progressText: "{{current}} de {{total}}",
      steps: tourSteps,
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_KEY, "true");
        driverObj.destroy();
      },
    });
    driverObj.drive();
  }, []);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      // Delay to allow DOM elements to render
      const timer = setTimeout(startTour, 1500);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  return null;
}

export function resetTour() {
  localStorage.removeItem(TOUR_KEY);
}
