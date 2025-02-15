'use client'

interface EmailLayoutProps {
  menu: React.ReactNode
  list: React.ReactNode
  content: React.ReactNode
}

export const EmailLayout = ({ menu, list, content }: EmailLayoutProps) => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Menu Pane */}
      <div className="w-64 border-r border-gray-200 bg-gray-50">
        {menu}
      </div>

      {/* Middle List Pane */}
      <div className="w-96 border-r border-gray-200">
        {list}
      </div>

      {/* Right Content Pane */}
      <div className="flex-1 overflow-auto">
        {content}
      </div>
    </div>
  )
} 