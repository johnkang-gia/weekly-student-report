const fs = require('fs');

let content = fs.readFileSync('src/components/Teacher/ReportFormModal.tsx', 'utf8');

// 1. Add fetchPreviousReport import
content = content.replace("import { submitReport } from '../../services/api';", "import { submitReport, fetchPreviousReport } from '../../services/api';");

// 2. Add History View State and Auto-save States
content = content.replace("const [activeTerm, setActiveTerm] = useState(null);", 
`const [activeTerm, setActiveTerm] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState('');
  const [previousReport, setPreviousReport] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const autoSaveTimerRef = useRef<any>(null);`);

content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useRef, useCallback } from 'react';");

fs.writeFileSync('src/components/Teacher/ReportFormModal.tsx', content);
