interface EmailContentProps {
  email?: {
    id: string
    subject: string
    sender: string
    content: string
    date: string
  }
}

export const EmailContent = ({ email }: EmailContentProps) => {
  if (!email) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Select an email to read
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{email.subject}</h1>
      <div className="mt-4 text-sm text-gray-600">
        From: {email.sender}
        <br />
        Date: {email.date}
      </div>
      <div className="mt-6 whitespace-pre-wrap">{email.content}</div>
    </div>
  )
} 