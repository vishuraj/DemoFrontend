import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

export default function App() {
  const [items, setItems] = useState([])
  const [health, setHealth] = useState('checking')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkHealth()
    fetchItems()
  }, [])

  const checkHealth = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/health`
          : '/health'
      )
      setHealth(res.data.status === 'UP' ? 'up' : 'down')
    } catch {
      setHealth('down')
    }
  }

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API_BASE}/items`)
      setItems(res.data)
    } catch {
      setError('Failed to fetch items.')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API_BASE}/items`, { name, description })
      setName('')
      setDescription('')
      fetchItems()
    } catch {
      setError('Failed to create item.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/items/${id}`)
      fetchItems()
    } catch {
      setError('Failed to delete item.')
    }
  }

  return (
    <div className="container">
      <h1>Demo App</h1>
      <p className="subtitle">Spring Boot + PostgreSQL + React — DevOps Demo</p>

      <div className={`health-badge ${health}`}>
        Backend: {health === 'checking' ? 'Checking...' : health === 'up' ? 'UP' : 'DOWN'}
      </div>

      <div className="card">
        <h2>Add Item</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <input
              placeholder="Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </form>
      </div>

      <div className="card">
        <h2>Items ({items.length})</h2>
        {items.length === 0 ? (
          <p className="empty">No items yet. Add one above.</p>
        ) : (
          <ul className="items-list">
            {items.map(item => (
              <li key={item.id} className="item-row">
                <div className="item-info">
                  <strong>#{item.id} — {item.name}</strong>
                  {item.description && <span>{item.description}</span>}
                </div>
                <button className="btn-danger" onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
