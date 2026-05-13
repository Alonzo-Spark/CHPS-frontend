import React from 'react'
import DashboardSummaryCards from './DashboardSummaryCards'
import AssignmentTable from './AssignmentTable'
import ErrorBoundary from '../../../components/common/ErrorBoundary'

const DashboardPage = () => {
  return (
    <ErrorBoundary>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardSummaryCards />
        <AssignmentTable />
      </div>
    </ErrorBoundary>
  )
}

export default DashboardPage

