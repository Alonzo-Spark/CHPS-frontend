import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Calendar, FileText, UserCheck, Hash, Clock3 } from 'lucide-react'
import { assignmentService } from '../../services/assignmentService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'

const DetailRow = ({ label, value, mono = false }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">{label}</p>
    <p className={`text-sm text-gray-900 ${mono ? 'font-mono' : 'font-medium'}`}>{value ?? '—'}</p>
  </div>
)

const AssignmentDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAssignment = async () => {
    if (!id) {
      setError('Missing assignment identifier')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await assignmentService.getAssignmentById(id)
      const payload = response?.data || response || null
      setAssignment(payload)
    } catch (err) {
      console.error('Failed to load assignment details', err)
      setAssignment(null)
      setError('Failed to load assignment details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignment()
  }, [id])

  const notice = assignment?.notice || assignment?.notice_details || assignment?.notice_info || {}
  const professional = assignment?.assigned_professional || assignment?.professional || {}

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Assignment Details</h1>
          <p className="text-sm text-gray-500 mt-1">Live assignment record from the backend</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex flex-col items-center justify-center text-center">
            <AlertCircle className="text-red-500 mb-2" size={32} />
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              type="button"
              onClick={loadAssignment}
              className="px-4 py-2 bg-white border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : !assignment ? (
        <EmptyState message="No assignment details found" onAction={loadAssignment} actionLabel="Reload" />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2">Assignment</p>
                <h2 className="text-xl font-semibold text-gray-900">{assignment.notice_assessee_name || assignment.assessee_name || 'Unknown Assessee'}</h2>
                <p className="text-sm text-gray-500 mt-1">Assignment ID: {assignment.assignment_id || assignment.id || '—'}</p>
              </div>
              <StatusBadge status={assignment.assignment_status || assignment.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">Assignment Info</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <DetailRow label="Status" value={assignment.assignment_status || assignment.status} />
                <DetailRow label="Method" value={assignment.assignment_method} />
                <DetailRow label="Assigned Alphabet" value={assignment.assigned_alphabet || assignment.assigned_letter} />
                <DetailRow label="Assigned At" value={assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString() : '—'} />
                <DetailRow label="Updated At" value={assignment.updated_at ? new Date(assignment.updated_at).toLocaleString() : '—'} />
                <DetailRow label="Created At" value={assignment.created_at ? new Date(assignment.created_at).toLocaleString() : '—'} />
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">Notice Info</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <DetailRow label="Proceeding ID" value={notice.proceeding_id || notice.notice_id || assignment.proceeding_id} mono />
                <DetailRow label="Proceeding Name" value={notice.proceeding_name || notice.notice_name} />
                <DetailRow label="Assessee" value={notice.assessee_name || assignment.notice_assessee_name} />
                <DetailRow label="Notice Type" value={notice.notice_type || notice.proceeding_type} />
                <DetailRow label="Assessment Year" value={notice.assessment_year} />
                <DetailRow label="Financial Year" value={notice.financial_year} />
                <DetailRow label="Applicable Act" value={notice.applicable_act} />
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">Professional</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
  <DetailRow
    label="Professional Name"
    value={
      professional?.professional_name ||
      professional?.name ||
      assignment?.professional_name ||
      "N/A"
    }
  />

  <DetailRow
    label="Professional ID"
    value={
      professional?.id ||
      professional?.professional_id ||
      assignment?.professional_id ||
      "N/A"
    }
    mono
  />

  <DetailRow
    label="Total Assignments"
    value={
      professional?.total_assignments ??
      assignment?.total_assignments ??
      0
    }
  />

  <DetailRow
    label="Assigned Alphabets"
    value={
      professional?.assigned_alphabets ||
      professional?.assigned_alphabet ||
      "N/A"
    }
  />

  <DetailRow
    label="Active"
    value={
      String(
        professional?.is_active ??
        assignment?.is_active ??
        false
      )
    }
  />
</div>
             
            </section>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock3 size={16} className="text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Timestamps</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailRow label="Assigned" value={assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString() : '—'} />
              <DetailRow label="Created" value={assignment.created_at ? new Date(assignment.created_at).toLocaleString() : '—'} />
              <DetailRow label="Updated" value={assignment.updated_at ? new Date(assignment.updated_at).toLocaleString() : '—'} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignmentDetailsPage
