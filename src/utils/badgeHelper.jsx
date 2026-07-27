import React from 'react';

export const CATEGORY_LABELS = {
  academic: '학업',
  improvement: '보완',
  participation: '참여',
  behavior: '태도',
  social: '교우',
  overall: '종합' // For legacy support
};

export const BADGE_MAP = {
  excellent: { label: '🌟 탁월 (Excellent)', type: 'primary', bg: '#EEF2FF', color: '#4F46E5', isWarning: false },
  good: { label: '🟢 양호 (Good)', type: 'success', bg: '#ECFDF5', color: '#10B981', isWarning: false },
  warning: { label: '⚠️ 지도요망 (Needs Attention)', type: 'warning', bg: '#FEF3C7', color: '#D97706', isWarning: true },
  bad: { label: '🚨 집중지도 (Poor)', type: 'danger', bg: '#FEE2E2', color: '#B91C1C', isWarning: true }
};

export const parseBadges = (aiTags) => {
  let parsed = {
    academic: ['good'],
    improvement: ['good'],
    participation: ['good'],
    behavior: ['good'],
    social: ['good']
  };

  if (!aiTags) return parsed;

  try {
    const tags = typeof aiTags === 'string' ? JSON.parse(aiTags) : aiTags;
    
    if (Array.isArray(tags)) {
      // Legacy format (array of strings or array of objects)
      if (tags.length === 0) return parsed;
      
      const mappedBadges = tags.map(t => {
        if (typeof t === 'string') return t;
        // Map old object format { label: '...', type: '...' } to new string format
        if (t.label && t.label.includes('탁월')) return 'excellent';
        if (t.label && (t.label.includes('집중') || t.label.includes('개선'))) return 'bad';
        if (t.label && (t.label.includes('지도') || t.label.includes('주의'))) return 'warning';
        return 'good';
      });

      parsed = {
        overall: mappedBadges
      };
    } else if (tags && typeof tags === 'object') {
      parsed = { ...parsed, ...tags };
    }
  } catch(e) {
    console.error("Error parsing aiTags:", e);
  }

  return parsed;
};

// Check if report has any warning/bad badges for statistics
export const hasWarningBadges = (parsedTags) => {
  const allBadges = Object.values(parsedTags).flat();
  return allBadges.includes('warning') || allBadges.includes('bad');
};

export const hasSuccessBadges = (parsedTags) => {
  const allBadges = Object.values(parsedTags).flat();
  return allBadges.includes('excellent');
};

export const renderBadgeGrid = (parsedTags) => {
  const entries = Object.entries(parsedTags).filter(([_, badges]) => badges && badges.length > 0);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', textAlign: 'left' }}>
      {entries.map(([catKey, badges]) => (
        <div key={catKey} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <span style={{ fontWeight: 'bold', width: '32px', color: '#475569', paddingTop: '2px' }}>
            {CATEGORY_LABELS[catKey] || catKey}:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {badges.map((b, idx) => {
              const badgeInfo = BADGE_MAP[b] || BADGE_MAP.good;
              return (
                <span 
                  key={idx} 
                  style={{ 
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: badgeInfo.bg, 
                    color: badgeInfo.color, 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {badgeInfo.label}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
