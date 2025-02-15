interface Email {
  id: string
  subject: string
  sender: string
  preview: string
  date: string
  read: boolean
}

interface EmailListProps {
  emails: Email[]
  selectedId?: string
  onSelectEmail: (id: string) => void
}

export const EmailList = ({ emails, selectedId, onSelectEmail }: EmailListProps) => {
  return (
    <div className="h-full overflow-auto">
      {emails.map((email) => (
        <button
          key={email.id}
          onClick={() => onSelectEmail(email.id)}
          className={`w-full border-b border-gray-200 p-4 text-left hover:bg-gray-50 ${
            selectedId === email.id ? 'bg-blue-50' : ''
          } ${!email.read ? 'font-semibold' : ''}`}
        >
          <div className="text-sm font-medium">{email.sender}</div>
          <div className="text-sm">{email.subject}</div>
          <div className="mt-1 text-xs text-gray-500">
            <span>{email.preview}</span>
            <span className="ml-2">{email.date}</span>
          </div>
        </button>
      ))}
    </div>
  )
} 