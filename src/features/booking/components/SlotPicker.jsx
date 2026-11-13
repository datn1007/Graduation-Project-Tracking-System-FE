import React, { useMemo } from 'react'
import { dayKey, formatTimeRange, formatWeekday } from '../../../utils/format'
import '../booking.scss'

// Groups SlotResponse[] by Vietnam-time day and renders OPEN slots as selectable time buttons.
const SlotPicker = ({ slots, selectedId, onSelect, disabled }) => {
  const days = useMemo(() => {
    const groups = new Map()
    for (const slot of slots) {
      const key = dayKey(slot.startAt)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(slot)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [slots])

  return (
    <div className="slot-picker">
      {days.map(([key, daySlots]) => (
        <div className="slot-day" key={key}>
          <div className="slot-day__label">
            <span className="slot-day__weekday">{formatWeekday(daySlots[0].startAt)}</span>
            <span className="text-muted text-small">{daySlots.length} khung giờ</span>
          </div>
          <div className="slot-day__slots" role="group" aria-label={formatWeekday(daySlots[0].startAt)}>
            {daySlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`slot-btn ${selectedId === slot.id ? 'is-selected' : ''}`}
                aria-pressed={selectedId === slot.id}
                disabled={disabled || slot.status !== 'OPEN'}
                onClick={() => onSelect(slot)}
                title={[slot.location, slot.meetingUrl ? 'Online' : null].filter(Boolean).join(' · ') || undefined}
              >
                {formatTimeRange(slot.startAt, slot.endAt)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SlotPicker
