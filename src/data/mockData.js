export const STAFF = [
  { id: 'S001', name: 'Ravi Sharma', role: 'Senior Structural Engineer', department: 'Engineering', email: 'ravi.s@structflow.com', phone: '+91 98765 43210', avatar: 'RS', hourlyRate: 1200, monthlySalary: 85000, joinDate: '2021-03-15', status: 'active', skills: ['RCC Design', 'Steel Structures', 'Foundation Design'] },
  { id: 'S002', name: 'Priya Patel', role: 'Project Manager', department: 'Management', email: 'priya.p@structflow.com', phone: '+91 98765 43211', avatar: 'PP', hourlyRate: 1500, monthlySalary: 110000, joinDate: '2020-06-01', status: 'active', skills: ['Project Planning', 'Client Management', 'Quality Control'] },
  { id: 'S003', name: 'Amit Desai', role: 'Structural Engineer', department: 'Engineering', email: 'amit.d@structflow.com', phone: '+91 98765 43212', avatar: 'AD', hourlyRate: 900, monthlySalary: 65000, joinDate: '2022-01-10', status: 'active', skills: ['AutoCAD', 'STAAD Pro', 'ETABS'] },
  { id: 'S004', name: 'Sneha Kulkarni', role: 'Junior Engineer', department: 'Engineering', email: 'sneha.k@structflow.com', phone: '+91 98765 43213', avatar: 'SK', hourlyRate: 600, monthlySalary: 45000, joinDate: '2023-07-20', status: 'active', skills: ['Drafting', 'Detailing', 'Site Visits'] },
  { id: 'S005', name: 'Vikram Joshi', role: 'Team Lead', department: 'Engineering', email: 'vikram.j@structflow.com', phone: '+91 98765 43214', avatar: 'VJ', hourlyRate: 1100, monthlySalary: 80000, joinDate: '2021-09-05', status: 'active', skills: ['RCC Design', 'Project Coordination', 'Estimation'] },
  { id: 'S006', name: 'Meera Nair', role: 'CAD Technician', department: 'Drafting', email: 'meera.n@structflow.com', phone: '+91 98765 43215', avatar: 'MN', hourlyRate: 500, monthlySalary: 38000, joinDate: '2023-11-01', status: 'active', skills: ['AutoCAD', 'Revit', 'Detailing'] },
  { id: 'S007', name: 'Arjun Mehta', role: 'Senior Structural Engineer', department: 'Engineering', email: 'arjun.m@structflow.com', phone: '+91 98765 43216', avatar: 'AM', hourlyRate: 1200, monthlySalary: 85000, joinDate: '2020-11-15', status: 'active', skills: ['Steel Structures', 'Seismic Design', 'Foundation Design'] },
  { id: 'S008', name: 'Kavita Singh', role: 'Admin & Accounts', department: 'Administration', email: 'kavita.s@structflow.com', phone: '+91 98765 43217', avatar: 'KS', hourlyRate: 400, monthlySalary: 35000, joinDate: '2022-04-10', status: 'active', skills: ['Invoicing', 'Payroll', 'Documentation'] },
  { id: 'S009', name: 'Zubair Ahmed', role: 'Organization Admin', department: 'Administration', email: 'admin@structflow.com', phone: '+91 98765 43218', avatar: 'ZA', hourlyRate: 0, monthlySalary: 0, joinDate: '2020-01-01', status: 'active', skills: ['Project Planning', 'Client Management'] },
]

export const CLIENTS = [
  { id: 'C001', name: 'Prestige Constructions', contact: 'Rajesh Gupta', email: 'rajesh@prestige.com', phone: '+91 98000 12345', projects: ['P001', 'P004'] },
  { id: 'C002', name: 'Tata Housing', contact: 'Ananya Verma', email: 'ananya@tatahousing.com', phone: '+91 98000 12346', projects: ['P002'] },
  { id: 'C003', name: 'Godrej Properties', contact: 'Suresh Reddy', email: 'suresh@godrej.com', phone: '+91 98000 12347', projects: ['P003'] },
  { id: 'C004', name: 'DLF Group', contact: 'Mohit Khanna', email: 'mohit@dlf.com', phone: '+91 98000 12348', projects: ['P005'] },
]

