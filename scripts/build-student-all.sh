#!/usr/bin/env bash

# ============================================================================
# BUILD ALL STUDENT APOSTILAS
# ============================================================================
# Generates student-edition PDFs for all bimesters (B0–B4).
#
# Usage:
#   ./scripts/build-student-all.sh          # build all (b0–b4)
#   ./scripts/build-student-all.sh b1 b3    # build only b1 and b3
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BOOKS=("b0" "b1" "b2" "b3" "b4")

# If arguments provided, use them as book list
if [ $# -gt 0 ]; then
    BOOKS=("$@")
fi

echo "============================================================"
echo "  INCLUIR ENGLISH WORKBOOK — STUDENT EDITION BUILD"
echo "============================================================"
echo ""
echo "Books to build: ${BOOKS[*]}"
echo ""

FAILED=()
SUCCEEDED=()

for book in "${BOOKS[@]}"; do
    chapters_dir="$PROJECT_ROOT/content/$book/chapters"

    if [ ! -d "$chapters_dir" ]; then
        echo "SKIP: $book (no chapters directory found)"
        continue
    fi

    chapter_count=$(ls "$chapters_dir"/chapter-*.html 2>/dev/null | wc -l | tr -d ' ')
    if [ "$chapter_count" -eq 0 ]; then
        echo "SKIP: $book (no chapter files found)"
        continue
    fi

    echo "------------------------------------------------------------"
    echo "Building ${book^^} student edition ($chapter_count chapters)..."
    echo "------------------------------------------------------------"

    if node "$SCRIPT_DIR/build-all.js" -b "$book" -v student; then
        SUCCEEDED+=("$book")
    else
        echo "FAILED: $book"
        FAILED+=("$book")
    fi

    echo ""
done

echo "============================================================"
echo "  BUILD SUMMARY"
echo "============================================================"

if [ ${#SUCCEEDED[@]} -gt 0 ]; then
    echo "Succeeded: ${SUCCEEDED[*]}"
    echo ""
    echo "Output files:"
    for book in "${SUCCEEDED[@]}"; do
        echo "  output/$book/workbook-$book-student.pdf"
    done
fi

if [ ${#FAILED[@]} -gt 0 ]; then
    echo ""
    echo "FAILED: ${FAILED[*]}"
    exit 1
fi

echo ""
echo "All done!"
