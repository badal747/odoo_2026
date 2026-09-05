import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.models import Payslip, Employee, Contract, RuleCategory

def generate_payslip_pdf(payslip: Payslip, employee: Employee, contract: Contract) -> io.BytesIO:
    """
    Generates a high-quality, corporate-grade PDF payslip.
    Returns an in-memory BytesIO buffer ready for HTTP response or email attachment.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#714B67'), # Odoo Brand Purple
        alignment=0 # Left
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#6B7280')
    )

    header_bold = ParagraphStyle(
        'HeaderBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#111827')
    )

    cell_style = ParagraphStyle(
        'CellRegular',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#374151')
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#111827')
    )

    # 1. Company Brand Header
    header_data = [
        [
            Paragraph("<b>PEOPLEPAY 360</b><br/><font size=8 color='#6B7280'>Integrated HR & Payroll Operations</font>", title_style),
            Paragraph(f"<b>PAYSLIP</b><br/><font size=9 color='#6B7280'>#{payslip.payslipNumber if hasattr(payslip, 'payslipNumber') else payslip.payslip_number}</font><br/><font size=8 color='#059669'>STATUS: {payslip.status}</font>", ParagraphStyle('RightH', parent=title_style, alignment=2, fontSize=14))
        ]
    ]
    t_head = Table(header_data, colWidths=[340, 200])
    t_head.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_head)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#714B67'), spaceBefore=4, spaceAfter=14))

    # 2. Employee & Pay Period Summary
    period_str = f"{payslip.period_start.strftime('%d %b %Y')} to {payslip.period_end.strftime('%d %b %Y')}"
    bank_info = employee.bank_details
    bank_display = f"{bank_info.bank_name or 'N/A'} (A/C: {bank_info.account_number or 'N/A'})" if bank_info else "N/A"

    info_data = [
        [
            Paragraph("<b>Employee Name:</b>", cell_bold),
            Paragraph(f"{employee.first_name} {employee.last_name}", cell_style),
            Paragraph("<b>Pay Period:</b>", cell_bold),
            Paragraph(period_str, cell_style)
        ],
        [
            Paragraph("<b>Employee Code:</b>", cell_bold),
            Paragraph(employee.employee_code, cell_style),
            Paragraph("<b>Contract Code:</b>", cell_bold),
            Paragraph(contract.contract_code, cell_style)
        ],
        [
            Paragraph("<b>Email:</b>", cell_bold),
            Paragraph(employee.email, cell_style),
            Paragraph("<b>Worked Days:</b>", cell_bold),
            Paragraph(f"{payslip.worked_days:.1f} Days", cell_style)
        ],
        [
            Paragraph("<b>Bank Account:</b>", cell_bold),
            Paragraph(bank_display, cell_style),
            Paragraph("<b>Unpaid Leaves:</b>", cell_bold),
            Paragraph(f"{payslip.unpaid_leave_days:.1f} Days", cell_style)
        ]
    ]
    t_info = Table(info_data, colWidths=[100, 170, 100, 170])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F9FAFB')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 16))

    # 3. Earnings & Deductions Breakdown
    earnings_lines = [l for l in payslip.lines if l.category in [RuleCategory.BASIC, RuleCategory.ALLOWANCE]]
    deduction_lines = [l for l in payslip.lines if l.category == RuleCategory.DEDUCTION]

    max_rows = max(len(earnings_lines), len(deduction_lines), 1)

    table_data = [
        [
            Paragraph("<b>EARNINGS / ALLOWANCES</b>", header_bold),
            Paragraph("<b>AMOUNT (₹)</b>", ParagraphStyle('RA', parent=header_bold, alignment=2)),
            Paragraph("<b>DEDUCTIONS</b>", header_bold),
            Paragraph("<b>AMOUNT (₹)</b>", ParagraphStyle('RA2', parent=header_bold, alignment=2))
        ]
    ]

    for i in range(max_rows):
        earn_text = ""
        earn_amt = ""
        if i < len(earnings_lines):
            earn = earnings_lines[i]
            earn_text = f"<b>{earn.rule_name}</b><br/><font size=7 color='#6B7280'>{earn.calculation_note or ''}</font>"
            earn_amt = f"₹{earn.amount:,.2f}"

        ded_text = ""
        ded_amt = ""
        if i < len(deduction_lines):
            ded = deduction_lines[i]
            ded_text = f"<b>{ded.rule_name}</b><br/><font size=7 color='#6B7280'>{ded.calculation_note or ''}</font>"
            ded_amt = f"₹{ded.amount:,.2f}"

        table_data.append([
            Paragraph(earn_text, cell_style),
            Paragraph(earn_amt, ParagraphStyle('RA3', parent=cell_style, alignment=2)),
            Paragraph(ded_text, cell_style),
            Paragraph(ded_amt, ParagraphStyle('RA4', parent=cell_style, alignment=2))
        ])

    # Totals Row
    table_data.append([
        Paragraph("<b>Total Gross Earnings:</b>", cell_bold),
        Paragraph(f"<b>₹{payslip.gross_salary:,.2f}</b>", ParagraphStyle('R_Gross', parent=cell_bold, alignment=2, textColor=colors.HexColor('#059669'))),
        Paragraph("<b>Total Deductions:</b>", cell_bold),
        Paragraph(f"<b>₹{payslip.total_deductions:,.2f}</b>", ParagraphStyle('R_Ded', parent=cell_bold, alignment=2, textColor=colors.HexColor('#DC2626')))
    ])

    t_calc = Table(table_data, colWidths=[180, 90, 180, 90])
    t_calc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F3F4F6')),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor('#9CA3AF')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F9FAFB')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_calc)
    story.append(Spacer(1, 16))

    # 4. Net Salary Banner Box
    net_data = [
        [
            Paragraph("<b>NET TAKE-HOME PAYABLE SALARY</b><br/><font size=8 color='#6B7280'>Computed as Gross Earnings minus all Deductions</font>", cell_bold),
            Paragraph(f"₹{payslip.net_salary:,.2f}", ParagraphStyle('NetAmt', parent=title_style, alignment=2, fontSize=18, textColor=colors.HexColor('#047857')))
        ]
    ]
    t_net = Table(net_data, colWidths=[340, 200])
    t_net.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ECFDF5')), # Soft Green tint
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#10B981')),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_net)

    # 5. Sign-off & Footer
    story.append(Spacer(1, 40))
    footer_data = [
        [
            Paragraph("<font size=8 color='#9CA3AF'>This is a system generated payslip created by PeoplePay360 HR Platform.<br/>No manual signature is required.</font>", cell_style),
            Paragraph("<b>Authorized Signature:</b> ___________________<br/><font size=8 color='#6B7280'>Payroll Administrator</font>", ParagraphStyle('Sig', parent=cell_style, alignment=2))
        ]
    ]
    t_footer = Table(footer_data, colWidths=[300, 240])
    t_footer.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM')
    ]))
    story.append(t_footer)

    doc.build(story)
    buffer.seek(0)
    return buffer
