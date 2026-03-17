import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.units import inch
from django.conf import settings
from datetime import datetime

def generate_ministry_request_pdf(mr):
    """
    Generates an official SDA Ministry Request letter as a PDF.
    """
    output_dir = os.path.join(settings.MEDIA_ROOT, 'requests', 'temp')
    os.makedirs(output_dir, exist_ok=True)
    filename = f"request_{mr.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    file_path = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=14,
        leading=16,
        alignment=1, # Center
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    sub_header_style = ParagraphStyle(
        'SubHeaderStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        alignment=1, # Center
        spaceAfter=20
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        alignment=0, # Left
        spaceAfter=12
    )

    story = []

    # 1. Header (Letterhead)
    # Note: If there's an actual logo, we'd add it here.
    story.append(Paragraph("MAGWEGWE WEST SEVENTH-DAY ADVENTIST CHURCH", header_style))
    story.append(Paragraph("P.O. Box 1234, Magwegwe, Bulawayo, Zimbabwe", sub_header_style))
    story.append(Spacer(1, 0.2 * inch))

    # 2. Date and Recipient
    story.append(Paragraph(f"Date: {datetime.now().strftime('%d %B %Y')}", body_style))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(f"To: The Church Clerk", body_style))
    story.append(Paragraph(f"{mr.receiving_church}", body_style))
    story.append(Paragraph(f"{mr.receiving_location}", body_style))
    story.append(Spacer(1, 0.3 * inch))

    # 3. Reference Line
    story.append(Paragraph(f"<b>RE: REQUEST FOR {mr.request_type.upper()} SERVICES</b>", body_style))
    story.append(Spacer(1, 0.2 * inch))

    # 4. Salutation and Body
    story.append(Paragraph("Dear Brethren,", body_style))
    
    text = (
        f"The Magwegwe West Seventh-day Adventist Church hereby requests the services of "
        f"<b>{mr.invited_name}</b> from your church (<b>{mr.invited_church}</b>) to lead in a "
        f"<b>{mr.event_type}</b> scheduled for <b>{mr.event_date.strftime('%d %B %Y')}</b>."
    )
    story.append(Paragraph(text, body_style))
    
    story.append(Paragraph(
        "We trust that this request will meet your favorable consideration and we look forward "
        "to a blessed fellowship together in the service of our Lord.", body_style
    ))
    story.append(Spacer(1, 0.4 * inch))

    # 5. Signatories Table
    # Row 1: Titles
    # Row 2: Signatures/Stamps
    # Row 3: Names
    sig_data = [
        ["________________________", "________________________", "________________________"],
        ["Church Clerk", "Head Elder", "District Pastor"],
        [f"{mr.clerk_name}", f"{mr.elder_name}", f"Pastor {mr.pastor.get_full_name() if mr.pastor else ''}"]
    ]

    # Handle Images (Signatures/Stamps)
    stamp_img = None
    elder_sig_img = None
    
    # Signatures are in Signature model linked to mr
    pastor_sig = mr.signatures.filter(role='pastor').first()
    elder_sig = mr.signatures.filter(role='elder').first()
    
    if pastor_sig and pastor_sig.signature_image:
        try:
            stamp_img = Image(pastor_sig.signature_image.path, 1.2*inch, 0.6*inch)
        except: pass
    if elder_sig and elder_sig.signature_image:
        try:
            elder_sig_img = Image(elder_sig.signature_image.path, 1.0*inch, 0.4*inch)
        except: pass

    # If we have images, replace the underscore row with images + underline
    if stamp_img or elder_sig_img:
        sig_data[0] = [
            Paragraph(f"<i>{mr.clerk_name}</i>", body_style), # Clerk just types name for now
            elder_sig_img or "________________________",
            stamp_img or "________________________"
        ]

    table = Table(sig_data, colWidths=[2*inch, 2*inch, 2*inch])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    story.append(table)

    # 6. Verification Footer (UUID/QR placeholder)
    story.append(Spacer(1, 0.5 * inch))
    verif_style = ParagraphStyle('Verif', parent=styles['Normal'], fontSize=8, alignment=1, textColor=colors.grey)
    story.append(Paragraph(f"Verification Code: {mr.verification_uuid}", verif_style))
    story.append(Paragraph(f"This document was electronically generated and signed.", verif_style))

    # Build PDF
    doc.build(story)
    return file_path
