// In-memory cache for fast UI updates
export const cache = {
  users: null,
  classes: null,
  subjects: null,
  terms: null,
  reports: null,
  comments: null,
};

export const clearCache = () => {
  cache.users = null;
  cache.classes = null;
  cache.subjects = null;
  cache.terms = null;
  cache.reports = null;
  cache.comments = null;
};