import { dashboardService } from './dashboardService'

export const assignmentService = {
  getAssignments: async (params = {}) => dashboardService.getAssignments(params),
  getAssignmentById: async (assignmentId) => dashboardService.getAssignmentById(assignmentId),
  getProfessionalStats: async () => dashboardService.getProfessionalStats(),
}
