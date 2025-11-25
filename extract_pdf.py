import PyPDF2

# Read the PDF
pdf_path = r'PDFs/D100_Space_(Book_1) (1).pdf'
with open(pdf_path, 'rb') as file:
    reader = PyPDF2.PdfReader(file)
    total_pages = len(reader.pages)
    
    # Extract more pages (pages 1-50)
    full_text = ""
    for i in range(min(50, total_pages)):
        try:
            text = reader.pages[i].extract_text()
            full_text += f"\n--- PAGE {i+1} ---\n{text}\n"
        except Exception as e:
            full_text += f"\n--- PAGE {i+1} ---\nError: {e}\n"
    
    # Save to file for analysis
    with open('d100_space_content.txt', 'w', encoding='utf-8') as outfile:
        outfile.write(full_text)
    
    print(f"Extracted {min(50, total_pages)} pages to d100_space_content.txt")
