import { useEffect, useState } from 'react'
import { getHello } from './api'

export function App() {
  const [message, setMessage] = useState('Hello World')

  useEffect(() => {
    getHello()
      .then((response) => setMessage(response.message))
      .catch(() => setMessage('Hello World'))
  }, [])

  return <h1>{message}</h1>
}
