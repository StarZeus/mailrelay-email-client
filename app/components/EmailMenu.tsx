export const EmailMenu = () => {
  return (
    <nav className="flex h-full flex-col p-4">
      <div className="space-y-2">
        <button className="w-full rounded-lg bg-blue-100 p-2 text-left text-blue-600">
          Inbox
        </button>
        <button className="w-full rounded-lg p-2 text-left hover:bg-gray-100">
          Sent
        </button>
        <button className="w-full rounded-lg p-2 text-left hover:bg-gray-100">
          Drafts
        </button>
        <button className="w-full rounded-lg p-2 text-left hover:bg-gray-100">
          Trash
        </button>
      </div>
    </nav>
  )
} 