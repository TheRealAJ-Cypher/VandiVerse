from backend.services.safety_agent import assess_trip_safety


def test_floodwater_is_critical_and_never_advises_crossing():
    result = assess_trip_safety("Can we drive through floodwater?")
    assert result["level"] == "critical"
    assert "Do not drive through floodwater" in result["guidance"]
    assert result["live_road_data_checked"] is False


def test_adverse_weather_is_caution():
    result = assess_trip_safety(
        "Can we leave now?",
        {"weather_summary": "Heavy rain and thunderstorm expected"},
    )
    assert result["level"] == "caution"
    assert "official" in result["guidance"].lower()


def test_no_hazard_keywords_does_not_claim_route_is_safe():
    result = assess_trip_safety("What snacks should we pack?")
    assert result["level"] == "unverified"
    assert "does not mean the route is safe" in result["reason"]


def test_flood_context_takes_priority():
    result = assess_trip_safety(
        "Can we go?",
        {"weather_summary": "Waterlogging reported near the route"},
    )
    assert result["level"] == "critical"
