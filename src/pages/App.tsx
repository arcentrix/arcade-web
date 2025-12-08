import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import AuthGuard from '@/components/Layouts/AuthGuard'
import DefaultLayouts from '@/components/Layouts/default'
import SidebarLayoutWrapper from '@/components/Layouts/sidebar-layout'
import Login from './Login'
import Register from './Register'
import Dashboard from './Dashboard'
import Playground from './Playground'
import Models from './Models'
import Documentation from './Documentation'
import API from './API'
import Identity from './Identity'
import Users from './Users'
import Roles from './Roles'
import Settings from './Settings'
import GeneralSettings from './GeneralSettings'
import { AuthCallback } from './AuthCallback'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<DefaultLayouts />}>
            <Route element={<AuthGuard />}>
              <Route element={<SidebarLayoutWrapper />}>
                <Route element={<Dashboard />} index path='/' />
                <Route element={<Playground />} path='/playground' />
                <Route element={<Models />} path='/models' />
                <Route element={<Documentation />} path='/documentation' />
                <Route element={<API />} path='/api' />
                <Route element={<Users />} path='/users' />
                <Route element={<Roles />} path='/roles' />
                <Route element={<Identity />} path='/identity-integration' />
                <Route element={<Settings />} path='/settings' />
                <Route element={<GeneralSettings />} path='/general-settings' />
              </Route>
            </Route>
            <Route element={<Login />} path='/login' />
            <Route element={<Register />} path='/register' />
            <Route element={<AuthCallback />} path='/auth/callback/:type' />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer
        position='top-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='light'
        icon={false}
        toastClassName='border rounded-lg shadow-lg text-sm'
      />
    </>
  )
}

export default App
