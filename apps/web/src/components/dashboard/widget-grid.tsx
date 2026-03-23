"use client";

import React, { Suspense, useMemo, useCallback } from "react";
import {
  ResponsiveGridLayout,
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout";
import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetDefinition } from "./widget-registry";

interface SimpleLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface WidgetGridProps {
  widgets: WidgetDefinition[];
  layout: SimpleLayoutItem[];
  onLayoutChange: (layout: SimpleLayoutItem[]) => void;
  isEditing: boolean;
}

function WidgetFallback() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

export function WidgetGrid({ widgets, layout, onLayoutChange, isEditing }: WidgetGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 1200,
  });

  const widgetMap = useMemo(() => {
    const map = new Map<string, WidgetDefinition>();
    for (const w of widgets) {
      map.set(w.id, w);
    }
    return map;
  }, [widgets]);

  const layoutWithConstraints: Layout = useMemo(() => {
    return layout.map((item) => {
      const widget = widgetMap.get(item.i);
      return {
        ...item,
        minW: widget?.minW ?? 2,
        minH: widget?.minH ?? 2,
        static: !isEditing,
      };
    });
  }, [layout, widgetMap, isEditing]);

  const layouts: ResponsiveLayouts = useMemo(() => ({
    lg: layoutWithConstraints,
  }), [layoutWithConstraints]);

  const handleChange = useCallback(
    (currentLayout: Layout, _allLayouts: ResponsiveLayouts) => {
      const plain: SimpleLayoutItem[] = currentLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
      onLayoutChange(plain);
    },
    [onLayoutChange]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "widget-grid",
        isEditing && "rounded-lg border-2 border-dashed border-[var(--accent)]/30 bg-[var(--accent)]/5 p-2 transition-all"
      )}
    >
      {mounted && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          onLayoutChange={handleChange}
          isDraggable={isEditing}
          isResizable={isEditing}
          draggableHandle=".widget-drag-handle"
          margin={[16, 16]}
        >
          {layout.map((item) => {
            const widget = widgetMap.get(item.i);
            if (!widget) return null;
            const WidgetComponent = widget.component;

            return (
              <div key={item.i}>
                <Card className={cn(
                  "h-full border-0 shadow-sm overflow-hidden flex flex-col",
                  isEditing && "ring-1 ring-[var(--accent)]/20 hover:ring-[var(--accent)]/40 transition-all"
                )}>
                  <CardHeader className="pb-0 pt-3 px-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {isEditing && (
                        <div className="widget-drag-handle cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
                          <GripVertical className="h-4 w-4" />
                        </div>
                      )}
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {widget.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4 pt-2">
                    <Suspense fallback={<WidgetFallback />}>
                      <WidgetComponent />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
