from typing import List, Tuple, Dict, Any
from asteval import Interpreter
from app.models.models import SalaryRule, RuleCategory, ComputationType, PayslipLineEmbedded

def evaluate_salary_rules(
    contract_wage: float,
    worked_days: float,
    unpaid_days: float,
    total_working_days: float,
    rules: List[SalaryRule]
) -> Tuple[List[PayslipLineEmbedded], float, float, float, float]:
    """
    Evaluates salary rules in sequential order.
    Injects context into a safe AST sandbox.
    Returns: (lines, basic_salary, gross_salary, total_deductions, net_salary)
    """
    sorted_rules = sorted(rules, key=lambda r: r.sequence)
    
    aeval = Interpreter()
    context = {
        "contract": {"wage": float(contract_wage)},
        "wage": float(contract_wage),
        "worked_days": float(worked_days),
        "unpaid_days": float(unpaid_days),
        "total_days": float(total_working_days if total_working_days > 0 else 22.0),
        "rules": {}
    }
    aeval.symtable.update(context)
    
    lines: List[PayslipLineEmbedded] = []
    basic_val = 0.0
    allowances_val = 0.0
    deductions_val = 0.0
    net_val = 0.0
    has_net_rule = False

    for rule in sorted_rules:
        amount = 0.0
        note = ""

        if rule.computation_type == ComputationType.FIXED:
            amount = float(rule.fixed_amount or 0.0)
            note = f"Fixed ₹{amount:,.2f}"

        elif rule.computation_type == ComputationType.PERCENTAGE:
            base_code = rule.percentage_base_code
            if base_code and base_code in context["rules"]:
                base_val = context["rules"][base_code]
            else:
                base_val = contract_wage
            pct = float(rule.percentage or 0.0) / 100.0
            amount = round(base_val * pct, 2)
            note = f"{rule.percentage}% of {base_code or 'Wage'} (₹{base_val:,.2f})"

        elif rule.computation_type == ComputationType.FORMULA:
            expr = rule.formula_expression or "0.0"
            try:
                # Update asteval symbols before evaluating
                aeval.symtable["rules"] = context["rules"]
                eval_result = aeval(expr)
                amount = round(float(eval_result), 2)
                note = f"Formula: {expr}"
            except Exception as ex:
                amount = 0.0
                note = f"Calculation Error: {str(ex)}"

        # Save to context for downstream rule access
        context["rules"][rule.code] = amount
        aeval.symtable["rules"][rule.code] = amount

        # Tally totals by category
        if rule.category == RuleCategory.BASIC:
            basic_val += amount
        elif rule.category == RuleCategory.ALLOWANCE:
            allowances_val += amount
        elif rule.category == RuleCategory.DEDUCTION:
            deductions_val += amount
        elif rule.category == RuleCategory.NET:
            net_val = amount
            has_net_rule = True

        lines.append(
            PayslipLineEmbedded(
                rule_code=rule.code,
                rule_name=rule.name,
                category=rule.category,
                sequence=rule.sequence,
                rate=rule.percentage if rule.computation_type == ComputationType.PERCENTAGE else None,
                amount=amount,
                calculation_note=note
            )
        )

    gross_val = round(basic_val + allowances_val, 2)
    if not has_net_rule:
        net_val = round(gross_val - deductions_val, 2)

    # Edge Case C3 (PDF Page 8): Strict Negative Net Salary Prevention
    net_val = max(0.0, net_val)

    return lines, round(basic_val, 2), gross_val, round(deductions_val, 2), round(net_val, 2)
