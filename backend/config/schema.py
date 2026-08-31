def exclude_legacy_api_alias(endpoints):
    """Keep the compatibility /api routes out of Swagger's canonical schema."""
    return [endpoint for endpoint in endpoints if not endpoint[0].startswith("/api/") or endpoint[0].startswith("/api/v1/")]
