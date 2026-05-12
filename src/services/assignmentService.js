import { dashboardService } from './dashboardService'

export const assignmentService = {
  getAssignments: async (params = {}) => dashboardService.getAssignments(params),
}
