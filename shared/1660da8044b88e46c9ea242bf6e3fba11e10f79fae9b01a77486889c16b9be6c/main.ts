import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Notifications, notifications } from '/subject/packages/@mantine/notifications/src/index.ts'
import { MantineProvider } from '/subject/packages/@mantine/core/src/index.ts'

function App() {
  useEffect(() => {
    notifications.show({ id: 'hover-prevent-close', message: 'Hover me to pause autoClose' })
  }, [])
  return React.createElement(
    MantineProvider,
    null,
    React.createElement(Notifications, {
      autoClose: 3000,
      withinPortal: false,
      transitionDuration: 0,
      position: 'top-right',
    }),
  )
}

createRoot(document.getElementById('app')).render(React.createElement(App))
