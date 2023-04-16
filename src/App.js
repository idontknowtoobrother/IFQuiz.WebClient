import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import Navbar from './Components/Navbar'
import Welcome from './Pages/Welcome/Welcome'
import Login from './Pages/Login/Login'
import Signup from './Pages/Signup/Signup'
import Register from './Pages/Register/Register'
import LoginEmail from './Pages/LoginEmail/LoginEmail'
import CreateQuiz from './Pages/CreateQuiz/CreateQuiz'
import Home from './Pages/Home/Home'
import EditUserProfile from './Pages/EditUserProfile/EditUserProfile'

import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'

function App() {
	const isAuthenticated = useSelector((state) => state.user.authUser) === null ? false : true

	return (
		<div className="App">
			<Navbar />
			<Routes>
				<Route path="/" element={<Welcome />} />
				<Route path="/Login" element={<Login />} />
				<Route path="/Signup" element={<Signup />} />
				<Route path="/Register" element={<Register />} />
				<Route path="/LoginEmail" element={<LoginEmail />} />
				<Route path="/CreateQuiz" element={<CreateQuiz />} />
				<Route path="/Home" element={isAuthenticated ? <Home /> : <Navigate to="/Login" />} />
				<Route path="/EditUserProfile" element={isAuthenticated ? <EditUserProfile /> : <Navigate to="Login" />} />
			</Routes>
		</div>
	)
}

export default App
