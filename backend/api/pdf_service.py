import os
import platform
import subprocess
import qrcode
from io import BytesIO
from datetime import date
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from PIL import Image

def convert_docx_to_pdf(docx_path, pdf_path):
    """
    Converts a .docx file to .pdf.
    Uses docx2pdf on Windows (requires Word) and LibreOffice on Linux (headless).
    """
    if platform.system() == "Windows":
        try:
            # We only import docx2pdf on Windows as it requires MS Word
            from docx2pdf import convert
            convert(docx_path, pdf_path)
            return pdf_path
        except ImportError:
             print("WARNING: 'docx2pdf' not installed. Conversion skipped on Windows.")
             return None
        except Exception as e:
            import traceback
            print(f"Windows DOCX to PDF conversion failed: {str(e)}")
            traceback.print_exc()
            return None
        # Linux / Production (Contabo VPS)
        import tempfile
        import shutil
        
        # Check if libreoffice is even installed
        if not shutil.which('libreoffice'):
            print("CRITICAL: 'libreoffice' command not found in PATH. Is it installed on the VPS?")
            return None

        try:
            # LibreOffice command for headless conversion
            output_dir = os.path.dirname(pdf_path)
            
            # Using a truly unique, ephemeral user profile for every conversion
            # ensures we avoid permission and locking issues on the VPS.
            with tempfile.TemporaryDirectory(prefix="libreoffice_profile_") as user_profile:
                print(f"DEBUG: Starting conversion for {docx_path} using profile {user_profile}")
                
                # Check if input file exists and is readable
                if not os.path.exists(docx_path):
                    print(f"CRITICAL: DOCX file not found at {docx_path}")
                    return None

                result = subprocess.run([
                    'libreoffice',
                    f'-env:UserInstallation=file://{user_profile}',
                    '--headless', '--convert-to', 'pdf',
                    '--outdir', output_dir, docx_path
                ], check=True, capture_output=True)
                
                # LibreOffice names the file based on the input name (changes extension to .pdf)
                name_without_ext = os.path.splitext(os.path.basename(docx_path))[0]
                generated_pdf = os.path.join(output_dir, name_without_ext + ".pdf")
                
                if generated_pdf != pdf_path and os.path.exists(generated_pdf):
                    if os.path.exists(pdf_path):
                        os.remove(pdf_path)
                    os.rename(generated_pdf, pdf_path)
                    
                if not os.path.exists(pdf_path):
                    print(f"CRITICAL: LibreOffice conversion finished but {pdf_path} was not found.")
                    return None

                print(f"DEBUG: Conversion successful. PDF at {pdf_path}")
                return pdf_path
        except subprocess.CalledProcessError as e:
            print(f"CRITICAL: LibreOffice conversion failed (Exit {e.returncode})")
            print(f"STDOUT: {e.stdout.decode() if e.stdout else 'None'}")
            print(f"STDERR: {e.stderr.decode() if e.stderr else 'None'}")
            return None
        except Exception as e:
            import traceback
            print(f"CRITICAL: Linux DOCX to PDF conversion failed: {str(e)}")
            traceback.print_exc()
            return None

def apply_clerk_stamp(input_pdf_path, output_pdf_path):
    """
    Draws a small (120x60) official Magwegwe West SDA Church verification stamp
    at the bottom-right of the FINAL page of the PDF.
    """
    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    page_width, page_height = letter

    today = date.today().strftime("%d %B %Y")

    # Stamp dimensions (as requested: 120px x 60px)
    stamp_w = 120
    stamp_h = 60
    stamp_right_margin = 40
    stamp_bottom_margin = 40
    
    stamp_x = page_width - stamp_w - stamp_right_margin
    stamp_y = stamp_bottom_margin

    # Official SDA Blue/Gold feel or sharp Black/Blue
    stamp_color = colors.HexColor("#1e3a8a") # Deep SDA Blue

    # Border
    c.setStrokeColor(stamp_color)
    c.setLineWidth(1.5)
    c.rect(stamp_x, stamp_y, stamp_w, stamp_h)

    # Text Content
    c.setFillColor(stamp_color)
    c.setFont("Helvetica-Bold", 6.5)
    
    # 3-line text as requested
    c.drawCentredString(stamp_x + (stamp_w/2), stamp_y + 48, "MAGWEGWE WEST SEVENTH")
    c.drawCentredString(stamp_x + (stamp_w/2), stamp_y + 38, "DAY ADVENTIST CHURCH")
    c.drawCentredString(stamp_x + (stamp_w/2), stamp_y + 28, "P.O. BOX 2450, BULAWAYO")
    
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(stamp_x + (stamp_w/2), stamp_y + 12, f"DATE: {today}")

    c.save()
    packet.seek(0)

    stamp_pdf = PdfReader(packet)
    stamp_page = stamp_pdf.pages[0]

    existing_pdf = PdfReader(input_pdf_path)
    output = PdfWriter()

    last_page_idx = len(existing_pdf.pages) - 1
    for i, page in enumerate(existing_pdf.pages):
        if i == last_page_idx:
            page.merge_page(stamp_page)
        output.add_page(page)

    # Safe write: Use a temporary file then rename
    temp_path = output_pdf_path + ".tmp"
    with open(temp_path, "wb") as f:
        output.write(f)
    
    if os.path.exists(output_pdf_path):
        os.remove(output_pdf_path)
    os.rename(temp_path, output_pdf_path)

    return output_pdf_path

