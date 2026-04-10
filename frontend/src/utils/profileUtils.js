export const createEmptyFamilyMember = () => ({
  name: '',
  relation: '',
  age: '',
});

const trimValue = (value) => String(value ?? '').trim();

export const sanitizeFamilyMembers = (members = []) =>
  (Array.isArray(members) ? members : [])
    .map((member) => ({
      name: trimValue(member?.name),
      relation: trimValue(member?.relation),
      age: trimValue(member?.age),
    }))
    .filter((member) => member.name || member.relation || member.age);

export const normalizeUserProfile = (profile = {}) => {
  const familyMembers = sanitizeFamilyMembers(profile.familyMembers);

  return {
    ...profile,
    name: trimValue(profile.name),
    email: trimValue(profile.email),
    phoneNumber: trimValue(profile.phoneNumber),
    alternatePhone: trimValue(profile.alternatePhone),
    flat: trimValue(profile.flat || profile.flatNumber),
    wing: trimValue(profile.wing),
    emergencyContactName: trimValue(profile.emergencyContactName),
    emergencyContactNumber: trimValue(profile.emergencyContactNumber),
    bloodGroup: trimValue(profile.bloodGroup),
    profileImageUrl: trimValue(profile.profileImageUrl),
    familyMembers,
  };
};

export const getProfileInitial = (profile = {}) =>
  trimValue(profile?.name).charAt(0).toUpperCase() || '?';

export const getRoleLabel = (role = '') => {
  if (role === 'admin') return 'Admin';
  if (role === 'resident') return 'Resident';
  return trimValue(role) || 'N/A';
};

export const calculateProfileCompletion = (profile = {}) => {
  const normalized = normalizeUserProfile(profile);
  const checks = [
    Boolean(normalized.name),
    Boolean(normalized.phoneNumber),
    Boolean(normalized.flat),
    Boolean(normalized.wing),
    Boolean(normalized.emergencyContactName && normalized.emergencyContactNumber),
    normalized.familyMembers.length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  const percentage = Math.round((completed / checks.length) * 100);

  return {
    completed,
    total: checks.length,
    percentage,
  };
};
