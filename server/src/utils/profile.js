export function splitList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildProfilePayload(body) {
  const role = String(body.role || '').trim();
  const overallTasks = splitList(body.overallTasks);
  const keyResponsibility = String(body.keyResponsibility || '').trim();

  return {
    role,
    department: String(body.department || '').trim(),
    seniority: body.seniority || 'Junior',
    overallTasks,
    professionalQuestion: String(body.professionalQuestion || '').trim(),
    keyResponsibility,
    tools: splitList(body.tools),
    managerExpectations: String(body.managerExpectations || '').trim(),
    reportTone: body.reportTone || 'Professional',
    isOnboarded: Boolean(role && keyResponsibility && String(body.professionalQuestion || '').trim())
  };
}
