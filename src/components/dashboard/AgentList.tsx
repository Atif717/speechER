import { useEffect, useState } from 'react';

interface Agent {
  _id: string;
  name: string;
  email: string;
  status: string;
}

interface AgentListProps {
  createdBy: string;
}

export default function AgentList({ createdBy }: AgentListProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<null | Agent>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // Fetch agents for this admin
  const fetchAgents = () => {
    fetch(`http://localhost:5000/api/agents?createdBy=${createdBy}`)
      .then(res => res.json())
      .then(setAgents);
  };

  useEffect(() => {
    fetchAgents();
  }, [createdBy]);

  // Add agent
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, createdBy }),
    });
    setShowAdd(false);
    setForm({ name: '', email: '', password: '' });
    fetchAgents();
  };

  // Edit agent
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`http://localhost:5000/api/agents/${showEdit!._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowEdit(null);
    setForm({ name: '', email: '', password: '' });
    fetchAgents();
  };

  // Delete agent
  const handleDelete = async (id: string) => {
    await fetch(`http://localhost:5000/api/agents/${id}`, { method: 'DELETE' });
    fetchAgents();
  };

  return (
    <div>
      <button
        onClick={() => setShowAdd(true)}
        className="mb-4 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold shadow transition"
      >
        + Add Agent
      </button>
      <div className="overflow-x-auto rounded-lg bg-white/10">
        <table className="min-w-full text-left">
          <thead>
            <tr>
              <th className="p-4 font-semibold text-white">Name</th>
              <th className="p-4 font-semibold text-white">Email</th>
              <th className="p-4 font-semibold text-white">Status</th>
              <th className="p-4 font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(agent => (
              <tr key={agent._id} className="hover:bg-cyan-50/20 transition">
                <td className="p-4 font-medium text-white">{agent.name}</td>
                <td className="p-4 text-white/80">{agent.email}</td>
                <td className="p-4 text-white/70">{agent.status}</td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => {
                      setShowEdit(agent);
                      setForm({ name: agent.name, email: agent.email, password: '' });
                    }}
                    className="bg-blue-100 text-blue-700 px-4 py-1 rounded hover:bg-blue-200 transition font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(agent._id)}
                    className="bg-red-100 text-red-700 px-4 py-1 rounded hover:bg-red-200 transition font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Agent Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in transition-all"
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowAdd(false)}
              type="button"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Agent</h2>
            <input
              className="mb-4 w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-gray-50 text-gray-800 transition"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <input
              className="mb-4 w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-gray-50 text-gray-800 transition"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <input
              className="mb-6 w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-gray-50 text-gray-800 transition"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold shadow transition"
              >
                Add
              </button>
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={handleEdit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in transition-all"
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowEdit(null)}
              type="button"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Agent</h2>
            <input
              className="mb-4 w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-gray-50 text-gray-800 transition"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <input
              className="mb-4 w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-gray-50 text-gray-800 transition"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <input
              className="mb-6 w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 bg-gray-50 text-gray-800 transition"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow transition"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition"
                onClick={() => setShowEdit(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}