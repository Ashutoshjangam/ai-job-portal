"""
PDF Parser — extracts clean text from uploaded resume PDFs.
Uses PyMuPDF (fitz) which handles multi-column, tables, and fonts well.
"""

import fitz  # PyMuPDF
from pathlib import Path


def extract_text_from_pdf(file_path: str | Path) -> str:
    """
    Extract all text from a PDF file.

    Args:
        file_path: Path to the PDF file on disk.

    Returns:
        Cleaned plain-text string of the entire resume.

    Raises:
        FileNotFoundError: if the PDF does not exist.
        ValueError:        if the file isn't a valid PDF or has no text.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {path}")

    doc = fitz.open(str(path))
    if doc.page_count == 0:
        raise ValueError("PDF has no pages.")

    pages_text: list[str] = []
    for page in doc:
        text = page.get_text("text")  # plain text, preserves line breaks
        pages_text.append(text)

    doc.close()

    full_text = "\n\n".join(pages_text).strip()

    if not full_text:
        raise ValueError(
            "Could not extract any text from this PDF. "
            "It may be a scanned image — try a text-based PDF."
        )

    return full_text


def extract_text_from_bytes(pdf_bytes: bytes) -> str:
    """
    Extract text directly from PDF bytes (e.g. from an uploaded file in memory).

    Args:
        pdf_bytes: Raw bytes of the PDF file.

    Returns:
        Cleaned plain-text string.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if doc.page_count == 0:
        raise ValueError("PDF has no pages.")

    pages_text: list[str] = []
    for page in doc:
        text = page.get_text("text")
        pages_text.append(text)

    doc.close()

    full_text = "\n\n".join(pages_text).strip()
    if not full_text:
        raise ValueError(
            "Could not extract text from PDF bytes. "
            "The file may be image-based."
        )

    return full_text
