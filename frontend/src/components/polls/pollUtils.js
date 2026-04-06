const MINUTE_IN_MS = 60 * 1000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const getTimestampMs = (value) => {
  if (!value && value !== 0) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

export const getPollDeadlineMs = (poll) => getTimestampMs(poll?.deadline);

export const isPollExpired = (poll, now = Date.now()) => {
  const deadlineMs = getPollDeadlineMs(poll);
  return deadlineMs !== null && now > deadlineMs;
};

export const getPollStatus = (poll, now = Date.now()) => {
  if (poll?.isClosed || poll?.status === 'closed' || isPollExpired(poll, now)) {
    return 'closed';
  }

  const createdAtMs = getTimestampMs(poll?.createdAt);
  if (poll?.status === 'scheduled' || (createdAtMs !== null && createdAtMs > now)) {
    return 'scheduled';
  }

  return 'active';
};

export const getPollVotes = (poll) => poll?.votes || {};

export const getPollTotalVotes = (poll) => Object.keys(getPollVotes(poll)).length;

export const getVotesForOption = (poll, option) =>
  Object.values(getPollVotes(poll)).filter((value) => value === option).length;

export const getVotePercentage = (poll, option) => {
  const totalVotes = getPollTotalVotes(poll);
  if (!totalVotes) {
    return 0;
  }

  return Math.round((getVotesForOption(poll, option) / totalVotes) * 100);
};

export const getPollAnalytics = (polls = [], totalUsers = 0, now = Date.now()) => {
  const activePolls = polls.filter((poll) => getPollStatus(poll, now) !== 'closed').length;
  const totalVotes = polls.reduce((sum, poll) => sum + getPollTotalVotes(poll), 0);
  const uniqueVoters = new Set();

  polls.forEach((poll) => {
    Object.keys(getPollVotes(poll)).forEach((uid) => uniqueVoters.add(uid));
  });

  const engagementBase = totalUsers > 0 ? totalUsers : Math.max(uniqueVoters.size, 1);
  const engagementRate = Math.min(100, Math.round((totalVotes / engagementBase) * 100));

  return {
    activePolls,
    totalVotes,
    engagementRate,
  };
};

export const formatPollDate = (value) => {
  const ms = getTimestampMs(value);
  if (ms === null) {
    return 'Not available';
  }

  return new Date(ms).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatPollDateTime = (value) => {
  const ms = getTimestampMs(value);
  if (ms === null) {
    return 'Not set';
  }

  return new Date(ms).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const getDeadlineLabel = (poll, now = Date.now()) => {
  const deadlineMs = getPollDeadlineMs(poll);
  if (deadlineMs === null) {
    return null;
  }

  const diff = deadlineMs - now;
  if (diff <= 0) {
    return 'Deadline passed';
  }

  if (diff < MINUTE_IN_MS) {
    return 'Ends in under a minute';
  }

  if (diff < DAY_IN_MS) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / MINUTE_IN_MS);
    if (hours <= 0) {
      return `Ends in ${minutes}m`;
    }
    if (minutes <= 0) {
      return `Ends in ${hours}h`;
    }
    return `Ends in ${hours}h ${minutes}m`;
  }

  const days = Math.ceil(diff / DAY_IN_MS);
  return `Ends in ${days} day${days === 1 ? '' : 's'}`;
};
