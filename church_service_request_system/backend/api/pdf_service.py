import os
from io import BytesIO
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def lock_pdf(input_path, output_path):
    """
    Simulates 'locking' a PDF by rewriting it and applying empty-password encryption
    that disallows modifications according to standard PDF permissions.
    """
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    # Basic permissions flag that disallows everything except printing/reading
    writer.encrypt("", "owner_secret_church_pwd", use_128bit=True)

    with open(output_path, "wb") as f:
        writer.write(f)
    return output_path

def add_signature_to_pdf(input_pdf_path, signature_image_path, output_pdf_path, x=100, y=100, width=150, height=50):
    """
    Appends a signature image to the last page of a PDF document at specific coordinates.
    """
    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    if os.path.exists(signature_image_path):
        c.drawImage(signature_image_path, x, y, width=width, height=height, mask='auto')
    c.save()
    packet.seek(0)
    
    new_pdf = PdfReader(packet)
    signature_page = new_pdf.pages[0]

    existing_pdf = PdfReader(input_pdf_path)
    output = PdfWriter()

    for i, page in enumerate(existing_pdf.pages):
        if i == len(existing_pdf.pages) - 1: # Add to bottom of last page
            page.merge_page(signature_page)
        output.add_page(page)

    with open(output_pdf_path, "wb") as outputStream:
        output.write(outputStream)

    return output_pdf_path
