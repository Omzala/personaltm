import React from 'react';
import { Select } from '../components/Select.jsx';

export const initialProfile = {
  role: '',
  department: '',
  seniority: '',
  overallTasks: '',
  professionalQuestion: '',
  keyResponsibility: '',
  tools: '',
  managerExpectations: '',
  reportTone: ''
};

export function ProfileFields({ form, setForm }) {
  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  return (
    <>
      <div className="two-column">
        <label>
          Role
          <input value={form.role} onChange={(event) => update('role', event.target.value)} placeholder="Your role" required />
        </label>
        <label>
          Department
          <input value={form.department} onChange={(event) => update('department', event.target.value)} placeholder="Department" />
        </label>
      </div>
      <div className="two-column">
        <label>
          Seniority
          <Select
            ariaLabel="Seniority"
            placeholder="Select seniority"
            value={form.seniority}
            options={['Intern', 'Junior', 'Mid-level', 'Senior', 'Lead', 'Manager']}
            onChange={(value) => update('seniority', value)}
          />
        </label>
        <label>
          Report tone
          <Select
            ariaLabel="Report tone"
            placeholder="Select tone"
            value={form.reportTone}
            options={['Professional', 'Detailed', 'Concise', 'Impact-focused']}
            onChange={(value) => update('reportTone', value)}
          />
        </label>
      </div>
      <label>
        Professional focus question
        <input value={form.professionalQuestion} onChange={(event) => update('professionalQuestion', event.target.value)} placeholder="What should this report answer?" required />
      </label>
      <label>
        Key responsibility
        <textarea value={form.keyResponsibility} onChange={(event) => update('keyResponsibility', event.target.value)} rows="2" required />
      </label>
      <label>
        Recurring responsibilities
        <textarea value={form.overallTasks} onChange={(event) => update('overallTasks', event.target.value)} rows="4" />
      </label>
      <label>
        Tools and technologies
        <textarea value={form.tools} onChange={(event) => update('tools', event.target.value)} rows="3" />
      </label>
      <label>
        Manager expectations
        <textarea value={form.managerExpectations} onChange={(event) => update('managerExpectations', event.target.value)} rows="3" />
      </label>
    </>
  );
}
