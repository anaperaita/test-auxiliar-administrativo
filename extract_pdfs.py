#!/usr/bin/env python3
"""
PDF Question Extractor for Test Auxiliar Administrativo

This script extracts questions from PDF test files and converts them to JSON format
for use with the Quiz application.

Requirements:
    pip install PyPDF2 pdfplumber

Usage:
    python extract_pdfs.py --tema 1                    # Extract only Tema 1
    python extract_pdfs.py --all                       # Extract all temas
    python extract_pdfs.py --tema 1 --dry-run         # Preview without saving
"""

import os
import re
import json
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Optional

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber not installed. Install with: pip install pdfplumber")
    exit(1)


class PDFQuestionExtractor:
    """Extracts questions from PDF files and converts to JSON format"""

    def __init__(self, base_dir: str = "Test"):
        self.base_dir = Path(base_dir)
        self.questions = []
        self.question_counter = 1

    def extract_text_from_pdf(self, pdf_path: Path) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error reading {pdf_path}: {e}")
        return text

    def parse_answer_key(self, text: str) -> Dict[int, int]:
        """
        Parse answer key from text like: "01.d 02.b 03.a"
        Returns dict mapping question number to answer index (0-3)
        """
        answer_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3}
        answers = {}

        # Look for answer key patterns
        # Pattern 1: "01.d 02.b 03.a" or "01.a 02.b 03.c"
        pattern1 = r'(\d{2})\s*[\.:\-]\s*([a-d])'
        matches = re.findall(pattern1, text.lower())

        for num_str, letter in matches:
            num = int(num_str)
            answers[num] = answer_map.get(letter, 0)

        return answers

    def extract_questions_from_text(self, text: str, pdf_name: str) -> List[Dict]:
        """Extract individual questions from PDF text"""
        questions = []

        # Split text into sections
        lines = text.split('\n')
        current_question = None
        current_options = []
        question_text = ""

        # Pattern to match question numbers: "01.", "1.", etc.
        question_pattern = r'^(\d{1,2})\s*[\.\-:]?\s*(.+)$'
        # Pattern to match options: "a.", "a)", "a-", etc.
        option_pattern = r'^\s*([a-d])\s*[\.\)\-:]\s*(.+)$'

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check if this is a new question
            q_match = re.match(question_pattern, line)
            if q_match:
                # Save previous question if exists
                if current_question and current_options:
                    questions.append({
                        'number': current_question,
                        'text': question_text.strip(),
                        'options': current_options
                    })

                current_question = int(q_match.group(1))
                question_text = q_match.group(2).strip()
                current_options = []
                continue

            # Check if this is an option
            o_match = re.match(option_pattern, line.lower())
            if o_match and current_question:
                option_text = o_match.group(2).strip()
                current_options.append(option_text)
                continue

            # Otherwise, append to current question text or option
            if current_question and not current_options:
                # Still part of question text
                question_text += " " + line
            elif current_options:
                # Part of last option
                current_options[-1] += " " + line

        # Add last question
        if current_question and current_options:
            questions.append({
                'number': current_question,
                'text': question_text.strip(),
                'options': current_options
            })

        return questions

    def determine_superblock_subblock(self, pdf_name: str, tema_num: int) -> Tuple[str, str]:
        """Determine superblock and subblock from PDF filename"""
        name_lower = pdf_name.lower()

        # Repaso patterns
        if 'repaso' in name_lower:
            test_match = re.search(r'test\s*(\d+)', name_lower)
            test_num = test_match.group(1) if test_match else "1"
            return "Repaso General CE", f"Repaso CE - Test {test_num}"

        # Título Preliminar
        if 'preliminar' in name_lower or 'tit preliminar' in name_lower:
            test_match = re.search(r'test\s*(\d+)', name_lower)
            test_num = test_match.group(1) if test_match else "Principal"
            return "Título Preliminar", f"Título Preliminar - Test {test_num}"

        # Título I
        if 'titulo i' in name_lower or 'título i' in name_lower:
            test_match = re.search(r'test\s*(\d+)', name_lower)
            test_num = test_match.group(1) if test_match else "Principal"
            return "Título I: Derechos y Deberes Fundamentales", f"Título I - Test {test_num}"

        # Título IV
        if 'titulo iv' in name_lower or 'título iv' in name_lower or 'titiv' in name_lower:
            test_match = re.search(r'test\s*(\d+)', name_lower)
            test_num = test_match.group(1) if test_match else "Principal"
            return "Título IV: Gobierno y Administración", f"Título IV - Test {test_num}"

        # Título VIII
        if 'titulo viii' in name_lower or 'título viii' in name_lower or 'titviii' in name_lower:
            test_match = re.search(r'test\s*(\d+)', name_lower)
            test_num = test_match.group(1) if test_match else "Principal"
            return "Título VIII: Organización Territorial del Estado", f"Título VIII - Test {test_num}"

        # Título IX
        if 'titulo ix' in name_lower or 'título ix' in name_lower:
            return "Título IX: Tribunal Constitucional", "Título IX - Tribunal Constitucional"

        # Título X
        if 'titulo x' in name_lower or 'título x' in name_lower:
            return "Título X: Reforma Constitucional", "Título X - Reforma Constitucional"

        # Estabilización
        if 'estabilizacion' in name_lower or 'estabilización' in name_lower:
            set_match = re.search(r'\((\d+)\)', name_lower)
            set_num = set_match.group(1) if set_match else "1"
            return "Preguntas de Estabilización", f"Preguntas Estabilización - Set {set_num}"

        # Default: use filename
        return f"Tema {tema_num}", pdf_name.replace('.pdf', '')

    def process_pdf(self, pdf_path: Path, tema_num: int) -> List[Dict]:
        """Process a single PDF file and extract questions"""
        print(f"Processing: {pdf_path.name}")

        # Extract text
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            print(f"  Warning: Could not extract text from {pdf_path.name}")
            return []

        # Parse answer key
        answers = self.parse_answer_key(text)
        if not answers:
            print(f"  Warning: Could not find answer key in {pdf_path.name}")

        # Extract questions
        raw_questions = self.extract_questions_from_text(text, pdf_path.name)
        if not raw_questions:
            print(f"  Warning: Could not extract questions from {pdf_path.name}")
            return []

        # Determine blocks
        superblock, subblock = self.determine_superblock_subblock(pdf_path.name, tema_num)

        # Format questions
        formatted_questions = []
        for q in raw_questions:
            # Ensure we have 4 options
            while len(q['options']) < 4:
                q['options'].append("[Opción no disponible]")

            question_data = {
                'id': f't{tema_num}-{self.question_counter}',
                'superblock': superblock,
                'subblock': subblock,
                'question': q['text'],
                'options': q['options'][:4],  # Only take first 4 options
                'correctAnswer': answers.get(q['number'], 0),  # Default to 0 if not found
                'explanation': 'Consulta el material de estudio para más detalles.'
            }
            formatted_questions.append(question_data)
            self.question_counter += 1

        print(f"  ✓ Extracted {len(formatted_questions)} questions")
        return formatted_questions

    def process_tema(self, tema_num: int) -> Dict:
        """Process all PDFs in a Tema directory"""
        tema_dir = self.base_dir / f"Tema {tema_num}"

        if not tema_dir.exists():
            # Try with lowercase
            tema_dir = self.base_dir / f"tema {tema_num}"
            if not tema_dir.exists():
                print(f"Error: Tema {tema_num} directory not found")
                return None

        print(f"\n{'='*60}")
        print(f"Processing Tema {tema_num}: {tema_dir}")
        print(f"{'='*60}")

        # Reset question counter for each tema
        self.question_counter = 1
        self.questions = []

        # Get all PDF files
        pdf_files = sorted(tema_dir.glob("*.pdf"))
        if not pdf_files:
            print(f"No PDF files found in {tema_dir}")
            return None

        print(f"Found {len(pdf_files)} PDF files\n")

        # Process each PDF
        for pdf_file in pdf_files:
            questions = self.process_pdf(pdf_file, tema_num)
            self.questions.extend(questions)

        # Create tema JSON structure
        tema_data = {
            'module': f'Tema {tema_num}',
            'title': f'Tema {tema_num}',  # You can customize this
            'totalQuestions': len(self.questions),
            'questions': self.questions
        }

        print(f"\n{'='*60}")
        print(f"Tema {tema_num} Summary:")
        print(f"  Total Questions: {len(self.questions)}")
        print(f"  PDFs Processed: {len(pdf_files)}")
        print(f"{'='*60}\n")

        return tema_data

    def save_tema_json(self, tema_num: int, tema_data: Dict, output_dir: str = "quiz/src/data"):
        """Save tema data to JSON file"""
        output_path = Path(output_dir) / f"tema{tema_num}.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(tema_data, f, ensure_ascii=False, indent=2)

        print(f"✓ Saved to: {output_path}")

    def update_modules_config(self, tema_nums: List[int], output_dir: str = "quiz/src/data"):
        """Update modules.config.json with new temas"""
        config_path = Path(output_dir) / "modules.config.json"

        modules = []
        for tema_num in sorted(tema_nums):
            modules.append({
                'id': f'tema{tema_num}',
                'name': f'Tema {tema_num}',  # Customize as needed
                'file': f'tema{tema_num}.json'
            })

        config_data = {'modules': modules}

        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, ensure_ascii=False, indent=2)

        print(f"✓ Updated modules.config.json with {len(modules)} temas")


