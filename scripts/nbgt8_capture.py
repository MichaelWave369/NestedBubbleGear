#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import argparse
import importlib.util
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
MOD = ROOT / "experiments" / "NBGT8" / "src" / "nbgt8.py"
spec = importlib.util.spec_from_file_location("nbgt8", MOD)
nbgt8 = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = nbgt8
spec.loader.exec_module(nbgt8)


def main():
    parser = argparse.ArgumentParser(description="Operator-triggered read-only NBG-T8 evidence capture")
    parser.add_argument("--url", required=True)
    parser.add_argument("--allow-host", action="append", required=True)
    parser.add_argument("--capture-id", required=True)
    parser.add_argument("--epoch", type=int, required=True, help="Logical NBG known-time epoch")
    parser.add_argument("--stance", choices=["SUPPORT", "OPPOSE", "UNKNOWN"], default="UNKNOWN")
    parser.add_argument("--provider", default="OPERATOR_HTTP")
    parser.add_argument("--independence-group", required=True)
    parser.add_argument("--store", default=".nbg/evidence")
    parser.add_argument("--max-bytes", type=int, default=1_000_000)
    args = parser.parse_args()

    adapter = nbgt8.make_adapter(
        "HTTP_READ_ONLY",
        args.provider,
        "0.1",
        args.independence_group,
        set(args.allow_host),
        max_bytes=args.max_bytes,
    )
    stamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    receipt, content = nbgt8.capture_with_transport(
        adapter,
        capture_id=args.capture_id,
        locator=args.url,
        retrieved_at=args.epoch,
        retrieved_timestamp=stamp,
        stance=args.stance,
        transport=nbgt8.live_http_transport,
    )
    paths = nbgt8.persist_capture(receipt, content, args.store)
    print(json.dumps({"receipt": receipt, "persisted": paths}, indent=2))


if __name__ == "__main__":
    main()
