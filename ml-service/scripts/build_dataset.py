#!/usr/bin/env python3
"""Build training dataset from GSI inventory and synthetic negatives."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.train import build_training_dataframe, DATA_DIR

if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df = build_training_dataframe()
    out = DATA_DIR / "training_features.csv"
    df.to_csv(out, index=False)
    print(f"Wrote {len(df)} samples to {out} ({df['label'].sum()} positive)")
