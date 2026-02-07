// Authentication helper functions
// You can import these in any component that needs auth info

export const getToken = () => {
  return localStorage.getItem('token')
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const isAuthenticated = () => {
  return !!getToken()
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getUserRole = () => {
  const user = getUser()
  return user ? user.role : null
}

export const getUserName = () => {
  const user = getUser()
  return user ? `${user.firstName} ${user.lastName}` : null
}
