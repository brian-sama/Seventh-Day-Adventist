import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from django.conf import settings
from datetime import datetime

def generate_ministry_request_pdf(mr):
    """
    Generates an official SDA Ministry Request letter as a PDF matching the letterhead design.
    """
    output_dir = os.path.join(settings.MEDIA_ROOT, 'requests', 'temp')
    os.makedirs(output_dir, exist_ok=True)
    prefix = "request" if mr.status == 'approved' else "rejection"
    filename = f"{prefix}_{mr.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    file_path = os.path.join(output_dir, filename)

    # Layout constants
    PAGE_WIDTH, PAGE_HEIGHT = A4
    SIDEBAR_WIDTH = 1.2 * inch
    RIGHT_MARGIN = SIDEBAR_WIDTH + 0.5 * inch
    LEFT_MARGIN = 0.75 * inch
    TOP_MARGIN = 1.0 * inch
    BOTTOM_MARGIN = 1.0 * inch

    def draw_letterhead(canv, doc):
        canv.saveState()
        
        # 1. Draw Sidebar (Blue background)
        canv.setFillColor(colors.HexColor('#4A77BD')) # Brand blue
        canv.rect(PAGE_WIDTH - SIDEBAR_WIDTH, 0, SIDEBAR_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
        
        # 2. Draw Logo in Sidebar
        logo_path = os.path.join(os.path.dirname(__file__), 'assets', 'logo.png')
        if os.path.exists(logo_path):
            try:
                canv.drawImage(logo_path, PAGE_WIDTH - SIDEBAR_WIDTH + 5, PAGE_HEIGHT - 1.5 * inch, 
                               width=SIDEBAR_WIDTH - 10, preserveAspectRatio=True, mask='auto')
            except: pass

        # 3. Draw Top Left Text (Conference)
        canv.setFont('Helvetica-Bold', 10)
        canv.setFillColor(colors.HexColor('#2E4A7D'))
        canv.drawString(LEFT_MARGIN, PAGE_HEIGHT - 1.1 * inch, "West Zimbabwe Conference of")
        canv.drawString(LEFT_MARGIN, PAGE_HEIGHT - 1.3 * inch, "Seventh-day Adventists")

        # 4. Draw Top Right Text (Local Church Address)
        canv.setFont('Helvetica-Bold', 11)
        canv.setFillColor(colors.black)
        addr_x = PAGE_WIDTH - RIGHT_MARGIN
        canv.drawRightString(addr_x, PAGE_HEIGHT - 0.8 * inch, "SDA Magwegwe West")
        canv.setFont('Helvetica', 9)
        canv.drawRightString(addr_x, PAGE_HEIGHT - 1.0 * inch, "Stand 5880 Magwegwe West")
        canv.drawRightString(addr_x, PAGE_HEIGHT - 1.15 * inch, "Corner Intemba & Nomadlozi Road")
        canv.drawRightString(addr_x, PAGE_HEIGHT - 1.3 * inch, "P.O. Box 2450")
        canv.drawRightString(addr_x, PAGE_HEIGHT - 1.45 * inch, "Bulawayo, Zimbabwe")
        
        # Contact details
        canv.setFont('Helvetica', 8)
        canv.drawRightString(addr_x, PAGE_HEIGHT - 1.8 * inch, "07.................... / 07....................")
        canv.drawRightString(addr_x, PAGE_HEIGHT - 2.0 * inch, "magwegwewestsda@gmail.com")

        canv.restoreState()

    doc = SimpleDocTemplate(
        file_path, 
        pagesize=A4, 
        rightMargin=RIGHT_MARGIN, 
        leftMargin=LEFT_MARGIN, 
        topMargin=2.2 * inch, # Start below the headers
        bottomMargin=BOTTOM_MARGIN
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    body_style = ParagraphStyle(
        'BodyStyle', parent=styles['Normal'], fontSize=11, leading=14, spaceAfter=12
    )
    bold_style = ParagraphStyle(
        'BoldStyle', parent=body_style, fontName='Helvetica-Bold'
    )
    
    story = []

    # 1. Date
    story.append(Paragraph(f"Date: {datetime.now().strftime('%d %B %Y')}", body_style))
    story.append(Spacer(1, 0.2 * inch))

    # 2. Recipient
    story.append(Paragraph("To the Church Clerk", body_style))
    story.append(Paragraph(f"SDA Church", bold_style))
    story.append(Paragraph("..........................................", body_style))
    story.append(Paragraph(f"{mr.receiving_location or 'Bulawayo'}", body_style))
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("Dear Sir/Madam,", body_style))
    story.append(Spacer(1, 0.1 * inch))

    # 3. Subject Line
    if mr.status == 'approved':
        subject = f"<b><u>Re: Service Request: {mr.request_type.upper()}</u></b>"
    else:
        subject = f"<b><u>Re: REJECTION: Service Request for {mr.invited_name}</u></b>"
    
    story.append(Paragraph(subject, body_style))
    story.append(Spacer(1, 0.2 * inch))

    # 4. Body Text
    if mr.status == 'approved':
        story.append(Paragraph("Greetings in the name of our soon coming Lord Jesus Christ.", body_style))
        text = (
            f"We are kindly requesting the services of: <b>{mr.invited_name}</b> to grace us on our "
            f"<b>{mr.event_type}</b> on the <b>{mr.event_date.strftime('%d %B %Y')}</b>."
        )
        story.append(Paragraph(text, body_style))
        story.append(Paragraph("We look forward to your positive response.", body_style))
    else:
        story.append(Paragraph(
            f"We regret to inform you that the request for <b>{mr.invited_name}</b> to serve as "
            f"<b>{mr.event_type}</b> on <b>{mr.event_date.strftime('%d %B %Y')}</b> has been declined.", body_style
        ))
        story.append(Paragraph(f"<b>Reason:</b> {mr.rejection_reason or 'No reason provided.'}", body_style))
        story.append(Paragraph("We apologize for any inconvenience caused.", body_style))

    story.append(Paragraph("For more information please do not hesitate to contact any of our clerks. May the good Lord bless you as you continue to labour in His vineyard.", body_style))
    story.append(Spacer(1, 0.2 * inch))
    
    story.append(Paragraph("Yours in Christ", body_style))
    story.append(Spacer(1, 0.4 * inch))

    # 5. Signatories Table (3 columns)
    # Get Signatures
    elder_sig = mr.signatures.filter(role='elder').first()
    pastor_sig = mr.signatures.filter(role='pastor').first()
    
    # Signature Images
    elder_img = "............................"
    clerk_img = f"<i>{mr.clerk_name}</i>"
    pastor_img = "............................"

    if elder_sig and elder_sig.signature_image and os.path.exists(elder_sig.signature_image.path):
        try: elder_img = Image(elder_sig.signature_image.path, 1.2*inch, 0.5*inch)
        except: pass
    
    if pastor_sig and pastor_sig.signature_image and os.path.exists(pastor_sig.signature_image.path):
        try: pastor_img = Image(pastor_sig.signature_image.path, 1.2*inch, 0.5*inch)
        except: pass

    sig_data = [
        ["(Head Elder)", "(Clerk)", "(District Pastor)"],
        [f"Mr. {mr.elder_name or '....................'}", f"....................", f"Mr/Dr. {mr.pastor_name or '....................'}"],
        ["Sign: ", "Sign: ", "Sign: "],
        [elder_img, clerk_img, pastor_img],
        ["Contact: ..................", "Contact: ..................", "Contact: .................."]
    ]

    sig_table = Table(sig_data, colWidths=[2.1*inch, 1.8*inch, 2.1*inch])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(sig_table)

    # 6. Verification Footer
    story.append(Spacer(1, 0.3 * inch))
    verif_style = ParagraphStyle('Verif', fontSize=7, textColor=colors.grey, alignment=1)
    story.append(Paragraph(f"Verification: {mr.verification_uuid} | Electronically Generated", verif_style))

    # Build PDF
    doc.build(story, onFirstPage=draw_letterhead, onLaterPages=draw_letterhead)
    return file_path
