import { useState } from 'react'
import Modal from './Modal'
import { FormField, Input, Button } from './FormField'
import useStore from '../store/useStore'

const EMPTY = { name: '', contact: '', email: '', phone: '' }

export default function AddClientModal({ open, onClose }) {
  const addClient = useStore(s => s.addClient)
  const [form, setForm] = useState(EMPTY)
  const field = key => ({ value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })) })

  function submit(e) {
    e.preventDefault()
    addClient(form)
    setForm(EMPTY)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Client">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Company Name" required><Input {...field('name')} required placeholder="e.g. Prestige Constructions" /></FormField>
        <FormField label="Contact Person" required><Input {...field('contact')} required placeholder="e.g. Rajesh Gupta" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email"><Input type="email" {...field('email')} placeholder="name@company.com" /></FormField>
          <FormField label="Phone"><Input {...field('phone')} placeholder="+91 98000 00000" /></FormField>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Client</Button>
        </div>
      </form>
    </Modal>
  )
}