export const PROJECT_STAGES = [
  { id: 'stage-wo', name: 'Work Order', order: 1 },
  { id: 'stage-framing', name: 'Framing Layout & Structural Estimate', order: 2, optional: true },
  { id: 'stage-1', name: 'Stage 1: Foundation & Column Details', order: 3 },
  { id: 'stage-2', name: 'Stage 2: Plinth Beam & Substructure', order: 4 },
  { id: 'stage-3', name: 'Floor Beam & Slab Details', order: 5 },
  { id: 'stage-roof', name: 'Roof Details', order: 6 },
]

export const PROJECTS = [
  {
    id: 'P001', name: 'Prestige Towers - Block A', type: 'Residential', location: 'Bangalore', clientId: 'C001',
    managerId: 'S002', teamIds: ['S001', 'S003', 'S004'], status: 'in-progress', priority: 'high',
    startDate: '2026-06-01', endDate: '2027-03-31', contractValue: 2500000,
    currentStage: 'stage-3', progress: 62,
    description: 'Structural design for 14-storey residential tower with 2 basements. G+14 RCC framed structure with flat slab system.',
  },
  {
    id: 'P002', name: 'Tata Commercial Hub', type: 'Commercial', location: 'Mumbai', clientId: 'C002',
    managerId: 'S002', teamIds: ['S007', 'S005', 'S006'], status: 'in-progress', priority: 'high',
    startDate: '2026-08-15', endDate: '2027-06-30', contractValue: 4200000,
    currentStage: 'stage-2', progress: 35,
    description: 'Commercial complex with 3 towers. Steel-composite structure with post-tensioned slabs.',
  },
  {
    id: 'P003', name: 'Godrej Villa Park', type: 'Residential', location: 'Pune', clientId: 'C003',
    managerId: 'S005', teamIds: ['S003', 'S004', 'S006'], access: { S004: 'read' }, status: 'in-progress', priority: 'medium',
    startDate: '2026-09-01', endDate: '2027-02-28', contractValue: 1800000,
    currentStage: 'stage-1', progress: 18,
    description: 'Row houses development. 48 units across 4 blocks. Load-bearing masonry with RCC roof.',
  },
  {
    id: 'P004', name: 'Prestige Industrial Shed', type: 'Industrial', location: 'Chennai', clientId: 'C001',
    managerId: 'S002', teamIds: ['S007', 'S001'], status: 'completed', priority: 'medium',
    startDate: '2026-01-15', endDate: '2026-08-30', contractValue: 950000,
    currentStage: 'stage-roof', progress: 100,
    description: 'Pre-engineered steel building for warehouse. 5000 sqm covered area.',
  },
  {
    id: 'P005', name: 'DLF Cyber Park - Tower 3', type: 'Commercial', location: 'Gurgaon', clientId: 'C004',
    managerId: 'S005', teamIds: ['S001', 'S007', 'S003', 'S006'], status: 'planning', priority: 'high',
    startDate: '2027-01-01', endDate: '2027-12-31', contractValue: 5800000,
    currentStage: 'stage-wo', progress: 5,
    description: 'IT park tower, G+22 floors. High-rise RCC structure with shear walls and raft foundation.',
  },
]

export const TASK_STATUSES = ['backlog', 'todo', 'in-progress', 'review', 'done']
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent']