def add_qr_verification(input_pdf_path, output_pdf_path, verify_url):
    """
    Generates a QR code for verification and embeds it next to the stamp.
    """
    # Generate QR
    qr = qrcode.QRCode(box_size=2, border=1)
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    qr_bytes = BytesIO()
    qr_img.save(qr_bytes, format='PNG')
    qr_bytes.seek(0)

    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    page_width, page_height = letter

    # Placement: Left of the stamp
    qr_size = 50
    # Match stamp Y
    c.drawImage(Image.open(qr_bytes), page_width - 120 - 40 - qr_size - 10, 40, width=qr_size, height=qr_size)
    c.setFont("Helvetica-Bold", 5)
    c.drawCentredString(page_width - 120 - 40 - (qr_size/2) - 10, 35, "VERIFY DOCUMENT")
    
    c.save()
    packet.seek(0)

    qr_pdf = PdfReader(packet)
    existing_pdf = PdfReader(input_pdf_path)
    output = PdfWriter()

    for i, page in enumerate(existing_pdf.pages):
        if i == len(existing_pdf.pages) - 1:
            page.merge_page(qr_pdf.pages[0])
        output.add_page(page)

    # Safe write: Use a temporary file then rename
    temp_path = output_pdf_path + ".tmp"
    with open(temp_path, "wb") as f:
        output.write(f)
    
    if os.path.exists(output_pdf_path):
        os.remove(output_pdf_path)
    os.rename(temp_path, output_pdf_path)

    return output_pdf_path

def add_signature_to_pdf(input_pdf_path, signature_image_path, output_pdf_path, x=100, y=100, width=120, height=40):
    """
    Overlay signature on the last page.
    """
    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    if signature_image_path and os.path.exists(signature_image_path):
        c.drawImage(signature_image_path, x, y, width=width, height=height, mask='auto')
    else:
        # Placeholder signature text
        c.setStrokeColor(colors.gray)
        c.setLineWidth(0.5)
        c.setDash(2, 2)
        c.rect(x, y, width, height)
        c.setFillColor(colors.red)
        c.setFont("Helvetica-BoldOblique", 8)
        c.drawCentredString(x + (width/2), y + (height/2) - 4, "DIGITALLY SIGNED")
        c.setFont("Helvetica", 6)
        c.drawCentredString(x + (width/2), y + 6, "- Placeholder -")
    c.save()
    packet.seek(0)
    
    new_pdf = PdfReader(packet)
    existing_pdf = PdfReader(input_pdf_path)
    output = PdfWriter()

    for i, page in enumerate(existing_pdf.pages):
        if i == len(existing_pdf.pages) - 1:
            page.merge_page(new_pdf.pages[0])
        output.add_page(page)

    # Safe write: Use a temporary file then rename
    temp_path = output_pdf_path + ".tmp"
    with open(temp_path, "wb") as f:
        output.write(f)
    
    if os.path.exists(output_pdf_path):
        os.remove(output_pdf_path)
    os.rename(temp_path, output_pdf_path)

    return output_pdf_path

def lock_pdf(input_path, output_path):
    """
    Encrypt PDF to restrict editing.
    """
    reader = PdfReader(input_path)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    # Password-free read, but locked for edit
    writer.encrypt("", "SDA_SECURE_777", use_128bit=True)
    
    # Safe write: Use a temporary file then rename
    temp_path = output_path + ".tmp"
    with open(temp_path, "wb") as f:
        writer.write(f)
    
    if os.path.exists(output_path):
        os.remove(output_path)
    os.rename(temp_path, output_path)

    return output_path
