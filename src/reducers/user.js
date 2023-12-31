import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	authUser: {
		email: null,
		fullname: null,
		status: null,
		birthday: null,
		imageUrl: null,
		backgroundMusic: null,
		soundEffect: null,
		token: null,
	},
}

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		setUser: (state, action) => {
			state.authUser = action.payload
		},
		setStatus: (state, action) => {
			state.authUser.status = action.payload
		},
		setUserImageUrl:(state, action) => {
			state.authUser.imageUrl = action.payload
		}
	},
})

export default userSlice.reducer
export const { setUser, setStatus, setToken, setUserImageUrl } = userSlice.actions