export const TASKS = [
  { id: 'T001', title: 'Foundation layout design - Block A', projectId: 'P001', assigneeId: 'S001', reporterId: 'S002', status: 'done', priority: 'high', type: 'design', createdDate: '2026-06-10', dueDate: '2026-07-15', completedDate: '2026-07-12', estimatedHours: 40, loggedHours: 38, description: 'Design raft foundation for Block A tower. Consider soil bearing capacity report from geotechnical investigation.', tags: ['foundation', 'rcc'], milestoneId: 'M001' },
  { id: 'T002', title: 'Column schedule - Ground to 5th floor', projectId: 'P001', assigneeId: 'S003', reporterId: 'S001', status: 'done', priority: 'high', type: 'design', createdDate: '2026-07-01', dueDate: '2026-08-10', completedDate: '2026-08-08', estimatedHours: 60, loggedHours: 55, description: 'Prepare column schedule with reinforcement details for lower floors.', tags: ['columns', 'rcc', 'detailing'], milestoneId: 'M003' },
  { id: 'T003', title: 'Plinth beam design', projectId: 'P001', assigneeId: 'S001', reporterId: 'S002', status: 'done', priority: 'medium', type: 'design', createdDate: '2026-08-01', dueDate: '2026-09-01', completedDate: '2026-08-28', estimatedHours: 24, loggedHours: 22, description: 'Design plinth beams connecting column footings.', tags: ['plinth', 'beams'], milestoneId: 'M002' },
  { id: 'T004', title: '3rd floor slab design & detailing', projectId: 'P001', assigneeId: 'S003', reporterId: 'S001', status: 'in-progress', priority: 'high', type: 'design', createdDate: '2026-10-15', dueDate: '2026-11-30', estimatedHours: 48, loggedHours: 32, description: 'Design flat slab for 3rd floor including drop panels and punching shear checks.', tags: ['slab', 'detailing'], milestoneId: 'M003' },
  { id: 'T005', title: '3rd floor beam schedule', projectId: 'P001', assigneeId: 'S004', reporterId: 'S001', status: 'in-progress', priority: 'medium', type: 'drafting', createdDate: '2026-10-20', dueDate: '2026-12-05', estimatedHours: 32, loggedHours: 18, description: 'Prepare beam schedule and reinforcement details for 3rd floor.', tags: ['beams', 'drafting'], milestoneId: 'M003' },
  { id: 'T006', title: 'Column schedule - 6th to 10th floor', projectId: 'P001', assigneeId: 'S003', reporterId: 'S001', status: 'todo', priority: 'medium', type: 'design', createdDate: '2026-11-01', dueDate: '2026-12-15', estimatedHours: 40, loggedHours: 0, description: 'Column design for upper floors with reduced sections.', tags: ['columns', 'rcc'], milestoneId: 'M003' },
  { id: 'T007', title: 'Steel connection design - Main frame', projectId: 'P002', assigneeId: 'S007', reporterId: 'S005', status: 'in-progress', priority: 'high', type: 'design', createdDate: '2026-09-01', dueDate: '2026-11-30', estimatedHours: 80, loggedHours: 52, description: 'Design moment-resisting steel connections for the main structural frame.', tags: ['steel', 'connections'], milestoneId: 'M007' },
  { id: 'T008', title: 'Foundation pile design', projectId: 'P002', assigneeId: 'S007', reporterId: 'S002', status: 'done', priority: 'urgent', type: 'design', createdDate: '2026-08-20', dueDate: '2026-09-30', completedDate: '2026-09-25', estimatedHours: 36, loggedHours: 40, description: 'Design pile foundation for Tower 1. Consider high water table conditions.', tags: ['foundation', 'piles'], milestoneId: 'M006' },
  { id: 'T009', title: 'Post-tensioning layout - Floor 1', projectId: 'P002', assigneeId: 'S005', reporterId: 'S002', status: 'todo', priority: 'high', type: 'design', createdDate: '2026-11-10', dueDate: '2027-01-15', estimatedHours: 56, loggedHours: 0, description: 'Design post-tensioned slab system for first floor of commercial towers.', tags: ['pt-slab', 'design'], milestoneId: 'M007' },
  { id: 'T010', title: 'AutoCAD drawings - Villa Type A', projectId: 'P003', assigneeId: 'S006', reporterId: 'S005', status: 'in-progress', priority: 'medium', type: 'drafting', createdDate: '2026-10-01', dueDate: '2026-11-25', estimatedHours: 24, loggedHours: 16, description: 'Prepare structural drawings for Villa Type A including foundation, walls, and roof.', tags: ['autocad', 'villa'], milestoneId: 'M010' },
  { id: 'T011', title: 'Soil investigation review', projectId: 'P003', assigneeId: 'S003', reporterId: 'S005', status: 'review', priority: 'medium', type: 'review', createdDate: '2026-09-15', dueDate: '2026-10-30', estimatedHours: 8, loggedHours: 6, description: 'Review geotechnical report and recommend foundation type for villa development.', tags: ['geotech', 'review'], milestoneId: 'M010' },
  { id: 'T012', title: 'Structural estimate - DLF Tower 3', projectId: 'P005', assigneeId: 'S001', reporterId: 'S005', status: 'backlog', priority: 'medium', type: 'estimation', createdDate: '2026-11-20', dueDate: '2027-01-10', estimatedHours: 20, loggedHours: 0, description: 'Prepare structural quantity estimate and cost analysis for the DLF project proposal.', tags: ['estimation', 'proposal'] },
  { id: 'T013', title: 'Seismic analysis - Tower 3', projectId: 'P005', assigneeId: 'S007', reporterId: 'S005', status: 'backlog', priority: 'high', type: 'analysis', createdDate: '2026-11-20', dueDate: '2027-02-15', estimatedHours: 48, loggedHours: 0, description: 'Perform seismic analysis as per IS 1893:2016 for the high-rise structure.', tags: ['seismic', 'analysis'] },
  { id: 'T014', title: 'QC check - Floor 2 drawings', projectId: 'P001', assigneeId: 'S005', reporterId: 'S002', status: 'review', priority: 'high', type: 'review', createdDate: '2026-11-01', dueDate: '2026-11-20', estimatedHours: 8, loggedHours: 6, description: 'Quality check on 2nd floor structural drawings before client submission.', tags: ['qc', 'review'], milestoneId: 'M003' },
  { id: 'T015', title: 'Site visit report - Prestige Towers', projectId: 'P001', assigneeId: 'S004', reporterId: 'S001', status: 'todo', priority: 'low', type: 'report', createdDate: '2026-11-18', dueDate: '2026-11-28', estimatedHours: 4, loggedHours: 0, description: 'Conduct site visit and prepare report on construction progress vs design intent.', tags: ['site-visit', 'report'], milestoneId: 'M003' },
  { id: 'T016', title: 'Framing layout - Warehouse shed', projectId: 'P004', assigneeId: 'S001', reporterId: 'S002', status: 'done', priority: 'medium', type: 'design', createdDate: '2026-01-20', dueDate: '2026-02-28', completedDate: '2026-02-24', estimatedHours: 24, loggedHours: 22, description: 'Framing layout and structural estimate for the pre-engineered shed.', tags: [], milestoneId: 'M011' },
  { id: 'T017', title: 'Column base and footing details', projectId: 'P004', assigneeId: 'S007', reporterId: 'S002', status: 'done', priority: 'medium', type: 'design', createdDate: '2026-03-02', dueDate: '2026-04-30', completedDate: '2026-04-27', estimatedHours: 32, loggedHours: 34, description: 'Footing and base plate details for the main columns.', tags: [], milestoneId: 'M012' },
  { id: 'T018', title: 'Steel frame and purlin drawings', projectId: 'P004', assigneeId: 'S007', reporterId: 'S002', status: 'done', priority: 'medium', type: 'drafting', createdDate: '2026-05-04', dueDate: '2026-06-30', completedDate: '2026-06-29', estimatedHours: 40, loggedHours: 38, description: 'Frame, purlin and bracing drawings.', tags: [], milestoneId: 'M013' },
  { id: 'T019', title: 'Roof sheeting details and handover set', projectId: 'P004', assigneeId: 'S001', reporterId: 'S002', status: 'done', priority: 'medium', type: 'drafting', createdDate: '2026-07-06', dueDate: '2026-08-30', completedDate: '2026-08-26', estimatedHours: 20, loggedHours: 19, description: 'Roof details and the final handover drawing set.', tags: [], milestoneId: 'M014' },
]

