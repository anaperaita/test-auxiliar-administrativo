# 🚀 Quick Start Guide - PDF Extraction

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `pdfplumber` - For reading PDF files
- `PyPDF2` - PDF processing library

## Step 2: Extract Questions

### Option A: Extract Single Tema (Recommended for Testing)

```bash
# Extract Tema 1 only
python3 extract_pdfs.py --tema 1
```

### Option B: Extract All Temas (26+ temas)

```bash
# Extract all temas at once (may take 10-30 minutes)
python3 extract_pdfs.py --all
```

### Option C: Dry Run (Preview First)

```bash
# See what would be extracted without saving
python3 extract_pdfs.py --tema 1 --dry-run
```

## Step 3: Run the Quiz App

```bash
cd quiz
npm run dev
```

Then open http://localhost:5173

## 📊 Expected Output

When you run the extraction, you'll see:

```
============================================================
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
✓ Updated modules.config.json
```

## ⚠️ Common Issues & Solutions

### Issue: "pdfplumber not installed"
**Solution:**
```bash
pip install pdfplumber
```

### Issue: "Could not extract text from PDF"
**Cause:** PDF might be scanned images, not text

**Solution:** These PDFs need OCR (Optical Character Recognition)
```bash
# Install tesseract and pytesseract for OCR
sudo apt-get install tesseract-ocr  # Linux
brew install tesseract              # macOS

pip install pytesseract pdf2image
```

### Issue: "Could not find answer key"
**Cause:** Answer key format not recognized

**Solutions:**
1. Check if answer key exists in PDF (usually last page)
2. Format should be: `01.a 02.b 03.c 04.d`
3. Manually add correct answers to JSON file later

### Issue: Questions not extracted correctly
**Cause:** PDF formatting issues

**Solution:**
1. Try the dry-run first: `python3 extract_pdfs.py --tema 1 --dry-run`
2. Manually review and fix the generated JSON
3. Questions should be numbered (01., 02., etc.)
4. Options should be lettered (a., b., c., d.)

## 🔧 Manual JSON Editing

If extraction isn't perfect, you can manually edit the JSON files:

```bash
# Edit generated file
code quiz/src/data/tema1.json
# or
nano quiz/src/data/tema1.json
```

## 📁 Generated Files

After extraction:
- `quiz/src/data/tema1.json` - Questions for Tema 1
- `quiz/src/data/tema2.json` - Questions for Tema 2
- etc.
- `quiz/src/data/modules.config.json` - Updated module list

## 🎯 Next Steps

1. **Test the app** with extracted questions
2. **Review accuracy** - spot check some questions
3. **Fix any issues** in the JSON files
4. **Extract more temas** as needed
5. **Deploy** when ready!

## 💡 Pro Tips

- **Start with one tema** to test the extraction quality
- **Review the dry-run** output before committing
- **Keep backups** of manually edited JSON files
- **Extract in batches** if you have many temas

## 📞 Need Help?

Check the detailed documentation in `EXTRACTION_README.md`