def main():
    parser = argparse.ArgumentParser(
        description='Extract questions from PDF test files',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--tema', type=int, help='Extract specific tema number (e.g., 1)')
    parser.add_argument('--all', action='store_true', help='Extract all temas')
    parser.add_argument('--dry-run', action='store_true', help='Preview without saving')
    parser.add_argument('--output', default='quiz/src/data', help='Output directory')

    args = parser.parse_args()

    if not args.tema and not args.all:
        parser.print_help()
        return

    extractor = PDFQuestionExtractor()

    # Determine which temas to process
    if args.all:
        # Find all Tema directories
        test_dir = Path("Test")
        tema_dirs = sorted([d for d in test_dir.iterdir() if d.is_dir() and 'tema' in d.name.lower()])
        tema_nums = []
        for d in tema_dirs:
            match = re.search(r'tema\s*(\d+)', d.name.lower())
            if match:
                tema_nums.append(int(match.group(1)))
        tema_nums = sorted(set(tema_nums))
    else:
        tema_nums = [args.tema]

    print(f"\nProcessing {len(tema_nums)} tema(s): {tema_nums}\n")

    processed_temas = []
    for tema_num in tema_nums:
        tema_data = extractor.process_tema(tema_num)

        if tema_data and not args.dry_run:
            extractor.save_tema_json(tema_num, tema_data, args.output)
            processed_temas.append(tema_num)

    # Update modules config
    if processed_temas and not args.dry_run:
        extractor.update_modules_config(processed_temas, args.output)

    print("\n" + "="*60)
    print("✓ Extraction Complete!")
    print("="*60)


if __name__ == '__main__':
    main()
