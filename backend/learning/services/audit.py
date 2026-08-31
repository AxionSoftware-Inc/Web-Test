import logging

from django.db import transaction

from learning.models import AuditEvent


logger = logging.getLogger(__name__)


def record_event(request, *, action, resource_type, resource_id, metadata=None):
    """Record a business event without storing management keys or answer values."""
    try:
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
        ip_address = (forwarded_for.split(",")[0].strip() if forwarded_for else request.META.get("REMOTE_ADDR")) or None
        identity_code = request.headers.get("X-QuestLab-Identity", "")[:120]
        with transaction.atomic():
            AuditEvent.objects.create(
                action=action,
                resource_type=resource_type,
                resource_id=str(resource_id),
                identity_code=identity_code,
                ip_address=ip_address,
                metadata=metadata or {},
            )
    except Exception:
        logger.exception("Could not write audit event", extra={"action": action, "resource_type": resource_type})
