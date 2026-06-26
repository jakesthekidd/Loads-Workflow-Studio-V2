import { ConditionGroup, ConditionOperator, ConditionRule, ConditionStatement } from '@app/models';

export type RuntimeValues = ReadonlyMap<string, unknown>;

function evalOp(op: ConditionOperator, fieldVal: unknown, ruleVal: unknown): boolean {
  const fStr = String(fieldVal ?? '').toLowerCase();
  const rStr = String(ruleVal ?? '').toLowerCase();
  const fNum = Number(fieldVal);
  const rNum = Number(ruleVal);
  switch (op) {
    case 'IsEqualTo':       return fStr === rStr;
    case 'IsNotEqualTo':    return fStr !== rStr;
    case 'Contains':        return fStr.includes(rStr);
    case 'DoesNotContain':  return !fStr.includes(rStr);
    case 'IsEmpty':         return fieldVal === null || fieldVal === undefined || fStr === '';
    case 'IsNotEmpty':      return fieldVal !== null && fieldVal !== undefined && fStr !== '';
    case 'GreaterThan':     return !isNaN(fNum) && !isNaN(rNum) && fNum > rNum;
    case 'LessThan':        return !isNaN(fNum) && !isNaN(rNum) && fNum < rNum;
  }
}

function evalRule(rule: ConditionRule, values: RuntimeValues): boolean {
  // Geotab/JSON source refs are deferred — treat as not met in preview.
  if (rule.field.source !== 'workflow') return false;
  return evalOp(rule.operator, values.get(rule.field.id) ?? null, rule.value);
}

function evalStatement(stmt: ConditionStatement, values: RuntimeValues): boolean {
  if (stmt.rules.length === 0) return true;
  let result = evalRule(stmt.rules[0], values);
  for (let i = 1; i < stmt.rules.length; i++) {
    const conn = stmt.rules[i - 1].connector ?? 'AND';
    result = conn === 'OR'
      ? result || evalRule(stmt.rules[i], values)
      : result && evalRule(stmt.rules[i], values);
  }
  return result;
}

/** Evaluate a ConditionGroup against the current preview runtime values.
 *  Returns true if the group is disabled, empty, or all conditions are met. */
export function evaluateConditionGroup(
  group: ConditionGroup | undefined,
  values: RuntimeValues,
): boolean {
  if (!group?.enabled) return true;
  if (group.statements.length === 0) return true;
  let result = evalStatement(group.statements[0], values);
  for (let i = 1; i < group.statements.length; i++) {
    const conn = group.statements[i - 1].connector ?? 'AND';
    result = conn === 'OR'
      ? result || evalStatement(group.statements[i], values)
      : result && evalStatement(group.statements[i], values);
  }
  return result;
}
