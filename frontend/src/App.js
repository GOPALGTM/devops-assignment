import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Wrong API base URL - connection issue
const API_BASE_URL = 'http://localhost:3001'; 

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/todos`);
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      alert('Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/todos`, {
        text: newTodo
      });
      setTodos([...todos, response.data]);
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
      alert('Failed to add todo');
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/todos/${id}`, {
        completed: !completed
      });
      setTodos(todos.map(todo => 
        todo.id === id ? response.data : todo
      ));
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('Failed to update todo');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/todos/${id}`);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete todo');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        DevOps Assignment - Todo App
      </h1>
      
      <form onSubmit={addTodo} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo..."
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px' 
            }}
          />
          <button 
            type="submit"
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Todo
          </button>
        </div>
      </form>

      {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}

      <div>
        {todos.map(todo => (
          <div 
            key={todo.id} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px', 
              border: '1px solid #eee', 
              marginBottom: '10px',
              borderRadius: '4px',
              backgroundColor: todo.completed ? '#f8f9fa' : 'white'
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, todo.completed)}
              style={{ marginRight: '10px' }}
            />
            <span 
              style={{ 
                flex: 1, 
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? '#6c757d' : 'black'
              }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              style={{ 
                padding: '5px 10px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {todos.length === 0 && !loading && (
        <p style={{ textAlign: 'center', color: '#6c757d' }}>
          No todos yet. Add one above!
        </p>
      )}
    </div>
  );
}

export default App;
