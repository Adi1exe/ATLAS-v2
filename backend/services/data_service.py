import pandas as pd
import numpy as np


def load_dataframe(filepath: str) -> pd.DataFrame:
    """Load CSV or Excel file into a DataFrame."""
    ext = filepath.rsplit(".", 1)[-1].lower()
    if ext == "csv":
        # Try common encodings
        for enc in ("utf-8", "latin-1", "cp1252"):
            try:
                return pd.read_csv(filepath, encoding=enc)
            except UnicodeDecodeError:
                continue
        raise ValueError("Could not decode CSV file")
    elif ext in ("xls", "xlsx"):
        return pd.read_excel(filepath)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Auto-clean the DataFrame:
    - Strip whitespace from string columns
    - Parse object columns that look like numbers/dates
    - Drop fully empty rows/columns
    - Reset index
    """
    # Drop completely empty rows and columns
    df = df.dropna(how="all").dropna(axis=1, how="all")

    for col in df.columns:
        # Strip whitespace from string columns
        if df[col].dtype == object:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace({"nan": np.nan, "None": np.nan, "": np.nan})

            # Try numeric conversion
            converted = pd.to_numeric(df[col], errors="coerce")
            if converted.notna().sum() / max(len(df), 1) > 0.8:
                df[col] = converted
                continue

            # Try datetime conversion
            try:
                dt = pd.to_datetime(df[col], infer_datetime_format=True, errors="coerce")
                if dt.notna().sum() / max(len(df), 1) > 0.8:
                    df[col] = dt
            except Exception:
                pass

    # Sanitize column names
    df.columns = (
        df.columns.str.strip()
            .str.lower()
            .str.replace(r"[^\w]", "_", regex=True)
            .str.replace(r"_+", "_", regex=True)
            .str.strip("_")
    )

    return df.reset_index(drop=True)


def profile_dataframe(df: pd.DataFrame) -> dict:
    """Return a lightweight profile of the DataFrame."""
    total_cells = df.size
    missing     = int(df.isna().sum().sum())
    missing_pct = round(missing / max(total_cells, 1) * 100, 2)

    return {
        "rows":        len(df),
        "n_columns":   len(df.columns),
        "missing":     missing,
        "missing_pct": missing_pct,
        "dtypes":      {col: str(dtype) for col, dtype in df.dtypes.items()},
    }