export const TIME_LOGS = [
  { id: 'TL001', staffId: 'S001', taskId: 'T001', projectId: 'P001', date: '2026-07-10', hours: 6, description: 'Foundation layout — raft design calculations' },
  { id: 'TL002', staffId: 'S001', taskId: 'T001', projectId: 'P001', date: '2026-07-11', hours: 8, description: 'Foundation layout — detailing and drawing review' },
  { id: 'TL003', staffId: 'S003', taskId: 'T002', projectId: 'P001', date: '2026-07-20', hours: 7, description: 'Column design — load analysis for lower floors' },
  { id: 'TL004', staffId: 'S003', taskId: 'T004', projectId: 'P001', date: '2026-11-18', hours: 6, description: '3rd floor slab — punching shear calculations' },
  { id: 'TL005', staffId: 'S004', taskId: 'T005', projectId: 'P001', date: '2026-11-18', hours: 5, description: 'Beam schedule — 3rd floor reinforcement details' },
  { id: 'TL006', staffId: 'S007', taskId: 'T007', projectId: 'P002', date: '2026-11-18', hours: 7, description: 'Steel connection — moment frame joint design' },
  { id: 'TL007', staffId: 'S006', taskId: 'T010', projectId: 'P003', date: '2026-11-18', hours: 6, description: 'Villa Type A — roof structural drawing' },
  { id: 'TL008', staffId: 'S005', taskId: 'T014', projectId: 'P001', date: '2026-11-19', hours: 4, description: 'QC review — checking 2nd floor beam details' },
  { id: 'TL009', staffId: 'S001', taskId: 'T004', projectId: 'P001', date: '2026-11-19', hours: 3, description: 'Slab design review and guidance for Amit' },
  { id: 'TL010', staffId: 'S003', taskId: 'T011', projectId: 'P003', date: '2026-11-17', hours: 6, description: 'Reviewing soil report parameters and recommendations' },
]

