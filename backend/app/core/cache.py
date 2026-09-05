import time
from typing import Any, Optional, Dict, Tuple

class FastTtlCache:
    """
    High-performance in-memory TTL cache for eliminating network round-trips
    to MongoDB Atlas on frequent UI button clicks and navigation switches.
    """
    def __init__(self, default_ttl: float = 4.0):
        self._store: Dict[str, Tuple[float, Any]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            expiry, value = self._store[key]
            if time.time() < expiry:
                return value
            del self._store[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        duration = ttl if ttl is not None else self._default_ttl
        self._store[key] = (time.time() + duration, value)

    def invalidate(self, prefix: Optional[str] = None) -> None:
        if not prefix:
            self._store.clear()
        else:
            keys_to_del = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_del:
                self._store.pop(k, None)

# Shared singleton cache instance
fast_cache = FastTtlCache(default_ttl=4.0)
