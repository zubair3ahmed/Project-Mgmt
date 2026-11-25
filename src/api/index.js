import { request, tokenStore } from './client'

// One resource per REST collection in docs/openapi.yaml.
const resource = path => ({
  list: query => request('GET', `/${path}`, { query }),
  get: id => request('GET', `/${path}/${id}`),
  create: body => request('POST', `/${path}`, { body }),
  update: (id, body) => request('PATCH', `/${path}/${id}`, { body }),
  remove: id => request('DELETE', `/${path}/${id}`),
})

export const api = {
  auth: {
    // as: 'admin' | 'member' (the tab used on the sign-in page)
    login: async ({ email, password, as }) => {
      const res = await request('POST', '/auth/login', { body: { email, password, as } })
      tokenStore.set(res.token)
      return res.user
    },
    me: () => request('GET', '/auth/me'),
    logout: async () => {
      await request('POST', '/auth/logout').catch(() => {})
      tokenStore.clear()
    },
  },
  staff: resource('staff'),
  clients: resource('clients'),
  projects: {
    ...resource('projects'),
    setStage: (id, stageId) => request('PATCH', `/projects/${id}/stage`, { body: { currentStage: stageId } }),
  },
  projectStages: { list: () => request('GET', '/project-stages') },
  tasks: {
    ...resource('tasks'),
    comments: {
      list: taskId => request('GET', `/tasks/${taskId}/comments`),
      add: (taskId, text) => request('POST', `/tasks/${taskId}/comments`, { body: { text } }),
    },
    attachments: {
      list: taskId => request('GET', `/tasks/${taskId}/attachments`),
      upload: (taskId, files) => {
        const form = new FormData()
        Array.from(files).forEach(f => form.append('files', f))
        return request('POST', `/tasks/${taskId}/attachments`, { form })
      },
    },
  },
  comments: {
    update: (id, text) => request('PATCH', `/comments/${id}`, { body: { text } }),
    remove: id => request('DELETE', `/comments/${id}`),
  },
  attachments: { remove: id => request('DELETE', `/attachments/${id}`) },
  timeLogs: resource('time-logs'),
  milestones: resource('milestones'),
  files: resource('files'),
  activities: { list: query => request('GET', '/activities', { query }) },
  users: resource('users'),
  uploads: {
    upload: files => {
      const form = new FormData()
      Array.from(files).forEach(f => form.append('files', f))
      return request('POST', '/uploads', { form })
    },
  },
  search: q => request('GET', '/search', { query: { q } }),
  reports: {
    projects: () => request('GET', '/reports/projects'),
    staff: () => request('GET', '/reports/staff'),
  },
}

export { isRemote, ApiError } from './client'
