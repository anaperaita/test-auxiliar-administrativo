# PDF Question Extraction Tool

Automated tool to extract questions from PDF test files and convert them to JSON format for the Quiz application.

## 📋 Requirements

- Python 3.7+
- pdfplumber library

## 🚀 Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

## 📖 Usage

### Extract Single Tema

```bash
# Extract only Tema 1
python extract_pdfs.py --tema 1

# Extract Tema 5
python extract_pdfs.py --tema 5
```

### Extract All Temas

```bash
# Extract all temas found in the Test directory
python extract_pdfs.py --all
```

### Dry Run (Preview Only)

```bash
# Preview what would be extracted without saving
python extract_pdfs.py --tema 1 --dry-run
```

### Custom Output Directory

```bash
# Save to a different directory
python extract_pdfs.py --tema 1 --output /path/to/output
```

## 📁 Directory Structure

The script expects this structure:

```
TestAuxiliarAdministrativo/
├── Test/
│   ├── Tema 1/
│   │   ├── Test 1. Repaso CE..pdf
│   │   ├── Test 2. Repaso CE..pdf
│   │   └── ... (more PDFs)
│   ├── Tema 2/
│   │   └── ... (PDFs)
│   └── ... (more temas)
├── quiz/
│   └── src/
│       └── data/
│           ├── tema1.json  ← Generated
│           ├── tema2.json  ← Generated
│           └── modules.config.json  ← Updated
└── extract_pdfs.py
```

## 🎯 What It Does

1. **Scans PDF files** in the specified Tema directory
2. **Extracts questions** with their options (a, b, c, d)
3. **Finds answer keys** (patterns like "01.d 02.b 03.a")
4. **Determines superblock/subblock** based on PDF filename:
   - "Repaso CE" → Superblock: "Repaso General CE"
   - "Título I" → Superblock: "Título I: Derechos y Deberes Fundamentales"
   - "Título IV" → Superblock: "Título IV: Gobierno y Administración"
   - etc.
5. **Generates JSON** files in the format required by the Quiz app
6. **Updates modules.config.json** with the new temas

## 📝 Output Format

Generated JSON files follow this structure:

```json
{
  "module": "Tema 1",
  "title": "Constitución Española",
  "totalQuestions": 470,
  "questions": [
    {
      "id": "t1-1",
      "superblock": "Repaso General CE",
      "subblock": "Repaso CE - Test 1",
      "question": "El referéndum:",
      "options": [
        "Opción A",
        "Opción B",
        "Opción C",
        "Opción D"
      ],
      "correctAnswer": 3,
      "explanation": "Consulta el material de estudio para más detalles."
    }
  ]
}
```

## ⚠️ Important Notes

### Answer Key Detection

The script looks for answer keys in these formats:
- `01.d 02.b 03.a`
- `01: d 02: b 03: a`
- `1.a 2.b 3.c`

Answer letters are converted to indices:
- `a` → `0` (first option)
- `b` → `1` (second option)
- `c` → `2` (third option)
- `d` → `3` (fourth option)

### Superblock Detection

The script automatically determines superblocks based on PDF filenames:

| Filename Pattern | Superblock |
|-----------------|------------|
| "Repaso" | Repaso General CE |
| "Preliminar" | Título Preliminar |
| "Titulo I" or "Título I" | Título I: Derechos y Deberes Fundamentales |
| "Titulo IV" or "TitIV" | Título IV: Gobierno y Administración |
| "Titulo VIII" or "TitVIII" | Título VIII: Organización Territorial del Estado |
| "Titulo IX" | Título IX: Tribunal Constitucional |
| "Titulo X" | Título X: Reforma Constitucional |
| "Estabilización" | Preguntas de Estabilización |

## 🔧 Troubleshooting

### "Could not extract text from PDF"
- The PDF might be scanned images rather than text
- Try using OCR tools first to convert to text-based PDF

### "Could not find answer key"
- Check if the PDF contains an answer key section
- The answer key should be in format: `01.a 02.b 03.c`
- You may need to manually add answers to the JSON file

### "Could not extract questions"
- Questions should be numbered: `01.`, `1.`, etc.
- Options should be labeled: `a.`, `b.`, `c.`, `d.`
- Check PDF formatting

### Missing Options
- If a question has fewer than 4 options, placeholders are added
- Review and manually correct these in the JSON file

## 🎨 Customization

### Modify Superblock Names

Edit the `determine_superblock_subblock()` method in `extract_pdfs.py`:

```python
def determine_superblock_subblock(self, pdf_name: str, tema_num: int):
    # Add your custom patterns here
    if 'your_pattern' in pdf_name.lower():
        return "Your Superblock", "Your Subblock"
```

### Change Module Titles

After extraction, edit the generated JSON files:

```json
{
  "module": "Tema 1",
  "title": "Your Custom Title Here",
  ...
}
```

## 📊 Example Output

```
Processing Tema 1: Test/Tema 1
============================================================
Found 44 PDF files

Processing: Test 1. Repaso CE..pdf
  ✓ Extracted 20 questions
Processing: Test 2. Repaso CE..pdf
  ✓ Extracted 20 questions
...

============================================================
Tema 1 Summary:
  Total Questions: 470
  PDFs Processed: 44
============================================================

✓ Saved to: quiz/src/data/tema1.json
✓ Updated modules.config.json with 1 temas

============================================================
✓ Extraction Complete!
============================================================
```

## 🤝 Contributing

If you find issues with question extraction:
1. Check the PDF format
2. Review the extraction patterns in the script
3. Manually correct the JSON output as needed

## 📄 License

This tool is part of the Test Auxiliar Administrativo project.
