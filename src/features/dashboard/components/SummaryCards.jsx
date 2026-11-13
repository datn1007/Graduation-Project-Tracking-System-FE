import React from 'react'
import { ClipboardList, Gauge, Send, TriangleAlert } from 'lucide-react'
import { StatCard } from '../../../components/ui/Misc'

const pct = (value) => (value === null || value === undefined ? '—' : `${Math.round(Number(value) * 10) / 10}%`)

// KPI tiles of GET /dashboard/summary.
const SummaryCards = ({ summary }) => (
  <div className="grid grid-4">
    <StatCard icon={ClipboardList} label="Đồ án" value={summary.totalProjects} hint={`${summary.inProgressProjects} đang thực hiện · ${summary.completedProjects} hoàn thành · ${summary.totalStudents} SV`} />
    <StatCard icon={Gauge} label="Hoàn thành trung bình" value={pct(summary.averageCompletionPercent)} tone="info" />
    <StatCard icon={TriangleAlert} label="Nhóm chậm / có nguy cơ" value={summary.atRiskProjects} tone="danger" />
    <StatCard icon={Send} label="Nộp đúng hạn" value={pct(summary.onTimeSubmissionPercent)} tone="success" hint={`${summary.lateSubmissions}/${summary.totalSubmissions} bài nộp trễ`} />
  </div>
)

export default SummaryCards