export const MILESTONES = [
  { id: 'M001', projectId: 'P001', name: 'Foundation Design Complete', weightage: 20, status: 'completed', dueDate: '2026-07-31', completedDate: '2026-07-28', paymentAmount: 500000, paymentStatus: 'paid', paymentMode: 'manual' },
  { id: 'M002', projectId: 'P001', name: 'Substructure Design Complete', weightage: 20, status: 'completed', dueDate: '2026-09-30', completedDate: '2026-09-25', paymentAmount: 500000, paymentStatus: 'paid', paymentMode: 'manual' },
  { id: 'M003', projectId: 'P001', name: 'Superstructure — Lower Floors', weightage: 25, status: 'in-progress', dueDate: '2026-12-31', paymentAmount: 625000, paymentStatus: 'pending', paymentMode: 'auto' },
  { id: 'M004', projectId: 'P001', name: 'Superstructure — Upper Floors', weightage: 20, status: 'pending', dueDate: '2027-02-28', paymentAmount: 500000, paymentStatus: 'pending', paymentMode: 'manual' },
  { id: 'M005', projectId: 'P001', name: 'Roof & Final Review', weightage: 15, status: 'pending', dueDate: '2027-03-31', paymentAmount: 375000, paymentStatus: 'pending', paymentMode: 'manual' },
  { id: 'M006', projectId: 'P002', name: 'Foundation & Pile Design', weightage: 25, status: 'completed', dueDate: '2026-10-15', completedDate: '2026-10-10', paymentAmount: 1050000, paymentStatus: 'paid', paymentMode: 'manual' },
  { id: 'M007', projectId: 'P002', name: 'Steel Frame Design', weightage: 30, status: 'in-progress', dueDate: '2027-01-31', paymentAmount: 1260000, paymentStatus: 'pending', paymentMode: 'manual' },
  { id: 'M008', projectId: 'P002', name: 'Slab & Floor System', weightage: 25, status: 'pending', dueDate: '2027-04-30', paymentAmount: 1050000, paymentStatus: 'pending', paymentMode: 'manual' },
  { id: 'M009', projectId: 'P002', name: 'Final Review & Handover', weightage: 20, status: 'pending', dueDate: '2027-06-30', paymentAmount: 840000, paymentStatus: 'pending', paymentMode: 'manual' },
  { id: 'M010', projectId: 'P003', name: 'Foundation Type Selection', weightage: 15, status: 'in-progress', dueDate: '2026-11-30', paymentAmount: 270000, paymentStatus: 'pending', paymentMode: 'manual' },
  { id: 'M011', projectId: 'P004', name: 'Work Order & Framing Layout', weightage: 20, status: 'completed', dueDate: '2026-02-28', completedDate: '2026-02-24', paymentAmount: 190000, paymentStatus: 'paid', paymentMode: 'manual' },
  { id: 'M012', projectId: 'P004', name: 'Foundation & Column Details', weightage: 30, status: 'completed', dueDate: '2026-04-30', completedDate: '2026-04-27', paymentAmount: 285000, paymentStatus: 'paid', paymentMode: 'manual' },
  { id: 'M013', projectId: 'P004', name: 'Steel Frame & Floor Details', weightage: 30, status: 'completed', dueDate: '2026-06-30', completedDate: '2026-06-29', paymentAmount: 285000, paymentStatus: 'paid', paymentMode: 'manual' },
  { id: 'M014', projectId: 'P004', name: 'Roof Details & Handover', weightage: 20, status: 'completed', dueDate: '2026-08-30', completedDate: '2026-08-26', paymentAmount: 190000, paymentStatus: 'paid', paymentMode: 'manual' },
]

export const FILES = [
  { id: 'F001', name: 'Foundation_Layout_BlockA_v3.dwg', projectId: 'P001', uploadedBy: 'S001', date: '2026-07-12', size: '4.2 MB', type: 'dwg', folder: 'Foundation' },
  { id: 'F002', name: 'Column_Schedule_G-5F.pdf', projectId: 'P001', uploadedBy: 'S003', date: '2026-08-08', size: '1.8 MB', type: 'pdf', folder: 'Columns' },
  { id: 'F003', name: 'Plinth_Beam_Details.dwg', projectId: 'P001', uploadedBy: 'S001', date: '2026-08-28', size: '3.1 MB', type: 'dwg', folder: 'Beams' },
  { id: 'F004', name: 'Soil_Investigation_Report.pdf', projectId: 'P003', uploadedBy: 'S003', date: '2026-09-20', size: '12.4 MB', type: 'pdf', folder: 'Reports' },
  { id: 'F005', name: 'Steel_Connection_Calcs.xlsx', projectId: 'P002', uploadedBy: 'S007', date: '2026-10-15', size: '856 KB', type: 'xlsx', folder: 'Calculations' },
  { id: 'F006', name: 'Pile_Foundation_Design.pdf', projectId: 'P002', uploadedBy: 'S007', date: '2026-09-25', size: '2.3 MB', type: 'pdf', folder: 'Foundation' },
  { id: 'F007', name: 'Villa_TypeA_Structural.dwg', projectId: 'P003', uploadedBy: 'S006', date: '2026-11-15', size: '5.7 MB', type: 'dwg', folder: 'Drawings' },
  { id: 'F008', name: '3rd_Floor_Slab_Draft.dwg', projectId: 'P001', uploadedBy: 'S004', date: '2026-11-10', size: '3.9 MB', type: 'dwg', folder: 'Slabs' },
]

export const ACTIVITIES = [
  { id: 'A001', type: 'task_completed', userId: 'S001', taskId: 'T001', projectId: 'P001', timestamp: '2026-07-12T14:30:00', message: 'completed Foundation layout design' },
  { id: 'A002', type: 'file_uploaded', userId: 'S001', projectId: 'P001', timestamp: '2026-07-12T15:00:00', message: 'uploaded Foundation_Layout_BlockA_v3.dwg' },
  { id: 'A003', type: 'milestone_completed', userId: 'S002', projectId: 'P001', timestamp: '2026-07-28T10:00:00', message: 'marked Foundation Design Complete milestone as done' },
  { id: 'A004', type: 'task_status', userId: 'S003', taskId: 'T004', projectId: 'P001', timestamp: '2026-11-18T09:15:00', message: 'moved 3rd floor slab design to In Progress' },
  { id: 'A005', type: 'time_logged', userId: 'S007', taskId: 'T007', projectId: 'P002', timestamp: '2026-11-18T17:30:00', message: 'logged 7 hours on Steel connection design' },
  { id: 'A006', type: 'task_created', userId: 'S005', taskId: 'T012', projectId: 'P005', timestamp: '2026-11-20T11:00:00', message: 'created Structural estimate task for DLF Tower 3' },
  { id: 'A007', type: 'comment', userId: 'S002', taskId: 'T014', projectId: 'P001', timestamp: '2026-11-19T16:45:00', message: 'commented on QC check: Please verify punching shear at column C7' },
  { id: 'A008', type: 'task_status', userId: 'S006', taskId: 'T010', projectId: 'P003', timestamp: '2026-11-18T10:00:00', message: 'started AutoCAD drawings for Villa Type A' },
]

export function getStaffById(id) { return STAFF.find(s => s.id === id) }
export function getProjectById(id) { return PROJECTS.find(p => p.id === id) }
export function getClientById(id) { return CLIENTS.find(c => c.id === id) }
export function getTasksByProject(projectId) { return TASKS.filter(t => t.projectId === projectId) }
export function getTasksByAssignee(staffId) { return TASKS.filter(t => t.assigneeId === staffId) }
export function getMilestonesByProject(projectId) { return MILESTONES.filter(m => m.projectId === projectId) }
export function getFilesByProject(projectId) { return FILES.filter(f => f.projectId === projectId) }
export function getTimeLogsByStaff(staffId) { return TIME_LOGS.filter(t => t.staffId === staffId) }
export function getTimeLogsByTask(taskId) { return TIME_LOGS.filter(t => t.taskId === taskId) }
