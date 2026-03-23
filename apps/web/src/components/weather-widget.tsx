"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Droplets, Wind, Thermometer, MapPin } from "lucide-react";
import { fetchWeather, getWeatherIconUrl, type WeatherData } from "@/lib/weather";

interface WeatherWidgetProps {
  className?: string;
}

export function WeatherWidget({ className }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Try to get user location, fallback to Buenos Aires
    const defaultLat = -34.6037;
    const defaultLon = -58.3816;

    const loadWeather = async (lat: number, lon: number) => {
      const data = await fetchWeather(lat, lon);
      if (data) {
        setWeather(data);
      } else {
        setError(true);
      }
      setLoading(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
        () => loadWeather(defaultLat, defaultLon),
        { timeout: 5000 }
      );
    } else {
      loadWeather(defaultLat, defaultLon);
    }
  }, []);

  if (error || (!loading && !weather)) {
    return null; // Silently hide if no API key or error
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center gap-4 p-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-sm ${className || ""}`}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-500/10">
          {weather!.icon ? (
            <img
              src={getWeatherIconUrl(weather!.icon)}
              alt={weather!.description}
              className="h-10 w-10"
            />
          ) : (
            <Cloud className="h-6 w-6 text-sky-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{weather!.city}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{weather!.temp}&deg;</span>
            <span className="text-sm text-muted-foreground capitalize">{weather!.description}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Thermometer className="h-3 w-3" />
              ST {weather!.feels_like}&deg;
            </span>
            <span className="flex items-center gap-0.5">
              <Droplets className="h-3 w-3" />
              {weather!.humidity}%
            </span>
            <span className="flex items-center gap-0.5">
              <Wind className="h-3 w-3" />
              {weather!.wind_speed} km/h
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
