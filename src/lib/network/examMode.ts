// Re-export all modular exam functionality for backward compatibility
export type {
  NoteItem,
  DevicePort,
  DeviceState,
  ProjectDevice,
  TopologyData,
  ProjectData,
  ExamTask,
  ExamProject
} from './examTypes';

export {
  encryptExamData,
  decryptExamData
} from './examEncryption';

export {
  generateExamIntegrityHash,
  verifyExamIntegrity
} from './examIntegrity';

export {
  basicConnectivityExamTasks,
  routingBasicsExamTasks,
  l3SwitchDhcpExamTasks,
  vlanTrunkingExamTasks,
  basicAclExamTasks,
  comprehensiveFinalExamTasks
} from './examTasks';

export {
  getExamProjects
} from './examProjects';

export {
  extractCliCommandsFromNotes,
  extractPcConfigsFromNotes,
  extractConnectionsFromNotes
} from './examNoteExtractors';

export {
  generateExamFromProject
} from './examGenerator';