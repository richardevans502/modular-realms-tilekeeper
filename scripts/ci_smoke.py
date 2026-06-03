#!/usr/bin/env python3
"""Repository smoke checks for Modular Realms TileKeeper.

This intentionally runs before the Expo app scaffold is fully exercised. It proves
the planning repository and GitHub Actions wiring can execute deterministic checks.
"""

from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_PATHS = [
    "README.md",
    "docs/PRD.md",
    "docs/TECHNICAL_ARCHITECTURE.md",
    "src/catalog",
    "src/inventory",
    "src/layout",
    "src/shared",
    "tests/unit",
    "tests/integration",
    "config",
    "assets",
]

ARCH_REQUIRED_HEADINGS = [
    "## 2. Engine/framework evaluation",
    "## 3. Product architecture overview",
    "## 4. Server/cloud topology",
    "## 5. Data model",
    "## 6. Build and CI/CD pipeline",
    "## 8. Security and cheat-protection model",
    "## 9. Cost of ownership projection",
]


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    sys.exit(1)


def main() -> int:
    for rel_path in REQUIRED_PATHS:
        path = ROOT / rel_path
        if not path.exists():
            fail(f"required path missing: {rel_path}")

    for rel_path in ["README.md", "docs/PRD.md", "docs/TECHNICAL_ARCHITECTURE.md"]:
        path = ROOT / rel_path
        if not path.read_text(encoding="utf-8").strip():
            fail(f"required document is empty: {rel_path}")

    architecture = (ROOT / "docs/TECHNICAL_ARCHITECTURE.md").read_text(encoding="utf-8")
    for heading in ARCH_REQUIRED_HEADINGS:
        if heading not in architecture:
            fail(f"architecture heading missing: {heading}")

    print("PASS: TileKeeper repository smoke checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
