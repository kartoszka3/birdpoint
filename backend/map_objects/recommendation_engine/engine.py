import math
import requests
from typing import List, Tuple
from shapely.geometry import LineString, Point, Polygon
from shapely.geometry.base import BaseGeometry
from shapely.ops import unary_union

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def _distance_m_from_geom(geom: BaseGeometry, point: Point) -> float:
    """Approximate Euclidean distance in meters using latitude-aware degree-to-meter conversion."""
    if geom is None:
        return 1e9

    distance_deg = geom.distance(point)
    if distance_deg == 0:
        return 0.0

    meters_per_degree = 111_320.0
    lat_factor = math.cos(math.radians(point.y))
    return distance_deg * meters_per_degree * max(lat_factor, 0.1)


def _fetch_osm_data(lat: float, lng: float, radius_m: int):
    query = f"""
    [out:json][timeout:180];
    (
      way["highway"](around:{radius_m},{lat},{lng});
      way["landuse"~"^(grass|forest|meadow|recreation_ground|garden|village_green|allotments)$"](around:{radius_m},{lat},{lng});
      way["natural"~"^(wood|grassland|scrub|heath)$"](around:{radius_m},{lat},{lng});
      way["leisure"~"^(park|garden|nature_reserve)$"](around:{radius_m},{lat},{lng});
      relation["landuse"~"^(grass|forest|meadow|recreation_ground|garden|village_green|allotments)$"](around:{radius_m},{lat},{lng});
      relation["natural"~"^(wood|grassland|scrub|heath)$"](around:{radius_m},{lat},{lng});
      relation["leisure"~"^(park|garden|nature_reserve)$"](around:{radius_m},{lat},{lng});
    );
    out geom;
    """

    try:
        response = requests.post(
            OVERPASS_URL,
            data={"data": query},
            headers={
                "User-Agent": "BirdPoint/1.0",
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            timeout=90,
        )
        response.raise_for_status()

        raw_text = response.text
        if not raw_text or not raw_text.strip():
            raise RuntimeError("Overpass API zwróciło pustą odpowiedź.")

        try:
            data = response.json()
        except ValueError as exc:
            raise RuntimeError("Overpass API zwróciło nieprawidłowy JSON.") from exc
    except Exception as exc:
        raise RuntimeError(f"Błąd pobierania danych OSM: {exc}") from exc

    roads = []
    greens = []

    for element in data.get("elements", []):
        tags = element.get("tags", {}) or {}
        geometry = element.get("geometry", [])
        coords = [(float(node["lon"]), float(node["lat"])) for node in geometry]

        if not coords:
            continue

        if tags.get("highway"):
            if len(coords) >= 2:
                roads.append(LineString(coords))
            continue

        if tags.get("landuse") or tags.get("natural") or tags.get("leisure"):
            if len(coords) >= 3 and coords[0] == coords[-1]:
                greens.append(Polygon(coords))
            elif len(coords) >= 3:
                greens.append(Polygon(coords + [coords[0]]))

    return unary_union(roads), unary_union(greens)


def _generate_candidate_grid(lat: float, lng: float, radius_m: int, step_m: int):
    """Create a small grid of candidate cells INSIDE the circular buffer around the chosen point."""
    candidates = []

    meters_per_degree_lat = 111_320.0
    meters_per_degree_lon = 111_320.0 * math.cos(math.radians(lat))

    for x in range(-radius_m, radius_m + 1, step_m):
        for y in range(-radius_m, radius_m + 1, step_m):
            # POPRAWKA: Sprawdzamy dystans euklidesowy w metrach od środka (twierdzenie Pitagorasa)
            # Jeśli dystans punktu siatki przekracza promień koła, pomijamy go, żeby nie wychodził poza bufor.
            if math.sqrt(x**2 + y**2) > radius_m:
                continue

            lon = lng + (x / meters_per_degree_lon)
            lat_shift = lat + (y / meters_per_degree_lat)
            point = Point(lon, lat_shift)

            candidates.append((point, x, y))

    return candidates


def _score_candidate(point: Point, roads_union, green_union, existing_feeders: List[Tuple[float, float]]) -> dict:
    road_distance = _distance_m_from_geom(roads_union, point)
    green_distance = _distance_m_from_geom(green_union, point)

    feeder_distance = 1e9
    for f_lat, f_lng in existing_feeders:
        feeder_point = Point(f_lng, f_lat)
        feeder_distance = min(feeder_distance, _distance_m_from_geom(feeder_point.buffer(0.00001), point))

    road_score = min(1.0, road_distance / 80.0)
    green_score = min(1.0, green_distance / 120.0)
    feeder_score = min(1.0, feeder_distance / 160.0)
    total = 0.40 * road_score + 0.30 * green_score + 0.30 * feeder_score

    if road_distance < 10:
        total *= 0.25

    return {
        "score": round(total, 3),
        "road_distance_m": round(road_distance, 1),
        "green_distance_m": round(green_distance, 1),
        "feeder_distance_m": round(feeder_distance, 1),
    }


def oblicz_rekomendacje(lat: float, lng: float, buffer_m: int, threshold: float, feeder_coords: List[Tuple[float, float]]):
    """Główna funkcja wywoływana przez widok Django."""
    roads_union, green_union = _fetch_osm_data(lat, lng, buffer_m + 100)
    candidates = _generate_candidate_grid(lat, lng, buffer_m, max(15, int(buffer_m / 12)))

    features = []
    scores = []

    for point, _, _ in candidates:
        meta = _score_candidate(point, roads_union, green_union, feeder_coords)
        if meta["score"] < threshold:
            continue

        cell_size_deg_lat = 10.0 / 111_320.0
        cell_size_deg_lon = 10.0 / (111_320.0 * math.cos(math.radians(point.y)))
        minx = point.x - cell_size_deg_lon
        maxx = point.x + cell_size_deg_lon
        miny = point.y - cell_size_deg_lat
        maxy = point.y + cell_size_deg_lat

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [minx, miny],
                    [maxx, miny],
                    [maxx, maxy],
                    [minx, maxy],
                    [minx, miny],
                ]],
            },
            "properties": {
                "score": meta["score"],
                "road_distance_m": meta["road_distance_m"],
                "green_distance_m": meta["green_distance_m"],
                "feeder_distance_m": meta["feeder_distance_m"],
            },
        }
        features.append(feature)
        scores.append(meta["score"])

    summary = {
        "candidate_cells": len(features),
        "avg_score": round(sum(scores) / len(scores), 3) if scores else 0.0,
        "best_score": round(max(scores), 3) if scores else 0.0,
        "buffer_m": buffer_m,
    }

    return features, summary