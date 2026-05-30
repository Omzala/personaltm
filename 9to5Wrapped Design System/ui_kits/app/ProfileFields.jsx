/* ProfileFields — reused by sign-up + onboarding (src/pages/ProfileFields.jsx) */
function ProfileFields({ form, set }) {
  return (
    <>
      <div className="two-column">
        <label>Role
          <input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="Your role" />
        </label>
        <label>Department
          <input value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="Department" />
        </label>
      </div>
      <div className="two-column">
        <label>Seniority
          <select value={form.seniority} onChange={(e) => set('seniority', e.target.value)}>
            <option value="">Select seniority</option>
            {['Intern','Junior','Mid-level','Senior','Lead','Manager'].map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>Report tone
          <select value={form.reportTone} onChange={(e) => set('reportTone', e.target.value)}>
            <option value="">Select tone</option>
            {['Professional','Detailed','Concise','Impact-focused'].map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label>Professional focus question
        <input value={form.professionalQuestion} onChange={(e) => set('professionalQuestion', e.target.value)} placeholder="What should this report answer?" />
      </label>
      <label>Key responsibility
        <textarea value={form.keyResponsibility} onChange={(e) => set('keyResponsibility', e.target.value)} rows="2" />
      </label>
      <label>Tools and technologies
        <textarea value={form.tools} onChange={(e) => set('tools', e.target.value)} rows="2" placeholder="React, Figma, Linear…" />
      </label>
      <label>Manager expectations
        <textarea value={form.managerExpectations} onChange={(e) => set('managerExpectations', e.target.value)} rows="2" />
      </label>
    </>
  );
}
window.ProfileFields = ProfileFields;
