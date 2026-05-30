import jwt from 'jsonwebtoken';

export function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    seniority: user.seniority,
    overallTasks: user.overallTasks,
    professionalQuestion: user.professionalQuestion,
    keyResponsibility: user.keyResponsibility,
    tools: user.tools,
    managerExpectations: user.managerExpectations,
    reportTone: user.reportTone,
    isOnboarded: user.isOnboarded
  };
}
